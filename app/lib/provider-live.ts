/**
 * 真实后端实现。目前只接了能接的那部分，其余委托给传进来的 fallback。
 *
 * 这是 provider 层存在的意义：不改任何组件，把数据源从内存换成本机的
 * unzoo / unterm，能接一块换一块。
 *
 * 边界：
 * - 只在浏览器里生效。SSR 阶段没有同源地址可用，直接走 fallback，
 *   首屏因此始终有数据。
 * - 只在本地运行时能通。控制台部署到云端之后，127.0.0.1 是那台服务器
 *   自己，不是用户的机器。/api/backend-probe 可以确认当前环境。
 * - unterm 还没接：它的 Core 是随机端口（记在 core.json 里），Worker
 *   环境读不到文件。要么 unterm 给个固定入口，要么让用户在设置里填。
 */

import { t } from "../i18n";
import type { ConnectorCheckResult, ConnectorId } from "../types";
import {
  CONFIRMATION_SESSION,
  confirmationToApprovalItem,
  isAgentApprovalId,
  parseAgentApprovalId,
  toApprovalItem,
  type RawAgentApproval,
  type RawInputConfirmation,
} from "./agent-approvals";
import {
  agentForAdapter,
  fromAgentRuleDraft,
  toAgentRule,
  toBrainAgent,
  toBrainEvent,
  type RawAgentRule,
} from "./brain-events";
import { parseAgentRunSettings } from "./agent-run-settings";
import { coreConnection, coreUrl } from "./core-connection";
import type { RuntimeOutputContent, RuntimeRun, RuntimeTask, RuntimeThread } from "./runtime-tasks";
import type { ApprovalDecision, BrainAgent, BrainSession, CapabilityLease, RuntimeBrowser, RuntimeCapabilities, RuntimeClient, RuntimeClients, RuntimePhone, RuntimeShells, RuntimeSkill, RuntimePluginStatus, RuntimePlugins, RuntimeTellRules, RuntimeTellWish, TabView, TerminalScreen, WorkspaceProvider } from "./provider";

/** unzoo 的能力名和控制台的连接器 id 不是一套词，这里对上。 */
const CAPABILITY_BY_CONNECTOR: Partial<Record<ConnectorId, string>> = {
  browser: "browser",
};

type UnzooResponse<T> = { tool: string; data: T } | { error: string; detail?: string };

async function callUnzoo<T>(tool: string, args?: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/unzoo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  const body = (await response.json()) as UnzooResponse<T>;
  if ("error" in body) throw new Error(body.detail ? t("{error}（{detail}）", { error: body.error, detail: body.detail }) : body.error);
  return body.data;
}

function nowLabel(): string {
  return t("刚刚");
}

/**
 * unterm 的 API 要 Bearer token，token 从同源的 /bootstrap.json 取一次。
 * 和 unterm 自己的设置页是同一套：控制台由 unterm 托管时同源，不用配置。
 *
 * 取不到就说明这份控制台不是 unterm 在托管（云端演示版，或者本机没起
 * unterm），调用方据此落回 mock。
 */
async function authToken(): Promise<string> {
  return (await coreConnection()).token;
}

