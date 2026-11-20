import assert from "node:assert/strict";
import { test } from "node:test";

import {
  agentForAdapter,
  fromAgentRuleDraft,
  toAgentRule,
  toBrainAgent,
  toBrainEvent,
  turnOutcome,
} from "../.test-build/brain-events.mjs";
import {
  brainModeFor,
  parseAgentRunSettings,
} from "../.test-build/agent-run-settings.mjs";

test("output.delta 的文字在 text 字段（契约），推理流单独标出", () => {
  const said = toBrainEvent({
    event: "output.delta",
    at: "2026-11-10T03:00:00Z",
    task_id: "task-1",
    run_id: "run-1",
    step_id: "run-1-step-1",
    stream: "assistant",
    text: "已经建好仓库",
  });
  assert.equal(said.message, "已经建好仓库");
  assert.equal(said.stream, "assistant");
  assert.equal(said.taskId, "task-1");

  const thought = toBrainEvent({ event: "output.delta", at: "", stream: "reasoning", text: "先看看目录" });
  assert.equal(thought.stream, "reasoning");
});

test("error 的文字在 error.message；turn.completed 带上收敛状态", () => {
  const error = toBrainEvent({ event: "error", at: "", error: { code: "x", message: "CLI 退出了" } });
  assert.equal(error.message, "CLI 退出了");
  const done = toBrainEvent({ event: "turn.completed", at: "", state: "interrupted" });
  assert.equal(done.state, "interrupted");
});

test("托管会话一轮结束看 turn.completed，不看会话状态", () => {
  assert.deepEqual(turnOutcome([{ event: "output.delta", at: "", message: "x" }]), { done: false });
  assert.deepEqual(
    turnOutcome([
      { event: "approval.resolved", at: "" },
      { event: "turn.completed", at: "", state: "interrupted" },
    ]),
    { done: true, state: "interrupted" },
  );
  assert.deepEqual(turnOutcome([{ event: "turn.completed", at: "" }]), { done: true, state: "finished" });
});

test("规则：unterm 的蛇形字段转过来，不完整的丢掉", () => {
  const rule = toAgentRule({
    id: "rule_1",
    tool: "Bash",
    command_prefix: "git status",
    decision: "allow",
    workspace: "C:\\code\\demo",
    created_at: "2026-11-10T03:00:00Z",
    created_by: "remember",
  });
  assert.equal(rule.commandPrefix, "git status");
  assert.equal(rule.createdBy, "remember");
  assert.equal(toAgentRule({ id: "rule_2", tool: "Bash", decision: "maybe" }), null);
  assert.equal(toAgentRule({ tool: "Bash", decision: "deny" }), null);
});

test("规则草稿：空串当作没给，不会生成只匹配空命令的规则", () => {
  assert.deepEqual(fromAgentRuleDraft({ tool: " Bash ", decision: "deny", commandPrefix: "  ", workspace: "" }), {
    tool: "Bash",
    decision: "deny",
  });
  assert.deepEqual(
    fromAgentRuleDraft({ tool: "Bash", decision: "allow", commandPrefix: "cargo test", workspace: "C:\\w" }),
    { tool: "Bash", decision: "allow", command_prefix: "cargo test", workspace: "C:\\w" },
  );
});

test("运行设置：坏数据退回默认，受管给 Claude Code、Codex、OpenCode", () => {
  const fallback = { agent: "claude-code", cwd: "", governed: true, autonomy: "balanced", browserProfile: "" };
  assert.deepEqual(parseAgentRunSettings(null), fallback);
  assert.deepEqual(parseAgentRunSettings("{oops"), fallback);
  assert.deepEqual(parseAgentRunSettings('{"cwd":" C:\\\\w ","governed":false}'), {
    agent: "claude-code",
    cwd: "C:\\w",
    governed: false,
    autonomy: "balanced",
    browserProfile: "",
  });
  assert.equal(parseAgentRunSettings('{"agent":"codex-cli"}').agent, "codex-cli");
  assert.equal(parseAgentRunSettings('{"agent":"rm -rf"}').agent, "claude-code", "不认识的 agent 退回默认");
  assert.equal(brainModeFor("claude-code", { cwd: "", governed: true }), "governed");
  assert.equal(brainModeFor("codex-cli", { cwd: "", governed: true }), "governed");
  assert.equal(brainModeFor("opencode", { cwd: "", governed: true }), "governed");
  assert.equal(brainModeFor("agy", { cwd: "", governed: true }), "hosted");
  assert.equal(brainModeFor("claude-code", { cwd: "", governed: false }), "hosted");
});

test("agent 清单：只认得能驱动的，模式照 unterm 说的", () => {
  const codex = toBrainAgent({
    id: "codex-cli",
    name: "Codex CLI",
    installed: true,
    detected_version: "0.167.0",
    hosted_supported: true,
    governed_supported: false,
    signed_in: false,
    sign_in_command: "codex login",
  });
  assert.deepEqual(codex, {
    id: "codex-cli",
    name: "Codex CLI",
    installed: true,
    version: "0.167.0",
    hosted: true,
    governed: false,
    signedIn: false,
    signInCommand: "codex login",
  });
  // 看不出登录没登录（钥匙串里）的，不猜。
  assert.equal(toBrainAgent({ id: "agy", installed: true, hosted_supported: true, signed_in: null }).signedIn, null);
  assert.equal(toBrainAgent({ id: "aider", installed: true }), null);
  // 旧版 unterm 不报 hosted_supported：当作不能托管，不会被列出来。
  assert.equal(toBrainAgent({ id: "claude-code", installed: true }).hosted, false);
  assert.equal(agentForAdapter("codex"), "codex-cli");
  assert.equal(agentForAdapter("opencode"), "opencode");
  assert.equal(agentForAdapter("agy"), "agy");
  assert.equal(agentForAdapter("claude"), "claude-code");
});
