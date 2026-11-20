/**
 * Unzoo One 工作台的数据契约。
 *
 * 控制台目前跑在内存 mock 上（app/data/mock.ts）。这一层的存在是为了让
 * 组件只依赖契约，接真实后端时换实现而不动 UI。
 *
 * 后端对照（2026-08-29 实测 unterm 0.71.0 / unzoo 2.5.32）：
 *
 *   approvals.list        -> unterm approval.list
 *   approvals.decide      -> unterm approval.decide
 *   artifacts.list        -> unterm artifact.list
 *   artifacts.verify      -> unterm artifact.verify
 *   artifacts.remove      -> unterm artifact.forget
 *   artifacts.usage       -> unterm artifact.usage
 *   connectors.list       -> unterm provider.list
 *   connectors.diagnose   -> unterm provider.diagnose
 *   connectors.acquire    -> unterm provider.acquire / unzoo lease_request
 *   connectors.revoke     -> unterm provider.revoke_lease
 *   connectors.leases     -> unterm provider.leases / unzoo lease_list
 *   policy.check          -> unterm policy.check
 *   policy.set            -> unterm policy.set
 *   activity.list         -> unterm audit.verify（只有校验，没有列表，见下）
 *   tasks.*               -> 无对应 MCP 方法，见下
 *
 * 两处已知缺口：
 *
 * 1. 任务的增删改查。unterm 0.71 的 task 命名空间只有 task.export_evidence
 *    和 task.verify_evidence，没有 create / list / update / run。unterm-tasks
 *    crate 存在但没有对外方法，接的时候要么等它补，要么走 Core 的 IPC。
 *
 * 2. 运行记录的读取。audit 命名空间只有 audit.verify（验证证据链），
 *    没有分页查询事件的方法。
 *
 * 另外 ApprovalItem.icon 是 lucide 组件，属于 UI 关注点混进了领域模型。
 * 真实后端不会返回图标，接的时候由 UI 层按 action 或 risk 映射。
 */

import type { AgentRunSettings } from "./agent-run-settings";
import type { RuntimeOutputContent, RuntimeRun, RuntimeTask, RuntimeTaskPut, RuntimeThread } from "./runtime-tasks";
import type {
  ActivityItem,
  ApprovalItem,
  ArtifactItem,
  ConnectorCheckResult,
  ConnectorId,
  TaskItem,
  TeamMember,
} from "../types";

/** 审批决定。拒绝需要给出理由，会写进审计记录。 */
export type ApprovalDecision =
  /**
   * remember：只对托管会话的审批有效——把这次批准记成本项目的规则，同一个
   * 工具、同一条命令下次不再询问。拼接命令（&&、|、重定向…）unterm 不会记。
   */
  | { kind: "approve"; remember?: boolean }
  | { kind: "reject"; reason: string };

/** 能力租约。unterm provider.acquire 和 unzoo lease_request 的公共形状。 */
export type CapabilityLease = {
  id: string;
  capability: string;
  holder: string;
  scope: string;
  expiresAt: string;
  status: "active" | "pending" | "expired" | "revoked";
};

/** 策略检查结果。允许时 reason 为空，拒绝或需要审批时说明原因。 */
export type PolicyVerdict = {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
};

export interface TaskPort {
  list(): Promise<TaskItem[]>;
  get(id: string): Promise<TaskItem | null>;
  /**
   * id 由调用方给。本地优先：离线也能建任务，联网后按同一个 id 对账，
   * 免得界面拿着本地 id、后端拿着另一个 id，后续操作全对不上。
   */
  create(draft: Omit<TaskItem, "updated" | "progress"> & { progress?: number }): Promise<TaskItem>;
  update(id: string, patch: Partial<TaskItem>): Promise<TaskItem>;
  remove(id: string): Promise<void>;
  pause(id: string): Promise<TaskItem>;
  resume(id: string): Promise<TaskItem>;
  /** unterm task.export_evidence。返回证据包的下载地址或内容。 */
  exportEvidence(id: string): Promise<string>;
  /** unterm task.verify_evidence。校验证据链是否被篡改。 */
  verifyEvidence(id: string): Promise<boolean>;
}

