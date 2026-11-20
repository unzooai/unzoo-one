import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CONFIRMATION_SESSION,
  clientLabel,
  confirmationToApprovalItem,
  agentApprovalId,
  isAgentApprovalId,
  parseAgentApprovalId,
  reconcileAgentApprovals,
  toApprovalItem,
} from "../.test-build/agent-approvals.mjs";

// unterm GET /api/agent/approvals 的一条，取自一次真实的托管 Claude 会话。
const claudeAsks = {
  session_id: "ags_e0cf5d3d40994840b57957747887075e",
  adapter: "claude",
  at: "2026-11-10T03:00:00+00:00",
  task_id: "task_01JBQ8XG4T7N2M9V0KRSD3WZ1A",
  event: "approval.requested",
  approval: {
    request_id: "31551e4b-7fbb-46cf-86b1-06f0360c2dc5",
    description: "Write hi to out.txt",
    tool_call: { tool: "Bash", arguments: { command: "echo hi > out.txt", description: "Write hi to out.txt" } },
  },
};

test("托管审批：id 能反解回会话和请求，请求 id 里带冒号也不切错", () => {
  const id = agentApprovalId("ags_1", "req:with:colons");
  assert.ok(isAgentApprovalId(id));
  assert.deepEqual(parseAgentApprovalId(id), { sessionId: "ags_1", requestId: "req:with:colons" });
  assert.equal(parseAgentApprovalId("send-summary"), null, "本地审批不是托管审批");
  assert.equal(parseAgentApprovalId("agent:ags_1:"), null, "缺请求 id 不算");
  assert.equal(isAgentApprovalId("send-summary"), false);
});

test("托管审批：一条 approval.requested 变成收件箱里说清楚要做什么的一条", () => {
  const now = Date.parse("2026-11-10T03:05:30+00:00");
  const item = toApprovalItem(claudeAsks, now);
  assert.equal(item.id, `agent:${claudeAsks.session_id}:${claudeAsks.approval.request_id}`);
  assert.equal(item.taskId, claudeAsks.task_id, "挂回调用方给的任务");
  // Interface text is English by default; data values (risk) stay as data.
  assert.equal(item.title, "Claude Code wants to run a command");
  assert.equal(item.target, "echo hi > out.txt", "命令原文，而不是整段 JSON");
  assert.equal(item.reason, "Write hi to out.txt");
  assert.equal(item.scope, "This call only");
  assert.equal(item.risk, "中风险");
  assert.equal(item.requestedAt, "5 min ago");

  // agy 的命令在 CommandLine 里；Codex 的补丁、权限请求各有各的样子。
  const agy = toApprovalItem({
    session_id: "ags_2", adapter: "agy",
    approval: { request_id: "1", tool_call: { tool: "run_command", arguments: { CommandLine: "echo hi > out.txt" } } },
  });
  assert.equal(agy.title, "Antigravity wants to run a command");
  assert.equal(agy.target, "echo hi > out.txt");
  assert.equal(agy.requestedAt, "Just now", "没有时间就当刚刚");

  const patch = toApprovalItem({
    session_id: "ags_3", adapter: "codex",
    approval: { request_id: "5", tool_call: { tool: "apply_patch", arguments: [{ path: "a.txt", kind: "add" }] } },
  });
  assert.equal(patch.action, "change a file");
  assert.match(patch.target, /a\.txt/);

  const perms = toApprovalItem({
    session_id: "ags_4", adapter: "codex",
    approval: { request_id: "9", tool_call: { tool: "permissions", arguments: { network: { enabled: true } } } },
  });
  assert.equal(perms.risk, "高风险", "放宽权限影响之后的每一次调用");
});

test("托管审批：轮询结果并进队列，只动托管的那些，没变化就不换数组", () => {
  const local = { ...toApprovalItem(claudeAsks), id: "send-summary" };
  const a = toApprovalItem(claudeAsks);
  const b = toApprovalItem({ ...claudeAsks, approval: { ...claudeAsks.approval, request_id: "second" } });

  const first = reconcileAgentApprovals([local], [a]);
  assert.deepEqual(first.map((x) => x.id), ["send-summary", a.id], "新问题追加在后面");

  const same = reconcileAgentApprovals(first, [a]);
  assert.equal(same, first, "没变化时原样返回，不触发重渲染");

  const next = reconcileAgentApprovals(first, [b]);
  assert.deepEqual(next.map((x) => x.id), ["send-summary", b.id], "答复过的去掉，新的进来，本地的不动");

  assert.deepEqual(reconcileAgentApprovals(next, []).map((x) => x.id), ["send-summary"], "unterm 那边空了就全清掉");
});

