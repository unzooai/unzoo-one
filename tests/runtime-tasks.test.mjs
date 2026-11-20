import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mergeRuntimeArtifacts,
  mergeRuntimeTasks,
  runtimeArtifacts,
  usageSummary,
  titleFromRequest,
  promptOf,
  putSignature,
  scheduleOf,
  statusFrom,
  toRuntimePut,
  toTaskRun,
  watchOf,
  planFromRuntime,
  guessMailHost,
} from "../.test-build/runtime-tasks.mjs";

const task = {
  id: "task-1",
  title: "周报",
  description: "汇总本周提交",
  target: "演示仓库",
  status: "待确认",
  progress: 0,
  updated: "刚刚",
  schedule: "每周",
  scheduleTime: "17:30",
  scheduleDay: "周五",
  runs: [{ id: "run-old", status: "成功", startedAt: "2026-11-01T00:00:00Z", summary: "x" }],
};

test("推给运行时的：提示词、计划、暂停；运行记录不推", () => {
  const put = toRuntimePut(task);
  assert.equal(put.prompt, "周报\n汇总本周提交\nTarget: 演示仓库", "the label is in the interface language (English here)");
  assert.deepEqual(put.schedule, { kind: "weekly", time: "17:30", weekday: 5 });
  assert.equal(put.paused, false);
  assert.equal("runs" in put.console, false);
  assert.equal(toRuntimePut({ ...task, status: "已暂停" }).paused, true);
  assert.deepEqual(scheduleOf({ ...task, schedule: "每天", scheduleTime: undefined }), { kind: "daily", time: "09:00" });
  assert.equal(scheduleOf({ ...task, schedule: "仅运行一次" }), null);
});

test("工作日、每隔、定时一次；有变化就运行；长期负责的帮手", () => {
  assert.deepEqual(scheduleOf({ ...task, schedule: "工作日", scheduleTime: "08:15" }), { kind: "weekdays", time: "08:15" });
  assert.deepEqual(scheduleOf({ ...task, schedule: "每隔", scheduleEvery: 2 }), { kind: "every", minutes: 5 }, "at least five minutes");
  assert.deepEqual(scheduleOf({ ...task, schedule: "每隔", scheduleEvery: 90 }), { kind: "every", minutes: 90 });
  assert.deepEqual(scheduleOf({ ...task, schedule: "定时一次", scheduleAt: "2026-11-20T14:30" }), { kind: "once", at: "2026-11-20T14:30" });
  assert.equal(scheduleOf({ ...task, schedule: "定时一次", scheduleAt: "" }), null);
  assert.deepEqual(watchOf({ watch: { kind: "web", url: " https://example.com/a ", everyMinutes: 30 } }), {
    kind: "web",
    url: "https://example.com/a",
    every_minutes: 30,
  });
  assert.equal(watchOf({ watch: { kind: "web", url: "example.com", everyMinutes: 30 } }), null);
  assert.deepEqual(watchOf({ watch: { kind: "folder", path: "D:\inbox" } }), { kind: "folder", path: "D:\inbox" });
  const put = toRuntimePut({ ...task, helperAgent: "codex-cli", keepConversation: true, watchError: "boom" });
  assert.equal(put.agent, "codex-cli");
  assert.equal(put.keep_conversation, true);
  assert.equal("watchError" in put.console, false, "what the runtime reports is not pushed back");
  assert.equal(toRuntimePut(task).agent, null);
});

test("不是在页面上建的任务：按运行时的计划显示，推回去也不丢", () => {
  const remote = {
    id: "made-elsewhere",
    title: "盯发票",
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
    prompt: "整理新发票",
    schedule: { kind: "every", minutes: 30 },
    watch: { kind: "folder", path: "D:\\inbox" },
    agent: "codex-cli",
    keep_conversation: true,
    paused: false,
    console: {},
    runs: [],
  };
  const [made] = mergeRuntimeTasks([], [remote]);
  assert.equal(made.schedule, "每隔");
  assert.equal(made.scheduleEvery, 30);
  const put = toRuntimePut(made);
  assert.deepEqual(put.schedule, remote.schedule);
  assert.deepEqual(put.watch, remote.watch);
  assert.equal(put.agent, "codex-cli");
  assert.equal(put.keep_conversation, true);
  const weekly = mergeRuntimeTasks([], [{ ...remote, schedule: { kind: "weekly", time: "08:00", weekday: 3 } }])[0];
  assert.deepEqual(toRuntimePut(weekly).schedule, { kind: "weekly", time: "08:00", weekday: 3 });
});

