import assert from "node:assert/strict";
import { test } from "node:test";

import { createMockProvider } from "../.test-build/provider.mjs";

test("任务：列出、创建、改状态、删除", async () => {
  const p = createMockProvider();
  const before = await p.tasks.list();
  assert.ok(before.length > 0, "mock 应该有初始任务");

  const created = await p.tasks.create({
    id: "task-contract-1",
    title: "契约测试任务",
    description: "验证 create 返回完整实体",
    target: "example.com",
    status: "运行中",
  });
  assert.equal(created.id, "task-contract-1", "id 由调用方决定");
  assert.equal(created.progress, 0);
  assert.equal((await p.tasks.list()).length, before.length + 1);

  await assert.rejects(
    () => p.tasks.create({ id: "task-contract-1", title: "重复", description: "", target: "", status: "运行中" }),
    /already exists/,
    "同一个 id 不能建两次",
  );

  const paused = await p.tasks.pause(created.id);
  assert.equal(paused.status, "已暂停");
  assert.equal((await p.tasks.get(created.id)).status, "已暂停");

  await p.tasks.remove(created.id);
  assert.equal(await p.tasks.get(created.id), null);
  assert.equal((await p.tasks.list()).length, before.length);
});

test("任务：删除会连带清掉它的成果和待审批", async () => {
  const p = createMockProvider();
  const artifacts = await p.artifacts.list();
  const target = artifacts[0].taskId;
  assert.ok(target, "取一个有成果的任务");

  await p.tasks.remove(target);
  const left = await p.artifacts.list();
  assert.equal(left.filter((a) => a.taskId === target).length, 0);
  const approvals = await p.approvals.list();
  assert.equal(approvals.filter((a) => a.taskId === target).length, 0);
});

test("审批：批准和拒绝都出队并写进运行记录", async () => {
  const p = createMockProvider();
  const [first, second] = await p.approvals.list();
  const activityBefore = (await p.activity.list()).length;

  await p.approvals.decide(first.id, { kind: "approve" });
  let left = await p.approvals.list();
  assert.equal(left.find((a) => a.id === first.id), undefined);

  await p.approvals.decide(second.id, { kind: "reject", reason: "范围超出预期" });
  left = await p.approvals.list();
  assert.equal(left.find((a) => a.id === second.id), undefined);

  const activity = await p.activity.list();
  assert.equal(activity.length, activityBefore + 2);
  assert.equal(activity[0].kind, "审批");
  assert.equal(activity[0].detail, "范围超出预期");
});

test("审批：批量决定一次清空多条", async () => {
  const p = createMockProvider();
  const all = await p.approvals.list();
  await p.approvals.decideMany(all.map((a) => a.id), { kind: "approve" });
  assert.equal((await p.approvals.list()).length, 0);
});

test("成果：改动落库，用量随之变化", async () => {
  const p = createMockProvider();
  const [item] = await p.artifacts.list();
  const usageBefore = await p.artifacts.usage();

  const updated = await p.artifacts.update(item.id, { starred: true });
  assert.equal(updated.starred, true);
  assert.equal((await p.artifacts.get(item.id)).starred, true);
  assert.equal(await p.artifacts.verify(item.id), true);

  await p.artifacts.remove(item.id);
  const usageAfter = await p.artifacts.usage();
  assert.equal(usageAfter.count, usageBefore.count - 1);
  assert.ok(Math.abs(usageAfter.totalKb - (usageBefore.totalKb - item.sizeKb)) < 0.001);
  assert.equal(await p.artifacts.verify(item.id), false);
});

test("策略：外部发送要审批，本地读取不用", async () => {
  const p = createMockProvider();
  const send = await p.policy.check("发送摘要", "领导沟通群");
  assert.equal(send.requiresApproval, true);
  assert.ok(send.reason?.includes("领导沟通群"));

  const read = await p.policy.check("读取页面", "competitor.com");
  assert.equal(read.requiresApproval, false);
});

