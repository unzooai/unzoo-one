/**
 * 对话页用的纯函数：任务 → 对话列表的状态和顺序，运行时整理好的一轮 →
 * 界面上的一行行动作、等你确认的问题、回答的段落。
 *
 * 装好的产品里，一个任务就是一段对话：每次运行是一轮，第一轮的话是需求，
 * 之后每一句是追问（接着同一个 CLI 会话说）。
 */

import type { TaskItem } from "../types";
import { t } from "../i18n";
import type { RuntimeActivity, RuntimeCommit, RuntimeHelper, RuntimeTurn } from "./runtime-tasks";

/** 提交类动作说成一句话：点哪个按钮、发出什么、在哪个网站。 */
export function commitLine(commit: RuntimeCommit): string {
  const site = commit.site?.trim();
  const line = (() => {
    switch (commit.kind) {
      case "click":
        return t("点击「{label}」", { label: commit.label ?? "" });
      case "enter":
        return t("在「{field}」里按回车，发出：{text}", { field: commit.label ?? "", text: commit.text ?? "" });
      case "form":
        return t("填好表单并提交");
      default:
        return t("运行一段会点击或提交的脚本");
    }
  })();
  return site ? t("{action}（{site}）", { action: line, site }) : line;
}

/** 提交类动作问你时，标题说它要做的是哪种后果。 */
export function commitIntent(commit: RuntimeCommit): string {
  if (commit.risk === "financial") return t("它要付款或下单");
  if (commit.risk === "destructive") return t("它要删除东西");
  return t("它要发出或提交内容");
}

export type ConversationStatus = "running" | "waiting" | "failed" | "done" | "scheduled" | "idle";

/** 列表里这段对话现在的样子。 */
export function conversationStatus(task: TaskItem): ConversationStatus {
  const latest = task.runs?.[0];
  if (task.status === "运行中" || latest?.status === "运行中") {
    return latest?.waiting ? "waiting" : "running";
  }
  if (task.status === "失败" || latest?.status === "失败") return "failed";
  if (task.schedule && task.schedule !== "仅运行一次" && task.status !== "已暂停") return "scheduled";
  if (latest?.status === "成功" || task.status === "已完成") return "done";
  return "idle";
}

export function conversationStatusLabel(status: ConversationStatus): string {
  switch (status) {
    case "running":
      return t("正在做");
    case "waiting":
      return t("等你确认");
    case "failed":
      return t("出错了");
    case "done":
      return t("完成");
    case "scheduled":
      return t("定时");
    default:
      return t("未开始");
  }
}

/** 最近一次动静：最新一轮开始的时间，没有就用任务自己的。 */
export function lastActivityAt(task: TaskItem): number {
  const at = Date.parse(task.runs?.[0]?.startedAt ?? "");
  if (!Number.isNaN(at)) return at;
  const fromId = /^task-(\d{10,})/.exec(task.id)?.[1];
  return fromId ? Number(fromId) : 0;
}

const statusRank: Record<ConversationStatus, number> = {
  waiting: 0,
  running: 1,
  failed: 2,
  scheduled: 3,
  done: 3,
  idle: 3,
};

/** 等你确认的、正在做的在前，其余按最近动静。 */
export function sortConversations(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const rank = statusRank[conversationStatus(a)] - statusRank[conversationStatus(b)];
    if (rank !== 0) return rank;
    return lastActivityAt(b) - lastActivityAt(a);
  });
}

/** 这一轮还在进行吗。 */
export function turnLive(turn: Pick<RuntimeTurn, "state">): boolean {
  return turn.state === "running" || turn.state === "pending";
}

/** 这一轮里还在等人答的问题：问了、没人答，而且这一轮还在跑。 */
export function pendingQuestions(turn: RuntimeTurn): RuntimeActivity[] {
  if (!turnLive(turn)) return [];
  return turn.activity.filter((item) => item.request_id && !item.decided_by);
}

/** 帮手还在等人答的问题，答的时候要用帮手自己的会话。 */
export function helperQuestions(turn: RuntimeTurn, helper: RuntimeHelper): RuntimeActivity[] {
  if (!turnLive(turn) || helper.state === "done" || helper.state === "failed" || helper.state === "stopped") return [];
  return (helper.activity ?? []).filter((item) => item.request_id && !item.decided_by);
}