test("监视邮件和日历：密码、地址不进任务", () => {
  const mail = { kind: "mail", address: " me@qq.com ", host: "", filter: "发票" };
  assert.deepEqual(watchOf({ watch: mail }), { kind: "mail", address: "me@qq.com", host: "", filter: "发票" });
  assert.equal(watchOf({ watch: { ...mail, address: "not-an-address" } }), null);
  assert.deepEqual(watchOf({ watch: { kind: "calendar", minutesBefore: 15 } }), { kind: "calendar", minutes_before: 15 });
  assert.equal(guessMailHost("someone@gmail.com"), "imap.gmail.com");
  assert.equal(guessMailHost("someone@example.org"), null);
  const put = toRuntimePut({ ...task, watch: mail, watchHasSecret: true });
  assert.equal("watchHasSecret" in put.console, false);
  assert.equal(JSON.stringify(put).includes("password"), false);
  assert.deepEqual(planFromRuntime({ watch: { kind: "calendar", minutes_before: 30 } }).watch, { kind: "calendar", minutesBefore: 30 });
});

test("运行时读回来的状态和进度变了，不算要再推", () => {
  const before = putSignature(task);
  assert.equal(putSignature({ ...task, status: "运行中", progress: 40, runs: [] }), before);
  assert.notEqual(putSignature({ ...task, title: "月报" }), before);
});

test("一次运行在控制台里的样子", () => {
  const waiting = toTaskRun({
    id: "run-1",
    attempt: 1,
    state: "running",
    started_at: "2026-11-10T11:40:45Z",
    waiting: true,
    session_id: "ags_1",
  });
  assert.equal(waiting.status, "运行中");
  assert.equal(waiting.summary, "Waiting for you to approve a tool call in your inbox");
  assert.equal(waiting.waiting, true);
  assert.equal(waiting.sessionId, "ags_1");

  const done = toTaskRun({
    id: "run-1",
    attempt: 1,
    state: "succeeded",
    started_at: "2026-11-10T11:40:45Z",
    ended_at: "2026-11-10T11:40:58Z",
    trigger: "schedule",
    summary: "已新建 hello.txt",
  });
  assert.equal(done.status, "成功");
  assert.equal(done.durationSeconds, 13);
  assert.equal(done.summary, "Scheduled run · 已新建 hello.txt");

  const lost = toTaskRun({ id: "r", attempt: 2, state: "interrupted", started_at: "x", error: "Unterm stopped" });
  assert.equal(lost.status, "失败");
  assert.equal(lost.errorMessage, "Unterm stopped");
  assert.equal(toTaskRun({ id: "r", attempt: 3, state: "cancelled", started_at: "x" }).status, "已取消");

  // The runtime's own reasons are said in the reader's language; an agent's
  // own error is shown as it came.
  const restarted = toTaskRun({
    id: "r", attempt: 4, state: "interrupted", started_at: "x",
    error: "the background service stopped before this run finished", error_code: "service_restarted",
  });
  assert.equal(restarted.errorMessage, "The background service stopped before this run finished");
  const notInstalled = toTaskRun({
    id: "r", attempt: 5, state: "failed", started_at: "x",
    error: "Codex CLI is not installed on this machine", error_code: "start_failed",
  });
  assert.equal(notInstalled.errorMessage, "The agent couldn't start: Codex CLI is not installed on this machine");
});

test("任务状态由最近一次运行决定", () => {
  const remote = (runs, paused = false) => ({ id: "t", title: "t", created_at: "", updated_at: "", paused, runs });
  const run = (state) => ({ id: state, attempt: 1, state, started_at: "2026-11-10T00:00:00Z" });
  assert.equal(statusFrom(remote([run("running")], true), "已暂停"), "运行中");
  assert.equal(statusFrom(remote([run("succeeded")], true), "已完成"), "已暂停");
  assert.equal(statusFrom(remote([run("succeeded")]), "运行中"), "已完成");
  assert.equal(statusFrom(remote([run("cancelled")]), "运行中"), "已暂停");
  assert.equal(statusFrom(remote([run("interrupted")]), "运行中"), "失败");
  assert.equal(statusFrom(remote([]), "待确认"), "待确认");
});