test("连接器：租约有有效期，撤销后状态变更", async () => {
  const p = createMockProvider();
  assert.equal((await p.connectors.leases()).length, 0);

  const lease = await p.connectors.acquire("browser", "仅当前页面", 900);
  assert.equal(lease.status, "active");
  assert.equal(lease.capability, "browser");
  assert.ok(new Date(lease.expiresAt).getTime() > Date.now());

  await p.connectors.revoke(lease.id);
  const [after] = await p.connectors.leases();
  assert.equal(after.status, "revoked");
});

test("连接器：诊断返回延迟", async () => {
  const p = createMockProvider();
  const result = await p.connectors.diagnose("browser");
  assert.equal(typeof result.latency, "number");
  assert.ok(result.checkedAt);
});

test("团队：邀请的成员处于待接受状态", async () => {
  const p = createMockProvider();
  const before = await p.team.list();
  const member = await p.team.invite({
    id: "member-contract-1",
    name: "张三",
    email: "zhangsan@unzoo.local",
    role: "成员",
    status: "已邀请",
    avatar: "张",
    tone: "blue",
    lastActive: "邀请刚刚发送",
  });
  assert.equal(member.id, "member-contract-1", "id 由调用方决定");
  assert.equal(member.status, "已邀请");
  assert.equal((await p.team.list()).length, before.length + 1);

  const promoted = await p.team.updateRole(member.id, "审批者");
  assert.equal(promoted.role, "审批者");

  await p.team.remove(member.id);
  assert.equal((await p.team.list()).length, before.length);
});

test("provider 之间互不共享状态", async () => {
  const a = createMockProvider();
  const b = createMockProvider();
  const countBefore = (await b.tasks.list()).length;
  await a.tasks.remove((await a.tasks.list())[0].id);
  assert.equal((await b.tasks.list()).length, countBefore);
});

test("返回的是副本，改它不会污染 provider 内部状态", async () => {
  const p = createMockProvider();
  const tasks = await p.tasks.list();
  tasks[0].title = "被外部改掉了";
  const again = await p.tasks.list();
  assert.notEqual(again[0].title, "被外部改掉了");
});

test("连接器：连接和断开会改开关，断开撤销该连接器的租约", async () => {
  const p = createMockProvider();
  await p.connectors.connect("calendar");
  assert.equal((await p.connectors.list()).calendar, true);

  const lease = await p.connectors.acquire("calendar", "只读日程", 600);
  assert.equal(lease.status, "active");

  await p.connectors.disconnect("calendar");
  assert.equal((await p.connectors.list()).calendar, false);
  const leases = await p.connectors.leases();
  assert.equal(leases.find((l) => l.id === lease.id).status, "revoked");
});

test("重置：改完再重置能回到出厂，且不影响 defaults", async () => {
  const p = createMockProvider();
  const factoryBefore = p.defaults();
  await p.tasks.remove((await p.tasks.list())[0].id);
  await p.connectors.connect("calendar");
  assert.notEqual((await p.tasks.list()).length, factoryBefore.tasks.length);

  const after = p.reset();
  assert.equal(after.tasks.length, factoryBefore.tasks.length);
  assert.equal(after.connectors.calendar, factoryBefore.connectors.calendar);
  assert.equal(p.defaults().tasks.length, factoryBefore.tasks.length, "defaults 始终是出厂数据");
});