/** 整段对话里智能体（和它的帮手）用过的终端和标签页，按第一次用到的先后。 */
export function computerOf(
  turns: (Pick<RuntimeTurn, "terminals" | "tabs"> & { helpers?: RuntimeHelper[] | null })[],
): { terminals: string[]; tabs: string[] } {
  const terminals: string[] = [];
  const tabs: string[] = [];
  const add = (from: { terminals?: string[] | null; tabs?: string[] | null }) => {
    for (const id of from.terminals ?? []) if (!terminals.includes(id)) terminals.push(id);
    for (const id of from.tabs ?? []) if (!tabs.includes(id)) tabs.push(id);
  };
  for (const turn of turns) {
    add(turn);
    for (const helper of turn.helpers ?? []) add(helper);
  }
  return { terminals, tabs };
}

/** 帮手的名字：产品名，不是命令名。 */
export function helperName(agent: string): string {
  const id = agent.trim().toLowerCase();
  if (id === "codex-cli" || id === "codex") return "Codex";
  if (id === "claude-code" || id === "claude") return "Claude Code";
  if (id === "opencode") return "OpenCode";
  if (id === "agy" || id === "antigravity") return "Antigravity";
  return agent;
}

/** 帮手现在怎样。 */
export function helperStateLabel(state: RuntimeHelper["state"]): string {
  switch (state) {
    case "waiting":
      return t("等你确认");
    case "done":
      return t("做完了");
    case "failed":
      return t("出错了");
    case "stopped":
      return t("已停下");
    default:
      return t("正在做");
  }
}

/** 终端画面去掉末尾的空行（屏幕下半截常常是空的）。 */
export function trimScreen(lines: string[]): string[] {
  let end = lines.length;
  while (end > 0 && !lines[end - 1].trim()) end--;
  return lines.slice(0, end).map((line) => line.replace(/\s+$/, ""));
}

/** 一件事，一行字。 */
export function activityLine(item: RuntimeActivity): string {
  const target = item.target?.trim() ?? "";
  switch (item.verb) {
    case "run":
      return target ? t("运行 {target}", { target }) : t("运行了一条命令");
    case "read":
      return target ? t("查看 {target}", { target }) : t("查看了文件");
    case "search":
      return target ? t("搜索 {target}", { target }) : t("搜索了一下");
    case "edit":
      return target ? t("写入 {target}", { target }) : t("改了文件");
    case "delete":
      return target ? t("删除 {target}", { target }) : t("删除了文件");
    case "terminal":
      return t("打开了一个终端");
    case "watch":
      return t("查看终端输出");
    case "open":
      return target ? t("打开 {target}", { target }) : t("打开了一个网页");
    case "look":
      return t("查看网页内容");
    case "click":
      return t("在网页上点击");
    case "type":
      return t("在网页上输入");
    case "download":
      return target ? t("下载 {target}", { target }) : t("下载了文件");
    case "upload":
      return target ? t("上传 {target}", { target }) : t("上传了文件");
    case "plan":
      return t("更新了计划");
    case "skill":
      return target ? t("用了技能 {target}", { target: target.replace(/^unzoo-one:/, "") }) : t("用了一个技能");
    case "handover":
      return t("请你接手：{what}", { what: target });
    case "delegate": {
      // "codex: 修好测试"，接着等的时候只有会话 id。
      const split = target.indexOf(": ");
      if (split < 0) return t("等帮手做完");
      return t("交给 {agent}：{task}", { agent: helperName(target.slice(0, split)), task: target.slice(split + 2) });
    }
    default:
      return target ? t("使用 {target}", { target }) : t("使用工具 {tool}", { tool: item.tool });
  }
}