test("合并：只动运行时说了算的，刚发起的运行不闪掉，别处建的任务带上来", () => {
  const now = Date.parse("2026-11-10T12:00:10Z");
  const local = [
    { ...task, title: "周报（正在改）", runs: [{ id: "run-new", status: "运行中", startedAt: "2026-11-10T12:00:00Z", summary: "" }] },
    { ...task, id: "task-local-only", runs: [] },
  ];
  const remote = [
    {
      id: "task-1",
      title: "周报",
      created_at: "",
      updated_at: "",
      paused: false,
      runs: [{ id: "run-old", attempt: 1, state: "succeeded", started_at: "2026-11-01T00:00:00Z", summary: "上周的" }],
    },
    {
      id: "task-elsewhere",
      title: "另一台浏览器建的",
      created_at: "",
      updated_at: "",
      paused: false,
      console: { ...task, id: "task-elsewhere", title: "另一台浏览器建的" },
      runs: [],
    },
    { id: "task-gone", title: "刚删的", created_at: "", updated_at: "", paused: false, runs: [] },
  ];
  const merged = mergeRuntimeTasks(local, remote, now, new Set(["task-gone"]));
  assert.deepEqual(merged.map((t) => t.id), ["task-elsewhere", "task-1", "task-local-only"]);
  const mine = merged[1];
  assert.equal(mine.title, "周报（正在改）", "页面上正在改的不被覆盖");
  assert.equal(mine.status, "运行中", "刚发起、运行时还没记下的运行算在跑");
  assert.deepEqual(mine.runs.map((r) => r.id), ["run-new", "run-old"]);

  // 半分钟后运行时还没有它，就不再当它在跑。
  const later = mergeRuntimeTasks(local, remote, now + 60_000).find((t) => t.id === "task-1");
  assert.equal(later.status, "已完成");
  assert.deepEqual(later.runs.map((r) => r.id), ["run-old"]);
});

test("运行写下的文件进成果：同一文件只留最近一次，版本记写过几次", () => {
  const remote = [
    {
      id: "task-9",
      title: "Market scan",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      paused: false,
      workdir: "C:\\Users\\me\\Documents\\Unzoo One\\Market scan",
      runs: [
        {
          id: "run-2",
          attempt: 1,
          state: "succeeded",
          started_at: "2026-11-11T09:00:00Z",
          workdir: "C:\\Users\\me\\Documents\\Unzoo One\\Market scan",
          outputs: [
            { path: "report.md", size: 2048, modified: "2026-11-11T09:05:00Z" },
            { path: "data/prices.csv", size: 512, modified: "2026-11-11T09:04:00Z" },
          ],
        },
        {
          id: "run-1",
          attempt: 1,
          state: "succeeded",
          started_at: "2026-11-10T09:00:00Z",
          outputs: [{ path: "report.md", size: 1024, modified: "2026-11-10T09:05:00Z" }],
        },
      ],
    },
  ];
  const items = runtimeArtifacts(remote);
  assert.equal(items.length, 2);
  const report = items.find((item) => item.filename === "report.md");
  assert.equal(report.id, "out:task-9:report.md");
  assert.equal(report.type, "报告");
  assert.equal(report.format, "MD");
  assert.equal(report.sizeKb, 2);
  assert.equal(report.version, 2, "written by two runs");
  assert.equal(report.file.runId, "run-2", "the latest run's copy");
  assert.equal(report.file.absolutePath, "C:\\Users\\me\\Documents\\Unzoo One\\Market scan\\report.md");
  assert.equal(report.content, "", "read when chosen");
  const prices = items.find((item) => item.filename === "prices.csv");
  assert.equal(prices.type, "数据");
  assert.equal(prices.file.absolutePath, "C:\\Users\\me\\Documents\\Unzoo One\\Market scan\\data\\prices.csv");

  // 读过的内容和重点标记，文件没变时留着；页面自己的成果不动；任务没了的产出不留。
  const loaded = { ...report, content: "# Report", starred: true, file: { ...report.file, loaded: true } };
  const own = { ...report, id: "artifact-own", file: undefined, content: "mine" };
  const stale = { ...prices, id: "out:task-gone:x.md" };
  const merged = mergeRuntimeArtifacts([loaded, own, stale], items);
  assert.deepEqual(merged.map((item) => item.id).sort(), ["artifact-own", "out:task-9:data/prices.csv", "out:task-9:report.md"]);
  const kept = merged.find((item) => item.id === report.id);
  assert.equal(kept.content, "# Report");
  assert.equal(kept.starred, true);
  assert.equal(kept.file.loaded, true);

  // 下一次运行改了这个文件：内容要重读，重点标记还在。
  const rewritten = runtimeArtifacts([
    { ...remote[0], runs: [{ ...remote[0].runs[0], id: "run-3", outputs: [{ path: "report.md", size: 4096, modified: "2026-11-12T09:05:00Z" }] }] },
  ]);
  const next = mergeRuntimeArtifacts(merged, rewritten).find((item) => item.id === report.id);
  assert.equal(next.content, "");
  assert.equal(next.file.loaded, false);
  assert.equal(next.starred, true);
});

