/**
 * 托管会话的审批：unterm 的 approval.requested 事件 → 收件箱里的一条审批。
 *
 * 托管会话（agent_session 带 hosted）里，agent 每次要执行需要授权的工具都会
 * 停下来问；unterm 的 GET /api/agent/approvals 列出所有还在等答复的问题。
 * 这里把它们换成控制台的 ApprovalItem，让它们和其它审批走同一个收件箱、
 * 同一套批准 / 拒绝流程。
 *
 * 纯函数，不碰网络和 DOM：provider-live 负责取数据，页面负责轮询。
 */

import { t } from "../i18n";
import { Terminal } from "lucide-react";
import type { ApprovalItem, ApprovalRisk } from "../types";
import { commitIntent, commitLine } from "./conversation";
import type { RuntimeCommit } from "./runtime-tasks";

/** unterm 返回的一条：approval.requested 事件原样，加 session_id 和 adapter。 */
export type RawAgentApproval = {
  session_id: string;
  adapter?: string;
  at?: string;
  task_id?: string;
  approval: {
    request_id: string;
    description?: string;
    tool_call: { tool: string; arguments?: unknown };
    commit?: RuntimeCommit | null;
    repeat?: boolean | null;
    review?: { state: string; reason?: string | null } | null;
  };
};

const PREFIX = "agent:";

/** 收件箱里的 id。带前缀，和本地审批的 id 不会撞，也能反解出会话和请求。 */
export function agentApprovalId(sessionId: string, requestId: string): string {
  return `${PREFIX}${sessionId}:${requestId}`;
}

export function isAgentApprovalId(id: string): boolean {
  return id.startsWith(PREFIX);
}

/**
 * 外部 AI 客户端（Claude 桌面版、Cursor…）经 Unzoo One 终端要写入时的确认：
 * unterm 的 pending_input_confirmations 里的一条。没有终端窗口时由控制台来答。
 */
export type RawInputConfirmation = {
  id: number;
  request_id: string;
  agent: string;
  method: string;
  input_preview: string;
  risk: string;
  requested_at?: string;
  state?: string;
};

/** 外部客户端确认在收件箱里的“会话”名：不是 ags_ 开头，不会和托管会话撞。 */
export const CONFIRMATION_SESSION = "cfm";

const CLIENT_LABEL: Record<string, string> = {
  "claude-ai": "Claude Desktop",
  "claude-desktop": "Claude Desktop",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  "cursor-vscode": "Cursor",
  codex: "Codex",
  "codex-mcp-client": "Codex",
  windsurf: "Windsurf",
  gemini: "Gemini CLI",
  "gemini-cli-mcp-client": "Gemini CLI",
  opencode: "OpenCode",
};

export function clientLabel(agent: string): string {
  const key = agent.trim().toLowerCase();
  return CLIENT_LABEL[key] ?? (agent.trim() || t("外部客户端"));
}

/** 外部客户端的一条写入确认 → 收件箱里的一条审批。 */
export function confirmationToApprovalItem(raw: RawInputConfirmation, now: number = Date.now()): ApprovalItem {
  const agent = clientLabel(raw.agent);
  const destructive = raw.risk === "destructive";
  const typing = /^(exec\.|session\.input|session\.paste)/.test(raw.method);
  const action = typing
    ? t("在终端里执行")
    : destructive
      ? t("执行无法撤销的操作")
      : raw.risk === "external_side_effect"
        ? t("把东西发出这台电脑")
        : raw.risk === "credential_access"
          ? t("读取你的账号或密钥")
          : raw.risk === "financial"
            ? t("花钱")
            : t("使用终端的 {method}", { method: raw.method });
  const target = raw.input_preview?.trim() || raw.method;
  return {
    id: agentApprovalId(CONFIRMATION_SESSION, String(raw.id)),
    taskId: "",
    title: t("{agent} 请求{action}", { agent, action }),
    reason: t("{agent} 通过 Unzoo One 的终端要做这件事，做之前需要你确认。", { agent }),
    impact: t("批准后会在本机执行：{target}", { target }),
    action,
    target,
    scope: t("仅本次调用"),
    risk: destructive || raw.risk === "credential_access" || raw.risk === "financial" ? "高风险" : "中风险",
    requestedAt: relativeLabel(raw.requested_at, now),
    expiresAt: t("约 2 分钟内不答复就不执行"),
    policy: t("外部客户端：写入终端前询问"),
    icon: Terminal,
  };
}