async function getUnterm<T>(path: string): Promise<T> {
  const connection = await coreConnection();
  const response = await fetch(coreUrl(connection, path), {
    headers: { authorization: `Bearer ${connection.token}` },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok || body?.error) throw new Error(body?.error ?? t("后台服务返回 {status}", { status: response.status }));
  return body;
}

/**
 * 已经在这里答复过的托管审批。答复发出去和 unterm 把它移出队列之间有一个
 * 来回，这期间的一次轮询还会看到它；不滤掉，刚处理完的审批会闪回收件箱。
 */
const answeredAgentApprovals = new Set<string>();

async function decideAgentApproval(id: string, decision: ApprovalDecision): Promise<void> {
  const parsed = parseAgentApprovalId(id);
  if (!parsed) throw new Error(t("不是托管会话的审批：{id}", { id }));
  answeredAgentApprovals.add(id);
  if (parsed.sessionId === CONFIRMATION_SESSION) {
    try {
      await callUnterm("/api/approvals/decide", {
        approval: `cfm_${parsed.requestId}`,
        allowed: decision.kind === "approve",
        // “记住”＝一直信任这个客户端到这个风险等级（unterm 记成一条授权，可撤销）。
        ...(decision.kind === "approve" && decision.remember ? { remember: "agent" } : {}),
      });
    } catch (error) {
      answeredAgentApprovals.delete(id);
      throw error;
    }
    return;
  }
  try {
    await callUnterm("/api/agent/decide", {
      session_id: parsed.sessionId,
      request_id: parsed.requestId,
      allow: decision.kind === "approve",
      ...(decision.kind === "approve" && decision.remember ? { remember: true } : {}),
      // 控制台的拒绝 = 拒绝并停止这一轮：不停的话 agent 往往换个命令再问一遍。
      ...(decision.kind === "reject" ? { message: decision.reason, interrupt: true } : {}),
    });
  } catch (error) {
    answeredAgentApprovals.delete(id);
    throw error;
  }
}

/** 这份控制台是不是 unterm 托管的：拿得到 token 就是。 */
async function untermReachable(): Promise<boolean> {
  try {
    await authToken();
    return true;
  } catch {
    return false;
  }
}

type RawPhoneAddress = { ip: string; kind: string; url?: string; qr_svg?: string };
type RawPhoneStatus = {
  enabled?: boolean;
  port?: number;
  addresses?: RawPhoneAddress[];
  devices?: { device_id: string; device_name: string; platform: string; scope: string; last_seen_at: string; last_ip: string }[];
  pairing?: { code: string; expires_at_ms: number; address_qrs?: RawPhoneAddress[] } | null;
};

/** 运行时的手机状态 → 页面用的样子。 */
export function toRuntimePhone(raw: RawPhoneStatus): RuntimePhone {
  const address = (a: RawPhoneAddress) => ({ ip: a.ip, kind: a.kind, url: a.url, qr: a.qr_svg });
  return {
    enabled: raw.enabled === true,
    port: raw.port ?? 0,
    addresses: (raw.addresses ?? []).map(address),
    devices: (raw.devices ?? []).map((d) => ({
      id: d.device_id,
      name: d.device_name,
      platform: d.platform,
      scope: d.scope,
      lastSeen: d.last_seen_at,
      lastIp: d.last_ip,
    })),
    pairing: raw.pairing
      ? { code: raw.pairing.code, expiresAt: raw.pairing.expires_at_ms, addresses: (raw.pairing.address_qrs ?? []).map(address) }
      : undefined,
  };
}

async function callUnterm<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const connection = await coreConnection();
  const response = await fetch(coreUrl(connection, path), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${connection.token}` },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok || body?.error) throw new Error(body?.error ?? t("后台服务返回 {status}", { status: response.status }));
  return body;
}

/**
 * 包一层真实后端。能接的方法走本机服务，接不了或失败的落回 fallback，
 * 这样任何一块后端没起来，控制台仍然是完整可用的。
 */
export function createLiveProvider(fallback: WorkspaceProvider): WorkspaceProvider {
  const inBrowser = typeof window !== "undefined";

  return {
    ...fallback,

    /**
     * 审批：本地队列照旧走 fallback，托管会话的审批走 unterm。
     * live() 取不到（云端演示版、本机没起 unterm）就当没有，不影响其它审批。
     */
    approvals: {
      ...fallback.approvals,

      async live() {
        if (!inBrowser) return [];
        try {
          const [data, gate] = await Promise.all([
            getUnterm<{ approvals?: RawAgentApproval[] }>("/api/agent/approvals"),
            // 外部客户端经终端要写入的确认；老版本没有这个接口就当没有。
            getUnterm<{ pending_input_confirmations?: RawInputConfirmation[] }>("/api/approvals").catch(() => ({
              pending_input_confirmations: [] as RawInputConfirmation[],
            })),
          ]);
          const now = Date.now();
          return [
            ...(data.approvals ?? []).map((raw) => toApprovalItem(raw, now)),
            ...(gate.pending_input_confirmations ?? []).map((raw) => confirmationToApprovalItem(raw, now)),
          ].filter((item) => !answeredAgentApprovals.has(item.id));
        } catch {
          return [];
        }
      },

      async decide(id, decision) {
        if (isAgentApprovalId(id)) return decideAgentApproval(id, decision);
        return fallback.approvals.decide(id, decision);
      },

      async decideMany(ids, decision) {
        const agent = ids.filter(isAgentApprovalId);
        const local = ids.filter((id) => !isAgentApprovalId(id));
        await Promise.all([
          ...agent.map((id) => decideAgentApproval(id, decision)),
          ...(local.length ? [fallback.approvals.decideMany(local, decision)] : []),
        ]);
      },
    },

    /**
     * 真的跑一个 brain。这条只在 unterm 托管这份控制台时通 —— 别处拿不到
     * /bootstrap.json，start 会抛错，任务详情页据此退回演示事件。
     *
     * 只有 start 会落回 fallback。会话一旦真的起来了，后续的
     * events / status / close 就必须打在同一个后端上，悄悄换成 mock 只会
     * 让界面显示一段根本没发生过的事。
     */
    brain: {
      async agents(options) {
        if (!inBrowser) return fallback.brain.agents(options);
        try {
          const data = await getUnterm<{ agents?: Record<string, unknown>[] }>(
            options?.refresh ? "/api/agents/list?refresh=1" : "/api/agents/list",
          );
          return (data.agents ?? [])
            .map(toBrainAgent)
            .filter((agent): agent is BrainAgent => agent !== null);
        } catch (error) {
          // unterm 在跑但清单读不到（离线、签名过期）要报出来；连 unterm 都没有才退回演示。
          if (await untermReachable()) throw error;
          return fallback.brain.agents(options);
        }
      },
      async start(input) {
        if (!inBrowser) return fallback.brain.start(input);
        const mode = input.mode ?? "headless";
        let data: { agent: string; adapter: string; hosted?: boolean; session: { session_id: string } };
        try {
          data = await callUnterm("/api/agent/start", {
            agent: input.agent,
            prompt: input.prompt,
            task_id: input.taskId,
            run_id: input.runId,
            step_id: input.stepId,
            ...(mode === "governed" ? { governed: true } : mode === "hosted" ? { hosted: true } : {}),
            ...(input.cwd ? { cwd: input.cwd } : {}),
          });
        } catch (error) {
          // 只有"这份控制台不归 unterm 托管"才落回演示。unterm 在、但拒绝了
          // （工作目录不存在、agent 没装）要原样报出来，换成演示事件等于
          // 假装跑过了。
          if (await untermReachable()) throw error;
          return fallback.brain.start(input);
        }
        return {
          sessionId: data.session.session_id,
          agent: input.agent,
          adapter: data.adapter,
          hosted: Boolean(data.hosted),
        };
      },

      async resume(input): Promise<BrainSession> {
        if (!input.sessionId.startsWith("ags_")) return fallback.brain.resume(input);
        const data = await callUnterm<{ session_id: string; adapter?: string }>("/api/agent/resume", {
          session_id: input.sessionId,
          prompt: input.prompt,
          task_id: input.taskId,
          run_id: input.runId,
          step_id: input.stepId,
        });
        const status = await callUnterm<{ adapter?: string; agent?: string }>("/api/agent/status", {
          session_id: data.session_id,
        }).catch(() => ({}) as { adapter?: string });
        return {
          sessionId: data.session_id,
          // 续接只认得 unterm 记下的那个 CLI；控制台这边的 agent id 只用来显示。
          agent: agentForAdapter(status.adapter),
          adapter: status.adapter ?? "claude",
          hosted: true,
        };
      },

      async events(sessionId, cursor) {
        if (!sessionId.startsWith("ags_")) return fallback.brain.events(sessionId, cursor);
        const data = await callUnterm<{ cursor: number; events: Array<Record<string, unknown>> }>(
          "/api/agent/events",
          { session_id: sessionId, cursor },
        );
        return { cursor: data.cursor, events: (data.events ?? []).map(toBrainEvent) };
      },

      async status(sessionId) {
        if (!sessionId.startsWith("ags_")) return fallback.brain.status(sessionId);
        const data = await callUnterm<{
          state: string;
          turns?: number;
          pending_approvals?: string[];
          usage?: { input_tokens?: number; output_tokens?: number; cached_input_tokens?: number } | null;
        }>("/api/agent/status", { session_id: sessionId });
        return {
          state: data.state,
          turns: data.turns ?? 0,
          pendingApprovals: data.pending_approvals?.length ?? 0,
          usage: {
            inputTokens: data.usage?.input_tokens ?? 0,
            outputTokens: data.usage?.output_tokens ?? 0,
            cachedInputTokens: data.usage?.cached_input_tokens ?? 0,
          },
        };
      },

      async interrupt(sessionId, graceMs) {
        if (!sessionId.startsWith("ags_")) return fallback.brain.interrupt(sessionId, graceMs);
        await callUnterm("/api/agent/interrupt", {
          session_id: sessionId,
          ...(graceMs === undefined ? {} : { grace_ms: graceMs }),
        });
      },

      async close(sessionId) {
        if (!sessionId.startsWith("ags_")) return fallback.brain.close(sessionId);
        const data = await callUnterm<{ exit_code?: number; reason?: string }>("/api/agent/close", {
          session_id: sessionId,
        });
        return { exitCode: data.exit_code ?? 0, reason: data.reason ?? undefined };
      },
    },

    /** 常设规则只存在 unterm 那边；控制台不归它托管时用演示实现。 */
    runtime: {
      async available() {
        if (!inBrowser) return false;
        try {
          await getUnterm("/api/console/tasks");
          return true;
        } catch {
          // 老版本 unterm 没有这个接口，或者根本不是 unterm 托管的控制台。
          return false;
        }
      },
      async list() {
        const data = await getUnterm<{ tasks?: RuntimeTask[] }>("/api/console/tasks");
        return data.tasks ?? [];
      },
      async put(task) {
        await callUnterm("/api/console/tasks/put", task);
      },
      async remove(id) {
        await callUnterm("/api/console/tasks/delete", { id });
      },
      async run({ taskId, runId, prompt, continueFrom, followUp, saveSkill }) {
        const data = await callUnterm<{ run: RuntimeRun }>("/api/console/tasks/run", {
          task_id: taskId,
          ...(runId ? { run_id: runId } : {}),
          ...(prompt ? { prompt } : {}),
          ...(continueFrom ? { continue_from: continueFrom } : {}),
          ...(followUp ? { follow_up: true } : {}),
          ...(saveSkill ? { save_skill: true } : {}),
        });
        return data.run;
      },
      async thread(taskId) {
        const data = await callUnterm<{ thread: RuntimeThread }>("/api/console/tasks/thread", { task_id: taskId });
        return { ...data.thread, turns: data.thread.turns ?? [] };
      },
      async stop(taskId) {
        const data = await callUnterm<{ stopped?: boolean }>("/api/console/tasks/stop", { task_id: taskId });
        return data.stopped === true;
      },
      async setWatchSecret(taskId, secret, kind) {
        await callUnterm("/api/console/tasks/watch-secret", { id: taskId, secret, kind });
      },
      async capabilities(): Promise<RuntimeCapabilities> {
        const data = await getUnterm<{
          terminal?: { governed_ready?: boolean };
          browser?: { installed?: boolean; path?: string | null };
        }>("/api/console/capabilities");
        return {
          terminal: { governedReady: data.terminal?.governed_ready === true },
          browser: { installed: data.browser?.installed === true, path: data.browser?.path ?? undefined },
        };
      },
      async browser(): Promise<RuntimeBrowser> {
        const data = await getUnterm<{
          installed?: boolean;
          reachable?: boolean;
          plan?: string | null;
          max_profiles?: number | null;
          profiles?: { id: string; name: string }[];
          reserved_profile?: string;
          reserved?: boolean;
          chosen?: string | null;
          chosen_missing?: boolean;
          ready?: boolean;
          error?: string;
          reserve_error?: string | null;
        }>("/api/console/browser");
        return {
          installed: data.installed === true,
          reachable: data.reachable === true,
          plan: data.plan ?? undefined,
          maxProfiles: data.max_profiles ?? undefined,
          profiles: data.profiles ?? [],
          reservedProfile: data.reserved_profile ?? "mcp-unzoo-one-agent",
          reserved: data.reserved === true,
          chosen: data.chosen ?? null,
          chosenMissing: data.chosen_missing === true,
          ready: data.ready === true,
          error: data.error,
          reserveError: data.reserve_error ?? undefined,
        };
      },
      async terminalScreen(sessionId, fromLine): Promise<TerminalScreen> {
        const data = await callUnterm<{
          session_id: string;
          text?: string | null;
          first_row?: number | null;
          row_count?: number | null;
          cols?: number | null;
          rows?: number | null;
        }>("/api/console/computer/terminal", fromLine === undefined ? { session_id: sessionId } : { session_id: sessionId, from_line: fromLine });
        return {
          sessionId: data.session_id,
          text: data.text ?? "",
          firstRow: data.first_row ?? 0,
          rowCount: data.row_count ?? 0,
          cols: data.cols ?? undefined,
          rows: data.rows ?? undefined,
        };
      },
      async answerHandover(sessionId, handoverId, done, note) {
        await callUnterm("/api/console/handover", {
          session_id: sessionId,
          handover_id: handoverId,
          done,
          ...(note?.trim() ? { note: note.trim() } : {}),
        });
      },
      async terminalInput(sessionId, input) {
        await callUnterm("/api/console/computer/terminal/input", { session_id: sessionId, input });
      },
      async focusTerminal(sessionId) {
        await callUnterm("/api/console/computer/terminal/focus", { session_id: sessionId });
      },
      async tabView(tabId): Promise<TabView> {
        const data = await callUnterm<{
          tab_id: string;
          url?: string | null;
          title?: string | null;
          format?: string | null;
          image_base64?: string | null;
        }>("/api/console/computer/tab", { tab_id: tabId });
        return {
          tabId: data.tab_id,
          url: data.url ?? undefined,
          title: data.title ?? undefined,
          image: data.image_base64 ? `data:image/${data.format || "png"};base64,${data.image_base64}` : undefined,
        };
      },
      async activateTab(tabId) {
        await callUnterm("/api/console/computer/tab/activate", { tab_id: tabId });
      },
      async clients(): Promise<RuntimeClients> {
        const data = await getUnterm<{
          server: string;
          terminal_ready?: boolean;
          browser_installed?: boolean;
          clients?: RuntimeClient[];
        }>("/api/console/clients");
        return {
          server: data.server,
          terminalReady: data.terminal_ready === true,
          browserInstalled: data.browser_installed === true,
          clients: data.clients ?? [],
        };
      },
      async connectClient(id, connect) {
        await callUnterm("/api/console/clients/connect", { id, connect });
      },
      async setupBrowserForClients() {
        await callUnterm("/api/console/clients/browser", {});
      },
      async shells(): Promise<RuntimeShells> {
        type RawShell = {
          id: string;
          name: string;
          description?: string;
          installed?: boolean;
          path?: string;
          version?: string | null;
          install_command?: string | null;
          install_by_hand?: boolean;
          recommended?: boolean;
          installing?: boolean;
          install_error?: string | null;
        };
        const [data, compat] = await Promise.all([
          getUnterm<{
            shells?: RawShell[];
            default_shell?: { source?: string; argv?: string[]; label?: string; id?: string | null };
          }>("/api/shells"),
          getUnterm<{ term_program?: string; default?: string; presets?: string[] }>("/api/compat"),
        ]);
        return {
          shells: (data.shells ?? []).map((shell) => ({
            id: shell.id,
            name: shell.name,
            description: shell.description ?? "",
            installed: shell.installed === true,
            path: shell.path ?? "",
            version: shell.version ?? null,
            installCommand: shell.install_command ?? null,
            installByHand: shell.install_by_hand === true,
            recommended: shell.recommended === true,
            installing: shell.installing === true,
            installError: shell.install_error ?? null,
          })),
          defaultShell: {
            source: data.default_shell?.source ?? "platform",
            argv: data.default_shell?.argv ?? [],
            label: data.default_shell?.label ?? "",
            id: data.default_shell?.id ?? null,
          },
          termProgram: compat.term_program ?? "",
          termProgramDefault: compat.default ?? "",
          termProgramPresets: compat.presets ?? [],
        };
      },
      async setDefaultShell(id) {
        await callUnterm("/api/shells/default", { id });
      },
      async installShell(id) {
        await callUnterm("/api/shells/install", { id });
      },
      async setTermProgram(name) {
        await callUnterm("/api/compat", { term_program: name });
      },
      async tellRules(): Promise<RuntimeTellRules> {
        type Raw = { kind: string; wish: RuntimeTellWish; hours?: string | null; said?: string; at?: string; count?: number };
        const data = await getUnterm<{ rules?: Raw[]; clues?: Raw[] }>("/api/tell-rules");
        const rule = (raw: Raw) => ({ kind: raw.kind, wish: raw.wish, hours: raw.hours ?? null, said: raw.said ?? "", at: raw.at ?? "" });
        return {
          rules: (data.rules ?? []).map(rule),
          clues: (data.clues ?? []).map((raw) => ({ ...rule(raw), count: raw.count ?? 1 })),
        };
      },
      async forgetTellRule(kind) {
        await callUnterm("/api/tell-rules/forget", { kind });
      },
      async plugins(): Promise<RuntimePlugins> {
        type Raw = {
          id: string; name?: string; version?: string; description?: string; dir?: string; enabled?: boolean;
          status?: RuntimePluginStatus; error?: string | null; page_url?: string | null; has_page?: boolean;
          mcp_server?: string | null; tools?: { name: string; does: string }[]; domains?: string[];
          roles?: { name: string; kind: "browser" | "agent"; label?: string; default?: Record<string, string> | null; binding?: Record<string, string> | null }[];
        };
        const data = await getUnterm<{ plugins?: Raw[]; browser_profiles?: { id: string; name?: string }[] }>("/api/plugins");
        return {
          plugins: (data.plugins ?? []).map((raw) => ({
            id: raw.id,
            name: raw.name ?? raw.id,
            version: raw.version ?? "",
            description: raw.description ?? "",
            dir: raw.dir ?? "",
            enabled: Boolean(raw.enabled),
            status: raw.status ?? "stopped",
            error: raw.error ?? null,
            pageUrl: raw.page_url ?? null,
            hasPage: Boolean(raw.has_page),
            mcpServer: raw.mcp_server ?? null,
            tools: raw.tools ?? [],
            roles: (raw.roles ?? []).map((role) => ({
              name: role.name,
              kind: role.kind,
              label: role.label ?? role.name,
              default: role.default ?? null,
              binding: role.binding ?? null,
            })),
            domains: raw.domains ?? [],
          })),
          browserProfiles: (data.browser_profiles ?? []).map((p) => ({ id: p.id, name: p.name ?? p.id })),
        };
      },
      async addPlugin(dir) {
        const data = await callUnterm<{ id: string }>("/api/plugins/add", { dir });
        return data.id;
      },
      async enablePlugin(id, enabled) {
        await callUnterm("/api/plugins/enable", { id, enabled });
      },
      async restartPlugin(id) {
        await callUnterm("/api/plugins/restart", { id });
      },
      async removePlugin(id) {
        await callUnterm("/api/plugins/remove", { id });
      },
      async bindPluginRole(id, role, value) {
        await callUnterm("/api/plugins/bind", { id, role, value });
      },
      async pluginLog(id) {
        const data = await getUnterm<{ log?: string }>(`/api/plugins/log?id=${encodeURIComponent(id)}`);
        return data.log ?? "";
      },
      async phone() {
        return toRuntimePhone(await getUnterm<RawPhoneStatus>("/api/remote/status"));
      },
      async pairPhone() {
        const data = await callUnterm<{ status: RawPhoneStatus }>("/api/remote/pair-code", { scope: "full" });
        return toRuntimePhone(data.status);
      },
      async unpairPhone(id) {
        const data = await callUnterm<{ status: RawPhoneStatus }>("/api/remote/revoke", { device_id: id });
        return toRuntimePhone(data.status);
      },
      async setPhoneEnabled(enabled) {
        return toRuntimePhone(await callUnterm<RawPhoneStatus>("/api/remote/enable", { enabled }));
      },
      async skills() {
        const data = await getUnterm<{ skills?: RuntimeSkill[] }>("/api/console/skills");
        return data.skills ?? [];
      },
      async setSkillEnabled(name, enabled) {
        const data = await callUnterm<{ skills?: RuntimeSkill[] }>("/api/console/skills/toggle", { name, enabled });
        return data.skills ?? [];
      },
      async deleteSkill(name) {
        const data = await callUnterm<{ skills?: RuntimeSkill[] }>("/api/console/skills/delete", { name });
        return data.skills ?? [];
      },
      async importSkill(path, replace) {
        const data = await callUnterm<{ imported: string; skills?: RuntimeSkill[] }>("/api/console/skills/import", {
          path,
          ...(replace ? { replace: true } : {}),
        });
        return { imported: data.imported, skills: data.skills ?? [] };
      },
      async output({ taskId, runId, path }): Promise<RuntimeOutputContent> {
        const { output } = await callUnterm<{
          output: { path: string; absolute_path: string; size: number; truncated: boolean; binary: boolean; text: string | null };
        }>("/api/console/tasks/output", { task_id: taskId, run_id: runId, path });
        return {
          path: output.path,
          absolutePath: output.absolute_path,
          size: output.size,
          truncated: output.truncated,
          binary: output.binary,
          text: output.text,
        };
      },
      async settings() {
        const data = await getUnterm<{ settings: Record<string, unknown> }>("/api/console/run-settings");
        return parseAgentRunSettings(JSON.stringify(data.settings));
      },
      async saveSettings(settings) {
        const data = await callUnterm<{ settings: Record<string, unknown> }>("/api/console/run-settings", {
          agent: settings.agent,
          cwd: settings.cwd,
          governed: settings.governed,
          autonomy: settings.autonomy,
          browser_profile: settings.browserProfile,
        });
        return parseAgentRunSettings(JSON.stringify(data.settings));
      },
    },

    agentRules: {
      async list() {
        if (!inBrowser) return fallback.agentRules.list();
        let data: { rules?: RawAgentRule[]; store?: string };
        try {
          data = await getUnterm("/api/agent/policy");
        } catch (error) {
          if (await untermReachable()) throw error;
          return fallback.agentRules.list();
        }
        return {
          rules: (data.rules ?? []).map(toAgentRule).filter((rule) => rule !== null),
          store: data.store ?? undefined,
        };
      },
      async add(draft) {
        if (!inBrowser || !(await untermReachable())) return fallback.agentRules.add(draft);
        const data = await callUnterm<{ rule: RawAgentRule }>("/api/agent/policy", fromAgentRuleDraft(draft));
        const rule = toAgentRule(data.rule);
        if (!rule) throw new Error(t("后台服务返回的规则不完整"));
        return rule;
      },
      async remove(id) {
        if (!inBrowser || !(await untermReachable())) return fallback.agentRules.remove(id);
        await callUnterm("/api/agent/policy/remove", { id });
      },
    },

    connectors: {
      ...fallback.connectors,

      async diagnose(id: ConnectorId): Promise<ConnectorCheckResult> {
        if (!inBrowser || id !== "browser") return fallback.connectors.diagnose(id);
        const startedAt = Date.now();
        try {
          await callUnzoo<{ version: string; chromium_version: string }>("service_version");
          return { checkedAt: nowLabel(), latency: Date.now() - startedAt };
        } catch {
          // 本机 unzoo 没起来时不该让诊断整个失败，退回演示值。
          return fallback.connectors.diagnose(id);
        }
      },

      async leases(): Promise<CapabilityLease[]> {
        if (!inBrowser) return fallback.connectors.leases();
        try {
          const data = await callUnzoo<{ enforced: boolean; leases: unknown[] }>("lease_list");
          if (!Array.isArray(data?.leases)) return fallback.connectors.leases();
          return data.leases.map((raw) => {
            const item = raw as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              capability: String(item.capability ?? ""),
              holder: String(item.holder ?? ""),
              scope: String(item.scope ?? ""),
              expiresAt: String(item.expires_at ?? item.expiresAt ?? ""),
              status: (item.status as CapabilityLease["status"]) ?? "active",
            };
          });
        } catch {
          return fallback.connectors.leases();
        }
      },

      async acquire(capability: string, scope: string, ttlSeconds: number) {
        const mapped = CAPABILITY_BY_CONNECTOR[capability as ConnectorId] ?? capability;
        if (!inBrowser) return fallback.connectors.acquire(capability, scope, ttlSeconds);
        try {
          const data = await callUnzoo<Record<string, unknown>>("lease_request", {
            capability: mapped,
            holder: "unzoo-one-console",
            scope,
            ttl_secs: ttlSeconds,
          });
          return {
            id: String(data.id ?? ""),
            capability: mapped,
            holder: "unzoo-one-console",
            scope,
            expiresAt: String(data.expires_at ?? ""),
            status: (data.status as CapabilityLease["status"]) ?? "pending",
          };
        } catch {
          return fallback.connectors.acquire(capability, scope, ttlSeconds);
        }
      },
    },
  };
}