test("brain：跑一轮，事件按游标推进，状态收敛到 finished", async () => {
  const p = createMockProvider();
  const session = await p.brain.start({
    agent: "claude-code",
    prompt: "汇总今天的竞品变化",
    taskId: "task-brain-1",
    runId: "run-brain-1",
    stepId: "step-brain-1",
  });
  assert.match(session.sessionId, /^ags-/);
  assert.equal(session.adapter, "claude", "claude-code 走 claude 适配器");

  // 第一批事件立刻可读，游标随之前进。
  const first = await p.brain.events(session.sessionId, 0);
  assert.ok(first.events.length > 0, "开局就该有 session.started");
  assert.equal(first.events[0].event, "session.started");
  assert.equal(first.events[0].taskId, "task-brain-1", "id 挂在每条事件上");
  assert.equal(first.events[0].runId, "run-brain-1");
  assert.equal(first.events[0].stepId, "step-brain-1");

  // 同一个游标再读一次不会重复拿到已读的事件。
  const again = await p.brain.events(session.sessionId, first.cursor);
  assert.equal(again.events.length, 0);
  assert.equal(again.cursor, first.cursor);

  await new Promise((r) => setTimeout(r, 2200));
  const rest = await p.brain.events(session.sessionId, first.cursor);
  const kinds = rest.events.map((e) => e.event);
  assert.ok(kinds.includes("turn.started"), "拿到 turn.started");
  const turn = rest.events.find((e) => e.event === "turn.started");
  assert.ok(turn.model, "turn.started 带模型名");

  const status = await p.brain.status(session.sessionId);
  assert.equal(status.state, "finished");
  assert.equal(status.turns, 1);
  assert.ok(status.usage.inputTokens > 0, "用量有数");

  const closed = await p.brain.close(session.sessionId);
  assert.equal(closed.exitCode, 0);
});

test("brain：会话不存在时明确报错，不是静默返回空", async () => {
  const p = createMockProvider();
  await assert.rejects(() => p.brain.events("ags-nope", 0), /No such session/);
  await assert.rejects(() => p.brain.status("ags-nope"), /No such session/);
  const closed = await p.brain.close("ags-nope");
  assert.equal(closed.exitCode, 1, "关一个不存在的会话是失败，不是成功");
});

test("brain：中断后会话就没了", async () => {
  const p = createMockProvider();
  const s = await p.brain.start({
    agent: "codex-cli", prompt: "x", taskId: "t", runId: "r", stepId: "s",
  });
  assert.equal(s.adapter, "codex");
  await p.brain.interrupt(s.sessionId);
  await assert.rejects(() => p.brain.status(s.sessionId), /No such session/);
});

test("brain：续接沿用原来的对话，没有可接的对话就报错", async () => {
  const p = createMockProvider();
  const first = await p.brain.start({
    agent: "claude-code", prompt: "记住 banana", taskId: "t", runId: "r1", stepId: "s1", mode: "governed",
  });
  const next = await p.brain.resume({
    sessionId: first.sessionId, prompt: "刚才让你记住什么", taskId: "t", runId: "r2", stepId: "s2",
  });
  assert.notEqual(next.sessionId, first.sessionId, "续接是一个新会话");
  await new Promise((r) => setTimeout(r, 2200));
  const { events } = await p.brain.events(next.sessionId, 0);
  const said = events.filter((e) => e.event === "output.delta").map((e) => e.message).join("");
  assert.match(said, /记住 banana/, "接上了原来的对话");
  assert.ok(events.every((e) => e.runId === "r2"), "事件挂在新的运行上");
  assert.equal(events.at(-1).event, "turn.completed");
  await assert.rejects(
    () => p.brain.resume({ sessionId: "ags-nope", prompt: "x", taskId: "t", runId: "r", stepId: "s" }),
    /no conversation to continue/,
  );
});

test("常设规则：加、列、删；删不存在的报错", async () => {
  const p = createMockProvider();
  assert.deepEqual((await p.agentRules.list()).rules, []);
  const rule = await p.agentRules.add({ tool: " Bash ", decision: "deny", commandPrefix: "git push", workspace: "" });
  assert.equal(rule.tool, "Bash");
  assert.equal(rule.workspace, undefined, "空工作区当作所有工作区");
  assert.equal(rule.createdBy, "console");
  assert.equal((await p.agentRules.list()).rules.length, 1);
  await p.agentRules.remove(rule.id);
  assert.equal((await p.agentRules.list()).rules.length, 0);
  await assert.rejects(() => p.agentRules.remove(rule.id), /No such rule/);
  await assert.rejects(() => p.agentRules.add({ tool: "  ", decision: "allow" }), /name a tool/);
});