export interface ApprovalPort {
  list(): Promise<ApprovalItem[]>;
  decide(id: string, decision: ApprovalDecision): Promise<void>;
  /** 批量决定。UI 的审批队列支持多选后一次处理。 */
  decideMany(ids: string[], decision: ApprovalDecision): Promise<void>;
  /** 稍后处理。截止时间到了重新回到队列，纯本地状态，后端不感知。 */
  defer(id: string, until: string): Promise<void>;
  /**
   * 托管会话里正在等答复的审批（unterm GET /api/agent/approvals）。
   *
   * 和 list() 分开：页面轮询它，只按 id 增删托管审批，不动本地队列里的其它
   * 审批。拒绝一条托管审批 = 拒绝并停止 agent 的这一轮，和控制台"拒绝后暂停
   * 任务"的语义一致。拿不到（不是 unterm 托管的控制台）就是空数组。
   */
  live(): Promise<ApprovalItem[]>;
}

export interface ArtifactPort {
  list(): Promise<ArtifactItem[]>;
  get(id: string): Promise<ArtifactItem | null>;
  update(id: string, patch: Partial<ArtifactItem>): Promise<ArtifactItem>;
  remove(id: string): Promise<void>;
  /** unterm artifact.verify。确认成果内容与产出时一致。 */
  verify(id: string): Promise<boolean>;
  /** unterm artifact.usage。返回本机占用与引用它的任务。 */
  usage(): Promise<{ totalKb: number; count: number }>;
}

export interface ActivityPort {
  list(): Promise<ActivityItem[]>;
  /** 导出全部事件，用于离线归档。 */
  exportAll(): Promise<string>;
}

export interface ConnectorPort {
  list(): Promise<Record<ConnectorId, boolean>>;
  /** 授权接入。租约是实现细节，界面上就是一个开关。 */
  connect(id: ConnectorId): Promise<void>;
  /** 断开并撤销这个连接器持有的全部租约。 */
  disconnect(id: ConnectorId): Promise<void>;
  /** unterm provider.diagnose。返回连通性和延迟，失败时带错误码。 */
  diagnose(id: ConnectorId): Promise<ConnectorCheckResult>;
  leases(): Promise<CapabilityLease[]>;
  acquire(capability: string, scope: string, ttlSeconds: number): Promise<CapabilityLease>;
  revoke(leaseId: string): Promise<void>;
}

export interface PolicyPort {
  /** unterm policy.check。执行副作用前问一次，决定是否要走审批。 */
  check(action: string, target: string): Promise<PolicyVerdict>;
  set(rules: Record<string, unknown>): Promise<void>;
}

/** 能驱动的 brain。和 unterm agent manifest 里的 id 对齐。 */
export type BrainId = "claude-code" | "codex-cli" | "opencode" | "agy";

/** 能交任务的一个 agent：这台机器上装了没有，能用哪些模式。 */
export type BrainAgent = {
  id: BrainId;
  name: string;
  installed: boolean;
  version?: string;
  /** 能托管：每次工具调用先进收件箱。控制台只把任务交给能托管的。 */
  hosted: boolean;
  /** 能受管：自带 shell 关掉，命令只能经 Unterm。 */
  governed: boolean;
  /** 登录了没有；null 是从外面看不出来（钥匙串之类），不猜。 */
  signedIn?: boolean | null;
  /** 在终端里登录要敲的命令。 */
  signInCommand?: string;
};

/**
 * brain 吐出的一条事件。字段是 unterm 那边 BrainEvent 的形状，原样带过来
 * 而不是先归一化：任务详情页要按 event 的类型分别渲染，早早压平反而丢信息。
 */
export type BrainEvent = {
  event: string;
  at: string;
  taskId?: string;
  runId?: string;
  stepId?: string;
  /** error 和 output.delta 带的文字。 */
  message?: string;
  /** output.delta 属于哪条流：assistant 是对用户说的话，reasoning 是推理文本。 */
  stream?: "assistant" | "reasoning";
  /** turn.started 带的模型名。 */
  model?: string;
  /** turn.completed / session.closed 的收敛状态。 */
  state?: string;
};

