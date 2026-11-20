import type { Bell, Globe2, Search, Send } from "lucide-react";

export type ViewId =
  | "home"
  | "tasks"
  | "approvals"
  | "artifacts"
  | "activity"
  | "plugins"
  | "settings";

export type SettingsSectionId =
  | "overview"
  | "usage"
  | "team"
  | "preferences"
  | "agents"
  | "data"
  | "connectors"
  | "security";

export type OnboardingStepId = "agent" | "profile" | "connectors" | "security" | "task";

export type WorkspaceRoute = {
  view: ViewId;
  taskId: string | null;
  runId: string | null;
  artifactId?: string | null;
  approvalId?: string | null;
  activityId?: string | null;
  activityTaskId?: string | null;
  taskFilter?: TaskFilter | null;
  approvalFilter?: ApprovalRiskFilter | null;
  activityFilter?: ActivityFilter | null;
  settingsSection?: SettingsSectionId | null;
};

export type WorkspaceHistoryState = {
  unzooOne: true;
  route: WorkspaceRoute;
  canPop: boolean;
};

export type TaskStatus = "运行中" | "待确认" | "失败" | "已完成" | "已暂停";

export type TaskFilter = "全部" | TaskStatus;

export type TaskSort = "状态优先" | "进度最高" | "名称";

export type TaskSchedule = "仅运行一次" | "每天" | "工作日" | "每周" | "每隔" | "定时一次";

/** 有变化就运行：一个网页（隔几分钟看一次），或一个文件夹（有新文件）。 */
export type TaskWatch =
  | { kind: "web"; url: string; everyMinutes: number }
  | { kind: "folder"; path: string }
  /** 新邮件。密码（应用专用密码/授权码）只进系统凭据库，不在这里。 */
  | { kind: "mail"; address: string; host: string; filter: string }
  /** 日历里的日程快开始了。日历的 iCal 地址只进系统凭据库。 */
  | { kind: "calendar"; minutesBefore: number };

export type Weekday = "周一" | "周二" | "周三" | "周四" | "周五" | "周六" | "周日";

export type TaskRunStatus = "运行中" | "成功" | "失败" | "已取消";

export type ArtifactType = "报告" | "数据" | "证据" | "草稿";

export type ArtifactFilter = "全部" | ArtifactType | "重点";

export type ArtifactSort = "最近更新" | "重点优先" | "文件名";

export type ArtifactStatus = "已完成" | "草稿" | "已修订";

export type SettingsState = {
  approval: boolean;
  local: boolean;
  notifications: boolean;
};

export type WorkspaceProfile = {
  name: string;
  description: string;
};

export type WorkspaceProfileFormErrors = Partial<
  Record<"name" | "description", string>
>;

export type DesktopNotificationPermission =
  | "checking"
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export type BudgetAlertThreshold = 50 | 75 | 90;

export type UsageSettings = {
  monthlyBudget: number;
  alertThreshold: BudgetAlertThreshold;
  pauseAtLimit: boolean;
};

export type ConnectorId = "browser" | "workspace" | "mail" | "calendar";

export type ConnectorState = Record<ConnectorId, boolean>;

export type ConnectorCheckResult = {
  checkedAt: string;
  latency: number;
};

export type ConnectorCheckState = Record<ConnectorId, ConnectorCheckResult | null>;

export type ConnectorDefinition = {
  id: ConnectorId;
  name: string;
  description: string;
  scope: string;
  dataFlow: string;
  credential: string;
  lastUsed: string;
  permissions: string[];
  icon: typeof Globe2;
  tone: "blue" | "green" | "amber" | "violet";
};

export type TeamRole = "所有者" | "管理员" | "审批者" | "成员";

export type TeamMemberStatus = "在线" | "离线" | "已邀请";

export type TeamRoleFilter = "全部" | "管理员" | "审批者" | "成员" | "待接受";

export type SettingsDraftTarget = "profile" | "budget" | "invite" | "member";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  avatar: string;
  tone: "blue" | "green" | "amber" | "violet";
  lastActive: string;
};

export type TeamInviteFormErrors = Partial<Record<"name" | "email", string>>;