test("受管模式下经 MCP 的调用说人话：开终端、执行命令、打开网页", () => {
  const base = { session_id: "ags_1", adapter: "claude", at: new Date().toISOString() };
  const open = toApprovalItem({
    ...base,
    approval: { request_id: "r1", tool_call: { tool: "mcp__unterm__session_create", arguments: {} } },
  });
  assert.equal(open.title, "Claude Code wants to open a terminal");
  assert.equal(open.risk, "低风险");
  assert.equal(open.target, "(no arguments)");

  const run = toApprovalItem({
    ...base,
    approval: { request_id: "r2", tool_call: { tool: "mcp__unterm__exec_run_wait", arguments: { command: "whoami", pane_id: 1 } } },
  });
  assert.equal(run.title, "Claude Code wants to run a command");
  assert.equal(run.target, "whoami");
  assert.equal(run.risk, "中风险");
  assert.match(run.impact, /whoami/);

  const browse = toApprovalItem({
    ...base,
    approval: { request_id: "r3", tool_call: { tool: "mcp__unzoo__browser_navigate", arguments: { url: "https://example.com" } } },
  });
  assert.equal(browse.title, "Claude Code wants to open a web page");
  assert.equal(browse.target, "https://example.com");

  const other = toApprovalItem({
    ...base,
    approval: { request_id: "r4", tool_call: { tool: "mcp__github__create_issue", arguments: { title: "x" } } },
  });
  assert.equal(other.title, "Claude Code wants to use create_issue from github");
});

test("an external client's terminal write becomes an inbox item that can be answered", () => {
  const item = confirmationToApprovalItem({
    id: 12,
    request_id: "cfm_12",
    agent: "claude-ai",
    method: "exec.run",
    input_preview: "npm test",
    risk: "exec",
    requested_at: new Date().toISOString(),
    state: "pending",
  });
  assert.equal(item.id, agentApprovalId(CONFIRMATION_SESSION, "12"));
  assert.ok(isAgentApprovalId(item.id), "polled and reconciled like the hosted ones");
  assert.deepEqual(parseAgentApprovalId(item.id), { sessionId: "cfm", requestId: "12" });
  assert.equal(item.target, "npm test");
  assert.equal(item.risk, "中风险");
  assert.match(item.title, /Claude Desktop/);

  const destroy = confirmationToApprovalItem({ id: 13, request_id: "cfm_13", agent: "", method: "session.destroy", input_preview: "", risk: "destructive" });
  assert.equal(destroy.risk, "高风险");
  assert.equal(destroy.target, "session.destroy");
  assert.equal(clientLabel("cursor"), "Cursor");
  assert.equal(clientLabel("some-new-client"), "some-new-client");
});

test("托管审批：点发送这类提交，收件箱说清点的是什么，并带上审核员的理由", () => {
  const send = {
    ...claudeAsks,
    approval: {
      request_id: "r9",
      tool_call: { tool: "mcp__unzoo__browser_click", arguments: { selector: "ref=9" } },
      commit: { kind: "click", label: "Send", site: "mail.google.com", text: null, risk: "external_side_effect" },
      review: { state: "ask", reason: "你只让它总结收件箱，没让它发信。" },
    },
  };
  const item = toApprovalItem(send, Date.parse("2026-11-10T03:00:30+00:00"));
  assert.match(item.title, /Click “Send” \(mail\.google\.com\)/);
  assert.equal(item.reason, "Reviewer: 你只让它总结收件箱，没让它发信。");
  assert.equal(item.risk, "高风险");

  const again = { ...send, approval: { ...send.approval, review: null, repeat: true } };
  assert.match(toApprovalItem(again).reason, /already made once/);
});