test("用量：只算本月，按智能体、按任务合计，多的在前", () => {
  const run = (id, agent, started_at, input, output) => ({
    id, attempt: 1, state: "succeeded", started_at, agent, usage: { input_tokens: input, output_tokens: output, cached_input_tokens: 10 },
  });
  const remote = [
    { id: "a", title: "Report", created_at: "", updated_at: "", paused: false, runs: [
      run("r1", "codex-cli", "2026-11-10T09:00:00Z", 1000, 100),
      run("r0", "codex-cli", "2026-10-30T09:00:00Z", 9999, 9999),
    ] },
    { id: "b", title: "Scan", created_at: "", updated_at: "", paused: false, runs: [
      run("r2", "claude-code", "2026-11-11T09:00:00Z", 5000, 500),
      { id: "r3", attempt: 1, state: "failed", started_at: "2026-11-11T10:00:00Z", agent: "claude-code" },
    ] },
  ];
  const summary = usageSummary(remote, new Date(2026, 10, 15));
  assert.equal(summary.runs, 3, "October's run is not this month's");
  assert.equal(summary.input, 6000);
  assert.equal(summary.output, 600);
  assert.equal(summary.cached, 20);
  assert.deepEqual(summary.byAgent.map((row) => [row.label, row.runs]), [["Claude Code", 2], ["Codex CLI", 1]]);
  assert.deepEqual(summary.byTask.map((row) => row.label), ["Scan", "Report"]);
});

test("直接输入需求：任务名取第一行，交给智能体时不重复", () => {
  assert.equal(titleFromRequest("Summarize this week's sales\nUse the CSVs in C:\\reports"), "Summarize this week's sales");
  assert.equal(titleFromRequest("Say hello in one short sentence. Do not use any tools, just reply."), "Say hello in one short sentence");
  assert.equal(titleFromRequest("整理本周销售数据。汇总成周报。"), "整理本周销售数据");
  assert.equal(titleFromRequest("Check example.com for broken links"), "Check example.com for broken links", "a dot inside a word is not a sentence end");
  // 只有一句、以句号结尾：去掉句号。
  assert.equal(titleFromRequest("Draft the release notes."), "Draft the release notes");
  const long = "Go through every invoice in the shared drive and list the ones that are overdue by more than thirty days";
  const title = titleFromRequest(long);
  assert.ok(title.endsWith("…") && title.length <= 61, title);
  assert.ok(long.startsWith(title.slice(0, -1)), "a prefix, cut at a word");
  assert.equal(titleFromRequest("整理本周的销售数据，按地区汇总成一页周报，存成 report.md，并标出环比下降超过百分之十的地区", 20).length, 21);

  const request = "Summarize this week's sales\nUse the CSVs in C:\\reports";
  assert.equal(promptOf({ title: titleFromRequest(request), description: request, target: "" }), request);
  assert.equal(promptOf({ title: titleFromRequest(long), description: long, target: "" }), long);
  // 名字是人改过的，就照旧放在最前面。
  assert.equal(promptOf({ title: "Weekly sales", description: request, target: "" }), `Weekly sales\n${request}`);
});

test("任务名取第一句时，交给智能体的话也不重复", () => {
  const request = "Say hello in one short sentence. Do not use any tools, just reply.";
  assert.equal(promptOf({ title: titleFromRequest(request), description: request, target: "" }), request);
});