export type TaskDeleteSnapshot = {
  tasks: TaskItem[];
  artifacts: ArtifactItem[];
  activity: ActivityItem[];
  approvals: ApprovalItem[];
  approvalDeferrals: ApprovalDeferrals;
  selectedTaskIds: string[];
  selectedApprovalId: string;
  selectedApprovalIds: string[];
  activityTaskId: string | null;
  artifactTaskId: string | null;
  restoreTaskId: string | null;
  isRunning: boolean;
  deletedCount: number;
};

export type ArtifactDeleteSnapshot = {
  artifact: ArtifactItem;
  index: number;
};

export type ApprovalRejectSnapshot = {
  tasks: TaskItem[];
  approvals: ApprovalItem[];
  approvalDeferrals: ApprovalDeferrals;
  approvalRiskFilter: ApprovalRiskFilter;
  selectedApprovalId: string;
  selectedApprovalIds: string[];
  rejectedCount: number;
  isRunning: boolean;
};

export type WorkspaceBackup = {
  version: 1;
  product: "Unzoo One";
  exportedAt: string;
  profile?: WorkspaceProfile;
  tasks: TaskItem[];
  settings: SettingsState;
  usage?: UsageSettings;
  connectors?: ConnectorState;
  members?: TeamMember[];
  approvalIds: string[];
  approvalDeferrals?: ApprovalDeferrals;
  activity: ActivityItem[];
  artifacts?: ArtifactItem[];
};

export type WorkspaceSyncSection =
  | "profile"
  | "tasks"
  | "approvals"
  | "artifacts"
  | "activity"
  | "settings"
  | "usage"
  | "connectors"
  | "team";

export type WorkspaceSyncConflict =
  | "profile"
  | "task"
  | "artifact"
  | "budget"
  | "member";

export type WorkspaceSyncData = {
  profile: WorkspaceProfile;
  tasks: TaskItem[];
  settings: SettingsState;
  usage: UsageSettings;
  connectors: ConnectorState;
  members: TeamMember[];
  approvalIds: string[];
  approvalDeferrals: ApprovalDeferrals;
  activity: ActivityItem[];
  artifacts: ArtifactItem[];
};

export type WorkspaceSyncSnapshot = WorkspaceSyncData & {
  version: 1;
  source: string;
  updatedAt: string;
};

export type WorkspaceSyncNotice = {
  id: string;
  sections: WorkspaceSyncSection[];
  conflicts: WorkspaceSyncConflict[];
};

export type WorkspacePersistenceStatus =
  | "saved"
  | "retrying"
  | "failed"
  | "temporary";

export type PendingWorkspaceImport = {
  backup: WorkspaceBackup;
  fileName: string;
  fileSize: number;
};

export type ApprovalRisk = "低风险" | "中风险" | "高风险";

export type ApprovalRiskFilter = "全部" | ApprovalRisk | "稍后";

export type ApprovalSnoozePreset = "15m" | "1h" | "tomorrow";

export type ApprovalDeferrals = Record<string, string>;

export type BulkApprovalDecision = "approve" | "reject";

export type ActivityKind = "任务" | "审批" | "系统";

export type ActivityFilter = "全部" | ActivityKind;

export type ActivitySort = "最新优先" | "最早优先";

export type ActivityTone = "blue" | "violet" | "green" | "amber" | "red" | "neutral";

export type ActivityIconKey =
  | "activity"
  | "brain"
  | "clock"
  | "copy"
  | "file"
  | "globe"
  | "settings"
  | "shield"
  | "sparkles"
  | "trash";

export type SearchResultKind = "task" | "artifact" | "view" | "action";

export type SearchResultSection = {
  id: string;
  label: string;
  results: SearchResult[];
  canClear?: boolean;
};

export type NotificationFilter = "全部" | "未读";

export type NotificationTarget = "approvals" | "activity" | "artifact" | "task";

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  target: NotificationTarget;
  targetId?: string;
  icon: typeof Bell;
  tone: "amber" | "blue" | "green" | "red";
};

export type TaskFormErrors = Partial<
  Record<"name" | "target" | "description" | "scheduleTime", string>
>;

export type TaskDraftSnapshot = {
  name: string;
  target: string;
  description: string;
  schedule: TaskSchedule;
  scheduleTime: string;
  scheduleDay: Weekday;
  approval: boolean;
};

