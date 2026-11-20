/**
 * 内存实现。数据来自 app/data/mock.ts，改动只活在当前页面生命周期里。
 *
 * 这是控制台目前实际跑的实现，也是接真实后端前的行为基准：新实现要让
 * 组件表现不变，才算接对了。
 */

import { t } from "../i18n";
import {
  defaultConnectorStates,
  initialActivityItems,
  initialApprovals,
  initialArtifacts,
  initialTasks,
  initialTeamMembers,
  connectorTestLatencies,
} from "../data/mock";
import type {
  ActivityItem,
  ApprovalItem,
  ArtifactItem,
  ConnectorCheckResult,
  ConnectorId,
  TaskItem,
  TeamMember,
} from "../types";
import type {
  ActivityPort,
  AgentRule,
  AgentRulePort,
  ApprovalDecision,
  ApprovalPort,
  ArtifactPort,
  BrainEvent,
  BrainPort,
  BrainSession,
  CapabilityLease,
  ConnectorPort,
  PolicyPort,
  PolicyVerdict,
  TaskPort,
  TeamPort,
  WorkspaceProvider,
  WorkspaceSnapshot,
} from "./provider";

/** 高风险动作的关键词。policy.check 的 mock 判据，真实实现走 unterm 的策略引擎。 */
// Matched against the action text, which can be in either language: these
// are data, not interface text, so they are not translated.
const externalSendKeywords = ["发送", "上传", "分享", "提交", "发布", "send", "upload", "share", "submit", "publish"];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowLabel(): string {
  return t("刚刚更新");
}