/**
 * 怎么跑这个 brain。
 *
 * - governed（受管）：CLI 自己的 shell 和联网工具关掉，命令只能经 Unterm
 *   执行；每个工具调用都先进收件箱等人批。只有 Claude Code 支持。
 * - hosted（托管）：CLI 照常用自己的工具，但每次调用都先进收件箱。
 * - headless：一问一答，不经收件箱。旧行为，只给不支持托管的场合留着。
 */
export type BrainMode = "governed" | "hosted" | "headless";

export type BrainSession = {
  sessionId: string;
  agent: BrainId;
  adapter: string;
  /**
   * 托管会话一轮结束后进程还在，等下一句话：会话状态一直是 running，
   * 这一轮结束要看 turn.completed 事件，不能等 status。
   */
  hosted?: boolean;
};

export type BrainStatus = {
  state: "running" | "finished" | "failed" | string;
  turns: number;
  /** 托管会话里正等人答复的审批数：agent 这时是在等人，不是在干活。 */
  pendingApprovals?: number;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
};

/**
 * 跑一个 brain。
 *
 * 只给 agent id 和提示词，不给命令行 —— 命令由 unterm 从 manifest 解析，
 * 页面这侧决定不了跑什么。taskId / runId / stepId 会挂到每一条事件上，
 * 任务详情页据此把事件归到对应的运行和步骤。
 */
export interface BrainPort {
  /** 能交任务的 agent（unterm 的 agent 清单 + 本机检测结果）。 */
  /** refresh：不用后台服务缓存的检测结果（刚装好、刚登录时）。 */
  agents(options?: { refresh?: boolean }): Promise<BrainAgent[]>;
  start(input: {
    agent: BrainId;
    prompt: string;
    taskId: string;
    runId: string;
    stepId: string;
    /** 缺省 headless。 */
    mode?: BrainMode;
    /** agent 在哪个目录里干活。不给就是 unterm 自己的工作目录。 */
    cwd?: string;
  }): Promise<BrainSession>;
  /**
   * 接着一个托管会话原来的对话说下一句：新会话、同一个 CLI 和工作目录，
   * CLI 自己把上下文接回来。原会话的进程没了也行（控制台或 unterm 重启过）。
   * 没有可接的对话时报错，不会悄悄开一段新的。
   */
  resume(input: {
    sessionId: string;
    prompt: string;
    taskId: string;
    runId: string;
    stepId: string;
  }): Promise<BrainSession>;
  /** 从 cursor 之后取事件，返回下一个 cursor。断了能从上次的位置续。 */
  events(sessionId: string, cursor: number): Promise<{ cursor: number; events: BrainEvent[] }>;
  status(sessionId: string): Promise<BrainStatus>;
  /** 停掉它和它启动的一切。 */
  interrupt(sessionId: string, graceMs?: number): Promise<void>;
  close(sessionId: string): Promise<{ exitCode: number; reason?: string }>;
}

/**
 * 托管会话的常设规则：某个工作区里某个工具（某条命令）以后自动批准或拒绝，
 * 不再进收件箱。只有人能定 —— 控制台这里，或审批时勾"记住"；agent 没有任何
 * 途径给自己加规则。
 */
export type AgentRule = {
  id: string;
  /** 对哪个目录（含子目录）生效；不给就是所有工作区。 */
  workspace?: string;
  /** CLI 里的工具名（Bash、shell、run_command…），不区分大小写；* 是任何工具。 */
  tool: string;
  /** 命令类工具：命令要以它开头（按整词）。放行规则不会匹配拼接命令。 */
  commandPrefix?: string;
  decision: "allow" | "deny";
  note?: string;
  createdAt: string;
  /** console：在设置里加的；remember：审批时勾了记住。 */
  createdBy: string;
};

export type AgentRuleDraft = {
  workspace?: string;
  tool: string;
  commandPrefix?: string;
  decision: "allow" | "deny";
  note?: string;
};

export interface AgentRulePort {
  /** store：规则存在哪个文件（unterm 的状态目录），演示版没有。 */
  list(): Promise<{ rules: AgentRule[]; store?: string }>;
  add(draft: AgentRuleDraft): Promise<AgentRule>;
  remove(id: string): Promise<void>;
}

export interface TeamPort {
  list(): Promise<TeamMember[]>;
  /** 和 tasks.create 一样，id 由调用方给，避免本地和后端各拿一个 id。 */
  invite(member: TeamMember): Promise<TeamMember>;
  updateRole(id: string, role: TeamMember["role"]): Promise<TeamMember>;
  remove(id: string): Promise<void>;
}