/** 反解 id。会话 id 是 `ags_` 加十六进制，不含冒号；请求 id 可能含，所以只切第一个。 */
export function parseAgentApprovalId(id: string): { sessionId: string; requestId: string } | null {
  if (!isAgentApprovalId(id)) return null;
  const rest = id.slice(PREFIX.length);
  const cut = rest.indexOf(":");
  if (cut <= 0 || cut === rest.length - 1) return null;
  return { sessionId: rest.slice(0, cut), requestId: rest.slice(cut + 1) };
}

const AGENT_LABEL: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex",
  opencode: "OpenCode",
  agy: "Antigravity",
};

const SHELL_TOOLS = new Set(["bash", "powershell", "shell", "run_command", "execute", "exec_command"]);
const EDIT_TOOLS = new Set(["write", "edit", "multiedit", "notebookedit", "apply_patch", "write_file", "edit_file"]);

type Kind = "shell" | "edit" | "permissions" | "other";

function kindOf(tool: string): Kind {
  const name = tool.toLowerCase();
  if (SHELL_TOOLS.has(name)) return "shell";
  if (EDIT_TOOLS.has(name)) return "edit";
  if (name === "permissions") return "permissions";
  return "other";
}

/** `mcp__<server>__<method>`：智能体经 MCP 调的工具（受管模式下就是 Unzoo One 的终端和浏览器）。 */
export function mcpToolOf(tool: string): { server: string; method: string } | null {
  const match = /^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/.exec(tool);
  return match ? { server: match[1], method: match[2] } : null;
}

/**
 * 一次 MCP 调用用人话说是什么。Unzoo One 自己的终端（unterm）和浏览器（unzoo）
 * 认得出来；别的服务器的说"使用某某的某某"。
 */
function describeMcp(server: string, method: string): { kind: Kind; action: string; tool: string } {
  const name = method.toLowerCase();
  if (server === "unterm") {
    const tool = t("Unzoo One 终端");
    if (/^(session_create|session_split|tab_create|workspace_open)/.test(name)) return { kind: "other", action: t("打开一个终端"), tool };
    if (/^(exec_|session_input|session_send|session_paste|keys_send|input_)/.test(name)) return { kind: "shell", action: t("执行命令"), tool };
    if (/^(fs_write|fs_edit|file_write|file_edit|fs_delete|fs_move)/.test(name)) return { kind: "edit", action: t("修改文件"), tool };
    if (/^(session_close|session_kill|session_destroy|process_kill)/.test(name)) return { kind: "shell", action: t("关闭终端或进程"), tool };
    if (/(read|list|get|status|screen|snapshot|search|find)/.test(name)) return { kind: "other", action: t("查看终端内容"), tool };
    return { kind: "other", action: t("使用终端的 {method}", { method }), tool };
  }
  if (server === "unzoo") {
    const tool = t("Unzoo 浏览器");
    if (/^(browser_navigate|tab_create)/.test(name)) return { kind: "other", action: t("打开网页"), tool };
    if (/^(browser_(click|type|fill|select|press|drag|upload|set_input)|page_(click|type|select|batch)|human_|form_)/.test(name))
      return { kind: "edit", action: t("在网页上操作"), tool };
    if (/^(download|media_download|ytdlp)/.test(name)) return { kind: "edit", action: t("下载文件"), tool };
    if (/^(cookie_(set|delete|import)|session_clear)/.test(name)) return { kind: "permissions", action: t("修改浏览器登录状态"), tool };
    return { kind: "other", action: t("读取网页"), tool };
  }
  return { kind: "other", action: t("使用 {server} 的 {method}", { server, method }), tool: `${server} · ${method}` };
}