export type TaskDraftRecovery = {
  version: 1;
  savedAt: string;
  editingTaskId: string | null;
  draft: TaskDraftSnapshot;
  baseline: TaskDraftSnapshot;
};

export type ArtifactDraftSnapshot = {
  title: string;
  filename: string;
  content: string;
};

export type ArtifactDraftRecovery = {
  version: 1;
  savedAt: string;
  artifactId: string;
  baseVersion: number;
  draft: ArtifactDraftSnapshot;
};

export type ArtifactFormErrors = Partial<
  Record<"title" | "filename" | "content", string>
>;

export type ActivityItem = {
  id: string;
  time: string;
  createdAt: string;
  title: string;
  detail: string;
  icon: ActivityIconKey;
  tone: ActivityTone;
  kind: ActivityKind;
  taskId?: string;
};

export type TaskRun = {
  id: string;
  status: TaskRunStatus;
  startedAt: string;
  durationSeconds?: number;
  summary: string;
  errorCode?: string;
  errorMessage?: string;
  /**
   * 这次运行交给的 unterm 托管会话。有它才能"继续对话"：会话关了、甚至
   * unterm 重启过，也能接着它原来的对话说下一句。
   */
  sessionId?: string;
  /** 正等人在收件箱批准一次工具调用。 */
  waiting?: boolean;
};

export type TaskRunStageStatus = "成功" | "失败" | "运行中" | "已取消" | "已跳过";

export type TaskRunStage = {
  id: string;
  title: string;
  detail: string;
  status: TaskRunStageStatus;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  target: string;
  status: TaskStatus;
  progress: number;
  updated: string;
  schedule?: TaskSchedule;
  scheduleTime?: string;
  scheduleDay?: Weekday;
  /** schedule 为“每隔”时，隔多少分钟。 */
  scheduleEvery?: number;
  /** schedule 为“定时一次”时，本地时间 YYYY-MM-DDTHH:MM。 */
  scheduleAt?: string;
  /** 有变化就运行。 */
  watch?: TaskWatch;
  /** 交给哪个智能体长期负责；不填用运行设置里的。 */
  helperAgent?: string;
  /** 定时和有变化时的运行接着上一次的对话，智能体记得做过什么。 */
  keepConversation?: boolean;
  /** 运行时最近一次查看监视对象时出的错（运行时写，不推回去）。 */
  watchError?: string;
  /** 邮件、日历的密码或地址是否已存进系统凭据库（运行时写，不推回去）。 */
  watchHasSecret?: boolean;
  requiresApproval?: boolean;
  pinned?: boolean;
  runs?: TaskRun[];
  lastError?: string;
  errorCode?: string;
  retryCount?: number;
};

export type ArtifactTable = {
  columns: string[];
  rows: string[][];
};

export type ArtifactRevision = {
  version: number;
  title: string;
  filename: string;
  content: string;
  createdAt: string;
  editor: string;
};

export type ArtifactItem = {
  id: string;
  taskId: string;
  title: string;
  filename: string;
  description: string;
  type: ArtifactType;
  status: ArtifactStatus;
  format: string;
  sizeKb: number;
  updated: string;
  createdAt: string;
  content: string;
  highlights: string[];
  table?: ArtifactTable;
  evidenceCount?: number;
  starred?: boolean;
  version?: number;
  editedAt?: string;
  editedBy?: string;
  revisions?: ArtifactRevision[];
  /** 智能体运行时写在本机的文件：内容在磁盘上，页面只读。 */
  file?: ArtifactFile;
};

export type ArtifactFile = {
  runId: string;
  /** 相对运行目录。 */
  path: string;
  modified: string;
  absolutePath?: string;
  /** 内容读回来了没有；读不了时是原因。 */
  loaded: boolean;
  binary?: boolean;
  truncated?: boolean;
  error?: string;
};

export type ApprovalItem = {
  id: string;
  taskId: string;
  title: string;
  reason: string;
  impact: string;
  action: string;
  target: string;
  scope: string;
  risk: ApprovalRisk;
  requestedAt: string;
  expiresAt: string;
  policy: string;
  icon: typeof Send;
};

export type SearchResult = {
  key: string;
  kind: SearchResultKind;
  id: string;
  title: string;
  description: string;
  meta: string;
  icon: typeof Search;
};