export function createMockProvider(): WorkspaceProvider {
  // ApprovalItem 和 ConnectorDefinition 带 lucide 组件，不能走 JSON 深拷贝。
  let tasks: TaskItem[] = clone(initialTasks);
  let approvals: ApprovalItem[] = initialApprovals.slice();
  let artifacts: ArtifactItem[] = clone(initialArtifacts);
  let activity: ActivityItem[] = clone(initialActivityItems);
  let members: TeamMember[] = clone(initialTeamMembers);
  const connectors: Record<ConnectorId, boolean> = { ...defaultConnectorStates };
  const leases: CapabilityLease[] = [];

  const taskPort: TaskPort = {
    async list() {
      return clone(tasks);
    },
    async get(id) {
      const found = tasks.find((t) => t.id === id);
      return found ? clone(found) : null;
    },
    async create(draft) {
      if (tasks.some((t) => t.id === draft.id)) throw new Error(t("任务 id 已存在: {id}", { id: draft.id }));
      const task: TaskItem = { progress: 0, ...clone(draft), updated: nowLabel() };
      tasks = [task, ...tasks];
      return clone(task);
    },
    async update(id, patch) {
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error(t("任务不存在: {id}", { id }));
      tasks[index] = { ...tasks[index], ...clone(patch), updated: nowLabel() };
      return clone(tasks[index]);
    },
    async remove(id) {
      tasks = tasks.filter((t) => t.id !== id);
      artifacts = artifacts.filter((a) => a.taskId !== id);
      approvals = approvals.filter((a) => a.taskId !== id);
    },
    async pause(id) {
      return taskPort.update(id, { status: "已暂停" });
    },
    async resume(id) {
      return taskPort.update(id, { status: "运行中" });
    },
    async exportEvidence(id) {
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error(t("任务不存在: {id}", { id }));
      const related = artifacts.filter((a) => a.taskId === id);
      return JSON.stringify({ task, artifacts: related, exportedAt: new Date().toISOString() }, null, 2);
    },
    async verifyEvidence(id) {
      return tasks.some((t) => t.id === id);
    },
  };

  const approvalPort: ApprovalPort = {
    async list() {
      return approvals.slice();
    },
    // 内存实现没有托管会话。
    async live() {
      return [];
    },
    async decide(id, decision) {
      return approvalPort.decideMany([id], decision);
    },
    async decideMany(ids, decision) {
      const handled = approvals.filter((a) => ids.includes(a.id));
      approvals = approvals.filter((a) => !ids.includes(a.id));
      for (const item of handled) {
        activity = [
          {
            id: nextId("activity"),
            time: nowLabel(),
            createdAt: new Date().toISOString(),
            title: decision.kind === "approve" ? t("已批准：{title}", { title: item.title }) : t("已拒绝：{title}", { title: item.title }),
            detail: decision.kind === "approve" ? item.impact : decision.reason,
            icon: "shield",
            tone: decision.kind === "approve" ? "green" : "red",
            kind: "审批",
            taskId: item.taskId,
          },
          ...activity,
        ];
      }
    },
    async defer() {
      // 稍后处理只改本地队列顺序，后端不感知，mock 不做事。
    },
  };

  const artifactPort: ArtifactPort = {
    async list() {
      return clone(artifacts);
    },
    async get(id) {
      const found = artifacts.find((a) => a.id === id);
      return found ? clone(found) : null;
    },
    async update(id, patch) {
      const index = artifacts.findIndex((a) => a.id === id);
      if (index === -1) throw new Error(t("成果不存在: {id}", { id }));
      artifacts[index] = { ...artifacts[index], ...clone(patch), updated: nowLabel() };
      return clone(artifacts[index]);
    },
    async remove(id) {
      artifacts = artifacts.filter((a) => a.id !== id);
    },
    async verify(id) {
      return artifacts.some((a) => a.id === id);
    },
    async usage() {
      return {
        totalKb: artifacts.reduce((sum, a) => sum + a.sizeKb, 0),
        count: artifacts.length,
      };
    },
  };

  const activityPort: ActivityPort = {
    async list() {
      return clone(activity);
    },
    async exportAll() {
      return JSON.stringify(activity, null, 2);
    },
  };

  const connectorPort: ConnectorPort = {
    async list() {
      return { ...connectors };
    },
    async connect(id) {
      connectors[id] = true;
    },
    async disconnect(id) {
      connectors[id] = false;
      for (const lease of leases) {
        if (lease.capability === id && lease.status === "active") lease.status = "revoked";
      }
    },
    async diagnose(id): Promise<ConnectorCheckResult> {
      return { checkedAt: nowLabel(), latency: connectorTestLatencies[id] };
    },
    async leases() {
      return clone(leases);
    },
    async acquire(capability, scope, ttlSeconds) {
      const lease: CapabilityLease = {
        id: nextId("lease"),
        capability,
        holder: "unzoo-one-console",
        scope,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        status: "active",
      };
      leases.push(lease);
      return clone(lease);
    },
    async revoke(leaseId) {
      const lease = leases.find((l) => l.id === leaseId);
      if (lease) lease.status = "revoked";
    },
  };

  const policyPort: PolicyPort = {
    async check(action, target): Promise<PolicyVerdict> {
      const external = externalSendKeywords.some((k) => action.toLowerCase().includes(k));
      if (!external) return { allowed: true, requiresApproval: false };
      return {
        allowed: true,
        requiresApproval: true,
        reason: t("{action} 会把内容送到 {target}，属于外部发送，需要先确认。", { action, target }),
      };
    },
    async set() {
      // mock 不持久化策略，真实实现走 unterm policy.set。
    },
  };

  const teamPort: TeamPort = {
    async list() {
      return clone(members);
    },
    async invite(member) {
      if (members.some((m) => m.id === member.id)) throw new Error(t("成员 id 已存在: {id}", { id: member.id }));
      members = [...members, clone(member)];
      return clone(member);
    },
    async updateRole(id, role) {
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) throw new Error(t("成员不存在: {id}", { id }));
      members[index] = { ...members[index], role };
      return clone(members[index]);
    },
    async remove(id) {
      members = members.filter((m) => m.id !== id);
    },
  };

  /**
   * 演示用的 brain。按真实事件的顺序和形状放出来，让任务详情页在没有本机
   * unterm 时也有东西可渲染 —— 云端演示版走的就是这条。
   */
  const brainSessions = new Map<string, { events: BrainEvent[]; startedAt: number }>();

  /** 演示会话说过的话，续接时用来证明"接上了"。 */
  const brainTranscripts = new Map<string, { agent: BrainSession["agent"]; prompts: string[] }>();

  function playTurn(
    agent: BrainSession["agent"],
    prompt: string,
    ids: { taskId: string; runId: string; stepId: string },
    reply: string,
  ): BrainSession {
    const sessionId = nextId("ags");
    const at = new Date().toISOString();
    brainSessions.set(sessionId, {
      startedAt: Date.now(),
      events: [
        { event: "session.started", at, ...ids },
        { event: "turn.started", at, model: agent === "claude-code" ? "claude-opus-5" : "gpt-5-codex", ...ids },
        { event: "output.delta", at, stream: "assistant", message: reply, ...ids },
        { event: "usage.updated", at, ...ids },
        { event: "turn.completed", at, state: "finished", ...ids },
      ],
    });
    return { sessionId, agent, adapter: agent === "claude-code" ? "claude" : "codex" };
  }

  const brainPort: BrainPort = {
    async agents() {
      return [
        { id: "claude-code", name: "Claude Code", installed: true, hosted: true, governed: true, signedIn: true, signInCommand: "claude" },
        { id: "codex-cli", name: "Codex CLI", installed: true, hosted: true, governed: false, signedIn: true, signInCommand: "codex login" },
        { id: "opencode", name: "OpenCode", installed: false, hosted: true, governed: false, signedIn: false, signInCommand: "opencode auth login" },
      ];
    },
    async start({ agent, prompt, taskId, runId, stepId }) {
      const session = playTurn(agent, prompt, { taskId, runId, stepId }, t("收到：{slice}", { slice: prompt.slice(0, 40) }));
      brainTranscripts.set(session.sessionId, { agent, prompts: [prompt] });
      return session;
    },
    async resume({ sessionId, prompt, taskId, runId, stepId }) {
      const earlier = brainTranscripts.get(sessionId);
      if (!earlier) throw new Error(t("会话 {sessionId} 没有可以接着的对话", { sessionId }));
      const session = playTurn(
        earlier.agent,
        prompt,
        { taskId, runId, stepId },
        t("接着上次（{slice}）：{slice2}", { slice: earlier.prompts[0].slice(0, 20), slice2: prompt.slice(0, 40) }),
      );
      brainTranscripts.set(session.sessionId, {
        agent: earlier.agent,
        prompts: [...earlier.prompts, prompt],
      });
      return session;
    },
    async events(sessionId, cursor) {
      const session = brainSessions.get(sessionId);
      if (!session) throw new Error(t("会话不存在: {sessionId}", { sessionId }));
      // 按经过的时间逐条放出来，让界面看到的是流式而不是一次到齐。
      const available = Math.min(
        session.events.length,
        Math.floor((Date.now() - session.startedAt) / 400) + 1,
      );
      return { cursor: available, events: session.events.slice(cursor, available) };
    },
    async status(sessionId) {
      const session = brainSessions.get(sessionId);
      if (!session) throw new Error(t("会话不存在: {sessionId}", { sessionId }));
      const done = Date.now() - session.startedAt > session.events.length * 400;
      return {
        state: done ? "finished" : "running",
        turns: done ? 1 : 0,
        usage: { inputTokens: done ? 1200 : 0, outputTokens: done ? 340 : 0, cachedInputTokens: 0 },
      };
    },
    async interrupt(sessionId) {
      brainSessions.delete(sessionId);
    },
    async close(sessionId) {
      const existed = brainSessions.delete(sessionId);
      return existed ? { exitCode: 0 } : { exitCode: 1, reason: t("会话已经结束") };
    },
  };

  /** 演示版的常设规则：只活在这一页里，真规则在 unterm 的状态目录。 */
  let agentRules: AgentRule[] = [];
  const agentRulePort: AgentRulePort = {
    async list() {
      return { rules: clone(agentRules) };
    },
    async add(draft) {
      const tool = draft.tool.trim();
      if (!tool) throw new Error(t("规则要写明是哪个工具"));
      const rule: AgentRule = {
        id: nextId("rule"),
        tool,
        decision: draft.decision,
        workspace: draft.workspace?.trim() || undefined,
        commandPrefix: draft.commandPrefix?.trim() || undefined,
        note: draft.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
        createdBy: "console",
      };
      agentRules = [...agentRules, rule];
      return clone(rule);
    },
    async remove(id) {
      const before = agentRules.length;
      agentRules = agentRules.filter((rule) => rule.id !== id);
      if (agentRules.length === before) throw new Error(t("没有这条规则：{id}", { id }));
    },
  };

  function snapshot(): WorkspaceSnapshot {
    return {
      tasks: clone(tasks),
      approvals: approvals.slice(),
      artifacts: clone(artifacts),
      activity: clone(activity),
      members: clone(members),
      connectors: { ...connectors },
    };
  }

  function defaults(): WorkspaceSnapshot {
    return {
      tasks: clone(initialTasks),
      approvals: initialApprovals.slice(),
      artifacts: clone(initialArtifacts),
      activity: clone(initialActivityItems),
      members: clone(initialTeamMembers),
      connectors: { ...defaultConnectorStates },
    };
  }

  function reset(): WorkspaceSnapshot {
    const factory = defaults();
    tasks = factory.tasks;
    approvals = factory.approvals;
    artifacts = factory.artifacts;
    activity = factory.activity;
    members = factory.members;
    Object.assign(connectors, factory.connectors);
    leases.length = 0;
    return snapshot();
  }

  return {
    tasks: taskPort,
    approvals: approvalPort,
    artifacts: artifactPort,
    activity: activityPort,
    connectors: connectorPort,
    policy: policyPort,
    team: teamPort,
    brain: brainPort,
    runtime: {
      // 演示版没有本机运行时：任务留在页面里，由页面自己演示运行。
      async available() {
        return false;
      },
      async list() {
        return [];
      },
      async put() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async remove() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async run() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async thread() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async stop() {
        return false;
      },
      async setWatchSecret() {},
      async output() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async capabilities() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async browser() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async terminalScreen() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async terminalInput() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async answerHandover() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async focusTerminal() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async tabView() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async activateTab() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async skills() {
        return [];
      },
      async clients() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async connectClient() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async shells() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async setDefaultShell() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async installShell() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async setTermProgram() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async tellRules() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async forgetTellRule() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async plugins() {
        return { plugins: [], browserProfiles: [] };
      },
      async addPlugin(): Promise<string> {
        throw new Error(t("演示版没有本机运行时"));
      },
      async enablePlugin() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async restartPlugin() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async removePlugin() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async bindPluginRole() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async pluginLog() {
        return "";
      },
      async phone() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async pairPhone() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async unpairPhone() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async setPhoneEnabled() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async setupBrowserForClients() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async setSkillEnabled() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async deleteSkill() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async importSkill() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async settings() {
        throw new Error(t("演示版没有本机运行时"));
      },
      async saveSettings() {
        throw new Error(t("演示版没有本机运行时"));
      },
    },
    agentRules: agentRulePort,
    snapshot,
    defaults,
    reset,
  };
}