/** 要做的那件事，一行字：命令本身、文件路径，否则参数的 JSON。 */
function targetOf(args: unknown): string {
  if (args && typeof args === "object") {
    const record = args as Record<string, unknown>;
    for (const key of ["command", "CommandLine", "cmd", "text", "file_path", "path", "url", "cwd"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  if (args === undefined || args === null) return t("（未提供参数）");
  const text = JSON.stringify(args);
  if (text === "{}") return t("（未提供参数）");
  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}

function relativeLabel(at: string | undefined, now: number): string {
  const time = at ? Date.parse(at) : NaN;
  if (Number.isNaN(time)) return t("刚刚");
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return t("刚刚");
  if (minutes < 60) return t("{minutes} 分钟前", { minutes });
  return t("{floor} 小时前", { floor: Math.floor(minutes / 60) });
}

export function toApprovalItem(raw: RawAgentApproval, now: number = Date.now()): ApprovalItem {
  const rawTool = raw.approval.tool_call.tool;
  const agent = AGENT_LABEL[raw.adapter ?? ""] ?? raw.adapter ?? "Agent";
  const mcp = mcpToolOf(rawTool);
  const described = mcp ? describeMcp(mcp.server, mcp.method) : null;
  const tool = described?.tool ?? rawTool;
  const kind = described?.kind ?? kindOf(rawTool);
  const action =
    described?.action ??
    (kind === "shell" ? t("执行命令") : kind === "edit" ? t("修改文件") : kind === "permissions" ? t("授予权限") : t("调用 {tool}", { tool }));
  // 执行命令和改文件都会改变本机状态；授予权限会放宽之后的所有调用，单列高风险。
  const risk: ApprovalRisk = kind === "permissions" ? "高风险" : kind === "other" ? "低风险" : "中风险";
  const target = targetOf(raw.approval.tool_call.arguments);
  const commit = raw.approval.commit;
  if (commit) {
    // 发送、发布、付款、删除：说清它要点的是什么，加上审核员的理由。
    const line = commitLine(commit);
    const review = raw.approval.review;
    const reason = raw.approval.repeat
      ? t("同样的提交这次已经做过一次，可能已经发出去了。")
      : review?.state === "ask" && review.reason
        ? t("审核员：{reason}", { reason: review.reason })
        : review?.state === "running"
          ? t("审核员正在核对这是不是你要它做的……")
          : commitIntent(commit);
    return {
      id: agentApprovalId(raw.session_id, raw.approval.request_id),
      taskId: raw.task_id ?? "",
      title: t("{agent} 请求{action}", { agent, action: line }),
      reason,
      impact: t("批准后会{action}", { action: line }),
      action: line,
      target: line,
      scope: t("仅本次调用"),
      risk: "高风险",
      requestedAt: relativeLabel(raw.at, now),
      expiresAt: t("会话关闭时自动拒绝"),
      policy: t("托管会话：执行前询问"),
      icon: Terminal,
    };
  }
  return {
    id: agentApprovalId(raw.session_id, raw.approval.request_id),
    taskId: raw.task_id ?? "",
    title: t("{agent} 请求{action}", { agent, action }),
    reason: raw.approval.description?.trim() || t("{agent} 在托管会话中要使用 {tool}，执行前需要你确认。", { agent, tool }),
    impact: kind === "shell" ? t("批准后会在本机执行：{target}", { target }) : t("批准后 {agent} 会使用 {tool}：{target}", { agent, tool, target }),
    action,
    target,
    // 只答复这一次调用，不授予更大范围：和 contracts 的 allow_once 一致。
    scope: t("仅本次调用"),
    risk,
    requestedAt: relativeLabel(raw.at, now),
    expiresAt: t("会话关闭时自动拒绝"),
    policy: t("托管会话：执行前询问"),
    icon: Terminal,
  };
}

/**
 * 把轮询到的托管审批合进当前队列。
 *
 * 本地审批一条不动；托管审批以 unterm 为准：还在等的留着（保持原来的位置），
 * 新来的追加到末尾，已经不在 unterm 那边的（答复了、会话关了）去掉。
 * 没有变化时返回原数组，免得每次轮询都触发一次重渲染。
 */
export function reconcileAgentApprovals(items: ApprovalItem[], live: ApprovalItem[]): ApprovalItem[] {
  const liveIds = new Set(live.map((item) => item.id));
  const kept = items.filter((item) => !isAgentApprovalId(item.id) || liveIds.has(item.id));
  const present = new Set(kept.map((item) => item.id));
  const added = live.filter((item) => !present.has(item.id));
  if (added.length === 0 && kept.length === items.length) return items;
  return [...kept, ...added];
}