/** 问你的时候，它想做的是哪类事（具体的命令、路径另外显示）。 */
export function intentLine(item: RuntimeActivity): string {
  switch (item.verb) {
    case "run":
      return t("它想运行一条命令");
    case "edit":
      return t("它想修改文件");
    case "delete":
      return t("它想删除文件");
    case "terminal":
      return t("它想打开一个终端");
    case "open":
      return t("它想打开一个网页");
    case "click":
    case "type":
      return t("它想在网页上操作");
    case "download":
      return t("它想下载文件");
    case "upload":
      return t("它想上传文件");
    case "read":
    case "search":
    case "look":
    case "watch":
      return t("它想查看内容");
    case "delegate":
      return t("它想把一部分活交给别的智能体");
    default:
      return t("它想使用 {tool}", { tool: item.tool });
  }
}

/** 谁让它做的（或没让）。没问过人、也没被拦，就什么都不说。 */
export function decisionLabel(item: RuntimeActivity): string | null {
  // 智能体自带的“问用户”工具这里没有界面，运行时让它改成在回复里直接问。
  if (item.tool === "AskUserQuestion" && item.decided_by === "unterm") return t("改在回复里问你");
  if (item.decision === "deny") return item.decided_by === "policy" ? t("规则拒绝") : t("已拒绝");
  if (item.decided_by === "reviewer") return t("审核后放行");
  if (item.decided_by === "autonomy") return t("自动");
  if (item.decided_by === "policy") return t("按规则");
  if (item.decided_by === "person") return t("你批准了");
  if (item.request_id) return t("等你确认");
  return null;
}

/** 风险的轻重，给颜色用。 */
export function riskTone(risk: string | null | undefined): "low" | "medium" | "high" {
  if (risk === "destructive" || risk === "credential_access" || risk === "financial") return "high";
  if (risk === "external_side_effect") return "medium";
  return "low";
}

export function riskLabel(risk: string | null | undefined): string {
  switch (risk) {
    case "read":
      return t("只读");
    case "local_mutation":
      return t("改动本机");
    case "exec":
      return t("运行程序");
    case "external_side_effect":
      return t("对外发送");
    case "credential_access":
      return t("读取账号或密钥");
    case "financial":
      return t("涉及付款");
    case "destructive":
      return t("无法撤销");
    default:
      return t("未知操作");
  }
}

/** 折起来时的一句话。 */
export function activitySummary(activity: RuntimeActivity[]): string {
  const denied = activity.filter((item) => item.decision === "deny").length;
  const count = activity.length;
  if (denied > 0) return t("做了 {count} 件事，{denied} 件被拒绝", { count, denied });
  return t("做了 {count} 件事", { count });
}

/** 给新对话的几条示例：每条都要用到终端或浏览器。 */
export function conversationExamples(): string[] {
  return [
    t("打开 news.ycombinator.com，把今天排名前 10 的文章整理成一份带链接的摘要"),
    t("把这个文件夹里的 CSV 合并成一张表，算出每个月的合计，存成 summary.xlsx"),
    t("用 Python 写一个脚本，检查我列的这几个网址是否能打开，把结果写进 report.md"),
    t("每天早上 9 点看一下这几个竞品网站的更新，有变化就告诉我"),
  ];
}

/** 回答里的一块：段落、列表、代码。 */
export type ReplyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "heading"; text: string };

/**
 * 把回答切成段：空行分段，``` 包起来的是代码，- / * / 1. 开头的是列表，
 * # 开头的是小标题。只认这几样，别的原样当文字，不做 HTML。
 */
export function replyBlocks(text: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: "list", ...list });
    list = null;
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      index++;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        code.push(lines[index]);
        index++;
      }
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    const heading = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1].trim() });
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (list) {
      // 列表项的续行。
      const current = list as { ordered: boolean; items: string[] };
      current.items[current.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** 一行文字里的 `代码` 和 **加粗**。 */
export type InlinePiece = { kind: "text" | "code" | "strong"; text: string };

export function inlinePieces(text: string): InlinePiece[] {
  const pieces: InlinePiece[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) pieces.push({ kind: "text", text: text.slice(last, at) });
    const token = match[0];
    pieces.push(
      token.startsWith("`")
        ? { kind: "code", text: token.slice(1, -1) }
        : { kind: "strong", text: token.slice(2, -2) },
    );
    last = at + token.length;
  }
  if (last < text.length) pieces.push({ kind: "text", text: text.slice(last) });
  return pieces;
}