/**
 * 首屏种子。控制台是 SSR 渲染的，首屏必须同步拿到数据，改成异步加载会让
 * 首屏空白、既有的渲染断言也会失败。真实实现由 server component 预取后注入。
 */
export type WorkspaceSnapshot = {
  tasks: TaskItem[];
  approvals: ApprovalItem[];
  artifacts: ArtifactItem[];
  activity: ActivityItem[];
  members: TeamMember[];
  connectors: Record<ConnectorId, boolean>;
};

/**
 * 装好的 Unzoo One 里，任务归本机运行时（unterm）管：它存任务、跑任务、
 * 按计划定时跑，页面关了也照样。云端演示版没有运行时，available() 为 false，
 * 页面退回本地演示。
 */
/** 这台机器上智能体能用的：Unzoo One 的终端、Unzoo 浏览器。 */
export type RuntimeCapabilities = {
  /** 受管模式要把 Unzoo One 终端挂给智能体，靠 unterm-cli。 */
  terminal: { governedReady: boolean };
  browser: { installed: boolean; path?: string };
};

/** 智能体用的 Unzoo 浏览器：套餐、身份，以及它用哪个。 */
export type RuntimeBrowser = {
  installed: boolean;
  /** Unzoo 在运行、答得上话。 */
  reachable: boolean;
  plan?: string;
  maxProfiles?: number;
  profiles: { id: string; name: string }[];
  /** Unzoo One 给智能体预留的身份。 */
  reservedProfile: string;
  reserved: boolean;
  /** 设置里指定的身份；没指定是 null。 */
  chosen: string | null;
  /** 指定的身份已经不在了。 */
  chosenMissing: boolean;
  /** 智能体现在能用浏览器。 */
  ready: boolean;
  error?: string;
  reserveError?: string;
};

/** 智能体的一个终端此刻的画面。 */
/** What an agent's terminal printed, as it arrived (escapes and all), from line `firstRow` on. */
export type TerminalScreen = {
  sessionId: string;
  text: string;
  firstRow: number;
  rowCount: number;
  cols?: number;
  rows?: number;
};

/** 智能体的一个标签页此刻的样子。image 是可以直接放进 <img> 的 data URL。 */
export type TabView = { tabId: string; url?: string; title?: string; image?: string };

/** 一个技能：自带的，或你自己的（导入的、从对话存下来的）。 */
export type RuntimeSkill = {
  name: string;
  description: string;
  source: "builtin" | "user";
  enabled: boolean;
  path: string;
};

/** 这台机器上的一个 AI 客户端，以及它能不能用 Unzoo One 的终端和浏览器。 */
export type RuntimeClient = {
  id: string;
  name: string;
  detected: boolean;
  config: string;
  terminal: boolean;
  browser: boolean;
  /** 这个客户端读技能文件夹：接入终端时把 Unzoo One 的技能一起装进去。 */
  skills?: boolean;
  error?: string;
};

export type RuntimeClients = {
  /** 终端在客户端配置里的名字（产品名，如 unzoo-one）。 */
  server: string;
  terminalReady: boolean;
  browserInstalled: boolean;
  clients: RuntimeClient[];
};

/** 本机的一个 shell：装没装、版本、能不能一键装。 */
export type RuntimeShell = {
  id: string;
  name: string;
  description: string;
  installed: boolean;
  path: string;
  version: string | null;
  /** 一键安装用的命令；没有就是不能一键装。 */
  installCommand: string | null;
  /** 装的时候要管理员权限、装完要重启（WSL），只告诉人怎么装。 */
  installByHand: boolean;
  recommended: boolean;
  installing: boolean;
  installError: string | null;
};
export type RuntimeShells = {
  shells: RuntimeShell[];
  /** 新开的终端用哪个：设置里指定的（config），或者系统默认挑的（platform）。 */
  defaultShell: { source: string; argv: string[]; label: string; id: string | null };
  /** 终端里的程序看到的终端名（TERM_PROGRAM）。 */
  termProgram: string;
  termProgramDefault: string;
  termProgramPresets: string[];
};

