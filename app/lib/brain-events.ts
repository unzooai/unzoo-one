/**
 * unterm 事件和规则的原始形状 → 控制台的形状。
 *
 * 单独成文件是为了能脱离页面单测：字段名对不上时界面不会报错，只会安静地
 * 什么都不显示（之前 output.delta 的文字读的是 message，而契约里是 text，
 * 运行摘要因此一直是空的）。
 */

import type {
  BrainAgent,
  BrainId, AgentRule, AgentRuleDraft, BrainEvent } from "./provider";

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** contracts/v0/brain/events.schema.json 的一条事件。 */
export function toBrainEvent(raw: Record<string, unknown>): BrainEvent {
  const event = String(raw.event ?? "");
  const error = raw.error as Record<string, unknown> | undefined;
  const stream = str(raw.stream);
  return {
    event,
    at: String(raw.at ?? ""),
    taskId: str(raw.task_id),
    runId: str(raw.run_id),
    stepId: str(raw.step_id),
    // output.delta 的文字在 text；error 的在 error.message。message 留作兜底，
    // 早期的演示事件用的是它。
    message:
      event === "output.delta"
        ? (str(raw.text) ?? str(raw.message))
        : event === "error"
          ? (str(error?.message) ?? str(raw.message))
          : str(raw.message),
    stream: stream === "assistant" || stream === "reasoning" ? stream : undefined,
    model: str(raw.model),
    state: str(raw.state),
  };
}

export type RawAgentRule = {
  id?: unknown;
  workspace?: unknown;
  tool?: unknown;
  command_prefix?: unknown;
  decision?: unknown;
  note?: unknown;
  created_at?: unknown;
  created_by?: unknown;
};

export function toAgentRule(raw: RawAgentRule): AgentRule | null {
  const id = str(raw.id);
  const tool = str(raw.tool);
  const decision = raw.decision === "allow" || raw.decision === "deny" ? raw.decision : null;
  if (!id || !tool || !decision) return null;
  return {
    id,
    tool,
    decision,
    workspace: str(raw.workspace),
    commandPrefix: str(raw.command_prefix),
    note: str(raw.note),
    createdAt: str(raw.created_at) ?? "",
    createdBy: str(raw.created_by) ?? "",
  };
}

/** 发给 POST /api/agent/policy 的形状。空串当作没给，免得生成一条只匹配空命令的规则。 */
export function fromAgentRuleDraft(draft: AgentRuleDraft): Record<string, unknown> {
  const trimmed = (value?: string) => {
    const text = value?.trim();
    return text ? text : undefined;
  };
  const body: Record<string, unknown> = { tool: draft.tool.trim(), decision: draft.decision };
  const workspace = trimmed(draft.workspace);
  const prefix = trimmed(draft.commandPrefix);
  const note = trimmed(draft.note);
  if (workspace) body.workspace = workspace;
  if (prefix) body.command_prefix = prefix;
  if (note) body.note = note;
  return body;
}

/**
 * 读完一批事件后，这一轮怎么样了。
 *
 * 托管会话一轮结束后进程不退出，会话状态一直是 running，只有 turn.completed
 * 说明这一轮完了；它的 state 就是这一轮的结果（被拒绝并停止的是 interrupted）。
 */
export function turnOutcome(events: BrainEvent[]): { done: boolean; state?: string } {
  for (let index = events.length - 1; index >= 0; index--) {
    const item = events[index];
    if (item.event === "turn.completed" || item.event === "session.closed") {
      return { done: true, state: item.state ?? "finished" };
    }
  }
  return { done: false };
}

const brainIds: readonly BrainId[] = ["claude-code", "codex-cli", "opencode", "agy"];

export function isBrainId(value: unknown): value is BrainId {
  return typeof value === "string" && (brainIds as readonly string[]).includes(value);
}

/**
 * unterm GET /api/agents/list 的一行 → BrainAgent。控制台不认识的 agent
 * （还没有托管协议的那些）丢掉：交给它也跑不起来。
 */
export function toBrainAgent(raw: Record<string, unknown>): BrainAgent | null {
  if (!isBrainId(raw.id)) return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name ? raw.name : raw.id,
    installed: raw.installed === true,
    version: typeof raw.detected_version === "string" ? raw.detected_version : undefined,
    hosted: raw.hosted_supported === true,
    governed: raw.governed_supported === true,
    signedIn: typeof raw.signed_in === "boolean" ? raw.signed_in : null,
    signInCommand: typeof raw.sign_in_command === "string" ? raw.sign_in_command : undefined,
  };
}

/** unterm 报的 adapter 名 → 控制台的 agent id（续接时只拿得到 adapter）。 */
export function agentForAdapter(adapter: string | undefined): BrainId {
  if (adapter === "codex") return "codex-cli";
  if (adapter === "opencode") return "opencode";
  if (adapter === "agy") return "agy";
  return "claude-code";
}