/** 怎么告诉你：从你对“自己运行的任务”发来消息的回复里学到的规则和线索。 */
export type RuntimeTellWish = "now" | "later" | "silent";
export type RuntimeTellRule = { kind: string; wish: RuntimeTellWish; hours: string | null; said: string; at: string };
export type RuntimeTellClue = RuntimeTellRule & { count: number };
export type RuntimeTellRules = { rules: RuntimeTellRule[]; clues: RuntimeTellClue[] };

/** 插件：在 Unzoo One 旁边运行的程序，有自己的控制页面、状态和给智能体的工具。 */
export type RuntimePluginStatus = "running" | "starting" | "not_answering" | "failed" | "stopped" | "tools_only" | "broken";
export type RuntimePluginRole = {
  name: string;
  kind: "browser" | "agent";
  label: string;
  default: Record<string, string> | null;
  binding: Record<string, string> | null;
};
export type RuntimePlugin = {
  id: string;
  name: string;
  version: string;
  description: string;
  dir: string;
  enabled: boolean;
  status: RuntimePluginStatus;
  error: string | null;
  pageUrl: string | null;
  hasPage: boolean;
  mcpServer: string | null;
  tools: { name: string; does: string }[];
  roles: RuntimePluginRole[];
  domains: string[];
};
export type RuntimePlugins = { plugins: RuntimePlugin[]; browserProfiles: { id: string; name: string }[] };

/** 手机：同一个局域网（或 Tailscale）里的手机配对后，在手机上看对话、回答、发任务。 */
export type RuntimePhoneAddress = { ip: string; kind: string; url?: string; qr?: string };
export type RuntimePhoneDevice = { id: string; name: string; platform: string; scope: string; lastSeen: string; lastIp: string };
export type RuntimePhone = {
  enabled: boolean;
  port: number;
  addresses: RuntimePhoneAddress[];
  devices: RuntimePhoneDevice[];
  /** 正在生效的配对码：每个地址一个二维码。 */
  pairing?: { code: string; expiresAt: number; addresses: RuntimePhoneAddress[] };
};

export interface RuntimeTaskPort {
  available(): Promise<boolean>;
  list(): Promise<RuntimeTask[]>;
  put(task: RuntimeTaskPut): Promise<void>;
  remove(id: string): Promise<void>;
  /**
   * 跑一次。continueFrom：接着那个会话原来的对话说。followUp：接着这个任务
   * 自己的对话说（运行时找最近一次的会话；没有可接的就开新的）。
   */
  run(input: {
    taskId: string;
    runId?: string;
    prompt?: string;
    continueFrom?: string;
    followUp?: boolean;
    /** 让智能体把这段对话做过的事写成技能，这一轮结束后收进技能库。 */
    saveSkill?: boolean;
  }): Promise<RuntimeRun>;
  /** 这个任务的整段对话：每一轮说了什么、做了什么、答了什么，旧的在前。 */
  thread(taskId: string): Promise<RuntimeThread>;
  /** 停掉正在跑的那次。没有在跑的返回 false。 */
  stop(taskId: string): Promise<boolean>;
  /** 监视邮件、日历要的密码或地址：直接存进系统凭据库，不随任务保存。 */
  setWatchSecret(taskId: string, secret: string, kind: "mail" | "calendar"): Promise<void>;
  /** 这台机器上有哪些能力。 */
  capabilities(): Promise<RuntimeCapabilities>;
  /** 智能体的浏览器身份。读的时候，额度有空又没指定别的，运行时会把专用身份建好。 */
  browser(): Promise<RuntimeBrowser>;
  /** 智能体用过的终端此刻的画面（只认对话记录里出现过的）。 */
  /** Its recent output, or with `fromLine` only what came since (that line included). */
  terminalScreen(sessionId: string, fromLine?: number): Promise<TerminalScreen>;
  /** Keys the person typed into it, as the bytes a terminal sends. */
  terminalInput(sessionId: string, input: string): Promise<void>;
  /** 人做完了智能体请他做的事（或者做不了）。 */
  answerHandover(sessionId: string, handoverId: string, done: boolean, note?: string): Promise<void>;
  /** 把智能体的终端切到 Unzoo One 终端窗口的前台，让人接手。 */
  focusTerminal(sessionId: string): Promise<void>;
  /** 智能体用过的标签页此刻的样子。 */
  tabView(tabId: string): Promise<TabView>;
  /** 把智能体的标签页切到 Unzoo 浏览器的前台。 */
  activateTab(tabId: string): Promise<void>;
  /** 技能：交给智能体时作为插件挂上（目前是 Claude Code）。 */
  skills(): Promise<RuntimeSkill[]>;
  setSkillEnabled(name: string, enabled: boolean): Promise<RuntimeSkill[]>;
  /** 只能删你自己的；自带的只能关掉。 */
  deleteSkill(name: string): Promise<RuntimeSkill[]>;
  /** 导入一个含 SKILL.md 的文件夹。 */
  importSkill(path: string, replace?: boolean): Promise<{ imported: string; skills: RuntimeSkill[] }>;
  /** 本机的 AI 客户端（Claude 桌面版、Cursor、Codex…）接没接 Unzoo One。 */
  clients(): Promise<RuntimeClients>;
  /** 把 Unzoo One 的终端接入（或移出）某个客户端。 */
  connectClient(id: string, connect: boolean): Promise<void>;
  /** 本机的 shell，和新开的终端用哪个。 */
  shells(): Promise<RuntimeShells>;
  setDefaultShell(id: string): Promise<void>;
  /** 一键安装（winget / brew），在后台装，装好后 shells() 会显示已安装。 */
  installShell(id: string): Promise<void>;
  /** 终端里的程序看到的终端名；空字符串恢复默认。 */
  setTermProgram(name: string): Promise<void>;
  /** 学到的提醒规则（只存在本机）。 */
  tellRules(): Promise<RuntimeTellRules>;
  /** 忘掉一类事的规则和线索。 */
  forgetTellRule(kind: string): Promise<void>;
  plugins(): Promise<RuntimePlugins>;
  addPlugin(dir: string): Promise<string>;
  enablePlugin(id: string, enabled: boolean): Promise<void>;
  restartPlugin(id: string): Promise<void>;
  removePlugin(id: string): Promise<void>;
  bindPluginRole(id: string, role: string, value: Record<string, string> | null): Promise<void>;
  pluginLog(id: string): Promise<string>;
  /** 手机配对的状态。 */
  phone(): Promise<RuntimePhone>;
  /** 生成一个 2 分钟内有效的配对码（同时打开手机连接）。 */
  pairPhone(): Promise<RuntimePhone>;
  /** 取消一台手机的配对，它的令牌立即失效。 */
  unpairPhone(id: string): Promise<RuntimePhone>;
  /** 打开或关闭手机连接。 */
  setPhoneEnabled(enabled: boolean): Promise<RuntimePhone>;
  /** 运行 Unzoo 浏览器自己的接入程序（它会接入所有它认识的客户端）。 */
  setupBrowserForClients(): Promise<void>;
  /** 读一次运行写下的一个文件（只能读运行记录里列出的）。 */
  output(input: { taskId: string; runId: string; path: string }): Promise<RuntimeOutputContent>;
  /** 运行时跑任务用的设置：交给哪个 agent、在哪个目录、是否受管。 */
  settings(): Promise<AgentRunSettings>;
  saveSettings(settings: AgentRunSettings): Promise<AgentRunSettings>;
}

export interface WorkspaceProvider {
  tasks: TaskPort;
  approvals: ApprovalPort;
  artifacts: ArtifactPort;
  activity: ActivityPort;
  connectors: ConnectorPort;
  policy: PolicyPort;
  team: TeamPort;
  brain: BrainPort;
  agentRules: AgentRulePort;
  runtime: RuntimeTaskPort;
  /** 当前状态的同步快照，用于初始化组件 state。 */
  snapshot(): WorkspaceSnapshot;
  /**
   * 出厂数据，纯读、无副作用。
   *
   * 恢复备份和读取本地缓存时只存了 id，要回到完整实体得从全集里按 id 捞，
   * 而当时的"当前状态"可能已经出队或被改过，所以这份不能用 snapshot() 顶替。
   */
  defaults(): WorkspaceSnapshot;
  /** 丢弃全部改动，回到出厂状态并返回它。"重置工作区"走这里。 */
  reset(): WorkspaceSnapshot;
}
