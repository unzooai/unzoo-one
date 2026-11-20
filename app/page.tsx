"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Bell,
  Building2,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileJson,
  FileText,
  Files,
  FolderOpen,
  Globe2,
  HardDrive,
  History,
  Home,
  ListChecks,
  Link2,
  MessagesSquare,
  Puzzle,
  LoaderCircle,
  Mail,
  Pause,
  Pencil,
  Pin,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Bot,
  Star,
  Table2,
  Timer,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  SquareTerminal,
} from "lucide-react";

import type {
  ActivityFilter,
  ActivityIconKey,
  ActivityItem,
  ActivitySort,
  ApprovalDeferrals,
  ApprovalItem,
  ApprovalRejectSnapshot,
  ApprovalRiskFilter,
  ApprovalSnoozePreset,
  ArtifactDeleteSnapshot,
  ArtifactDraftRecovery,
  ArtifactDraftSnapshot,
  ArtifactFilter,
  ArtifactFormErrors,
  ArtifactItem,
  ArtifactRevision,
  ArtifactSort,
  ArtifactType,
  BudgetAlertThreshold,
  BulkApprovalDecision,
  ConnectorCheckState,
  ConnectorId,
  ConnectorState,
  DesktopNotificationPermission,
  NotificationFilter,
  NotificationItem,
  OnboardingStepId,
  PendingWorkspaceImport,
  SearchResult,
  SearchResultKind,
  SearchResultSection,
  SettingsDraftTarget,
  SettingsSectionId,
  SettingsState,
  TaskDeleteSnapshot,
  TaskDraftRecovery,
  TaskDraftSnapshot,
  TaskFilter,
  TaskFormErrors,
  TaskItem,
  TaskRun,
  TaskRunStage,
  TaskRunStageStatus,
  TaskSchedule,
  TaskSort,
  TaskStatus,
  TeamInviteFormErrors,
  TeamMember,
  TeamRole,
  TeamRoleFilter,
  UsageSettings,
  ViewId,
  Weekday,
  WorkspaceBackup,
  WorkspaceHistoryState,
  WorkspacePersistenceStatus,
  WorkspaceProfile,
  WorkspaceProfileFormErrors,
  WorkspaceRoute,
  WorkspaceSyncConflict,
  WorkspaceSyncData,
  WorkspaceSyncNotice,
  WorkspaceSyncSection,
  WorkspaceSyncSnapshot,
} from "./types";

const settingsDraftDiscardCopy: Record<
  SettingsDraftTarget,
  { eyebrow: string; title: string; description: string; discardLabel: string }
> = {
  profile: {
    eyebrow: t("工作区资料尚未保存"),
    title: t("放弃这次工作区资料修改？"),
    description: t("名称和说明会恢复为当前已保存的内容。"),
    discardLabel: t("放弃修改"),
  },
  budget: {
    eyebrow: t("预算尚未保存"),
    title: t("放弃这次预算调整？"),
    description: t("月度额度、提醒阈值和到限保护会恢复为当前已保存的设置。"),
    discardLabel: t("放弃调整"),
  },
  invite: {
    eyebrow: t("邀请尚未发送"),
    title: t("放弃这份成员邀请？"),
    description: t("已经填写的姓名、工作邮箱和成员角色不会被保留。"),
    discardLabel: t("放弃邀请"),
  },
  member: {
    eyebrow: t("角色尚未保存"),
    title: t("放弃这次角色修改？"),
    description: t("成员会继续使用当前角色，新选择的权限不会生效。"),
    discardLabel: t("放弃修改"),
  },
};
const weekdays: Weekday[] = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const taskSchedules: TaskSchedule[] = ["仅运行一次", "每天", "每周"];
const taskDraftRecoveryKey = "unzoo-one-task-draft-recovery";
/** 直接输入需求时一段话的上限；演示版的“结果要求”仍是 500。 */
const requestMaxLength = 4000;
const artifactDraftRecoveryKey = "unzoo-one-artifact-draft-recovery";
const workspaceSyncKey = "unzoo-one-workspace-sync";
const workspaceLastBackupKey = "unzoo-one-last-backup-at";
const onboardingPreferenceKey = "unzoo-one-onboarding-dismissed";
const legacyWorkspaceStorageKeys = [
  "unzoo-one-tasks",
  "unzoo-one-settings",
  "unzoo-one-usage",
  "unzoo-one-connectors",
  "unzoo-one-team",
  "unzoo-one-pending-approvals",
  "unzoo-one-activity",
  "unzoo-one-artifacts",
] as const;
const workspacePreferenceStorageKeys = [
  "unzoo-one-recent-searches",
  "unzoo-one-read-notifications",
  workspaceLastBackupKey,
  onboardingPreferenceKey,
] as const;
const taskDraftRecoveryMaxAge = 7 * 24 * 60 * 60 * 1000;
const workspaceSyncSectionLabels: Record<WorkspaceSyncSection, string> = {
  profile: t("工作区资料"),
  tasks: t("任务"),
  approvals: t("待确认操作"),
  artifacts: t("成果"),
  activity: t("运行记录"),
  settings: t("工作设置"),
  usage: t("预算"),
  connectors: t("连接器"),
  team: t("团队成员"),
};
const defaultWorkspaceProfile: WorkspaceProfile = {
  name: t("我的工作区"),
  description: t("交给 AI 的任务、审批与成果"),
};
const defaultSettings: SettingsState = {
  approval: true,
  local: true,
  notifications: false,
};
const defaultUsageSettings: UsageSettings = {
  monthlyBudget: 1000,
  alertThreshold: 75,
  pauseAtLimit: true,
};
const defaultConnectorChecks: ConnectorCheckState = {
  browser: { checkedAt: t("2 分钟前"), latency: 184 },
  workspace: { checkedAt: t("8 分钟前"), latency: 42 },
  mail: null,
  calendar: null,
};
import {
  connectorCatalog,
  connectorErrorCodes,
  connectorTestLatencies,
  demoTaskIds,
  runSteps,
  signalPoints,
  taskTemplates,
  teamRoleDetails,
  teamSeatLimit,
} from "./data/mock";
import type { ApprovalDecision, BrainAgent, BrainEvent, RuntimeBrowser, RuntimeCapabilities } from "./lib/provider";
import { brainModeFor, readAgentRunSettings } from "./lib/agent-run-settings";
import { turnOutcome } from "./lib/brain-events";
import {
  anyRunning,
  mergeRuntimeArtifacts,
  mergeRuntimeTasks,
  outputArtifactId,
  runtimeArtifacts,
  usageSummary,
  type RuntimeTask,
  promptOf,
  putSignature,
  titleFromRequest,
  toRuntimePut,
} from "./lib/runtime-tasks";
import { AgentRunPanel } from "./agent-run-panel";
import { RuntimeFocusCard } from "./runtime-focus";
import { Conversations, type ConversationPlan } from "./conversations";
import { SkillsPanel } from "./skills-panel";
import { ClientsPanel } from "./clients-panel";
import { PhonePanel } from "./phone-panel";
import { TerminalPanel } from "./terminal-panel";
import { TellRulesPanel } from "./tell-rules-panel";
import { PluginsView } from "./plugins-view";
import { RuntimeUsagePanel } from "./runtime-usage";
import { RuntimeCapabilitiesPanel } from "./runtime-capabilities";
import { autostartEnabled, inDesktopApp, openTerminal, revealPath, setAutostart } from "./lib/core-connection";
import { applyDocumentLanguage, chooseLocale, dateLocale, locale, locales, t, type Locale } from "./i18n";
import { getWorkspaceProvider } from "./lib/workspace-provider";
import { isMarkdown, MarkdownView } from "./markdown-view";
import { agentApprovalId, isAgentApprovalId, reconcileAgentApprovals } from "./lib/agent-approvals";

// 组件不再直接读 mock：首屏种子和出厂数据都从 provider 拿，换实现时这里不用动。
const workspaceProvider = getWorkspaceProvider();
const workspaceSeed = workspaceProvider.snapshot();
const workspaceDefaults = workspaceProvider.defaults();

const teamRoleFilters: TeamRoleFilter[] = [
  "全部",
  "管理员",
  "审批者",
  "成员",
  "待接受",
];

function isConnectorState(value: unknown): value is ConnectorState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ConnectorState>;
  return (
    typeof state.browser === "boolean" &&
    typeof state.workspace === "boolean" &&
    typeof state.mail === "boolean" &&
    typeof state.calendar === "boolean"
  );
}

function isTaskDraftSnapshot(value: unknown): value is TaskDraftSnapshot {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<TaskDraftSnapshot>;
  return (
    typeof draft.name === "string" &&
    draft.name.length <= 80 &&
    typeof draft.target === "string" &&
    draft.target.length <= 240 &&
    typeof draft.description === "string" &&
    draft.description.length <= requestMaxLength &&
    typeof draft.schedule === "string" &&
    taskSchedules.includes(draft.schedule as TaskSchedule) &&
    typeof draft.scheduleTime === "string" &&
    (draft.scheduleTime === "" ||
      /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.scheduleTime)) &&
    typeof draft.scheduleDay === "string" &&
    weekdays.includes(draft.scheduleDay as Weekday) &&
    typeof draft.approval === "boolean"
  );
}

function parseTaskDraftRecovery(value: unknown): TaskDraftRecovery | null {
  if (!value || typeof value !== "object") return null;
  const recovery = value as Partial<TaskDraftRecovery>;
  const savedAt = recovery.savedAt ? Date.parse(recovery.savedAt) : Number.NaN;
  const age = Date.now() - savedAt;
  if (
    recovery.version !== 1 ||
    Number.isNaN(savedAt) ||
    age < -5 * 60 * 1000 ||
    age > taskDraftRecoveryMaxAge ||
    (recovery.editingTaskId !== null &&
      (typeof recovery.editingTaskId !== "string" ||
        recovery.editingTaskId.length > 160)) ||
    !isTaskDraftSnapshot(recovery.draft) ||
    !isTaskDraftSnapshot(recovery.baseline)
  ) {
    return null;
  }
  return recovery as TaskDraftRecovery;
}

function isArtifactDraftSnapshot(value: unknown): value is ArtifactDraftSnapshot {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<ArtifactDraftSnapshot>;
  return (
    typeof draft.title === "string" &&
    draft.title.length <= 100 &&
    typeof draft.filename === "string" &&
    draft.filename.length <= 120 &&
    typeof draft.content === "string" &&
    draft.content.length <= 100000
  );
}

function parseArtifactDraftRecovery(
  value: unknown,
): ArtifactDraftRecovery | null {
  if (!value || typeof value !== "object") return null;
  const recovery = value as Partial<ArtifactDraftRecovery>;
  const savedAt = recovery.savedAt ? Date.parse(recovery.savedAt) : Number.NaN;
  const age = Date.now() - savedAt;
  if (
    recovery.version !== 1 ||
    Number.isNaN(savedAt) ||
    age < -5 * 60 * 1000 ||
    age > taskDraftRecoveryMaxAge ||
    typeof recovery.artifactId !== "string" ||
    recovery.artifactId.length > 160 ||
    typeof recovery.baseVersion !== "number" ||
    !Number.isInteger(recovery.baseVersion) ||
    recovery.baseVersion < 1 ||
    !isArtifactDraftSnapshot(recovery.draft)
  ) {
    return null;
  }
  return recovery as ArtifactDraftRecovery;
}

function formatDraftSavedAt(savedAt: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(savedAt));
}

function formatBackupFreshness(savedAt: string | null) {
  if (!savedAt) return t("尚未创建");
  const savedTime = Date.parse(savedAt);
  if (Number.isNaN(savedTime)) return t("时间未知");
  const elapsed = Math.max(0, Date.now() - savedTime);
  if (elapsed < 60 * 1000) return t("刚刚");
  if (elapsed < 60 * 60 * 1000) {
    return t("{floor} 分钟前", { floor: Math.floor(elapsed / (60 * 1000)) });
  }
  if (elapsed < 24 * 60 * 60 * 1000) {
    return t("{floor} 小时前", { floor: Math.floor(elapsed / (60 * 60 * 1000)) });
  }
  return formatDraftSavedAt(savedAt);
}

function getWorkspaceToday() {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat(dateLocale(), {
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  const greeting =
    hour < 6 ? t("夜深了") : hour < 12 ? t("早上好") : hour < 18 ? t("下午好") : t("晚上好");
  return {
    eyebrow: t("今天 · {month} 月 {day} 日", { month, day }),
    greeting,
  };
}

function clearDraftRecoveryStorage(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Browsers may disable session storage; the active form remains usable.
  }
}

function removeLocalStorageItems(keys: readonly string[]) {
  let cleared = true;
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      cleared = false;
    }
  }
  return cleared;
}

function getWorkspacePersistenceError(error: unknown, clearing = false) {
  const errorName =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  const quotaExceeded =
    errorName === "QuotaExceededError" ||
    errorName === "NS_ERROR_DOM_QUOTA_REACHED";

  if (clearing) {
    return t("浏览器阻止了本机数据清理。请重试，或先导出备份后检查浏览器的站点存储权限。");
  }
  if (quotaExceeded) {
    return t("本机存储空间不足，新的修改还没有安全落盘。请导出备份并清理浏览器站点数据后重试。");
  }
  return t("浏览器暂时阻止了本机保存，当前页面中的修改仍然保留。请重试保存或立即导出备份。");
}

function DraftRecoveryNotice({
  id,
  icon: Icon,
  title,
  description,
  continueLabel,
  onContinue,
  onDiscard,
}: {
  id: string;
  icon: typeof Save;
  title: string;
  description: string;
  continueLabel: string;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  return (
    <section
      className="draft-recovery"
      role="status"
      aria-labelledby={`${id}-title`}
    >
      <span className="draft-recovery-icon">
        <Icon size={19} />
      </span>
      <span className="draft-recovery-copy">
        <strong id={`${id}-title`}>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="draft-recovery-actions">
        <button className="continue" type="button" onClick={onContinue}>
          <RotateCcw size={15} />
          {continueLabel}
        </button>
        <button type="button" onClick={onDiscard}>
          
          {t("放弃草稿")}
        </button>
      </span>
    </section>
  );
}

function isUsageSettings(value: unknown): value is UsageSettings {
  if (!value || typeof value !== "object") return false;
  const usage = value as Partial<UsageSettings>;
  return (
    typeof usage.monthlyBudget === "number" &&
    Number.isFinite(usage.monthlyBudget) &&
    usage.monthlyBudget >= 100 &&
    usage.monthlyBudget <= 50000 &&
    [50, 75, 90].includes(usage.alertThreshold ?? 0) &&
    typeof usage.pauseAtLimit === "boolean"
  );
}

function isTeamMember(value: unknown): value is TeamMember {
  if (!value || typeof value !== "object") return false;
  const member = value as Partial<TeamMember>;
  return (
    typeof member.id === "string" &&
    typeof member.name === "string" &&
    typeof member.email === "string" &&
    ["所有者", "管理员", "审批者", "成员"].includes(member.role ?? "") &&
    ["在线", "离线", "已邀请"].includes(member.status ?? "") &&
    typeof member.avatar === "string" &&
    ["blue", "green", "amber", "violet"].includes(member.tone ?? "") &&
    typeof member.lastActive === "string"
  );
}

function getWorkspaceInitial(name: string) {
  const normalized = name.trim();
  if (!normalized) return "U";
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((word) => /^[a-z0-9]/i.test(word))) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return Array.from(normalized)[0].toUpperCase();
}

function isTaskRun(value: unknown): value is TaskRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<TaskRun>;
  return (
    typeof run.id === "string" &&
    ["运行中", "成功", "失败", "已取消"].includes(run.status ?? "") &&
    typeof run.startedAt === "string" &&
    !Number.isNaN(Date.parse(run.startedAt)) &&
    (run.durationSeconds === undefined ||
      (typeof run.durationSeconds === "number" &&
        Number.isFinite(run.durationSeconds) &&
        run.durationSeconds >= 0)) &&
    typeof run.summary === "string" &&
    (run.errorCode === undefined || typeof run.errorCode === "string") &&
    (run.errorMessage === undefined || typeof run.errorMessage === "string") &&
    (run.sessionId === undefined || typeof run.sessionId === "string")
  );
}

function isTaskItem(value: unknown): value is TaskItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TaskItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.target === "string" &&
    ["运行中", "待确认", "失败", "已完成", "已暂停"].includes(
      item.status ?? "",
    ) &&
    typeof item.progress === "number" &&
    Number.isFinite(item.progress) &&
    typeof item.updated === "string" &&
    (item.schedule === undefined ||
      ["仅运行一次", "每天", "工作日", "每周", "每隔", "定时一次"].includes(item.schedule)) &&
    (item.scheduleEvery === undefined || typeof item.scheduleEvery === "number") &&
    (item.scheduleAt === undefined || typeof item.scheduleAt === "string") &&
    (item.helperAgent === undefined || typeof item.helperAgent === "string") &&
    (item.keepConversation === undefined || typeof item.keepConversation === "boolean") &&
    (item.scheduleTime === undefined || typeof item.scheduleTime === "string") &&
    (item.scheduleDay === undefined || weekdays.includes(item.scheduleDay)) &&
    (item.requiresApproval === undefined ||
      typeof item.requiresApproval === "boolean") &&
    (item.pinned === undefined || typeof item.pinned === "boolean") &&
    (item.runs === undefined ||
      (Array.isArray(item.runs) && item.runs.every(isTaskRun))) &&
    (item.lastError === undefined || typeof item.lastError === "string") &&
    (item.errorCode === undefined || typeof item.errorCode === "string") &&
    (item.retryCount === undefined ||
      (typeof item.retryCount === "number" &&
        Number.isInteger(item.retryCount) &&
        item.retryCount >= 0))
  );
}

function isArtifactItem(value: unknown): value is ArtifactItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ArtifactItem>;
  const validTable =
    item.table === undefined ||
    (Array.isArray(item.table.columns) &&
      item.table.columns.every((column) => typeof column === "string") &&
      Array.isArray(item.table.rows) &&
      item.table.rows.every(
        (row) =>
          Array.isArray(row) && row.every((cell) => typeof cell === "string"),
      ));
  const validRevisions =
    item.revisions === undefined ||
    (Array.isArray(item.revisions) &&
      item.revisions.every(
        (revision) =>
          revision &&
          typeof revision === "object" &&
          typeof revision.version === "number" &&
          Number.isFinite(revision.version) &&
          typeof revision.title === "string" &&
          typeof revision.filename === "string" &&
          typeof revision.content === "string" &&
          typeof revision.createdAt === "string" &&
          typeof revision.editor === "string",
      ));
  return (
    typeof item.id === "string" &&
    typeof item.taskId === "string" &&
    typeof item.title === "string" &&
    typeof item.filename === "string" &&
    typeof item.description === "string" &&
    ["报告", "数据", "证据", "草稿"].includes(item.type ?? "") &&
    ["已完成", "草稿", "已修订"].includes(item.status ?? "") &&
    typeof item.format === "string" &&
    typeof item.sizeKb === "number" &&
    Number.isFinite(item.sizeKb) &&
    typeof item.updated === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.content === "string" &&
    Array.isArray(item.highlights) &&
    item.highlights.every((highlight) => typeof highlight === "string") &&
    validTable &&
    (item.evidenceCount === undefined ||
      (typeof item.evidenceCount === "number" &&
        Number.isFinite(item.evidenceCount))) &&
    (item.starred === undefined || typeof item.starred === "boolean") &&
    (item.version === undefined ||
      (typeof item.version === "number" &&
        Number.isFinite(item.version) &&
        item.version >= 1)) &&
    (item.editedAt === undefined || typeof item.editedAt === "string") &&
    (item.editedBy === undefined || typeof item.editedBy === "string") &&
    validRevisions
  );
}

/** 大数字说短一点：31,412 → 31K。 */
function compactNumber(value: number): string {
  return new Intl.NumberFormat(dateLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** 本机文件的内容不进浏览器存储：它在磁盘上，下次选中时再读。 */
function persistableArtifact(item: ArtifactItem): ArtifactItem {
  return item.file ? { ...item, content: "", file: { ...item.file, loaded: false, error: undefined } } : item;
}

function isActivityItem(value: unknown): value is ActivityItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ActivityItem>;
  return (
    typeof item.id === "string" &&
    typeof item.time === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.title === "string" &&
    typeof item.detail === "string" &&
    [
      "activity",
      "brain",
      "clock",
      "copy",
      "file",
      "globe",
      "settings",
      "shield",
      "sparkles",
      "trash",
    ].includes(item.icon ?? "") &&
    ["blue", "violet", "green", "amber", "red", "neutral"].includes(
      item.tone ?? "",
    ) &&
    ["任务", "审批", "系统"].includes(item.kind ?? "") &&
    (item.taskId === undefined || typeof item.taskId === "string")
  );
}

function isSettingsState(value: unknown): value is SettingsState {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<SettingsState>;
  return (
    typeof settings.approval === "boolean" &&
    typeof settings.local === "boolean" &&
    typeof settings.notifications === "boolean"
  );
}

function isWorkspaceProfile(value: unknown): value is WorkspaceProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<WorkspaceProfile>;
  return (
    typeof profile.name === "string" &&
    profile.name.trim().length >= 2 &&
    profile.name.trim().length <= 40 &&
    typeof profile.description === "string" &&
    profile.description.trim().length >= 4 &&
    profile.description.trim().length <= 100
  );
}

function isApprovalDeferrals(value: unknown): value is ApprovalDeferrals {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([approvalId, deferredUntil]) =>
      approvalId.length > 0 &&
      typeof deferredUntil === "string" &&
      !Number.isNaN(Date.parse(deferredUntil)),
  );
}

function parseWorkspaceSyncSnapshot(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<WorkspaceSyncSnapshot>;
    if (
      parsed.version !== 1 ||
      typeof parsed.source !== "string" ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt)) ||
      (parsed.profile !== undefined && !isWorkspaceProfile(parsed.profile)) ||
      !Array.isArray(parsed.tasks) ||
      parsed.tasks.length === 0 ||
      !parsed.tasks.every(isTaskItem) ||
      !isSettingsState(parsed.settings) ||
      !isUsageSettings(parsed.usage) ||
      !isConnectorState(parsed.connectors) ||
      !Array.isArray(parsed.members) ||
      parsed.members.length === 0 ||
      !parsed.members.every(isTeamMember) ||
      !Array.isArray(parsed.approvalIds) ||
      !parsed.approvalIds.every((id) => typeof id === "string") ||
      (parsed.approvalDeferrals !== undefined &&
        !isApprovalDeferrals(parsed.approvalDeferrals)) ||
      !Array.isArray(parsed.activity) ||
      !parsed.activity.every(isActivityItem) ||
      !Array.isArray(parsed.artifacts) ||
      !parsed.artifacts.every(isArtifactItem)
    ) {
      return null;
    }
    return {
      ...parsed,
      profile: parsed.profile ?? { ...defaultWorkspaceProfile },
      approvalDeferrals: parsed.approvalDeferrals ?? {},
    } as WorkspaceSyncSnapshot;
  } catch {
    return null;
  }
}

function workspaceSyncSignature(data: WorkspaceSyncData) {
  return JSON.stringify({
    profile: data.profile,
    tasks: data.tasks,
    settings: data.settings,
    usage: data.usage,
    connectors: data.connectors,
    members: data.members,
    approvalIds: data.approvalIds,
    approvalDeferrals: data.approvalDeferrals,
    activity: data.activity,
    artifacts: data.artifacts,
  });
}

function getWorkspaceSyncSections(
  current: WorkspaceSyncData,
  incoming: WorkspaceSyncData,
) {
  const sections: WorkspaceSyncSection[] = [];
  if (JSON.stringify(current.profile) !== JSON.stringify(incoming.profile)) {
    sections.push("profile");
  }
  if (JSON.stringify(current.tasks) !== JSON.stringify(incoming.tasks)) {
    sections.push("tasks");
  }
  if (
    JSON.stringify({
      ids: current.approvalIds,
      deferrals: current.approvalDeferrals,
    }) !==
    JSON.stringify({
      ids: incoming.approvalIds,
      deferrals: incoming.approvalDeferrals,
    })
  ) {
    sections.push("approvals");
  }
  if (JSON.stringify(current.artifacts) !== JSON.stringify(incoming.artifacts)) {
    sections.push("artifacts");
  }
  if (JSON.stringify(current.activity) !== JSON.stringify(incoming.activity)) {
    sections.push("activity");
  }
  if (JSON.stringify(current.settings) !== JSON.stringify(incoming.settings)) {
    sections.push("settings");
  }
  if (JSON.stringify(current.usage) !== JSON.stringify(incoming.usage)) {
    sections.push("usage");
  }
  if (
    JSON.stringify(current.connectors) !==
    JSON.stringify(incoming.connectors)
  ) {
    sections.push("connectors");
  }
  if (JSON.stringify(current.members) !== JSON.stringify(incoming.members)) {
    sections.push("team");
  }
  return sections;
}

function parseWorkspaceBackup(value: unknown): WorkspaceBackup {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid workspace backup");
  }
  const backup = value as Partial<WorkspaceBackup>;
  if (
    backup.version !== 1 ||
    backup.product !== "Unzoo One" ||
    typeof backup.exportedAt !== "string" ||
    Number.isNaN(Date.parse(backup.exportedAt)) ||
    (backup.profile !== undefined && !isWorkspaceProfile(backup.profile)) ||
    !Array.isArray(backup.tasks) ||
    backup.tasks.length === 0 ||
    !backup.tasks.every(isTaskItem) ||
    !backup.settings ||
    typeof backup.settings.approval !== "boolean" ||
    typeof backup.settings.local !== "boolean" ||
    typeof backup.settings.notifications !== "boolean" ||
    (backup.usage !== undefined && !isUsageSettings(backup.usage)) ||
    (backup.connectors !== undefined && !isConnectorState(backup.connectors)) ||
    (backup.members !== undefined &&
      (!Array.isArray(backup.members) ||
        backup.members.length === 0 ||
        !backup.members.every(isTeamMember))) ||
    !Array.isArray(backup.approvalIds) ||
    !backup.approvalIds.every((id) => typeof id === "string") ||
    (backup.approvalDeferrals !== undefined &&
      !isApprovalDeferrals(backup.approvalDeferrals)) ||
    !Array.isArray(backup.activity) ||
    !backup.activity.every(isActivityItem) ||
    (backup.artifacts !== undefined &&
      (!Array.isArray(backup.artifacts) ||
        !backup.artifacts.every(isArtifactItem)))
  ) {
    throw new Error("Invalid workspace backup");
  }
  return {
    ...backup,
    profile: backup.profile ?? { ...defaultWorkspaceProfile },
    approvalDeferrals: backup.approvalDeferrals ?? {},
  } as WorkspaceBackup;
}

function getApprovalSnoozeUntil(
  preset: ApprovalSnoozePreset,
  now = new Date(),
) {
  const deferredUntil = new Date(now);
  if (preset === "15m") {
    deferredUntil.setMinutes(deferredUntil.getMinutes() + 15);
  } else if (preset === "1h") {
    deferredUntil.setHours(deferredUntil.getHours() + 1);
  } else {
    deferredUntil.setDate(deferredUntil.getDate() + 1);
    deferredUntil.setHours(9, 0, 0, 0);
  }
  return deferredUntil;
}

function formatApprovalDeferredUntil(value: string, nowMs = Date.now()) {
  const deferredUntil = new Date(value);
  const remainingMs = deferredUntil.getTime() - nowMs;
  if (Number.isNaN(deferredUntil.getTime()) || remainingMs <= 0) {
    return t("现在重新提醒");
  }
  const timeLabel = deferredUntil.toLocaleTimeString(dateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (remainingMs < 60 * 60 * 1000) {
    return t("{max} 分钟后 · {timeLabel}", { max: Math.max(1, Math.ceil(remainingMs / 60000)), timeLabel });
  }
  const now = new Date(nowMs);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    deferredUntil.getFullYear() === tomorrow.getFullYear() &&
    deferredUntil.getMonth() === tomorrow.getMonth() &&
    deferredUntil.getDate() === tomorrow.getDate();
  if (isTomorrow) return t("明天 {timeLabel}", { timeLabel });
  if (remainingMs < 24 * 60 * 60 * 1000) return t("今天 {timeLabel}", { timeLabel });
  return deferredUntil.toLocaleString(dateLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSchedule(
  schedule: TaskSchedule = "仅运行一次",
  time = "09:00",
  day: Weekday = "周一",
  every?: number,
  at?: string,
) {
  if (schedule === "每天") return t("每天 {time}", { time });
  if (schedule === "工作日") return t("工作日 {time}", { time });
  if (schedule === "每周") return t("每{day} {time}", { day: t(day), time });
  if (schedule === "每隔") return formatEvery(every ?? 60);
  if (schedule === "定时一次" && at) return t("{at} 运行一次", { at: at.replace("T", " ") });
  return t("立即运行一次");
}

function formatEvery(minutes: number) {
  if (minutes % 1440 === 0) return t("每 {count} 天", { count: minutes / 1440 });
  if (minutes % 60 === 0) return minutes === 60 ? t("每小时") : t("每 {count} 小时", { count: minutes / 60 });
  return t("每 {count} 分钟", { count: minutes });
}

/** 任务头上那颗按钮的字：什么时候运行，加上有变化时运行。 */
function formatTaskTrigger(task: TaskItem) {
  const parts: string[] = [];
  if (task.schedule && task.schedule !== "仅运行一次") parts.push(formatTaskSchedule(task));
  if (task.watch?.kind === "web") parts.push(t("网页变化时"));
  if (task.watch?.kind === "folder") parts.push(t("有新文件时"));
  if (task.watch?.kind === "mail") parts.push(t("收到新邮件时"));
  if (task.watch?.kind === "calendar") parts.push(t("日程开始前"));
  return parts.length ? parts.join(" · ") : formatTaskSchedule(task);
}

function formatApprovalDecisionLabel(action: string) {
  if (action.startsWith(t("允许"))) {
    return t("批准{slice}", { slice: action.slice(2) });
  }
  return t("批准并{action}", { action });
}

function formatTaskSchedule(task: TaskItem) {
  return formatSchedule(
    task.schedule ?? "仅运行一次",
    task.scheduleTime ?? "09:00",
    task.scheduleDay ?? "周一",
    task.scheduleEvery,
    task.scheduleAt,
  );
}

function formatTaskRunTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("时间未知");
  return date.toLocaleString(dateLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTaskRunDuration(seconds?: number) {
  if (seconds === undefined) return t("进行中");
  if (seconds < 60) return t("{seconds} 秒", { seconds });
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes ? t("{hours} 小时 {minutes} 分", { hours, minutes }) : t("{hours} 小时", { hours });
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? t("{minutes} 分 {remainder} 秒", { minutes, remainder }) : t("{minutes} 分钟", { minutes });
}

function stopActiveTaskRuns(
  runs: TaskRun[] | undefined,
  summary: string,
  stoppedAt = new Date(),
) {
  let stopped = false;
  return (runs ?? []).map((run) => {
    if (stopped || run.status !== "运行中") return run;
    stopped = true;
    const startedAt = new Date(run.startedAt).getTime();
    const elapsed = Number.isNaN(startedAt)
      ? 1
      : Math.max(1, Math.round((stoppedAt.getTime() - startedAt) / 1000));
    return {
      ...run,
      status: "已取消" as const,
      durationSeconds: elapsed,
      summary,
    };
  });
}

function getTaskRunStages(run: TaskRun): TaskRunStage[] {
  const failedDuringAuthorization =
    run.status === "失败" &&
    /AUTH|PERMISSION|ACCESS/.test(
      `${run.errorCode ?? ""} ${run.errorMessage ?? ""}`,
    );
  const executionStatus: TaskRunStageStatus =
    run.status === "运行中"
      ? "运行中"
      : run.status === "成功"
        ? "成功"
        : run.status === "已取消"
          ? "已取消"
          : failedDuringAuthorization
            ? "已跳过"
            : "失败";

  return [
    {
      id: "configuration",
      title: t("载入任务配置"),
      detail: t("已读取任务目标、运行计划和执行边界。"),
      status: "成功",
    },
    {
      id: "authorization",
      title: t("验证连接器与权限"),
      detail: failedDuringAuthorization
        ? run.errorMessage ?? t("连接器授权验证未通过。")
        : t("连接器和审批边界已通过运行前检查。"),
      status: failedDuringAuthorization ? "失败" : "成功",
    },
    {
      id: "execution",
      title: t("执行任务步骤"),
      detail:
        executionStatus === "已跳过"
          ? t("为避免越过授权边界，系统没有进入外部执行。")
          : run.summary,
      status: executionStatus,
    },
    {
      id: "audit",
      title: t("保存结果与审计"),
      detail:
        run.status === "运行中"
          ? t("运行结束后会保存结果、耗时和完整审计。")
          : t("运行结果和安全边界已写入本机审计记录。"),
      status: run.status === "运行中" ? "已跳过" : "成功",
    },
  ];
}

function formatAuditTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat(dateLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date(createdAt))
    .replace(/\//g, "-");
}

function getNextRunLabel(task: TaskItem) {
  if (task.status === "已暂停") return t("恢复任务后重新计算");
  if (task.schedule === "每天") return t("明天 {value}", { value: task.scheduleTime ?? "09:00" });
  if (task.schedule === "工作日") return t("下一个工作日 {value}", { value: task.scheduleTime ?? "09:00" });
  if (task.schedule === "每隔") return formatEvery(task.scheduleEvery ?? 60);
  if (task.schedule === "定时一次" && task.scheduleAt) return task.scheduleAt.replace("T", " ");
  if (task.schedule === "每周") {
    return t("下一个{value} {value2}", { value: t(task.scheduleDay ?? "周一"), value2: task.scheduleTime ?? "09:00" });
  }
  return task.status === "已完成" ? "已完成" : t("创建后立即运行");
}

const navItems: Array<{
  id: ViewId;
  label: string;
  mobileLabel: string;
  icon: typeof Home;
}> = [
  { id: "home", label: t("首页"), mobileLabel: t("首页"), icon: Home },
  { id: "tasks", label: t("任务"), mobileLabel: t("任务"), icon: ListChecks },
  { id: "approvals", label: t("待确认的操作"), mobileLabel: t("确认"), icon: ShieldCheck },
  { id: "artifacts", label: t("成果"), mobileLabel: t("成果"), icon: Files },
  { id: "activity", label: t("运行记录"), mobileLabel: t("记录"), icon: History },
  { id: "settings", label: t("设置"), mobileLabel: t("设置"), icon: Settings2 },
];

/**
 * 装好的产品：首页就是对话（任务就是一段对话），没有单独的任务页；运行记录
 * 是演示版的本地日志，这里也不要。
 */
const runtimeNavItems: typeof navItems = [
  { id: "home", label: t("任务"), mobileLabel: t("任务"), icon: MessagesSquare },
  { id: "approvals", label: t("待确认的操作"), mobileLabel: t("确认"), icon: ShieldCheck },
  { id: "artifacts", label: t("成果"), mobileLabel: t("成果"), icon: Files },
  { id: "plugins", label: t("插件"), mobileLabel: t("插件"), icon: Puzzle },
  { id: "settings", label: t("设置"), mobileLabel: t("设置"), icon: Settings2 },
];

const settingsSections: Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: typeof Home;
}> = [
  {
    id: "overview",
    label: t("概览"),
    description: t("工作区状态"),
    icon: Building2,
  },
  {
    id: "usage",
    label: t("用量"),
    description: t("预算与保护"),
    icon: Sparkles,
  },
  {
    id: "team",
    label: t("团队"),
    description: t("成员与权限"),
    icon: Users,
  },
  {
    id: "preferences",
    label: t("偏好"),
    description: t("运行与通知"),
    icon: Settings2,
  },
  {
    id: "agents",
    label: t("智能体"),
    description: t("工作目录与规则"),
    icon: Bot,
  },
  {
    id: "data",
    label: t("数据"),
    description: t("备份与恢复"),
    icon: HardDrive,
  },
  {
    id: "connectors",
    label: t("连接"),
    description: t("工具与授权"),
    icon: Link2,
  },
  {
    id: "security",
    label: t("安全"),
    description: t("边界与审计"),
    icon: ShieldCheck,
  },
];

function getSettingsSectionElementId(section: SettingsSectionId) {
  return `settings-${section}`;
}

function readWorkspaceRoute(): WorkspaceRoute {
  const url = new URL(window.location.href);
  const requestedView = url.searchParams.get("view");
  const view =
    requestedView &&
    [...navItems, ...runtimeNavItems].some((item) => item.id === requestedView)
      ? (requestedView as ViewId)
      : "home";
  const taskId = url.searchParams.get("task")?.trim() || null;
  const runId = taskId
    ? url.searchParams.get("run")?.trim() || null
    : null;
  const artifactId = taskId
    ? null
    : url.searchParams.get("artifact")?.trim() || null;
  const approvalId =
    !taskId && !artifactId
      ? url.searchParams.get("approval")?.trim() || null
      : null;
  const activityId =
    !taskId && !artifactId && !approvalId
      ? url.searchParams.get("event")?.trim() || null
      : null;
  const activityTaskId =
    !taskId && !artifactId && !approvalId
      ? url.searchParams.get("auditTask")?.trim() || null
      : null;
  const requestedTaskFilter = url.searchParams.get("status");
  const taskFilter =
    requestedTaskFilter &&
    taskFilters.includes(requestedTaskFilter as TaskFilter)
      ? (requestedTaskFilter as TaskFilter)
      : null;
  const resolvedView = taskId
    ? "tasks"
    : artifactId
      ? "artifacts"
      : approvalId
        ? "approvals"
        : activityId || activityTaskId
          ? "activity"
          : view;
  const requestedApprovalFilter = url.searchParams.get("risk");
  const approvalFilter =
    requestedApprovalFilter &&
    approvalRiskFilters.includes(requestedApprovalFilter as ApprovalRiskFilter)
      ? (requestedApprovalFilter as ApprovalRiskFilter)
      : null;
  const requestedActivityFilter = url.searchParams.get("kind");
  const activityFilter =
    requestedActivityFilter &&
    activityFilters.includes(requestedActivityFilter as ActivityFilter)
      ? (requestedActivityFilter as ActivityFilter)
      : null;
  const requestedSettingsSection = url.searchParams.get("section");
  const settingsSection =
    requestedSettingsSection &&
    settingsSections.some((section) => section.id === requestedSettingsSection)
      ? (requestedSettingsSection as SettingsSectionId)
      : null;
  const hasObjectRoute = Boolean(
    taskId || artifactId || approvalId || activityId || activityTaskId,
  );
  const finalView = !hasObjectRoute && settingsSection ? "settings" : resolvedView;
  return {
    view: finalView,
    taskId,
    runId,
    artifactId: finalView === "artifacts" ? artifactId : null,
    approvalId: finalView === "approvals" ? approvalId : null,
    activityId: finalView === "activity" ? activityId : null,
    activityTaskId: finalView === "activity" ? activityTaskId : null,
    taskFilter: finalView === "tasks" ? taskFilter : null,
    approvalFilter: finalView === "approvals" ? approvalFilter : null,
    activityFilter: finalView === "activity" ? activityFilter : null,
    settingsSection: finalView === "settings" ? settingsSection : null,
  };
}

function writeWorkspaceRoute(
  route: WorkspaceRoute,
  mode: "push" | "replace",
  canPop = false,
) {
  const url = new URL(window.location.href);
  if (route.view === "home") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", route.view);
  }
  if (route.taskId) {
    url.searchParams.set("task", route.taskId);
  } else {
    url.searchParams.delete("task");
  }
  if (route.taskId && route.runId) {
    url.searchParams.set("run", route.runId);
  } else {
    url.searchParams.delete("run");
  }
  if (route.view === "artifacts" && route.artifactId) {
    url.searchParams.set("artifact", route.artifactId);
  } else {
    url.searchParams.delete("artifact");
  }
  if (route.view === "approvals" && route.approvalId) {
    url.searchParams.set("approval", route.approvalId);
  } else {
    url.searchParams.delete("approval");
  }
  if (route.view === "activity" && route.activityId) {
    url.searchParams.set("event", route.activityId);
  } else {
    url.searchParams.delete("event");
  }
  if (route.view === "activity" && route.activityTaskId) {
    url.searchParams.set("auditTask", route.activityTaskId);
  } else {
    url.searchParams.delete("auditTask");
  }
  if (
    route.view === "tasks" &&
    route.taskFilter &&
    route.taskFilter !== "全部"
  ) {
    url.searchParams.set("status", route.taskFilter);
  } else {
    url.searchParams.delete("status");
  }
  if (
    route.view === "approvals" &&
    route.approvalFilter &&
    route.approvalFilter !== "全部"
  ) {
    url.searchParams.set("risk", route.approvalFilter);
  } else {
    url.searchParams.delete("risk");
  }
  if (
    route.view === "activity" &&
    route.activityFilter &&
    route.activityFilter !== "全部"
  ) {
    url.searchParams.set("kind", route.activityFilter);
  } else {
    url.searchParams.delete("kind");
  }
  if (
    route.view === "settings" &&
    route.settingsSection &&
    route.settingsSection !== "overview"
  ) {
    url.searchParams.set("section", route.settingsSection);
  } else {
    url.searchParams.delete("section");
  }

  const nextLocation = `${url.pathname}${url.search}${url.hash}`;
  const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const shouldPush = mode === "push" && nextLocation !== currentLocation;
  const currentState = window.history.state as
    | WorkspaceHistoryState
    | null;
  const nextState: WorkspaceHistoryState = {
    unzooOne: true,
    route,
    canPop: shouldPush
      ? true
      : mode === "replace"
        ? canPop
        : (currentState?.canPop ?? false),
  };
  window.history[shouldPush ? "pushState" : "replaceState"](
    nextState,
    "",
    nextLocation,
  );
}

function canReturnToWorkspaceParent() {
  const state = window.history.state as WorkspaceHistoryState | null;
  return Boolean(state?.unzooOne && state.canPop);
}

const taskFilters: TaskFilter[] = [
  "全部",
  "运行中",
  "待确认",
  "失败",
  "已暂停",
  "已完成",
];
const taskFilterPageCopy: Record<
  TaskStatus,
  { eyebrow: string; title: string; description: string }
> = {
  运行中: {
    eyebrow: t("任务 · 正在执行"),
    title: t("正在运行的任务"),
    description: t("查看实时进度，必要时暂停运行或打开完整记录。"),
  },
  待确认: {
    eyebrow: t("任务 · 等待决定"),
    title: t("等待确认的任务"),
    description: t("这些任务已停在安全边界，确认后才会继续执行。"),
  },
  失败: {
    eyebrow: t("任务 · 需要处理"),
    title: t("需要恢复的任务"),
    description: t("检查失败原因，从安全检查点重试或修复连接。"),
  },
  已暂停: {
    eyebrow: t("任务 · 已暂停"),
    title: t("暂时停止的任务"),
    description: t("进度和证据都已保存，可以随时继续运行。"),
  },
  已完成: {
    eyebrow: t("任务 · 已交付"),
    title: t("已经完成的任务"),
    description: t("查看最终进度、运行记录和对应成果。"),
  },
};
const approvalRiskFilters: ApprovalRiskFilter[] = [
  "全部",
  "高风险",
  "中风险",
  "低风险",
  "稍后",
];
const approvalFilterPageCopy: Record<
  Exclude<ApprovalRiskFilter, "全部">,
  { eyebrow: string; title: string; description: string }
> = {
  高风险: {
    eyebrow: t("待确认 · 高风险"),
    title: t("需要逐项确认的高风险操作"),
    description: t("逐项核对执行对象、影响范围和证据后再做决定。"),
  },
  中风险: {
    eyebrow: t("待确认 · 中风险"),
    title: t("需要确认的中风险操作"),
    description: t("确认执行范围与授权边界，批准后任务才会继续。"),
  },
  低风险: {
    eyebrow: t("待确认 · 低风险"),
    title: t("可以快速处理的低风险操作"),
    description: t("检查目标和内容后，可以逐项或批量处理。"),
  },
  稍后: {
    eyebrow: t("待确认 · 稍后提醒"),
    title: t("已经安排稍后处理的操作"),
    description: t("这些操作仍未执行，会在约定时间重新进入待确认列表。"),
  },
};
const artifactFilters: ArtifactFilter[] = [
  "全部",
  "重点",
  "报告",
  "数据",
  "证据",
  "草稿",
];
const activityFilters: ActivityFilter[] = ["全部", "任务", "审批", "系统"];

const viewTitles: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: t("今天"),
    title: t("你好，今天有需要你处理的事项"),
    description: t("任务正在后台运行，只有需要你决定时才会停下来。"),
  },
  tasks: {
    eyebrow: t("任务"),
    title: t("所有任务"),
    description: t("查看运行、确认、失败恢复与已完成任务。"),
  },
  approvals: {
    eyebrow: t("待确认"),
    title: t("需要你决定的操作"),
    description: t("Unzoo One 不会在你确认前执行外部发送或敏感访问。"),
  },
  artifacts: {
    eyebrow: t("成果"),
    title: t("任务交付与证据"),
    description: t("查看 AI 生成的报告、数据和证据包，并追溯到对应任务。"),
  },
  activity: {
    eyebrow: t("运行记录"),
    title: t("系统刚刚做了什么"),
    description: t("每一步都有时间、结果和证据，可以随时回看。"),
  },
  plugins: {
    eyebrow: t("插件"),
    title: t("在旁边运行的程序"),
    description: t("有自己的控制页面和状态，也给智能体提供工具；每个角色可以单独指定账号和模型。"),
  },
  settings: {
    eyebrow: t("设置"),
    title: t("工作方式"),
    description: t("决定任务如何运行，以及哪些操作必须经过你确认。"),
  },
};




const activityIconMap: Record<ActivityIconKey, typeof Activity> = {
  activity: Activity,
  brain: Brain,
  clock: Clock3,
  copy: Copy,
  file: Files,
  globe: Globe2,
  settings: Settings2,
  shield: ShieldCheck,
  sparkles: Sparkles,
  trash: Trash2,
};

const artifactIconMap: Record<ArtifactType, typeof Files> = {
  报告: FileText,
  数据: Table2,
  证据: FileJson,
  草稿: Pencil,
};





function subscribeToNetworkStatus(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getNetworkStatusSnapshot() {
  return window.navigator.onLine;
}

function getServerNetworkStatusSnapshot() {
  return true;
}

export default function HomePage() {
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionId>("overview");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [recentSearchKeys, setRecentSearchKeys] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getNetworkStatusSnapshot,
    getServerNetworkStatusSnapshot,
  );
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
  const [selectedStep, setSelectedStep] = useState("analyze");
  const [approvals, setApprovals] = useState(workspaceSeed.approvals);
  // 托管审批的"记住"勾选，记的是勾在哪一条上：换一条看就自然不算数。
  const [rememberApprovalId, setRememberApprovalId] = useState<string | null>(null);
  // 托管会话的审批：agent 执行工具前停下来问，问题从 unterm 轮询进收件箱。
  // 只增删托管审批（id 以 agent: 开头），本地队列里的其它审批不受影响。
  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const live = await workspaceProvider.approvals.live();
        if (!stopped) setApprovals((items) => reconcileAgentApprovals(items, live));
      } catch {
        // 取不到就下次再试；本地审批照常可用。
      }
    }
    void poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);
  const [approvalDeferrals, setApprovalDeferrals] =
    useState<ApprovalDeferrals>({});
  const [approvalClock, setApprovalClock] = useState(() => Date.now());
  const [approvalSnoozeId, setApprovalSnoozeId] = useState<string | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState(workspaceSeed.approvals[0].id);
  const [approvalListQuery, setApprovalListQuery] = useState("");
  const [approvalRiskFilter, setApprovalRiskFilter] =
    useState<ApprovalRiskFilter>("全部");
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [bulkApprovalDecision, setBulkApprovalDecision] =
    useState<BulkApprovalDecision | null>(null);
  const [approvalRejectReason, setApprovalRejectReason] = useState("");
  const [approvalRejectSnapshot, setApprovalRejectSnapshot] =
    useState<ApprovalRejectSnapshot | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>(workspaceSeed.activity);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("全部");
  const [activityTaskId, setActivityTaskId] = useState<string | null>(null);
  const [activityListQuery, setActivityListQuery] = useState("");
  const [activitySort, setActivitySort] = useState<ActivitySort>("最新优先");
  const [selectedActivityId, setSelectedActivityId] = useState(
    workspaceSeed.activity[0].id,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile>(
    defaultWorkspaceProfile,
  );
  const [workspaceProfileOpen, setWorkspaceProfileOpen] = useState(false);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(
    defaultWorkspaceProfile.name,
  );
  const [workspaceDescriptionDraft, setWorkspaceDescriptionDraft] = useState(
    defaultWorkspaceProfile.description,
  );
  const [workspaceProfileSubmitted, setWorkspaceProfileSubmitted] =
    useState(false);
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationFilter>("全部");
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraftBaseline, setTaskDraftBaseline] =
    useState<TaskDraftSnapshot | null>(null);
  const [pendingTaskDraftRecovery, setPendingTaskDraftRecovery] =
    useState<TaskDraftRecovery | null>(null);
  const [taskDraftAutoSavedAt, setTaskDraftAutoSavedAt] = useState<
    string | null
  >(null);
  const [taskDraftAutoSavedSignature, setTaskDraftAutoSavedSignature] =
    useState("");
  const [taskDraftSaveFailedSignature, setTaskDraftSaveFailedSignature] =
    useState("");
  const [taskDiscardOpen, setTaskDiscardOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [rejectApprovalId, setRejectApprovalId] = useState<string | null>(null);
  const [approvalConfirmId, setApprovalConfirmId] = useState<string | null>(null);
  const [approvalConfirmAcknowledged, setApprovalConfirmAcknowledged] =
    useState(false);
  const [temporaryModeOpen, setTemporaryModeOpen] = useState(false);
  const [workspaceResetOpen, setWorkspaceResetOpen] = useState(false);
  const [workspaceResetAcknowledged, setWorkspaceResetAcknowledged] =
    useState(false);
  const [pendingWorkspaceImport, setPendingWorkspaceImport] =
    useState<PendingWorkspaceImport | null>(null);
  const [workspaceImportAcknowledged, setWorkspaceImportAcknowledged] =
    useState(false);
  const [recoveryBackupCreated, setRecoveryBackupCreated] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(workspaceSeed.tasks);
  /**
   * 装好的产品里任务归本机运行时（unterm）管。null：还没探测完。
   * true：任务从运行时读、改动推给运行时、运行由运行时启动和收尾。
   */
  const [runtimeMode, setRuntimeMode] = useState<boolean | null>(null);
  // 首次设置要知道：任务交给哪个智能体，它装了没有、登录了没有。
  const [runtimeAgents, setRuntimeAgents] = useState<BrainAgent[] | null>(null);
  const [runtimeAgentId, setRuntimeAgentId] = useState<string | null>(null);
  // 运行时最近一次读回来的任务和运行，用量从这里算。
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<RuntimeTask[] | null>(null);
  const [runtimeCapabilities, setRuntimeCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [runtimeCapabilitiesError, setRuntimeCapabilitiesError] = useState<string | null>(null);
  const [runtimeChecking, setRuntimeChecking] = useState(false);
  const [runtimeBrowser, setRuntimeBrowser] = useState<RuntimeBrowser | null>(null);
  const runtimeUsage = useMemo(() => (runtimeSnapshot ? usageSummary(runtimeSnapshot) : null), [runtimeSnapshot]);
  // 设置的各节，按单机版说：没有团队；用量是 token；连接器是本机能力。
  const visibleSettingsSections = runtimeMode
    ? settingsSections
        .filter((section) => section.id !== "team")
        .map((section) =>
          section.id === "usage"
            ? { ...section, description: t("智能体 token") }
            : section.id === "connectors"
              ? { ...section, label: t("能力"), description: t("终端、浏览器与智能体") }
              : section,
        )
    : settingsSections;
  const runtimeSent = useRef(new Map<string, string>());
  // Only known in the browser: false for the server render, then the truth.
  const [desktopApp, setDesktopApp] = useState(false);
  useEffect(() => setDesktopApp(inDesktopApp()), []);
  // 桌面版：登录系统后在后台启动服务。null：还没读到，或这个系统不支持。
  const [autostart, setAutostartState] = useState<boolean | null>(null);
  useEffect(() => {
    if (!desktopApp) return;
    autostartEnabled()
      .then(setAutostartState)
      .catch(() => setAutostartState(null));
  }, [desktopApp]);
  function toggleAutostart() {
    if (autostart === null) return;
    const next = !autostart;
    setAutostart(next)
      .then((enabled) => {
        setAutostartState(enabled);
        setNotice(enabled ? t("登录系统后，Unzoo One 会在后台启动") : t("登录系统后不再自动启动"));
      })
      .catch((error: unknown) =>
        setNotice(t("没能修改开机启动：{error}", { error: error instanceof Error ? error.message : String(error) })),
      );
  }
  // <html lang> follows the language actually shown, not the server default.
  useEffect(() => applyDocumentLanguage(), []);
  const runtimeRemoved = useRef(new Set<string>());
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(workspaceSeed.artifacts);
  const [artifactFilter, setArtifactFilter] = useState<ArtifactFilter>("全部");
  const [artifactTaskId, setArtifactTaskId] = useState<string | null>(null);
  const [artifactListQuery, setArtifactListQuery] = useState("");
  const [artifactSort, setArtifactSort] = useState<ArtifactSort>("最近更新");
  const [selectedArtifactId, setSelectedArtifactId] = useState(
    workspaceSeed.artifacts[0].id,
  );
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(
    null,
  );
  const [artifactTitleDraft, setArtifactTitleDraft] = useState("");
  const [artifactFilenameDraft, setArtifactFilenameDraft] = useState("");
  const [artifactContentDraft, setArtifactContentDraft] = useState("");
  /** Markdown 成果看原文而不是排好的版。 */
  const [artifactShowSource, setArtifactShowSource] = useState(false);
  const [pendingArtifactDraftRecovery, setPendingArtifactDraftRecovery] =
    useState<ArtifactDraftRecovery | null>(null);
  const [artifactDraftAutoSavedAt, setArtifactDraftAutoSavedAt] = useState<
    string | null
  >(null);
  const [artifactDraftAutoSavedSignature, setArtifactDraftAutoSavedSignature] =
    useState("");
  const [artifactDraftSaveFailedSignature, setArtifactDraftSaveFailedSignature] =
    useState("");
  const [artifactEditSubmitted, setArtifactEditSubmitted] = useState(false);
  const [artifactDiscardOpen, setArtifactDiscardOpen] = useState(false);
  const [artifactDeleteId, setArtifactDeleteId] = useState<string | null>(null);
  const [artifactDeleteSnapshot, setArtifactDeleteSnapshot] =
    useState<ArtifactDeleteSnapshot | null>(null);
  const [isSavingArtifact, setIsSavingArtifact] = useState(false);
  const [tasksReady, setTasksReady] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("全部");
  const [taskListQuery, setTaskListQuery] = useState("");
  const [taskSort, setTaskSort] = useState<TaskSort>("状态优先");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [taskDeleteSnapshot, setTaskDeleteSnapshot] =
    useState<TaskDeleteSnapshot | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  /** 对话页打开的那段对话；null 是“新对话”。 */
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationNonce, setConversationNonce] = useState(0);
  const [inspectedRunTaskId, setInspectedRunTaskId] =
    useState<string | null>(null);
  const [inspectedRunId, setInspectedRunId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [runContinuePrompt, setRunContinuePrompt] = useState("");
  const [workspaceSyncNotice, setWorkspaceSyncNotice] =
    useState<WorkspaceSyncNotice | null>(null);
  const [workspaceLoadWarning, setWorkspaceLoadWarning] = useState("");
  const [workspacePersistenceStatus, setWorkspacePersistenceStatus] =
    useState<WorkspacePersistenceStatus>("saved");
  const [workspacePersistenceDetail, setWorkspacePersistenceDetail] =
    useState("");
  const [workspaceLastSavedAt, setWorkspaceLastSavedAt] = useState<
    string | null
  >(null);
  const [lastWorkspaceBackupAt, setLastWorkspaceBackupAt] = useState<
    string | null
  >(null);
  const [workspaceSaveRetryToken, setWorkspaceSaveRetryToken] = useState(0);
  const [taskName, setTaskName] = useState(t("跟踪产品页面变化"));
  const [taskTarget, setTaskTarget] = useState("https://example.com/product");
  const [taskDescription, setTaskDescription] = useState(
    t("检查页面内容变化，只保留有意义的更新并生成摘要。"),
  );
  const [taskSchedule, setTaskSchedule] = useState<TaskSchedule>("每天");
  const [taskScheduleTime, setTaskScheduleTime] = useState("09:00");
  const [taskScheduleDay, setTaskScheduleDay] = useState<Weekday>("周一");
  const [taskApproval, setTaskApproval] = useState(true);
  const [taskFormSubmitted, setTaskFormSubmitted] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [desktopNotificationPermission, setDesktopNotificationPermission] =
    useState<DesktopNotificationPermission>("checking");
  const [
    isRequestingNotificationPermission,
    setIsRequestingNotificationPermission,
  ] = useState(false);
  const [usageSettings, setUsageSettings] =
    useState<UsageSettings>(defaultUsageSettings);
  const [usageBudgetOpen, setUsageBudgetOpen] = useState(false);
  const [planCenterOpen, setPlanCenterOpen] = useState(false);
  const [usageBudgetDraft, setUsageBudgetDraft] = useState(
    String(defaultUsageSettings.monthlyBudget),
  );
  const [usageAlertDraft, setUsageAlertDraft] =
    useState<BudgetAlertThreshold>(defaultUsageSettings.alertThreshold);
  const [usagePauseDraft, setUsagePauseDraft] = useState(
    defaultUsageSettings.pauseAtLimit,
  );
  const [usagePauseConfirmed, setUsagePauseConfirmed] = useState(false);
  const [settingsDiscardTarget, setSettingsDiscardTarget] =
    useState<SettingsDraftTarget | null>(null);
  const [connectorStates, setConnectorStates] = useState<ConnectorState>(
    workspaceSeed.connectors,
  );
  const [connectorCheckResults, setConnectorCheckResults] =
    useState<ConnectorCheckState>(defaultConnectorChecks);
  const [selectedConnectorId, setSelectedConnectorId] =
    useState<ConnectorId | null>(null);
  const [connectorTestingId, setConnectorTestingId] =
    useState<ConnectorId | null>(null);
  const [connectorTestingAll, setConnectorTestingAll] = useState(false);
  const [connectorAuthorizeAcknowledged, setConnectorAuthorizeAcknowledged] =
    useState(false);
  const [connectorDisconnectConfirm, setConnectorDisconnectConfirm] =
    useState(false);
  const [connectorDisconnectAcknowledged, setConnectorDisconnectAcknowledged] =
    useState(false);
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(workspaceSeed.members);
  const [teamMemberQuery, setTeamMemberQuery] = useState("");
  const [teamRoleFilter, setTeamRoleFilter] =
    useState<TeamRoleFilter>("全部");
  const [teamInviteOpen, setTeamInviteOpen] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] =
    useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("成员");
  const [inviteAdminAcknowledged, setInviteAdminAcknowledged] =
    useState(false);
  const [inviteFormSubmitted, setInviteFormSubmitted] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [memberRoleDraft, setMemberRoleDraft] = useState<TeamRole>("成员");
  const [memberRemoveConfirm, setMemberRemoveConfirm] = useState(false);
  const [memberRemoveAcknowledged, setMemberRemoveAcknowledged] =
    useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationWrapRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const desktopNotificationIdsRef = useRef<Set<string>>(new Set());
  const desktopNotificationTrackingReadyRef = useRef(false);
  const workspaceMenuWrapRef = useRef<HTMLDivElement>(null);
  const workspaceMenuButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceMenuPanelRef = useRef<HTMLDivElement>(null);
  const workspaceNameRef = useRef<HTMLInputElement>(null);
  const overlayTriggerRef = useRef<HTMLElement | null>(null);
  const routeReadyRef = useRef(false);
  const settingsSectionRef = useRef<SettingsSectionId>("overview");
  const settingsSectionScrollTargetRef = useRef<SettingsSectionId | null>(null);
  const settingsSectionScrollTimerRef = useRef<number | null>(null);
  const workspaceTabIdRef = useRef(
    `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const lastWorkspaceSyncSignatureRef = useRef("");
  const externalWorkspaceSyncSignatureRef = useRef("");
  const applyingExternalWorkspaceSyncRef = useRef(false);
  const pendingWorkspaceSyncRef = useRef<WorkspaceSyncSnapshot | null>(null);
  const workspaceSaveRetryingRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const approvalDetailRef = useRef<HTMLDivElement>(null);
  const activityInspectorRef = useRef<HTMLElement>(null);
  const artifactTitleRef = useRef<HTMLInputElement>(null);
  const artifactFilenameRef = useRef<HTMLInputElement>(null);
  const artifactContentRef = useRef<HTMLTextAreaElement>(null);
  const artifactSavingRef = useRef(false);
  const artifactDraftRecoveryOwnedRef = useRef(false);
  const taskNameRef = useRef<HTMLInputElement>(null);
  const taskTargetRef = useRef<HTMLInputElement>(null);
  const taskDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const taskScheduleTimeRef = useRef<HTMLInputElement>(null);
  const taskSavingRef = useRef(false);
  const taskDraftRecoveryOwnedRef = useRef(false);
  const inviteSavingRef = useRef(false);

  const deferredApprovals = useMemo(
    () =>
      approvals.filter((approval) => {
        const deferredUntil = approvalDeferrals[approval.id];
        return (
          deferredUntil !== undefined &&
          Date.parse(deferredUntil) > approvalClock
        );
      }),
    [approvalClock, approvalDeferrals, approvals],
  );
  const deferredApprovalIds = useMemo(
    () => new Set(deferredApprovals.map((approval) => approval.id)),
    [deferredApprovals],
  );
  const activeApprovals = useMemo(
    () =>
      approvals.filter((approval) => !deferredApprovalIds.has(approval.id)),
    [approvals, deferredApprovalIds],
  );
  const activeApprovalCount = activeApprovals.length;
  const deferredApprovalCount = deferredApprovals.length;
  const failedTaskCount = tasks.filter((task) => task.status === "失败").length;
  const attentionCount = activeApprovalCount + failedTaskCount;
  const workspaceToday = getWorkspaceToday();
  const workspaceLastSavedLabel = workspaceLastSavedAt
    ? new Intl.DateTimeFormat(dateLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(workspaceLastSavedAt))
    : "";
  const runningTaskTotal = tasks.filter((task) => task.status === "运行中").length;
  const planLabel = runtimeMode ? t("个人版") : t("Team 方案");
  const systemStatusTone =
    workspacePersistenceStatus === "failed"
      ? "storage-failed"
      : workspacePersistenceStatus === "retrying"
        ? "storage-retrying"
        : !isOnline
          ? "offline"
          : runtimeMode || isRunning
            ? "online"
            : "paused";
  const systemStatusLabel =
    workspacePersistenceStatus === "failed"
      ? t("本机保存失败")
      : workspacePersistenceStatus === "retrying"
        ? t("正在重试保存")
        : !isOnline
          ? t("设备当前离线")
          : runtimeMode
            ? runningTaskTotal > 0
              ? t("{runningTaskTotal} 个任务在运行", { runningTaskTotal })
              : t("本机运行时已连接")
            : isRunning
              ? t("系统运行正常")
              : t("自动运行已暂停");
  const systemStatusDetail =
    workspacePersistenceStatus === "failed"
      ? t("请重试或导出紧急备份")
      : workspacePersistenceStatus === "retrying"
        ? t("正在验证本机存储")
        : !isOnline
          ? t("本机数据可用 · 在线能力暂停")
          : settings.local
            ? workspaceLastSavedLabel
              ? t("本机已保存 · {workspaceLastSavedLabel}", { workspaceLastSavedLabel })
              : t("数据保存在本机")
            : t("临时会话 · 关闭后清空");
  const pageTitle =
    activeView === "home" && runtimeMode
      ? {
          eyebrow: workspaceToday.eyebrow,
          title: t("任务"),
          description: t("说一句话，智能体用这台电脑的终端和浏览器替你去做。"),
        }
      : activeView === "home"
      ? {
          ...viewTitles.home,
          eyebrow: workspaceToday.eyebrow,
          title: t("{greeting}，今天有 {attentionCount} 件事需要你处理", { greeting: workspaceToday.greeting, attentionCount }),
          description:
            failedTaskCount > 0
              ? t("{failedTaskCount} 个任务需要恢复，{activeApprovalCount} 项操作等待确认。", { failedTaskCount, activeApprovalCount })
              : viewTitles.home.description,
        }
      : activeView === "tasks" && taskFilter !== "全部"
        ? taskFilterPageCopy[taskFilter]
        : activeView === "approvals" && approvalRiskFilter !== "全部"
          ? approvalFilterPageCopy[approvalRiskFilter]
        : viewTitles[activeView];
  const normalizedApprovalQuery = approvalListQuery.trim().toLowerCase();
  const filteredApprovals = useMemo(
    () => {
      const approvalPool =
        approvalRiskFilter === "稍后" ? deferredApprovals : activeApprovals;
      return approvalPool.filter((approval) => {
        const relatedTaskTitle =
          tasks.find((task) => task.id === approval.taskId)?.title ?? "";
        const matchesRisk =
          approvalRiskFilter === "全部" ||
          approvalRiskFilter === "稍后" ||
          approval.risk === approvalRiskFilter;
        const matchesQuery =
          !normalizedApprovalQuery ||
          [
            approval.title,
            approval.reason,
            approval.target,
            approval.scope,
            approval.policy,
            relatedTaskTitle,
          ].some((value) =>
            value.toLowerCase().includes(normalizedApprovalQuery),
          );
        return matchesRisk && matchesQuery;
      });
    },
    [
      activeApprovals,
      approvalRiskFilter,
      deferredApprovals,
      normalizedApprovalQuery,
      tasks,
    ],
  );
  const selectedApproval =
    filteredApprovals.find((item) => item.id === selectedApprovalId) ??
    filteredApprovals[0] ??
    null;
  useEffect(() => {
    if (!tasksReady || activeView !== "approvals") return;
    const nextApprovalId = selectedApproval?.id ?? "";
    if (nextApprovalId === selectedApprovalId) return;
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId: nextApprovalId || null,
        approvalFilter: approvalRiskFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }, [
    activeView,
    approvalRiskFilter,
    selectedApproval?.id,
    selectedApprovalId,
    tasksReady,
  ]);
  const selectedApprovalDeferredUntil = selectedApproval
    ? approvalDeferrals[selectedApproval.id]
    : undefined;
  const selectedApprovalIsDeferred = Boolean(
    selectedApprovalDeferredUntil &&
      Date.parse(selectedApprovalDeferredUntil) > approvalClock,
  );
  const approvalSnoozeTarget =
    approvals.find((approval) => approval.id === approvalSnoozeId) ?? null;
  const selectedApprovals = activeApprovals.filter((approval) =>
    selectedApprovalIds.includes(approval.id),
  );
  const selectedVisibleApprovalCount = filteredApprovals.filter((approval) =>
    selectedApprovalIds.includes(approval.id),
  ).length;
  const allVisibleApprovalsSelected =
    approvalRiskFilter !== "稍后" &&
    filteredApprovals.length > 0 &&
    selectedVisibleApprovalCount === filteredApprovals.length;
  const bulkApprovableApprovals = selectedApprovals.filter(
    (approval) => approval.risk !== "高风险",
  );
  const selectedHighRiskApprovalCount =
    selectedApprovals.length - bulkApprovableApprovals.length;
  const selectedApprovalTaskCount = new Set(
    selectedApprovals.map((approval) => approval.taskId),
  ).size;
  const approvalRiskCounts: Record<ApprovalRiskFilter, number> = {
    全部: activeApprovalCount,
    高风险: activeApprovals.filter((approval) => approval.risk === "高风险")
      .length,
    中风险: activeApprovals.filter((approval) => approval.risk === "中风险")
      .length,
    低风险: activeApprovals.filter((approval) => approval.risk === "低风险")
      .length,
    稍后: deferredApprovalCount,
  };
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedTaskRuns = selectedTask?.runs ?? [];
  const selectedTaskRecoveryReady =
    selectedTask?.errorCode === "RECOVERY_READY";
  const selectedTaskFinishedRuns = selectedTaskRuns.filter((run) =>
    ["成功", "失败"].includes(run.status),
  );
  const selectedTaskSuccessfulRuns = selectedTaskFinishedRuns.filter(
    (run) => run.status === "成功",
  );
  const selectedTaskSuccessRate = selectedTaskFinishedRuns.length
    ? Math.round(
        (selectedTaskSuccessfulRuns.length / selectedTaskFinishedRuns.length) *
          100,
      )
    : null;
  const selectedTaskRunDurations = selectedTaskFinishedRuns
    .map((run) => run.durationSeconds)
    .filter((duration): duration is number => duration !== undefined);
  const selectedTaskAverageDuration = selectedTaskRunDurations.length
    ? Math.round(
        selectedTaskRunDurations.reduce((total, duration) => total + duration, 0) /
          selectedTaskRunDurations.length,
      )
    : undefined;
  const inspectedRunTask =
    tasks.find((task) => task.id === inspectedRunTaskId) ?? null;
  const inspectedRun =
    inspectedRunTask?.runs?.find((run) => run.id === inspectedRunId) ?? null;
  const inspectedRunStages = inspectedRun ? getTaskRunStages(inspectedRun) : [];
  const inspectedRunArtifacts = inspectedRunTask
    ? artifacts.filter((artifact) => artifact.taskId === inspectedRunTask.id)
    : [];
  const inspectedRunActivity = inspectedRunTask
    ? activityLog.filter((item) => item.taskId === inspectedRunTask.id).slice(0, 5)
    : [];
  const inspectedRunAuthorizationBlocked = Boolean(
    inspectedRun?.status === "失败" &&
      /AUTH|PERMISSION|ACCESS/.test(
        `${inspectedRun.errorCode ?? ""} ${inspectedRun.errorMessage ?? ""}`,
      ),
  );
  const inspectedRunLaunchType = inspectedRun?.summary.includes(t("重试"))
    ? t("人工重试")
    : inspectedRun?.summary.includes(t("继续"))
      ? t("断点继续")
      : inspectedRunTask?.schedule === "仅运行一次"
        ? t("手动启动")
        : t("计划触发");
  const connectorIssueTasks: Record<ConnectorId, TaskItem[]> = {
    browser: tasks.filter((task) =>
      connectorErrorCodes.browser.includes(task.errorCode ?? ""),
    ),
    workspace: tasks.filter((task) =>
      connectorErrorCodes.workspace.includes(task.errorCode ?? ""),
    ),
    mail: tasks.filter((task) =>
      connectorErrorCodes.mail.includes(task.errorCode ?? ""),
    ),
    calendar: tasks.filter((task) =>
      connectorErrorCodes.calendar.includes(task.errorCode ?? ""),
    ),
  };
  const selectedConnector =
    connectorCatalog.find((connector) => connector.id === selectedConnectorId) ??
    null;
  const selectedConnectorIssueTasks = selectedConnector
    ? connectorIssueTasks[selectedConnector.id]
    : [];
  const selectedConnectorHasIssue = selectedConnectorIssueTasks.length > 0;
  const selectedConnectorCheck = selectedConnector
    ? connectorCheckResults[selectedConnector.id]
    : null;
  const selectedTeamMember =
    teamMembers.find((member) => member.id === selectedTeamMemberId) ?? null;
  const normalizedTeamMemberQuery = teamMemberQuery.trim().toLowerCase();
  const filteredTeamMembers = teamMembers.filter((member) => {
    const matchesQuery =
      !normalizedTeamMemberQuery ||
      `${member.name} ${member.email}`
        .toLowerCase()
        .includes(normalizedTeamMemberQuery);
    const matchesRole =
      teamRoleFilter === "全部" ||
      (teamRoleFilter === "待接受"
        ? member.status === "已邀请"
        : member.role === teamRoleFilter);
    return matchesQuery && matchesRole;
  });
  const pendingInviteCount = teamMembers.filter(
    (member) => member.status === "已邀请",
  ).length;
  const teamRoleFilterCounts: Record<TeamRoleFilter, number> = {
    全部: teamMembers.length,
    管理员: teamMembers.filter((member) => member.role === "管理员").length,
    审批者: teamMembers.filter((member) => member.role === "审批者").length,
    成员: teamMembers.filter((member) => member.role === "成员").length,
    待接受: pendingInviteCount,
  };
  const availableSeatCount = Math.max(0, teamSeatLimit - teamMembers.length);
  const teamSeatLimitReached = availableSeatCount === 0;
  const approverMemberCount = teamMembers.filter((member) =>
    ["所有者", "管理员", "审批者"].includes(member.role),
  ).length;
  const onlineMemberCount = teamMembers.filter(
    (member) => member.status === "在线",
  ).length;
  const currentMemberPermissions = selectedTeamMember
    ? teamRoleDetails[selectedTeamMember.role].permissions
    : [];
  const draftMemberPermissions = teamRoleDetails[memberRoleDraft].permissions;
  const gainedMemberPermissions = draftMemberPermissions.filter(
    (permission) => !currentMemberPermissions.includes(permission),
  );
  const lostMemberPermissions = currentMemberPermissions.filter(
    (permission) => !draftMemberPermissions.includes(permission),
  );
  const SelectedConnectorIcon = selectedConnector?.icon ?? Link2;
  const connectedConnectorCount = connectorCatalog.filter(
    (connector) => connectorStates[connector.id],
  ).length;
  const healthyConnectorCount = connectorCatalog.filter(
    (connector) =>
      connectorStates[connector.id] &&
      connectorIssueTasks[connector.id].length === 0,
  ).length;
  const connectorIssueCount = connectorCatalog.filter(
    (connector) => connectorIssueTasks[connector.id].length > 0,
  ).length;
  const connectorIssueTaskCount = connectorCatalog.reduce(
    (count, connector) => count + connectorIssueTasks[connector.id].length,
    0,
  );
  const disconnectedConnectorCount =
    connectorCatalog.length - connectedConnectorCount;
  const checkedHealthyConnectorCount = connectorCatalog.filter(
    (connector) =>
      connectorStates[connector.id] &&
      connectorIssueTasks[connector.id].length === 0 &&
      connectorCheckResults[connector.id] !== null,
  ).length;
  const onboardingAgent = runtimeAgents?.find((agent) => agent.id === runtimeAgentId) ?? null;
  const onboardingAgentReady = Boolean(onboardingAgent?.installed && onboardingAgent.signedIn !== false);
  const agentStep = {
    id: "agent" as const,
    label: t("准备好智能体"),
    description: !runtimeAgents
      ? t("正在检查这台机器上的智能体…")
      : !onboardingAgent
        ? t("选一个装在这台机器上的智能体")
        : !onboardingAgent.installed
          ? t("{name} 还没安装", { name: onboardingAgent.name })
          : onboardingAgent.signedIn === false
            ? t("{name} 还没登录", { name: onboardingAgent.name })
            : t("任务交给 {name}", { name: onboardingAgent.name }),
    actionLabel: onboardingAgent?.installed && onboardingAgent.signedIn === false ? t("去登录") : t("选择智能体"),
    complete: onboardingAgentReady,
    icon: Bot,
  };
  const allOnboardingSteps: Array<{
    id: OnboardingStepId;
    label: string;
    description: string;
    actionLabel: string;
    complete: boolean;
    icon: typeof Building2;
  }> = [
    agentStep,
    {
      id: "profile",
      label: t("命名工作区"),
      description: t("让团队知道这里负责什么工作"),
      actionLabel: t("设置资料"),
      complete:
        workspaceProfile.name !== defaultWorkspaceProfile.name ||
        workspaceProfile.description !== defaultWorkspaceProfile.description,
      icon: Building2,
    },
    {
      id: "connectors",
      label: t("检查能力连接"),
      description: t("{healthyConnectorCount} 项连接可以安全使用", { healthyConnectorCount }),
      actionLabel: t("检查连接"),
      complete: healthyConnectorCount >= 2,
      icon: Link2,
    },
    {
      id: "security",
      label: t("保留审批边界"),
      description: settings.approval
        ? t("敏感操作会先等待确认")
        : t("当前允许已授权操作自动执行"),
      actionLabel: t("检查安全"),
      complete: settings.approval,
      icon: ShieldCheck,
    },
    {
      id: "task",
      label: t("创建真实任务"),
      description: runtimeMode ? t("交给智能体的第一项工作") : t("示例任务不会替代你的真实配置"),
      actionLabel: t("新建任务"),
      complete: tasks.some((task) => !demoTaskIds.has(task.id)),
      icon: Sparkles,
    },
  ];
  // 装好的产品：智能体、审批边界、第一项任务。演示版没有真的智能体，沿用原来的几步。
  const onboardingSteps = allOnboardingSteps.filter((step) =>
    runtimeMode ? ["agent", "security", "task"].includes(step.id) : step.id !== "agent",
  );
  const onboardingCompletedCount = onboardingSteps.filter(
    (step) => step.complete,
  ).length;
  const nextOnboardingStep =
    onboardingSteps.find((step) => !step.complete) ?? null;
  const connectorUsageCounts: Record<ConnectorId, number> = {
    browser: tasks.filter((task) => /^https?:\/\//i.test(task.target)).length,
    workspace: tasks.filter((task) => !/^https?:\/\//i.test(task.target)).length,
    mail: approvals.filter((item) =>
      // Approval text can be in either language; match both, ignoring case.
      /发送|send/i.test(`${item.title} ${item.reason} ${item.action}`),
    ).length,
    calendar: tasks.filter((task) => task.schedule !== "仅运行一次").length,
  };
  const reasoningCredits =
    120 +
    Math.ceil(
      tasks.reduce((total, task) => total + task.progress, 0) * 0.72,
    ) +
    activityLog.filter((item) => item.icon === "brain").length * 5;
  const browserCredits =
    Math.ceil(
      tasks
        .filter((task) => /^https?:\/\//i.test(task.target))
        .reduce((total, task) => total + task.progress, 0) * 0.58,
    ) +
    artifacts
      .filter((artifact) => artifact.type === "证据")
      .reduce(
        (total, artifact) => total + Math.ceil(artifact.sizeKb * 0.4),
        0,
      );
  const connectorCredits =
    connectedConnectorCount * 18 +
    approvals.length * 6 +
    activityLog.filter((item) => item.kind === "审批").length * 4;
  const storageCredits = Math.ceil(
    artifacts.reduce((total, artifact) => total + artifact.sizeKb, 0) * 0.75,
  );
  const usageBreakdown = [
    {
      id: "reasoning",
      label: t("AI 分析与推理"),
      detail: t("页面理解、摘要与报告生成"),
      credits: reasoningCredits,
      icon: Brain,
      tone: "blue",
    },
    {
      id: "browser",
      label: t("浏览器执行"),
      detail: t("页面读取、截图与结构提取"),
      credits: browserCredits,
      icon: Globe2,
      tone: "green",
    },
    {
      id: "connectors",
      label: t("连接器调用"),
      detail: t("邮件、工作区与审批动作"),
      credits: connectorCredits,
      icon: Link2,
      tone: "amber",
    },
    {
      id: "storage",
      label: t("成果与证据保存"),
      detail: t("报告、数据与审计证据"),
      credits: storageCredits,
      icon: HardDrive,
      tone: "violet",
    },
  ] as const;
  const usedCredits = usageBreakdown.reduce(
    (total, item) => total + item.credits,
    0,
  );
  const usageRunningTaskCount = tasks.filter(
    (task) => task.status === "运行中",
  ).length;
  const forecastCredits =
    usedCredits +
    usageRunningTaskCount * 65 +
    tasks.filter((task) => task.schedule !== "仅运行一次").length * 22;
  const usagePercent = Math.round(
    (usedCredits / usageSettings.monthlyBudget) * 100,
  );
  const usageProgressPercent = Math.min(100, usagePercent);
  const budgetExceeded = usedCredits >= usageSettings.monthlyBudget;
  // 单机版没有额度：演示用的点数不能拦住真的任务。
  const budgetRunBlocked =
    !runtimeMode && usageSettings.pauseAtLimit && budgetExceeded;
  const budgetAlertReached =
    usagePercent >= usageSettings.alertThreshold || budgetExceeded;
  const remainingCredits = Math.max(
    0,
    usageSettings.monthlyBudget - usedCredits,
  );
  const alertCreditLevel = Math.round(
    usageSettings.monthlyBudget * (usageSettings.alertThreshold / 100),
  );
  const creditsUntilAlert = Math.max(0, alertCreditLevel - usedCredits);
  const forecastVariance = usageSettings.monthlyBudget - forecastCredits;
  const usageBudgetDraftValue = Number(usageBudgetDraft);
  const usageBudgetDraftInvalid =
    !Number.isFinite(usageBudgetDraftValue) ||
    !Number.isInteger(usageBudgetDraftValue) ||
    usageBudgetDraftValue < 100 ||
    usageBudgetDraftValue > 50000;
  const usageBudgetDirty =
    usageBudgetOpen &&
    (usageBudgetDraft !== String(usageSettings.monthlyBudget) ||
      usageAlertDraft !== usageSettings.alertThreshold ||
      usagePauseDraft !== usageSettings.pauseAtLimit);
  const usageDraftAlertCreditLevel = usageBudgetDraftInvalid
    ? 0
    : Math.round(usageBudgetDraftValue * (usageAlertDraft / 100));
  const usageDraftRemaining = usageBudgetDraftInvalid
    ? 0
    : usageBudgetDraftValue - usedCredits;
  const usageDraftForecastVariance = usageBudgetDraftInvalid
    ? 0
    : usageBudgetDraftValue - forecastCredits;
  const usageBudgetChange = usageBudgetDraftInvalid
    ? 0
    : usageBudgetDraftValue - usageSettings.monthlyBudget;
  const usageBudgetRequiresConfirmation =
    usageBudgetDirty &&
    !usageBudgetDraftInvalid &&
    usagePauseDraft &&
    usageBudgetDraftValue <= usedCredits &&
    usageRunningTaskCount > 0;
  const usageBudgetCanSaveBase =
    usageBudgetDirty &&
    !usageBudgetDraftInvalid &&
    (!usageBudgetRequiresConfirmation || usagePauseConfirmed);

  useEffect(() => {
    if (
      !tasksReady ||
      !usageSettings.pauseAtLimit ||
      !budgetExceeded
    ) {
      return;
    }

    const runningTaskIds = tasks
      .filter((task) => task.status === "运行中")
      .map((task) => task.id);
    if (runningTaskIds.length === 0) return;

    const runningIds = new Set(runningTaskIds);
    const protectionTimer = window.setTimeout(() => {
      setTasks((items) =>
        items.map((task) =>
          runningIds.has(task.id)
            ? {
                ...task,
                status: "已暂停",
                updated: t("因用量到限保护暂停"),
                runs: stopActiveTaskRuns(
                  task.runs,
                  t("达到预算上限，系统已停止本次运行。"),
                ),
              }
            : task,
        ),
      );
      if (runningIds.has("competitor")) setIsRunning(false);
      recordActivity({
        title: t("预算保护已自动生效"),
        detail: t("本月已使用 {usedCredits} 点，达到 {monthlyBudget} 点额度；已暂停 {length} 个运行中任务。", { usedCredits, monthlyBudget: usageSettings.monthlyBudget, length: runningTaskIds.length }),
        icon: "shield",
        tone: "amber",
        kind: "系统",
      });
      setNotice(
        t("已达到月度额度，预算保护暂停了 {length} 个任务", { length: runningTaskIds.length }),
      );
    }, 0);

    return () => window.clearTimeout(protectionTimer);
  }, [
    budgetExceeded,
    tasks,
    tasksReady,
    usageSettings.monthlyBudget,
    usageSettings.pauseAtLimit,
    usedCredits,
  ]);

  const workspaceProfileFormErrors = useMemo<WorkspaceProfileFormErrors>(() => {
    const errors: WorkspaceProfileFormErrors = {};
    const normalizedName = workspaceNameDraft.trim();
    const normalizedDescription = workspaceDescriptionDraft.trim();
    if (normalizedName.length < 2) {
      errors.name = t("工作区名称至少需要 2 个字");
    } else if (normalizedName.length > 40) {
      errors.name = t("工作区名称不能超过 40 个字");
    }
    if (normalizedDescription.length < 4) {
      errors.description = t("请用至少 4 个字说明这个工作区的用途");
    } else if (normalizedDescription.length > 100) {
      errors.description = t("工作区说明不能超过 100 个字");
    }
    return errors;
  }, [workspaceDescriptionDraft, workspaceNameDraft]);
  const workspaceProfileFormHasErrors =
    Object.keys(workspaceProfileFormErrors).length > 0;
  const workspaceProfileDirty =
    workspaceProfileOpen &&
    (workspaceNameDraft !== workspaceProfile.name ||
      workspaceDescriptionDraft !== workspaceProfile.description);
  const workspaceInitial = getWorkspaceInitial(workspaceProfile.name);
  const teamInviteDirty =
    teamInviteOpen &&
    (inviteName.length > 0 || inviteEmail.length > 0 || inviteRole !== "成员");
  const teamMemberRoleDirty = Boolean(
    selectedTeamMember && memberRoleDraft !== selectedTeamMember.role,
  );
  const settingsDraftDirty =
    workspaceProfileDirty ||
    usageBudgetDirty ||
    teamInviteDirty ||
    teamMemberRoleDirty;
  const activeSettingsDiscardCopy = settingsDiscardTarget
    ? settingsDraftDiscardCopy[settingsDiscardTarget]
    : null;
  const editingArtifact =
    artifacts.find((artifact) => artifact.id === editingArtifactId) ?? null;
  const deletingArtifact =
    artifacts.find((artifact) => artifact.id === artifactDeleteId) ?? null;
  const DeletingArtifactIcon = deletingArtifact
    ? artifactIconMap[deletingArtifact.type]
    : Files;
  const deletingArtifactTask = deletingArtifact
    ? tasks.find((task) => task.id === deletingArtifact.taskId) ?? null
    : null;
  const editingArtifactVersion = editingArtifact?.version ?? 1;
  const artifactRevisionHistory = editingArtifact
    ? [...(editingArtifact.revisions ?? [])].sort(
        (first, second) => second.version - first.version,
      )
    : [];
  const artifactEditorDirty = Boolean(
    editingArtifact &&
      (artifactTitleDraft !== editingArtifact.title ||
        artifactFilenameDraft !== editingArtifact.filename ||
        artifactContentDraft !== editingArtifact.content),
  );
  const artifactDraftSignature = JSON.stringify([
    editingArtifactId,
    artifactTitleDraft,
    artifactFilenameDraft,
    artifactContentDraft,
  ]);
  const artifactDraftIsAutoSaved = Boolean(
    artifactDraftAutoSavedAt &&
      artifactDraftAutoSavedSignature === artifactDraftSignature,
  );
  const artifactDraftSaveFailed =
    artifactDraftSaveFailedSignature === artifactDraftSignature;
  const artifactFormErrors = useMemo<ArtifactFormErrors>(() => {
    const errors: ArtifactFormErrors = {};
    const normalizedTitle = artifactTitleDraft.trim();
    const normalizedFilename = artifactFilenameDraft.trim();
    const normalizedContent = artifactContentDraft.trim();

    if (!normalizedTitle) {
      errors.title = t("请输入成果名称");
    } else if (normalizedTitle.length > 100) {
      errors.title = t("成果名称不能超过 100 个字");
    }

    if (!normalizedFilename) {
      errors.filename = t("请输入文件名");
    } else if (normalizedFilename.length > 120) {
      errors.filename = t("文件名不能超过 120 个字符");
    } else if (/[/\\:*?"<>|]/.test(normalizedFilename)) {
      errors.filename = t("文件名不能包含 / \\ : * ? \" < > |");
    } else if (!/\.[a-z0-9]{1,10}$/i.test(normalizedFilename)) {
      errors.filename = t("请保留文件扩展名，例如 .md");
    }

    if (!normalizedContent) {
      errors.content = t("成果内容不能为空");
    } else if (normalizedContent.length < 20) {
      errors.content = t("成果内容至少需要 20 个字");
    } else if (artifactContentDraft.length > 100000) {
      errors.content = t("成果内容不能超过 100,000 个字符");
    }

    return errors;
  }, [artifactContentDraft, artifactFilenameDraft, artifactTitleDraft]);
  const artifactFormHasErrors = Object.keys(artifactFormErrors).length > 0;
  const deletingTask = tasks.find((task) => task.id === deleteTaskId) ?? null;
  const rejectedApproval =
    approvals.find((item) => item.id === rejectApprovalId) ?? null;
  const approvalConfirmTarget =
    approvals.find((item) => item.id === approvalConfirmId) ?? null;
  const activeOverlayKind = settingsDiscardTarget
    ? "settings-discard"
    : workspaceProfileOpen
      ? "workspace-profile"
    : taskDiscardOpen
    ? "task-discard"
    : artifactDiscardOpen
      ? "artifact-discard"
    : editingArtifact
      ? "artifact-editor"
      : deletingArtifact
        ? "artifact-delete"
      : usageBudgetOpen
        ? "usage-budget"
      : planCenterOpen
        ? "plan-center"
    : pendingWorkspaceImport
      ? "import"
    : bulkApprovalDecision
      ? "bulk-approval"
      : bulkDeleteOpen
        ? "bulk-delete"
    : deletingTask
    ? "delete"
    : approvalSnoozeTarget
      ? "approval-snooze"
      : approvalConfirmTarget
        ? "approval-confirm"
    : rejectedApproval
      ? "reject"
      : temporaryModeOpen
        ? "temporary"
        : workspaceResetOpen
          ? "reset"
          : composerOpen
            ? "composer"
            : teamInviteOpen
              ? "team-invite"
              : selectedTeamMember
                ? "team-member"
            : selectedConnector
              ? "connector"
              : inspectedRun
                ? "run"
                : selectedTask
                  ? "task"
                  : null;
  const overlayOpen = activeOverlayKind !== null;
  const primaryTask = tasks.find((task) => task.id === "competitor") ?? workspaceDefaults.tasks[0];
  const activityTask = tasks.find((task) => task.id === activityTaskId) ?? null;
  const selectedTaskActivity = selectedTask
    ? activityLog.filter((item) => item.taskId === selectedTask.id).slice(0, 3)
    : [];
  const selectedTaskArtifacts = selectedTask
    ? artifacts.filter((artifact) => artifact.taskId === selectedTask.id).slice(0, 2)
    : [];
  const taskFormErrors = useMemo<TaskFormErrors>(() => {
    const errors: TaskFormErrors = {};
    const normalizedName = taskName.trim();
    const normalizedTarget = taskTarget.trim();
    const normalizedDescription = taskDescription.trim();

    // 装好的产品：直接输入需求。名字不填就从需求里取，来源写在需求里就行。
    if (runtimeMode) {
      if (normalizedName.length > 80) errors.name = t("任务名称不能超过 80 个字");
      if (!normalizedDescription) {
        errors.description = t("写下你想让智能体做什么");
      } else if (normalizedDescription.length > requestMaxLength) {
        errors.description = t("需求不能超过 {max} 个字", { max: requestMaxLength });
      }
      if (taskSchedule !== "仅运行一次" && !taskScheduleTime) {
        errors.scheduleTime = t("请选择自动运行时间");
      }
      return errors;
    }

    if (!normalizedName) {
      errors.name = t("请给任务起一个容易识别的名称");
    } else if (normalizedName.length > 80) {
      errors.name = t("任务名称不能超过 80 个字");
    }

    if (!normalizedTarget) {
      errors.target = t("请填写网页、文件夹或资料库");
    } else if (normalizedTarget.length < 3) {
      errors.target = t("请把数据来源写得更具体一些");
    } else if (normalizedTarget.length > 240) {
      errors.target = t("数据来源不能超过 240 个字");
    } else if (/^https?:\/\//i.test(normalizedTarget)) {
      try {
        const parsedTarget = new URL(normalizedTarget);
        if (!parsedTarget.hostname) {
          errors.target = t("请填写完整的网址，例如 https://example.com");
        }
      } catch {
        errors.target = t("请填写完整的网址，例如 https://example.com");
      }
    }

    if (!normalizedDescription) {
      errors.description = t("请描述 AI 最终需要交付什么");
    } else if (normalizedDescription.length < 8) {
      errors.description = t("再补充一点结果要求，至少写 8 个字");
    } else if (normalizedDescription.length > 500) {
      errors.description = t("结果要求不能超过 500 个字");
    }

    if (taskSchedule !== "仅运行一次" && !taskScheduleTime) {
      errors.scheduleTime = t("请选择自动运行时间");
    }

    return errors;
  }, [runtimeMode, taskDescription, taskName, taskSchedule, taskScheduleTime, taskTarget]);
  const taskFormHasErrors = Object.keys(taskFormErrors).length > 0;
  const taskDefinitionReady = Boolean(
    taskName.trim() &&
      taskTarget.trim() &&
      taskDescription.trim() &&
      !taskFormErrors.name &&
      !taskFormErrors.target &&
      !taskFormErrors.description,
  );
  const taskScheduleReady = !taskFormErrors.scheduleTime;
  const taskComposerReadyCount =
    Number(taskDefinitionReady) + Number(taskScheduleReady) + 1;
  const activeTaskTemplate = editingTaskId
    ? null
    : taskTemplates.find(
        (template) =>
          template.title === taskName &&
          template.target === taskTarget &&
          template.description === taskDescription &&
          template.schedule === taskSchedule &&
          template.scheduleTime === taskScheduleTime &&
          template.scheduleDay === taskScheduleDay,
      ) ?? null;
  const activeTaskTemplateId = activeTaskTemplate?.id ?? null;
  const taskComposerDirty = Boolean(
    composerOpen &&
      taskDraftBaseline &&
      (taskName !== taskDraftBaseline.name ||
        taskTarget !== taskDraftBaseline.target ||
        taskDescription !== taskDraftBaseline.description ||
        taskSchedule !== taskDraftBaseline.schedule ||
        taskScheduleTime !== taskDraftBaseline.scheduleTime ||
        taskScheduleDay !== taskDraftBaseline.scheduleDay ||
        taskApproval !== taskDraftBaseline.approval),
  );
  const taskDraftSignature = JSON.stringify([
    editingTaskId,
    taskName,
    taskTarget,
    taskDescription,
    taskSchedule,
    taskScheduleTime,
    taskScheduleDay,
    taskApproval,
  ]);
  const taskDraftIsAutoSaved = Boolean(
    taskDraftAutoSavedAt &&
      taskDraftAutoSavedSignature === taskDraftSignature,
  );
  const taskDraftSaveFailed =
    taskDraftSaveFailedSignature === taskDraftSignature;
  const teamInviteFormErrors = useMemo<TeamInviteFormErrors>(() => {
    const errors: TeamInviteFormErrors = {};
    const normalizedName = inviteName.trim();
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedName) {
      errors.name = t("请输入成员姓名");
    } else if (normalizedName.length > 40) {
      errors.name = t("成员姓名不能超过 40 个字");
    }
    if (!normalizedEmail) {
      errors.email = t("请输入工作邮箱");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = t("请输入有效的邮箱地址");
    } else if (
      teamMembers.some((member) => member.email.toLowerCase() === normalizedEmail)
    ) {
      errors.email = t("这个邮箱已经在当前工作区中");
    }
    return errors;
  }, [inviteEmail, inviteName, teamMembers]);
  const teamInviteFormHasErrors =
    Object.keys(teamInviteFormErrors).length > 0;
  const inviteNeedsAdminAcknowledgement =
    inviteRole === "管理员" && !inviteAdminAcknowledged;
  const noticeIsCaution =
    /失败|不能|请先|无效|损坏|已拒绝|离线|无法连接/.test(notice);
  const workspaceSyncHasConflict = Boolean(
    workspaceSyncNotice?.conflicts.length,
  );
  const taskWorkspaceConflict =
    workspaceSyncNotice?.conflicts.includes("task") ?? false;
  const artifactWorkspaceConflict =
    workspaceSyncNotice?.conflicts.includes("artifact") ?? false;
  const budgetWorkspaceConflict =
    workspaceSyncNotice?.conflicts.includes("budget") ?? false;
  const usageBudgetCanSave =
    usageBudgetCanSaveBase && !budgetWorkspaceConflict;
  const memberWorkspaceConflict =
    workspaceSyncNotice?.conflicts.includes("member") ?? false;
  const memberRoleCanSave =
    teamMemberRoleDirty && isOnline && !memberWorkspaceConflict;
  const profileWorkspaceConflict =
    workspaceSyncNotice?.conflicts.includes("profile") ?? false;
  const workspaceSyncLabel = workspaceSyncNotice
    ? workspaceSyncNotice.sections
        .map((section) => workspaceSyncSectionLabels[section])
        .join(t("、"))
    : "";
  const artifactUndoAvailable = Boolean(
    artifactDeleteSnapshot &&
      notice === t("已删除成果“{title}”", { title: artifactDeleteSnapshot.artifact.title }),
  );
  const taskDeleteUndoAvailable = Boolean(
    taskDeleteSnapshot && notice.startsWith(t("已删除 ")),
  );
  const approvalRejectUndoAvailable = Boolean(
    approvalRejectSnapshot && notice.startsWith(t("已拒绝")),
  );

  function applyWorkspaceSyncSnapshot(
    snapshot: WorkspaceSyncSnapshot,
    options: { preserveProfileDraft?: boolean } = {},
  ) {
    const signature = workspaceSyncSignature(snapshot);
    const nextApprovals = workspaceDefaults.approvals.filter((approval) =>
      snapshot.approvalIds.includes(approval.id),
    );
    const nextTaskIds = new Set(snapshot.tasks.map((task) => task.id));
    const nextArtifactIds = new Set(
      snapshot.artifacts.map((artifact) => artifact.id),
    );
    const nextActivityIds = new Set(
      snapshot.activity.map((activity) => activity.id),
    );
    const nextApprovalIds = new Set(nextApprovals.map((approval) => approval.id));
    const nextApprovalDeferrals = Object.fromEntries(
      Object.entries(snapshot.approvalDeferrals).filter(([approvalId]) =>
        nextApprovalIds.has(approvalId),
      ),
    );
    const nextMemberIds = new Set(snapshot.members.map((member) => member.id));
    const nextRunIds = new Set(
      snapshot.tasks.flatMap((task) => (task.runs ?? []).map((run) => run.id)),
    );

    applyingExternalWorkspaceSyncRef.current = true;
    externalWorkspaceSyncSignatureRef.current = signature;
    setWorkspacePersistenceStatus("saved");
    setWorkspacePersistenceDetail("");
    setWorkspaceLastSavedAt(snapshot.updatedAt);
    setWorkspaceProfile(snapshot.profile);
    if (!options.preserveProfileDraft) {
      setWorkspaceNameDraft(snapshot.profile.name);
      setWorkspaceDescriptionDraft(snapshot.profile.description);
    }
    setTasks(snapshot.tasks);
    setSettings(snapshot.settings);
    setUsageSettings(snapshot.usage);
    setConnectorStates(snapshot.connectors);
    setTeamMembers(snapshot.members);
    setApprovals(nextApprovals);
    setApprovalDeferrals(nextApprovalDeferrals);
    setActivityLog(snapshot.activity.slice(0, 100));
    setArtifacts(snapshot.artifacts.slice(0, 100));
    setIsRunning(
      snapshot.tasks.find((task) => task.id === "competitor")?.status !==
        "已暂停",
    );
    setSelectedTaskIds((ids) => ids.filter((id) => nextTaskIds.has(id)));
    setSelectedTaskId((id) => (id && nextTaskIds.has(id) ? id : null));
    setDeleteTaskId((id) => (id && nextTaskIds.has(id) ? id : null));
    setActivityTaskId((id) => (id && nextTaskIds.has(id) ? id : null));
    setArtifactTaskId((id) => (id && nextTaskIds.has(id) ? id : null));
    setInspectedRunTaskId((id) => (id && nextTaskIds.has(id) ? id : null));
    setInspectedRunId((id) => (id && nextRunIds.has(id) ? id : null));
    setSelectedApprovalIds((ids) =>
      ids.filter((id) => nextApprovalIds.has(id)),
    );
    setSelectedApprovalId((id) =>
      id && nextApprovalIds.has(id) ? id : (nextApprovals[0]?.id ?? ""),
    );
    setApprovalSnoozeId((id) =>
      id && nextApprovalIds.has(id) ? id : null,
    );
    setSelectedArtifactId((id) =>
      id && nextArtifactIds.has(id)
        ? id
        : (snapshot.artifacts[0]?.id ?? ""),
    );
    setArtifactDeleteId((id) =>
      id && nextArtifactIds.has(id) ? id : null,
    );
    setSelectedActivityId((id) =>
      id && nextActivityIds.has(id)
        ? id
        : (snapshot.activity[0]?.id ?? ""),
    );
    setSelectedTeamMemberId((id) =>
      id && nextMemberIds.has(id) ? id : null,
    );
  }

  useEffect(() => {
    const now = Date.now();
    const nextDueAt = Math.min(
      ...Object.values(approvalDeferrals)
        .map((deferredUntil) => Date.parse(deferredUntil))
        .filter((deferredUntil) => deferredUntil > now),
    );
    if (!Number.isFinite(nextDueAt)) return;
    const delay = Math.max(250, Math.min(30000, nextDueAt - now + 50));
    const timer = window.setTimeout(() => {
      setApprovalClock(Date.now());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [approvalClock, approvalDeferrals]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDesktopNotificationPermission(
        "Notification" in window
          ? window.Notification.permission
          : "unsupported",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setOnboardingDismissed(
          window.localStorage.getItem(onboardingPreferenceKey) === "true",
        );
      } catch {
        setOnboardingDismissed(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleOffline() {
      setNotice(t("设备已离线，本机任务、成果和审计记录仍可查看"));
    }

    function handleOnline() {
      setNotice(t("网络连接已恢复，在线能力可以继续使用"));
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedDraft = window.sessionStorage.getItem(taskDraftRecoveryKey);
        if (!savedDraft) return;
        const recovery = parseTaskDraftRecovery(JSON.parse(savedDraft));
        if (!recovery) {
          clearDraftRecoveryStorage(taskDraftRecoveryKey);
          return;
        }
        setPendingTaskDraftRecovery(recovery);
      } catch {
        clearDraftRecoveryStorage(taskDraftRecoveryKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedDraft = window.sessionStorage.getItem(
          artifactDraftRecoveryKey,
        );
        if (!savedDraft) return;
        const recovery = parseArtifactDraftRecovery(JSON.parse(savedDraft));
        if (!recovery) {
          clearDraftRecoveryStorage(artifactDraftRecoveryKey);
          return;
        }
        setPendingArtifactDraftRecovery(recovery);
      } catch {
        clearDraftRecoveryStorage(artifactDraftRecoveryKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!taskComposerDirty && !artifactEditorDirty && !settingsDraftDirty) return;

    function protectUnsavedWork(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", protectUnsavedWork);
    return () => window.removeEventListener("beforeunload", protectUnsavedWork);
  }, [artifactEditorDirty, settingsDraftDirty, taskComposerDirty]);

  useEffect(() => {
    if (!composerOpen || !taskDraftBaseline) return;

    if (!taskComposerDirty) {
      if (taskDraftRecoveryOwnedRef.current) {
        clearDraftRecoveryStorage(taskDraftRecoveryKey);
        taskDraftRecoveryOwnedRef.current = false;
        const resetTimer = window.setTimeout(() => {
          setPendingTaskDraftRecovery(null);
          setTaskDraftAutoSavedAt(null);
          setTaskDraftAutoSavedSignature("");
          setTaskDraftSaveFailedSignature("");
        }, 0);
        return () => window.clearTimeout(resetTimer);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      // 正在提交：createTask 会清掉草稿。这个定时器可能在清掉之后、关闭
      // 对话框的状态提交之前触发，再写一次就成了"已创建的任务还留着草稿"。
      if (taskSavingRef.current) return;
      const savedAt = new Date().toISOString();
      const recovery: TaskDraftRecovery = {
        version: 1,
        savedAt,
        editingTaskId,
        draft: {
          name: taskName,
          target: taskTarget,
          description: taskDescription,
          schedule: taskSchedule,
          scheduleTime: taskScheduleTime,
          scheduleDay: taskScheduleDay,
          approval: taskApproval,
        },
        baseline: taskDraftBaseline,
      };

      try {
        window.sessionStorage.setItem(
          taskDraftRecoveryKey,
          JSON.stringify(recovery),
        );
        taskDraftRecoveryOwnedRef.current = true;
        setPendingTaskDraftRecovery(null);
        setTaskDraftAutoSavedAt(savedAt);
        setTaskDraftAutoSavedSignature(taskDraftSignature);
        setTaskDraftSaveFailedSignature("");
      } catch {
        setTaskDraftSaveFailedSignature(taskDraftSignature);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    composerOpen,
    editingTaskId,
    taskApproval,
    taskComposerDirty,
    taskDescription,
    taskDraftBaseline,
    taskName,
    taskSchedule,
    taskScheduleDay,
    taskScheduleTime,
    taskTarget,
    taskDraftSignature,
  ]);

  useEffect(() => {
    if (!editingArtifact) return;

    if (!artifactEditorDirty) {
      if (artifactDraftRecoveryOwnedRef.current) {
        clearDraftRecoveryStorage(artifactDraftRecoveryKey);
        artifactDraftRecoveryOwnedRef.current = false;
        const resetTimer = window.setTimeout(() => {
          setPendingArtifactDraftRecovery(null);
          setArtifactDraftAutoSavedAt(null);
          setArtifactDraftAutoSavedSignature("");
          setArtifactDraftSaveFailedSignature("");
        }, 0);
        return () => window.clearTimeout(resetTimer);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const recovery: ArtifactDraftRecovery = {
        version: 1,
        savedAt,
        artifactId: editingArtifact.id,
        baseVersion: editingArtifactVersion,
        draft: {
          title: artifactTitleDraft,
          filename: artifactFilenameDraft,
          content: artifactContentDraft,
        },
      };

      try {
        window.sessionStorage.setItem(
          artifactDraftRecoveryKey,
          JSON.stringify(recovery),
        );
        artifactDraftRecoveryOwnedRef.current = true;
        setPendingArtifactDraftRecovery(null);
        setArtifactDraftAutoSavedAt(savedAt);
        setArtifactDraftAutoSavedSignature(artifactDraftSignature);
        setArtifactDraftSaveFailedSignature("");
      } catch {
        setArtifactDraftSaveFailedSignature(artifactDraftSignature);
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    artifactContentDraft,
    artifactDraftSignature,
    artifactEditorDirty,
    artifactFilenameDraft,
    artifactTitleDraft,
    editingArtifact,
    editingArtifactVersion,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedWorkspaceSync =
          window.localStorage.getItem(workspaceSyncKey);
        const syncedWorkspace =
          parseWorkspaceSyncSnapshot(savedWorkspaceSync);
        if (savedWorkspaceSync && !syncedWorkspace) {
          window.localStorage.removeItem(workspaceSyncKey);
        }
        if (syncedWorkspace) {
          lastWorkspaceSyncSignatureRef.current =
            workspaceSyncSignature(syncedWorkspace);
          setWorkspaceLastSavedAt(syncedWorkspace.updatedAt);
          setWorkspaceProfile(syncedWorkspace.profile);
        }
        const saved = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.tasks)
          : window.localStorage.getItem("unzoo-one-tasks");
        const savedSettings = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.settings)
          : window.localStorage.getItem("unzoo-one-settings");
        const savedUsage = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.usage)
          : window.localStorage.getItem("unzoo-one-usage");
        const savedConnectors = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.connectors)
          : window.localStorage.getItem("unzoo-one-connectors");
        const savedTeam = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.members)
          : window.localStorage.getItem("unzoo-one-team");
        const savedApprovalIds = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.approvalIds)
          : window.localStorage.getItem("unzoo-one-pending-approvals");
        const savedActivity = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.activity)
          : window.localStorage.getItem("unzoo-one-activity");
        const savedArtifacts = syncedWorkspace
          ? JSON.stringify(syncedWorkspace.artifacts)
          : window.localStorage.getItem("unzoo-one-artifacts");
        const savedRecentSearches = window.localStorage.getItem(
          "unzoo-one-recent-searches",
        );
        const savedReadNotifications = window.localStorage.getItem(
          "unzoo-one-read-notifications",
        );
        const savedLastWorkspaceBackupAt = window.localStorage.getItem(
          workspaceLastBackupKey,
        );
        const schemaVersion = Number(
          window.localStorage.getItem("unzoo-one-schema-version") ?? "1",
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalizedTasks = (parsed as TaskItem[]).map((task) => {
              const schedule: TaskSchedule =
                schemaVersion < 2 &&
                task.id === "competitor" &&
                task.schedule === "仅运行一次"
                  ? "每天"
                  : task.schedule ??
                    (task.id === "competitor"
                      ? "每天"
                      : task.id === "weekly-report"
                        ? "每周"
                        : "仅运行一次");
              return {
                ...task,
                schedule,
                scheduleTime:
                  task.scheduleTime ?? (schedule === "仅运行一次" ? undefined : "09:00"),
                scheduleDay:
                  task.scheduleDay ?? (schedule === "每周" ? "周一" : undefined),
                requiresApproval: task.requiresApproval ?? true,
                pinned: task.pinned ?? task.id === "competitor",
                runs: Array.isArray(task.runs)
                  ? task.runs.filter(isTaskRun).slice(0, 12)
                  : [],
                retryCount:
                  typeof task.retryCount === "number" ? task.retryCount : 0,
              };
            });
            setTasks(normalizedTasks);
            const primaryTask = normalizedTasks.find(
              (task) => task.id === "competitor",
            );
            setIsRunning(primaryTask?.status !== "已暂停");
          }
        }
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings) as Partial<SettingsState>;
          setSettings((current) => ({
            approval:
              typeof parsedSettings.approval === "boolean"
                ? parsedSettings.approval
                : current.approval,
            local:
              typeof parsedSettings.local === "boolean"
                ? parsedSettings.local
                : current.local,
            notifications:
              typeof parsedSettings.notifications === "boolean"
                ? parsedSettings.notifications
                : current.notifications,
          }));
        }
        if (savedUsage) {
          const parsedUsage = JSON.parse(savedUsage);
          if (isUsageSettings(parsedUsage)) {
            setUsageSettings(parsedUsage);
          } else {
            window.localStorage.removeItem("unzoo-one-usage");
          }
        }
        if (savedConnectors) {
          const parsedConnectors = JSON.parse(savedConnectors);
          if (isConnectorState(parsedConnectors)) {
            setConnectorStates(parsedConnectors);
          } else {
            window.localStorage.removeItem("unzoo-one-connectors");
          }
        }
        if (savedTeam) {
          const parsedTeam = JSON.parse(savedTeam);
          if (
            Array.isArray(parsedTeam) &&
            parsedTeam.length > 0 &&
            parsedTeam.every(isTeamMember)
          ) {
            setTeamMembers(parsedTeam);
          } else {
            window.localStorage.removeItem("unzoo-one-team");
          }
        }
        if (savedApprovalIds) {
          const approvalIds = JSON.parse(savedApprovalIds);
          if (Array.isArray(approvalIds)) {
            const pendingApprovals = workspaceDefaults.approvals.filter((item) =>
              approvalIds.includes(item.id),
            );
            setApprovals(pendingApprovals);
            setSelectedApprovalId(pendingApprovals[0]?.id ?? "");
          }
        }
        setApprovalDeferrals(
          syncedWorkspace
            ? Object.fromEntries(
                Object.entries(syncedWorkspace.approvalDeferrals).filter(
                  ([approvalId]) =>
                    syncedWorkspace.approvalIds.includes(approvalId),
                ),
              )
            : {},
        );
        if (savedActivity) {
          const parsedActivity = JSON.parse(savedActivity);
          if (Array.isArray(parsedActivity)) {
            setActivityLog(
              (parsedActivity as ActivityItem[])
                .filter(
                  (item) =>
                    item &&
                    typeof item.id === "string" &&
                    typeof item.title === "string" &&
                    typeof item.detail === "string",
                )
                .slice(0, 100),
            );
          }
        }
        if (savedArtifacts) {
          const parsedArtifacts = JSON.parse(savedArtifacts);
          if (Array.isArray(parsedArtifacts)) {
            const validArtifacts = parsedArtifacts
              .filter(isArtifactItem)
              .slice(0, 100);
            setArtifacts(validArtifacts);
            setSelectedArtifactId(validArtifacts[0]?.id ?? "");
          }
        }
        if (savedRecentSearches) {
          const parsedRecentSearches = JSON.parse(savedRecentSearches);
          if (
            Array.isArray(parsedRecentSearches) &&
            parsedRecentSearches.every((key) => typeof key === "string")
          ) {
            setRecentSearchKeys(parsedRecentSearches.slice(0, 4));
          }
        }
        if (savedReadNotifications) {
          const parsedReadNotifications = JSON.parse(savedReadNotifications);
          if (
            Array.isArray(parsedReadNotifications) &&
            parsedReadNotifications.every((id) => typeof id === "string")
          ) {
            setReadNotificationIds(parsedReadNotifications.slice(0, 30));
          }
        }
        if (savedLastWorkspaceBackupAt) {
          if (Number.isNaN(Date.parse(savedLastWorkspaceBackupAt))) {
            window.localStorage.removeItem(workspaceLastBackupKey);
          } else {
            setLastWorkspaceBackupAt(savedLastWorkspaceBackupAt);
          }
        }
        window.localStorage.setItem("unzoo-one-schema-version", "11");
      } catch (error) {
        lastWorkspaceSyncSignatureRef.current = "";
        if (error instanceof SyntaxError) {
          removeLocalStorageItems([
            ...legacyWorkspaceStorageKeys,
            ...workspacePreferenceStorageKeys,
            workspaceSyncKey,
          ]);
          setWorkspaceLoadWarning(
            t("检测到损坏的本机数据，已使用安全的默认工作区启动。你可以继续使用，或从备份恢复原有内容。"),
          );
        } else {
          const detail = getWorkspacePersistenceError(error);
          setWorkspacePersistenceStatus("failed");
          setWorkspacePersistenceDetail(detail);
          setWorkspaceLoadWarning(
            t("浏览器未能完成本机数据校验，当前页面已使用安全的默认工作区。请先重试保存，或从备份恢复。"),
          );
        }
      } finally {
        setTasksReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      !tasksReady ||
      desktopNotificationPermission === "checking" ||
      desktopNotificationPermission === "granted" ||
      !settings.notifications
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSettings((current) =>
        current.notifications ? { ...current, notifications: false } : current,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [desktopNotificationPermission, settings.notifications, tasksReady]);

  useEffect(() => {
    if (!tasksReady) return;

    function restoreWorkspaceRoute() {
      const requestedRoute = readWorkspaceRoute();
      const routeTask = requestedRoute.taskId
        ? tasks.find((task) => task.id === requestedRoute.taskId) ?? null
        : null;
      const routeRun =
        routeTask && requestedRoute.runId
          ? (routeTask.runs ?? []).find(
              (run) => run.id === requestedRoute.runId,
            ) ?? null
          : null;
      const routeArtifact =
        !routeTask && requestedRoute.artifactId
          ? artifacts.find(
              (artifact) => artifact.id === requestedRoute.artifactId,
            ) ?? null
          : null;
      const fallbackArtifact =
        !routeTask && requestedRoute.view === "artifacts"
          ? (artifacts[0] ?? null)
          : null;
      const routeApproval =
        !routeTask && requestedRoute.approvalId
          ? approvals.find(
              (approval) => approval.id === requestedRoute.approvalId,
            ) ?? null
          : null;
      let resolvedApprovalFilter =
        requestedRoute.approvalFilter ?? "全部";
      const routeApprovalDeferredUntil = routeApproval
        ? approvalDeferrals[routeApproval.id]
        : undefined;
      const routeApprovalIsDeferred = Boolean(
        routeApprovalDeferredUntil &&
          Date.parse(routeApprovalDeferredUntil) > approvalClock,
      );
      if (routeApproval) {
        if (routeApprovalIsDeferred) {
          resolvedApprovalFilter = "稍后";
        } else if (
          resolvedApprovalFilter === "稍后" ||
          (resolvedApprovalFilter !== "全部" &&
            routeApproval.risk !== resolvedApprovalFilter)
        ) {
          resolvedApprovalFilter = "全部";
        }
      }
      const fallbackApproval =
        !routeTask && requestedRoute.view === "approvals"
          ? (approvals.find((approval) => {
              const deferredUntil = approvalDeferrals[approval.id];
              const isDeferred = Boolean(
                deferredUntil && Date.parse(deferredUntil) > approvalClock,
              );
              return (
                (resolvedApprovalFilter === "稍后"
                  ? isDeferred
                  : !isDeferred) &&
                (resolvedApprovalFilter === "全部" ||
                  resolvedApprovalFilter === "稍后" ||
                  approval.risk === resolvedApprovalFilter)
              );
            }) ?? null)
          : null;
      const requestedActivityTask =
        !routeTask && requestedRoute.activityTaskId
          ? tasks.find((task) => task.id === requestedRoute.activityTaskId) ??
            null
          : null;
      const routeActivity =
        !routeTask && requestedRoute.activityId
          ? activityLog.find(
              (activity) => activity.id === requestedRoute.activityId,
            ) ?? null
          : null;
      let resolvedActivityTaskId = requestedActivityTask?.id ?? null;
      let resolvedActivityFilter =
        requestedRoute.activityFilter ?? "全部";
      if (
        routeActivity &&
        resolvedActivityTaskId &&
        routeActivity.taskId !== resolvedActivityTaskId
      ) {
        resolvedActivityTaskId = null;
      }
      if (
        routeActivity &&
        resolvedActivityFilter !== "全部" &&
        routeActivity.kind !== resolvedActivityFilter
      ) {
        resolvedActivityFilter = "全部";
      }
      const fallbackActivity =
        !routeTask && requestedRoute.view === "activity"
          ? (activityLog.find(
              (activity) =>
                (!resolvedActivityTaskId ||
                  activity.taskId === resolvedActivityTaskId) &&
                (resolvedActivityFilter === "全部" ||
                  activity.kind === resolvedActivityFilter),
            ) ?? null)
          : null;
      const resolvedRoute: WorkspaceRoute = {
        view: routeTask ? "tasks" : requestedRoute.view,
        taskId: routeTask?.id ?? null,
        runId: routeRun?.id ?? null,
        artifactId:
          !routeTask && requestedRoute.view === "artifacts"
            ? (routeArtifact?.id ?? fallbackArtifact?.id ?? null)
            : null,
        approvalId:
          !routeTask && requestedRoute.view === "approvals"
            ? (routeApproval?.id ?? fallbackApproval?.id ?? null)
            : null,
        activityId:
          !routeTask && requestedRoute.view === "activity"
            ? (routeActivity?.id ?? fallbackActivity?.id ?? null)
            : null,
        activityTaskId:
          !routeTask && requestedRoute.view === "activity"
            ? resolvedActivityTaskId
            : null,
        taskFilter:
          requestedRoute.view === "tasks"
            ? (requestedRoute.taskFilter ?? null)
            : null,
        approvalFilter:
          requestedRoute.view === "approvals"
            ? resolvedApprovalFilter
            : null,
        activityFilter:
          requestedRoute.view === "activity"
            ? resolvedActivityFilter
            : null,
        settingsSection:
          requestedRoute.view === "settings"
            ? (requestedRoute.settingsSection ?? "overview")
            : null,
      };
      const currentHistoryState = window.history.state as
        | WorkspaceHistoryState
        | null;

      setActiveView(resolvedRoute.view);
      setTaskFilter(
        resolvedRoute.view === "tasks"
          ? (resolvedRoute.taskFilter ?? "全部")
          : "全部",
      );
      setApprovalRiskFilter(
        resolvedRoute.view === "approvals"
          ? (resolvedRoute.approvalFilter ?? "全部")
          : "全部",
      );
      setApprovalListQuery("");
      setSelectedApprovalId(
        resolvedRoute.view === "approvals"
          ? (resolvedRoute.approvalId ?? "")
          : (approvals[0]?.id ?? ""),
      );
      setActivityTaskId(
        resolvedRoute.view === "activity"
          ? (resolvedRoute.activityTaskId ?? null)
          : null,
      );
      setActivityFilter(
        resolvedRoute.view === "activity"
          ? (resolvedRoute.activityFilter ?? "全部")
          : "全部",
      );
      setActivityListQuery("");
      setSelectedActivityId(
        resolvedRoute.view === "activity"
          ? (resolvedRoute.activityId ?? "")
          : (activityLog[0]?.id ?? ""),
      );
      setSelectedTaskId(
        resolvedRoute.taskId && !resolvedRoute.runId
          ? resolvedRoute.taskId
          : null,
      );
      setInspectedRunTaskId(
        resolvedRoute.runId ? resolvedRoute.taskId : null,
      );
      setInspectedRunId(resolvedRoute.runId);
      setArtifactTaskId(null);
      setArtifactFilter("全部");
      setArtifactListQuery("");
      setSelectedArtifactId(
        resolvedRoute.view === "artifacts"
          ? (resolvedRoute.artifactId ?? "")
          : (artifacts[0]?.id ?? ""),
      );
      const nextSettingsSection =
        resolvedRoute.view === "settings"
          ? (resolvedRoute.settingsSection ?? "overview")
          : "overview";
      settingsSectionRef.current = nextSettingsSection;
      setSettingsSection(nextSettingsSection);
      setNotificationsOpen(false);
      setSearchOpen(false);
      if (
        requestedRoute.view === "artifacts" &&
        requestedRoute.artifactId &&
        !routeArtifact
      ) {
        setNotice(
          fallbackArtifact
            ? t("该成果已不存在，已打开最新可用成果")
            : t("该成果已不存在，当前工作区还没有其他成果"),
        );
      }
      if (
        requestedRoute.view === "approvals" &&
        requestedRoute.approvalId &&
        !routeApproval
      ) {
        setNotice(
          fallbackApproval
            ? t("该审批已处理或不存在，已打开当前队列中的下一项")
            : t("该审批已处理或不存在，当前筛选下没有其他待办"),
        );
      }
      if (
        requestedRoute.view === "activity" &&
        requestedRoute.activityId &&
        !routeActivity
      ) {
        setNotice(
          fallbackActivity
            ? t("该审计事件已不存在，已打开范围内最新记录")
            : t("该审计事件已不存在，当前范围还没有其他记录"),
        );
      } else if (
        requestedRoute.view === "activity" &&
        requestedRoute.activityTaskId &&
        !requestedActivityTask
      ) {
        setNotice(t("关联任务已不存在，已打开全部审计记录"));
      }
      writeWorkspaceRoute(
        resolvedRoute,
        "replace",
        Boolean(currentHistoryState?.unzooOne && currentHistoryState.canPop),
      );
      if (resolvedRoute.view === "settings") {
        scrollSettingsSectionIntoView(nextSettingsSection, "auto");
      }
    }

    if (!routeReadyRef.current) {
      routeReadyRef.current = true;
      restoreWorkspaceRoute();
    }

    window.addEventListener("popstate", restoreWorkspaceRoute);
    return () => window.removeEventListener("popstate", restoreWorkspaceRoute);
  }, [
    activityLog,
    approvalClock,
    approvalDeferrals,
    approvals,
    artifacts,
    tasks,
    tasksReady,
  ]);

  useEffect(() => {
    if (!tasksReady || activeView !== "settings") return;
    let frame: number | null = null;

    function updateVisibleSettingsSection() {
      frame = null;
      if (settingsSectionScrollTargetRef.current || overlayOpen) return;
      const settingsNavBottom =
        document
          .querySelector(".settings-section-nav")
          ?.getBoundingClientRect().bottom ?? (window.innerWidth <= 680 ? 124 : 78);
      const anchor = settingsNavBottom + 16;
      const currentElement = document.getElementById(
        getSettingsSectionElementId(settingsSectionRef.current),
      );
      const currentRect = currentElement?.getBoundingClientRect();
      let nextSection: SettingsSectionId | null =
        currentRect &&
        currentRect.top <= anchor &&
        currentRect.bottom > anchor
          ? settingsSectionRef.current
          : null;

      if (!nextSection) {
        let closestTop = Number.NEGATIVE_INFINITY;
        settingsSections.forEach((section) => {
          const element = document.getElementById(
            getSettingsSectionElementId(section.id),
          );
          const top = element?.getBoundingClientRect().top;
          if (top !== undefined && top <= anchor && top > closestTop) {
            closestTop = top;
            nextSection = section.id;
          }
        });
      }

      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8
      ) {
        nextSection = settingsSections.at(-1)?.id ?? "security";
      }
      if (!nextSection || nextSection === settingsSectionRef.current) return;

      settingsSectionRef.current = nextSection;
      setSettingsSection(nextSection);
      writeWorkspaceRoute(
        {
          view: "settings",
          taskId: null,
          runId: null,
          settingsSection: nextSection,
        },
        "replace",
        canReturnToWorkspaceParent(),
      );
    }

    function queueSettingsSectionUpdate() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(updateVisibleSettingsSection);
    }

    window.addEventListener("scroll", queueSettingsSectionUpdate, {
      passive: true,
    });
    window.addEventListener("resize", queueSettingsSectionUpdate);
    queueSettingsSectionUpdate();
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueSettingsSectionUpdate);
      window.removeEventListener("resize", queueSettingsSectionUpdate);
    };
  }, [activeView, overlayOpen, tasksReady]);

  useEffect(() => {
    if (activeView !== "settings" || window.innerWidth > 680) return;
    const frame = window.requestAnimationFrame(() => {
      const container = document.querySelector<HTMLElement>(
        ".settings-section-links",
      );
      const activeButton = container?.querySelector<HTMLElement>(
        `[data-settings-section="${settingsSection}"]`,
      );
      if (!container || !activeButton) return;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const isFullyVisible =
        buttonRect.left >= containerRect.left &&
        buttonRect.right <= containerRect.right;
      if (isFullyVisible) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      container.scrollTo({
        left:
          container.scrollLeft +
          buttonRect.left -
          containerRect.left -
          (container.clientWidth - buttonRect.width) / 2,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, settingsSection]);

  useEffect(() => {
    const containerSelector =
      activeView === "tasks"
        ? ".view-filter-tabs"
        : activeView === "approvals"
          ? ".approval-risk-filters"
          : activeView === "artifacts"
            ? ".artifact-filter-tabs"
            : null;
    if (!containerSelector) return;
    let frame: number | null = null;

    function revealActiveMobileFilter() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (window.innerWidth > 680) return;
        const container =
          document.querySelector<HTMLElement>(containerSelector);
        const activeButton =
          container?.querySelector<HTMLElement>("button.active");
        if (!container || !activeButton) return;
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        if (
          buttonRect.left >= containerRect.left &&
          buttonRect.right <= containerRect.right
        ) {
          return;
        }
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        container.scrollTo({
          left:
            container.scrollLeft +
            buttonRect.left -
            containerRect.left -
            (container.clientWidth - buttonRect.width) / 2,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    }

    revealActiveMobileFilter();
    window.addEventListener("resize", revealActiveMobileFilter);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", revealActiveMobileFilter);
    };
  }, [activeView, approvalRiskFilter, artifactFilter, taskFilter]);

  useEffect(() => {
    if (!tasksReady) return;
    if (pendingWorkspaceSyncRef.current) return;
    const workspaceData: WorkspaceSyncData = {
      profile: workspaceProfile,
      tasks,
      settings,
      usage: usageSettings,
      connectors: connectorStates,
      members: teamMembers,
      approvalIds: approvals.map((item) => item.id),
      approvalDeferrals,
      activity: activityLog.slice(0, 100),
      artifacts: artifacts.slice(0, 100).map(persistableArtifact),
    };
    const signature = workspaceSyncSignature(workspaceData);

    if (applyingExternalWorkspaceSyncRef.current) {
      if (signature === externalWorkspaceSyncSignatureRef.current) {
        applyingExternalWorkspaceSyncRef.current = false;
        externalWorkspaceSyncSignatureRef.current = "";
        lastWorkspaceSyncSignatureRef.current = signature;
      }
      return;
    }

    let persistenceStatusTimer: number | null = null;
    function queuePersistenceStatus(update: () => void) {
      if (persistenceStatusTimer !== null) {
        window.clearTimeout(persistenceStatusTimer);
      }
      persistenceStatusTimer = window.setTimeout(update, 0);
    }

    if (settings.local) {
      try {
        const savedAt = new Date().toISOString();
        if (lastWorkspaceSyncSignatureRef.current !== signature) {
          const snapshot: WorkspaceSyncSnapshot = {
            version: 1,
            source: workspaceTabIdRef.current,
            updatedAt: savedAt,
            ...workspaceData,
          };
          window.localStorage.setItem(
            workspaceSyncKey,
            JSON.stringify(snapshot),
          );
          lastWorkspaceSyncSignatureRef.current = signature;
        }
        window.localStorage.setItem(
          "unzoo-one-recent-searches",
          JSON.stringify(recentSearchKeys.slice(0, 4)),
        );
        window.localStorage.setItem(
          "unzoo-one-read-notifications",
          JSON.stringify(readNotificationIds.slice(0, 30)),
        );
        removeLocalStorageItems(legacyWorkspaceStorageKeys);
        queuePersistenceStatus(() => {
          setWorkspacePersistenceStatus("saved");
          setWorkspacePersistenceDetail("");
          setWorkspaceLastSavedAt(savedAt);
          if (workspaceSaveRetryingRef.current) {
            workspaceSaveRetryingRef.current = false;
            setNotice(t("本机保存已恢复，当前工作区已经安全落盘"));
          }
        });
      } catch (error) {
        lastWorkspaceSyncSignatureRef.current = "";
        const detail = getWorkspacePersistenceError(error);
        queuePersistenceStatus(() => {
          setWorkspacePersistenceStatus("failed");
          setWorkspacePersistenceDetail(detail);
          if (workspaceSaveRetryingRef.current) {
            workspaceSaveRetryingRef.current = false;
            setNotice(t("重试保存失败，请先导出紧急备份"));
          }
        });
      }
    } else {
      const cleared = removeLocalStorageItems([
        ...legacyWorkspaceStorageKeys,
        ...workspacePreferenceStorageKeys,
        workspaceSyncKey,
      ]);
      lastWorkspaceSyncSignatureRef.current = "";
      if (cleared) {
        queuePersistenceStatus(() => {
          setWorkspacePersistenceStatus("temporary");
          setWorkspacePersistenceDetail("");
          setWorkspaceLastSavedAt(null);
          setLastWorkspaceBackupAt(null);
          if (workspaceSaveRetryingRef.current) {
            workspaceSaveRetryingRef.current = false;
            setNotice(t("本机数据已清理，当前为临时会话"));
          }
        });
      } else {
        const detail = getWorkspacePersistenceError(null, true);
        queuePersistenceStatus(() => {
          setWorkspacePersistenceStatus("failed");
          setWorkspacePersistenceDetail(detail);
          if (workspaceSaveRetryingRef.current) {
            workspaceSaveRetryingRef.current = false;
            setNotice(t("重试清理失败，请检查浏览器的站点存储权限"));
          }
        });
      }
    }

    return () => {
      if (persistenceStatusTimer !== null) {
        window.clearTimeout(persistenceStatusTimer);
      }
    };
  }, [
    activityLog,
    approvalDeferrals,
    approvals,
    artifacts,
    connectorStates,
    readNotificationIds,
    recentSearchKeys,
    settings,
    tasks,
    tasksReady,
    teamMembers,
    usageSettings,
    workspaceProfile,
    workspaceSaveRetryToken,
  ]);

  useEffect(() => {
    if (!tasksReady || !settings.local) return;

    function receiveWorkspaceSync(event: StorageEvent) {
      if (event.key !== workspaceSyncKey || !event.newValue) return;
      const incoming = parseWorkspaceSyncSnapshot(event.newValue);
      if (!incoming || incoming.source === workspaceTabIdRef.current) return;
      const incomingSignature = workspaceSyncSignature(incoming);
      if (incomingSignature === lastWorkspaceSyncSignatureRef.current) return;

      const currentData: WorkspaceSyncData = {
        profile: workspaceProfile,
        tasks,
        settings,
        usage: usageSettings,
        connectors: connectorStates,
        members: teamMembers,
        approvalIds: approvals.map((approval) => approval.id),
        approvalDeferrals,
        activity: activityLog.slice(0, 100),
        artifacts: artifacts.slice(0, 100).map(persistableArtifact),
      };
      const sections = getWorkspaceSyncSections(currentData, incoming);
      if (sections.length === 0) {
        lastWorkspaceSyncSignatureRef.current = incomingSignature;
        return;
      }

      const conflicts: WorkspaceSyncConflict[] = [];
      if (
        workspaceProfileDirty &&
        JSON.stringify(workspaceProfile) !== JSON.stringify(incoming.profile)
      ) {
        conflicts.push("profile");
      }
      if (editingTaskId && taskComposerDirty) {
        const currentTask =
          tasks.find((task) => task.id === editingTaskId) ?? null;
        const incomingTask =
          incoming.tasks.find((task) => task.id === editingTaskId) ?? null;
        if (JSON.stringify(currentTask) !== JSON.stringify(incomingTask)) {
          conflicts.push("task");
        }
      }
      if (editingArtifactId && artifactEditorDirty) {
        const currentArtifact =
          artifacts.find((artifact) => artifact.id === editingArtifactId) ??
          null;
        const incomingArtifact =
          incoming.artifacts.find(
            (artifact) => artifact.id === editingArtifactId,
          ) ?? null;
        if (
          JSON.stringify(currentArtifact) !== JSON.stringify(incomingArtifact)
        ) {
          conflicts.push("artifact");
        }
      }
      if (
        usageBudgetDirty &&
        JSON.stringify(usageSettings) !== JSON.stringify(incoming.usage)
      ) {
        conflicts.push("budget");
      }
      if (selectedTeamMemberId && teamMemberRoleDirty) {
        const currentMember =
          teamMembers.find((member) => member.id === selectedTeamMemberId) ??
          null;
        const incomingMember =
          incoming.members.find(
            (member) => member.id === selectedTeamMemberId,
          ) ?? null;
        if (JSON.stringify(currentMember) !== JSON.stringify(incomingMember)) {
          conflicts.push("member");
        }
      }

      if (conflicts.length > 0) {
        pendingWorkspaceSyncRef.current = incoming;
      } else {
        pendingWorkspaceSyncRef.current = null;
        applyWorkspaceSyncSnapshot(incoming);
      }
      setWorkspaceSyncNotice({
        id: `${incoming.updatedAt}-${incoming.source}`,
        sections,
        conflicts,
      });
    }

    window.addEventListener("storage", receiveWorkspaceSync);
    return () => window.removeEventListener("storage", receiveWorkspaceSync);
  }, [
    activityLog,
    approvalDeferrals,
    approvals,
    artifactEditorDirty,
    artifacts,
    connectorStates,
    editingArtifactId,
    editingTaskId,
    selectedTeamMemberId,
    settings,
    taskComposerDirty,
    tasks,
    tasksReady,
    teamMemberRoleDirty,
    teamMembers,
    usageBudgetDirty,
    usageSettings,
    workspaceProfile,
    workspaceProfileDirty,
  ]);

  useEffect(() => {
    if (!workspaceSyncNotice || workspaceSyncNotice.conflicts.length > 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setWorkspaceSyncNotice((current) =>
        current?.id === workspaceSyncNotice.id ? null : current,
      );
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [workspaceSyncNotice]);

  useEffect(() => {
    if (!notice) return;
    const timeout =
      notice.startsWith(t("已删除")) || notice.startsWith(t("已拒绝")) ? 10000 : 4200;
    const timer = window.setTimeout(() => {
      setNotice("");
      setTaskDeleteSnapshot(null);
      setArtifactDeleteSnapshot(null);
      setApprovalRejectSnapshot(null);
    }, timeout);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        notificationWrapRef.current &&
        !notificationWrapRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        workspaceMenuWrapRef.current &&
        !workspaceMenuWrapRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    }

    function handleSearchShortcut(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !composerOpen &&
        !usageBudgetOpen &&
        !planCenterOpen &&
        !bulkApprovalDecision &&
        !bulkDeleteOpen &&
        !teamInviteOpen &&
        !selectedTeamMember &&
        !selectedConnector &&
        !deletingArtifact &&
        !inspectedRun &&
        !selectedTask &&
        !deletingTask &&
        !approvalConfirmTarget &&
        !rejectedApproval &&
        !temporaryModeOpen &&
        !workspaceResetOpen &&
        !pendingWorkspaceImport
      ) {
        event.preventDefault();
        setNotificationsOpen(false);
        setWorkspaceMenuOpen(false);
        setSearchOpen(true);
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
      }

      if (event.key === "Escape" && searchOpen) {
        event.preventDefault();
        setSearchOpen(false);
        searchInputRef.current?.blur();
      } else if (event.key === "Escape" && notificationsOpen) {
        event.preventDefault();
        closeNotifications();
      } else if (event.key === "Escape" && workspaceMenuOpen) {
        event.preventDefault();
        closeWorkspaceMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleSearchShortcut);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleSearchShortcut);
    };
  }, [
    bulkApprovalDecision,
    composerOpen,
    bulkDeleteOpen,
    deletingArtifact,
    deletingTask,
    approvalConfirmTarget,
    rejectedApproval,
    notificationsOpen,
    pendingWorkspaceImport,
    planCenterOpen,
    searchOpen,
    inspectedRun,
    selectedConnector,
    selectedTeamMember,
    selectedTask,
    teamInviteOpen,
    temporaryModeOpen,
    usageBudgetOpen,
    workspaceMenuOpen,
    workspaceResetOpen,
  ]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const panel = notificationPanelRef.current;
    if (!panel) return;

    const isMobileSheet = window.matchMedia("(max-width: 680px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobileSheet) {
      document.body.style.overflow = "hidden";
    }

    function keepFocusInNotificationPanel(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener("keydown", keepFocusInNotificationPanel);
    return () => {
      panel.removeEventListener("keydown", keepFocusInNotificationPanel);
      if (isMobileSheet) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!workspaceMenuOpen) return;

    const panel = workspaceMenuPanelRef.current;
    if (!panel) return;

    const isMobileSheet = window.matchMedia("(max-width: 680px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobileSheet) {
      document.body.style.overflow = "hidden";
    }

    function keepFocusInWorkspaceMenu(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener("keydown", keepFocusInWorkspaceMenu);
    return () => {
      panel.removeEventListener("keydown", keepFocusInWorkspaceMenu);
      if (isMobileSheet) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [workspaceMenuOpen]);

  useEffect(() => {
    if (!overlayOpen) return;

    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      const trigger = overlayTriggerRef.current;
      overlayTriggerRef.current = null;
      if (trigger?.isConnected) {
        window.requestAnimationFrame(() => trigger.focus());
      }
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!activeOverlayKind) return;

    const selectorByKind = {
      "settings-discard": ".settings-discard-dialog",
      "workspace-profile": ".workspace-profile-dialog",
      "task-discard": ".task-discard-dialog",
      "artifact-discard": ".artifact-discard-dialog",
      "artifact-editor": ".artifact-editor-dialog",
      "artifact-delete": ".artifact-delete-dialog",
      "usage-budget": ".usage-budget-dialog",
      "plan-center": ".plan-center-dialog",
      import: ".workspace-import-dialog",
      "bulk-approval": ".bulk-approval-dialog",
      "bulk-delete": ".bulk-delete-dialog",
      delete: ".confirm-delete-dialog",
      "approval-snooze": ".approval-snooze-dialog",
      "approval-confirm": ".approval-confirm-dialog",
      reject: ".approval-reject-dialog",
      temporary: ".temporary-session-dialog",
      reset: ".workspace-reset-dialog",
      composer: ".clarity-dialog",
      "team-invite": ".team-invite-dialog",
      "team-member": ".team-member-dialog",
      connector: ".connector-detail-dialog",
      run: ".run-detail-dialog",
      task: ".task-detail-drawer",
    } as const;
    const overlay = document.querySelector<HTMLElement>(
      selectorByKind[activeOverlayKind],
    );
    if (!overlay) return;

    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus =
        overlay.querySelector<HTMLElement>("[data-overlay-initial-focus]") ??
        overlay.querySelector<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
        );
      if (!overlay.contains(document.activeElement)) {
        initialFocus?.focus();
      }
    });

    function closeTopOverlay() {
      if (activeOverlayKind === "settings-discard") {
        setSettingsDiscardTarget(null);
      } else if (activeOverlayKind === "workspace-profile") {
        if (workspaceProfileDirty) {
          setSettingsDiscardTarget("profile");
        } else {
          setWorkspaceProfileOpen(false);
          setWorkspaceProfileSubmitted(false);
        }
      } else if (activeOverlayKind === "task-discard") {
        setTaskDiscardOpen(false);
      } else if (activeOverlayKind === "artifact-discard") {
        setArtifactDiscardOpen(false);
      } else if (activeOverlayKind === "artifact-editor") {
        if (artifactSavingRef.current || isSavingArtifact) return;
        if (artifactEditorDirty) {
          setArtifactDiscardOpen(true);
        } else {
          if (artifactDraftRecoveryOwnedRef.current) {
            clearDraftRecoveryStorage(artifactDraftRecoveryKey);
            artifactDraftRecoveryOwnedRef.current = false;
            setPendingArtifactDraftRecovery(null);
            setArtifactDraftAutoSavedAt(null);
            setArtifactDraftAutoSavedSignature("");
            setArtifactDraftSaveFailedSignature("");
          }
          setEditingArtifactId(null);
          setArtifactTitleDraft("");
          setArtifactFilenameDraft("");
          setArtifactContentDraft("");
          setArtifactEditSubmitted(false);
        }
      } else if (activeOverlayKind === "artifact-delete") {
        setArtifactDeleteId(null);
      } else if (activeOverlayKind === "usage-budget") {
        if (usageBudgetDirty) {
          setSettingsDiscardTarget("budget");
        } else {
          setUsageBudgetOpen(false);
        }
      } else if (activeOverlayKind === "plan-center") {
        setPlanCenterOpen(false);
      } else if (activeOverlayKind === "import") {
        settingsSectionRef.current = "data";
        setSettingsSection("data");
        setPendingWorkspaceImport(null);
        setWorkspaceImportAcknowledged(false);
        setRecoveryBackupCreated(false);
        writeWorkspaceRoute(
          {
            view: "settings",
            taskId: null,
            runId: null,
            settingsSection: "data",
          },
          "replace",
          canReturnToWorkspaceParent(),
        );
      } else if (activeOverlayKind === "bulk-approval") {
        setBulkApprovalDecision(null);
        setApprovalRejectReason("");
      } else if (activeOverlayKind === "bulk-delete") {
        setBulkDeleteOpen(false);
      } else if (activeOverlayKind === "delete") {
        setDeleteTaskId(null);
      } else if (activeOverlayKind === "approval-snooze") {
        setApprovalSnoozeId(null);
      } else if (activeOverlayKind === "approval-confirm") {
        setApprovalConfirmId(null);
        setApprovalConfirmAcknowledged(false);
      } else if (activeOverlayKind === "reject") {
        setRejectApprovalId(null);
        setApprovalRejectReason("");
      } else if (activeOverlayKind === "temporary") {
        setTemporaryModeOpen(false);
      } else if (activeOverlayKind === "reset") {
        settingsSectionRef.current = "data";
        setSettingsSection("data");
        setWorkspaceResetOpen(false);
        setWorkspaceResetAcknowledged(false);
        setRecoveryBackupCreated(false);
        writeWorkspaceRoute(
          {
            view: "settings",
            taskId: null,
            runId: null,
            settingsSection: "data",
          },
          "replace",
          canReturnToWorkspaceParent(),
        );
      } else if (activeOverlayKind === "composer") {
        if (taskSavingRef.current || isSavingTask) return;
        if (taskComposerDirty) {
          setTaskDiscardOpen(true);
        } else {
          if (taskDraftRecoveryOwnedRef.current) {
            clearDraftRecoveryStorage(taskDraftRecoveryKey);
            taskDraftRecoveryOwnedRef.current = false;
            setPendingTaskDraftRecovery(null);
            setTaskDraftAutoSavedAt(null);
            setTaskDraftAutoSavedSignature("");
            setTaskDraftSaveFailedSignature("");
          }
          setComposerOpen(false);
          setEditingTaskId(null);
          setTaskDraftBaseline(null);
          setTaskFormSubmitted(false);
        }
      } else if (activeOverlayKind === "team-invite") {
        if (inviteSavingRef.current) return;
        if (teamInviteDirty) {
          setSettingsDiscardTarget("invite");
        } else {
          setTeamInviteOpen(false);
          setInviteAdminAcknowledged(false);
          setInviteFormSubmitted(false);
        }
      } else if (activeOverlayKind === "team-member") {
        if (teamMemberRoleDirty) {
          setSettingsDiscardTarget("member");
        } else {
          setSelectedTeamMemberId(null);
          setMemberRemoveConfirm(false);
          setMemberRemoveAcknowledged(false);
        }
      } else if (activeOverlayKind === "connector") {
        settingsSectionRef.current = "connectors";
        setSettingsSection("connectors");
        setSelectedConnectorId(null);
        setConnectorDisconnectConfirm(false);
        setConnectorDisconnectAcknowledged(false);
        setConnectorAuthorizeAcknowledged(false);
        writeWorkspaceRoute(
          {
            view: "settings",
            taskId: null,
            runId: null,
            settingsSection: "connectors",
          },
          "replace",
          canReturnToWorkspaceParent(),
        );
      } else if (activeOverlayKind === "run") {
        if (canReturnToWorkspaceParent()) {
          window.history.back();
        } else {
          setInspectedRunTaskId(null);
          setInspectedRunId(null);
          if (inspectedRunTaskId) {
            setActiveView("tasks");
            setSelectedTaskId(inspectedRunTaskId);
            writeWorkspaceRoute(
              {
                view: "tasks",
                taskId: inspectedRunTaskId,
                runId: null,
                taskFilter,
              },
              "replace",
            );
          }
        }
      } else {
        if (canReturnToWorkspaceParent()) {
          window.history.back();
        } else {
          setSelectedTaskId(null);
          writeWorkspaceRoute(
            {
              view: activeView,
              taskId: null,
              runId: null,
              taskFilter: activeView === "tasks" ? taskFilter : null,
            },
            "replace",
          );
        }
      }
    }

    function handleOverlayKeyDown(event: KeyboardEvent) {
      if (
        activeOverlayKind === "artifact-editor" &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        event.stopPropagation();
        overlay
          .querySelector<HTMLButtonElement>('button[type="submit"]')
          ?.click();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeTopOverlay();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          element === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === first || !overlay.contains(activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || !overlay.contains(activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleOverlayKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleOverlayKeyDown, true);
    };
  }, [
    activeOverlayKind,
    activeView,
    artifactEditorDirty,
    inspectedRunTaskId,
    isSavingArtifact,
    isSavingTask,
    taskComposerDirty,
    taskFilter,
    teamInviteDirty,
    teamMemberRoleDirty,
    usageBudgetDirty,
    workspaceProfileDirty,
  ]);

  const searchedTasks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return tasks;
    return tasks.filter((task) =>
      `${task.title} ${task.description} ${task.target} ${task.status}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, tasks]);

  const artifactScopeTask =
    tasks.find((task) => task.id === artifactTaskId) ?? null;
  const scopedArtifacts = useMemo(
    () =>
      artifactTaskId
        ? artifacts.filter((artifact) => artifact.taskId === artifactTaskId)
        : artifacts,
    [artifactTaskId, artifacts],
  );
  const [openArtifactGroups, setOpenArtifactGroups] = useState<Record<string, boolean>>({});
  const filteredArtifacts = useMemo(() => {
    const keyword = artifactListQuery.trim().toLowerCase();
    const filteredByType =
      artifactFilter === "全部"
        ? scopedArtifacts
        : artifactFilter === "重点"
          ? scopedArtifacts.filter((artifact) => artifact.starred)
          : scopedArtifacts.filter((artifact) => artifact.type === artifactFilter);
    const searched = keyword
      ? filteredByType.filter((artifact) => {
          const taskTitle =
            tasks.find((task) => task.id === artifact.taskId)?.title ?? "";
          return `${artifact.title} ${artifact.filename} ${artifact.description} ${artifact.format} ${artifact.type} ${taskTitle}`
            .toLowerCase()
            .includes(keyword);
        })
      : filteredByType;

    return [...searched].sort((first, second) => {
      const recent =
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      if (artifactSort === "重点优先") {
        return Number(second.starred) - Number(first.starred) || recent;
      }
      if (artifactSort === "文件名") {
        return (
          first.filename.localeCompare(second.filename, dateLocale(), {
            numeric: true,
            sensitivity: "base",
          }) || recent
        );
      }
      return recent;
    });
  }, [artifactFilter, artifactListQuery, artifactSort, scopedArtifacts, tasks]);
  const selectedArtifact =
    filteredArtifacts.find((artifact) => artifact.id === selectedArtifactId) ??
    filteredArtifacts[0] ??
    null;
  // 成果按任务分组：一个任务一组，组的先后跟着组里排在最前的那项。
  const artifactGroups = useMemo(() => {
    const groups: { key: string; title: string; items: ArtifactItem[] }[] = [];
    const byKey = new Map<string, (typeof groups)[number]>();
    for (const artifact of filteredArtifacts) {
      const key = artifact.taskId ?? "";
      let group = byKey.get(key);
      if (!group) {
        const title = tasks.find((task) => task.id === artifact.taskId)?.title ?? "";
        group = { key, title, items: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.items.push(artifact);
    }
    return groups;
  }, [filteredArtifacts, tasks]);
  // 本机文件选中时才去读：列表里可能有几十个，不必一次全读。
  const selectedFile =
    selectedArtifact?.file && !selectedArtifact.file.loaded && !selectedArtifact.file.error
      ? { id: selectedArtifact.id, taskId: selectedArtifact.taskId, ...selectedArtifact.file }
      : null;
  useEffect(() => {
    if (!selectedFile) return;
    let cancelled = false;
    const settle = (patch: Partial<ArtifactItem>, file: Partial<NonNullable<ArtifactItem["file"]>>) =>
      setArtifacts((items) =>
        items.map((item) =>
          item.id === selectedFile.id && item.file?.runId === selectedFile.runId
            ? { ...item, ...patch, file: { ...item.file!, ...file } }
            : item,
        ),
      );
    workspaceProvider.runtime
      .output({ taskId: selectedFile.taskId, runId: selectedFile.runId, path: selectedFile.path })
      .then((output) => {
        if (cancelled) return;
        settle(
          { content: output.text ?? "", sizeKb: Math.round((output.size / 1024) * 10) / 10 },
          { loaded: true, binary: output.binary, truncated: output.truncated, absolutePath: output.absolutePath },
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        settle({}, { error: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      cancelled = true;
    };
    // 只在换了要读的文件时读。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.id, selectedFile?.runId]);
  useEffect(() => {
    if (!tasksReady || activeView !== "artifacts") return;
    const nextArtifactId = selectedArtifact?.id ?? "";
    if (nextArtifactId === selectedArtifactId) return;
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: nextArtifactId || null,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }, [activeView, selectedArtifact?.id, selectedArtifactId, tasksReady]);
  const SelectedArtifactIcon = selectedArtifact
    ? artifactIconMap[selectedArtifact.type]
    : Files;
  const artifactStats = useMemo(
    () => ({
      total: scopedArtifacts.length,
      reports: scopedArtifacts.filter((artifact) => artifact.type === "报告").length,
      evidence: scopedArtifacts.reduce(
        (sum, artifact) => sum + (artifact.evidenceCount ?? 0),
        0,
      ),
      size: scopedArtifacts.reduce((sum, artifact) => sum + artifact.sizeKb, 0),
    }),
    [scopedArtifacts],
  );

  const searchResults = useMemo<SearchResult[]>(() => {
    const keyword = query.trim().toLowerCase();
    const taskResults: SearchResult[] = tasks.map((task) => ({
      key: `task-${task.id}`,
      kind: "task",
      id: task.id,
      title: task.title,
      description: `${formatTaskSchedule(task)} · ${task.description}`,
      meta: task.status,
      icon: ListChecks,
    }));
    const artifactResults: SearchResult[] = artifacts.map((artifact) => ({
      key: `artifact-${artifact.id}`,
      kind: "artifact",
      id: artifact.id,
      title: artifact.title,
      description: `${artifact.filename} · ${artifact.description}`,
      meta: artifact.type,
      icon: artifactIconMap[artifact.type],
    }));
    const viewResults: SearchResult[] = navItems.map((item) => ({
      key: `view-${item.id}`,
      kind: "view",
      id: item.id,
      title: item.label,
      description: viewTitles[item.id].description,
      meta: t("页面"),
      icon: item.icon,
    }));
    const actionResults: SearchResult[] = [
      {
        key: "action-new-task",
        kind: "action",
        id: "new-task",
        title: t("新建任务"),
        description: t("配置目标、运行频率和发送前确认规则。"),
        meta: t("快捷操作"),
        icon: Plus,
      },
      {
        key: "action-approvals",
        kind: "action",
        id: "approvals",
        title: t("处理待确认操作"),
        description: activeApprovalCount
          ? t("{activeApprovalCount} 项敏感操作正在等待你的决定。", { activeApprovalCount })
          : deferredApprovalCount
            ? t("{deferredApprovalCount} 项操作已安排稍后提醒。", { deferredApprovalCount })
            : t("当前没有等待确认的敏感操作。"),
        meta: activeApprovalCount ? t("{activeApprovalCount} 项", { activeApprovalCount }) : t("已清空"),
        icon: ShieldCheck,
      },
      {
        key: "action-artifacts",
        kind: "action",
        id: "artifacts",
        title: t("查看最新成果"),
        description: t("{length} 个报告、数据或证据包可以查看。", { length: artifacts.length }),
        meta: t("{length} 项", { length: artifacts.length }),
        icon: Files,
      },
    ];
    const searchCatalog = [
      ...taskResults,
      ...artifactResults,
      ...viewResults,
      ...actionResults,
    ];

    if (!keyword) {
      const recentResults = recentSearchKeys
        .map((key) => searchCatalog.find((result) => result.key === key))
        .filter((result): result is SearchResult => Boolean(result));
      const recentResultKeys = new Set(
        recentResults.map((result) => result.key),
      );
      return [
        ...recentResults,
        ...actionResults.filter((result) => !recentResultKeys.has(result.key)),
        ...taskResults
          .filter((result) => !recentResultKeys.has(result.key))
          .slice(0, 2),
        ...artifactResults
          .filter((result) => !recentResultKeys.has(result.key))
          .slice(0, 1),
      ].slice(0, 9);
    }

    return searchCatalog
      .filter((result) =>
        `${result.title} ${result.description} ${result.meta}`
          .toLowerCase()
          .includes(keyword),
      )
      .slice(0, 8);
  }, [
    activeApprovalCount,
    artifacts,
    deferredApprovalCount,
    query,
    recentSearchKeys,
    tasks,
  ]);

  const searchResultSections = useMemo<SearchResultSection[]>(() => {
    if (!query.trim()) {
      const recentKeySet = new Set(recentSearchKeys);
      const recentResults = searchResults.filter((result) =>
        recentKeySet.has(result.key),
      );
      const otherResults = searchResults.filter(
        (result) => !recentKeySet.has(result.key),
      );
      return [
        {
          id: "recent",
          label: t("最近访问"),
          results: recentResults,
          canClear: true,
        },
        {
          id: "actions",
          label: t("快捷操作"),
          results: otherResults.filter((result) => result.kind === "action"),
        },
        {
          id: "suggested",
          label: t("继续工作"),
          results: otherResults.filter((result) => result.kind !== "action"),
        },
      ].filter((section) => section.results.length > 0);
    }

    const sectionLabels: Record<SearchResultKind, string> = {
      task: "任务",
      artifact: t("成果"),
      view: t("页面"),
      action: t("操作"),
    };
    return (["task", "artifact", "view", "action"] as SearchResultKind[])
      .map((kind) => ({
        id: kind,
        label: sectionLabels[kind],
        results: searchResults.filter((result) => result.kind === kind),
      }))
      .filter((section) => section.results.length > 0);
  }, [query, recentSearchKeys, searchResults]);

  const taskFilterCounts = useMemo<Record<TaskFilter, number>>(
    () => ({
      全部: tasks.length,
      运行中: tasks.filter((task) => task.status === "运行中").length,
      待确认: tasks.filter((task) => task.status === "待确认").length,
      失败: tasks.filter((task) => task.status === "失败").length,
      已完成: tasks.filter((task) => task.status === "已完成").length,
      已暂停: tasks.filter((task) => task.status === "已暂停").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const keyword = taskListQuery.trim().toLowerCase();
    const statusPriority: Record<TaskStatus, number> = {
      失败: 0,
      待确认: 1,
      运行中: 2,
      已暂停: 3,
      已完成: 4,
    };
    const matchingTasks = tasks.filter((task) => {
      if (taskFilter !== "全部" && task.status !== taskFilter) return false;
      if (!keyword) return true;
      return `${task.title} ${task.description} ${task.target} ${task.status} ${formatTaskSchedule(task)}`
        .toLowerCase()
        .includes(keyword);
    });

    return [...matchingTasks].sort((first, second) => {
      if (taskSort === "进度最高") return second.progress - first.progress;
      if (taskSort === "名称") {
        return first.title.localeCompare(second.title, dateLocale());
      }
      return statusPriority[first.status] - statusPriority[second.status];
    });
  }, [taskFilter, taskListQuery, taskSort, tasks]);
  const selectedTasks = tasks.filter((task) =>
    selectedTaskIds.includes(task.id),
  );
  const selectedVisibleTaskCount = filteredTasks.filter((task) =>
    selectedTaskIds.includes(task.id),
  ).length;
  const allVisibleTasksSelected =
    filteredTasks.length > 0 &&
    selectedVisibleTaskCount === filteredTasks.length;
  const deletableSelectedTasks = selectedTasks.filter((task) => !task.pinned);
  const protectedSelectedTaskCount =
    selectedTasks.length - deletableSelectedTasks.length;
  const pausableSelectedTaskCount = selectedTasks.filter(
    (task) => task.status === "运行中" || task.status === "待确认",
  ).length;
  const resumableSelectedTaskCount = selectedTasks.filter(
    (task) =>
      task.status === "已暂停" ||
      task.status === "已完成" ||
      task.status === "失败",
  ).length;
  const unprotectedSelectedTaskCount = selectedTasks.filter(
    (task) => !(task.requiresApproval ?? true),
  ).length;

  const scopedActivityLog = useMemo(
    () =>
      activityTaskId
        ? activityLog.filter((item) => item.taskId === activityTaskId)
        : activityLog,
    [activityLog, activityTaskId],
  );

  const filteredActivityLog = useMemo(() => {
    const keyword = activityListQuery.trim().toLowerCase();
    const matchingItems = scopedActivityLog.filter((item) => {
      if (activityFilter !== "全部" && item.kind !== activityFilter) return false;
      if (!keyword) return true;
      const taskTitle =
        tasks.find((task) => task.id === item.taskId)?.title ?? "";
      return `${item.title} ${item.detail} ${item.kind} ${item.id} ${taskTitle}`
        .toLowerCase()
        .includes(keyword);
    });

    return [...matchingItems].sort((first, second) => {
      const delta =
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      return activitySort === "最新优先" ? delta : -delta;
    });
  }, [
    activityFilter,
    activityListQuery,
    activitySort,
    scopedActivityLog,
    tasks,
  ]);

  const selectedActivity =
    filteredActivityLog.find((item) => item.id === selectedActivityId) ??
    filteredActivityLog[0] ??
    null;
  useEffect(() => {
    if (!tasksReady || activeView !== "activity") return;
    const nextActivityId = selectedActivity?.id ?? "";
    if (nextActivityId === selectedActivityId) return;
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: nextActivityId || null,
        activityTaskId,
        activityFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }, [
    activeView,
    activityFilter,
    activityTaskId,
    selectedActivity?.id,
    selectedActivityId,
    tasksReady,
  ]);
  const SelectedActivityIcon = selectedActivity
    ? activityIconMap[selectedActivity.icon] ?? Activity
    : Activity;
  const selectedActivityTask = selectedActivity?.taskId
    ? tasks.find((task) => task.id === selectedActivity.taskId) ?? null
    : null;

  const activityCounts = useMemo(
    () => ({
      全部: scopedActivityLog.length,
      任务: scopedActivityLog.filter((item) => item.kind === "任务").length,
      审批: scopedActivityLog.filter((item) => item.kind === "审批").length,
      系统: scopedActivityLog.filter((item) => item.kind === "系统").length,
    }),
    [scopedActivityLog],
  );

  const runningTaskCount = tasks.filter((task) => task.status === "运行中").length;
  const completedTaskCount = tasks.filter((task) => task.status === "已完成").length;
  const protectedTaskCount = tasks.filter(
    (task) => task.requiresApproval !== false,
  ).length;
  const settingsAuditItems = activityLog
    .filter((item) => item.kind === "审批" || item.kind === "系统")
    .slice(0, 3);
  const workspaceDataSize = useMemo(() => {
    const serialized = JSON.stringify({
      profile: workspaceProfile,
      tasks,
      settings,
      usage: usageSettings,
      connectors: connectorStates,
      members: teamMembers,
      approvalIds: approvals.map((item) => item.id),
      approvalDeferrals,
      activity: activityLog,
      artifacts,
    });
    return Math.max(1, Math.ceil(serialized.length / 1024));
  }, [
    activityLog,
    approvalDeferrals,
    approvals,
    artifacts,
    connectorStates,
    settings,
    tasks,
    teamMembers,
    usageSettings,
    workspaceProfile,
  ]);
  const workspaceBackupFreshnessLabel =
    formatBackupFreshness(lastWorkspaceBackupAt);
  const workspaceBackupAge = lastWorkspaceBackupAt
    ? Date.now() - Date.parse(lastWorkspaceBackupAt)
    : Number.POSITIVE_INFINITY;
  const workspaceBackupIsFresh =
    Number.isFinite(workspaceBackupAge) &&
    workspaceBackupAge <= 7 * 24 * 60 * 60 * 1000;
  const workspaceAutoSaveReady =
    settings.local && workspacePersistenceStatus === "saved";
  const workspaceRecoveryLayerCount =
    Number(workspaceAutoSaveReady) + Number(Boolean(lastWorkspaceBackupAt)) + 1;
  const workspaceRecoveryTone =
    workspacePersistenceStatus === "failed" || !settings.local
      ? "is-risk"
      : !lastWorkspaceBackupAt || !workspaceBackupIsFresh
        ? "is-attention"
        : "is-ready";
  const workspaceRecoveryHeadline =
    workspacePersistenceStatus === "failed"
      ? t("本机保存需要处理，请立即导出紧急备份")
      : !settings.local
        ? t("当前工作区只在本次会话中保留")
        : !lastWorkspaceBackupAt
          ? t("自动保存正常，建议创建一份可迁移备份")
          : !workspaceBackupIsFresh
            ? t("可恢复，但手动备份已经超过 7 天")
            : t("自动保存与手动备份均已就绪");
  const workspaceRecoveryDetail =
    workspacePersistenceStatus === "failed"
      ? workspacePersistenceDetail
      : !settings.local
        ? t("关闭或刷新页面后无法恢复当前改动，离开前请先导出备份。")
        : lastWorkspaceBackupAt
          ? t("最近可用备份：{workspaceBackupFreshnessLabel}。导入时会再次校验文件结构。", { workspaceBackupFreshnessLabel })
          : t("本机保存用于日常恢复，手动备份用于迁移设备或应对浏览器数据被清理。");
  // The demo shows its sample activity; a real workspace starts with none.
  const latestActivity = activityLog[0] ?? (runtimeMode ? null : workspaceDefaults.activity[0]);
  const latestArtifact = artifacts[0] ?? null;
  const notificationItems = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const failedTasks = tasks.filter((task) => task.status === "失败");
    failedTasks.slice(0, 2).forEach((task) => {
      items.push({
        id: `task-failed-${task.id}-${task.retryCount ?? 0}`,
        title: t("任务需要恢复：{title}", { title: task.title }),
        detail: task.lastError ?? t("任务已安全停止，等待检查后重新运行。"),
        meta: task.updated,
        target: "task",
        targetId: task.id,
        icon: AlertTriangle,
        tone: "red",
      });
    });
    if (activeApprovals.length > 0) {
      items.push({
        id: `approvals-${activeApprovals.map((item) => item.id).join("-")}`,
        title: t("{length} 项操作等你确认", { length: activeApprovals.length }),
        detail: t("涉及外部访问或发送，任务已在执行前暂停。"),
        meta: t("需要处理"),
        target: "approvals",
        icon: ShieldCheck,
        tone: "amber",
      });
    }
    if (latestActivity) {
      items.push({
        id: `activity-${latestActivity.id}`,
        title: latestActivity.title,
        detail: latestActivity.detail,
        meta: latestActivity.time,
        target: "activity",
        targetId: latestActivity.id,
        icon: activityIconMap[latestActivity.icon] ?? Activity,
        tone: "blue",
      });
    }
    if (latestArtifact) {
      items.push({
        id: `artifact-${latestArtifact.id}`,
        title: t("成果已保存：{title}", { title: latestArtifact.title }),
        detail: `${latestArtifact.filename} · ${latestArtifact.sizeKb.toFixed(1)} KB`,
        meta: latestArtifact.updated,
        target: "artifact",
        targetId: latestArtifact.id,
        icon: artifactIconMap[latestArtifact.type],
        tone: "green",
      });
    }
    return items;
  }, [activeApprovals, latestActivity, latestArtifact, tasks]);
  const unreadNotificationCount = notificationItems.filter(
    (item) => !readNotificationIds.includes(item.id),
  ).length;
  const visibleNotificationItems =
    notificationFilter === "未读"
      ? notificationItems.filter(
          (item) => !readNotificationIds.includes(item.id),
        )
      : notificationItems;
  const desktopNotificationPreferenceDetail =
    desktopNotificationPermission === "checking"
      ? t("正在检查浏览器通知权限。")
      : desktopNotificationPermission === "unsupported"
        ? t("当前浏览器不支持桌面通知，页面内通知仍会保留。")
        : desktopNotificationPermission === "denied"
          ? t("浏览器已阻止桌面通知，页面内通知仍会保留。")
          : settings.notifications
            ? t("浏览器授权已通过，需要确认时会发送桌面提醒。")
            : desktopNotificationPermission === "granted"
              ? t("浏览器权限可用，当前未开启主动提醒。")
              : t("开启后浏览器会请求一次桌面通知权限。");
  const desktopNotificationSummary =
    desktopNotificationPermission === "checking"
      ? t("正在检查浏览器通知权限")
      : desktopNotificationPermission === "unsupported"
        ? t("当前浏览器不支持桌面提醒")
        : desktopNotificationPermission === "denied"
          ? t("浏览器已阻止桌面提醒")
          : settings.notifications
            ? t("任务暂停时发送桌面提醒")
            : t("当前不会主动发送桌面提醒");
  const desktopNotificationStateLabel =
    desktopNotificationPermission === "checking"
      ? t("检查中")
      : desktopNotificationPermission === "unsupported"
        ? t("不支持")
        : desktopNotificationPermission === "denied"
          ? t("需授权")
          : settings.notifications
            ? t("已开启")
            : t("已关闭");
  const desktopNotificationStateClass = settings.notifications
    ? "is-safe"
    : desktopNotificationPermission === "denied"
      ? "is-caution"
      : "is-neutral";
  const desktopNotificationActionLabel = settings.notifications
    ? t("关闭提醒")
    : desktopNotificationPermission === "denied"
      ? t("检查权限")
      : desktopNotificationPermission === "unsupported"
        ? t("查看状态")
        : t("开启提醒");

  useEffect(() => {
    const actionableItems = notificationItems.filter(
      (item) => item.target === "task" || item.target === "approvals",
    );
    const currentIds = new Set(actionableItems.map((item) => item.id));

    if (!desktopNotificationTrackingReadyRef.current) {
      desktopNotificationTrackingReadyRef.current = true;
      desktopNotificationIdsRef.current = currentIds;
      return;
    }

    const newItem = actionableItems.find(
      (item) => !desktopNotificationIdsRef.current.has(item.id),
    );
    desktopNotificationIdsRef.current = currentIds;
    if (
      !newItem ||
      !tasksReady ||
      !settings.notifications ||
      desktopNotificationPermission !== "granted" ||
      !("Notification" in window)
    ) {
      return;
    }

    try {
      const desktopNotification = new window.Notification(newItem.title, {
        body: newItem.detail,
        icon: "/unzoo-one-mark-v6.png",
        tag: `unzoo-one-${newItem.id}`,
      });
      desktopNotification.onclick = () => {
        window.focus();
        desktopNotification.close();
      };
    } catch {
      window.setTimeout(
        () =>
          setDesktopNotificationPermission(window.Notification.permission),
        0,
      );
    }
  }, [
    desktopNotificationPermission,
    notificationItems,
    settings.notifications,
    tasksReady,
  ]);

  /**
   * 把已经在界面上生效的改动同步给后端。
   *
   * 界面走乐观更新：本地 state 先改，用户立刻看到结果，provider 在后台执行
   * 真实操作。mock 实现不会失败，接上 unterm / unzoo 之后会。
   *
   * 失败时只提示，不自动把界面改回去：撤销逻辑带快照，回滚可能和用户的后续
   * 操作打架，把不一致说清楚比偷偷改掉更诚实。
   */
  function syncBackend(op: Promise<unknown>, action: string) {
    void op.catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : String(error);
      setNotice(t("{action}没有同步到后台：{detail}", { action, detail }));
    });
  }

  function recordActivity(
    item: Omit<ActivityItem, "id" | "time" | "createdAt">,
  ) {
    const now = new Date();
    const time = now.toLocaleTimeString(dateLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setActivityLog((items) =>
      [
        {
          ...item,
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          time,
          createdAt: now.toISOString(),
        },
        ...items,
      ].slice(0, 100),
    );
  }

  function exportActivity() {
    const payload = {
      product: "Unzoo One",
      exportedAt: new Date().toISOString(),
      recordCount: activityLog.length,
      records: activityLog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unzoo-one-audit-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    recordActivity({
      title: t("审计记录已导出"),
      detail: t("已导出 {length} 条记录，文件仅保存在本机。", { length: activityLog.length }),
      icon: "activity",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("已导出 {length} 条审计记录", { length: activityLog.length }));
  }

  function exportActivityItem(item: ActivityItem) {
    const payload = {
      product: "Unzoo One",
      exportedAt: new Date().toISOString(),
      record: item,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unzoo-event-${item.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    setNotice(t("已导出事件“{title}”", { title: item.title }));
  }

  async function copyActivityId(item: ActivityItem) {
    try {
      await window.navigator.clipboard.writeText(item.id);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = item.id;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setNotice(t("已复制事件 ID：{id}", { id: item.id }));
  }

  async function copyActivityEventLink(item: ActivityItem) {
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: item.id,
        activityTaskId,
        activityFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    await copyCurrentViewLink(t("审计事件链接"));
  }

  function rememberWorkspaceBackup(exportedAt: string) {
    setLastWorkspaceBackupAt(exportedAt);
    if (!settings.local) return;
    try {
      window.localStorage.setItem(workspaceLastBackupKey, exportedAt);
    } catch {
      // The downloaded file is still valid even when browser metadata cannot be saved.
    }
  }

  function exportWorkspace() {
    const exportedAt = new Date().toISOString();
    const payload: WorkspaceBackup = {
      version: 1,
      product: "Unzoo One",
      exportedAt,
      profile: workspaceProfile,
      tasks,
      settings,
      usage: usageSettings,
      connectors: connectorStates,
      members: teamMembers,
      approvalIds: approvals.map((item) => item.id),
      approvalDeferrals,
      activity: activityLog,
      artifacts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unzoo-one-workspace-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    rememberWorkspaceBackup(exportedAt);
    recordActivity({
      title: t("工作区备份已导出"),
      detail: t("已备份 {length} 个任务、{length2} 个成果、{length3} 位成员和 {length4} 条运行记录。", { length: tasks.length, length2: artifacts.length, length3: teamMembers.length, length4: activityLog.length }),
      icon: "activity",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("工作区备份已保存到本机"));
  }

  function downloadArtifact(artifact: ArtifactItem) {
    const mimeType =
      artifact.format === "JSON"
        ? "application/json"
        : artifact.format === "CSV"
          ? "text/csv"
          : "text/markdown";
    const blob = new Blob([artifact.content], {
      type: `${mimeType};charset=utf-8`,
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = artifact.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    recordActivity({
      title: t("成果已下载：{title}", { title: artifact.title }),
      detail: `${artifact.filename} · ${artifact.sizeKb.toFixed(1)} KB`,
      icon: "file",
      tone: "blue",
      kind: "系统",
      taskId: artifact.taskId,
    });
    setNotice(t("已下载“{filename}”", { filename: artifact.filename }));
  }

  async function copyArtifactContent(artifact: ArtifactItem) {
    try {
      await window.navigator.clipboard.writeText(artifact.content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = artifact.content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    recordActivity({
      title: t("成果内容已复制：{title}", { title: artifact.title }),
      detail: t("已复制 {filename} 的可读内容。", { filename: artifact.filename }),
      icon: "copy",
      tone: "violet",
      kind: "系统",
      taskId: artifact.taskId,
    });
    setNotice(t("已复制“{title}”的内容", { title: artifact.title }));
  }

  function toggleArtifactStar(artifact: ArtifactItem) {
    const nextStarred = !artifact.starred;
    syncBackend(
      workspaceProvider.artifacts.update(artifact.id, { starred: nextStarred }),
      nextStarred ? t("标记重点") : t("取消重点"),
    );
    setArtifacts((items) =>
      items.map((item) =>
        item.id === artifact.id ? { ...item, starred: nextStarred } : item,
      ),
    );
    setNotice(nextStarred ? t("已加入重点成果") : t("已取消重点标记"));
  }

  function requestDeleteArtifact(artifact: ArtifactItem) {
    setArtifactDeleteId(artifact.id);
  }

  function confirmDeleteArtifact() {
    if (!deletingArtifact) return;
    const artifact = deletingArtifact;
    const artifactIndex = artifacts.findIndex((item) => item.id === artifact.id);
    const nextVisibleArtifact = filteredArtifacts.find(
      (item) => item.id !== artifact.id,
    );
    const nextWorkspaceArtifact = artifacts.find(
      (item) => item.id !== artifact.id,
    );

    setTaskDeleteSnapshot(null);
    setArtifactDeleteSnapshot({
      artifact,
      index: Math.max(0, artifactIndex),
    });
    syncBackend(workspaceProvider.artifacts.remove(artifact.id), t("删除成果"));
    setArtifacts((items) => items.filter((item) => item.id !== artifact.id));
    const nextArtifactId =
      nextVisibleArtifact?.id ?? nextWorkspaceArtifact?.id ?? "";
    setSelectedArtifactId(nextArtifactId);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: nextArtifactId || null,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    setArtifactDeleteId(null);
    recordActivity({
      title: t("成果已删除：{title}", { title: artifact.title }),
      detail: t("{filename} 及其 {value} 个版本已从工作区移除；关联任务和原审计记录保持不变。", { filename: artifact.filename, value: (artifact.revisions?.length ?? 0) + 1 }),
      icon: "trash",
      tone: "red",
      kind: "系统",
      taskId: artifact.taskId,
    });
    setNotice(t("已删除成果“{title}”", { title: artifact.title }));
  }

  function undoArtifactDelete() {
    if (!artifactDeleteSnapshot) return;
    const { artifact, index } = artifactDeleteSnapshot;
    setArtifacts((items) => {
      if (items.some((item) => item.id === artifact.id)) return items;
      const restored = [...items];
      restored.splice(Math.min(index, restored.length), 0, artifact);
      return restored;
    });
    setSelectedArtifactId(artifact.id);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: artifact.id,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    setArtifactDeleteSnapshot(null);
    recordActivity({
      title: t("已撤销成果删除：{title}", { title: artifact.title }),
      detail: t("{filename} 和全部修订版本已恢复到原位置。", { filename: artifact.filename }),
      icon: "activity",
      tone: "green",
      kind: "系统",
      taskId: artifact.taskId,
    });
    setNotice(t("已恢复成果“{title}”", { title: artifact.title }));
  }

  function artifactCanBeEdited(artifact: ArtifactItem) {
    // 本机文件以磁盘上的为准，在这里改了也写不回去。
    if (artifact.file) return false;
    return artifact.type === "报告" || artifact.type === "草稿";
  }

  function openArtifactEditor(artifact: ArtifactItem) {
    if (!artifactCanBeEdited(artifact)) {
      setNotice(t("数据和证据保持只读，避免破坏原始交付记录"));
      return;
    }
    setEditingArtifactId(artifact.id);
    setArtifactTitleDraft(artifact.title);
    setArtifactFilenameDraft(artifact.filename);
    setArtifactContentDraft(artifact.content);
    artifactDraftRecoveryOwnedRef.current = false;
    setArtifactDraftAutoSavedAt(null);
    setArtifactDraftAutoSavedSignature("");
    setArtifactDraftSaveFailedSignature("");
    setArtifactEditSubmitted(false);
    setArtifactDiscardOpen(false);
    setIsSavingArtifact(false);
  }

  function clearArtifactDraftRecovery() {
    clearDraftRecoveryStorage(artifactDraftRecoveryKey);
    artifactDraftRecoveryOwnedRef.current = false;
    setPendingArtifactDraftRecovery(null);
    setArtifactDraftAutoSavedAt(null);
    setArtifactDraftAutoSavedSignature("");
    setArtifactDraftSaveFailedSignature("");
  }

  function closeArtifactEditor(options: { clearRecovery?: boolean } = {}) {
    if (options.clearRecovery || artifactDraftRecoveryOwnedRef.current) {
      clearArtifactDraftRecovery();
    }
    artifactSavingRef.current = false;
    setEditingArtifactId(null);
    setArtifactTitleDraft("");
    setArtifactFilenameDraft("");
    setArtifactContentDraft("");
    setArtifactEditSubmitted(false);
    setArtifactDiscardOpen(false);
    setIsSavingArtifact(false);
  }

  function requestCloseArtifactEditor() {
    if (artifactSavingRef.current || isSavingArtifact) return;
    if (artifactEditorDirty) {
      setArtifactDiscardOpen(true);
      return;
    }
    closeArtifactEditor();
  }

  function confirmDiscardArtifactDraft() {
    closeArtifactEditor();
    setNotice(t("未保存的成果修订已放弃"));
  }

  function restoreRecoveredArtifactDraft() {
    if (!pendingArtifactDraftRecovery || !tasksReady) return;
    const recovery = pendingArtifactDraftRecovery;
    const artifact =
      artifacts.find((item) => item.id === recovery.artifactId) ?? null;
    if (!artifact || !artifactCanBeEdited(artifact)) {
      clearArtifactDraftRecovery();
      setNotice(t("原成果已不存在或不可编辑，恢复草稿已安全移除"));
      return;
    }

    const recoveredSignature = JSON.stringify([
      artifact.id,
      recovery.draft.title,
      recovery.draft.filename,
      recovery.draft.content,
    ]);
    setActiveView("artifacts");
    setSelectedArtifactId(artifact.id);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: artifact.id,
      },
      "push",
    );
    setEditingArtifactId(artifact.id);
    setArtifactTitleDraft(recovery.draft.title);
    setArtifactFilenameDraft(recovery.draft.filename);
    setArtifactContentDraft(recovery.draft.content);
    setArtifactEditSubmitted(false);
    setArtifactDiscardOpen(false);
    setIsSavingArtifact(false);
    artifactDraftRecoveryOwnedRef.current = true;
    setPendingArtifactDraftRecovery(null);
    setArtifactDraftAutoSavedAt(recovery.savedAt);
    setArtifactDraftAutoSavedSignature(recoveredSignature);
    setArtifactDraftSaveFailedSignature("");

    if (recovery.baseVersion !== (artifact.version ?? 1)) {
      setNotice(
        t("草稿基于 v{baseVersion}，当前为 v{value}；保存时会保留两个版本", { baseVersion: recovery.baseVersion, value: artifact.version ?? 1 }),
      );
    }
  }

  function discardRecoveredArtifactDraft() {
    clearArtifactDraftRecovery();
    setNotice(t("未完成的成果修订草稿已放弃"));
  }

  function loadArtifactRevision(revision: ArtifactRevision) {
    setArtifactTitleDraft(revision.title);
    setArtifactFilenameDraft(revision.filename);
    setArtifactContentDraft(revision.content);
    setArtifactEditSubmitted(false);
    setNotice(t("已将 v{version} 载入编辑器，保存后会生成新版本", { version: revision.version }));
    window.requestAnimationFrame(() => artifactTitleRef.current?.focus());
  }

  async function saveArtifactEdit() {
    if (artifactWorkspaceConflict) {
      setNotice(t("成果已在另一窗口更新，请先处理版本冲突"));
      return;
    }
    if (
      !editingArtifact ||
      artifactSavingRef.current ||
      isSavingArtifact
    ) {
      return;
    }
    setArtifactEditSubmitted(true);
    if (artifactFormHasErrors) {
      if (artifactFormErrors.title) {
        artifactTitleRef.current?.focus();
      } else if (artifactFormErrors.filename) {
        artifactFilenameRef.current?.focus();
      } else {
        artifactContentRef.current?.focus();
      }
      return;
    }
    if (!artifactEditorDirty) {
      setNotice(t("当前版本没有需要保存的修改"));
      return;
    }

    artifactSavingRef.current = true;
    setIsSavingArtifact(true);
    await new Promise((resolve) => window.setTimeout(resolve, 420));

    const now = new Date();
    const nextVersion = editingArtifactVersion + 1;
    const normalizedTitle = artifactTitleDraft.trim();
    const normalizedFilename = artifactFilenameDraft.trim();
    const normalizedContent = artifactContentDraft.trim();
    const previousRevision: ArtifactRevision = {
      version: editingArtifactVersion,
      title: editingArtifact.title,
      filename: editingArtifact.filename,
      content: editingArtifact.content,
      createdAt: editingArtifact.editedAt ?? editingArtifact.createdAt,
      editor: editingArtifact.editedBy ?? "Unzoo One AI",
    };
    const nextRevisions = [
      ...(editingArtifact.revisions ?? []),
      previousRevision,
    ].slice(-12);
    const nextSizeKb = Math.max(
      0.1,
      new TextEncoder().encode(normalizedContent).byteLength / 1024,
    );

    syncBackend(
      workspaceProvider.artifacts.update(editingArtifact.id, {
        title: normalizedTitle,
        filename: normalizedFilename,
        content: normalizedContent,
        sizeKb: nextSizeKb,
        editedAt: now.toISOString(),
        editedBy: t("刘一帆"),
        version: nextVersion,
        revisions: nextRevisions,
      }),
      t("保存成果"),
    );
    setArtifacts((items) =>
      items.map((artifact) =>
        artifact.id === editingArtifact.id
          ? {
              ...artifact,
              title: normalizedTitle,
              filename: normalizedFilename,
              content: normalizedContent,
              sizeKb: nextSizeKb,
              status: artifact.type === "报告" ? "已修订" : artifact.status,
              updated: t("刚刚"),
              editedAt: now.toISOString(),
              editedBy: t("刘一帆"),
              version: nextVersion,
              revisions: nextRevisions,
            }
          : artifact,
      ),
    );
    recordActivity({
      title: t("成果已保存为 v{nextVersion}：{normalizedTitle}", { nextVersion, normalizedTitle }),
      detail: t("{normalizedFilename} 已由刘一帆修订；v{editingArtifactVersion} 仍保留在版本记录中。", { normalizedFilename, editingArtifactVersion }),
      icon: "file",
      tone: "green",
      kind: "系统",
      taskId: editingArtifact.taskId,
    });
    artifactSavingRef.current = false;
    setIsSavingArtifact(false);
    setNotice(t("已保存 v{nextVersion}，上一版本可随时恢复", { nextVersion }));
    closeArtifactEditor({ clearRecovery: true });
  }

  function preserveDataSettingsRoute() {
    settingsSectionRef.current = "data";
    setSettingsSection("data");
    writeWorkspaceRoute(
      {
        view: "settings",
        taskId: null,
        runId: null,
        settingsSection: "data",
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function openWorkspaceImportPicker() {
    preserveDataSettingsRoute();
    setWorkspaceImportAcknowledged(false);
    setRecoveryBackupCreated(false);
    importInputRef.current?.click();
  }

  function closeWorkspaceImportPreview() {
    preserveDataSettingsRoute();
    setPendingWorkspaceImport(null);
    setWorkspaceImportAcknowledged(false);
    setRecoveryBackupCreated(false);
  }

  function openWorkspaceReset() {
    preserveDataSettingsRoute();
    setWorkspaceResetAcknowledged(false);
    setRecoveryBackupCreated(false);
    setWorkspaceResetOpen(true);
  }

  function closeWorkspaceReset() {
    preserveDataSettingsRoute();
    setWorkspaceResetOpen(false);
    setWorkspaceResetAcknowledged(false);
    setRecoveryBackupCreated(false);
  }

  function exportWorkspaceFromDataCenter() {
    preserveDataSettingsRoute();
    exportWorkspace();
  }

  function exportRecoveryBackup() {
    preserveDataSettingsRoute();
    exportWorkspace();
    setRecoveryBackupCreated(true);
  }

  async function importWorkspace(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      preserveDataSettingsRoute();
      if (file.size > 2_000_000) {
        throw new Error("Workspace backup is too large");
      }
      const backup = parseWorkspaceBackup(JSON.parse(await file.text()));
      setWorkspaceImportAcknowledged(false);
      setRecoveryBackupCreated(false);
      setPendingWorkspaceImport({
        backup,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch {
      setNotice(t("导入失败，请选择由 Unzoo One 导出的工作区备份"));
    } finally {
      input.value = "";
    }
  }

  function confirmWorkspaceImport() {
    if (!pendingWorkspaceImport) return;
    if (!workspaceImportAcknowledged) {
      setNotice(t("请先确认当前工作区会被这份备份替换"));
      return;
    }
    const { backup, fileName } = pendingWorkspaceImport;
    const restoredApprovals = workspaceDefaults.approvals.filter((item) =>
      backup.approvalIds.includes(item.id),
    );
    const restoredPrimary =
      backup.tasks.find((task) => task.id === "competitor") ?? backup.tasks[0];
    const restoredArtifacts = backup.artifacts ?? workspaceDefaults.artifacts;

    setTasks(backup.tasks);
    setArtifacts(restoredArtifacts);
    closeArtifactEditor({ clearRecovery: true });
    closeComposer({ clearRecovery: true });
    setArtifactTaskId(null);
    setArtifactFilter("全部");
    setArtifactListQuery("");
    setArtifactSort("最近更新");
    setSelectedArtifactId(restoredArtifacts[0]?.id ?? "");
    setArtifactDeleteId(null);
    setArtifactDeleteSnapshot(null);
    setSettings(backup.settings);
    setWorkspaceProfile(backup.profile ?? { ...defaultWorkspaceProfile });
    setWorkspaceProfileOpen(false);
    setWorkspaceProfileSubmitted(false);
    setUsageSettings(backup.usage ?? { ...defaultUsageSettings });
    setUsageBudgetOpen(false);
    setSettingsDiscardTarget(null);
    setConnectorStates(backup.connectors ?? workspaceDefaults.connectors);
    setConnectorCheckResults({ ...defaultConnectorChecks });
    setSelectedConnectorId(null);
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
    setTeamMembers(
      backup.members ?? workspaceDefaults.members,
    );
    setTeamMemberQuery("");
    setTeamRoleFilter("全部");
    setTeamInviteOpen(false);
    setInviteAdminAcknowledged(false);
    setSelectedTeamMemberId(null);
    setMemberRemoveConfirm(false);
    setMemberRemoveAcknowledged(false);
    setApprovals(restoredApprovals);
    setApprovalDeferrals(backup.approvalDeferrals ?? {});
    setApprovalClock(Date.now());
    setApprovalSnoozeId(null);
    setSelectedApprovalId(restoredApprovals[0]?.id ?? "");
    setApprovalListQuery("");
    setApprovalRiskFilter("全部");
    setSelectedApprovalIds([]);
    setBulkApprovalDecision(null);
    setApprovalRejectReason("");
    setApprovalRejectSnapshot(null);
    setActivityLog(backup.activity.slice(0, 100));
    setIsRunning(restoredPrimary.status !== "已暂停");
    setSelectedStep("analyze");
    setTaskFilter("全部");
    setSelectedTaskIds([]);
    setBulkDeleteOpen(false);
    setTaskDeleteSnapshot(null);
    setActivityFilter("全部");
    setActivityTaskId(null);
    setActivityListQuery("");
    setActivitySort("最新优先");
    setSelectedActivityId(backup.activity[0]?.id ?? "");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setRejectApprovalId(null);
    setTemporaryModeOpen(false);
    setNotificationsOpen(false);
    setWorkspaceLoadWarning("");
    setPendingWorkspaceImport(null);
    setWorkspaceImportAcknowledged(false);
    setRecoveryBackupCreated(false);
    rememberWorkspaceBackup(backup.exportedAt);
    setActiveView("settings");
    writeWorkspaceRoute(
      {
        view: "settings",
        taskId: null,
        runId: null,
        settingsSection: "data",
      },
      "push",
    );
    recordActivity({
      title: t("工作区备份已恢复"),
      detail: t("已从“{fileName}”恢复 {length} 个任务、{length2} 个成果、{length3} 位成员和 {length4} 条运行记录。", { fileName, length: backup.tasks.length, length2: restoredArtifacts.length, length3: (backup.members ?? workspaceDefaults.members).length, length4: backup.activity.length }),
      icon: "activity",
      tone: "green",
      kind: "系统",
    });
    setNotice(t("已恢复 {length} 个任务，工作区可以继续使用", { length: backup.tasks.length }));
    scrollWorkspaceTop();
  }

  function resetWorkspace() {
    if (!workspaceResetAcknowledged) {
      setNotice(t("请先确认当前工作区会恢复为初始状态"));
      return;
    }
    const factory = workspaceProvider.reset();
    setTasks(factory.tasks);
    setArtifacts(factory.artifacts);
    closeArtifactEditor({ clearRecovery: true });
    closeComposer({ clearRecovery: true });
    setArtifactTaskId(null);
    setArtifactFilter("全部");
    setArtifactListQuery("");
    setArtifactSort("最近更新");
    setSelectedArtifactId(factory.artifacts[0].id);
    setArtifactDeleteId(null);
    setArtifactDeleteSnapshot(null);
    setSettings({ ...defaultSettings });
    setWorkspaceProfile({ ...defaultWorkspaceProfile });
    setWorkspaceNameDraft(defaultWorkspaceProfile.name);
    setWorkspaceDescriptionDraft(defaultWorkspaceProfile.description);
    setWorkspaceProfileOpen(false);
    setWorkspaceProfileSubmitted(false);
    setUsageSettings({ ...defaultUsageSettings });
    setUsageBudgetOpen(false);
    setUsageBudgetDraft(String(defaultUsageSettings.monthlyBudget));
    setUsageAlertDraft(defaultUsageSettings.alertThreshold);
    setUsagePauseDraft(defaultUsageSettings.pauseAtLimit);
    setUsagePauseConfirmed(false);
    setSettingsDiscardTarget(null);
    setConnectorStates(factory.connectors);
    setConnectorCheckResults({ ...defaultConnectorChecks });
    setSelectedConnectorId(null);
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
    setConnectorTestingId(null);
    setConnectorTestingAll(false);
    setTeamMembers(factory.members);
    setTeamMemberQuery("");
    setTeamRoleFilter("全部");
    setTeamInviteOpen(false);
    setSelectedTeamMemberId(null);
    setMemberRemoveConfirm(false);
    setMemberRemoveAcknowledged(false);
    setInviteAdminAcknowledged(false);
    setInviteFormSubmitted(false);
    setApprovals(factory.approvals);
    setApprovalDeferrals({});
    setApprovalClock(Date.now());
    setApprovalSnoozeId(null);
    setSelectedApprovalId(factory.approvals[0].id);
    setApprovalListQuery("");
    setApprovalRiskFilter("全部");
    setSelectedApprovalIds([]);
    setBulkApprovalDecision(null);
    setApprovalRejectReason("");
    setApprovalRejectSnapshot(null);
    setActivityLog(factory.activity);
    setIsRunning(true);
    setSelectedStep("analyze");
    setTaskFilter("全部");
    setSelectedTaskIds([]);
    setBulkDeleteOpen(false);
    setTaskDeleteSnapshot(null);
    setActivityFilter("全部");
    setActivityTaskId(null);
    setActivityListQuery("");
    setActivitySort("最新优先");
    setSelectedActivityId(factory.activity[0].id);
    setRecentSearchKeys([]);
    setReadNotificationIds([]);
    setNotificationFilter("全部");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setDeleteTaskId(null);
    setRejectApprovalId(null);
    setTemporaryModeOpen(false);
    setNotificationsOpen(false);
    setWorkspaceResetOpen(false);
    setWorkspaceResetAcknowledged(false);
    setRecoveryBackupCreated(false);
    setOnboardingDismissed(false);
    setWorkspaceLoadWarning("");
    recordActivity({
      title: t("工作区已恢复初始状态"),
      detail: t("任务、成果、团队成员、待确认事项、运行记录和设置已重新初始化。"),
      icon: "settings",
      tone: "amber",
      kind: "系统",
    });
    setNotice(t("工作区已恢复初始状态"));
  }

  function openActivityItem(item: ActivityItem) {
    if (item.taskId && tasks.some((task) => task.id === item.taskId)) {
      openTask(item.taskId);
      return;
    }
    if (item.kind === "审批" && approvals.length > 0) {
      openView("approvals");
      return;
    }
    if (item.kind === "系统") {
      openView("settings");
      return;
    }
    setNotice(item.detail);
  }

  function openActivityEvent(
    activityId: string,
    options: { activityTaskId?: string; scrollToTop?: boolean } = {},
  ) {
    const activity = activityLog.find((item) => item.id === activityId);
    if (!activity) {
      openView("activity");
      setNotice(t("该审计事件已不存在，已打开运行记录"));
      return;
    }
    const nextActivityTaskId =
      options.activityTaskId && activity.taskId === options.activityTaskId
        ? options.activityTaskId
        : null;
    setActivityTaskId(nextActivityTaskId);
    setActivityFilter("全部");
    setActivityListQuery("");
    setActivitySort("最新优先");
    setSelectedActivityId(activity.id);
    setActiveView("activity");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: activity.id,
        activityTaskId: nextActivityTaskId,
        activityFilter: "全部",
      },
      "push",
    );
    if (options.scrollToTop !== false) {
      scrollWorkspaceTop();
    }
  }

  function selectActivityItem(item: ActivityItem) {
    setSelectedActivityId(item.id);
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: item.id,
        activityTaskId,
        activityFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    window.requestAnimationFrame(() => {
      if (!window.matchMedia("(max-width: 980px)").matches) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      activityInspectorRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function chooseActivityFilter(filter: ActivityFilter) {
    const nextActivity =
      filter === "全部"
        ? scopedActivityLog[0]
        : scopedActivityLog.find((item) => item.kind === filter);
    setActivityFilter(filter);
    setSelectedActivityId(nextActivity?.id ?? "");
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: nextActivity?.id ?? null,
        activityTaskId,
        activityFilter: filter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function clearActivityTaskScope() {
    const nextActivity =
      activityFilter === "全部"
        ? activityLog[0]
        : activityLog.find((item) => item.kind === activityFilter);
    setActivityTaskId(null);
    setSelectedActivityId(nextActivity?.id ?? "");
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: nextActivity?.id ?? null,
        activityTaskId: null,
        activityFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function scrollApprovalIntoView() {
    window.requestAnimationFrame(() => {
      if (!window.matchMedia("(max-width: 1080px)").matches) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      approvalDetailRef.current?.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  function chooseApproval(approvalId: string) {
    if (!approvals.some((approval) => approval.id === approvalId)) return;
    setSelectedApprovalId(approvalId);
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId,
        approvalFilter: approvalRiskFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    scrollApprovalIntoView();
  }

  function getApprovalFilterForSelection(
    approval: ApprovalItem | undefined,
    preferredFilter: ApprovalRiskFilter,
  ) {
    if (!approval) return preferredFilter;
    if (deferredApprovalIds.has(approval.id)) return "稍后";
    if (
      preferredFilter === "稍后" ||
      (preferredFilter !== "全部" && approval.risk !== preferredFilter)
    ) {
      return "全部";
    }
    return preferredFilter;
  }

  function replaceApprovalSelection(
    approval: ApprovalItem | undefined,
    preferredFilter = approvalRiskFilter,
  ) {
    const nextFilter = getApprovalFilterForSelection(
      approval,
      preferredFilter,
    );
    setApprovalRiskFilter(nextFilter);
    setSelectedApprovalId(approval?.id ?? "");
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId: approval?.id ?? null,
        approvalFilter: nextFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function approvalMatchesSearch(approval: ApprovalItem) {
    if (!normalizedApprovalQuery) return true;
    const relatedTaskTitle =
      tasks.find((task) => task.id === approval.taskId)?.title ?? "";
    return [
      approval.title,
      approval.reason,
      approval.target,
      approval.scope,
      approval.policy,
      relatedTaskTitle,
    ].some((value) =>
      value.toLowerCase().includes(normalizedApprovalQuery),
    );
  }

  function approvalMatchesFilters(approval: ApprovalItem) {
    const isDeferred = deferredApprovalIds.has(approval.id);
    return (
      (approvalRiskFilter === "稍后" ? isDeferred : !isDeferred) &&
      (approvalRiskFilter === "全部" ||
        approvalRiskFilter === "稍后" ||
        approval.risk === approvalRiskFilter) &&
      approvalMatchesSearch(approval)
    );
  }

  function getNextApprovalAfterRemoving(removedIds: Set<string>) {
    const remaining = approvals.filter(
      (approval) => !removedIds.has(approval.id),
    );
    return (
      remaining.find((approval) => approvalMatchesFilters(approval)) ??
      remaining.find((approval) => !deferredApprovalIds.has(approval.id)) ??
      remaining[0]
    );
  }

  function toggleApprovalSelection(approvalId: string) {
    setSelectedApprovalIds((selectedIds) =>
      selectedIds.includes(approvalId)
        ? selectedIds.filter((id) => id !== approvalId)
        : [...selectedIds, approvalId],
    );
  }

  function toggleAllVisibleApprovals() {
    const visibleIds = filteredApprovals.map((approval) => approval.id);
    setSelectedApprovalIds((selectedIds) => {
      if (allVisibleApprovalsSelected) {
        return selectedIds.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...selectedIds, ...visibleIds]));
    });
  }

  function requestBulkApprovalDecision(decision: BulkApprovalDecision) {
    if (selectedApprovals.length === 0) return;
    if (decision === "approve" && bulkApprovableApprovals.length === 0) {
      setNotice(t("高风险操作必须逐项审核，不能批量批准"));
      return;
    }
    setApprovalRejectReason("");
    setBulkApprovalDecision(decision);
  }

  function removeApprovalDeferrals(approvalIds: Set<string>) {
    setApprovalDeferrals((deferrals) => {
      const next = { ...deferrals };
      approvalIds.forEach((approvalId) => delete next[approvalId]);
      return next;
    });
  }

  function confirmBulkApprove() {
    if (bulkApprovableApprovals.length === 0) return;
    if (
      !requireOnline(
        t("设备离线，未执行批量批准；所选操作仍保留在待确认列表中"),
      )
    ) {
      setBulkApprovalDecision(null);
      return;
    }
    const approvalWouldResumeTasks = bulkApprovableApprovals.some(
      (approval) =>
        tasks.find((task) => task.id === approval.taskId)?.status === "待确认",
    );
    if (
      approvalWouldResumeTasks &&
      !requireBudgetCapacity(t("批量批准并继续关联任务"))
    ) {
      setBulkApprovalDecision(null);
      return;
    }
    const approvedIds = new Set(
      bulkApprovableApprovals.map((approval) => approval.id),
    );
    const affectedTaskIds = new Set(
      bulkApprovableApprovals.map((approval) => approval.taskId),
    );
    const nextApproval = getNextApprovalAfterRemoving(approvedIds);
    const highRiskIds = selectedApprovals
      .filter((approval) => approval.risk === "高风险")
      .map((approval) => approval.id);
    const competitorShouldResume =
      affectedTaskIds.has("competitor") &&
      tasks.find((task) => task.id === "competitor")?.status === "待确认";

    syncBackend(
      workspaceProvider.approvals.decideMany([...approvedIds], { kind: "approve" }),
      t("批量批准"),
    );
    setApprovals((items) =>
      items.filter((approval) => !approvedIds.has(approval.id)),
    );
    removeApprovalDeferrals(approvedIds);
    replaceApprovalSelection(nextApproval);
    setSelectedApprovalIds(highRiskIds);
    setTasks((items) =>
      items.map((task) => {
        if (!affectedTaskIds.has(task.id)) return task;
        const shouldResume = task.status === "待确认";
        return {
          ...task,
          status: shouldResume ? "运行中" : task.status,
          progress: shouldResume
            ? Math.min(99, task.progress + 4)
            : task.progress,
          updated: shouldResume ? t("刚刚批量批准") : t("刚刚批准操作"),
        };
      }),
    );
    if (competitorShouldResume) {
      setIsRunning(true);
    }
    bulkApprovableApprovals.forEach((approval) => {
      recordActivity({
        title: t("已批准：{title}", { title: approval.title }),
        detail: t("{impact} 授权范围：{scope}。批量决策已记录。", { impact: approval.impact, scope: approval.scope }),
        icon: "shield",
        tone: "green",
        kind: "审批",
        taskId: approval.taskId,
      });
    });
    setBulkApprovalDecision(null);
    setNotice(
      selectedHighRiskApprovalCount
        ? t("已批准 {length} 项，{selectedHighRiskApprovalCount} 项高风险操作保留待审", { length: bulkApprovableApprovals.length, selectedHighRiskApprovalCount })
        : t("已批准 {length} 项操作", { length: bulkApprovableApprovals.length }),
    );
    if (nextApproval) {
      scrollApprovalIntoView();
    } else {
      scrollWorkspaceTop();
    }
  }

  function stageApprovalRejectUndo(rejectedCount: number) {
    setTaskDeleteSnapshot(null);
    setArtifactDeleteSnapshot(null);
    setApprovalRejectSnapshot({
      tasks,
      approvals,
      approvalDeferrals,
      approvalRiskFilter,
      selectedApprovalId,
      selectedApprovalIds,
      rejectedCount,
      isRunning,
    });
  }

  function undoApprovalReject() {
    if (!approvalRejectSnapshot) return;
    const snapshot = approvalRejectSnapshot;
    setTasks(snapshot.tasks);
    setApprovals(snapshot.approvals);
    setApprovalDeferrals(snapshot.approvalDeferrals);
    setApprovalRiskFilter(snapshot.approvalRiskFilter);
    setSelectedApprovalId(snapshot.selectedApprovalId);
    setSelectedApprovalIds(snapshot.selectedApprovalIds);
    setIsRunning(snapshot.isRunning);
    setBulkApprovalDecision(null);
    setRejectApprovalId(null);
    setApprovalRejectReason("");
    setApprovalRejectSnapshot(null);
    setActiveView("approvals");
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId: snapshot.selectedApprovalId || null,
        approvalFilter: snapshot.approvalRiskFilter,
      },
      "push",
    );
    recordActivity({
      title: t("已撤销拒绝 {rejectedCount} 项操作", { rejectedCount: snapshot.rejectedCount }),
      detail: t("待确认操作、关联任务状态和原运行记录已恢复；之前的拒绝与本次恢复仍保留在审计中。"),
      icon: "activity",
      tone: "green",
      kind: "审批",
    });
    setNotice(t("已恢复 {rejectedCount} 项待确认操作", { rejectedCount: snapshot.rejectedCount }));
    scrollApprovalIntoView();
  }

  function confirmBulkReject() {
    const reason = approvalRejectReason.trim();
    if (selectedApprovals.length === 0 || reason.length < 4) return;
    const rejected = [...selectedApprovals];
    const rejectedIds = new Set(rejected.map((approval) => approval.id));
    const affectedTaskIds = new Set(
      rejected.map((approval) => approval.taskId),
    );
    const nextApproval = getNextApprovalAfterRemoving(rejectedIds);

    stageApprovalRejectUndo(rejected.length);
    syncBackend(
      workspaceProvider.approvals.decideMany([...rejectedIds], { kind: "reject", reason }),
      t("拒绝操作"),
    );
    setApprovals((items) =>
      items.filter((approval) => !rejectedIds.has(approval.id)),
    );
    removeApprovalDeferrals(rejectedIds);
    replaceApprovalSelection(nextApproval);
    setSelectedApprovalIds([]);
    setTasks((items) =>
      items.map((task) =>
        affectedTaskIds.has(task.id)
          ? {
              ...task,
              status: "已暂停",
              updated: t("因批量审批拒绝暂停"),
              runs: stopActiveTaskRuns(
                task.runs,
                t("批量审批被拒绝，本次运行未执行外部操作。"),
              ),
            }
          : task,
      ),
    );
    if (affectedTaskIds.has("competitor")) {
      setIsRunning(false);
    }
    rejected.forEach((approval) => {
      const relatedTask = tasks.find((task) => task.id === approval.taskId);
      recordActivity({
        title: t("已拒绝：{title}", { title: approval.title }),
        detail: t("未执行外部操作，关联任务“{value}”已暂停。原因：{reason}", { value: relatedTask?.title ?? approval.taskId, reason }),
        icon: "shield",
        tone: "red",
        kind: "审批",
        taskId: approval.taskId,
      });
    });
    setBulkApprovalDecision(null);
    setApprovalRejectReason("");
    setNotice(
      t("已拒绝 {length} 项操作，暂停 {size} 个关联任务", { length: rejected.length, size: affectedTaskIds.size }),
    );
    if (nextApproval) {
      scrollApprovalIntoView();
    } else {
      scrollWorkspaceTop();
    }
  }

  function requestApproveCurrent() {
    if (!selectedApproval) return;
    if (selectedApproval.risk === "高风险") {
      setApprovalConfirmAcknowledged(false);
      setApprovalConfirmId(selectedApproval.id);
      return;
    }
    approveCurrent(selectedApproval);
  }

  function cancelApprovalConfirmation() {
    setApprovalConfirmId(null);
    setApprovalConfirmAcknowledged(false);
  }

  function confirmHighRiskApproval() {
    if (!approvalConfirmTarget || !approvalConfirmAcknowledged) return;
    const approved = approvalConfirmTarget;
    cancelApprovalConfirmation();
    approveCurrent(approved);
  }

  function approveCurrent(approval: ApprovalItem) {
    if (
      !requireOnline(
        t("设备离线，未执行批准操作；这项操作仍保留在待确认列表中"),
      )
    ) {
      return;
    }
    const approved = approval;
    const relatedTask = tasks.find((task) => task.id === approved.taskId);
    const shouldResume = relatedTask?.status === "待确认";
    if (
      shouldResume &&
      !requireBudgetCapacity(t("批准并继续任务“{title}”", { title: relatedTask?.title }))
    ) {
      return;
    }
    const nextApproval = approvals.find(
      (item) => item.id !== approved.id,
    );
    syncBackend(
      workspaceProvider.approvals.decide(approved.id, {
        kind: "approve",
        remember: rememberApprovalId === approved.id && isAgentApprovalId(approved.id),
      }),
      t("批准操作"),
    );
    setRememberApprovalId(null);
    setApprovals((items) => items.filter((item) => item.id !== approved.id));
    removeApprovalDeferrals(new Set([approved.id]));
    replaceApprovalSelection(nextApproval);
    setSelectedApprovalIds((selectedIds) =>
      selectedIds.filter((id) => id !== approved.id),
    );
    setTasks((items) =>
      items.map((task) =>
        task.id === approved.taskId
          ? {
              ...task,
              status: shouldResume ? "运行中" : task.status,
              progress: shouldResume ? Math.min(99, task.progress + 4) : task.progress,
              updated: shouldResume ? t("刚刚获得确认") : t("刚刚批准操作"),
            }
          : task,
      ),
    );
    if (approved.taskId === "competitor" && shouldResume) {
      setIsRunning(true);
    }
    recordActivity({
      title: t("已批准：{title}", { title: approved.title }),
      detail: t("{impact} 授权范围：{scope}。", { impact: approved.impact, scope: approved.scope }),
      icon: "shield",
      tone: "green",
      kind: "审批",
      taskId: approved.taskId,
    });
    setNotice(
      shouldResume
        ? t("已允许操作，任务“{title}”继续运行", { title: relatedTask?.title })
        : t("已允许：{title}", { title: approved.title }),
    );
    if (nextApproval) {
      scrollApprovalIntoView();
    } else {
      scrollWorkspaceTop();
    }
  }

  function holdCurrent() {
    if (!selectedApproval) return;
    setApprovalSnoozeId(selectedApproval.id);
  }

  function confirmApprovalSnooze(preset: ApprovalSnoozePreset) {
    if (!approvalSnoozeTarget) return;
    const held = approvalSnoozeTarget;
    const deferredUntil = getApprovalSnoozeUntil(
      preset,
      new Date(approvalClock),
    );
    const nextApproval = activeApprovals.find(
      (approval) => approval.id !== held.id,
    );
    setApprovalDeferrals((deferrals) => ({
      ...deferrals,
      [held.id]: deferredUntil.toISOString(),
    }));
    setApprovalClock(Date.now());
    replaceApprovalSelection(nextApproval, "全部");
    setSelectedApprovalIds((ids) => ids.filter((id) => id !== held.id));
    setApprovalSnoozeId(null);
    recordActivity({
      title: t("稍后处理：{title}", { title: held.title }),
      detail: t("操作会在 {formatApprovalDeferredUntil} 重新进入待确认列表，期间没有执行任何外部动作。", { formatApprovalDeferredUntil: formatApprovalDeferredUntil(
        deferredUntil.toISOString(),
        approvalClock,
      ) }),
      icon: "clock",
      tone: "amber",
      kind: "审批",
      taskId: held.taskId,
    });
    setNotice(t("已安排 {formatApprovalDeferredUntil} 重新提醒", { formatApprovalDeferredUntil: formatApprovalDeferredUntil(
      deferredUntil.toISOString(),
      approvalClock,
    ) }));
    if (nextApproval) {
      scrollApprovalIntoView();
    }
  }

  function restoreDeferredApproval(approvalId: string) {
    const approval = approvals.find((item) => item.id === approvalId);
    if (!approval) return;
    setApprovalDeferrals((deferrals) => {
      const next = { ...deferrals };
      delete next[approvalId];
      return next;
    });
    setApprovalClock(Date.now());
    setApprovalRiskFilter("全部");
    setSelectedApprovalId(approvalId);
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId,
        approvalFilter: "全部",
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    recordActivity({
      title: t("已恢复待确认：{title}", { title: approval.title }),
      detail: t("操作已提前回到待确认列表，仍未执行任何外部动作。"),
      icon: "clock",
      tone: "blue",
      kind: "审批",
      taskId: approval.taskId,
    });
    setNotice(t("“{title}”已回到待确认列表", { title: approval.title }));
    scrollApprovalIntoView();
  }

  function requestRejectApproval() {
    if (!selectedApproval) return;
    setApprovalRejectReason("");
    setRejectApprovalId(selectedApproval.id);
  }

  function confirmRejectApproval() {
    const reason = approvalRejectReason.trim();
    if (!rejectedApproval || reason.length < 4) return;
    const rejected = rejectedApproval;
    const relatedTask = tasks.find((task) => task.id === rejected.taskId);
    const nextApproval = approvals.find((item) => item.id !== rejected.id);
    stageApprovalRejectUndo(1);
    // 和批量拒绝、单条批准一样把决定交给后端。原来这里只改本地状态：内存
    // 审批看不出差别，托管会话的审批却永远等不到答复，agent 一直挂着。
    syncBackend(
      workspaceProvider.approvals.decide(rejected.id, { kind: "reject", reason }),
      t("拒绝操作"),
    );
    setApprovals((items) => items.filter((item) => item.id !== rejected.id));
    removeApprovalDeferrals(new Set([rejected.id]));
    replaceApprovalSelection(nextApproval);
    setSelectedApprovalIds((selectedIds) =>
      selectedIds.filter((id) => id !== rejected.id),
    );
    setTasks((items) =>
      items.map((task) =>
        task.id === rejected.taskId
          ? {
              ...task,
              status: "已暂停",
              updated: t("因审批拒绝暂停"),
              runs: stopActiveTaskRuns(
                task.runs,
                t("审批被拒绝，本次运行未执行外部操作。"),
              ),
            }
          : task,
      ),
    );
    if (rejected.taskId === "competitor") {
      setIsRunning(false);
    }
    setRejectApprovalId(null);
    setApprovalRejectReason("");
    recordActivity({
      title: t("已拒绝：{title}", { title: rejected.title }),
      detail: t("未执行任何外部操作，关联任务“{value}”已暂停。原因：{reason}", { value: relatedTask?.title ?? rejected.taskId, reason }),
      icon: "shield",
      tone: "red",
      kind: "审批",
      taskId: rejected.taskId,
    });
    setNotice(t("已拒绝操作，任务“{value}”已暂停", { value: relatedTask?.title ?? rejected.taskId }));
    if (nextApproval) {
      scrollApprovalIntoView();
    } else {
      scrollWorkspaceTop();
    }
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingTaskId && taskWorkspaceConflict) {
      setNotice(t("任务已在另一窗口更新，请先处理版本冲突"));
      return;
    }
    setTaskFormSubmitted(true);
    if (taskFormHasErrors || taskSavingRef.current) {
      const firstInvalidField =
        (taskFormErrors.name && taskNameRef.current) ||
        (taskFormErrors.target && taskTargetRef.current) ||
        (taskFormErrors.description && taskDescriptionRef.current) ||
        (taskFormErrors.scheduleTime && taskScheduleTimeRef.current);
      window.requestAnimationFrame(() => firstInvalidField?.focus());
      return;
    }

    taskSavingRef.current = true;
    setIsSavingTask(true);
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    // 名字没填（直接输入需求）就取需求的第一行。
    const taskTitle = taskName.trim() || titleFromRequest(taskDescription);

    try {
      if (editingTaskId) {
        const task = tasks.find((item) => item.id === editingTaskId);
        if (!task) return;
        syncBackend(
          workspaceProvider.tasks.update(editingTaskId, {
            title: taskTitle,
            description: taskDescription.trim(),
            target: taskTarget.trim(),
            schedule: taskSchedule,
            scheduleTime: taskSchedule === "仅运行一次" ? undefined : taskScheduleTime,
            scheduleDay: taskSchedule === "每周" ? taskScheduleDay : undefined,
            requiresApproval: taskApproval,
          }),
          t("修改任务"),
        );
        setTasks((items) =>
          items.map((item) =>
            item.id === editingTaskId
              ? {
                  ...item,
                  title: taskTitle,
                  description: taskDescription.trim(),
                  target: taskTarget.trim(),
                  schedule: taskSchedule,
                  scheduleTime:
                    taskSchedule === "仅运行一次" ? undefined : taskScheduleTime,
                  scheduleDay: taskSchedule === "每周" ? taskScheduleDay : undefined,
                  requiresApproval: taskApproval,
                  updated: t("刚刚修改"),
                }
              : item,
          ),
        );
        closeComposer({ clearRecovery: true });
        setSelectedTaskId(task.id);
        recordActivity({
          title: t("任务配置已更新：{trim}", { trim: taskTitle }),
          detail: `${formatSchedule(
            taskSchedule,
            taskScheduleTime,
            taskScheduleDay,
          )} · ${
            taskApproval ? t("敏感操作需要确认") : t("按任务范围自动执行")
          }`,
          icon: "settings",
          tone: "blue",
          kind: "任务",
          taskId: task.id,
        });
        setNotice(t("任务“{trim}”已更新", { trim: taskTitle }));
        return;
      }

      const budgetBlocksRun = budgetRunBlocked;
      // 装好的产品里，定时任务到点再跑，不在创建时先跑一次。
      const waitsForSchedule = Boolean(runtimeMode) && taskSchedule !== "仅运行一次";
      const startImmediately = isOnline && !budgetBlocksRun && !waitsForSchedule;
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        description: taskDescription.trim(),
        target: taskTarget.trim(),
        status: startImmediately ? "运行中" : waitsForSchedule ? "待确认" : "已暂停",
        progress: startImmediately ? 3 : 0,
        updated: startImmediately
          ? t("刚刚创建")
          : waitsForSchedule
            ? formatSchedule(taskSchedule, taskScheduleTime, taskScheduleDay)
            : budgetBlocksRun
            ? t("已保存，等待调整预算")
            : t("已保存，等待网络"),
        schedule: taskSchedule,
        scheduleTime: taskSchedule === "仅运行一次" ? undefined : taskScheduleTime,
        scheduleDay: taskSchedule === "每周" ? taskScheduleDay : undefined,
        requiresApproval: taskApproval,
        retryCount: 0,
        runs: startImmediately
          ? [
              {
                id: `run-${Date.now()}`,
                status: "运行中",
                startedAt: new Date().toISOString(),
                summary: t("任务已创建，正在检查数据来源和执行范围。"),
              },
            ]
          : [],
      };
      syncBackend(workspaceProvider.tasks.create(newTask), t("新建任务"));
      setTasks((items) => [newTask, ...items]);
      const firstRun = newTask.runs?.[0];
      if (firstRun) void driveBrainRun(newTask, firstRun.id);
      setTaskFilter("全部");
      setSelectedTaskIds([]);
      setActiveView("tasks");
      setSelectedTaskId(newTask.id);
      writeWorkspaceRoute(
        { view: "tasks", taskId: newTask.id, runId: null },
        "push",
      );
      closeComposer({ clearRecovery: true });
      setTaskName("");
      setTaskTarget("");
      setTaskDescription("");
      setTaskSchedule("仅运行一次");
      setTaskScheduleTime("09:00");
      setTaskScheduleDay("周一");
      setTaskApproval(true);
      recordActivity({
        title: t("{value}：{title}", { value: t(startImmediately || waitsForSchedule
            ? t("任务已创建")
            : budgetBlocksRun
              ? t("任务已保存，预算保护阻止运行")
              : t("离线任务已保存")), title: newTask.title }),
        detail: startImmediately || waitsForSchedule
          ? newTask.target
            ? t("{formatTaskSchedule} · 目标：{target}", { formatTaskSchedule: formatTaskSchedule(newTask), target: newTask.target })
            : formatTaskSchedule(newTask)
          : budgetBlocksRun
            ? t("{formatTaskSchedule} · 当前已使用 {usedCredits} / {monthlyBudget} 点，调整额度后可手动开始。", { formatTaskSchedule: formatTaskSchedule(newTask), usedCredits, monthlyBudget: usageSettings.monthlyBudget })
          : t("{formatTaskSchedule} · 已保存配置，恢复网络后可手动开始运行。", { formatTaskSchedule: formatTaskSchedule(newTask) }),
        icon: "sparkles",
        tone: startImmediately ? "blue" : "amber",
        kind: "任务",
        taskId: newTask.id,
      });
      setNotice(
        startImmediately
          ? t("任务“{title}”已开始运行", { title: newTask.title })
          : waitsForSchedule
            ? t("任务“{title}”已保存，{schedule}自动运行", {
                title: newTask.title,
                schedule: formatSchedule(taskSchedule, taskScheduleTime, taskScheduleDay),
              })
            : budgetBlocksRun
            ? t("任务“{title}”已保存；月度额度已用完，暂未运行", { title: newTask.title })
          : t("任务“{title}”已保存，联网后可以开始运行", { title: newTask.title }),
      );
    } finally {
      taskSavingRef.current = false;
      setIsSavingTask(false);
    }
  }

  /** 运行频率与时间：新建、编辑任务的两种表单共用。 */
  function renderTaskSchedule() {
    return (
      <>
                  <section className="composer-schedule" aria-label={t("运行频率")}>
                    <span>{t("运行频率")}</span>
                    <div role="radiogroup" aria-label={t("选择运行频率")}>
                      {(["仅运行一次", "每天", "每周"] as TaskSchedule[]).map((schedule) => (
                        <button
                          className={taskSchedule === schedule ? "active" : ""}
                          key={schedule}
                          type="button"
                          role="radio"
                          aria-checked={taskSchedule === schedule}
                          onClick={() => setTaskSchedule(schedule)}
                        >
                          {t(schedule)}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="composer-schedule-detail">
                    {taskSchedule === "仅运行一次" ? (
                      <div className="schedule-once-note">
                        <Play size={16} />
                        <span>
                          <strong>{t("创建后立即开始")}</strong>
                          <small>{t("只运行一次，完成后保留结果和审计记录。")}</small>
                        </span>
                      </div>
                    ) : (
                      <>
                        {taskSchedule === "每周" && (
                          <label>
                            <span>{t("星期")}</span>
                            <select
                              aria-label={t("选择每周运行日期")}
                              value={taskScheduleDay}
                              onChange={(event) =>
                                setTaskScheduleDay(event.target.value as Weekday)
                              }
                            >
                              {weekdays.map((day) => (
                                <option key={day} value={day}>{t(day)}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        <label>
                          <span>{t("运行时间")}</span>
                          <input
                            ref={taskScheduleTimeRef}
                            aria-label={t("选择运行时间")}
                            type="time"
                            required
                            aria-invalid={Boolean(
                              taskFormSubmitted && taskFormErrors.scheduleTime,
                            )}
                            aria-describedby={
                              taskFormSubmitted && taskFormErrors.scheduleTime
                                ? "task-schedule-error"
                                : undefined
                            }
                            value={taskScheduleTime}
                            onInput={(event) =>
                              setTaskScheduleTime((event.target as HTMLInputElement).value)
                            }
                          />
                          {taskFormSubmitted && taskFormErrors.scheduleTime && (
                            <small
                              className="composer-field-error"
                              id="task-schedule-error"
                            >
                              <AlertTriangle size={13} />
                              {taskFormErrors.scheduleTime}
                            </small>
                          )}
                        </label>
                        <span className="schedule-timezone">
                          <Clock3 size={15} />
                          
                          {t("本地时间")}
                        </span>
                      </>
                    )}
                  </div>
      </>
    );
  }

  function beginCreateTask() {
    // 装好的产品里，新建就是开一段新对话。
    if (runtimeMode) {
      setConversationId(null);
      setConversationNonce((value) => value + 1);
      openView("home");
      return;
    }
    const draft: TaskDraftSnapshot = {
      name: "",
      target: "",
      description: "",
      schedule: "仅运行一次",
      scheduleTime: "09:00",
      scheduleDay: "周一",
      approval: settings.approval,
    };
    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }
    setEditingTaskId(null);
    setTaskName(draft.name);
    setTaskTarget(draft.target);
    setTaskDescription(draft.description);
    setTaskSchedule(draft.schedule);
    setTaskScheduleTime(draft.scheduleTime);
    setTaskScheduleDay(draft.scheduleDay);
    setTaskApproval(draft.approval);
    setTaskDraftBaseline(draft);
    taskDraftRecoveryOwnedRef.current = false;
    setTaskDraftAutoSavedAt(null);
    setTaskDraftAutoSavedSignature("");
    setTaskDraftSaveFailedSignature("");
    setTaskDiscardOpen(false);
    setTaskFormSubmitted(false);
    setComposerOpen(true);
  }

  function beginEditTask(task: TaskItem) {
    const draft: TaskDraftSnapshot = {
      name: task.title,
      target: task.target,
      description: task.description,
      schedule: task.schedule ?? "仅运行一次",
      scheduleTime: task.scheduleTime ?? "09:00",
      scheduleDay: task.scheduleDay ?? "周一",
      approval: task.requiresApproval ?? true,
    };
    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }
    setTaskName(draft.name);
    setTaskTarget(draft.target);
    setTaskDescription(draft.description);
    setTaskSchedule(draft.schedule);
    setTaskScheduleTime(draft.scheduleTime);
    setTaskScheduleDay(draft.scheduleDay);
    setTaskApproval(draft.approval);
    setTaskDraftBaseline(draft);
    taskDraftRecoveryOwnedRef.current = false;
    setTaskDraftAutoSavedAt(null);
    setTaskDraftAutoSavedSignature("");
    setTaskDraftSaveFailedSignature("");
    setTaskDiscardOpen(false);
    setTaskFormSubmitted(false);
    setEditingTaskId(task.id);
    setComposerOpen(true);
  }

  function clearTaskDraftRecovery() {
    clearDraftRecoveryStorage(taskDraftRecoveryKey);
    taskDraftRecoveryOwnedRef.current = false;
    setPendingTaskDraftRecovery(null);
    setTaskDraftAutoSavedAt(null);
    setTaskDraftAutoSavedSignature("");
    setTaskDraftSaveFailedSignature("");
  }

  function closeComposer(options: { clearRecovery?: boolean } = {}) {
    if (options.clearRecovery || taskDraftRecoveryOwnedRef.current) {
      clearTaskDraftRecovery();
    }
    setTaskDiscardOpen(false);
    setComposerOpen(false);
    setEditingTaskId(null);
    setTaskDraftBaseline(null);
    setTaskFormSubmitted(false);
  }

  function requestCloseComposer() {
    if (taskSavingRef.current || isSavingTask) return;
    if (taskComposerDirty) {
      setTaskDiscardOpen(true);
      return;
    }
    closeComposer();
  }

  function confirmDiscardTaskDraft() {
    const wasEditing = Boolean(editingTaskId);
    closeComposer();
    setNotice(
      wasEditing
        ? t("未保存的任务修改已放弃")
        : t("未保存的新任务草稿已放弃"),
    );
  }

  function restoreRecoveredTaskDraft() {
    if (!pendingTaskDraftRecovery || !tasksReady) return;
    const recovery = pendingTaskDraftRecovery;
    const originalTask = recovery.editingTaskId
      ? tasks.find((task) => task.id === recovery.editingTaskId) ?? null
      : null;
    const recoveredSignature = JSON.stringify([
      originalTask?.id ?? null,
      recovery.draft.name,
      recovery.draft.target,
      recovery.draft.description,
      recovery.draft.schedule,
      recovery.draft.scheduleTime,
      recovery.draft.scheduleDay,
      recovery.draft.approval,
    ]);

    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }
    setTaskName(recovery.draft.name);
    setTaskTarget(recovery.draft.target);
    setTaskDescription(recovery.draft.description);
    setTaskSchedule(recovery.draft.schedule);
    setTaskScheduleTime(recovery.draft.scheduleTime);
    setTaskScheduleDay(recovery.draft.scheduleDay);
    setTaskApproval(recovery.draft.approval);
    setTaskDraftBaseline(recovery.baseline);
    setEditingTaskId(originalTask?.id ?? null);
    setTaskDiscardOpen(false);
    setTaskFormSubmitted(false);
    taskDraftRecoveryOwnedRef.current = true;
    setPendingTaskDraftRecovery(null);
    setTaskDraftAutoSavedAt(recovery.savedAt);
    setTaskDraftAutoSavedSignature(recoveredSignature);
    setTaskDraftSaveFailedSignature("");
    setComposerOpen(true);

    if (recovery.editingTaskId && !originalTask) {
      setNotice(t("原任务已不存在，草稿将作为新任务继续编辑"));
    }
  }

  function discardRecoveredTaskDraft() {
    clearTaskDraftRecovery();
    setNotice(t("未完成的任务草稿已放弃"));
  }

  function applyTaskTemplate(template: (typeof taskTemplates)[number]) {
    setTaskName(template.title);
    setTaskDescription(template.description);
    setTaskTarget(template.target);
    setTaskSchedule(template.schedule);
    setTaskScheduleTime(template.scheduleTime);
    setTaskScheduleDay(template.scheduleDay);
    setTaskFormSubmitted(false);
  }

  function focusTaskComposerSection(
    section: "definition" | "schedule" | "policy",
  ) {
    const sectionElement = document.getElementById(
      `task-composer-${section}`,
    );
    sectionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (section === "definition") {
      window.setTimeout(() => taskNameRef.current?.focus(), 180);
    } else if (section === "schedule" && taskSchedule !== "仅运行一次") {
      window.setTimeout(() => taskScheduleTimeRef.current?.focus(), 180);
    }
  }

  function restoreWorkspaceFromWarning() {
    openWorkspaceImportPicker();
  }

  function retryWorkspaceSave() {
    if (workspacePersistenceStatus === "retrying") return;
    workspaceSaveRetryingRef.current = true;
    lastWorkspaceSyncSignatureRef.current = "";
    setWorkspacePersistenceStatus("retrying");
    setWorkspacePersistenceDetail(t("正在重新验证本机存储并保存完整工作区。"));
    setWorkspaceSaveRetryToken((value) => value + 1);
  }

  function exportEmergencyWorkspaceBackup() {
    exportWorkspace();
    setNotice(t("紧急备份已导出；本机保存恢复前请保留这份文件"));
  }

  function reviewWorkspaceSync() {
    const sections = workspaceSyncNotice?.sections ?? [];
    setWorkspaceSyncNotice(null);
    if (sections.includes("approvals")) {
      openView("approvals");
    } else if (sections.includes("tasks")) {
      openView("tasks");
    } else if (sections.includes("artifacts")) {
      openView("artifacts");
    } else if (sections.includes("activity")) {
      openView("activity");
    } else {
      openView("settings");
    }
  }

  function keepCurrentWorkspaceDrafts() {
    const incoming = pendingWorkspaceSyncRef.current;
    if (!incoming || !workspaceSyncNotice) {
      setWorkspaceSyncNotice(null);
      return;
    }

    let resolvedSnapshot = incoming;
    if (artifactWorkspaceConflict && editingArtifactId) {
      const currentArtifact =
        artifacts.find((artifact) => artifact.id === editingArtifactId) ?? null;
      const artifactStillExists = incoming.artifacts.some(
        (artifact) => artifact.id === editingArtifactId,
      );
      if (currentArtifact && !artifactStillExists) {
        resolvedSnapshot = {
          ...incoming,
          artifacts: [currentArtifact, ...incoming.artifacts],
        };
      }
    }
    if (
      taskWorkspaceConflict &&
      editingTaskId &&
      !incoming.tasks.some((task) => task.id === editingTaskId)
    ) {
      setEditingTaskId(null);
    }

    pendingWorkspaceSyncRef.current = null;
    applyWorkspaceSyncSnapshot(resolvedSnapshot, {
      preserveProfileDraft: profileWorkspaceConflict,
    });
    setWorkspaceSyncNotice(null);
    setNotice(t("当前草稿已保留，保存后将以这份内容为准"));
  }

  function useLatestWorkspaceVersion() {
    const incoming = pendingWorkspaceSyncRef.current;
    const conflicts = workspaceSyncNotice?.conflicts ?? [];
    if (!incoming) {
      setWorkspaceSyncNotice(null);
      return;
    }

    const latestTask = editingTaskId
      ? incoming.tasks.find((task) => task.id === editingTaskId) ?? null
      : null;
    const latestArtifact = editingArtifactId
      ? incoming.artifacts.find(
          (artifact) => artifact.id === editingArtifactId,
        ) ?? null
      : null;
    const latestMember = selectedTeamMemberId
      ? incoming.members.find(
          (member) => member.id === selectedTeamMemberId,
        ) ?? null
      : null;

    pendingWorkspaceSyncRef.current = null;
    applyWorkspaceSyncSnapshot(incoming);
    if (conflicts.includes("profile")) {
      setWorkspaceNameDraft(incoming.profile.name);
      setWorkspaceDescriptionDraft(incoming.profile.description);
      setWorkspaceProfileSubmitted(false);
    }
    if (conflicts.includes("task")) {
      clearTaskDraftRecovery();
      if (latestTask) {
        beginEditTask(latestTask);
      } else {
        closeComposer({ clearRecovery: true });
      }
    }
    if (conflicts.includes("artifact")) {
      clearArtifactDraftRecovery();
      if (latestArtifact) {
        openArtifactEditor(latestArtifact);
      } else {
        closeArtifactEditor({ clearRecovery: true });
      }
    }
    if (conflicts.includes("budget")) {
      setUsageBudgetDraft(String(incoming.usage.monthlyBudget));
      setUsageAlertDraft(incoming.usage.alertThreshold);
      setUsagePauseDraft(incoming.usage.pauseAtLimit);
      setUsagePauseConfirmed(false);
    }
    if (conflicts.includes("member")) {
      if (latestMember) {
        setMemberRoleDraft(latestMember.role);
      } else {
        setSelectedTeamMemberId(null);
        setMemberRemoveConfirm(false);
      }
    }
    setWorkspaceSyncNotice(null);
    setNotice(t("已载入另一窗口的最新内容"));
  }

  function duplicateTask(task: TaskItem) {
    const duplicate: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      title: t("{title}（副本）", { title: task.title }),
      status: "已暂停",
      progress: 0,
      updated: t("刚刚复制"),
      pinned: false,
      runs: [],
      lastError: undefined,
      errorCode: undefined,
      retryCount: 0,
    };
    syncBackend(workspaceProvider.tasks.create(duplicate), t("复制任务"));
    setTasks((items) => [duplicate, ...items]);
    setSelectedTaskId(duplicate.id);
    writeWorkspaceRoute(
      { view: "tasks", taskId: duplicate.id, runId: null },
      "push",
    );
    recordActivity({
      title: t("任务已复制：{title}", { title: duplicate.title }),
      detail: t("为避免误执行，复制后的任务保持暂停。"),
      icon: "copy",
      tone: "violet",
      kind: "任务",
      taskId: duplicate.id,
    });
    setNotice(t("已复制“{title}”，副本保持暂停", { title: task.title }));
  }

  function requestDeleteTask(task: TaskItem) {
    if (task.pinned) {
      setNotice(t("首页主任务不能删除，你可以暂停或修改它"));
      return;
    }
    setDeleteTaskId(task.id);
  }

  function stageTaskDeleteUndo(
    deletedCount: number,
    restoreTaskId: string | null = null,
  ) {
    setArtifactDeleteSnapshot(null);
    setApprovalRejectSnapshot(null);
    setTaskDeleteSnapshot({
      tasks,
      artifacts,
      activity: activityLog,
      approvals,
      approvalDeferrals,
      selectedTaskIds,
      selectedApprovalId,
      selectedApprovalIds,
      activityTaskId,
      artifactTaskId,
      restoreTaskId,
      isRunning,
      deletedCount,
    });
  }

  function confirmDeleteTask() {
    if (!deletingTask) return;
    const deletingTaskId = deletingTask.id;
    const deletedApprovalIds = new Set(
      approvals
        .filter((approval) => approval.taskId === deletingTaskId)
        .map((approval) => approval.id),
    );
    const remainingApprovals = approvals.filter(
      (approval) => approval.taskId !== deletingTaskId,
    );
    stageTaskDeleteUndo(1, deletingTaskId);
    // provider 的 remove 会连带清掉这个任务的成果和待审批，和下面的本地更新一致。
    syncBackend(workspaceProvider.tasks.remove(deletingTaskId), t("删除任务"));
    setTasks((items) => items.filter((item) => item.id !== deletingTask.id));
    setArtifacts((items) =>
      items.filter((artifact) => artifact.taskId !== deletingTask.id),
    );
    setActivityLog((items) =>
      items.filter((activity) => activity.taskId !== deletingTask.id),
    );
    setApprovals(remainingApprovals);
    removeApprovalDeferrals(deletedApprovalIds);
    setSelectedApprovalId((approvalId) =>
      deletedApprovalIds.has(approvalId)
        ? (remainingApprovals[0]?.id ?? "")
        : approvalId,
    );
    setSelectedApprovalIds((approvalIds) =>
      approvalIds.filter((approvalId) => !deletedApprovalIds.has(approvalId)),
    );
    setSelectedTaskIds((selectedIds) =>
      selectedIds.filter((id) => id !== deletingTaskId),
    );
    if (activityTaskId === deletingTask.id) {
      setActivityTaskId(null);
    }
    if (artifactTaskId === deletingTask.id) {
      setArtifactTaskId(null);
    }
    setDeleteTaskId(null);
    setSelectedTaskId(null);
    writeWorkspaceRoute(
      { view: "tasks", taskId: null, runId: null, taskFilter },
      "replace",
    );
    recordActivity({
      title: t("任务已删除：{title}", { title: deletingTask.title }),
      detail: t("已移除任务配置、关联成果和本机记录，原数据来源：{target}", { target: deletingTask.target }),
      icon: "trash",
      tone: "red",
      kind: "任务",
      taskId: deletingTaskId,
    });
    setNotice(t("已删除 1 个任务“{title}”", { title: deletingTask.title }));
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((selectedIds) =>
      selectedIds.includes(taskId)
        ? selectedIds.filter((id) => id !== taskId)
        : [...selectedIds, taskId],
    );
  }

  function toggleAllVisibleTasks() {
    const visibleIds = filteredTasks.map((task) => task.id);
    setSelectedTaskIds((selectedIds) => {
      if (allVisibleTasksSelected) {
        return selectedIds.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...selectedIds, ...visibleIds]));
    });
  }

  function bulkPauseTasks() {
    const targetIds = new Set(
      selectedTasks
        .filter((task) => task.status === "运行中" || task.status === "待确认")
        .map((task) => task.id),
    );
    if (targetIds.size === 0) {
      setNotice(t("所选任务中没有可以暂停的任务"));
      return;
    }
    setTasks((items) =>
      items.map((task) =>
        targetIds.has(task.id)
          ? {
              ...task,
              status: "已暂停",
              updated: t("刚刚批量暂停"),
              runs: stopActiveTaskRuns(
                task.runs,
                t("任务已由批量操作暂停，当前检查点已保存。"),
              ),
            }
          : task,
      ),
    );
    syncBackend(
      Promise.all([...targetIds].map((id) => workspaceProvider.tasks.pause(id))),
      t("批量暂停"),
    );
    if (targetIds.has("competitor")) setIsRunning(false);
    setSelectedTaskIds([]);
    recordActivity({
      title: t("已批量暂停 {size} 个任务", { size: targetIds.size }),
      detail: t("任务保留当前进度和已保存证据，可随时继续运行。"),
      icon: "clock",
      tone: "amber",
      kind: "任务",
    });
    setNotice(t("已暂停 {size} 个任务", { size: targetIds.size }));
  }

  function bulkResumeTasks() {
    const targetIds = new Set(
      selectedTasks
        .filter(
          (task) =>
            task.status === "已暂停" ||
            task.status === "已完成" ||
            task.status === "失败",
        )
        .map((task) => task.id),
    );
    if (targetIds.size === 0) {
      setNotice(t("所选任务中没有可以继续的任务"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，未继续所选的 {size} 个任务；任务仍保持原状态", { size: targetIds.size }),
      )
    ) {
      return;
    }
    if (!requireBudgetCapacity(t("继续所选的 {size} 个任务", { size: targetIds.size }))) return;
    setTasks((items) =>
      items.map((task) =>
        targetIds.has(task.id)
          ? {
              ...task,
              status: "运行中",
              progress:
                task.status === "已完成" || task.status === "失败"
                  ? Math.max(3, Math.min(task.progress, 12))
                  : task.progress,
              updated: t("刚刚批量继续"),
              lastError: undefined,
              errorCode: undefined,
              retryCount:
                task.status === "失败"
                  ? (task.retryCount ?? 0) + 1
                  : task.retryCount,
              runs: [
                {
                  id: `run-${task.id}-${Date.now()}`,
                  status: "运行中" as const,
                  startedAt: new Date().toISOString(),
                  summary:
                    task.status === "失败"
                      ? t("批量重试已启动，正在重新验证任务依赖。")
                      : task.status === "已完成"
                        ? t("批量再次运行已启动，正在重新读取任务目标。")
                        : t("任务已由批量操作从保存的检查点继续运行。"),
                },
                ...(task.runs ?? []),
              ].slice(0, 12),
            }
          : task,
      ),
    );
    syncBackend(
      Promise.all([...targetIds].map((id) => workspaceProvider.tasks.resume(id))),
      t("批量继续"),
    );
    if (targetIds.has("competitor")) setIsRunning(true);
    setSelectedTaskIds([]);
    recordActivity({
      title: t("已批量继续 {size} 个任务", { size: targetIds.size }),
      detail: t("任务已从各自保存的进度重新开始运行。"),
      icon: "activity",
      tone: "green",
      kind: "任务",
    });
    setNotice(t("已继续 {size} 个任务", { size: targetIds.size }));
  }

  function bulkEnableApproval() {
    const targetIds = new Set(
      selectedTasks
        .filter((task) => !(task.requiresApproval ?? true))
        .map((task) => task.id),
    );
    if (targetIds.size === 0) {
      setNotice(t("所选任务已经启用审批保护"));
      return;
    }
    setTasks((items) =>
      items.map((task) =>
        targetIds.has(task.id) ? { ...task, requiresApproval: true } : task,
      ),
    );
    setSelectedTaskIds([]);
    recordActivity({
      title: t("已为 {size} 个任务启用审批保护", { size: targetIds.size }),
      detail: t("这些任务执行外部操作前会暂停并等待人工确认。"),
      icon: "shield",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("已保护 {size} 个任务", { size: targetIds.size }));
  }

  function requestBulkDelete() {
    if (deletableSelectedTasks.length === 0) {
      setNotice(t("首页主任务不能删除，请选择其他任务"));
      return;
    }
    setBulkDeleteOpen(true);
  }

  function confirmBulkDelete() {
    if (deletableSelectedTasks.length === 0) return;
    const deletedIds = new Set(deletableSelectedTasks.map((task) => task.id));
    const deletedCount = deletedIds.size;
    const deletedApprovalIds = new Set(
      approvals
        .filter((approval) => deletedIds.has(approval.taskId))
        .map((approval) => approval.id),
    );
    const remainingApprovals = approvals.filter(
      (approval) => !deletedIds.has(approval.taskId),
    );
    stageTaskDeleteUndo(deletedCount);
    setTasks((items) => items.filter((task) => !deletedIds.has(task.id)));
    setArtifacts((items) =>
      items.filter((artifact) => !deletedIds.has(artifact.taskId)),
    );
    setActivityLog((items) =>
      items.filter((activity) => !activity.taskId || !deletedIds.has(activity.taskId)),
    );
    setApprovals(remainingApprovals);
    removeApprovalDeferrals(deletedApprovalIds);
    setSelectedApprovalId((approvalId) =>
      deletedApprovalIds.has(approvalId)
        ? (remainingApprovals[0]?.id ?? "")
        : approvalId,
    );
    setSelectedApprovalIds((approvalIds) =>
      approvalIds.filter((approvalId) => !deletedApprovalIds.has(approvalId)),
    );
    setSelectedTaskIds([]);
    setBulkDeleteOpen(false);
    recordActivity({
      title: t("已批量删除 {deletedCount} 个任务", { deletedCount }),
      detail: t("关联成果、审批事项和任务运行记录已一并移除，可在当前提示中撤销。"),
      icon: "trash",
      tone: "red",
      kind: "系统",
    });
    setNotice(
      t("已删除 {deletedCount} 个任务{value}", { deletedCount, value: protectedSelectedTaskCount ? t("，首页任务已保留") : "" }),
    );
  }

  function undoTaskDelete() {
    if (!taskDeleteSnapshot) return;
    const snapshot = taskDeleteSnapshot;
    const restoredTask = snapshot.restoreTaskId
      ? snapshot.tasks.find((task) => task.id === snapshot.restoreTaskId)
      : null;
    const restoredActivityIds = new Set(
      snapshot.activity.map((activity) => activity.id),
    );
    setTasks(snapshot.tasks);
    setArtifacts(snapshot.artifacts);
    setActivityLog((items) => [
      ...items.filter((activity) => !restoredActivityIds.has(activity.id)),
      ...snapshot.activity,
    ].slice(0, 100));
    setApprovals(snapshot.approvals);
    setApprovalDeferrals(snapshot.approvalDeferrals);
    setSelectedTaskIds(snapshot.selectedTaskIds);
    setSelectedApprovalId(snapshot.selectedApprovalId);
    setSelectedApprovalIds(snapshot.selectedApprovalIds);
    setActivityTaskId(snapshot.activityTaskId);
    setArtifactTaskId(snapshot.artifactTaskId);
    setIsRunning(snapshot.isRunning);
    if (snapshot.restoreTaskId) {
      setActiveView("tasks");
      setSelectedTaskId(snapshot.restoreTaskId);
      writeWorkspaceRoute(
        {
          view: "tasks",
          taskId: snapshot.restoreTaskId,
          runId: null,
        },
        "push",
      );
    }
    setTaskDeleteSnapshot(null);
    recordActivity({
      title: restoredTask
        ? t("已撤销删除：{title}", { title: restoredTask.title })
        : t("已撤销删除 {deletedCount} 个任务", { deletedCount: snapshot.deletedCount }),
      detail: t("任务、关联成果、审批事项和运行记录已恢复。"),
      icon: "activity",
      tone: "green",
      kind: restoredTask ? "任务" : "系统",
      taskId: restoredTask?.id,
    });
    setNotice(
      restoredTask
        ? t("已恢复任务“{title}”", { title: restoredTask.title })
        : t("已恢复 {deletedCount} 个任务", { deletedCount: snapshot.deletedCount }),
    );
  }

  function openUsageBudget() {
    setUsageBudgetDraft(String(usageSettings.monthlyBudget));
    setUsageAlertDraft(usageSettings.alertThreshold);
    setUsagePauseDraft(usageSettings.pauseAtLimit);
    setUsagePauseConfirmed(false);
    setSettingsDiscardTarget(null);
    setUsageBudgetOpen(true);
  }

  function openPlanCenter() {
    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }
    setSettingsDiscardTarget(null);
    setWorkspaceMenuOpen(false);
    setPlanCenterOpen(true);
  }

  function closePlanCenter() {
    setPlanCenterOpen(false);
  }

  function openPlanBudget() {
    setPlanCenterOpen(false);
    openUsageBudget();
  }

  function openPlanMembers() {
    setPlanCenterOpen(false);
    openSettingsSection("team");
  }

  function openWorkspaceProfile() {
    if (
      !overlayTriggerRef.current &&
      document.activeElement instanceof HTMLElement
    ) {
      overlayTriggerRef.current = document.activeElement;
    }
    setWorkspaceNameDraft(workspaceProfile.name);
    setWorkspaceDescriptionDraft(workspaceProfile.description);
    setWorkspaceProfileSubmitted(false);
    setSettingsDiscardTarget(null);
    setWorkspaceMenuOpen(false);
    setWorkspaceProfileOpen(true);
  }

  function requestCloseWorkspaceProfile() {
    if (workspaceProfileDirty) {
      setSettingsDiscardTarget("profile");
      return;
    }
    setWorkspaceProfileOpen(false);
    setWorkspaceProfileSubmitted(false);
  }

  function saveWorkspaceProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceProfileSubmitted(true);
    if (profileWorkspaceConflict) {
      setNotice(t("工作区资料已在另一窗口更新，请先处理版本冲突"));
      return;
    }
    if (workspaceProfileFormHasErrors) {
      window.requestAnimationFrame(() => {
        const target = workspaceProfileFormErrors.name
          ? workspaceNameRef.current
          : document.querySelector<HTMLTextAreaElement>(
              "#workspace-description-field",
            );
        target?.focus();
      });
      return;
    }

    const nextProfile: WorkspaceProfile = {
      name: workspaceNameDraft.trim(),
      description: workspaceDescriptionDraft.trim(),
    };
    const previousName = workspaceProfile.name;
    setWorkspaceProfile(nextProfile);
    setWorkspaceNameDraft(nextProfile.name);
    setWorkspaceDescriptionDraft(nextProfile.description);
    setWorkspaceProfileSubmitted(false);
    setWorkspaceProfileOpen(false);
    recordActivity({
      title: t("工作区资料已更新：{name}", { name: nextProfile.name }),
      detail:
        previousName === nextProfile.name
          ? t("工作区说明已更新为“{description}”。", { description: nextProfile.description })
          : t("工作区已从“{previousName}”更名为“{name}”。", { previousName, name: nextProfile.name }),
      icon: "settings",
      tone: "green",
      kind: "系统",
    });
    setNotice(t("工作区已更新为“{name}”", { name: nextProfile.name }));
  }

  function requestCloseUsageBudget() {
    if (usageBudgetDirty) {
      setSettingsDiscardTarget("budget");
      return;
    }
    setUsagePauseConfirmed(false);
    setUsageBudgetOpen(false);
  }

  function discardSettingsDraft() {
    if (settingsDiscardTarget === "profile") {
      setWorkspaceNameDraft(workspaceProfile.name);
      setWorkspaceDescriptionDraft(workspaceProfile.description);
      setWorkspaceProfileSubmitted(false);
      setWorkspaceProfileOpen(false);
    } else if (settingsDiscardTarget === "budget") {
      setUsageBudgetDraft(String(usageSettings.monthlyBudget));
      setUsageAlertDraft(usageSettings.alertThreshold);
      setUsagePauseDraft(usageSettings.pauseAtLimit);
      setUsagePauseConfirmed(false);
      setUsageBudgetOpen(false);
    } else if (settingsDiscardTarget === "invite") {
      setInviteName("");
      setInviteEmail("");
      setInviteRole("成员");
      setInviteAdminAcknowledged(false);
      setInviteFormSubmitted(false);
      setTeamInviteOpen(false);
    } else if (settingsDiscardTarget === "member") {
      if (selectedTeamMember) setMemberRoleDraft(selectedTeamMember.role);
      setSelectedTeamMemberId(null);
      setMemberRemoveConfirm(false);
      setMemberRemoveAcknowledged(false);
    }
    setSettingsDiscardTarget(null);
  }

  function saveUsageBudget() {
    if (budgetWorkspaceConflict) {
      setNotice(t("预算已在另一窗口更新，请先处理版本冲突"));
      return;
    }
    if (!usageBudgetCanSave) {
      if (usageBudgetRequiresConfirmation && !usagePauseConfirmed) {
        setNotice(t("请先确认会立即暂停运行中任务"));
      }
      return;
    }
    const monthlyBudget = Math.round(usageBudgetDraftValue);
    const nextSettings: UsageSettings = {
      monthlyBudget,
      alertThreshold: usageAlertDraft,
      pauseAtLimit: usagePauseDraft,
    };
    const shouldPause = usagePauseDraft && usedCredits >= monthlyBudget;
    const runningTaskIds = tasks
      .filter((task) => task.status === "运行中")
      .map((task) => task.id);

    setUsageSettings(nextSettings);
    setUsagePauseConfirmed(false);
    setUsageBudgetOpen(false);
    if (shouldPause && runningTaskIds.length > 0) {
      const runningIds = new Set(runningTaskIds);
      setTasks((items) =>
        items.map((task) =>
          runningIds.has(task.id)
            ? {
                ...task,
                status: "已暂停",
                updated: t("因用量到限保护暂停"),
                runs: stopActiveTaskRuns(
                  task.runs,
                  t("达到预算上限，系统已停止本次运行。"),
                ),
              }
            : task,
        ),
      );
      if (runningIds.has("competitor")) {
        setIsRunning(false);
      }
      recordActivity({
        title: t("月度额度已更新：{monthlyBudget} 点", { monthlyBudget }),
        detail: t("当前已使用 {usedCredits} 点，达到预算上限；已暂停 {length} 个运行中任务。提醒阈值：{usageAlertDraft}%。", { usedCredits, length: runningTaskIds.length, usageAlertDraft }),
        icon: "settings",
        tone: "amber",
        kind: "系统",
      });
      setNotice(
        t("预算已保存，{length} 个任务因用量到限保护暂停", { length: runningTaskIds.length }),
      );
      return;
    }

    recordActivity({
      title: t("月度额度已更新：{monthlyBudget} 点", { monthlyBudget }),
      detail: t("提醒阈值：{usageAlertDraft}% · 到限自动暂停：{value}。", { usageAlertDraft, value: usagePauseDraft ? t("已开启") : t("已关闭") }),
      icon: "settings",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("月度额度已更新为 {monthlyBudget} 点", { monthlyBudget }));
  }

  function exportUsageReport() {
    const rows = [
      [t("项目"), t("本月额度"), t("占已用比例")],
      ...usageBreakdown.map((item) => [
        item.label,
        String(item.credits),
        `${Math.round((item.credits / Math.max(1, usedCredits)) * 100)}%`,
      ]),
      [t("合计"), String(usedCredits), "100%"],
      [t("月度预算"), String(usageSettings.monthlyBudget), ""],
      [t("月底预计"), String(forecastCredits), ""],
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${value.replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unzoo-one-usage-${new Date()
      .toISOString()
      .slice(0, 7)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    recordActivity({
      title: t("用量报告已导出"),
      detail: t("已导出本月 {usedCredits} 点 AI 用量及分类明细。", { usedCredits }),
      icon: "activity",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("本月用量报告已导出"));
  }

  function toggleSetting(key: keyof SettingsState, label: string) {
    const nextValue = !settings[key];
    setSettings((current) => ({ ...current, [key]: nextValue }));
    recordActivity({
      title: t("{label}：{value}", { label, value: nextValue ? t("已开启") : t("已关闭") }),
      detail: t("设置变更已应用到后续任务执行。"),
      icon: "settings",
      tone: "neutral",
      kind: "系统",
    });
    setNotice(t("{label}：{value}", { label, value: nextValue ? t("已开启") : t("已关闭") }));
  }

  async function toggleDesktopNotifications() {
    if (
      isRequestingNotificationPermission ||
      desktopNotificationPermission === "checking"
    ) {
      return;
    }

    if (settings.notifications) {
      setSettings((current) => ({ ...current, notifications: false }));
      recordActivity({
        title: t("桌面确认提醒已关闭"),
        detail: t("页面内通知中心仍会保留任务、审批和成果动态。"),
        icon: "settings",
        tone: "neutral",
        kind: "系统",
      });
      setNotice(t("桌面提醒已关闭，页面内通知仍会保留"));
      return;
    }

    if (!("Notification" in window)) {
      setDesktopNotificationPermission("unsupported");
      setNotice(t("当前浏览器不支持桌面通知，页面内通知仍可正常使用"));
      return;
    }

    setIsRequestingNotificationPermission(true);
    try {
      let permission = window.Notification.permission;
      if (permission === "default") {
        permission = await window.Notification.requestPermission();
      }
      setDesktopNotificationPermission(permission);

      if (permission !== "granted") {
        setSettings((current) => ({ ...current, notifications: false }));
        recordActivity({
          title: t("桌面通知授权未通过"),
          detail:
            permission === "denied"
              ? t("浏览器已阻止当前站点发送桌面通知。")
              : t("本次未授予桌面通知权限，页面内通知不受影响。"),
          icon: "settings",
          tone: "amber",
          kind: "系统",
        });
        setNotice(
          permission === "denied"
            ? t("浏览器已阻止桌面通知，请在网站权限中允许后重试")
            : t("未开启桌面通知，页面内通知仍会保留"),
        );
        return;
      }

      setSettings((current) => ({ ...current, notifications: true }));
      recordActivity({
        title: t("桌面确认提醒已开启"),
        detail: t("后续任务需要确认或安全停止时，浏览器会主动发送桌面提醒。"),
        icon: "settings",
        tone: "green",
        kind: "系统",
      });
      setNotice(t("桌面提醒已开启"));

      try {
        const confirmation = new window.Notification(t("Unzoo One 提醒已开启"), {
          body: t("后续需要你决定的任务会在这里提醒。"),
          icon: "/unzoo-one-mark-v6.png",
          tag: "unzoo-one-notifications-enabled",
        });
        window.setTimeout(() => confirmation.close(), 5000);
      } catch {
        // The saved permission remains authoritative if the preview is suppressed.
      }
    } catch {
      setSettings((current) => ({ ...current, notifications: false }));
      setDesktopNotificationPermission(window.Notification.permission);
      setNotice(t("无法开启桌面通知，页面内通知仍可正常使用"));
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  }

  function requestToggleLocalPersistence() {
    if (settings.local) {
      setTemporaryModeOpen(true);
      return;
    }
    setSettings((current) => ({ ...current, local: true }));
    recordActivity({
      title: t("本机持久保存已开启"),
      detail: t("当前任务、成果、审批和运行记录会继续保存在这台设备。"),
      icon: "settings",
      tone: "green",
      kind: "系统",
    });
    setNotice(t("已开启本机持久保存，当前工作区会在下次打开时恢复"));
  }

  function confirmTemporaryMode() {
    setSettings((current) => ({ ...current, local: false }));
    setTemporaryModeOpen(false);
    recordActivity({
      title: t("已切换到临时会话"),
      detail: t("当前页面关闭后，本次工作区不会从本机恢复；本次会话中的数据仍可继续使用或导出。"),
      icon: "settings",
      tone: "amber",
      kind: "系统",
    });
    setNotice(t("已进入临时会话，关闭页面前可以随时重新开启保存"));
  }

  function preserveConnectorSettingsRoute() {
    settingsSectionRef.current = "connectors";
    setSettingsSection("connectors");
    writeWorkspaceRoute(
      {
        view: "settings",
        taskId: null,
        runId: null,
        settingsSection: "connectors",
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function openConnector(connectorId: ConnectorId) {
    preserveConnectorSettingsRoute();
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
    setSelectedConnectorId(connectorId);
  }

  function closeConnector() {
    preserveConnectorSettingsRoute();
    setSelectedConnectorId(null);
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
  }

  function requestConnectorDisconnect() {
    preserveConnectorSettingsRoute();
    setConnectorDisconnectAcknowledged(false);
    setConnectorDisconnectConfirm(true);
    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(".connector-disconnect-confirm")
        ?.scrollIntoView({ block: "nearest" });
    }, 0);
  }

  function connectConnector(connectorId: ConnectorId) {
    const connector = connectorCatalog.find((item) => item.id === connectorId);
    if (!connector) return;
    if (!connectorAuthorizeAcknowledged) {
      setNotice(t("请先确认这项连接将获得的权限范围"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，{name}尚未连接；恢复网络后可以继续授权", { name: connector.name }),
      )
    ) {
      return;
    }
    syncBackend(workspaceProvider.connectors.connect(connectorId), t("连接器授权"));
    setConnectorStates((current) => ({ ...current, [connectorId]: true }));
    setConnectorCheckResults((current) => ({
      ...current,
      [connectorId]: {
        checkedAt: t("刚刚"),
        latency: connectorTestLatencies[connectorId],
      },
    }));
    setConnectorDisconnectConfirm(false);
    setConnectorAuthorizeAcknowledged(false);
    recordActivity({
      title: t("连接器已授权：{name}", { name: connector.name }),
      detail: t("已启用 {join}；授权范围为{scope}。", { join: connector.permissions.join(t("、")), scope: connector.scope }),
      icon: "settings",
      tone: "green",
      kind: "系统",
    });
    setNotice(t("{name}已连接，可以用于后续任务", { name: connector.name }));
  }

  function testConnector(connectorId: ConnectorId) {
    const connector = connectorCatalog.find((item) => item.id === connectorId);
    if (
      !connector ||
      !connectorStates[connectorId] ||
      connectorTestingId ||
      connectorTestingAll
    ) {
      return;
    }
    if (
      !requireOnline(
        t("设备离线，无法测试{name}；当前授权状态没有改变", { name: connector.name }),
      )
    ) {
      return;
    }
    setConnectorTestingId(connectorId);
    // 真的去问后端。本机 unzoo 在跑就是真实往返延迟，没起来则由 provider
    // 落回演示值，界面表现一致。
    void workspaceProvider.connectors
      .diagnose(connectorId)
      .then((result) => {
        setConnectorTestingId(null);
        setConnectorCheckResults((current) => ({ ...current, [connectorId]: result }));
        recordActivity({
          title: t("连接测试通过：{name}", { name: connector.name }),
          detail: t("连接正常，往返 {latency} ms，当前授权范围为{scope}。", { latency: result.latency, scope: connector.scope }),
          icon: "settings",
          tone: "green",
          kind: "系统",
        });
        setNotice(t("{name}连接正常，往返 {latency} ms", { name: connector.name, latency: result.latency }));
      })
      .catch((error: unknown) => {
        setConnectorTestingId(null);
        const detail = error instanceof Error ? error.message : String(error);
        recordActivity({
          title: t("连接测试失败：{name}", { name: connector.name }),
          detail,
          icon: "settings",
          tone: "red",
          kind: "系统",
        });
        setNotice(t("{name}连接测试失败：{detail}", { name: connector.name, detail }));
      });
  }

  function testAllConnectors() {
    if (connectorTestingId || connectorTestingAll) return;
    preserveConnectorSettingsRoute();
    const testableConnectors = connectorCatalog.filter(
      (connector) =>
        connectorStates[connector.id] &&
        connectorIssueTasks[connector.id].length === 0,
    );
    if (testableConnectors.length === 0) {
      setNotice(t("当前没有可以检测的已授权连接"));
      return;
    }
    if (
      !requireOnline(t("设备离线，无法执行连接检测；当前授权状态没有改变"))
    ) {
      return;
    }

    setConnectorTestingAll(true);
    void Promise.all(
      testableConnectors.map((connector) =>
        workspaceProvider.connectors
          .diagnose(connector.id)
          .then((result) => [connector.id, result] as const),
      ),
    )
      .then((entries) => {
        setConnectorCheckResults((current) => {
          const next = { ...current };
          entries.forEach(([id, result]) => {
            next[id] = result;
          });
          return next;
        });
        setConnectorTestingAll(false);
        const slowest = Math.max(...entries.map(([, result]) => result.latency));
        recordActivity({
          title: t("连接器健康检测已完成"),
          detail: t("{length} 项已授权连接通过身份凭证、权限范围和响应检测，最慢一项往返 {slowest} ms；异常授权仍保持安全停止。", { length: testableConnectors.length, slowest }),
          icon: "shield",
          tone: "green",
          kind: "系统",
        });
        setNotice(t("{length} 项连接检测通过", { length: testableConnectors.length }));
      })
      .catch((error: unknown) => {
        setConnectorTestingAll(false);
        const detail = error instanceof Error ? error.message : String(error);
        recordActivity({
          title: t("连接器健康检测失败"),
          detail,
          icon: "shield",
          tone: "red",
          kind: "系统",
        });
        setNotice(t("连接检测失败：{detail}", { detail }));
      });
  }

  function reauthorizeConnector(connectorId: ConnectorId) {
    const connector = connectorCatalog.find((item) => item.id === connectorId);
    const impactedTasks = connectorIssueTasks[connectorId];
    if (
      !connector ||
      impactedTasks.length === 0 ||
      connectorTestingId ||
      connectorTestingAll
    ) {
      return;
    }
    if (!connectorAuthorizeAcknowledged) {
      setNotice(t("请先确认恢复这项连接的权限范围"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，{name}尚未重新授权；受影响任务仍保持安全停止", { name: connector.name }),
      )
    ) {
      return;
    }

    const impactedTaskIds = new Set(impactedTasks.map((task) => task.id));
    setConnectorTestingId(connectorId);
    window.setTimeout(() => {
      syncBackend(workspaceProvider.connectors.connect(connectorId), t("连接器授权"));
    setConnectorStates((current) => ({ ...current, [connectorId]: true }));
      setConnectorCheckResults((current) => ({
        ...current,
        [connectorId]: {
          checkedAt: t("刚刚"),
          latency: connectorTestLatencies[connectorId],
        },
      }));
      setTasks((items) =>
        items.map((task) =>
          impactedTaskIds.has(task.id)
            ? {
                ...task,
                errorCode: "RECOVERY_READY",
                lastError: t("{name}已重新授权，任务可以从安全检查点继续。", { name: connector.name }),
                updated: t("刚刚恢复授权"),
              }
            : task,
        ),
      );
      setConnectorTestingId(null);
      setConnectorAuthorizeAcknowledged(false);
      recordActivity({
        title: t("连接器已重新授权：{name}", { name: connector.name }),
        detail: t("授权验证通过，{length} 个受影响任务已准备好重新运行；系统仍会保留原始失败记录。", { length: impactedTasks.length }),
        icon: "shield",
        tone: "green",
        kind: "系统",
        taskId: impactedTasks.length === 1 ? impactedTasks[0].id : undefined,
      });
      setNotice(t("{name}已恢复，受影响任务可以重新运行", { name: connector.name }));
    }, 950);
  }

  function openConnectorAffectedTask(taskId: string) {
    setSelectedConnectorId(null);
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
    openTask(taskId);
  }

  function confirmDisconnectConnector() {
    if (!selectedConnector) return;
    if (!connectorDisconnectAcknowledged) {
      setNotice(t("请先确认后续任务将无法继续使用这项能力"));
      return;
    }
    syncBackend(
      workspaceProvider.connectors.disconnect(selectedConnector.id),
      t("断开连接器"),
    );
    setConnectorStates((current) => ({
      ...current,
      [selectedConnector.id]: false,
    }));
    setConnectorCheckResults((current) => ({
      ...current,
      [selectedConnector.id]: null,
    }));
    setConnectorDisconnectConfirm(false);
    setConnectorDisconnectAcknowledged(false);
    setConnectorAuthorizeAcknowledged(false);
    recordActivity({
      title: t("连接器已断开：{name}", { name: selectedConnector.name }),
      detail: t("后续任务不会再使用这项能力，历史运行记录仍会保留。"),
      icon: "settings",
      tone: "amber",
      kind: "系统",
    });
    setNotice(t("{name}已断开", { name: selectedConnector.name }));
  }

  function preserveTeamSettingsRoute() {
    settingsSectionRef.current = "team";
    setSettingsSection("team");
    writeWorkspaceRoute(
      {
        view: "settings",
        taskId: null,
        runId: null,
        settingsSection: "team",
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function openTeamInvite() {
    preserveTeamSettingsRoute();
    setInviteName("");
    setInviteEmail("");
    setInviteRole("成员");
    setInviteAdminAcknowledged(false);
    setInviteFormSubmitted(false);
    setSettingsDiscardTarget(null);
    setTeamInviteOpen(true);
  }

  function closeTeamInvite() {
    if (inviteSavingRef.current) return;
    if (teamInviteDirty) {
      setSettingsDiscardTarget("invite");
      return;
    }
    setTeamInviteOpen(false);
    setInviteAdminAcknowledged(false);
    setInviteFormSubmitted(false);
  }

  async function inviteTeamMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSavingRef.current) return;
    setInviteFormSubmitted(true);
    if (teamInviteFormHasErrors) return;
    if (teamSeatLimitReached) {
      setNotice(t("当前工作区席位已用完，请先移除成员或升级方案"));
      return;
    }
    if (inviteNeedsAdminAcknowledgement) {
      setNotice(t("请先确认管理员将获得的高权限"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，邀请尚未发送；已填写的姓名、邮箱和角色仍保留在表单中"),
      )
    ) {
      return;
    }

    inviteSavingRef.current = true;
    setIsSendingInvite(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      const normalizedName = inviteName.trim();
      const normalizedEmail = inviteEmail.trim().toLowerCase();
      const tones: TeamMember["tone"][] = ["violet", "blue", "green", "amber"];
      const member: TeamMember = {
        id: `member-${Date.now()}`,
        name: normalizedName,
        email: normalizedEmail,
        role: inviteRole,
        status: "已邀请",
        avatar: normalizedName.slice(0, 1).toUpperCase(),
        tone: tones[teamMembers.length % tones.length],
        lastActive: t("邀请刚刚发送"),
      };
      syncBackend(workspaceProvider.team.invite(member), t("邀请成员"));
      setTeamMembers((members) => [...members, member]);
      setTeamInviteOpen(false);
      setInviteAdminAcknowledged(false);
      setInviteFormSubmitted(false);
      recordActivity({
        title: t("已邀请团队成员：{name}", { name: member.name }),
        detail: t("{email} · {role} · 邀请邮件已发送。", { email: member.email, role: t(member.role) }),
        icon: "settings",
        tone: "blue",
        kind: "系统",
      });
      setNotice(t("邀请已发送给 {name}", { name: member.name }));
    } finally {
      inviteSavingRef.current = false;
      setIsSendingInvite(false);
    }
  }

  function openTeamMember(member: TeamMember) {
    preserveTeamSettingsRoute();
    setMemberRoleDraft(member.role);
    setMemberRemoveConfirm(false);
    setMemberRemoveAcknowledged(false);
    setSettingsDiscardTarget(null);
    setSelectedTeamMemberId(member.id);
  }

  function closeTeamMember() {
    if (teamMemberRoleDirty) {
      setSettingsDiscardTarget("member");
      return;
    }
    setSelectedTeamMemberId(null);
    setMemberRemoveConfirm(false);
    setMemberRemoveAcknowledged(false);
  }

  function saveTeamMemberRole() {
    if (memberWorkspaceConflict) {
      setNotice(t("成员角色已在另一窗口更新，请先处理版本冲突"));
      return;
    }
    if (!selectedTeamMember || selectedTeamMember.role === "所有者") return;
    if (memberRoleDraft === selectedTeamMember.role) {
      setNotice(t("成员角色没有变化"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，{name}的角色仍保持不变；恢复网络后可以保存", { name: selectedTeamMember.name }),
      )
    ) {
      return;
    }
    const previousRole = selectedTeamMember.role;
    syncBackend(
      workspaceProvider.team.updateRole(selectedTeamMember.id, memberRoleDraft),
      t("修改成员角色"),
    );
    setTeamMembers((members) =>
      members.map((member) =>
        member.id === selectedTeamMember.id
          ? { ...member, role: memberRoleDraft }
          : member,
      ),
    );
    recordActivity({
      title: t("成员角色已更新：{name}", { name: selectedTeamMember.name }),
      detail: t("{previousRole} → {memberRoleDraft}；新权限已立即生效。", { previousRole: t(previousRole), memberRoleDraft: t(memberRoleDraft) }),
      icon: "shield",
      tone: "violet",
      kind: "系统",
    });
    setNotice(t("{name} 已设为{memberRoleDraft}", { name: selectedTeamMember.name, memberRoleDraft: t(memberRoleDraft) }));
  }

  function resendTeamInvite() {
    if (!selectedTeamMember || selectedTeamMember.status !== "已邀请") return;
    if (
      !requireOnline(
        t("设备离线，尚未向{name}重新发送邀请", { name: selectedTeamMember.name }),
      )
    ) {
      return;
    }
    setTeamMembers((members) =>
      members.map((member) =>
        member.id === selectedTeamMember.id
          ? { ...member, lastActive: t("邀请刚刚重新发送") }
          : member,
      ),
    );
    recordActivity({
      title: t("团队邀请已重发：{name}", { name: selectedTeamMember.name }),
      detail: t("新的邀请邮件已发送至 {email}。", { email: selectedTeamMember.email }),
      icon: "settings",
      tone: "blue",
      kind: "系统",
    });
    setNotice(t("已重新发送邀请给 {name}", { name: selectedTeamMember.name }));
  }

  function confirmRemoveTeamMember() {
    if (!selectedTeamMember || selectedTeamMember.role === "所有者") return;
    if (!memberRemoveAcknowledged) {
      setNotice(t("请先确认该成员会立即失去工作区访问权限"));
      return;
    }
    if (
      !requireOnline(
        t("设备离线，{name}仍保留工作区访问权限；恢复网络后可以移除", { name: selectedTeamMember.name }),
      )
    ) {
      return;
    }
    const removedMember = selectedTeamMember;
    syncBackend(workspaceProvider.team.remove(removedMember.id), t("移除成员"));
    setTeamMembers((members) =>
      members.filter((member) => member.id !== removedMember.id),
    );
    setSelectedTeamMemberId(null);
    setMemberRemoveConfirm(false);
    setMemberRemoveAcknowledged(false);
    recordActivity({
      title: t("团队成员已移除：{name}", { name: removedMember.name }),
      detail: t("{email} 已失去当前工作区访问权限。", { email: removedMember.email }),
      icon: "settings",
      tone: "red",
      kind: "系统",
    });
    setNotice(t("{name} 已从工作区移除", { name: removedMember.name }));
  }

  function scrollWorkspaceTop() {
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  function scrollSettingsSectionIntoView(
    section: SettingsSectionId,
    behavior: ScrollBehavior = "smooth",
  ) {
    if (settingsSectionScrollTimerRef.current !== null) {
      window.clearTimeout(settingsSectionScrollTimerRef.current);
    }
    settingsSectionScrollTargetRef.current = section;
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const resolvedBehavior = reduceMotion ? "auto" : behavior;
        if (section === "overview") {
          window.scrollTo({ top: 0, behavior: resolvedBehavior });
        } else {
          document
            .getElementById(getSettingsSectionElementId(section))
            ?.scrollIntoView({
              behavior: resolvedBehavior,
              block: "start",
            });
        }
        // 上面的面板（智能体清单、用量）可能在滚动途中才读完数据、把这一节
        // 往下推；滚完再看一眼，差得多就再对一次，最多两次。
        const settle = (attempt: number) => {
          const element =
            section === "overview" ? null : document.getElementById(getSettingsSectionElementId(section));
          const before = element?.getBoundingClientRect().top;
          if (element && attempt < 2) {
            element.scrollIntoView({ behavior: "auto", block: "start" });
            const after = element.getBoundingClientRect().top;
            if (before !== undefined && Math.abs(after - before) > 4) {
              settingsSectionScrollTimerRef.current = window.setTimeout(() => settle(attempt + 1), 500);
              return;
            }
          }
          settingsSectionScrollTargetRef.current = null;
          settingsSectionScrollTimerRef.current = null;
          window.dispatchEvent(new Event("scroll"));
        };
        settingsSectionScrollTimerRef.current = window.setTimeout(
          () => settle(0),
          resolvedBehavior === "smooth" ? 650 : 0,
        );
      }),
    );
  }

  function openView(
    view: ViewId,
    options: {
      scrollToTop?: boolean;
      taskFilter?: TaskFilter;
      approvalFilter?: ApprovalRiskFilter;
      approvalId?: string;
      artifactId?: string;
      activityId?: string;
      activityFilter?: ActivityFilter;
      settingsSection?: SettingsSectionId;
    } = {},
  ) {
    const nextTaskFilter =
      view === "tasks" ? (options.taskFilter ?? "全部") : "全部";
    const nextApprovalFilter =
      view === "approvals" ? (options.approvalFilter ?? "全部") : "全部";
    const nextApprovalPool =
      nextApprovalFilter === "稍后" ? deferredApprovals : activeApprovals;
    const nextApproval =
      view === "approvals"
        ? (nextApprovalPool.find(
            (approval) =>
              approval.id === options.approvalId &&
              (nextApprovalFilter === "全部" ||
                nextApprovalFilter === "稍后" ||
                approval.risk === nextApprovalFilter),
          ) ??
          nextApprovalPool.find(
            (approval) =>
              nextApprovalFilter === "全部" ||
              nextApprovalFilter === "稍后" ||
              approval.risk === nextApprovalFilter,
          ) ??
          null)
        : null;
    const nextActivityFilter =
      view === "activity" ? (options.activityFilter ?? "全部") : "全部";
    const nextActivity =
      view === "activity"
        ? (activityLog.find(
            (activity) =>
              activity.id === options.activityId &&
              (nextActivityFilter === "全部" ||
                activity.kind === nextActivityFilter),
          ) ??
          activityLog.find(
            (activity) =>
              nextActivityFilter === "全部" ||
              activity.kind === nextActivityFilter,
          ) ??
          null)
        : null;
    const nextArtifact =
      view === "artifacts"
        ? (artifacts.find((artifact) => artifact.id === options.artifactId) ??
          artifacts[0] ??
          null)
        : null;
    const nextSettingsSection =
      view === "settings" ? (options.settingsSection ?? "overview") : "overview";
    setActiveView(view);
    if (view === "settings") {
      settingsSectionRef.current = nextSettingsSection;
      setSettingsSection(nextSettingsSection);
    }
    if (view === "tasks") {
      setTaskFilter(nextTaskFilter);
      setTaskListQuery("");
    }
    if (view !== "tasks") {
      setSelectedTaskIds([]);
      setBulkDeleteOpen(false);
    }
    if (view !== "approvals") {
      setSelectedApprovalIds([]);
      setBulkApprovalDecision(null);
      setApprovalRejectReason("");
      setApprovalRiskFilter("全部");
    } else {
      setApprovalRiskFilter(nextApprovalFilter);
      setApprovalListQuery("");
      setSelectedApprovalId(nextApproval?.id ?? "");
    }
    if (view === "activity") {
      setActivityTaskId(null);
      setActivityFilter(nextActivityFilter);
      setActivityListQuery("");
      setActivitySort("最新优先");
      setSelectedActivityId(nextActivity?.id ?? "");
    }
    if (view === "artifacts") {
      setArtifactTaskId(null);
      setArtifactFilter("全部");
      setArtifactListQuery("");
      setSelectedArtifactId(nextArtifact?.id ?? "");
    }
    setNotificationsOpen(false);
    setWorkspaceMenuOpen(false);
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    writeWorkspaceRoute(
      {
        view,
        taskId: null,
        runId: null,
        artifactId: view === "artifacts" ? (nextArtifact?.id ?? null) : null,
        approvalId: view === "approvals" ? (nextApproval?.id ?? null) : null,
        activityId: view === "activity" ? (nextActivity?.id ?? null) : null,
        activityTaskId: null,
        taskFilter: view === "tasks" ? nextTaskFilter : null,
        approvalFilter:
          view === "approvals" ? nextApprovalFilter : null,
        activityFilter:
          view === "activity" ? nextActivityFilter : null,
        settingsSection:
          view === "settings" ? nextSettingsSection : null,
      },
      "push",
    );
    if (view === "settings") {
      scrollSettingsSectionIntoView(nextSettingsSection);
    } else if (options.scrollToTop !== false) {
      scrollWorkspaceTop();
    }
  }

  function openTaskStatus(filter: TaskStatus) {
    setTaskSort("状态优先");
    setSelectedTaskIds([]);
    openView("tasks", { taskFilter: filter });
    setNotice(
      taskFilterCounts[filter] > 0
        ? t("正在查看 {value} 个{filter}任务", { value: taskFilterCounts[filter], filter: t(filter) })
        : t("当前没有{filter}任务", { filter: t(filter) }),
    );
  }

  function openApprovalQueue() {
    setSelectedApprovalIds([]);
    openView("approvals");
    setNotice(
      activeApprovalCount > 0
        ? t("正在查看 {activeApprovalCount} 项待确认操作", { activeApprovalCount })
        : t("当前没有待确认操作"),
    );
  }

  function chooseApprovalRiskFilter(filter: ApprovalRiskFilter) {
    const approvalPool = filter === "稍后" ? deferredApprovals : activeApprovals;
    const nextApproval =
      approvalPool.find(
        (approval) =>
          (filter === "全部" ||
            filter === "稍后" ||
            approval.risk === filter) &&
          approvalMatchesSearch(approval),
      ) ?? null;
    setApprovalRiskFilter(filter);
    setSelectedApprovalId(nextApproval?.id ?? "");
    setSelectedApprovalIds([]);
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId: nextApproval?.id ?? null,
        approvalFilter: filter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  async function copyCurrentViewLink(label: string) {
    const currentUrl = window.location.href;
    let copied = false;
    try {
      await window.navigator.clipboard.writeText(currentUrl);
      copied = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = currentUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        textarea.remove();
      }
    }
    setNotice(copied ? t("{label}已复制", { label }) : t("复制失败，请稍后重试"));
  }

  async function copyApprovalLink(approval: ApprovalItem) {
    const nextFilter = getApprovalFilterForSelection(
      approval,
      approvalRiskFilter,
    );
    writeWorkspaceRoute(
      {
        view: "approvals",
        taskId: null,
        runId: null,
        approvalId: approval.id,
        approvalFilter: nextFilter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    await copyCurrentViewLink(t("审批链接"));
  }

  function openSettingsSection(section: SettingsSectionId) {
    openView("settings", {
      scrollToTop: false,
      settingsSection: section,
    });
  }

  async function copySettingsSectionLink() {
    writeWorkspaceRoute(
      {
        view: "settings",
        taskId: null,
        runId: null,
        settingsSection,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
    const sectionLabel =
      visibleSettingsSections.find((section) => section.id === settingsSection)
        ?.label ?? t("当前");
    await copyCurrentViewLink(t("{sectionLabel}设置链接", { sectionLabel }));
  }

  function openWorkspaceSection(section: SettingsSectionId) {
    setWorkspaceMenuOpen(false);
    openSettingsSection(section);
  }

  function setOnboardingPreference(dismissed: boolean) {
    setOnboardingDismissed(dismissed);
    try {
      if (dismissed) {
        window.localStorage.setItem(onboardingPreferenceKey, "true");
      } else {
        window.localStorage.removeItem(onboardingPreferenceKey);
      }
    } catch {
      // The guide still works for the current session when storage is unavailable.
    }
  }

  function dismissOnboarding(completed = false) {
    setOnboardingPreference(true);
    setNotice(
      completed
        ? t("首次设置已完成，工作区可以开始正式使用")
        : t("首次设置已收起，可从工作区菜单重新打开"),
    );
  }

  function openOnboarding() {
    setWorkspaceMenuOpen(false);
    setOnboardingPreference(false);
    openView("home");
    window.setTimeout(() => {
      document
        .getElementById("workspace-onboarding")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  }

  function openTerminalFromPage() {
    openTerminal().catch((error: unknown) =>
      setNotice(t("没能打开终端：{error}", { error: error instanceof Error ? error.message : String(error) })),
    );
  }

  function runOnboardingStep(step: OnboardingStepId) {
    if (step === "agent") {
      openSettingsSection("agents");
      return;
    }
    if (step === "profile") {
      openWorkspaceProfile();
      return;
    }
    if (step === "connectors") {
      openSettingsSection("connectors");
      return;
    }
    if (step === "security") {
      openSettingsSection("security");
      return;
    }
    beginCreateTask();
  }

  function continueOnboarding() {
    if (nextOnboardingStep) {
      runOnboardingStep(nextOnboardingStep.id);
      return;
    }
    dismissOnboarding(true);
  }

  function openWorkspaceBudget() {
    openView("settings", {
      scrollToTop: false,
      settingsSection: "usage",
    });
    openUsageBudget();
  }

  function openWorkspaceInvite() {
    openView("settings", {
      scrollToTop: false,
      settingsSection: "team",
    });
    openTeamInvite();
  }

  function exportWorkspaceFromMenu() {
    setWorkspaceMenuOpen(false);
    exportWorkspace();
  }

  function openTask(taskId: string) {
    const parentTaskFilter =
      activeView === "tasks" ? taskFilter : "全部";
    setActiveView("tasks");
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setSelectedTaskId(taskId);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      {
        view: "tasks",
        taskId,
        runId: null,
        taskFilter: parentTaskFilter,
      },
      "push",
    );
  }

  function openTaskRun(taskId: string, runId: string) {
    setActiveView("tasks");
    setSelectedTaskId(null);
    setInspectedRunTaskId(taskId);
    setInspectedRunId(runId);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      { view: "tasks", taskId, runId, taskFilter },
      "push",
    );
  }

  function dismissRunDetail() {
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
  }

  function closeRunDetail() {
    const taskId = inspectedRunTaskId;
    if (canReturnToWorkspaceParent()) {
      window.history.back();
      return;
    }
    dismissRunDetail();
    if (taskId) {
      setActiveView("tasks");
      setSelectedTaskId(taskId);
      writeWorkspaceRoute(
        { view: "tasks", taskId, runId: null, taskFilter },
        "replace",
      );
    }
  }

  function closeTaskDetail() {
    if (canReturnToWorkspaceParent()) {
      window.history.back();
      return;
    }
    setSelectedTaskId(null);
    writeWorkspaceRoute(
      {
        view: activeView,
        taskId: null,
        runId: null,
        taskFilter: activeView === "tasks" ? taskFilter : null,
      },
      "replace",
    );
  }

  function chooseTaskFilter(filter: TaskFilter) {
    setTaskFilter(filter);
    writeWorkspaceRoute(
      {
        view: "tasks",
        taskId: null,
        runId: null,
        taskFilter: filter,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function openInspectedRunTask() {
    if (!inspectedRunTask) return;
    const taskId = inspectedRunTask.id;
    dismissRunDetail();
    openTask(taskId);
  }

  async function copyTaskRunId(run: TaskRun) {
    try {
      await window.navigator.clipboard.writeText(run.id);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = run.id;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setNotice(t("已复制运行 ID：{id}", { id: run.id }));
  }

  function downloadTaskRun(task: TaskItem, run: TaskRun) {
    const payload = {
      product: "Unzoo One",
      exportedAt: new Date().toISOString(),
      task: {
        id: task.id,
        title: task.title,
        target: task.target,
        schedule: formatTaskSchedule(task),
        requiresApproval: task.requiresApproval ?? true,
      },
      run,
      stages: getTaskRunStages(run),
      evidence: {
        externalActions:
          run.status === "失败" &&
          /AUTH|PERMISSION|ACCESS/.test(
            `${run.errorCode ?? ""} ${run.errorMessage ?? ""}`,
          )
            ? 0
            : null,
        artifactCount: inspectedRunArtifacts.length,
        artifacts: inspectedRunArtifacts.map((artifact) => ({
          id: artifact.id,
          title: artifact.title,
          filename: artifact.filename,
          version: artifact.version ?? 1,
        })),
        auditRecordCount: inspectedRunActivity.length,
        activity: inspectedRunActivity,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unzoo-one-run-${run.id.replace(/[^a-z0-9-]/gi, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    recordActivity({
      title: t("运行记录已导出：{title}", { title: task.title }),
      detail: `${run.id} · ${run.status} · ${formatTaskRunDuration(run.durationSeconds)}`,
      icon: "activity",
      tone: "blue",
      kind: "系统",
      taskId: task.id,
    });
    setNotice(t("运行记录已导出为 JSON"));
  }

  function pauseInspectedRun(task: TaskItem) {
    updateTaskStatus(task);
    dismissRunDetail();
    openTask(task.id);
  }

  function retryInspectedRun(task: TaskItem) {
    if (task.status === "运行中") {
      openInspectedRunTask();
      return;
    }
    retryTask(task);
    dismissRunDetail();
    openTask(task.id);
  }

  function openTaskActivity(taskId: string) {
    const taskActivities = activityLog.filter((item) => item.taskId === taskId);
    const nextActivity = taskActivities[0] ?? null;
    setActivityTaskId(taskId);
    setActivityFilter("全部");
    setActivityListQuery("");
    setActivitySort("最新优先");
    setSelectedActivityId(nextActivity?.id ?? "");
    setActiveView("activity");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      {
        view: "activity",
        taskId: null,
        runId: null,
        activityId: nextActivity?.id ?? null,
        activityTaskId: taskId,
        activityFilter: "全部",
      },
      "push",
    );
    scrollWorkspaceTop();
  }

  function openTaskArtifacts(taskId: string) {
    const taskArtifacts = artifacts.filter((artifact) => artifact.taskId === taskId);
    const nextArtifact = taskArtifacts[0] ?? null;
    setArtifactTaskId(taskId);
    setArtifactFilter("全部");
    setArtifactListQuery("");
    setArtifactSort("最近更新");
    setSelectedArtifactId(nextArtifact?.id ?? "");
    setActiveView("artifacts");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: nextArtifact?.id ?? null,
      },
      "push",
    );
    scrollWorkspaceTop();
  }

  function openArtifact(
    artifactId: string,
    options: { taskId?: string; scrollToTop?: boolean } = {},
  ) {
    const artifact = artifacts.find((item) => item.id === artifactId);
    if (!artifact) {
      openView("artifacts");
      setNotice(t("该成果已不存在，已打开成果列表"));
      return;
    }
    setArtifactTaskId(options.taskId ?? null);
    setArtifactFilter("全部");
    setArtifactListQuery("");
    setArtifactSort("最近更新");
    setSelectedArtifactId(artifact.id);
    setActiveView("artifacts");
    setSelectedTaskId(null);
    setInspectedRunTaskId(null);
    setInspectedRunId(null);
    setNotificationsOpen(false);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: artifact.id,
      },
      "push",
    );
    if (options.scrollToTop !== false) {
      scrollWorkspaceTop();
    }
  }

  function selectArtifact(artifactId: string) {
    if (!artifacts.some((artifact) => artifact.id === artifactId)) return;
    setSelectedArtifactId(artifactId);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function chooseArtifactFilter(filter: ArtifactFilter) {
    const nextArtifact =
      filter === "全部"
        ? scopedArtifacts[0]
        : filter === "重点"
          ? scopedArtifacts.find((artifact) => artifact.starred)
          : scopedArtifacts.find((artifact) => artifact.type === filter);
    setArtifactFilter(filter);
    const nextArtifactId = nextArtifact?.id ?? "";
    setSelectedArtifactId(nextArtifactId);
    writeWorkspaceRoute(
      {
        view: "artifacts",
        taskId: null,
        runId: null,
        artifactId: nextArtifactId || null,
      },
      "replace",
      canReturnToWorkspaceParent(),
    );
  }

  function chooseSearchResult(result: SearchResult) {
    setSearchOpen(false);
    setQuery("");
    setActiveSearchIndex(0);
    setRecentSearchKeys((keys) => [
      result.key,
      ...keys.filter((key) => key !== result.key),
    ].slice(0, 4));

    if (result.kind === "task") {
      openTask(result.id);
    } else if (result.kind === "artifact") {
      openArtifact(result.id);
    } else if (result.kind === "view") {
      openView(result.id as ViewId);
    } else if (result.id === "new-task") {
      beginCreateTask();
    } else if (result.id === "artifacts") {
      openView("artifacts");
    } else {
      openView("approvals");
    }

    window.requestAnimationFrame(() => searchInputRef.current?.blur());
  }

  function clearRecentSearches() {
    setRecentSearchKeys([]);
    setActiveSearchIndex(0);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function markNotificationRead(notificationId: string) {
    setReadNotificationIds((ids) =>
      ids.includes(notificationId)
        ? ids
        : [notificationId, ...ids].slice(0, 30),
    );
  }

  function markAllNotificationsRead() {
    setReadNotificationIds((ids) =>
      Array.from(
        new Set([...notificationItems.map((item) => item.id), ...ids]),
      ).slice(0, 30),
    );
    setNotice(t("全部通知已标记为已读"));
  }

  function closeNotifications() {
    setNotificationsOpen(false);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => notificationButtonRef.current?.focus()),
    );
  }

  function closeWorkspaceMenu() {
    setWorkspaceMenuOpen(false);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => workspaceMenuButtonRef.current?.focus()),
    );
  }

  function requireOnline(message: string) {
    if (isOnline) return true;
    setNotice(message);
    return false;
  }

  function requireBudgetCapacity(actionLabel: string) {
    if (!usageSettings.pauseAtLimit || !budgetExceeded) return true;
    recordActivity({
      title: t("预算保护已阻止任务运行"),
      detail: t("{actionLabel}未执行：本月已使用 {usedCredits} / {monthlyBudget} 点。调整额度后即可继续。", { actionLabel, usedCredits, monthlyBudget: usageSettings.monthlyBudget }),
      icon: "shield",
      tone: "amber",
      kind: "系统",
    });
    setNotice(t("月度额度已用完，已阻止{actionLabel}；请先调整预算", { actionLabel }));
    return false;
  }

  async function checkNetworkConnection() {
    if (isCheckingNetwork) return;
    setIsCheckingNetwork(true);
    try {
      if (!window.navigator.onLine) {
        setNotice(t("设备仍处于离线状态，本机数据不会受到影响"));
        return;
      }

      const response = await window.fetch(
        `/unzoo-one-mark-v6.png?network-check=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Network check failed");
      }
      setNotice(t("网络连接正常，在线能力可以继续使用"));
    } catch {
      setNotice(t("暂时无法连接在线服务，本机数据仍可正常查看"));
    } finally {
      setIsCheckingNetwork(false);
    }
  }

  function openNotification(item: NotificationItem) {
    markNotificationRead(item.id);
    setNotificationsOpen(false);

    if (item.target === "approvals") {
      openView("approvals", { approvalId: item.targetId });
    } else if (item.target === "activity") {
      if (item.targetId) {
        openActivityEvent(item.targetId);
      } else {
        openView("activity");
      }
    } else if (item.target === "artifact") {
      if (item.targetId) {
        openArtifact(item.targetId);
      } else {
        openView("artifacts");
      }
    } else {
      if (item.targetId) {
        openTask(item.targetId);
      } else {
        openView("tasks");
      }
    }
  }

  function clearSearch() {
    setQuery("");
    setActiveSearchIndex(0);
    setSearchOpen(true);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveSearchIndex((current) =>
        searchResults.length ? (current + 1) % searchResults.length : 0,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveSearchIndex((current) =>
        searchResults.length
          ? (current - 1 + searchResults.length) % searchResults.length
          : 0,
      );
    }

    if (event.key === "Enter" && searchOpen && searchResults[activeSearchIndex]) {
      event.preventDefault();
      chooseSearchResult(searchResults[activeSearchIndex]);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  }

  /**
   * 把一次运行真的交给 brain。
   *
   * 界面已经乐观地把任务标成运行中了，这里做的是让那个状态名副其实：
   * 起一个会话，按游标把事件读回来，写进这次运行的摘要和运行记录，
   * 结束时按真实结果收尾。
   *
   * 会话是托管的（设置里开了受管就是受管）：agent 每次要用工具都先停下来，
   * 请求进收件箱等人批。所以这里没有固定的轮数上限——等人批准的时间不算
   * agent 卡住，只在长时间既没有新事件、也没有待批的审批时才放弃。
   *
   * continueFrom：接着那次运行的会话原来的对话说 prompt 这句话。
   *
   * 本机没有 unterm 时 provider 会落回演示实现，事件的形状一样，所以
   * 这段代码不需要区分两种情况。
   */
  async function driveBrainRun(
    task: TaskItem,
    runId: string,
    continueFrom?: { sessionId: string; prompt: string },
  ) {
    if (runtimeMode) {
      await runOnRuntime(task, runId, continueFrom);
      return;
    }
    const stepId = `${runId}-step-1`;
    const startedAtMs = Date.now();
    const prompt = continueFrom?.prompt ?? promptOf(task);

    const patchRun = (patch: Partial<TaskRun>) => {
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id
            ? {
                ...item,
                runs: (item.runs ?? []).map((run) =>
                  run.id === runId ? { ...run, ...patch } : run,
                ),
              }
            : item,
        ),
      );
    };

    const runSettings = readAgentRunSettings();
    const agent = runSettings.agent;
    let session: Awaited<ReturnType<typeof workspaceProvider.brain.start>>;
    try {
      session = continueFrom
        ? await workspaceProvider.brain.resume({
            sessionId: continueFrom.sessionId,
            prompt,
            taskId: task.id,
            runId,
            stepId,
          })
        : await workspaceProvider.brain.start({
            agent,
            prompt,
            taskId: task.id,
            runId,
            stepId,
            mode: brainModeFor(agent, runSettings),
            cwd: runSettings.cwd || undefined,
          });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      const what = continueFrom ? t("没能接上原来的对话") : t("没能启动 brain");
      patchRun({ status: "失败", summary: t("{what}：{detail}", { what: t(what), detail }), errorMessage: detail });
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id
            ? { ...item, status: "失败", lastError: detail, updated: t("刚刚失败") }
            : item,
        ),
      );
      return;
    }
    patchRun({ sessionId: session.sessionId });

    recordActivity({
      title: continueFrom
        ? t("已接着原来的对话：{title}", { title: task.title })
        : t("已交给 {adapter}：{title}", { adapter: session.adapter, title: task.title }),
      detail: continueFrom
        ? t("会话 {sessionId} 接着 {sessionId2} 的对话继续。", { sessionId: session.sessionId, sessionId2: continueFrom.sessionId })
        : t("会话 {sessionId} 开始运行{value}。", { sessionId: session.sessionId, value: t(session.hosted ? t("，每次使用工具前都会先进收件箱等你确认") : "") }),
      icon: "brain",
      tone: "blue",
      kind: "任务",
      taskId: task.id,
    });

    await followBrainSession(task, runId, session, startedAtMs);
  }

  /**
   * 跟着一个已经起来的会话，直到这一轮结束，再按结果给运行记录收尾。
   *
   * 和 driveBrainRun 分开，是因为页面会刷新：刷新后正在跑的运行要重新接上
   * （reattachBrainRuns），否则会话早就跑完了，运行记录还一直停在"运行中"。
   * 事件从游标 0 重放，所以重新接上的和一直跟着的结果一样。
   */
  async function followBrainSession(
    task: TaskItem,
    runId: string,
    session: { sessionId: string; adapter: string },
    startedAtMs: number,
  ) {
    const patchRun = (patch: Partial<TaskRun>) => {
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id
            ? {
                ...item,
                runs: (item.runs ?? []).map((run) =>
                  run.id === runId ? { ...run, ...patch } : run,
                ),
              }
            : item,
        ),
      );
    };

    // 轮询而不是长连接：unterm 的事件接口本来就是游标式的，而且断了能续。
    // 闲置上限挡住 brain 卡死的情况；等人批准的时候不算闲置。
    const idleLimitMs = 10 * 60 * 1000;
    let lastProgress = Date.now();
    let cursor = 0;
    let assistantText = "";
    let failure: string | null = null;
    let endedState: string | null = null;

    for (;;) {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      let events: BrainEvent[] = [];
      try {
        const batch = await workspaceProvider.brain.events(session.sessionId, cursor);
        cursor = batch.cursor;
        events = batch.events;
      } catch (error: unknown) {
        // 会话已经不在内存里了（关掉了，或 unterm 重启过）：unterm 的任务库
        // 里还记着它怎么结束的，按那个收尾；连这个也没有才算失败。
        const ended = await workspaceProvider.brain
          .status(session.sessionId)
          .catch(() => null);
        if (ended && ended.state !== "running") {
          endedState = ended.state;
        } else {
          failure = error instanceof Error ? error.message : String(error);
        }
      }
      if (events.length > 0) lastProgress = Date.now();

      for (const item of events) {
        if (item.event === "turn.started" && item.model) {
          patchRun({ summary: t("{adapter} · {model} 正在处理", { adapter: session.adapter, model: item.model }) });
        } else if (
          item.event === "output.delta" &&
          item.message &&
          item.stream !== "reasoning"
        ) {
          // output.delta 是增量：拼起来才是它说的话。
          assistantText += item.message;
          patchRun({ summary: assistantText.slice(-120) });
        } else if (item.event === "approval.requested") {
          patchRun({ summary: t("等你在收件箱确认一次工具调用") });
        } else if (item.event === "error" && item.message) {
          failure = item.message;
        }
      }

      let state = "running";
      let usage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 };
      if (failure || endedState) {
        state = endedState === "exited" ? "finished" : (endedState ?? "failed");
      } else try {
        const status = await workspaceProvider.brain.status(session.sessionId);
        state = status.state;
        usage = status.usage;
        if ((status.pendingApprovals ?? 0) > 0) lastProgress = Date.now();
      } catch {
        // 状态读不到就继续读事件，下一轮再问。
      }

      // 托管会话一轮结束后进程还在等下一句，状态一直是 running：
      // 这一轮完没完看 turn.completed。
      const turn = turnOutcome(events);
      if (turn.done) state = turn.state ?? "finished";
      if (state === "running") {
        if (Date.now() - lastProgress <= idleLimitMs) continue;
        failure = "智能体十分钟没有任何进展，已停止等待";
        try {
          await workspaceProvider.brain.interrupt(session.sessionId);
        } catch {
          // 停不掉也照样收尾，close 会再处理一次。
        }
        state = "failed";
      }

      const ok = state === "finished" && !failure;
      const stopped = state === "interrupted" && !failure;
      const spent = usage.inputTokens + usage.outputTokens;
      const outcome = ok
        ? assistantText.trim().slice(-120) ||
          (endedState ? t("运行已结束（结果在页面关闭期间产生）") : t("运行完成"))
        : stopped
          ? t("这一轮已停止（你拒绝了一次工具调用，或者暂停了任务）")
          : (failure ?? t("运行失败"));
      patchRun({
        status: ok ? "成功" : stopped ? "已取消" : "失败",
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAtMs) / 1000)),
        summary: outcome,
        errorMessage: ok || stopped ? undefined : (failure ?? undefined),
      });
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: ok ? "已完成" : stopped ? "已暂停" : "失败",
                progress: ok ? 100 : item.progress,
                updated: ok ? t("刚刚完成") : stopped ? t("刚刚停止") : t("刚刚失败"),
                lastError: ok || stopped ? undefined : (failure ?? undefined),
              }
            : item,
        ),
      );
      recordActivity({
        title: ok
          ? t("任务已完成：{title}", { title: task.title })
          : stopped
            ? t("任务已停止：{title}", { title: task.title })
            : t("任务失败：{title}", { title: task.title }),
        detail: ok ? t("{adapter} 用了 {spent} 个 token。", { adapter: session.adapter, spent }) : outcome,
        icon: ok ? "sparkles" : "shield",
        tone: ok ? "green" : stopped ? "blue" : "red",
        kind: "任务",
        taskId: task.id,
      });
      break;
    }

    try {
      // 关掉进程；对话本身留在 CLI 那边，之后"继续对话"能接回来。
      await workspaceProvider.brain.close(session.sessionId);
    } catch {
      // 关不掉不影响界面，会话那头有自己的收尾。
    }
  }

  /**
   * 页面打开时，把还在"运行中"、又有会话的运行重新接上。
   * 只在 unterm 托管的控制台里有意义：演示会话不跨页面。
   */
  const reattachedBrainRuns = useRef(false);
  useEffect(() => {
    if (!tasksReady || reattachedBrainRuns.current) return;
    reattachedBrainRuns.current = true;
    void (async () => {
      if (await workspaceProvider.runtime.available()) {
        await adoptRuntime();
        return;
      }
      setRuntimeMode(false);
      reattachLocalRuns();
    })();
    // 只在任务读好后跑一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksReady]);

  /**
   * 换成运行时里的任务。演示用的任务、审批、成果不再出现：装好的产品从空
   * 白开始。运行时里还一个任务都没有、页面上却有用户自己建的，就是从只存
   * 在浏览器里的旧版升级上来的，把它们搬过去。
   */
  async function adoptRuntime() {
    let remote = [] as Awaited<ReturnType<typeof workspaceProvider.runtime.list>>;
    try {
      remote = await workspaceProvider.runtime.list();
    } catch (error) {
      setNotice(t("读不到本机运行时里的任务：{value}", { value: error instanceof Error ? error.message : String(error) }));
      setRuntimeMode(false);
      reattachLocalRuns();
      return;
    }
    const demoTaskIds = new Set(workspaceDefaults.tasks.map((task) => task.id));
    const mine = tasks.filter((task) => !demoTaskIds.has(task.id));
    if (remote.length === 0 && mine.length > 0) {
      for (const task of mine) {
        try {
          await workspaceProvider.runtime.put(toRuntimePut(task));
          runtimeSent.current.set(task.id, putSignature(task));
        } catch {
          // 留给镜像下一次再推。
        }
      }
      remote = await workspaceProvider.runtime.list().catch(() => remote);
    }
    // 搬家失败（运行时里还是空的）就先用页面上的，镜像会接着推。
    const merged = remote.length ? mergeRuntimeTasks([], remote) : mine;
    for (const task of merged) runtimeSent.current.set(task.id, putSignature(task));
    setTasks(merged);
    const outputs = runtimeArtifacts(remote);
    setRuntimeSnapshot(remote);
    const demoApprovalIds = new Set(workspaceDefaults.approvals.map((item) => item.id));
    setApprovals((items) => items.filter((item) => !demoApprovalIds.has(item.id)));
    const demoArtifactIds = new Set(workspaceDefaults.artifacts.map((item) => item.id));
    setArtifacts((items) =>
      mergeRuntimeArtifacts(
        items.filter((item) => !demoArtifactIds.has(item.id)),
        outputs,
      ),
    );
    const demoActivityIds = new Set(workspaceDefaults.activity.map((item) => item.id));
    setActivityLog((items) => items.filter((item) => !demoActivityIds.has(item.id)));
    setIsRunning(false);
    setRuntimeMode(true);
  }

  /** 交给运行时跑：先把任务最新的样子推过去，再让它起一次运行。 */
  async function runOnRuntime(
    task: TaskItem,
    runId: string,
    continueFrom?: { sessionId: string; prompt: string },
    options: { prompt?: string; followUp?: boolean; saveSkill?: boolean } = {},
  ): Promise<string | null> {
    try {
      const current = tasks.find((item) => item.id === task.id) ?? task;
      await workspaceProvider.runtime.put(toRuntimePut(current));
      runtimeSent.current.set(task.id, putSignature(current));
      await workspaceProvider.runtime.run({
        taskId: task.id,
        runId,
        prompt: continueFrom?.prompt ?? options.prompt,
        continueFrom: continueFrom?.sessionId,
        followUp: options.followUp,
        saveSkill: options.saveSkill,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: "失败",
                lastError: message,
                runs: (item.runs ?? []).map((run) =>
                  run.id === runId
                    ? { ...run, status: "失败", summary: message, errorMessage: message }
                    : run,
                ),
              }
            : item,
        ),
      );
      setNotice(t("任务没能开始：{message}", { message }));
      void refreshFromRuntime();
      return message;
    }
    void refreshFromRuntime();
    return null;
  }

  // ---- 对话（装好的产品的首页）------------------------------------------

  /** 说一句话就开一段对话：建任务、立刻交给智能体。 */
  async function startConversation(request: string): Promise<string | null> {
    const now = Date.now();
    const runId = `run-${now}`;
    const newTask: TaskItem = {
      id: `task-${now}`,
      title: titleFromRequest(request),
      description: request,
      target: "",
      status: "运行中",
      progress: 3,
      updated: t("刚刚创建"),
      schedule: "仅运行一次",
      requiresApproval: true,
      retryCount: 0,
      runs: [{ id: runId, status: "运行中", startedAt: new Date(now).toISOString(), summary: "" }],
    };
    setTasks((items) => [newTask, ...items]);
    setConversationId(newTask.id);
    await runOnRuntime(newTask, runId);
    return newTask.id;
  }

  /** 接着一段对话说：同一个智能体会话续接，它记得前面说过和做过的。 */
  async function sendConversationFollowUp(taskId: string, text: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error(t("这个任务已经不在了"));
    const now = Date.now();
    const runId = `run-${now}`;
    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: "运行中",
              runs: [
                { id: runId, status: "运行中", startedAt: new Date(now).toISOString(), summary: "" },
                ...(item.runs ?? []),
              ],
            }
          : item,
      ),
    );
    const failed = await runOnRuntime(task, runId, undefined, { prompt: text, followUp: true });
    if (failed) throw new Error(failed);
  }

  async function stopConversation(taskId: string) {
    try {
      await workspaceProvider.runtime.stop(taskId);
    } catch (error) {
      setNotice(t("没能停下：{message}", { message: error instanceof Error ? error.message : String(error) }));
    }
    void refreshFromRuntime();
  }

  function renameConversation(taskId: string, title: string) {
    setTasks((items) => items.map((item) => (item.id === taskId ? { ...item, title } : item)));
  }

  function deleteConversation(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    setTasks((items) => items.filter((item) => item.id !== taskId));
    setConversationId(null);
    if (task) setNotice(t("已删除任务“{title}”", { title: task.title }));
  }

  async function scheduleConversation(taskId: string, plan: ConversationPlan) {
    const { schedule, time, day, every, at, watch, helperAgent, keepConversation, secret } = plan;
    // 密码、日历地址先单独存进系统凭据库，不进任务（任务会存在浏览器里）。
    if (secret && (watch?.kind === "mail" || watch?.kind === "calendar")) {
      try {
        await workspaceProvider.runtime.setWatchSecret(taskId, secret, watch.kind);
      } catch (error) {
        setNotice(t("没能保存：{message}", { message: error instanceof Error ? error.message : String(error) }));
        return;
      }
    }
    const timed = schedule === "每天" || schedule === "工作日" || schedule === "每周";
    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              schedule,
              scheduleTime: timed ? time : undefined,
              scheduleDay: schedule === "每周" ? day : undefined,
              scheduleEvery: schedule === "每隔" ? every : undefined,
              scheduleAt: schedule === "定时一次" ? at : undefined,
              watch: watch ?? undefined,
              helperAgent: helperAgent || undefined,
              keepConversation: keepConversation || undefined,
              watchError: watch ? item.watchError : undefined,
              watchHasSecret: secret ? true : watch?.kind === item.watch?.kind ? item.watchHasSecret : undefined,
            }
          : item,
      ),
    );
    const parts = [
      schedule === "仅运行一次" ? "" : formatSchedule(schedule, time, day, every, at),
      watch?.kind === "web"
        ? t("网页变化时")
        : watch?.kind === "folder"
          ? t("有新文件时")
          : watch?.kind === "mail"
            ? t("收到新邮件时")
            : watch?.kind === "calendar"
              ? t("日程开始前")
              : "",
    ].filter(Boolean);
    setNotice(parts.length ? t("已设为{schedule}自动运行", { schedule: parts.join(" · ") }) : t("不再重复运行"));
  }

  function openConversationOutput(taskId: string, path: string) {
    openArtifact(outputArtifactId(taskId, path));
  }

  /**
   * 在 Unzoo One 终端里接手智能体的终端。智能体开的会话住在后台服务里，
   * 终端窗口打开时会把没人管的会话收下；窗口还没开（桌面版）就先开一扇，
   * 再把这个会话切到前台。
   */
  /** 让智能体把这段对话做过的事写成技能：在同一段对话里多跑一轮。 */
  async function saveConversationAsSkill(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const now = Date.now();
    const runId = `run-${now}`;
    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: "运行中",
              runs: [
                { id: runId, status: "运行中", startedAt: new Date(now).toISOString(), summary: "" },
                ...(item.runs ?? []),
              ],
            }
          : item,
      ),
    );
    const failed = await runOnRuntime(task, runId, undefined, { saveSkill: true });
    if (!failed) setNotice(t("正在把“{title}”存为技能", { title: task.title }));
  }

  async function openAgentTerminal(sessionId: string) {
    try {
      await workspaceProvider.runtime.focusTerminal(sessionId);
      return;
    } catch (error) {
      if (!desktopApp) {
        throw new Error(
          t("先打开 Unzoo One 的终端窗口，再点一次。({message})", {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }
    await openTerminal();
    let last: unknown = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      try {
        await workspaceProvider.runtime.focusTerminal(sessionId);
        return;
      } catch (error) {
        last = error;
      }
    }
    throw last instanceof Error ? last : new Error(String(last));
  }

  async function decideInConversation(sessionId: string, requestId: string, decision: ApprovalDecision) {
    await workspaceProvider.approvals.decide(agentApprovalId(sessionId, requestId), decision);
  }

  const loadConversationThread = useMemo(
    () => (taskId: string) => workspaceProvider.runtime.thread(taskId),
    [],
  );

  /**
   * 智能体没准备好时，新对话页上的一张卡片。不再有单独的引导：装好又登录了
   * 就直接用；没有才在这里说清楚差哪一步。
   */
  const conversationAgent = runtimeAgents?.find((agent) => agent.id === runtimeAgentId) ?? null;
  const usableAgent = runtimeAgents?.find((agent) => agent.installed && agent.signedIn !== false) ?? null;
  const conversationNotice =
    runtimeAgents === null ? null : !conversationAgent?.installed && !usableAgent ? (
      <div className="conversation-ready" role="status">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          <strong>{t("这台电脑上还没有可用的智能体")}</strong>
          <small>{t("Unzoo One 让智能体替你干活，需要先装一个，比如 Claude Code 或 Codex。装好后点“重新检查”。")}</small>
        </span>
        <span className="conversation-ready-actions">
          <button type="button" onClick={() => openSettingsSection("agents")}>
            {t("查看智能体")}
          </button>
          <button type="button" onClick={() => void checkRuntimeCapabilities(true)} disabled={runtimeChecking}>
            <RefreshCw size={14} aria-hidden="true" className={runtimeChecking ? "is-spinning" : undefined} />
            {t("重新检查")}
          </button>
        </span>
      </div>
    ) : conversationAgent && conversationAgent.installed && conversationAgent.signedIn === false ? (
      <div className="conversation-ready" role="status">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          <strong>{t("先登录 {name}", { name: conversationAgent.name })}</strong>
          <small>
            {conversationAgent.signInCommand
              ? t("在终端里运行下面的命令，按提示用浏览器登录，再回来点“重新检查”。")
              : t("按 {name} 自己的说明登录，再回来点“重新检查”。", { name: conversationAgent.name })}
          </small>
          {conversationAgent.signInCommand && <code>{conversationAgent.signInCommand}</code>}
        </span>
        <span className="conversation-ready-actions">
          {desktopApp && (
            <button type="button" onClick={openTerminalFromPage}>
              <SquareTerminal size={14} aria-hidden="true" />
              {t("打开终端")}
            </button>
          )}
          <button type="button" onClick={() => void checkRuntimeCapabilities(true)} disabled={runtimeChecking}>
            <RefreshCw size={14} aria-hidden="true" className={runtimeChecking ? "is-spinning" : undefined} />
            {t("重新检查")}
          </button>
        </span>
      </div>
    ) : runtimeBrowser?.reachable && !runtimeBrowser.ready ? (
      <div className="conversation-ready" role="status">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          <strong>{t("智能体还没有浏览器身份")}</strong>
          <small>
            {runtimeBrowser.chosenMissing
              ? t("设置里指定的浏览器身份已经不在了。换一个，智能体才能打开网页。")
              : t("Unzoo {plan} 版的 {max} 个身份已经用满，建不了智能体的专用身份。可以选一个现有身份给它用（它会用里面已登录的账号），或者升级 Unzoo。不用浏览器的事照样能做。", {
                  plan: runtimeBrowser.plan ?? "",
                  max: runtimeBrowser.maxProfiles ?? runtimeBrowser.profiles.length,
                })}
          </small>
        </span>
        <span className="conversation-ready-actions">
          <button type="button" onClick={() => openSettingsSection("agents")}>
            {t("选一个身份")}
          </button>
          <a className="conversation-ready-link" href="https://unzoo.ai/#pricing" target="_blank" rel="noreferrer">
            {t("升级 Unzoo")}
          </a>
        </span>
      </div>
    ) : null;

  // 别处（收件箱、成果、通知）打开某个任务时，装好的产品里打开的是那段对话。
  useEffect(() => {
    if (!runtimeMode) return;
    if (activeView === "tasks" || activeView === "activity") {
      if (selectedTaskId) setConversationId(selectedTaskId);
      setSelectedTaskId(null);
      setActiveView("home");
    }
  }, [runtimeMode, activeView, selectedTaskId]);

  async function refreshFromRuntime() {
    try {
      const remote = await workspaceProvider.runtime.list();
      setTasks((items) =>
        mergeRuntimeTasks(items, remote, Date.now(), runtimeRemoved.current),
      );
      const outputs = runtimeArtifacts(remote);
      setRuntimeSnapshot(remote);
      setArtifacts((items) => mergeRuntimeArtifacts(items, outputs));
    } catch {
      // 下一轮再试。
    }
  }

  // 页面上对任务的改动推给运行时：只推变了的，删掉的也删掉。
  useEffect(() => {
    if (!runtimeMode) return;
    const present = new Set(tasks.map((task) => task.id));
    for (const task of tasks) {
      const signature = putSignature(task);
      if (runtimeSent.current.get(task.id) === signature) continue;
      runtimeSent.current.set(task.id, signature);
      workspaceProvider.runtime.put(toRuntimePut(task)).catch((error: unknown) => {
        runtimeSent.current.delete(task.id);
        setNotice(t("任务没有保存到本机运行时：{value}", { value: error instanceof Error ? error.message : String(error) }));
      });
    }
    for (const id of [...runtimeSent.current.keys()]) {
      if (present.has(id)) continue;
      runtimeSent.current.delete(id);
      runtimeRemoved.current.add(id);
      workspaceProvider.runtime
        .remove(id)
        .catch(() => {
          // 已经不在了也算删掉。
        })
        .finally(() => runtimeRemoved.current.delete(id));
    }
  }, [runtimeMode, tasks]);

  // 回到首页时重新看一眼智能体：可能刚在设置里换了，或者刚在终端里登录。
  async function checkRuntimeCapabilities(refresh = false) {
    setRuntimeChecking(true);
    const [capabilities, agents] = await Promise.all([
      workspaceProvider.runtime.capabilities().then(
        (value) => {
          setRuntimeCapabilitiesError(null);
          return value;
        },
        (error: unknown) => {
          setRuntimeCapabilitiesError(error instanceof Error ? error.message : String(error));
          return null;
        },
      ),
      workspaceProvider.brain.agents(refresh ? { refresh: true } : undefined).catch(() => [] as BrainAgent[]),
    ]);
    if (capabilities) setRuntimeCapabilities(capabilities);
    setRuntimeAgents(agents.filter((agent) => agent.hosted));
    setRuntimeChecking(false);
  }
  useEffect(() => {
    if (runtimeMode && activeView === "settings") void checkRuntimeCapabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeMode, activeView]);

  useEffect(() => {
    if (!runtimeMode || activeView !== "home") return;
    let live = true;
    void Promise.all([
      workspaceProvider.brain.agents().catch(() => [] as BrainAgent[]),
      workspaceProvider.runtime.settings().catch(() => null),
      workspaceProvider.runtime.browser().catch(() => null),
    ]).then(([agents, runSettings, browser]) => {
      if (!live) return;
      if (agents) setRuntimeAgents(agents.filter((agent) => agent.hosted));
      if (runSettings) setRuntimeAgentId(runSettings.agent);
      setRuntimeBrowser(browser);
    });
    return () => {
      live = false;
    };
  }, [runtimeMode, activeView]);

  // 运行记录和任务状态从运行时读回来：有任务在跑时两秒一次，平时十五秒，
  // 定时任务自己跑起来了也能看见。
  const tasksRunning = anyRunning(tasks);
  useEffect(() => {
    if (!runtimeMode) return;
    const timer = window.setInterval(() => void refreshFromRuntime(), tasksRunning ? 2_000 : 15_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeMode, tasksRunning]);

  /** 没有运行时（演示版）：把还在"运行中"、又有会话的运行重新接上。 */
  function reattachLocalRuns() {
    for (const task of tasks) {
      for (const run of task.runs ?? []) {
        if (run.status !== "运行中" || !run.sessionId?.startsWith("ags_")) continue;
        const startedAtMs = Date.parse(run.startedAt) || Date.now();
        void followBrainSession(
          task,
          run.id,
          { sessionId: run.sessionId, adapter: t("智能体") },
          startedAtMs,
        );
      }
    }
  }

  /** 接着这次运行原来的对话，再说一句：作为一次新的运行记下来。 */
  function continueRunConversation(task: TaskItem, run: TaskRun, prompt: string) {
    const text = prompt.trim();
    const sessionId = run.sessionId;
    if (!sessionId || !text) return false;
    if (!requireOnline(t("设备离线，暂时不能继续“{title}”的对话", { title: task.title }))) return false;
    if (!requireBudgetCapacity(t("继续任务“{title}”的对话", { title: task.title }))) return false;
    const nextRun: TaskRun = {
      id: `run-${task.id}-${Date.now()}`,
      status: "运行中",
      startedAt: new Date().toISOString(),
      summary: t("接着上次的对话：{slice}", { slice: text.slice(0, 80) }),
    };
    setTasks((items) =>
      items.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: "运行中",
              updated: t("刚刚继续"),
              lastError: undefined,
              errorCode: undefined,
              runs: [nextRun, ...(item.runs ?? [])].slice(0, 12),
            }
          : item,
      ),
    );
    void driveBrainRun(task, nextRun.id, { sessionId, prompt: text });
    return true;
  }

  function retryTask(task: TaskItem) {
    if (
      !requireOnline(
        t("设备离线，任务“{title}”仍保持停止；恢复网络后可以重试", { title: task.title }),
      )
    ) {
      return;
    }
    if (!requireBudgetCapacity(t("重试任务“{title}”", { title: task.title }))) return;
    const now = new Date();
    const nextRun: TaskRun = {
      id: `run-${task.id}-${now.getTime()}`,
      status: "运行中",
      startedAt: now.toISOString(),
      summary: t("重试已启动，正在重新验证连接器授权和任务依赖。"),
    };

    setTasks((items) =>
      items.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: "运行中",
              progress: Math.max(3, Math.min(item.progress, 12)),
              updated: t("刚刚重试"),
              lastError: undefined,
              errorCode: undefined,
              retryCount: (item.retryCount ?? 0) + 1,
              runs: [nextRun, ...(item.runs ?? [])].slice(0, 12),
            }
          : item,
      ),
    );
    if (task.id === "competitor") setIsRunning(true);
    void driveBrainRun(task, nextRun.id);
    recordActivity({
      title: t("任务已重新运行：{title}", { title: task.title }),
      detail: t("重试 #{value} 已启动；系统会先验证连接器授权，再从安全检查点继续。", { value: (task.retryCount ?? 0) + 1 }),
      icon: "activity",
      tone: "blue",
      kind: "任务",
      taskId: task.id,
    });
    setNotice(t("任务“{title}”已重新运行", { title: task.title }));
  }

  function openTaskRecoverySettings() {
    openView("settings");
    setSelectedConnectorId("mail");
  }

  function updateTaskStatus(task: TaskItem) {
    if (task.status === "待确认") {
      setSelectedTaskId(null);
      openView("approvals");
      return;
    }

    if (task.status === "失败") {
      retryTask(task);
      return;
    }

    const willStart = task.status !== "运行中";
    if (
      willStart &&
      !requireOnline(
        t("设备离线，任务“{title}”仍保持暂停；恢复网络后可以继续", { title: task.title }),
      )
    ) {
      return;
    }
    if (
      willStart &&
      !requireBudgetCapacity(t("继续任务“{title}”", { title: task.title }))
    ) {
      return;
    }

    const nextStatus: TaskStatus =
      task.status === "运行中" ? "已暂停" : "运行中";
    // 暂停一个真在跑的 agent：停掉它这一轮，别让它在"已暂停"的任务里继续干活。
    if (task.status === "运行中" && runtimeMode) {
      workspaceProvider.runtime.stop(task.id).catch((error: unknown) => {
        setNotice(t("没能停下智能体：{value}", { value: error instanceof Error ? error.message : String(error) }));
      });
    } else if (task.status === "运行中") {
      const current = tasks.find((item) => item.id === task.id) ?? task;
      const live = current.runs?.find(
        (run) => run.status === "运行中" && run.sessionId,
      );
      if (live?.sessionId) {
        workspaceProvider.brain.interrupt(live.sessionId).catch(() => {
          // 会话可能刚好自己结束了；driveBrainRun 那边会照常收尾。
        });
      }
    }
    const nextProgress =
      task.status === "已完成" ? Math.max(3, Math.min(task.progress, 12)) : task.progress;
    const nextRunId = `run-${task.id}-${Date.now()}`;

    setTasks((items) =>
      items.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: nextStatus,
              progress: nextProgress,
              updated: nextStatus === "已暂停" ? t("刚刚暂停") : t("刚刚继续"),
              runs:
                nextStatus === "运行中"
                  ? [
                      {
                        id: nextRunId,
                        status: "运行中" as const,
                        startedAt: new Date().toISOString(),
                        summary:
                          task.status === "已完成"
                            ? t("再次运行已启动，正在重新读取任务目标。")
                            : t("任务已从保存的检查点继续运行。"),
                      },
                      ...(item.runs ?? []),
                    ].slice(0, 12)
                  : stopActiveTaskRuns(
                      item.runs,
                      t("用户暂停运行，当前检查点已保存。"),
                    ),
            }
          : item,
      ),
    );

    if (task.id === "competitor") {
      setIsRunning(nextStatus === "运行中");
    }
    if (nextStatus === "运行中") void driveBrainRun(task, nextRunId);

    recordActivity({
      title: t("{value}：{title}", { value: t(nextStatus === "已暂停" ? t("任务已暂停") : t("任务已继续")), title: task.title }),
      detail:
        nextStatus === "已暂停"
          ? t("任务停止执行，但保留当前进度和已保存证据。")
          : t("任务从上次进度继续运行。"),
      icon: nextStatus === "已暂停" ? "clock" : "activity",
      tone: nextStatus === "已暂停" ? "amber" : "green",
      kind: "任务",
      taskId: task.id,
    });
    setNotice(
      nextStatus === "已暂停"
        ? t("任务“{title}”已暂停", { title: task.title })
        : t("任务“{title}”已继续运行", { title: task.title }),
    );
  }

  function togglePrimaryTask() {
    const nextRunning = !isRunning;
    if (
      nextRunning &&
      !requireOnline(
        t("设备离线，任务“{title}”仍保持暂停；恢复网络后可以继续", { title: primaryTask.title }),
      )
    ) {
      return;
    }
    if (
      nextRunning &&
      !requireBudgetCapacity(t("继续任务“{title}”", { title: primaryTask.title }))
    ) {
      return;
    }
    setIsRunning(nextRunning);
    setTasks((items) =>
      items.map((task) =>
        task.id === "competitor"
          ? {
              ...task,
              status: nextRunning ? "运行中" : "已暂停",
              updated: nextRunning ? t("刚刚继续") : t("刚刚暂停"),
              runs: nextRunning
                ? [
                    {
                      id: `run-${task.id}-${Date.now()}`,
                      status: "运行中" as const,
                      startedAt: new Date().toISOString(),
                      summary: t("首页主任务已从保存的检查点继续运行。"),
                    },
                    ...(task.runs ?? []),
                  ].slice(0, 12)
                : stopActiveTaskRuns(
                    task.runs,
                    t("用户从首页暂停运行，当前检查点已保存。"),
                  ),
            }
          : task,
      ),
    );
    recordActivity({
      title: t("{value}：{title}", { value: (nextRunning ? t("任务已继续") : t("任务已暂停")), title: primaryTask.title }),
      detail: nextRunning
        ? t("首页主任务已恢复后台执行。")
        : t("首页主任务停止执行，已保存当前进度。"),
      icon: nextRunning ? "activity" : "clock",
      tone: nextRunning ? "green" : "amber",
      kind: "任务",
      taskId: primaryTask.id,
    });
  }

  return (
    <main className="clarity-shell">
      <aside className="clarity-sidebar" aria-label={t("主导航")}>
        <button
          className="clarity-brand"
          type="button"
          aria-label={t("返回首页")}
          onClick={() => openView("home")}
        >
          <span className="clarity-brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/unzoo-one-mark-v6.png" alt="Unzoo One" />
          </span>
          <div className="clarity-brand-copy">
            <strong>
              <span className="clarity-wordmark-name">Unzoo</span>
              <span className="clarity-wordmark-one">One</span>
            </strong>
            <small>{t("可信 AI 执行")}</small>
          </div>
        </button>

        <nav className="clarity-nav">
          {(runtimeMode ? runtimeNavItems : navItems).map((item) => (
            <button
              className={activeView === item.id ? "active" : ""}
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={activeView === item.id ? "page" : undefined}
              title={item.label}
              onClick={() => openView(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <small>{item.mobileLabel}</small>
              {item.id === "approvals" && activeApprovalCount > 0 && (
                <em>{activeApprovalCount}</em>
              )}
            </button>
          ))}
        </nav>

        {desktopApp && (
          <button
            className="clarity-sidebar-terminal"
            type="button"
            onClick={openTerminalFromPage}
          >
            <SquareTerminal size={17} aria-hidden="true" />
            <span>{t("打开终端")}</span>
          </button>
        )}

        <div className="clarity-sidebar-status">
          <i className={systemStatusTone} />
          <div>
            <strong>{systemStatusLabel}</strong>
            <small>{systemStatusDetail}</small>
          </div>
        </div>
      </aside>

      <section
        className={`clarity-main${runtimeMode && activeView === "home" ? " is-task-home" : ""}`}
        aria-busy={!tasksReady}
      >
        <div className="clarity-mobile-topbar">
          <button
            className="clarity-mobile-brand"
            type="button"
            aria-label={t("返回首页")}
            onClick={() => openView("home")}
          >
            <span className="clarity-mobile-brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/unzoo-one-mark-v6.png" alt="" />
            </span>
            <span className="clarity-mobile-brand-copy">
              <strong>
                <span className="clarity-wordmark-name">Unzoo</span>
                <span className="clarity-wordmark-one">One</span>
              </strong>
              <small>
                <i className={systemStatusTone} />
                {systemStatusLabel}
              </small>
            </span>
          </button>
          <button
            className="clarity-mobile-create"
            type="button"
            aria-label={runtimeMode ? t("新任务") : t("新建任务")}
            title={runtimeMode ? t("新任务") : t("新建任务")}
            onClick={beginCreateTask}
          >
            <Plus size={19} />
          </button>
        </div>

        <header className="clarity-header">
          <div className="clarity-page-title">
            <span>{pageTitle.eyebrow}</span>
            <h1>{pageTitle.title}</h1>
            <p>{pageTitle.description}</p>
          </div>

          <div className="clarity-header-actions">
            <div className="clarity-search-wrap" ref={searchWrapRef}>
              <div className={`clarity-search ${searchOpen ? "open" : ""}`}>
                <Search size={16} />
                <input
                  ref={searchInputRef}
                  role="combobox"
                  aria-label={t("全局搜索")}
                  aria-autocomplete="list"
                  aria-controls="global-search-results"
                  aria-expanded={searchOpen}
                  aria-activedescendant={
                    searchOpen && searchResults[activeSearchIndex]
                      ? `search-result-${activeSearchIndex}`
                      : undefined
                  }
                  autoComplete="off"
                  placeholder={t("搜索任务、成果、页面和操作")}
                  value={query}
                  onFocus={() => {
                    setNotificationsOpen(false);
                    setWorkspaceMenuOpen(false);
                    setSearchOpen(true);
                  }}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveSearchIndex(0);
                    setSearchOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                {query && (
                  <button
                    className="clarity-search-clear"
                    type="button"
                    aria-label={t("清除搜索")}
                    onClick={clearSearch}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchOpen && (
                <div
                  className="clarity-search-panel"
                  id="global-search-results"
                  role="listbox"
                  aria-label={t("全局搜索结果")}
                >
                  <div className="clarity-search-panel-heading">
                    <strong>{(query ? t("搜索结果") : t("快速访问"))}</strong>
                    <span>{t("{length} 项", { length: searchResults.length })}</span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="clarity-search-sections">
                      {searchResultSections.map((section) => (
                        <section
                          className="clarity-search-section"
                          key={section.id}
                          role="group"
                          aria-label={section.label}
                        >
                          <div className="clarity-search-section-heading">
                            <span>{section.label}</span>
                            <em>{section.results.length}</em>
                            {section.canClear && (
                              <button
                                type="button"
                                onClick={clearRecentSearches}
                              >
                                
                                {t("清除")}
                              </button>
                            )}
                          </div>
                          <div className="clarity-search-results">
                            {section.results.map((result) => {
                              const index = searchResults.findIndex(
                                (item) => item.key === result.key,
                              );
                              return (
                                <button
                                  id={`search-result-${index}`}
                                  className={
                                    index === activeSearchIndex ? "active" : ""
                                  }
                                  key={result.key}
                                  type="button"
                                  role="option"
                                  aria-selected={index === activeSearchIndex}
                                  onMouseEnter={() => setActiveSearchIndex(index)}
                                  onClick={() => chooseSearchResult(result)}
                                >
                                  <span
                                    className="clarity-search-result-icon"
                                    data-kind={result.kind}
                                  >
                                    <result.icon size={17} />
                                  </span>
                                  <span className="clarity-search-result-copy">
                                    <strong>{result.title}</strong>
                                    <small>{result.description}</small>
                                  </span>
                                  <span className="clarity-search-result-meta">
                                    {result.meta}
                                    <ChevronRight size={14} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="clarity-search-empty">
                      <Search size={18} />
                      <strong>{t("没有找到匹配内容")}</strong>
                      <span>{t("换一个任务名称、页面或操作试试。")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="clarity-notification-wrap" ref={notificationWrapRef}>
              <button
                ref={notificationButtonRef}
                className="clarity-icon-button"
                type="button"
                aria-label={
                  unreadNotificationCount
                    ? t("通知，{unreadNotificationCount} 条未读", { unreadNotificationCount })
                    : t("通知，无未读消息")
                }
                aria-controls="global-notifications"
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setSearchOpen(false);
                  setWorkspaceMenuOpen(false);
                  setNotificationsOpen((open) => {
                    const nextOpen = !open;
                    if (nextOpen) {
                      setNotificationFilter("全部");
                      window.requestAnimationFrame(() =>
                        window.requestAnimationFrame(() =>
                          notificationPanelRef.current
                            ?.querySelector<HTMLButtonElement>(
                              ".notification-item",
                            )
                            ?.focus(),
                        ),
                      );
                    }
                    return nextOpen;
                  });
                }}
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span
                    className="clarity-notification-badge"
                    aria-hidden="true"
                  >
                    {unreadNotificationCount > 9
                      ? "9+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <>
                  <button
                    className="notification-backdrop"
                    type="button"
                    tabIndex={-1}
                    aria-label={t("关闭通知中心")}
                    onClick={closeNotifications}
                  />
                  <div
                    className="clarity-notifications"
                    id="global-notifications"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("通知")}
                    ref={notificationPanelRef}
                  >
                  <header className="notification-heading">
                    <div>
                      <strong>{t("通知中心")}</strong>
                      <span>
                        {unreadNotificationCount
                          ? t("{unreadNotificationCount} 条未读", { unreadNotificationCount })
                          : t("全部已读")}
                      </span>
                    </div>
                    <div>
                      <button
                        className="notification-mark-all"
                        type="button"
                        disabled={unreadNotificationCount === 0}
                        onClick={markAllNotificationsRead}
                      >
                        <CheckCircle2 size={14} />
                        
                        {t("全部已读")}
                      </button>
                      <button
                        className="notification-close"
                        type="button"
                        aria-label={t("关闭通知")}
                        onClick={closeNotifications}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </header>

                  <div
                    className="notification-filters"
                    role="tablist"
                    aria-label={t("通知筛选")}
                  >
                    {(["全部", "未读"] as NotificationFilter[]).map(
                      (filter) => (
                        <button
                          className={
                            notificationFilter === filter ? "active" : ""
                          }
                          key={filter}
                          type="button"
                          role="tab"
                          aria-selected={notificationFilter === filter}
                          onClick={() => setNotificationFilter(filter)}
                        >
                          {t(filter)}
                          <span>
                            {filter === "全部"
                              ? notificationItems.length
                              : unreadNotificationCount}
                          </span>
                        </button>
                      ),
                    )}
                  </div>

                  {visibleNotificationItems.length > 0 ? (
                    <div className="notification-list">
                      {visibleNotificationItems.map((item) => {
                        const isUnread = !readNotificationIds.includes(item.id);
                        return (
                          <button
                            className={`notification-item ${
                              isUnread ? "unread" : ""
                            }`}
                            key={item.id}
                            type="button"
                            onClick={() => openNotification(item)}
                          >
                            <span
                              className={`notification-item-icon tone-${item.tone}`}
                            >
                              <item.icon size={17} />
                            </span>
                            <span className="notification-item-copy">
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                            </span>
                            <span className="notification-item-meta">
                              <em>{item.meta}</em>
                              {isUnread && <i />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <CheckCircle2 size={22} />
                      <strong>{t("没有未读通知")}</strong>
                      <small>{t("需要处理的新消息会出现在这里。")}</small>
                      <button
                        type="button"
                        onClick={() => setNotificationFilter("全部")}
                      >
                        
                        {t("查看全部")}
                      </button>
                    </div>
                  )}

                  <button
                    className="notification-footer"
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      openView("activity");
                    }}
                  >
                    
                    {t("查看全部运行记录")}
                    <ChevronRight size={14} />
                  </button>
                  </div>
                </>
              )}
            </div>

            <div className="workspace-menu-wrap" ref={workspaceMenuWrapRef}>
              <button
                ref={workspaceMenuButtonRef}
                className={`workspace-menu-trigger ${
                  workspaceMenuOpen ? "open" : ""
                }`}
                type="button"
                aria-label={t("打开工作区控制中心")}
                aria-controls="workspace-control-center"
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setSearchOpen(false);
                  setNotificationsOpen(false);
                  setWorkspaceMenuOpen((open) => {
                    const nextOpen = !open;
                    if (nextOpen) {
                      window.requestAnimationFrame(() =>
                        window.requestAnimationFrame(() =>
                          workspaceMenuPanelRef.current
                            ?.querySelector<HTMLButtonElement>(
                              ".workspace-menu-nav button",
                            )
                            ?.focus(),
                        ),
                      );
                    }
                    return nextOpen;
                  });
                }}
              >
                <span className="workspace-menu-trigger-icon">
                  <Building2 size={17} />
                </span>
                <span className="workspace-menu-trigger-copy">
                  <strong>{workspaceProfile.name}</strong>
                  <small>{planLabel}</small>
                </span>
                <ChevronDown
                  className={workspaceMenuOpen ? "is-open" : ""}
                  size={15}
                />
              </button>

              {workspaceMenuOpen && (
                <>
                  <button
                    className="workspace-menu-backdrop"
                    type="button"
                    tabIndex={-1}
                    aria-label={t("关闭工作区控制中心")}
                    onClick={closeWorkspaceMenu}
                  />
                  <div
                    className="workspace-menu-panel"
                    id="workspace-control-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("工作区控制中心")}
                    ref={workspaceMenuPanelRef}
                  >
                  <header className="workspace-menu-heading">
                    <span className="workspace-menu-avatar">
                      {workspaceInitial}
                    </span>
                    <div>
                      <span>{t("当前工作区")}</span>
                      <strong>{workspaceProfile.name}</strong>
                      <small>
                        {t(!isOnline
                          ? t("设备离线 · 本机数据可用")
                          : settings.local
                            ? t("数据保存在本机")
                            : t("当前为临时会话"))}
                      </small>
                    </div>
                    <button
                      type="button"
                      aria-label={t("关闭工作区控制中心")}
                      onClick={closeWorkspaceMenu}
                    >
                      <X size={16} />
                    </button>
                  </header>

                  {runtimeMode ? (
                    <div className="workspace-menu-summary" aria-label={t("工作区状态")}>
                      <span>
                        <small>{t("任务")}</small>
                        <strong>{tasks.length}</strong>
                      </span>
                      <span>
                        <small>{t("正在运行")}</small>
                        <strong>{runningTaskCount}</strong>
                      </span>
                      <span>
                        <small>{t("本月 token")}</small>
                        <strong>{runtimeUsage ? compactNumber(runtimeUsage.input + runtimeUsage.output) : "…"}</strong>
                      </span>
                    </div>
                  ) : (
                  <div className="workspace-menu-summary" aria-label={t("工作区状态")}>
                    <span>
                      <small>{t("团队成员")}</small>
                      <strong>{teamMembers.length}</strong>
                    </span>
                    <span className={!isOnline ? "is-alert" : ""}>
                      <small>{(isOnline ? t("可用连接") : t("网络状态"))}</small>
                      <strong>
                        {isOnline
                          ? `${healthyConnectorCount}/${connectorCatalog.length}`
                          : t("离线")}
                      </strong>
                    </span>
                    <span className={budgetAlertReached ? "is-alert" : ""}>
                      <small>{t("本月用量")}</small>
                      <strong>{usagePercent}%</strong>
                    </span>
                  </div>
                  )}

                  <nav className="workspace-menu-nav" aria-label={t("工作区快捷操作")}>
                    <button type="button" onClick={openWorkspaceProfile}>
                      <span className="tone-green">
                        <Pencil size={17} />
                      </span>
                      <span>
                        <strong>{t("工作区资料")}</strong>
                        <small>{workspaceProfile.description}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    {!runtimeMode && (
                    <button
                      type="button"
                      onClick={() => openWorkspaceSection("team")}
                    >
                      <span className="tone-blue">
                        <Users size={17} />
                      </span>
                      <span>
                        <strong>{t("团队与权限")}</strong>
                        <small>{t("{onlineMemberCount} 位在线 · {approverMemberCount} 位可审批", { onlineMemberCount, approverMemberCount })}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    )}
                    <button type="button" onClick={runtimeMode ? () => openWorkspaceSection("usage") : openWorkspaceBudget}>
                      <span className="tone-violet">
                        <Sparkles size={17} />
                      </span>
                      <span>
                        <strong>{runtimeMode ? t("用量") : t("用量与预算")}</strong>
                        <small>
                          {runtimeMode
                            ? runtimeUsage
                              ? t("本月 {runs} 次运行", { runs: runtimeUsage.runs })
                              : t("正在读取用量…")
                            : t("已使用 {usedCredits} / {monthlyBudget} 点", { usedCredits, monthlyBudget: usageSettings.monthlyBudget })}
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openWorkspaceSection("connectors")}
                    >
                      <span
                        className={
                          connectorIssueCount > 0 ? "tone-amber" : "tone-green"
                        }
                      >
                        <Link2 size={17} />
                      </span>
                      <span>
                        <strong>{runtimeMode ? t("能力") : t("能力连接")}</strong>
                        <small>
                          {runtimeMode
                            ? t("终端、浏览器与智能体")
                            : connectorIssueCount > 0
                            ? t("{connectorIssueCount} 项需要处理", { connectorIssueCount })
                            : t("{connectedConnectorCount} 项已连接", { connectedConnectorCount })}
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    <button type="button" onClick={openOnboarding}>
                      <span className="tone-blue">
                        <ListChecks size={17} />
                      </span>
                      <span>
                        <strong>{t("首次设置")}</strong>
                        <small>{t("{onboardingCompletedCount}/{total} 项已完成", { onboardingCompletedCount, total: onboardingSteps.length })}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    <button type="button" onClick={exportWorkspaceFromMenu}>
                      <span className="tone-slate">
                        <Download size={17} />
                      </span>
                      <span>
                        <strong>{t("导出工作区备份")}</strong>
                        <small>{t("下载任务、成果、设置和审计记录")}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  </nav>

                  {!runtimeMode && (
                  <footer className="workspace-menu-footer">
                    <div
                      className="workspace-menu-people"
                      aria-label={t("{length} 位工作区成员", { length: teamMembers.length })}
                    >
                      {teamMembers.slice(0, 3).map((member) => (
                        <span
                          className={`tone-${member.tone}`}
                          key={member.id}
                          title={member.name}
                        >
                          {member.avatar}
                        </span>
                      ))}
                      <small>{t("{length} 位成员", { length: teamMembers.length })}</small>
                    </div>
                    <button type="button" onClick={openWorkspaceInvite}>
                      <UserPlus size={15} />
                      
                      {t("邀请成员")}
                    </button>
                  </footer>
                  )}
                  </div>
                </>
              )}
            </div>

            <button
              className="clarity-primary-button"
              type="button"
              onClick={beginCreateTask}
            >
              <Plus size={17} />

              {runtimeMode ? t("新任务") : t("新建任务")}
            </button>
          </div>
        </header>

        {tasksReady &&
          (workspacePersistenceStatus === "failed" ||
            workspacePersistenceStatus === "retrying") && (
            <section
              className={`workspace-storage-banner ${
                workspacePersistenceStatus === "retrying" ? "is-retrying" : ""
              }`}
              role="alert"
              aria-live="assertive"
            >
              <span className="workspace-storage-icon" aria-hidden="true">
                {workspacePersistenceStatus === "retrying" ? (
                  <LoaderCircle className="spinning" size={18} />
                ) : (
                  <HardDrive size={18} />
                )}
              </span>
              <span className="workspace-storage-copy">
                <strong>
                  {t(workspacePersistenceStatus === "retrying"
                    ? t("正在恢复本机保存")
                    : t("本机保存未完成"))}
                </strong>
                <small>{workspacePersistenceDetail}</small>
              </span>
              <span className="workspace-storage-actions">
                <button
                  className="retry"
                  type="button"
                  disabled={workspacePersistenceStatus === "retrying"}
                  onClick={retryWorkspaceSave}
                >
                  {workspacePersistenceStatus === "retrying" ? (
                    <LoaderCircle className="spinning" size={15} />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                  {t(workspacePersistenceStatus === "retrying"
                    ? t("正在重试")
                    : t("重试保存"))}
                </button>
                <button
                  type="button"
                  onClick={exportEmergencyWorkspaceBackup}
                >
                  <Download size={15} />
                  
                  {t("导出紧急备份")}
                </button>
              </span>
            </section>
          )}

        {!isOnline && (
          <section
            className="network-status-banner"
            role="status"
            aria-live="polite"
          >
            <span className="network-status-icon" aria-hidden="true">
              <Globe2 size={18} />
            </span>
            <div>
              <strong>{t("当前设备已离线")}</strong>
              <p>
                
                {t("本机任务、成果和审计记录仍可查看；网页、邮件和日历能力会在网络恢复后继续。")}
              </p>
            </div>
            <button
              type="button"
              disabled={isCheckingNetwork}
              onClick={checkNetworkConnection}
            >
              {isCheckingNetwork ? (
                <LoaderCircle className="spinning" size={15} />
              ) : (
                <RotateCcw size={15} />
              )}
              {(isCheckingNetwork ? t("正在检查") : t("检查连接"))}
            </button>
          </section>
        )}

        {tasksReady && workspaceSyncNotice && (
          <section
            className={`workspace-sync-banner ${
              workspaceSyncHasConflict ? "has-conflict" : ""
            }`}
            role={workspaceSyncHasConflict ? "alert" : "status"}
            aria-live="polite"
          >
            <span className="workspace-sync-icon" aria-hidden="true">
              {workspaceSyncHasConflict ? (
                <AlertTriangle size={18} />
              ) : (
                <RotateCcw size={18} />
              )}
            </span>
            <span className="workspace-sync-copy">
              <strong>
                {workspaceSyncHasConflict
                  ? t("另一窗口更新了你正在编辑的内容")
                  : t("另一窗口更新了{workspaceSyncLabel}", { workspaceSyncLabel })}
              </strong>
              <small>
                {workspaceSyncHasConflict
                  ? t("已暂停同步{workspaceSyncLabel}，当前草稿没有被覆盖。", { workspaceSyncLabel })
                  : t("当前工作区已自动同步，无需重新加载页面。")}
              </small>
            </span>
            <span className="workspace-sync-actions">
              {workspaceSyncHasConflict ? (
                <>
                  <button
                    className="latest"
                    type="button"
                    onClick={useLatestWorkspaceVersion}
                  >
                    <RotateCcw size={14} />
                    
                    {t("载入最新版本")}
                  </button>
                  <button
                    className="keep"
                    type="button"
                    onClick={keepCurrentWorkspaceDrafts}
                  >
                    <Save size={14} />
                    
                    {t("保留当前草稿")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={reviewWorkspaceSync}>
                  
                  {t("查看更新")}
                  <ChevronRight size={14} />
                </button>
              )}
            </span>
            {!workspaceSyncHasConflict && (
              <button
                className="workspace-sync-dismiss"
                type="button"
                aria-label={t("关闭同步提示")}
                onClick={() => setWorkspaceSyncNotice(null)}
              >
                <X size={15} />
              </button>
            )}
          </section>
        )}

        <input
          ref={importInputRef}
          className="workspace-import-input"
          type="file"
          accept=".json,application/json"
          onChange={importWorkspace}
        />

        {!tasksReady && (
          <section
            className="workspace-loading"
            role="status"
            aria-label={t("正在恢复工作区")}
          >
            <div className="workspace-loading-heading">
              <span className="workspace-loading-icon">
                <LoaderCircle size={19} />
              </span>
              <span>
                <strong>{t("正在恢复你的工作区")}</strong>
                <small>{t("读取本机任务、成果和运行记录")}</small>
              </span>
            </div>
            <div className="workspace-loading-metrics" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="workspace-loading-canvas" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </section>
        )}

        {tasksReady && workspaceLoadWarning && (
          <section className="workspace-warning" role="status">
            <span className="workspace-warning-icon">
              <AlertTriangle size={19} />
            </span>
            <span className="workspace-warning-copy">
              <strong>{t("工作区已安全恢复")}</strong>
              <small>{workspaceLoadWarning}</small>
            </span>
            <button type="button" onClick={restoreWorkspaceFromWarning}>
              <Upload size={15} />
              
              {t("从备份恢复")}
            </button>
            <button
              className="workspace-warning-dismiss"
              type="button"
              aria-label={t("关闭工作区提示")}
              onClick={() => setWorkspaceLoadWarning("")}
            >
              <X size={15} />
            </button>
          </section>
        )}

        {tasksReady && pendingTaskDraftRecovery && !composerOpen && (
          <DraftRecoveryNotice
            id="task-draft-recovery"
            icon={Save}
            title={t("发现未完成的任务草稿")}
            description={t("{value}：{value2} · 保存于 {formatDraftSavedAt}", { value: (pendingTaskDraftRecovery.editingTaskId ? t("任务修改") : t("新任务")), value2: pendingTaskDraftRecovery.draft.name.trim() || t("未命名任务"), formatDraftSavedAt: formatDraftSavedAt(pendingTaskDraftRecovery.savedAt) })}
            continueLabel={t("继续编辑")}
            onContinue={restoreRecoveredTaskDraft}
            onDiscard={discardRecoveredTaskDraft}
          />
        )}

        {tasksReady && pendingArtifactDraftRecovery && !editingArtifact && (
          <DraftRecoveryNotice
            id="artifact-draft-recovery"
            icon={FileText}
            title={t("发现未完成的成果修订")}
            description={t("成果修订：{value} · 保存于 {formatDraftSavedAt}", { value: pendingArtifactDraftRecovery.draft.title.trim() || t("未命名成果"), formatDraftSavedAt: formatDraftSavedAt(
              pendingArtifactDraftRecovery.savedAt,
            ) })}
            continueLabel={t("继续修订")}
            onContinue={restoreRecoveredArtifactDraft}
            onDiscard={discardRecoveredArtifactDraft}
          />
        )}

        {activeView === "home" && runtimeMode && tasksReady && (
          <Conversations
            tasks={tasks}
            selectedId={conversationId}
            onSelect={setConversationId}
            newNonce={conversationNonce}
            onStart={startConversation}
            onFollowUp={sendConversationFollowUp}
            onStop={stopConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
            onSchedule={scheduleConversation}
            onOpenOutput={openConversationOutput}
            onRevealFolder={
              desktopApp
                ? (path) =>
                    void revealPath(path).catch((error: unknown) =>
                      setNotice(t("打不开文件夹：{message}", { message: error instanceof Error ? error.message : String(error) })),
                    )
                : undefined
            }
            onDecide={decideInConversation}
            loadThread={loadConversationThread}
            loadScreen={(sessionId, fromLine) => workspaceProvider.runtime.terminalScreen(sessionId, fromLine)}
            sendKeys={(sessionId, input) => workspaceProvider.runtime.terminalInput(sessionId, input)}
            loadTab={(tabId) => workspaceProvider.runtime.tabView(tabId)}
            onOpenTerminal={openAgentTerminal}
            onShowTab={(tabId) => workspaceProvider.runtime.activateTab(tabId)}
            onHandover={(sessionId, handoverId, done, note) =>
              workspaceProvider.runtime.answerHandover(sessionId, handoverId, done, note)
            }
            onSaveSkill={saveConversationAsSkill}
            onOpenSkills={() => openSettingsSection("agents")}
            scheduleLabel={formatTaskTrigger}
            agentName={conversationAgent?.name}
            helperAgents={(runtimeAgents ?? []).filter((agent) => agent.installed).map((agent) => ({ id: agent.id, name: agent.name }))}
            notice={conversationNotice}
          />
        )}

        {activeView === "home" && !runtimeMode && (
          <section className="home-view">
            {tasksReady && !onboardingDismissed && (
              <section
                className={`workspace-onboarding${
                  onboardingCompletedCount === onboardingSteps.length
                    ? " is-complete"
                    : ""
                }`}
                id="workspace-onboarding"
                aria-labelledby="workspace-onboarding-title"
              >
                <div className="workspace-onboarding-intro">
                  <header>
                    <span>{runtimeMode ? t("首次设置") : t("首次设置 · 示例工作区")}</span>
                    <strong>{t("{onboardingCompletedCount}/{length} 已完成", { onboardingCompletedCount, length: onboardingSteps.length })}</strong>
                  </header>
                  <button
                    className="workspace-onboarding-dismiss"
                    type="button"
                    aria-label={t("关闭首次设置")}
                    onClick={() => dismissOnboarding()}
                  >
                    <X size={16} />
                  </button>
                  <h2 id="workspace-onboarding-title">
                    
                    {t("把这里变成你的 AI 工作区")}
                  </h2>
                  <p>
                    
                    {runtimeMode
                      ? t("完成下面几步，就可以把真实的工作交给智能体。")
                      : t("当前任务用于展示产品能力。完成下面的设置，再运行属于你的真实任务。")}
                  </p>
                  <div
                    className="workspace-onboarding-progress"
                    role="progressbar"
                    aria-label={t("首次设置进度")}
                    aria-valuemin={0}
                    aria-valuemax={onboardingSteps.length}
                    aria-valuenow={onboardingCompletedCount}
                  >
                    <i
                      style={{
                        width: `${
                          (onboardingCompletedCount / onboardingSteps.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="workspace-onboarding-actions">
                    <button
                      className="primary"
                      type="button"
                      onClick={continueOnboarding}
                    >
                      {nextOnboardingStep ? (
                        <>
                          {nextOnboardingStep.actionLabel}
                          <ChevronRight size={15} />
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          
                          {t("完成设置")}
                        </>
                      )}
                    </button>
                    <button type="button" onClick={() => dismissOnboarding()}>
                      
                      {t("稍后处理")}
                    </button>
                  </div>
                </div>

                <div
                  className="workspace-onboarding-steps"
                  aria-label={t("首次设置步骤")}
                >
                  {onboardingSteps.map((step) => {
                    const StepIcon = step.icon;
                    const isNext = nextOnboardingStep?.id === step.id;
                    return (
                      <button
                        className={`${step.complete ? "is-complete" : ""}${
                          isNext ? " is-next" : ""
                        }`}
                        key={step.id}
                        type="button"
                        aria-label={t("{label}，{value}", { label: step.label, value: step.complete ? t("已完成") : step.actionLabel })}
                        onClick={() => runOnboardingStep(step.id)}
                      >
                        <span>
                          {step.complete ? (
                            <Check size={16} />
                          ) : (
                            <StepIcon size={16} />
                          )}
                        </span>
                        <span>
                          <strong>{step.label}</strong>
                          <small>{step.description}</small>
                        </span>
                        <em>{step.complete ? t("已完成") : step.actionLabel}</em>
                        <ChevronRight size={15} />
                      </button>
                    );
                  })}
                </div>

              </section>
            )}

            <div className="home-summary" aria-label={t("今日概览")}>
              <button
                className="summary-running"
                type="button"
                aria-label={t("查看 {runningTaskCount} 个正在运行的任务", { runningTaskCount })}
                onClick={() => openTaskStatus("运行中")}
              >
                <i><Play size={14} /></i>
                <span>
                  <small>{t("正在运行")}</small>
                  <strong>{runningTaskCount}</strong>
                </span>
                <ChevronRight className="summary-open-icon" size={14} />
              </button>
              <button
                className="summary-waiting"
                type="button"
                aria-label={t("查看 {activeApprovalCount} 项待确认操作", { activeApprovalCount })}
                onClick={openApprovalQueue}
              >
                <i><ShieldCheck size={14} /></i>
                <span>
                  <small>{t("等待确认")}</small>
                  <strong>{activeApprovalCount}</strong>
                </span>
                <ChevronRight className="summary-open-icon" size={14} />
              </button>
              <button
                className="summary-failed"
                type="button"
                aria-label={t("查看 {failedTaskCount} 个需要恢复的任务", { failedTaskCount })}
                onClick={() => openTaskStatus("失败")}
              >
                <i><AlertTriangle size={14} /></i>
                <span>
                  <small>{t("需要恢复")}</small>
                  <strong>{failedTaskCount}</strong>
                </span>
                <ChevronRight className="summary-open-icon" size={14} />
              </button>
              <button
                className="summary-done"
                type="button"
                aria-label={t("查看 {completedTaskCount} 个已完成任务", { completedTaskCount })}
                onClick={() => openTaskStatus("已完成")}
              >
                <i><CheckCircle2 size={14} /></i>
                <span>
                  <small>{t("已完成")}</small>
                  <strong>{completedTaskCount}</strong>
                </span>
                <ChevronRight className="summary-open-icon" size={14} />
              </button>
            </div>

            <div className="home-focus-grid">
              {runtimeMode ? (
                <RuntimeFocusCard
                  tasks={tasks}
                  schedule={formatTaskSchedule}
                  onOpen={openTask}
                  onToggle={updateTaskStatus}
                  onCreate={beginCreateTask}
                />
              ) : (
                <section className="active-task-panel" aria-label={t("正在运行的任务")}>
                  <div className="task-ai-hero">
                    <div className="task-ai-copy">
                      <div className="focus-panel-heading">
                        <div>
                          <span>
                            {formatTaskSchedule(primaryTask)} ·{" "}
                            {isRunning ? t("正在运行") : t("已暂停")}
                          </span>
                          <strong>{primaryTask.title}</strong>
                        </div>
                        <span className={`live-state ${isRunning ? "" : "paused"}`}>
                          <i />
                          {t(isRunning ? "运行中" : "已暂停")}
                        </span>
                      </div>

                      <p className="task-purpose">
                        {primaryTask.description}
                      </p>

                      <div className="task-ai-context" aria-label={t("AI 当前状态")}>
                        <span><Brain size={15} />  {t("Codex 推理")}</span>
                        <i />
                        <span><ShieldCheck size={15} />  {t("可审计执行")}</span>
                      </div>
                    </div>

                    <div className="task-ai-visual" aria-label={t("AI 正在整合网页证据")}>
                      {/* The source WebP is already optimized; vinext has no Next image proxy. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/ai-core-premium.webp" alt="" aria-hidden="true" />
                      <span className="task-ai-visual-status">
                        <Sparkles size={15} />
                        <span>
                          <small>{t("AI 引擎实况")}</small>
                          <strong>{t("正在整合 12 份页面证据")}</strong>
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="task-signal-band" aria-label={t("今日任务信号")}>
                    <div className="signal-metric">
                      <span>{t("今天发现")}</span>
                      <strong>4</strong>
                      <small>{t("处页面变化")}</small>
                    </div>
                    <div className="signal-chart" aria-hidden="true">
                      <svg viewBox="0 0 100 50" preserveAspectRatio="none">
                        <path d="M2 13 H98 M2 25 H98 M2 37 H98" />
                        <polyline points={signalPoints} />
                        <circle cx="98" cy="7.68" r="1.8" />
                      </svg>
                      <span>
                        <small>09:00</small>
                        <small>{t("现在")}</small>
                      </span>
                    </div>
                    <div className="signal-metric">
                      <span>{t("保存证据")}</span>
                      <strong>12</strong>
                      <small>{t("张页面截图")}</small>
                    </div>
                  </div>

                  <div className="simple-progress">
                    <div>
                      <span>{t("已完成 2 / 3 步")}</span>
                      <strong>{isRunning ? `${primaryTask.progress}%` : t("暂停")}</strong>
                    </div>
                    <span>
                      <i
                        className={isRunning ? "moving" : ""}
                        style={{ width: `${primaryTask.progress}%` }}
                      />
                    </span>
                  </div>

                  <div className="plain-steps">
                    {runSteps.map((step, index) => (
                      <button
                        className={`${selectedStep === step.id ? "selected" : ""} step-${step.id}`}
                        key={step.id}
                        type="button"
                        onClick={() => setSelectedStep(step.id)}
                      >
                        <span className="plain-step-marker">
                          {index === 0 ? <Check size={15} /> : <step.icon size={16} />}
                        </span>
                        <span>
                          <strong>{step.title}</strong>
                          <small>{step.description}</small>
                        </span>
                        <em>{step.id === "analyze" && !isRunning ? "已暂停" : step.status}</em>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>

                  <div className="current-work">
                    <div className="current-work-icon">
                      {selectedStep === "collect" && <Globe2 size={19} />}
                      {selectedStep === "analyze" && <Sparkles size={19} />}
                      {selectedStep === "send" && <Mail size={19} />}
                    </div>
                    <div>
                      <span>{t("当前查看")}</span>
                      <strong>
                        {runSteps.find((step) => step.id === selectedStep)?.title}
                      </strong>
                      <small>
                        {selectedStep === "collect" && t("网页已经检查完成，截图和页面内容均已保存。")}
                        {selectedStep === "analyze" && t("正在提取真正有意义的变化，预计还需要 2 分钟。")}
                        {selectedStep === "send" && t("摘要已经准备好，确认收件人后才能发送。")}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={togglePrimaryTask}
                    >
                      {isRunning ? <Pause size={15} /> : <Play size={15} />}
                      {(isRunning ? t("暂停") : t("继续"))}
                    </button>
                  </div>

                  <footer className="task-tools">
                    <span>{t("本次使用")}</span>
                    <span><Globe2 size={14} />  {t("浏览器")}</span>
                    <span><Brain size={14} /> Codex</span>
                    <span><Mail size={14} />  {t("邮件")}</span>
                    <div className="task-tools-actions">
                      <button
                        type="button"
                        onClick={() => openTaskArtifacts(primaryTask.id)}
                      >
                        <Files size={14} />
                        
                        {t("查看成果")}
                      </button>
                      <button type="button" onClick={() => openView("activity")}>
                        
                        {t("完整记录")}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </footer>
                </section>
              )}

              <aside className="needs-action-panel" aria-label={t("需要你确认")}>
                <div className="attention-heading">
                  <span>{t("需要你处理")}</span>
                  <strong>{activeApprovalCount}</strong>
                </div>

                {selectedApproval ? (
                  <>
                    <div className="attention-icon">
                      <selectedApproval.icon size={20} />
                    </div>
                    <h2>{selectedApproval.title}</h2>
                    <p>{selectedApproval.reason}</p>

                    {selectedApproval.id === "send-summary" && (
                      <div className="recipient-preview">
                        <div>
                          <span>{t("刘")}</span>
                          <span>{t("王")}</span>
                          <span>{t("陈")}</span>
                        </div>
                        <p>
                          <strong>{t("领导沟通群")}</strong>
                          <small>{t("3 位成员将看到这份摘要")}</small>
                        </p>
                      </div>
                    )}

                    <div className="plain-impact">
                      <ShieldCheck size={17} />
                      <span>
                        <strong>{t("确认后会发生什么")}</strong>
                        <small>{selectedApproval.impact}</small>
                      </span>
                    </div>

                    <div className="decision-boundary" aria-label={t("本次操作边界")}>
                      <span>
                        <small>{t("执行对象")}</small>
                        <strong>{selectedApproval.target}</strong>
                      </span>
                      <span>
                        <small>{t("影响范围")}</small>
                        <strong>{selectedApproval.scope}</strong>
                      </span>
                      <span>
                        <small>{t("风险等级")}</small>
                        <strong className={`approval-risk risk-${selectedApproval.risk}`}>
                          {t(selectedApproval.risk)}
                        </strong>
                      </span>
                    </div>

                    <div className="attention-actions">
                      <button
                        className="confirm"
                        type="button"
                        onClick={() =>
                          openView("approvals", {
                            approvalId: selectedApproval.id,
                          })
                        }
                      >
                        <ShieldCheck size={16} />
                        
                        {t("查看并确认")}
                      </button>
                      <button type="button" onClick={holdCurrent}>{t("稍后处理")}</button>
                    </div>

                    <button
                      className="all-approvals-link"
                      type="button"
                      onClick={() => openView("approvals")}
                    >
                      
                      {t("查看全部待确认操作")}
                      <ChevronRight size={15} />
                    </button>
                  </>
                ) : (
                  <div className="nothing-pending">
                    {deferredApprovalCount > 0 ? (
                      <Clock3 size={28} />
                    ) : (
                      <CheckCircle2 size={28} />
                    )}
                    <strong>
                      {t(deferredApprovalCount > 0
                        ? t("当前待办已经清空")
                        : t("暂时没有需要处理的事"))}
                    </strong>
                    <p>
                      {deferredApprovalCount > 0
                        ? t("{deferredApprovalCount} 项操作会在安排的时间重新提醒。", { deferredApprovalCount })
                        : t("任务会继续在后台运行。")}
                    </p>
                    {deferredApprovalCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          openView("approvals", {
                            approvalFilter: "稍后",
                          })
                        }
                      >
                        
                        {t("查看稍后提醒")}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </aside>
            </div>

            <section className="recent-section">
              <div className="section-title-row">
                <div>
                  <span>{t("最近任务")}</span>
                  <h2>{t("你交给 Unzoo One 的工作")}</h2>
                </div>
                <button type="button" onClick={() => openView("tasks")}>
                  
                  {t("查看全部")}
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="recent-task-list">
                {searchedTasks.slice(0, 3).map((task) => (
                  <button
                    className="recent-task-row"
                    key={task.id}
                    type="button"
                    onClick={() => openTask(task.id)}
                  >
                    <span className={`recent-task-icon status-${task.status}`}>
                      {task.status === "运行中" && <Activity size={17} />}
                      {task.status === "待确认" && <ShieldCheck size={17} />}
                      {task.status === "失败" && <AlertTriangle size={17} />}
                      {task.status === "已暂停" && <Pause size={17} />}
                      {task.status === "已完成" && <CheckCircle2 size={17} />}
                    </span>
                    <span className="recent-task-copy">
                      <span className="recent-task-topline">
                        <em className={`status-label status-${task.status}`}>{t(task.status)}</em>
                        <small>{task.updated}</small>
                      </span>
                      <strong>{task.title}</strong>
                      <small>{task.description}</small>
                    </span>
                    <span className="recent-task-progress">
                      <span>
                        <i style={{ width: `${task.progress}%` }} />
                      </span>
                      <small>{task.progress}%</small>
                      <ChevronRight size={16} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeView === "tasks" && (
          <section className="tasks-view">
            <div className="view-toolbar">
              <div className="view-filter-tabs" role="tablist" aria-label={t("任务筛选")}>
                {taskFilters.map((filter) => (
                  <button
                    className={taskFilter === filter ? "active" : ""}
                    key={filter}
                    type="button"
                    role="tab"
                    aria-selected={taskFilter === filter}
                    onClick={() => chooseTaskFilter(filter)}
                  >
                    <span>{t(filter)}</span>
                    <em>{taskFilterCounts[filter]}</em>
                  </button>
                ))}
              </div>
              <button
                className="clarity-secondary-button"
                type="button"
                onClick={beginCreateTask}
              >
                <Plus size={16} />
                
                {t("新建任务")}
              </button>
            </div>

            <div className="task-list-controls">
              <label className="task-list-search">
                <Search size={16} />
                <input
                  type="search"
                  aria-label={t("搜索任务列表")}
                  autoComplete="off"
                  placeholder={t("搜索名称、来源或运行计划")}
                  value={taskListQuery}
                  onChange={(event) => setTaskListQuery(event.target.value)}
                />
                {taskListQuery && (
                  <button
                    type="button"
                    aria-label={t("清除任务搜索")}
                    onClick={() => setTaskListQuery("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </label>

              <label className="task-sort-control">
                <ArrowUpDown size={15} />
                <span>{t("排序")}</span>
                <select
                  aria-label={t("任务排序")}
                  value={taskSort}
                  onChange={(event) => setTaskSort(event.target.value as TaskSort)}
                >
                  <option value={t("状态优先")}>{t("状态优先")}</option>
                  <option value={t("进度最高")}>{t("进度最高")}</option>
                  <option value={t("名称")}>{t("名称")}</option>
                </select>
              </label>

              <div className="task-result-meta">
                {taskFilter !== "全部" && (
                  <button
                    className="task-filter-context"
                    type="button"
                    aria-label={t("清除{taskFilter}筛选", { taskFilter: t(taskFilter) })}
                    onClick={() => chooseTaskFilter("全部")}
                  >
                    <ListChecks size={13} />
                    <span>{t(taskFilter)}</span>
                    <X size={12} />
                  </button>
                )}
                <span className="task-result-count" aria-live="polite">
                  
                  {t("显示")} <strong>{filteredTasks.length}</strong> / {tasks.length}  {t("个任务")}
                </span>
                <button
                  className="view-link-copy"
                  type="button"
                  aria-label={t("复制当前任务视图链接")}
                  title={t("复制当前任务视图链接")}
                  onClick={() => copyCurrentViewLink(t("任务视图链接"))}
                >
                  <Link2 size={14} />
                </button>
              </div>
            </div>

            {selectedTasks.length > 0 && (
              <section
                className="task-bulk-bar"
                role="toolbar"
                aria-label={t("批量任务操作")}
              >
                <div className="task-bulk-summary">
                  <span>
                    <CheckCircle2 size={17} />
                  </span>
                  <span>
                    <strong>{t("已选择 {length} 个任务", { length: selectedTasks.length })}</strong>
                    <small>
                      {selectedVisibleTaskCount === selectedTasks.length
                        ? t("操作只会影响当前选择")
                        : t("其中 {selectedVisibleTaskCount} 个在当前筛选中", { selectedVisibleTaskCount })}
                    </small>
                  </span>
                </div>
                <div className="task-bulk-actions">
                  <button
                    className="task-bulk-select-all"
                    type="button"
                    onClick={toggleAllVisibleTasks}
                  >
                    <ListChecks size={15} />
                    {(allVisibleTasksSelected ? t("取消全选") : t("全选当前"))}
                  </button>
                  <button
                    type="button"
                    disabled={pausableSelectedTaskCount === 0}
                    onClick={bulkPauseTasks}
                  >
                    <Pause size={15} />
                    
                    {t("暂停")}
                  </button>
                  <button
                    className={!isOnline ? "is-network-paused" : undefined}
                    type="button"
                    disabled={resumableSelectedTaskCount === 0}
                    onClick={bulkResumeTasks}
                    title={
                      isOnline ? undefined : t("恢复网络后可以继续所选任务")
                    }
                  >
                    {isOnline ? <Play size={15} /> : <Globe2 size={15} />}
                    {(isOnline ? t("继续") : t("联网后继续"))}
                  </button>
                  <button
                    type="button"
                    disabled={unprotectedSelectedTaskCount === 0}
                    onClick={bulkEnableApproval}
                  >
                    <ShieldCheck size={15} />
                    
                    {t("开启审批")}
                  </button>
                  <button
                    className="danger"
                    type="button"
                    disabled={deletableSelectedTasks.length === 0}
                    onClick={requestBulkDelete}
                  >
                    <Trash2 size={15} />
                    
                    {t("删除")}
                  </button>
                  <button
                    className="task-bulk-clear"
                    type="button"
                    aria-label={t("清除任务选择")}
                    title={t("清除选择")}
                    onClick={() => setSelectedTaskIds([])}
                  >
                    <X size={16} />
                  </button>
                </div>
              </section>
            )}

            <div className="task-table">
              <div className="task-table-head">
                <label className="task-selection-control task-select-all">
                  <input
                    type="checkbox"
                    aria-label={t("选择当前筛选中的全部任务")}
                    checked={allVisibleTasksSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate =
                          selectedVisibleTaskCount > 0 &&
                          !allVisibleTasksSelected;
                      }
                    }}
                    onChange={toggleAllVisibleTasks}
                  />
                  <span aria-hidden="true">
                    <Check size={13} />
                  </span>
                </label>
                <span>{t("任务")}</span>
                <span>{t("状态")}</span>
                <span>{t("进度")}</span>
                <span>{t("最后更新")}</span>
                <span />
              </div>
              {filteredTasks.map((task) => (
                <div
                  className={`task-table-row-shell ${
                    selectedTaskIds.includes(task.id) ? "is-selected" : ""
                  } ${task.status === "失败" ? "is-failed" : ""}`}
                  key={task.id}
                >
                  <label className="task-selection-control">
                    <input
                      type="checkbox"
                      aria-label={t("选择任务：{title}", { title: task.title })}
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                    <span aria-hidden="true">
                      <Check size={13} />
                    </span>
                  </label>
                  <button
                    className="task-table-row"
                    type="button"
                    aria-label={t("打开任务：{title}", { title: task.title })}
                    onClick={() => openTask(task.id)}
                  >
                  <span className="task-table-title">
                    <span className="task-table-title-line">
                      <strong>{task.title}</strong>
                      {task.pinned && (
                        <em title={t("首页主任务")}>
                          <Pin size={11} />
                          
                          {t("首页任务")}
                        </em>
                      )}
                    </span>
                    <small>{task.description}</small>
                    {task.status === "失败" && task.lastError && (
                      <small
                        className={`task-table-error ${
                          task.errorCode === "RECOVERY_READY" ? "is-ready" : ""
                        }`}
                      >
                        {task.errorCode === "RECOVERY_READY" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        {task.lastError}
                      </small>
                    )}
                    <small className="task-table-schedule">
                      <CalendarDays size={12} />
                      {formatTaskSchedule(task)}
                    </small>
                  </span>
                  <em className={`status-label status-${task.status}`}>{t(task.status)}</em>
                  <span className="table-progress">
                    <i><b style={{ width: `${task.progress}%` }} /></i>
                    <small>{task.progress}%</small>
                  </span>
                  <span className="task-updated">{task.updated}</span>
                  <ChevronRight size={16} />
                  </button>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="task-empty-state">
                  <Search size={22} />
                  <strong>
                    {taskListQuery.trim()
                      ? t("没有找到“{trim}”", { trim: taskListQuery.trim() })
                      : t("这个状态下还没有任务")}
                  </strong>
                  <p>
                    {t(taskListQuery.trim()
                      ? t("可以搜索任务名称、来源地址或运行计划。")
                      : t("切换状态筛选，查看其他任务。"))}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (taskListQuery.trim()) {
                        setTaskListQuery("");
                      } else {
                        chooseTaskFilter("全部");
                      }
                    }}
                  >
                    {t(taskListQuery.trim() ? t("清除搜索") : t("查看全部任务"))}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeView === "approvals" && (
          <section className="approvals-view">
            {approvals.length ? (
              <>
                <div className="approval-inbox-toolbar">
                  <div className="approval-inbox-overview">
                    <span>
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <small>{t("审批收件箱")}</small>
                      <strong>{t("{activeApprovalCount} 项操作等待决定", { activeApprovalCount })}</strong>
                    </div>
                    <div className="approval-risk-summary" aria-label={t("待确认风险分布")}>
                      <span>
                        <i className="risk-dot high" />
                        
                        {t("高风险")} {approvalRiskCounts["高风险"]}
                      </span>
                      <span>
                        <i className="risk-dot medium" />
                        
                        {t("中风险")} {approvalRiskCounts["中风险"]}
                      </span>
                      <span>
                        <i className="risk-dot low" />
                        
                        {t("低风险")} {approvalRiskCounts["低风险"]}
                      </span>
                      {deferredApprovalCount > 0 && (
                        <span className="is-deferred">
                          <Clock3 size={12} />
                          
                          {t("稍后")} {deferredApprovalCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="approval-inbox-controls">
                    <label className="approval-list-search">
                      <Search size={16} />
                      <input
                        type="search"
                        aria-label={t("搜索待确认操作")}
                        autoComplete="off"
                        placeholder={t("搜索操作、对象或关联任务")}
                        value={approvalListQuery}
                        onChange={(event) =>
                          setApprovalListQuery(event.target.value)
                        }
                      />
                      {approvalListQuery && (
                        <button
                          type="button"
                          aria-label={t("清除审批搜索")}
                          onClick={() => setApprovalListQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <div
                      className="approval-risk-filters"
                      role="tablist"
                      aria-label={t("审批风险筛选")}
                    >
                      {approvalRiskFilters.map((filter) => (
                        <button
                          className={approvalRiskFilter === filter ? "active" : ""}
                          key={filter}
                          type="button"
                          role="tab"
                          aria-selected={approvalRiskFilter === filter}
                          onClick={() => chooseApprovalRiskFilter(filter)}
                        >
                          {filter === "稍后" && <Clock3 size={13} />}
                          {t(filter)}
                          <span>{approvalRiskCounts[filter]}</span>
                        </button>
                      ))}
                    </div>
                    <div className="approval-result-meta">
                      <span className="approval-result-count" aria-live="polite">{t("显示 {length} /{value}{value2}{value3}项", { length: filteredApprovals.length, value: " ", value2: approvalRiskFilter === "稍后"
                          ? deferredApprovalCount
                          : activeApprovalCount, value3: " " })}</span>
                      <button
                        className="view-link-copy"
                        type="button"
                        aria-label={t("复制当前审批链接")}
                        title={t("复制当前审批链接")}
                        onClick={() =>
                          selectedApproval && copyApprovalLink(selectedApproval)
                        }
                      >
                        <Link2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {selectedApprovals.length > 0 && (
                  <section
                    className="approval-bulk-bar"
                    role="toolbar"
                    aria-label={t("批量审批操作")}
                  >
                    <div className="approval-bulk-summary">
                      <span>
                        <ListChecks size={17} />
                      </span>
                      <span>
                        <strong>{t("已选择 {length} 项操作", { length: selectedApprovals.length })}</strong>
                        <small>
                          {selectedHighRiskApprovalCount
                            ? t("{selectedHighRiskApprovalCount} 项高风险操作只能逐项批准", { selectedHighRiskApprovalCount })
                            : t("涉及 {selectedApprovalTaskCount} 个任务", { selectedApprovalTaskCount })}
                        </small>
                      </span>
                    </div>
                    <div className="approval-bulk-actions">
                      <button
                        className="approval-bulk-select-all"
                        type="button"
                        onClick={toggleAllVisibleApprovals}
                      >
                        <ListChecks size={15} />
                        {(allVisibleApprovalsSelected ? t("取消全选") : t("全选当前"))}
                      </button>
                      <button
                        className="approve"
                        type="button"
                        disabled={bulkApprovableApprovals.length === 0}
                        onClick={() => requestBulkApprovalDecision("approve")}
                      >
                        <Check size={15} />
                        
                        {t("批量批准")}
                        {bulkApprovableApprovals.length > 0 &&
                          ` ${bulkApprovableApprovals.length}`}
                      </button>
                      <button
                        className="reject"
                        type="button"
                        onClick={() => requestBulkApprovalDecision("reject")}
                      >
                        <Ban size={15} />
                        
                        {t("批量拒绝")} {selectedApprovals.length}
                      </button>
                      <button
                        className="approval-bulk-clear"
                        type="button"
                        aria-label={t("清除审批选择")}
                        title={t("清除选择")}
                        onClick={() => setSelectedApprovalIds([])}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </section>
                )}

                <div className="approval-queue">
                  <div className="approval-queue-heading">
                    {approvalRiskFilter === "稍后" ? (
                      <span
                        className="approval-snooze-heading-icon"
                        aria-hidden="true"
                      >
                        <Clock3 size={14} />
                      </span>
                    ) : (
                      <label className="approval-selection-control approval-select-all">
                        <input
                          type="checkbox"
                          aria-label={t("选择当前筛选中的全部审批")}
                          checked={allVisibleApprovalsSelected}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate =
                                selectedVisibleApprovalCount > 0 &&
                                !allVisibleApprovalsSelected;
                            }
                          }}
                          onChange={toggleAllVisibleApprovals}
                        />
                        <span aria-hidden="true">
                          <Check size={13} />
                        </span>
                      </label>
                    )}
                    <span>
                      {t(approvalRiskFilter === "稍后" ? t("稍后提醒") : t("审批队列"))}
                    </span>
                    <strong>{t("{length} 项", { length: filteredApprovals.length })}</strong>
                  </div>
                  {filteredApprovals.map((item) => (
                    <div
                      className={`approval-queue-row-shell ${
                        selectedApproval?.id === item.id ? "selected" : ""
                      } ${selectedApprovalIds.includes(item.id) ? "is-checked" : ""} ${
                        deferredApprovalIds.has(item.id) ? "is-snoozed" : ""
                      }`}
                      key={item.id}
                    >
                      {deferredApprovalIds.has(item.id) ? (
                        <span
                          className="approval-snooze-row-icon"
                          aria-hidden="true"
                        >
                          <Clock3 size={14} />
                        </span>
                      ) : (
                        <label className="approval-selection-control">
                          <input
                            type="checkbox"
                            aria-label={t("选择审批：{title}", { title: item.title })}
                            checked={selectedApprovalIds.includes(item.id)}
                            onChange={() => toggleApprovalSelection(item.id)}
                          />
                          <span aria-hidden="true">
                            <Check size={13} />
                          </span>
                        </label>
                      )}
                      <button
                        className="approval-queue-main"
                        type="button"
                        aria-pressed={selectedApproval?.id === item.id}
                        aria-label={t("查看审批：{title}", { title: item.title })}
                        onClick={() => chooseApproval(item.id)}
                      >
                        <item.icon size={17} />
                        <span className="approval-queue-copy">
                          <span className="approval-queue-topline">
                            <strong>{item.title}</strong>
                            <em className={`approval-risk risk-${item.risk}`}>
                              {t(item.risk)}
                            </em>
                          </span>
                          <small>
                            {deferredApprovalIds.has(item.id)
                              ? t("{formatApprovalDeferredUntil} 重新提醒", { formatApprovalDeferredUntil: formatApprovalDeferredUntil(
                                  approvalDeferrals[item.id],
                                  approvalClock,
                                ) })
                              : `${item.target} · ${item.requestedAt}`}
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                  {filteredApprovals.length === 0 && (
                    <div className="approval-queue-empty">
                      {approvalRiskFilter === "稍后" ? (
                        <Clock3 size={22} />
                      ) : activeApprovalCount === 0 ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <Search size={22} />
                      )}
                      <strong>
                        {t(approvalRiskFilter === "稍后"
                          ? t("没有安排稍后提醒的操作")
                          : activeApprovalCount === 0
                            ? t("当前没有需要立即处理的操作")
                            : t("没有匹配的待确认操作"))}
                      </strong>
                      <small>
                        {approvalRiskFilter === "稍后"
                          ? t("使用“稍后处理”后，操作会在这里显示并按时重新提醒。")
                          : activeApprovalCount === 0 && deferredApprovalCount > 0
                            ? t("{deferredApprovalCount} 项操作已安排稍后提醒，期间不会执行外部动作。", { deferredApprovalCount })
                            : t("换一个关键词或风险等级，待确认操作不会被移除。")}
                      </small>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovalListQuery("");
                          chooseApprovalRiskFilter(
                            activeApprovalCount === 0 &&
                              deferredApprovalCount > 0
                              ? "稍后"
                              : "全部",
                          );
                        }}
                      >
                        {t(activeApprovalCount === 0 && deferredApprovalCount > 0
                          ? t("查看稍后提醒")
                          : t("清除筛选"))}
                      </button>
                    </div>
                  )}
                </div>

                {selectedApproval && (
                  <div className="approval-detail" ref={approvalDetailRef}>
                    <div className="approval-review-heading">
                      <div>
                        <span className="approval-kicker">
                          {selectedApprovalIsDeferred ? (
                            <Clock3 size={15} />
                          ) : (
                            <ShieldCheck size={15} />
                          )}
                          {t(selectedApprovalIsDeferred
                            ? t("已安排稍后处理")
                            : t("等待你的确认"))}
                        </span>
                        <em
                          className={`approval-risk risk-${selectedApproval.risk}`}
                        >
                          {t(selectedApproval.risk)}
                        </em>
                      </div>
                      <h2>{selectedApproval.title}</h2>
                      <p>{selectedApproval.reason}</p>
                    </div>

                    {selectedApprovalIsDeferred &&
                      selectedApprovalDeferredUntil && (
                        <div
                          className="approval-snoozed-banner"
                          role="status"
                        >
                          <Clock3 size={18} />
                          <span>
                            <strong>{t("{formatApprovalDeferredUntil}{value}重新提醒", { formatApprovalDeferredUntil: formatApprovalDeferredUntil(
                                selectedApprovalDeferredUntil,
                                approvalClock,
                              ), value: " " })}</strong>
                            <small>
                              
                              {t("到期前不会执行这项操作，也不会计入当前待办。")}
                            </small>
                          </span>
                        </div>
                      )}

                    <div className="approval-context-grid">
                      <div>
                        <Link2 size={16} />
                        <span>
                          <small>{t("关联任务")}</small>
                          <button
                            type="button"
                            onClick={() => openTask(selectedApproval.taskId)}
                          >
                            {tasks.find((task) => task.id === selectedApproval.taskId)
                              ?.title ?? selectedApproval.taskId}
                            <ChevronRight size={13} />
                          </button>
                        </span>
                      </div>
                      <div>
                        <selectedApproval.icon size={16} />
                        <span>
                          <small>{t("执行对象")}</small>
                          <strong>{selectedApproval.target}</strong>
                        </span>
                      </div>
                      <div>
                        <ShieldCheck size={16} />
                        <span>
                          <small>{t("授权范围")}</small>
                          <strong>{selectedApproval.scope}</strong>
                        </span>
                      </div>
                      <div>
                        <Timer size={16} />
                        <span>
                          <small>{t("请求时间 · 失效时间")}</small>
                          <strong>
                            {selectedApproval.requestedAt} · {selectedApproval.expiresAt}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="approval-explanation">
                      <span>
                        {selectedApprovalIsDeferred ? (
                          <Clock3 size={17} />
                        ) : (
                          <AlertTriangle size={17} />
                        )}
                      </span>
                      <div>
                        <strong>
                          {t(selectedApprovalIsDeferred
                            ? t("当前保持什么状态")
                            : t("批准后会发生什么"))}
                        </strong>
                        <p>
                          {selectedApprovalIsDeferred
                            ? t("操作保持未执行，关联任务继续停在安全检查点。")
                            : selectedApproval.impact}
                        </p>
                      </div>
                    </div>

                    <div className="approval-policy-review">
                      <div>
                        <span>
                          <ShieldCheck size={17} />
                        </span>
                        <div>
                          <strong>{t("策略检查已通过")}</strong>
                          <small>{selectedApproval.policy}</small>
                        </div>
                      </div>
                      <div className="approval-scope">
                        <span><Check size={14} />  {t("只允许这一次")}</span>
                        <span><Check size={14} />  {t("决策写入审计记录")}</span>
                        <span><Check size={14} />  {t("拒绝后自动暂停任务")}</span>
                      </div>
                    </div>

                    {isAgentApprovalId(selectedApproval.id) &&
                    !selectedApprovalIsDeferred ? (
                      <label className="approval-remember">
                        <input
                          type="checkbox"
                          checked={rememberApprovalId === selectedApproval.id}
                          onChange={(event) =>
                            setRememberApprovalId(
                              event.target.checked ? selectedApproval.id : null,
                            )
                          }
                        />
                        <span>
                          
                          {t("以后在这个项目里自动批准这条命令")}
                          <small>{t("只限同一工具、同一条命令；拼接命令不会被记住")}</small>
                        </span>
                      </label>
                    ) : null}
                    <div
                      className={`approval-detail-actions ${
                        selectedApprovalIsDeferred ? "is-deferred" : ""
                      }`}
                    >
                      {selectedApprovalIsDeferred ? (
                        <>
                          <button
                            className="confirm restore"
                            type="button"
                            onClick={() =>
                              restoreDeferredApproval(selectedApproval.id)
                            }
                          >
                            <RotateCcw size={16} />
                            
                            {t("提前恢复到待确认")}
                          </button>
                          <button
                            type="button"
                            onClick={() => openTask(selectedApproval.taskId)}
                          >
                            <Link2 size={16} />
                            
                            {t("查看关联任务")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="confirm"
                            type="button"
                            onClick={requestApproveCurrent}
                          >
                            {selectedApproval.risk === "高风险" ? (
                              <ShieldCheck size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                            {selectedApproval.risk === "高风险"
                              ? t("核对后批准")
                              : formatApprovalDecisionLabel(selectedApproval.action)}
                          </button>
                          <button type="button" onClick={holdCurrent}>
                            <Timer size={16} />
                            
                            {t("稍后处理")}
                          </button>
                          <button
                            className="danger"
                            type="button"
                            onClick={requestRejectApproval}
                          >
                            <Ban size={16} />
                            
                            {t("拒绝操作")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-view">
                <CheckCircle2 size={34} />
                <h2>{t("所有操作都处理完了")}</h2>
                <p>{t("任务会继续在后台运行，有新的决定需要你处理时会再次提醒。")}</p>
                <button type="button" onClick={() => openView("home")}>{t("返回首页")}</button>
              </div>
            )}
          </section>
        )}

        {activeView === "artifacts" && (
          <section className="artifacts-view">
            <div className="artifact-overview">
              <div className="artifact-overview-title">
                <span>
                  <Files size={21} />
                </span>
                <div>
                  <small>{(artifactScopeTask ? t("任务成果") : t("成果库"))}</small>
                  <h2>
                    {artifactScopeTask
                      ? artifactScopeTask.title
                      : t("AI 已交付的工作成果")}
                  </h2>
                  <p>
                    {t(artifactScopeTask
                      ? t("这里只显示当前任务生成的文件和证据。")
                      : t("所有成果都保存在本机，并与原始任务和审计记录关联。"))}
                  </p>
                </div>
              </div>
              <div className="artifact-overview-metrics">
                <span>
                  <small>{t("全部成果")}</small>
                  <strong>{artifactStats.total}</strong>
                </span>
                <span>
                  <small>{t("完成报告")}</small>
                  <strong>{artifactStats.reports}</strong>
                </span>
                <span>
                  <small>{t("截图证据")}</small>
                  <strong>{artifactStats.evidence}</strong>
                </span>
                <span>
                  <small>{t("本机占用")}</small>
                  <strong>{artifactStats.size.toFixed(1)} KB</strong>
                </span>
              </div>
            </div>

            <div className="artifact-toolbar">
              <div className="artifact-filter-row">
                <div
                  className="artifact-filter-tabs"
                  role="tablist"
                  aria-label={t("成果筛选")}
                >
                  {artifactFilters.map((filter) => {
                    const count =
                      filter === "全部"
                        ? scopedArtifacts.length
                        : filter === "重点"
                          ? scopedArtifacts.filter((artifact) => artifact.starred)
                              .length
                          : scopedArtifacts.filter(
                              (artifact) => artifact.type === filter,
                            ).length;
                    return (
                      <button
                        className={artifactFilter === filter ? "active" : ""}
                        key={filter}
                        type="button"
                        role="tab"
                        aria-selected={artifactFilter === filter}
                        onClick={() => chooseArtifactFilter(filter)}
                      >
                        {filter === "重点" && <Star size={13} />}
                        {t(filter)}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
                {artifactScopeTask && (
                  <button
                    className="artifact-scope-clear"
                    type="button"
                    onClick={() => {
                      setArtifactTaskId(null);
                      setArtifactFilter("全部");
                      setArtifactListQuery("");
                      const nextArtifactId = artifacts[0]?.id ?? "";
                      setSelectedArtifactId(nextArtifactId);
                      writeWorkspaceRoute(
                        {
                          view: "artifacts",
                          taskId: null,
                          runId: null,
                          artifactId: nextArtifactId || null,
                        },
                        "replace",
                        canReturnToWorkspaceParent(),
                      );
                    }}
                  >
                    <X size={14} />
                    
                    {t("查看全部任务")}
                  </button>
                )}
              </div>

              <div className="artifact-list-controls">
                <label className="artifact-list-search">
                  <Search size={16} />
                  <input
                    type="search"
                    aria-label={t("搜索成果列表")}
                    autoComplete="off"
                    placeholder={t("搜索成果名称、文件名或格式")}
                    value={artifactListQuery}
                    onChange={(event) => setArtifactListQuery(event.target.value)}
                  />
                  {artifactListQuery && (
                    <button
                      type="button"
                      aria-label={t("清除成果搜索")}
                      onClick={() => setArtifactListQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                <label className="artifact-sort-control">
                  <ArrowUpDown size={15} />
                  <span>{t("排序")}</span>
                  <select
                    aria-label={t("成果排序")}
                    value={artifactSort}
                    onChange={(event) =>
                      setArtifactSort(event.target.value as ArtifactSort)
                    }
                  >
                    <option value={t("最近更新")}>{t("最近更新")}</option>
                    <option value={t("重点优先")}>{t("重点优先")}</option>
                    <option value={t("文件名")}>{t("文件名")}</option>
                  </select>
                </label>

                <span className="artifact-result-count" aria-live="polite">{t("显示 {length} / {length2} 项", { length: filteredArtifacts.length, length2: scopedArtifacts.length })}</span>
              </div>
            </div>

            <div className="artifact-workspace">
              <aside className="artifact-list" aria-label={t("成果列表")}>
                <div className="artifact-list-heading">
                  <span>
                    <strong>{t("成果列表")}</strong>
                    <small>{t(artifactSort)}</small>
                  </span>
                  <em>{t("{length} 项", { length: filteredArtifacts.length })}</em>
                </div>
                <div className="artifact-list-items">
                  {artifactGroups.map((group, groupIndex) => {
                    const grouped = !artifactTaskId;
                    const searching = Boolean(artifactListQuery.trim());
                    const open =
                      !grouped ||
                      searching ||
                      (openArtifactGroups[group.key] ??
                        (groupIndex === 0 ||
                          group.items.some((artifact) => artifact.id === selectedArtifact?.id)));
                    return (
                      <div className="artifact-group" key={group.key || "none"}>
                        {grouped && (
                          <button
                            className={`artifact-group-head${open ? " open" : ""}`}
                            type="button"
                            aria-expanded={open}
                            onClick={() =>
                              setOpenArtifactGroups((current) => ({ ...current, [group.key]: !open }))
                            }
                          >
                            <ChevronRight size={14} />
                            <strong>{group.title || t("其他成果")}</strong>
                            <em>{group.items.length}</em>
                          </button>
                        )}
                        {open && group.items.map((artifact) => {
                    const ArtifactIcon = artifactIconMap[artifact.type];
                    return (
                      <div
                        className={`artifact-list-row ${
                          selectedArtifact?.id === artifact.id ? "selected" : ""
                        }`}
                        key={artifact.id}
                      >
                        <button
                          className="artifact-list-main"
                          type="button"
                          onClick={() => selectArtifact(artifact.id)}
                        >
                          <span className={`artifact-type-icon type-${artifact.type}`}>
                            <ArtifactIcon size={18} />
                          </span>
                          <span className="artifact-list-copy">
                            <span>
                              <em>{t(artifact.type)}</em>
                              <small>{artifact.updated}</small>
                            </span>
                            <strong>{artifact.title}</strong>
                            <span className="artifact-file-meta">
                              <small>{artifact.filename}</small>
                              <em>
                                {artifact.format} · {artifact.sizeKb.toFixed(1)} KB
                              </em>
                            </span>
                          </span>
                        </button>
                        <button
                          className={`artifact-star ${artifact.starred ? "active" : ""}`}
                          type="button"
                          aria-label={
                            artifact.starred
                              ? t("取消重点标记：{title}", { title: artifact.title })
                              : t("标记为重点：{title}", { title: artifact.title })
                          }
                          title={artifact.starred ? t("取消重点") : t("标记为重点")}
                          onClick={() => toggleArtifactStar(artifact)}
                        >
                          <Star size={15} fill={artifact.starred ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                        })}
                      </div>
                    );
                  })}
                  {filteredArtifacts.length === 0 && (
                    <div className="artifact-list-empty">
                      {artifactListQuery.trim() ? <Search size={22} /> : <Files size={22} />}
                      <strong>
                        {artifactListQuery.trim()
                          ? t("没有找到“{trim}”", { trim: artifactListQuery.trim() })
                          : t("这个分类还没有成果")}
                      </strong>
                      <small>
                        {t(artifactListQuery.trim()
                          ? t("可以尝试成果名称、文件名、格式或关联任务。")
                          : t("切换到其他分类查看已有交付文件。"))}
                      </small>
                      <button
                        type="button"
                        onClick={() =>
                          artifactListQuery.trim()
                            ? setArtifactListQuery("")
                            : chooseArtifactFilter("全部")
                        }
                      >
                        {t(artifactListQuery.trim() ? t("清除搜索") : t("查看全部成果"))}
                      </button>
                    </div>
                  )}
                </div>
              </aside>

              {selectedArtifact ? (
                <article className="artifact-preview">
                  <header className="artifact-preview-heading">
                    <div>
                      <span className={`artifact-preview-icon type-${selectedArtifact.type}`}>
                        <SelectedArtifactIcon size={22} />
                      </span>
                      <span>
                        <small>
                          {t(selectedArtifact.type)} · {t(selectedArtifact.status)}
                        </small>
                        <h2>{selectedArtifact.title}</h2>
                        <p>{selectedArtifact.description}</p>
                      </span>
                    </div>
                    <div className="artifact-preview-actions" aria-label={t("成果操作")}>
                      {artifactCanBeEdited(selectedArtifact) && (
                        <button
                          className="edit"
                          type="button"
                          onClick={() => openArtifactEditor(selectedArtifact)}
                        >
                          <Pencil size={16} />
                          <span>{t("编辑")}</span>
                        </button>
                      )}
                      <button
                        className="view-link-copy artifact-link-copy"
                        type="button"
                        aria-label={t("复制当前成果链接")}
                        title={t("复制当前成果链接")}
                        onClick={() => copyCurrentViewLink(t("成果链接"))}
                      >
                        <Link2 size={16} />
                        <span>{t("复制链接")}</span>
                      </button>
                      <button
                        className={selectedArtifact.starred ? "active" : ""}
                        type="button"
                        aria-label={
                          selectedArtifact.starred
                            ? t("取消重点标记")
                            : t("标记为重点")
                        }
                        title={
                          selectedArtifact.starred ? t("取消重点") : t("标记为重点")
                        }
                        onClick={() => toggleArtifactStar(selectedArtifact)}
                      >
                        <Star
                          size={16}
                          fill={selectedArtifact.starred ? "currentColor" : "none"}
                        />
                        <span>{t(selectedArtifact.starred ? t("取消重点") : "重点")}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={t("复制成果内容")}
                        title={t("复制内容")}
                        onClick={() => copyArtifactContent(selectedArtifact)}
                      >
                        <Copy size={16} />
                        <span>{t("复制")}</span>
                      </button>
                      {selectedArtifact.file ? (
                        desktopApp && selectedArtifact.file.absolutePath ? (
                          <button
                            type="button"
                            aria-label={t("在文件夹中显示")}
                            title={selectedArtifact.file.absolutePath}
                            onClick={() =>
                              revealPath(selectedArtifact.file!.absolutePath!).catch((error: unknown) =>
                                setNotice(error instanceof Error ? error.message : String(error)),
                              )
                            }
                          >
                            <FolderOpen size={16} />
                            <span>{t("在文件夹中显示")}</span>
                          </button>
                        ) : null
                      ) : (
                        <button
                          className="delete"
                          type="button"
                          aria-label={t("删除成果")}
                          title={t("删除成果")}
                          onClick={() => requestDeleteArtifact(selectedArtifact)}
                        >
                          <Trash2 size={16} />
                          <span>{t("删除")}</span>
                        </button>
                      )}
                      {!selectedArtifact.file?.binary && (
                        <button
                          className="download"
                          type="button"
                          disabled={Boolean(selectedArtifact.file && !selectedArtifact.file.loaded)}
                          onClick={() => downloadArtifact(selectedArtifact)}
                        >
                          <Download size={16} />
                          {t("下载")}
                        </button>
                      )}
                    </div>
                  </header>

                  <div className="artifact-preview-meta">
                    <span>
                      <small>{t("文件名")}</small>
                      <strong>{selectedArtifact.filename}</strong>
                    </span>
                    <span>
                      <small>{t("格式")}</small>
                      <strong>
                        {selectedArtifact.format} ·{" "}
                        {selectedArtifact.sizeKb.toFixed(1)} KB
                      </strong>
                    </span>
                    <span>
                      <small>{t("当前版本")}</small>
                      <strong>v{selectedArtifact.version ?? 1}</strong>
                    </span>
                    <span>
                      <small>{t("最近更新")}</small>
                      <strong>{selectedArtifact.updated}</strong>
                    </span>
                  </div>

                  <div className="artifact-highlights" aria-label={t("成果摘要")}>
                    {selectedArtifact.highlights.map((highlight) => (
                      <span key={highlight}>
                        <CheckCircle2 size={14} />
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <section className="artifact-content-preview">
                    <div>
                      <span>{t("内容预览")}</span>
                      {isMarkdown(selectedArtifact.format, selectedArtifact.filename) &&
                        !selectedArtifact.table &&
                        !selectedArtifact.file?.binary && (
                          <span className="artifact-view-toggle" role="group" aria-label={t("显示方式")}>
                            <button
                              type="button"
                              aria-pressed={!artifactShowSource}
                              onClick={() => setArtifactShowSource(false)}
                            >
                              {t("排版")}
                            </button>
                            <button
                              type="button"
                              aria-pressed={artifactShowSource}
                              onClick={() => setArtifactShowSource(true)}
                            >
                              {t("原文")}
                            </button>
                          </span>
                        )}
                      <em>
                        v{selectedArtifact.version ?? 1} ·{" "}
                        {t(artifactCanBeEdited(selectedArtifact)
                          ? t("可修订")
                          : t("原始记录只读"))}
                      </em>
                    </div>
                    {selectedArtifact.table ? (
                      <div className="artifact-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              {selectedArtifact.table.columns.map((column) => (
                                <th key={column}>{column}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedArtifact.table.rows.map((row, rowIndex) => (
                              <tr key={`${selectedArtifact.id}-${rowIndex}`}>
                                {row.map((cell, cellIndex) => (
                                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : selectedArtifact.file && !selectedArtifact.file.loaded ? (
                      <p className="artifact-file-note">
                        {selectedArtifact.file.error
                          ? t("读不到这个文件：{error}", { error: selectedArtifact.file.error })
                          : t("正在读取文件…")}
                      </p>
                    ) : selectedArtifact.file?.binary ? (
                      <p className="artifact-file-note">
                        {t("这个文件不是文本，无法在这里预览。")}
                        {selectedArtifact.file.absolutePath ? ` ${selectedArtifact.file.absolutePath}` : ""}
                      </p>
                    ) : (
                      <>
                        {isMarkdown(selectedArtifact.format, selectedArtifact.filename) && !artifactShowSource ? (
                          <MarkdownView className="artifact-markdown" text={selectedArtifact.content} />
                        ) : (
                          <pre>{selectedArtifact.content}</pre>
                        )}
                        {selectedArtifact.file?.truncated && (
                          <p className="artifact-file-note">{t("文件较大，这里只显示前 1 MB。")}</p>
                        )}
                      </>
                    )}
                  </section>

                  <footer className="artifact-preview-footer">
                    <span>
                      <ShieldCheck size={16} />
                      <span>
                        <small>{t("来源已验证")}</small>
                        <strong>
                          {tasks.find(
                            (task) => task.id === selectedArtifact.taskId,
                          )?.title ?? selectedArtifact.taskId}
                        </strong>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => openTask(selectedArtifact.taskId)}
                    >
                      
                      {t("查看关联任务")}
                      <ChevronRight size={14} />
                    </button>
                  </footer>
                </article>
              ) : (
                <div className="artifact-preview-empty">
                  <Files size={28} />
                  <strong>{t("选择一个成果查看内容")}</strong>
                  <p>{t("切换筛选条件，或从任务详情进入对应成果。")}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeView === "activity" && (
          <section className="activity-view">
            <div className="activity-toolbar">
              <div className="activity-toolbar-primary">
                <div className="activity-toolbar-title">
                  <span>{(activityTask ? t("任务审计") : t("可信审计"))}</span>
                  <strong>{t("{length} 条记录", { length: scopedActivityLog.length })}</strong>
                </div>
                <div
                  className="activity-filter-tabs"
                  role="tablist"
                  aria-label={t("运行记录筛选")}
                >
                  {activityFilters.map((filter) => (
                    <button
                      className={activityFilter === filter ? "active" : ""}
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={activityFilter === filter}
                      onClick={() => chooseActivityFilter(filter)}
                    >
                      {t(filter)}
                      <span>{activityCounts[filter]}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="activity-export"
                  type="button"
                  onClick={exportActivity}
                >
                  <Download size={15} />
                  
                  {t("导出全部")}
                </button>
              </div>

              <div className="activity-list-controls">
                <label className="activity-list-search">
                  <Search size={16} />
                  <input
                    type="search"
                    aria-label={t("搜索运行记录")}
                    autoComplete="off"
                    placeholder={t("搜索事件、任务或事件 ID")}
                    value={activityListQuery}
                    onChange={(event) => setActivityListQuery(event.target.value)}
                  />
                  {activityListQuery && (
                    <button
                      type="button"
                      aria-label={t("清除运行记录搜索")}
                      onClick={() => setActivityListQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                <label className="activity-sort-control">
                  <ArrowUpDown size={15} />
                  <span>{t("时间")}</span>
                  <select
                    aria-label={t("运行记录排序")}
                    value={activitySort}
                    onChange={(event) =>
                      setActivitySort(event.target.value as ActivitySort)
                    }
                  >
                    <option value={t("最新优先")}>{t("最新优先")}</option>
                    <option value={t("最早优先")}>{t("最早优先")}</option>
                  </select>
                </label>

                <span className="activity-result-count" aria-live="polite">{t("显示 {length} / {length2} 条", { length: filteredActivityLog.length, length2: scopedActivityLog.length })}</span>
              </div>
            </div>

            <div className="activity-summary">
              <Activity size={18} />
              <div>
                <strong>
                  {activityTask?.title ?? t("所有任务与系统事件")}
                </strong>
                <small>
                  {activityTask
                    ? t("{formatTaskSchedule} · 仅显示此任务的记录", { formatTaskSchedule: formatTaskSchedule(activityTask) })
                    : t("任务执行、审批决定和系统变更都保存在这条时间线上")}
                </small>
              </div>
              <div className="activity-summary-actions">
                {activityTask && (
                  <button
                    className="activity-scope-clear"
                    type="button"
                    aria-label={t("取消“{title}”任务筛选", { title: activityTask.title })}
                    onClick={clearActivityTaskScope}
                  >
                    <X size={14} />
                    
                    {t("查看全部")}
                  </button>
                )}
                <span
                  className={`live-state ${
                    activityTask && activityTask.status !== "运行中" ? "paused" : ""
                  }`}
                >
                  <i />
                  {t(activityTask?.status ?? t("持续记录"))}
                </span>
              </div>
            </div>

            <div className="activity-workspace">
              <div className="activity-timeline" aria-live="polite">
                {filteredActivityLog.map((item) => {
                  const ItemIcon = activityIconMap[item.icon] ?? Activity;
                  const itemTask = item.taskId
                    ? tasks.find((task) => task.id === item.taskId) ?? null
                    : null;
                  return (
                    <div
                      className={`timeline-row ${
                        selectedActivity?.id === item.id ? "selected" : ""
                      }`}
                      key={item.id}
                    >
                      <time dateTime={item.createdAt}>{item.time}</time>
                      <button
                        className="timeline-row-main"
                        type="button"
                        aria-pressed={selectedActivity?.id === item.id}
                        onClick={() => selectActivityItem(item)}
                      >
                        <span className={`timeline-icon ${item.tone}`}>
                          <ItemIcon size={17} />
                        </span>
                        <span className="timeline-content">
                          <span className={`timeline-kind kind-${item.kind}`}>
                            {t(item.kind)}
                          </span>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                          <small>
                            {itemTask?.title ??
                              (item.kind === "系统" ? t("工作区系统") : t("无关联任务"))}
                          </small>
                        </span>
                      </button>
                      <button
                        className="timeline-detail-button"
                        type="button"
                        onClick={() => selectActivityItem(item)}
                      >
                        
                        {t("查看详情")}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
                {filteredActivityLog.length === 0 && (
                  <div className="activity-empty">
                    <Search size={22} />
                    <strong>
                      {activityListQuery.trim()
                        ? t("没有找到“{trim}”", { trim: activityListQuery.trim() })
                        : activityTask
                          ? activityFilter === "全部"
                            ? t("这个任务还没有运行记录")
                            : t("这个任务还没有此类记录")
                          : t("这个分类还没有记录")}
                    </strong>
                    <small>
                      {t(activityListQuery.trim()
                        ? t("可以尝试事件标题、任务名称或事件 ID。")
                        : t("切换分类或查看全部任务的审计记录。"))}
                    </small>
                    <button
                      type="button"
                      onClick={() => {
                        if (activityListQuery.trim()) {
                          setActivityListQuery("");
                        } else if (activityFilter !== "全部") {
                          chooseActivityFilter("全部");
                        } else {
                          clearActivityTaskScope();
                        }
                      }}
                    >
                      {t(activityListQuery.trim()
                        ? t("清除搜索")
                        : activityFilter !== "全部"
                          ? t("查看此任务全部记录")
                          : t("查看全部任务"))}
                    </button>
                  </div>
                )}
              </div>

              {selectedActivity ? (
                <aside
                  className="activity-inspector"
                  ref={activityInspectorRef}
                  tabIndex={-1}
                  aria-label={t("审计事件详情")}
                >
                  <header className="activity-inspector-heading">
                    <span className={`timeline-icon ${selectedActivity.tone}`}>
                      <SelectedActivityIcon size={19} />
                    </span>
                    <div>
                      <small>{t("{kind}事件 · 已记录", { kind: t(selectedActivity.kind) })}</small>
                      <h2>{selectedActivity.title}</h2>
                    </div>
                  </header>

                  <p className="activity-inspector-detail">
                    {selectedActivity.detail}
                  </p>

                  <div className="activity-inspector-facts">
                    <span>
                      <small>{t("发生时间")}</small>
                      <strong>
                        {formatAuditTimestamp(selectedActivity.createdAt)}
                      </strong>
                    </span>
                    <span>
                      <small>{t("事件类型")}</small>
                      <strong>{t(selectedActivity.kind)}</strong>
                    </span>
                    <span>
                      <small>{t("关联对象")}</small>
                      <strong>
                        {selectedActivityTask?.title ?? t("全局工作区")}
                      </strong>
                    </span>
                    <span>
                      <small>{t("触发来源")}</small>
                      <strong>
                        {t(selectedActivity.kind === "任务"
                          ? t("任务执行引擎")
                          : selectedActivity.kind === "审批"
                            ? t("审批策略引擎")
                            : t("工作区系统"))}
                      </strong>
                    </span>
                  </div>

                  <div className="activity-event-id">
                    <span>
                      <small>{t("事件 ID")}</small>
                      <code>{selectedActivity.id}</code>
                    </span>
                    <span className="activity-event-id-actions">
                      <button
                        type="button"
                        aria-label={t("复制当前审计事件链接")}
                        title={t("复制当前审计事件链接")}
                        onClick={() => copyActivityEventLink(selectedActivity)}
                      >
                        <Link2 size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={t("复制事件 ID")}
                        title={t("复制事件 ID")}
                        onClick={() => copyActivityId(selectedActivity)}
                      >
                        <Copy size={15} />
                      </button>
                    </span>
                  </div>

                  <div className="activity-integrity">
                    <ShieldCheck size={18} />
                    <span>
                      <strong>{t("审计记录已写入本机")}</strong>
                      <small>{t("事件时间、来源和关联对象可随工作区一起导出。")}</small>
                    </span>
                  </div>

                  <footer className="activity-inspector-actions">
                    <button
                      type="button"
                      onClick={() => exportActivityItem(selectedActivity)}
                    >
                      <Download size={15} />
                      
                      {t("导出此事件")}
                    </button>
                    <button
                      className="primary"
                      type="button"
                      onClick={() => openActivityItem(selectedActivity)}
                    >
                      {t(selectedActivityTask
                        ? t("打开关联任务")
                        : selectedActivity.kind === "审批"
                          ? t("查看审批队列")
                          : t("打开系统设置"))}
                      <ChevronRight size={14} />
                    </button>
                  </footer>
                </aside>
              ) : (
                <div className="activity-inspector-empty">
                  <History size={24} />
                  <strong>{t("选择一条记录查看审计详情")}</strong>
                </div>
              )}
            </div>
          </section>
        )}

        {activeView === "plugins" && runtimeMode && (
          <PluginsView runtime={workspaceProvider.runtime} notify={setNotice} />
        )}

        {activeView === "settings" && (
          <section className="settings-view">
            <nav className="settings-section-nav" aria-label={t("设置分区")}>
              <div className="settings-section-nav-title">
                <span>
                  <Settings2 size={17} />
                </span>
                <span>
                  <small>{t("设置中心")}</small>
                  <strong>
                    {visibleSettingsSections.find(
                      (section) => section.id === settingsSection,
                    )?.label ?? t("概览")}
                  </strong>
                </span>
              </div>
              <div className="settings-section-links">
                {visibleSettingsSections.map((section) => {
                  const SectionIcon = section.icon;
                  const isActive = settingsSection === section.id;
                  return (
                    <button
                      className={isActive ? "active" : ""}
                      type="button"
                      key={section.id}
                      data-settings-section={section.id}
                      aria-current={isActive ? "location" : undefined}
                      onClick={() => openSettingsSection(section.id)}
                    >
                      <SectionIcon size={15} />
                      <span>
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                className="settings-section-copy"
                type="button"
                aria-label={t("复制当前设置分区链接")}
                title={t("复制当前设置分区链接")}
                onClick={copySettingsSectionLink}
              >
                <Link2 size={16} />
              </button>
            </nav>

            <div
              id="settings-overview"
              className={`workspace-overview ${settings.local ? "" : "is-temporary"}`}
            >
              <div className="workspace-overview-status">
                <span className="workspace-overview-icon">
                  {workspaceInitial}
                  <i />
                </span>
                <div>
                  <span>{t("当前工作区")}</span>
                  <h2>{workspaceProfile.name}</h2>
                  <p>{workspaceProfile.description}</p>
                  <small className="workspace-profile-storage">
                    <HardDrive size={13} />
                    {(settings.local ? t("本机数据正常") : t("当前为临时会话"))}
                  </small>
                </div>
                <button
                  className="workspace-profile-edit"
                  type="button"
                  aria-label={t("编辑工作区资料")}
                  title={t("编辑工作区资料")}
                  onClick={openWorkspaceProfile}
                >
                  <Pencil size={15} />
                  <span>{t("编辑资料")}</span>
                </button>
              </div>
              <div className="workspace-overview-metrics">
                <span>
                  <small>{t("任务")}</small>
                  <strong>{tasks.length}</strong>
                </span>
                <span>
                  <small>{t("运行记录")}</small>
                  <strong>{activityLog.length}</strong>
                </span>
                <span>
                  <small>{t("待确认")}</small>
                  <strong>{activeApprovalCount}</strong>
                </span>
                <span>
                  <small>{t("数据量")}</small>
                  <strong>{workspaceDataSize} KB</strong>
                </span>
              </div>
            </div>

            {runtimeMode ? (
              <RuntimeUsagePanel summary={runtimeUsage} />
            ) : (
            <section
              id="settings-usage"
              className={`settings-usage-center ${
                budgetExceeded
                  ? "is-over"
                  : budgetAlertReached
                    ? "is-alert"
                    : ""
              }`}
            >
              <header className="settings-usage-heading">
                <div>
                  <span>{t("用量与预算")}</span>
                  <h2>
                    {budgetExceeded
                      ? t("月度额度已用完，保护策略已经生效")
                      : forecastVariance < 0
                        ? t("按当前趋势，月底预计超出 {abs} 点", { abs: Math.abs(forecastVariance) })
                        : t("本月额度充足，月底预计剩余 {forecastVariance} 点", { forecastVariance })}
                  </h2>
                  <p>{t("本月额度根据任务执行、连接器调用和本机成果记录实时估算。")}</p>
                </div>
                <div className="settings-usage-heading-actions">
                  <button
                    className="settings-plan-badge"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={planCenterOpen}
                    onClick={openPlanCenter}
                  >
                    <Sparkles size={15} />
                    
                    {planLabel}
                  </button>
                  <button type="button" onClick={exportUsageReport}>
                    <Download size={15} />
                    
                    {t("导出用量")}
                  </button>
                  <button className="primary" type="button" onClick={openUsageBudget}>
                    <Pencil size={15} />
                    
                    {t("调整预算")}
                  </button>
                </div>
              </header>

              <div className="settings-usage-layout">
                <div className="usage-meter-panel">
                  <div className="usage-meter-status">
                    <span
                      className={
                        budgetExceeded
                          ? "is-over"
                          : budgetAlertReached
                            ? "is-alert"
                            : "is-healthy"
                      }
                    >
                      {budgetExceeded || budgetAlertReached ? (
                        <AlertTriangle size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                      {t(budgetExceeded
                        ? t("额度已用完")
                        : budgetAlertReached
                          ? t("接近额度上限")
                          : t("额度状态健康"))}
                    </span>
                    <small>
                      {(usageSettings.pauseAtLimit ? t("到限自动保护") : t("到限仅提醒"))}
                    </small>
                  </div>
                  <div className="usage-meter-heading">
                    <span>
                      <small>{t("本月额度")}</small>
                      <strong>
                        {usedCredits}
                        <em>{" "}{t("/ {monthlyBudget} 点", { monthlyBudget: usageSettings.monthlyBudget })}</em>
                      </strong>
                    </span>
                    <span>
                      <small>{t("还可使用")}</small>
                      <strong>
                        {remainingCredits}
                        <em>  {t("点")}</em>
                      </strong>
                    </span>
                  </div>
                  <div
                    className="usage-budget-track"
                    role="progressbar"
                    aria-label={t("本月 AI 额度使用")}
                    aria-valuemin={0}
                    aria-valuemax={usageSettings.monthlyBudget}
                    aria-valuenow={Math.min(
                      usedCredits,
                      usageSettings.monthlyBudget,
                    )}
                  >
                    <span style={{ width: `${usageProgressPercent}%` }} />
                    <i
                      style={{
                        left: `${Math.min(100, usageSettings.alertThreshold)}%`,
                      }}
                      title={t("{alertThreshold}% 提醒线", { alertThreshold: usageSettings.alertThreshold })}
                    />
                  </div>
                  <div className="usage-meter-legend">
                    <span>{t("{usagePercent}% 已使用", { usagePercent })}</span>
                    <span>{t("{alertCreditLevel} 点提醒", { alertCreditLevel })}</span>
                  </div>
                  <div className="usage-budget-insights">
                    <span>
                      <Activity size={16} />
                      <span>
                        <small>{t("月底预计")}</small>
                        <strong>
                          {forecastVariance >= 0
                            ? t("剩余 {forecastVariance} 点", { forecastVariance })
                            : t("超出 {abs} 点", { abs: Math.abs(forecastVariance) })}
                        </strong>
                      </span>
                    </span>
                    <span>
                      <Bell size={16} />
                      <span>
                        <small>{t("提醒点位")}</small>
                        <strong>
                          {creditsUntilAlert > 0
                            ? t("再用 {creditsUntilAlert} 点", { creditsUntilAlert })
                            : t("已经触发")}
                        </strong>
                      </span>
                    </span>
                    <span>
                      <Clock3 size={16} />
                      <span>
                        <small>{t("额度刷新")}</small>
                        <strong>{t("8 月 1 日")}</strong>
                      </span>
                    </span>
                  </div>
                  {(budgetAlertReached || forecastVariance < 0) && (
                    <div className="usage-budget-alert" role="status">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>
                          {t(budgetExceeded
                            ? t("已达到月度预算")
                            : budgetAlertReached
                              ? t("用量已超过提醒线")
                              : t("按当前趋势可能超出预算"))}
                        </strong>
                        <small>
                          {budgetExceeded && usageSettings.pauseAtLimit
                            ? t("运行中任务会自动暂停，新建、继续和重试也会被阻止。")
                            : usageSettings.pauseAtLimit
                              ? t("到达 {monthlyBudget} 点后会自动暂停运行中的任务。", { monthlyBudget: usageSettings.monthlyBudget })
                              : t("当前未开启到限自动暂停，达到额度后任务仍会继续运行。")}
                        </small>
                      </span>
                    </div>
                  )}
                </div>

                <div className="usage-breakdown-panel">
                  <div className="usage-section-heading">
                    <span>{t("消耗分布")}</span>
                    <strong>{t("{length} 类", { length: usageBreakdown.length })}</strong>
                  </div>
                  <div className="usage-breakdown-list">
                    {usageBreakdown.map((item) => {
                      const UsageIcon = item.icon;
                      const share = Math.round(
                        (item.credits / Math.max(1, usedCredits)) * 100,
                      );
                      return (
                        <div className={`tone-${item.tone}`} key={item.id}>
                          <span className="usage-breakdown-icon">
                            <UsageIcon size={16} />
                          </span>
                          <span className="usage-breakdown-copy">
                            <span>
                              <strong>{t(item.label)}</strong>
                              <em>{t("{share}% · {credits} 点", { share, credits: item.credits })}</em>
                            </span>
                            <small>{t(item.detail)}</small>
                            <i>
                              <span style={{ width: `${Math.max(5, share)}%` }} />
                            </i>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <aside className="usage-guard-panel">
                  <div className="usage-section-heading">
                    <span>{t("预算保护")}</span>
                    <strong>
                      {t(budgetExceeded
                        ? t("已触发")
                        : usageSettings.pauseAtLimit
                          ? t("保护中")
                          : t("仅提醒"))}
                    </strong>
                  </div>
                  <div className="usage-guard-list">
                    <div>
                      <Bell size={17} />
                      <span>
                        <small>{t("用量提醒")}</small>
                        <strong>{t("{alertCreditLevel} 点（{alertThreshold}%）时提醒", { alertCreditLevel, alertThreshold: usageSettings.alertThreshold })}</strong>
                      </span>
                    </div>
                    <div>
                      <Pause size={17} />
                      <span>
                        <small>{t("到限处理")}</small>
                        <strong>
                          {usageSettings.pauseAtLimit
                            ? t("达到 {monthlyBudget} 点自动暂停", { monthlyBudget: usageSettings.monthlyBudget })
                            : t("达到额度后继续运行")}
                        </strong>
                      </span>
                    </div>
                    <div>
                      <ShieldCheck size={17} />
                      <span>
                        <small>{t("影响范围")}</small>
                        <strong>{t("只影响当前工作区")}</strong>
                      </span>
                    </div>
                  </div>
                  <button type="button" onClick={openUsageBudget}>
                    <Settings2 size={15} />
                    
                    {t("管理预算保护")}
                    <ChevronRight size={15} />
                  </button>
                </aside>
              </div>

              <footer className="settings-usage-footnote">
                <ShieldCheck size={15} />
                <span>
                  
                  {t("用量为本机运行记录估算，不包含未连接服务的外部账单；预算变更会写入审计记录。")}
                </span>
              </footer>
            </section>
            )}

            {!runtimeMode && (
            <section className="settings-team-center" id="settings-team">
              <header className="settings-team-heading">
                <div>
                  <span>{t("团队与权限")}</span>
                  <h2>{t("知道谁可以查看、修改和审批")}</h2>
                  <p>{t("成员角色会直接决定任务、成果和外部操作的访问边界。")}</p>
                </div>
                <button type="button" onClick={openTeamInvite}>
                  <UserPlus size={16} />
                  
                  {t("邀请成员")}
                </button>
              </header>

              <div className="settings-team-summary" aria-label={t("团队概览")}>
                <span>
                  <Users size={18} />
                  <span>
                    <small>{t("席位使用")}</small>
                    <strong>
                      {teamMembers.length} / {teamSeatLimit}
                    </strong>
                    <em>{t("{availableSeatCount} 个可用", { availableSeatCount })}</em>
                  </span>
                </span>
                <span>
                  <Mail size={18} />
                  <span>
                    <small>{t("待接受邀请")}</small>
                    <strong>{t("{pendingInviteCount} 位", { pendingInviteCount })}</strong>
                    <em>{(pendingInviteCount ? t("已占用席位") : t("暂无待处理"))}</em>
                  </span>
                </span>
                <span>
                  <ShieldCheck size={18} />
                  <span>
                    <small>{t("可以审批")}</small>
                    <strong>{t("{approverMemberCount} 位", { approverMemberCount })}</strong>
                    <em>{t("含所有者与管理员")}</em>
                  </span>
                </span>
                <span>
                  <Activity size={18} />
                  <span>
                    <small>{t("当前在线")}</small>
                    <strong>{t("{onlineMemberCount} 位", { onlineMemberCount })}</strong>
                    <em>{t("状态实时同步")}</em>
                  </span>
                </span>
              </div>

              <div className="settings-team-toolbar">
                <label className="settings-team-search">
                  <Search size={16} />
                  <input
                    type="search"
                    value={teamMemberQuery}
                    aria-label={t("搜索团队成员")}
                    placeholder={t("搜索姓名或邮箱")}
                    onChange={(event) => setTeamMemberQuery(event.target.value)}
                  />
                  {teamMemberQuery && (
                    <button
                      type="button"
                      aria-label={t("清空成员搜索")}
                      onClick={() => setTeamMemberQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <div
                  className="settings-team-filters"
                  role="group"
                  aria-label={t("按角色筛选成员")}
                >
                  {teamRoleFilters.map((filter) => (
                    <button
                      className={teamRoleFilter === filter ? "active" : ""}
                      type="button"
                      aria-pressed={teamRoleFilter === filter}
                      key={filter}
                      onClick={() => setTeamRoleFilter(filter)}
                    >
                      {t(filter)}
                      <span>{teamRoleFilterCounts[filter]}</span>
                    </button>
                  ))}
                </div>
                <span className="settings-team-result-count" aria-live="polite">{t("显示 {length} 位", { length: filteredTeamMembers.length })}</span>
              </div>

              <div className="settings-team-table">
                <div className="settings-team-table-head" aria-hidden="true">
                  <span>{t("成员")}</span>
                  <span>{t("角色与权限")}</span>
                  <span>{t("状态")}</span>
                  <span>{t("最近活动")}</span>
                  <span>{t("操作")}</span>
                </div>
                <div className="settings-team-list">
                  {filteredTeamMembers.map((member) => (
                    <article className="settings-team-row" key={member.id}>
                      <div className="settings-team-identity">
                        <span className={`settings-team-avatar tone-${member.tone}`}>
                          {member.avatar}
                          <i className={`status-${member.status}`} />
                        </span>
                        <span>
                          <strong>
                            {member.name}
                            {member.role === "所有者" && <em>{t("你")}</em>}
                          </strong>
                          <small>{member.email}</small>
                        </span>
                      </div>
                      <div className="settings-team-role">
                        <strong>{t(member.role)}</strong>
                        <small>{teamRoleDetails[member.role].summary}</small>
                      </div>
                      <span
                        className={`settings-team-member-status status-${member.status}`}
                      >
                        <i />
                        {t(member.status)}
                      </span>
                      <span className="settings-team-last-active">
                        <Clock3 size={14} />
                        {member.lastActive}
                      </span>
                      <button
                        type="button"
                        aria-label={t("管理成员：{name}", { name: member.name })}
                        onClick={() => openTeamMember(member)}
                      >
                        
                        {t("管理")}
                        <ChevronRight size={15} />
                      </button>
                    </article>
                  ))}
                  {filteredTeamMembers.length === 0 && (
                    <div className="settings-team-empty">
                      <Search size={20} />
                      <strong>{t("没有符合条件的成员")}</strong>
                      <small>{t("换一个姓名、邮箱或角色筛选条件试试。")}</small>
                      <button
                        type="button"
                        onClick={() => {
                          setTeamMemberQuery("");
                          setTeamRoleFilter("全部");
                        }}
                      >
                        
                        {t("清除筛选")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <footer className="settings-team-footnote">
                <ShieldCheck size={16} />
                <span>{t("只有所有者和管理员可以邀请成员或修改角色。")}</span>
              </footer>
            </section>
            )}

            <div
              className="settings-group settings-preferences-group"
              id="settings-preferences"
            >
              <div>
                <span>{t("运行偏好")}</span>
                <h2>{t("安全、保存与通知")}</h2>
              </div>
              <label className="setting-row">
                <span>
                  <strong>{t("界面语言")}</strong>
                  <small>{t("切换后页面会重新载入。")}</small>
                </span>
                <span className="agent-run-input agent-run-select">
                  <Globe2 size={14} aria-hidden="true" />
                  <select
                    aria-label={t("界面语言")}
                    value={locale()}
                    onChange={(event) => chooseLocale(event.target.value as Locale)}
                  >
                    {locales.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              {desktopApp && autostart !== null && (
                <label className="setting-row">
                  <span>
                    <strong>{t("登录系统后在后台运行")}</strong>
                    <small>
                      {tasks.some((task) => task.schedule === "每天" || task.schedule === "每周") && !autostart
                        ? t("你有定时任务。不打开这项，电脑重启后要等你打开 Unzoo One，定时任务才会接着跑。")
                        : t("定时任务需要后台服务一直在。打开后，重启电脑不用手动打开 Unzoo One。")}
                    </small>
                  </span>
                  <button
                    className={`switch-control ${autostart ? "on" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={autostart}
                    aria-label={t("登录系统后在后台运行")}
                    onClick={toggleAutostart}
                  >
                    <i />
                  </button>
                </label>
              )}
              <label className="setting-row">
                <span>
                  <strong>{t("外部操作前必须确认")}</strong>
                  <small>{t("发送邮件、发布内容或访问敏感信息前暂停任务。")}</small>
                </span>
                <button
                  className={`switch-control ${settings.approval ? "on" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={settings.approval}
                  onClick={() => toggleSetting("approval", t("默认审批保护"))}
                >
                  <i />
                </button>
              </label>
              <label className="setting-row">
                <span>
                  <strong>{t("关闭页面后保留工作区")}</strong>
                  <small>
                    
                    {t("开启后，任务、成果和运行记录会在下次打开时自动恢复。")}
                  </small>
                </span>
                <button
                  className={`switch-control ${settings.local ? "on" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={settings.local}
                  aria-label={t("关闭页面后保留工作区")}
                  onClick={requestToggleLocalPersistence}
                >
                  <i />
                </button>
              </label>
              <label className="setting-row">
                <span>
                  <strong>{t("需要确认时通知")}</strong>
                  <small>{t(desktopNotificationPreferenceDetail)}</small>
                </span>
                <button
                  className={`switch-control ${settings.notifications ? "on" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={settings.notifications}
                  aria-label={t("需要确认时发送桌面通知")}
                  aria-busy={isRequestingNotificationPermission}
                  disabled={
                    isRequestingNotificationPermission ||
                    desktopNotificationPermission === "checking"
                  }
                  onClick={toggleDesktopNotifications}
                >
                  <i />
                </button>
              </label>
            </div>

            <AgentRunPanel
              rules={workspaceProvider.agentRules}
              brain={workspaceProvider.brain}
              runtime={runtimeMode ? workspaceProvider.runtime : null}
              notify={setNotice}
              openTerminal={desktopApp ? openTerminalFromPage : undefined}
            />

            {runtimeMode && <SkillsPanel runtime={workspaceProvider.runtime} notify={setNotice} />}

            <section className="settings-data-center" id="settings-data">
              <header className="settings-data-heading">
                <div>
                  <span>{t("数据安全与恢复")}</span>
                  <h2>{t("知道数据保存在哪里，也知道出问题后怎么回来")}</h2>
                  <p>{t("本机自动保存用于继续工作，手动备份用于迁移设备和灾难恢复。")}</p>
                </div>
                <button type="button" onClick={exportWorkspaceFromDataCenter}>
                  <Download size={16} />
                  
                  {t("创建备份")}
                </button>
              </header>

              <div className="settings-data-status" aria-label={t("数据保护状态")}>
                <span
                  className={
                    workspaceAutoSaveReady ? "is-ready" : "is-attention"
                  }
                >
                  <i>
                    {settings.local ? (
                      <HardDrive size={17} />
                    ) : (
                      <Timer size={17} />
                    )}
                  </i>
                  <span>
                    <small>{t("本机自动保存")}</small>
                    <strong>
                      {t(workspacePersistenceStatus === "failed"
                        ? t("保存失败")
                        : settings.local
                          ? t("已开启")
                          : t("临时会话"))}
                    </strong>
                    <em>
                      {workspaceLastSavedLabel
                        ? t("最近保存 {workspaceLastSavedLabel}", { workspaceLastSavedLabel })
                        : settings.local
                          ? t("等待首次保存")
                          : t("关闭后不保留")}
                    </em>
                  </span>
                </span>
                <span
                  className={
                    lastWorkspaceBackupAt ? "is-ready" : "is-attention"
                  }
                >
                  <i>
                    <Download size={17} />
                  </i>
                  <span>
                    <small>{t("最近可用备份")}</small>
                    <strong>{workspaceBackupFreshnessLabel}</strong>
                    <em>
                      {t(lastWorkspaceBackupAt
                        ? t("可迁移至其他设备")
                        : t("建议现在创建"))}
                    </em>
                  </span>
                </span>
                <span>
                  <i>
                    <FileJson size={17} />
                  </i>
                  <span>
                    <small>{t("当前数据量")}</small>
                    <strong>{t("约 {workspaceDataSize} KB", { workspaceDataSize })}</strong>
                    <em>{t("{length} 个任务 · {length2} 项成果", { length: tasks.length, length2: artifacts.length })}</em>
                  </span>
                </span>
                <span className="is-ready">
                  <i>
                    <ShieldCheck size={17} />
                  </i>
                  <span>
                    <small>{t("恢复文件校验")}</small>
                    <strong>{t("已启用")}</strong>
                    <em>{t("仅接受 Unzoo One JSON v1")}</em>
                  </span>
                </span>
              </div>

              <div className="settings-data-layout">
                <article
                  className={`settings-data-readiness ${workspaceRecoveryTone}`}
                >
                  <div className="settings-data-readiness-heading">
                    <span>
                      {workspaceRecoveryTone === "is-ready" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <AlertTriangle size={20} />
                      )}
                    </span>
                    <div>
                      <small>{t("恢复准备度 · {workspaceRecoveryLayerCount} / 3", { workspaceRecoveryLayerCount })}</small>
                      <h3>{t(workspaceRecoveryHeadline)}</h3>
                      <p>{workspaceRecoveryDetail}</p>
                    </div>
                  </div>
                  <div
                    className="settings-data-layers"
                    aria-label={t("数据保护层")}
                  >
                    <span className={workspaceAutoSaveReady ? "active" : ""}>
                      {workspaceAutoSaveReady ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      <span>
                        <small>{t("第一层")}</small>
                        <strong>{t("本机自动保存")}</strong>
                      </span>
                    </span>
                    <span className={lastWorkspaceBackupAt ? "active" : ""}>
                      {lastWorkspaceBackupAt ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      <span>
                        <small>{t("第二层")}</small>
                        <strong>{t("手动迁移备份")}</strong>
                      </span>
                    </span>
                    <span className="active">
                      <Check size={14} />
                      <span>
                        <small>{t("第三层")}</small>
                        <strong>{t("导入结构校验")}</strong>
                      </span>
                    </span>
                  </div>
                </article>

                <div className="settings-data-operations">
                  <button
                    type="button"
                    onClick={exportWorkspaceFromDataCenter}
                  >
                    <span className="workspace-data-action-icon export">
                      <Download size={18} />
                    </span>
                    <span>
                      <small>{t("安全副本")}</small>
                      <strong>{t("导出工作区备份")}</strong>
                      <em>
                        {lastWorkspaceBackupAt
                          ? t("上次 {workspaceBackupFreshnessLabel}", { workspaceBackupFreshnessLabel })
                          : t("下载完整 JSON 文件")}
                      </em>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button type="button" onClick={openWorkspaceImportPicker}>
                    <span className="workspace-data-action-icon import">
                      <Upload size={18} />
                    </span>
                    <span>
                      <small>{t("迁移与恢复")}</small>
                      <strong>{t("从备份恢复")}</strong>
                      <em>{t("先校验，再预览覆盖范围")}</em>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button
                    className="workspace-data-reset"
                    type="button"
                    onClick={openWorkspaceReset}
                  >
                    <span className="workspace-data-action-icon reset">
                      <RotateCcw size={18} />
                    </span>
                    <span>
                      <small>{t("危险操作")}</small>
                      <strong>{t("恢复初始状态")}</strong>
                      <em>{t("清除改动并载入示例工作区")}</em>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              <footer className="settings-data-inventory">
                <span>
                  <ShieldCheck size={15} />
                  
                  {t("备份范围")}
                </span>
                <strong>{t("{length} 个任务", { length: tasks.length })}</strong>
                <strong>{t("{length} 项成果", { length: artifacts.length })}</strong>
                <strong>{t("{length} 位成员", { length: teamMembers.length })}</strong>
                <strong>{t("{length} 条记录", { length: activityLog.length })}</strong>
                <small>{t("文件只在当前设备生成，不会上传到外部服务。")}</small>
              </footer>
            </section>

            {runtimeMode ? (
              <>
              <RuntimeCapabilitiesPanel
                capabilities={runtimeCapabilities}
                agents={runtimeAgents}
                error={runtimeCapabilitiesError}
                checking={runtimeChecking}
                onRefresh={() => void checkRuntimeCapabilities(true)}
                onOpenAgents={() => openSettingsSection("agents")}
                onOpenTerminal={desktopApp ? openTerminalFromPage : undefined}
              />
              <TerminalPanel runtime={workspaceProvider.runtime} notify={setNotice} />
              <TellRulesPanel runtime={workspaceProvider.runtime} notify={setNotice} />
              <ClientsPanel runtime={workspaceProvider.runtime} notify={setNotice} />
              <PhonePanel runtime={workspaceProvider.runtime} notify={setNotice} />
              </>
            ) : (
            <section
              className="settings-connectors-center"
              id="settings-connectors"
            >
              <header className="settings-connectors-heading">
                <div>
                  <span>{t("能力连接")}</span>
                  <h2>{t("AI 当前可以使用这些工具")}</h2>
                  <p>{t("查看每项能力的授权范围、使用状态，并随时测试或断开连接。")}</p>
                </div>
                <div className="settings-connectors-heading-actions">
                  <span
                    className={`settings-connectors-state ${
                      connectorIssueCount > 0 ? "is-attention" : ""
                    }`}
                  >
                    {connectorIssueCount > 0 ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Link2 size={16} />
                    )}
                    {connectorIssueCount > 0
                      ? t("{connectorIssueCount} 项需要处理", { connectorIssueCount })
                      : t("全部连接正常")}
                  </span>
                  <button
                    type="button"
                    disabled={
                      connectorTestingAll ||
                      connectorTestingId !== null ||
                      healthyConnectorCount === 0
                    }
                    aria-busy={connectorTestingAll}
                    onClick={testAllConnectors}
                  >
                    {connectorTestingAll ? (
                      <LoaderCircle className="is-spinning" size={15} />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    {(connectorTestingAll ? t("正在检测") : t("检测全部"))}
                  </button>
                </div>
              </header>

              <div
                className="settings-connectors-summary"
                aria-label={t("连接器运行状态")}
              >
                <span className="is-ready">
                  <i>
                    <CheckCircle2 size={17} />
                  </i>
                  <span>
                    <small>{t("当前可用")}</small>
                    <strong>
                      {healthyConnectorCount} / {connectorCatalog.length}
                    </strong>
                  </span>
                </span>
                <span className={connectorIssueCount > 0 ? "is-risk" : ""}>
                  <i>
                    <AlertTriangle size={17} />
                  </i>
                  <span>
                    <small>{t("授权异常")}</small>
                    <strong>{t("{connectorIssueCount} 项", { connectorIssueCount })}</strong>
                  </span>
                </span>
                <span>
                  <i>
                    <Link2 size={17} />
                  </i>
                  <span>
                    <small>{t("等待授权")}</small>
                    <strong>{t("{disconnectedConnectorCount} 项", { disconnectedConnectorCount })}</strong>
                  </span>
                </span>
                <span className={connectorIssueTaskCount > 0 ? "is-risk" : ""}>
                  <i>
                    <Pause size={17} />
                  </i>
                  <span>
                    <small>{t("安全停止任务")}</small>
                    <strong>{t("{connectorIssueTaskCount} 个", { connectorIssueTaskCount })}</strong>
                  </span>
                </span>
                <span>
                  <i>
                    <Activity size={17} />
                  </i>
                  <span>
                    <small>{t("已有检测结果")}</small>
                    <strong>
                      {checkedHealthyConnectorCount} / {healthyConnectorCount}
                    </strong>
                  </span>
                </span>
              </div>

              <div className="settings-connector-grid">
                {connectorCatalog.map((connector) => {
                  const ConnectorIcon = connector.icon;
                  const connected = connectorStates[connector.id];
                  const usageCount = connectorUsageCounts[connector.id];
                  const issueTasks = connectorIssueTasks[connector.id];
                  const hasIssue = issueTasks.length > 0;
                  const checkResult = connectorCheckResults[connector.id];
                  const isChecking =
                    connectorTestingId === connector.id ||
                    (connectorTestingAll && connected && !hasIssue);
                  return (
                    <article
                      className={`settings-connector-card tone-${connector.tone} ${
                        hasIssue
                          ? "is-attention"
                          : connected
                            ? "is-connected"
                            : "is-disconnected"
                      }`}
                      key={connector.id}
                    >
                      <div className="settings-connector-card-top">
                        <span className="settings-connector-icon">
                          <ConnectorIcon size={20} />
                        </span>
                        <span
                          className={`settings-connector-status ${
                            hasIssue ? "is-attention" : ""
                          }`}
                        >
                          <i />
                          {t(hasIssue
                            ? t("需要重新授权")
                            : connected
                              ? t("已连接")
                              : t("未连接"))}
                        </span>
                      </div>
                      <div className="settings-connector-copy">
                        <h3>{connector.name}</h3>
                        <p>{connector.description}</p>
                      </div>
                      <div className="settings-connector-facts">
                        <span>
                          <small>{t("授权范围")}</small>
                          <strong>
                            {hasIssue
                              ? t("授权已失效")
                              : connected
                                ? connector.scope
                                : t("尚未授权")}
                          </strong>
                        </span>
                        <span>
                          <small>{t("数据流向")}</small>
                          <strong>
                            {connected ? connector.dataFlow : t("尚未建立数据流")}
                          </strong>
                        </span>
                        <span>
                          <small>{t("最近检测")}</small>
                          <strong>
                            {hasIssue
                              ? t("检测失败")
                              : !connected
                                ? t("等待连接")
                                : isChecking
                                  ? t("正在检测")
                                  : checkResult
                                    ? `${checkResult.checkedAt} · ${checkResult.latency} ms`
                                    : t("尚未检测")}
                          </strong>
                        </span>
                      </div>
                      <div className="settings-connector-footer">
                        <small>
                          {hasIssue
                            ? t("{usageCount} 个任务关联 · {title} 已停止", { usageCount, title: issueTasks[0].title })
                            : connected
                              ? t("{usageCount} 个任务关联 · {lastUsed}", { usageCount, lastUsed: connector.lastUsed })
                              : t("{usageCount} 个任务可使用 · 连接后才会调用", { usageCount })}
                        </small>
                        <button
                          type="button"
                          onClick={() => openConnector(connector.id)}
                        >
                          {hasIssue ? t("修复") : connected ? t("管理") : t("连接")}
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
            )}

            <section className="settings-trust-center" id="settings-security">
              <header className="settings-trust-heading">
                <div>
                  <span>{t("执行边界与审计")}</span>
                  <h2>{t("确认 AI 能做什么，以及刚刚做了什么")}</h2>
                  <p>{t("这里汇总当前工作区真正生效的规则，不展示未连接的能力。")}</p>
                </div>
                <span className="settings-trust-state">
                  <CheckCircle2 size={16} />
                  
                  {t("规则已生效")}
                </span>
              </header>

              <div className="settings-trust-layout">
                <div className="settings-policy-list" aria-label={t("当前执行规则")}>
                  <div className="settings-policy-row">
                    <span className="settings-policy-icon approval">
                      <ShieldCheck size={19} />
                    </span>
                    <div>
                      <span>{t("审批保护")}</span>
                      <strong>
                        {(settings.approval ? t("新任务默认需要确认") : t("新任务默认自动执行"))}
                      </strong>
                      <small>{t("{protectedTaskCount} / {length} 个现有任务保留审批边界", { protectedTaskCount, length: tasks.length })}</small>
                    </div>
                    <em className={settings.approval ? "is-safe" : "is-caution"}>
                      {(settings.approval ? t("默认开启") : t("默认关闭"))}
                    </em>
                    <button
                      type="button"
                      onClick={() =>
                        openView(approvals.length > 0 ? "approvals" : "tasks")
                      }
                    >
                      {approvals.length > 0
                        ? activeApprovalCount > 0
                          ? t("查看 {activeApprovalCount} 项待确认", { activeApprovalCount })
                          : t("查看 {deferredApprovalCount} 项稍后提醒", { deferredApprovalCount })
                        : t("查看任务规则")}
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="settings-policy-row">
                    <span className="settings-policy-icon storage">
                      <HardDrive size={19} />
                    </span>
                    <div>
                      <span>{t("工作区保存")}</span>
                      <strong>
                        {(settings.local ? t("数据保存在这台设备") : t("当前是临时会话"))}
                      </strong>
                      <small>
                        {settings.local
                          ? t("约 {workspaceDataSize} KB，可随时导出迁移", { workspaceDataSize })
                          : t("关闭页面前请先导出需要保留的数据")}
                      </small>
                    </div>
                    <em className={settings.local ? "is-safe" : "is-caution"}>
                      {(settings.local ? t("本机保存") : t("临时模式"))}
                    </em>
                    <button
                      type="button"
                      onClick={
                        settings.local ? exportWorkspace : requestToggleLocalPersistence
                      }
                    >
                      {(settings.local ? t("立即备份") : t("开启保存"))}
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="settings-policy-row">
                    <span className="settings-policy-icon notification">
                      <Bell size={19} />
                    </span>
                    <div>
                      <span>{t("确认提醒")}</span>
                      <strong>{t(desktopNotificationSummary)}</strong>
                      <small>{t("只影响后续需要你决定的任务，不改变执行规则")}</small>
                    </div>
                    <em className={desktopNotificationStateClass}>
                      {t(desktopNotificationStateLabel)}
                    </em>
                    <button
                      type="button"
                      aria-busy={isRequestingNotificationPermission}
                      disabled={
                        isRequestingNotificationPermission ||
                        desktopNotificationPermission === "checking"
                      }
                      onClick={toggleDesktopNotifications}
                    >
                      {t(isRequestingNotificationPermission
                        ? t("等待授权")
                        : desktopNotificationActionLabel)}
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                <div className="settings-audit-preview">
                  <div className="settings-audit-heading">
                    <div>
                      <span>{t("最近安全事件")}</span>
                      <strong>{t("{length} 条可追溯记录", { length: settingsAuditItems.length })}</strong>
                    </div>
                    <History size={18} />
                  </div>
                  <div className="settings-audit-list">
                    {settingsAuditItems.map((item) => {
                      const ItemIcon = activityIconMap[item.icon] ?? Activity;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openActivityEvent(item.id)}
                        >
                          <span className={`tone-${item.tone}`}>
                            <ItemIcon size={16} />
                          </span>
                          <span>
                            <small>
                              {t(item.kind)} · {item.time}
                            </small>
                            <strong>{item.title}</strong>
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      );
                    })}
                    {settingsAuditItems.length === 0 && (
                      <div className="settings-audit-empty">
                        <CheckCircle2 size={19} />
                        <strong>{t("还没有安全事件")}</strong>
                        <small>{t("审批、设置和系统变更会自动记录在这里。")}</small>
                      </div>
                    )}
                  </div>
                  <button
                    className="settings-audit-open"
                    type="button"
                    onClick={() => openView("activity")}
                  >
                    <History size={16} />
                    
                    {t("打开完整运行记录")}
                  </button>
                </div>
              </div>
            </section>
          </section>
        )}
      </section>

      {teamInviteOpen && (
        <div
          className="clarity-dialog-backdrop team-dialog-backdrop"
          onMouseDown={closeTeamInvite}
        >
          <form
            className="team-invite-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-invite-title"
            aria-describedby="team-invite-description"
            aria-busy={isSendingInvite}
            onSubmit={inviteTeamMember}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="team-dialog-close"
              type="button"
              aria-label={t("关闭邀请成员")}
              onClick={closeTeamInvite}
            >
              <X size={17} />
            </button>
            <header className="team-dialog-heading">
              <span className="team-dialog-icon">
                <UserPlus size={22} />
              </span>
              <div>
                <span>{t("团队协作")}</span>
                <h2 id="team-invite-title">{t("邀请成员加入工作区")}</h2>
                <p id="team-invite-description">
                  
                  {t("发送邀请前先选择角色，成员接受后会获得对应权限。")}
                </p>
              </div>
            </header>

            <div
              className={`team-invite-seat-status${
                teamSeatLimitReached ? " is-full" : ""
              }`}
              role="status"
            >
              <Users size={17} />
              <span>
                <small>{t("Team 方案席位")}</small>
                <strong>{t("已使用 {length} / {teamSeatLimit}", { length: teamMembers.length, teamSeatLimit })}</strong>
              </span>
              <span>
                <small>{t("邀请后剩余")}</small>
                <strong>
                  {teamSeatLimitReached ? t("没有可用席位") : t("{value} 个", { value: availableSeatCount - 1 })}
                </strong>
              </span>
            </div>

            {!isOnline && (
              <div className="team-network-note" role="status">
                <Globe2 size={17} />
                <span>
                  <strong>{t("当前设备离线")}</strong>
                  <small>{t("邀请内容会保留，恢复网络后再发送。")}</small>
                </span>
              </div>
            )}

            <div className="team-invite-fields">
              <label
                className={
                  inviteFormSubmitted && teamInviteFormErrors.name
                    ? "has-error"
                    : ""
                }
              >
                <span>{t("成员姓名")}</span>
                <input
                  type="text"
                  value={inviteName}
                  disabled={isSendingInvite}
                  data-overlay-initial-focus
                  aria-invalid={
                    inviteFormSubmitted && Boolean(teamInviteFormErrors.name)
                  }
                  aria-describedby={
                    inviteFormSubmitted && teamInviteFormErrors.name
                      ? "team-invite-name-error"
                      : undefined
                  }
                  placeholder={t("例如：张宁")}
                  onChange={(event) => {
                    setInviteName(event.target.value);
                    if (inviteFormSubmitted) setInviteFormSubmitted(false);
                  }}
                />
                {inviteFormSubmitted && teamInviteFormErrors.name && (
                  <small id="team-invite-name-error">
                    {teamInviteFormErrors.name}
                  </small>
                )}
              </label>
              <label
                className={
                  inviteFormSubmitted && teamInviteFormErrors.email
                    ? "has-error"
                    : ""
                }
              >
                <span>{t("工作邮箱")}</span>
                <input
                  type="email"
                  value={inviteEmail}
                  disabled={isSendingInvite}
                  aria-invalid={
                    inviteFormSubmitted && Boolean(teamInviteFormErrors.email)
                  }
                  aria-describedby={
                    inviteFormSubmitted && teamInviteFormErrors.email
                      ? "team-invite-email-error"
                      : undefined
                  }
                  placeholder="name@company.com"
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    if (inviteFormSubmitted) setInviteFormSubmitted(false);
                  }}
                />
                {inviteFormSubmitted && teamInviteFormErrors.email && (
                  <small id="team-invite-email-error">
                    {teamInviteFormErrors.email}
                  </small>
                )}
              </label>
              <label>
                <span>{t("成员角色")}</span>
                <select
                  value={inviteRole}
                  disabled={isSendingInvite}
                  onChange={(event) => {
                    setInviteRole(event.target.value as TeamRole);
                    setInviteAdminAcknowledged(false);
                    if (inviteFormSubmitted) setInviteFormSubmitted(false);
                  }}
                >
                  {(["管理员", "审批者", "成员"] as TeamRole[]).map((role) => (
                    <option key={role} value={role}>
                      {t(role)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="team-role-preview">
              <div>
                <ShieldCheck size={17} />
                <span>
                  <small>{t("{inviteRole}权限", { inviteRole: t(inviteRole) })}</small>
                  <strong>{teamRoleDetails[inviteRole].summary}</strong>
                </span>
              </div>
              <div>
                {teamRoleDetails[inviteRole].permissions.map((permission) => (
                  <span key={permission}>
                    <Check size={14} />
                    {permission}
                  </span>
                ))}
              </div>
            </div>

            {inviteRole === "管理员" && (
              <label
                className={`team-admin-confirm${
                  inviteAdminAcknowledged ? " is-checked" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={inviteAdminAcknowledged}
                  disabled={isSendingInvite}
                  onChange={(event) =>
                    setInviteAdminAcknowledged(event.target.checked)
                  }
                />
                <ShieldCheck size={18} />
                <span>
                  <strong>{t("确认授予管理员权限")}</strong>
                  <small>
                    
                    {t("管理员可以邀请成员、编辑任务并审批外部操作。")}
                  </small>
                </span>
              </label>
            )}

            {inviteFormSubmitted &&
              (teamInviteFormHasErrors ||
                inviteNeedsAdminAcknowledgement ||
                teamSeatLimitReached) && (
              <div className="team-form-error-summary" role="alert">
                <AlertTriangle size={16} />
                {t(teamSeatLimitReached
                  ? t("当前方案没有可用席位，请先移除成员或升级方案。")
                  : inviteNeedsAdminAcknowledgement
                    ? t("请先确认管理员将获得的高权限。")
                    : t("请先修正上方信息，再发送邀请。"))}
              </div>
            )}

            <footer className="team-dialog-actions">
              <button
                type="button"
                disabled={isSendingInvite}
                onClick={closeTeamInvite}
              >
                
                {t("取消")}
              </button>
              <button
                className={`primary${!isOnline ? " is-offline" : ""}`}
                type="submit"
                disabled={isSendingInvite || teamSeatLimitReached}
              >
                {isSendingInvite ? (
                  <LoaderCircle className="is-spinning" size={16} />
                ) : !isOnline ? (
                  <Globe2 size={16} />
                ) : (
                  <Send size={16} />
                )}
                {t(isSendingInvite
                  ? t("正在发送")
                  : teamSeatLimitReached
                    ? t("席位已用完")
                  : isOnline
                    ? t("发送邀请")
                    : t("联网后发送"))}
              </button>
            </footer>
          </form>
        </div>
      )}

      {selectedTeamMember && (
        <div
          className="clarity-dialog-backdrop team-dialog-backdrop"
          onMouseDown={closeTeamMember}
        >
          <section
            className="team-member-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-member-title"
            aria-describedby="team-member-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="team-dialog-close"
              type="button"
              aria-label={t("关闭成员管理")}
              onClick={closeTeamMember}
            >
              <X size={17} />
            </button>
            <header className="team-member-heading">
              <span
                className={`team-member-avatar tone-${selectedTeamMember.tone}`}
              >
                {selectedTeamMember.avatar}
              </span>
              <div>
                <span>{t("成员权限")}</span>
                <h2 id="team-member-title">{selectedTeamMember.name}</h2>
                <p id="team-member-description">{selectedTeamMember.email}</p>
              </div>
              <span
                className={`team-member-dialog-status status-${selectedTeamMember.status}`}
              >
                <i />
                {t(selectedTeamMember.status)}
              </span>
            </header>

            {!isOnline && selectedTeamMember.role !== "所有者" && (
              <div className="team-network-note member" role="status">
                <Globe2 size={17} />
                <span>
                  <strong>{t("成员权限保持不变")}</strong>
                  <small>{t("角色、邀请与访问权限会在恢复网络后才能更新。")}</small>
                </span>
              </div>
            )}

            {memberWorkspaceConflict &&
              selectedTeamMember.role !== "所有者" && (
                <div
                  className="team-network-note member is-conflict"
                  role="alert"
                >
                  <AlertTriangle size={17} />
                  <span>
                    <strong>{t("另一窗口更新了成员角色")}</strong>
                    <small>{t("请先处理版本冲突，再保存这里的权限变更。")}</small>
                  </span>
                </div>
              )}

            <div className="team-member-facts">
              <span>
                <small>{t("当前角色")}</small>
                <strong>{t(selectedTeamMember.role)}</strong>
              </span>
              <span>
                <small>{t("最近活动")}</small>
                <strong>{selectedTeamMember.lastActive}</strong>
              </span>
              <span>
                <small>{t("审批权限")}</small>
                <strong>
                  {t(["所有者", "管理员", "审批者"].includes(
                    selectedTeamMember.role,
                  )
                    ? t("可以审批")
                    : t("不可审批"))}
                </strong>
              </span>
            </div>

            <div className="team-member-role-editor">
              <label>
                <span>{t("工作区角色")}</span>
                <select
                  value={memberRoleDraft}
                  disabled={selectedTeamMember.role === "所有者"}
                  onChange={(event) =>
                    setMemberRoleDraft(event.target.value as TeamRole)
                  }
                >
                  {(["管理员", "审批者", "成员"] as TeamRole[]).map((role) => (
                    <option key={role} value={role}>
                      {t(role)}
                    </option>
                  ))}
                  {selectedTeamMember.role === "所有者" && (
                    <option value={t("所有者")}>{t("所有者")}</option>
                  )}
                </select>
              </label>
              <div
                className={`team-role-change-panel${
                  teamMemberRoleDirty ? " has-changes" : ""
                }`}
              >
                <small>{t("权限变更")}</small>
                <div className="team-role-change-route">
                  <span>{t(selectedTeamMember.role)}</span>
                  <ChevronRight size={15} />
                  <strong>{t(memberRoleDraft)}</strong>
                </div>
                <p>{teamRoleDetails[memberRoleDraft].summary}</p>
                {teamMemberRoleDirty ? (
                  <div className="team-role-diff">
                    <section className="is-gained">
                      <span>{t("新增权限")}</span>
                      {gainedMemberPermissions.length ? (
                        gainedMemberPermissions.map((permission) => (
                          <small key={permission}>
                            <Plus size={13} />
                            {permission}
                          </small>
                        ))
                      ) : (
                        <small>
                          <Check size={13} />
                          
                          {t("没有新增权限")}
                        </small>
                      )}
                    </section>
                    <section className="is-lost">
                      <span>{t("收回权限")}</span>
                      {lostMemberPermissions.length ? (
                        lostMemberPermissions.map((permission) => (
                          <small key={permission}>
                            <X size={13} />
                            {permission}
                          </small>
                        ))
                      ) : (
                        <small>
                          <Check size={13} />
                          
                          {t("没有收回权限")}
                        </small>
                      )}
                    </section>
                  </div>
                ) : (
                  <div className="team-role-unchanged">
                    <CheckCircle2 size={15} />
                    
                    {t("当前权限保持不变")}
                  </div>
                )}
              </div>
            </div>

            {selectedTeamMember.role === "所有者" && (
              <div className="team-owner-note">
                <ShieldCheck size={17} />
                <span>
                  <strong>{t("工作区所有者")}</strong>
                  <small>{t("为避免失去管理权限，所有者角色不能在这里修改或移除。")}</small>
                </span>
              </div>
            )}

            {memberRemoveConfirm ? (
              <div className="team-member-remove-confirm" role="alert">
                <header>
                  <AlertTriangle size={18} />
                  <span>
                    <strong>{t("移除 {name}？", { name: selectedTeamMember.name })}</strong>
                    <small>
                      {t(selectedTeamMember.status === "已邀请"
                        ? t("邀请链接会立即失效，并释放 1 个团队席位。")
                        : t("该成员会立即失去当前工作区的全部访问权限。"))}
                    </small>
                  </span>
                </header>
                <div className="team-member-remove-impact">
                  <span>
                    <X size={13} />
                    
                    {t("任务访问")}
                  </span>
                  <span>
                    <X size={13} />
                    
                    {t("成果下载")}
                  </span>
                  <span>
                    <X size={13} />
                    
                    {t("审批与设置")}
                  </span>
                </div>
                <label
                  className={
                    memberRemoveAcknowledged ? "is-checked" : undefined
                  }
                >
                  <input
                    type="checkbox"
                    checked={memberRemoveAcknowledged}
                    onChange={(event) =>
                      setMemberRemoveAcknowledged(event.target.checked)
                    }
                  />
                  <span>
                    
                    {t("我确认移除")} <strong>{selectedTeamMember.email}</strong>
                  </span>
                </label>
                <div className="team-member-remove-actions">
                  <button
                    type="button"
                    data-overlay-initial-focus
                    onClick={() => {
                      setMemberRemoveConfirm(false);
                      setMemberRemoveAcknowledged(false);
                    }}
                  >
                    
                    {t("取消")}
                  </button>
                  <button
                    className={`danger${!isOnline ? " is-offline" : ""}`}
                    type="button"
                    disabled={!memberRemoveAcknowledged || !isOnline}
                    onClick={confirmRemoveTeamMember}
                  >
                    {t(!isOnline
                      ? t("联网后移除")
                      : memberRemoveAcknowledged
                        ? t("确认移除")
                        : t("请先确认"))}
                  </button>
                </div>
              </div>
            ) : (
              <footer className="team-member-actions">
                {selectedTeamMember.role === "所有者" ? (
                  <button
                    className="primary"
                    type="button"
                    data-overlay-initial-focus
                    onClick={closeTeamMember}
                  >
                    
                    {t("完成")}
                  </button>
                ) : (
                  <>
                    <button
                      className="remove"
                      type="button"
                      onClick={() => {
                        setMemberRemoveAcknowledged(false);
                        setMemberRemoveConfirm(true);
                      }}
                    >
                      <Trash2 size={15} />
                      
                      {t("移除成员")}
                    </button>
                    {selectedTeamMember.status === "已邀请" && (
                      <button
                        className={!isOnline ? "is-offline" : undefined}
                        type="button"
                        onClick={resendTeamInvite}
                      >
                        {isOnline ? <Mail size={15} /> : <Globe2 size={15} />}
                        {(isOnline ? t("重发邀请") : t("联网后重发"))}
                      </button>
                    )}
                    <button
                      className={`primary${!isOnline ? " is-offline" : ""}`}
                      type="button"
                      data-overlay-initial-focus
                      disabled={!memberRoleCanSave}
                      onClick={saveTeamMemberRole}
                    >
                      {memberRoleCanSave ? (
                        <CheckCircle2 size={15} />
                      ) : !isOnline ? (
                        <Globe2 size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                      {!isOnline
                        ? t("联网后保存")
                        : memberWorkspaceConflict
                          ? t("先处理冲突")
                          : teamMemberRoleDirty
                            ? t("保存为{memberRoleDraft}", { memberRoleDraft: t(memberRoleDraft) })
                            : t("角色未更改")}
                    </button>
                  </>
                )}
              </footer>
            )}
          </section>
        </div>
      )}

      {selectedConnector && (
        <div
          className="clarity-dialog-backdrop connector-detail-backdrop"
          onMouseDown={closeConnector}
        >
          <section
            className={`connector-detail-dialog tone-${selectedConnector.tone} ${
              selectedConnectorHasIssue ? "is-attention" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="connector-detail-title"
            aria-describedby="connector-detail-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="connector-detail-close"
              type="button"
              aria-label={t("关闭连接器管理")}
              data-overlay-initial-focus
              onClick={closeConnector}
            >
              <X size={17} />
            </button>

            <header className="connector-detail-heading">
              <span className="connector-detail-icon">
                <SelectedConnectorIcon size={23} />
              </span>
              <div>
                <span>{t("连接器管理")}</span>
                <h2 id="connector-detail-title">{selectedConnector.name}</h2>
                <p id="connector-detail-description">
                  {selectedConnector.description}
                </p>
              </div>
              <span
                className={`connector-detail-status ${
                  selectedConnectorHasIssue
                    ? "is-attention"
                    : connectorStates[selectedConnector.id]
                      ? "is-connected"
                      : ""
                }`}
              >
                <i />
                {t(selectedConnectorHasIssue
                  ? t("需要重新授权")
                  : connectorStates[selectedConnector.id]
                    ? t("连接正常")
                    : t("尚未连接"))}
              </span>
            </header>

            <div className="connector-detail-facts">
              <span>
                <small>{t("授权范围")}</small>
                <strong>
                  {selectedConnectorHasIssue
                    ? t("授权已过期，暂不可用")
                    : connectorStates[selectedConnector.id]
                    ? selectedConnector.scope
                    : t("未授予任何权限")}
                </strong>
              </span>
              <span>
                <small>
                  {(selectedConnectorHasIssue ? t("受影响任务") : t("关联任务"))}
                </small>
                <strong>{t("{value}{value2}个", { value: selectedConnectorHasIssue
                    ? selectedConnectorIssueTasks.length
                    : connectorUsageCounts[selectedConnector.id], value2: " " })}</strong>
              </span>
              <span>
                <small>{t("最近使用")}</small>
                <strong>
                  {selectedConnectorHasIssue
                    ? selectedConnectorIssueTasks[0]?.updated
                    : connectorStates[selectedConnector.id]
                    ? selectedConnector.lastUsed
                  : t("尚未使用")}
                </strong>
              </span>
              <span>
                <small>{t("连接检测")}</small>
                <strong>
                  {selectedConnectorHasIssue
                    ? t("未通过 · 需要修复")
                    : !connectorStates[selectedConnector.id]
                      ? t("授权后自动检测")
                      : connectorTestingId === selectedConnector.id ||
                          connectorTestingAll
                        ? t("正在检测")
                        : selectedConnectorCheck
                          ? `${selectedConnectorCheck.checkedAt} · ${selectedConnectorCheck.latency} ms`
                          : t("尚未检测")}
                </strong>
              </span>
            </div>

            {selectedConnectorHasIssue && (
              <section className="connector-issue-panel" role="alert">
                <div className="connector-issue-heading">
                  <span>
                    <AlertTriangle size={17} />
                  </span>
                  <div>
                    <em>{t("授权异常")}</em>
                    <strong>{t("连接仍然存在，但当前凭证已不可用")}</strong>
                  </div>
                  <code>
                    {selectedConnectorIssueTasks[0]?.errorCode ??
                      "AUTH_EXPIRED"}
                  </code>
                </div>
                <p>
                  
                  {t("为避免未经确认的外部操作，系统已停止受影响任务。重新授权不会自动发送内容，也不会删除原始失败记录。")}
                </p>
                <div className="connector-issue-tasks">
                  <span>{t("受影响任务")}</span>
                  {selectedConnectorIssueTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openConnectorAffectedTask(task.id)}
                    >
                      <span>
                        <strong>{task.title}</strong>
                        <small>{task.lastError}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section
              className={`connector-health-check ${
                selectedConnectorHasIssue
                  ? "is-risk"
                  : connectorStates[selectedConnector.id]
                    ? "is-ready"
                    : "is-idle"
              }`}
              aria-label={t("连接健康检查")}
            >
              <header>
                <div>
                  <span>{t("连接健康检查")}</span>
                  <strong>
                    {t(selectedConnectorHasIssue
                      ? t("凭证失效，外部调用已被阻止")
                      : connectorStates[selectedConnector.id]
                        ? connectorTestingId === selectedConnector.id ||
                          connectorTestingAll
                          ? t("正在验证身份、权限和响应")
                          : t("身份、权限和服务响应均正常")
                        : t("完成授权后会自动执行三项检测"))}
                  </strong>
                </div>
                <em>
                  {t(selectedConnectorHasIssue
                    ? t("1 项失败")
                    : connectorStates[selectedConnector.id]
                      ? t("3 / 3 通过")
                      : t("等待授权"))}
                </em>
              </header>
              <div>
                <span
                  className={
                    selectedConnectorHasIssue
                      ? "is-failed"
                      : connectorStates[selectedConnector.id]
                        ? "is-passed"
                        : ""
                  }
                >
                  {selectedConnectorHasIssue ? (
                    <X size={14} />
                  ) : connectorStates[selectedConnector.id] ? (
                    <Check size={14} />
                  ) : (
                    <Timer size={14} />
                  )}
                  <span>
                    <small>{t("身份凭证")}</small>
                    <strong>
                      {selectedConnectorHasIssue
                        ? t("已失效")
                        : connectorStates[selectedConnector.id]
                          ? selectedConnector.credential
                          : t("尚未验证")}
                    </strong>
                  </span>
                </span>
                <span
                  className={
                    connectorStates[selectedConnector.id] &&
                    !selectedConnectorHasIssue
                      ? "is-passed"
                      : ""
                  }
                >
                  {connectorStates[selectedConnector.id] &&
                  !selectedConnectorHasIssue ? (
                    <Check size={14} />
                  ) : (
                    <Timer size={14} />
                  )}
                  <span>
                    <small>{t("权限范围")}</small>
                    <strong>
                      {t(selectedConnectorHasIssue
                        ? t("等待重新确认")
                        : connectorStates[selectedConnector.id]
                          ? t("与任务范围一致")
                          : t("连接时确认"))}
                    </strong>
                  </span>
                </span>
                <span
                  className={
                    connectorStates[selectedConnector.id] &&
                    !selectedConnectorHasIssue
                      ? "is-passed"
                      : selectedConnectorHasIssue
                        ? "is-protected"
                        : ""
                  }
                >
                  {connectorStates[selectedConnector.id] &&
                  !selectedConnectorHasIssue ? (
                    <Check size={14} />
                  ) : selectedConnectorHasIssue ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <Timer size={14} />
                  )}
                  <span>
                    <small>{t("服务响应")}</small>
                    <strong>
                      {selectedConnectorHasIssue
                        ? t("任务已安全停止")
                        : connectorStates[selectedConnector.id]
                          ? selectedConnectorCheck
                            ? `${selectedConnectorCheck.latency} ms`
                            : t("可正常调用")
                          : t("尚未检测")}
                    </strong>
                  </span>
                </span>
              </div>
            </section>

            <div className="connector-permission-section">
              <div>
                <span>{t("权限范围")}</span>
                <strong>
                  {t(connectorStates[selectedConnector.id]
                    ? t("当前已允许以下操作")
                    : t("连接后将请求以下权限"))}
                </strong>
              </div>
              <div className="connector-permission-list">
                {selectedConnector.permissions.map((permission) => (
                  <span key={permission}>
                    <Check size={15} />
                    {permission}
                  </span>
                ))}
              </div>
            </div>

            <div className="connector-safety-note">
              <ShieldCheck size={17} />
              <span>
                {t(selectedConnector.id === "mail"
                  ? t("邮件只会在你确认后发送，连接器不会绕过审批保护。")
                  : t("连接器只在任务需要时调用，每次使用都会写入运行记录。"))}
              </span>
            </div>

            {(selectedConnectorHasIssue ||
              !connectorStates[selectedConnector.id]) && (
              <label
                className={`connector-authorize-confirm${
                  connectorAuthorizeAcknowledged ? " is-checked" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={connectorAuthorizeAcknowledged}
                  disabled={
                    connectorTestingId !== null || connectorTestingAll
                  }
                  onChange={(event) =>
                    setConnectorAuthorizeAcknowledged(event.target.checked)
                  }
                />
                <ShieldCheck size={18} />
                <span>
                  <strong>
                    {t(selectedConnectorHasIssue
                      ? t("确认恢复上述权限范围")
                      : t("确认授予上述权限范围"))}
                  </strong>
                  <small>
                    
                    {t("仅允许当前列出的操作，新的权限会再次请求你的确认。")}
                  </small>
                </span>
              </label>
            )}

            {connectorDisconnectConfirm ? (
              <div className="connector-disconnect-confirm" role="alert">
                <AlertTriangle size={18} />
                <span>
                  <strong>{t("确认断开 {name}？", { name: selectedConnector.name })}</strong>
                  <small>{t("{value} 个关联任务将无法继续使用这项能力，历史记录不会被删除。", { value: connectorUsageCounts[selectedConnector.id] })}</small>
                </span>
                <label
                  className={`connector-disconnect-ack${
                    connectorDisconnectAcknowledged ? " is-checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    data-overlay-initial-focus
                    checked={connectorDisconnectAcknowledged}
                    onChange={(event) =>
                      setConnectorDisconnectAcknowledged(event.target.checked)
                    }
                  />
                  <span>
                    <strong>{t("我确认后续任务会失去这项能力")}</strong>
                    <small>{t("断开后可以重新授权，已有审计记录会继续保留。")}</small>
                  </span>
                </label>
                <div className="connector-disconnect-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectorDisconnectConfirm(false);
                      setConnectorDisconnectAcknowledged(false);
                    }}
                  >
                    
                    {t("取消")}
                  </button>
                  <button
                    className="danger"
                    type="button"
                    disabled={!connectorDisconnectAcknowledged}
                    onClick={confirmDisconnectConnector}
                  >
                    {t(connectorDisconnectAcknowledged
                      ? t("确认断开")
                      : t("请先确认"))}
                  </button>
                </div>
              </div>
            ) : (
              <div className="connector-detail-actions">
                {selectedConnectorHasIssue ? (
                  <>
                    <button
                      className="disconnect"
                      type="button"
                      onClick={requestConnectorDisconnect}
                    >
                      
                      {t("断开连接")}
                    </button>
                    <button
                      className="primary reauthorize"
                      type="button"
                      disabled={
                        connectorTestingId !== null ||
                        connectorTestingAll ||
                        !connectorAuthorizeAcknowledged
                      }
                      aria-busy={
                        connectorTestingId === selectedConnector.id ||
                        connectorTestingAll
                      }
                      onClick={() =>
                        reauthorizeConnector(selectedConnector.id)
                      }
                    >
                      {connectorTestingId === selectedConnector.id ||
                      connectorTestingAll ? (
                        <LoaderCircle className="is-spinning" size={16} />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                      {t(connectorTestingId === selectedConnector.id ||
                      connectorTestingAll
                        ? t("正在重新授权")
                        : connectorAuthorizeAcknowledged
                          ? t("重新授权")
                          : t("请先确认权限"))}
                    </button>
                  </>
                ) : connectorStates[selectedConnector.id] ? (
                  <>
                    <button
                      className="disconnect"
                      type="button"
                      onClick={requestConnectorDisconnect}
                    >
                      
                      {t("断开连接")}
                    </button>
                    <button
                      className="primary"
                      type="button"
                      data-overlay-initial-focus
                      disabled={
                        connectorTestingId !== null || connectorTestingAll
                      }
                      aria-busy={
                        connectorTestingId === selectedConnector.id ||
                        connectorTestingAll
                      }
                      onClick={() => testConnector(selectedConnector.id)}
                    >
                      {connectorTestingId === selectedConnector.id ||
                      connectorTestingAll ? (
                        <LoaderCircle className="is-spinning" size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {t(connectorTestingId === selectedConnector.id ||
                      connectorTestingAll
                        ? t("正在测试")
                        : t("测试连接"))}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedConnectorId(null)}
                    >
                      
                      {t("暂不连接")}
                    </button>
                    <button
                      className="primary"
                      type="button"
                      data-overlay-initial-focus
                      disabled={
                        connectorTestingAll ||
                        !connectorAuthorizeAcknowledged
                      }
                      onClick={() => connectConnector(selectedConnector.id)}
                    >
                      <Link2 size={16} />
                      {t(connectorAuthorizeAcknowledged
                        ? t("连接并授权")
                        : t("请先确认权限"))}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {inspectedRunTask && inspectedRun && (
        <div
          className="clarity-dialog-backdrop run-detail-backdrop"
          onMouseDown={closeRunDetail}
        >
          <section
            className={`run-detail-dialog status-${inspectedRun.status}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="run-detail-close"
              type="button"
              data-overlay-initial-focus
              aria-label={t("返回任务详情")}
              title={t("返回任务详情")}
              onClick={closeRunDetail}
            >
              <X size={18} />
            </button>

            <header className="run-detail-heading">
              <span className="run-detail-result-icon" aria-hidden="true">
                {inspectedRun.status === "成功" && <CheckCircle2 size={22} />}
                {inspectedRun.status === "失败" && <AlertTriangle size={22} />}
                {inspectedRun.status === "运行中" && (
                  <LoaderCircle className="is-spinning" size={22} />
                )}
                {inspectedRun.status === "已取消" && <Pause size={22} />}
              </span>
              <div>
                <span>{t("运行详情")}</span>
                <h2 id="run-detail-title">{inspectedRunTask.title}</h2>
                <p>{inspectedRun.summary}</p>
              </div>
              <em>{t(inspectedRun.status)}</em>
            </header>

            <div className="run-detail-identity" aria-label={t("运行信息")}>
              <span className="run-detail-id">
                <small>{t("运行 ID")}</small>
                <span>
                  <code>{inspectedRun.id}</code>
                  <button
                    type="button"
                    aria-label={t("复制运行 ID")}
                    title={t("复制运行 ID")}
                    onClick={() => copyTaskRunId(inspectedRun)}
                  >
                    <Copy size={14} />
                  </button>
                </span>
              </span>
              <span>
                <small>{t("开始时间")}</small>
                <strong>{formatTaskRunTime(inspectedRun.startedAt)}</strong>
              </span>
              <span>
                <small>{t("实际耗时")}</small>
                <strong>
                  {formatTaskRunDuration(inspectedRun.durationSeconds)}
                </strong>
              </span>
              <span>
                <small>{t("启动方式")}</small>
                <strong>{t(inspectedRunLaunchType)}</strong>
              </span>
            </div>

            <section className="run-stage-section">
              <div className="run-section-heading">
                <span>
                  <small>{t("执行路径")}</small>
                  <h3>{t("从配置到审计的完整阶段")}</h3>
                </span>
                <em>{t("{length}/{length2} 已完成", { length: inspectedRunStages.filter((stage) => stage.status === "成功")
                    .length, length2: inspectedRunStages.length })}</em>
              </div>
              <ol className="run-stage-list" aria-label={t("运行阶段")}>
                {inspectedRunStages.map((stage, index) => (
                  <li className={`stage-${stage.status}`} key={stage.id}>
                    <span className="run-stage-index">
                      {stage.status === "成功" ? (
                        <Check size={15} />
                      ) : stage.status === "失败" ? (
                        <AlertTriangle size={15} />
                      ) : stage.status === "运行中" ? (
                        <LoaderCircle className="is-spinning" size={15} />
                      ) : stage.status === "已取消" ? (
                        <Pause size={15} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span>
                      <strong>{stage.title}</strong>
                      <small>{stage.detail}</small>
                    </span>
                    <em>{t(stage.status)}</em>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={`run-boundary-panel status-${inspectedRun.status}`}
              aria-label={t("结果与安全边界")}
            >
              <div className="run-section-heading">
                <span>
                  <small>{t("结果与安全边界")}</small>
                  <h3>
                    {t(inspectedRun.status === "失败"
                      ? t("失败已被安全拦截")
                      : inspectedRun.status === "运行中"
                        ? t("正在受控执行")
                        : inspectedRun.status === "已取消"
                          ? t("运行已在检查点停止")
                          : t("运行结果已完成保存"))}
                  </h3>
                </span>
                <ShieldCheck size={19} />
              </div>
              {inspectedRun.status === "失败" && (
                <div className="run-error-summary" role="alert">
                  <code>{inspectedRun.errorCode ?? "RUN_FAILED"}</code>
                  <p>
                    {inspectedRun.errorMessage ??
                      t("本次运行没有完成，系统已保留失败现场和审计记录。")}
                  </p>
                </div>
              )}
              <div className="run-evidence-grid">
                <span>
                  <small>{t("外部动作")}</small>
                  <strong>
                    {(inspectedRunAuthorizationBlocked ? t("0 次") : t("已记录"))}
                  </strong>
                  <em>
                    {t(inspectedRunAuthorizationBlocked
                      ? t("授权通过前未执行")
                      : t("全部进入审计"))}
                  </em>
                </span>
                <span>
                  <small>{t("关联成果")}</small>
                  <strong>{t("{length} 项", { length: inspectedRunArtifacts.length })}</strong>
                  <em>{t("版本和来源可追溯")}</em>
                </span>
                <span>
                  <small>{t("审计证据")}</small>
                  <strong>{t("{length} 条", { length: inspectedRunActivity.length })}</strong>
                  <em>{t("保存在本机工作区")}</em>
                </span>
              </div>
            </section>

            {inspectedRun.sessionId &&
              inspectedRun.status !== "运行中" &&
              inspectedRunTask.status !== "运行中" && (
                <form
                  className="run-detail-continue"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (
                      continueRunConversation(
                        inspectedRunTask,
                        inspectedRun,
                        runContinuePrompt,
                      )
                    ) {
                      setRunContinuePrompt("");
                      dismissRunDetail();
                      openTask(inspectedRunTask.id);
                    }
                  }}
                >
                  <label htmlFor="run-continue-input">
                    <strong>{t("继续对话")}</strong>
                    <small>
                      
                      {t("接着这次运行的对话再说一句。智能体记得之前做过什么，后台服务重启过也一样。")}
                    </small>
                  </label>
                  <div>
                    <textarea
                      id="run-continue-input"
                      rows={2}
                      value={runContinuePrompt}
                      placeholder={t("比如：把刚才的结果整理成表格")}
                      onChange={(event) => setRunContinuePrompt(event.target.value)}
                    />
                    <button
                      className="primary"
                      type="submit"
                      disabled={!runContinuePrompt.trim()}
                    >
                      <Send size={15} />
                      
                      {t("继续")}
                    </button>
                  </div>
                </form>
              )}

            <footer className="run-detail-actions">
              <button
                type="button"
                title={t("复制运行 ID")}
                onClick={() => copyTaskRunId(inspectedRun)}
              >
                <Copy size={15} />
                
                {t("复制 ID")}
              </button>
              <button
                type="button"
                onClick={() => downloadTaskRun(inspectedRunTask, inspectedRun)}
              >
                <Download size={15} />
                
                {t("导出 JSON")}
              </button>
              {inspectedRun.status === "运行中" &&
              inspectedRunTask.status === "运行中" ? (
                <button
                  className="primary is-caution"
                  type="button"
                  onClick={() => pauseInspectedRun(inspectedRunTask)}
                >
                  <Pause size={16} />
                  
                  {t("暂停本次运行")}
                </button>
              ) : inspectedRun.status === "失败" &&
                inspectedRunTask.status !== "运行中" ? (
                <button
                  className="primary"
                  type="button"
                  onClick={() => retryInspectedRun(inspectedRunTask)}
                >
                  <RotateCcw size={16} />
                  
                  {t("从安全检查点重试")}
                </button>
              ) : inspectedRun.status === "成功" &&
                inspectedRunArtifacts.length > 0 ? (
                <button
                  className="primary"
                  type="button"
                  onClick={() => openTaskArtifacts(inspectedRunTask.id)}
                >
                  <Files size={16} />
                  
                  {t("查看运行成果")}
                </button>
              ) : (
                <button
                  className="primary"
                  type="button"
                  onClick={openInspectedRunTask}
                >
                  
                  {t("查看当前任务")}
                  <ChevronRight size={16} />
                </button>
              )}
            </footer>
          </section>
        </div>
      )}

      {selectedTask && (
        <div
          className="task-detail-backdrop"
          onMouseDown={closeTaskDetail}
        >
          <aside
            className="task-detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("任务详情：{title}", { title: selectedTask.title })}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="task-detail-heading">
              <div className="task-detail-heading-meta">
                <span>{t("任务详情")}</span>
                <em className={`status-label status-${selectedTask.status}`}>
                  {t(selectedTask.status)}
                </em>
              </div>
              <div className="task-detail-heading-actions">
                <button
                  type="button"
                  aria-label={t("编辑任务")}
                  title={t("编辑任务")}
                  onClick={() => beginEditTask(selectedTask)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t("复制任务")}
                  title={t("复制任务")}
                  onClick={() => duplicateTask(selectedTask)}
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t("关闭任务详情")}
                  title={t("关闭")}
                  data-overlay-initial-focus
                  onClick={closeTaskDetail}
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="task-detail-intro">
              <div className="task-detail-intro-heading">
                <span className={`task-detail-icon status-${selectedTask.status}`}>
                  {selectedTask.status === "运行中" && <Activity size={21} />}
                  {selectedTask.status === "待确认" && <ShieldCheck size={21} />}
                  {selectedTask.status === "失败" && <AlertTriangle size={21} />}
                  {selectedTask.status === "已暂停" && <Pause size={21} />}
                  {selectedTask.status === "已完成" && <CheckCircle2 size={21} />}
                </span>
                <div>
                  <h2>{selectedTask.title}</h2>
                  <p>{selectedTask.description}</p>
                </div>
              </div>
            </div>

            {selectedTask.status === "失败" && (
              <section
                className={`task-failure-diagnostic ${
                  selectedTaskRecoveryReady ? "is-ready" : ""
                }`}
                role="alert"
              >
                <div className="task-failure-heading">
                  <span>
                    {selectedTaskRecoveryReady ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </span>
                  <div>
                    <em>
                      {t(selectedTaskRecoveryReady
                        ? t("已准备恢复")
                        : t("已安全停止"))}
                    </em>
                    <h3>
                      {t(selectedTaskRecoveryReady
                        ? t("连接器已修复，可以从安全检查点继续")
                        : t("任务未完成，但没有执行外部发送"))}
                    </h3>
                  </div>
                  <code>{selectedTask.errorCode ?? "TASK_FAILED"}</code>
                </div>
                <p>
                  {selectedTask.lastError ??
                    t("任务遇到无法自动恢复的问题，已在安全检查点停止。")}
                </p>
                <div className="task-failure-impact">
                  <span>
                    <CheckCircle2 size={15} />
                    
                    {t("已生成的成果与证据仍然保留")}
                  </span>
                  <span>
                    <ShieldCheck size={15} />
                    
                    {t("未向外部人员发送任何内容")}
                  </span>
                </div>
                <div className="task-failure-actions">
                  <button type="button" onClick={() => retryTask(selectedTask)}>
                    {selectedTaskRecoveryReady ? (
                      <Play size={15} />
                    ) : (
                      <RotateCcw size={15} />
                    )}
                    {(selectedTaskRecoveryReady ? t("继续运行") : t("立即重试"))}
                  </button>
                  <button type="button" onClick={openTaskRecoverySettings}>
                    <Link2 size={15} />
                    
                    {t("检查邮件连接器")}
                  </button>
                </div>
              </section>
            )}

            <section
              className={`task-detail-progress ${
                selectedTaskRecoveryReady
                  ? "is-ready"
                  : selectedTask.status === "失败"
                    ? "is-failed"
                    : ""
              }`}
              aria-label={t("任务进度")}
            >
              <div>
                <span>{t("整体进度")}</span>
                <strong>{selectedTask.progress}%</strong>
              </div>
              <span>
                <i style={{ width: `${selectedTask.progress}%` }} />
              </span>
              <small>{selectedTask.updated}</small>
            </section>

            <section className="task-detail-facts">
              {/* 直接输入需求的任务没有单独的目标：网址、文件夹写在需求里。 */}
              {selectedTask.target.trim() && (
              <div>
                <Globe2 size={17} />
                <span>
                  <small>{t("任务目标")}</small>
                  <strong>{selectedTask.target}</strong>
                </span>
              </div>
              )}
              <div>
                <CalendarDays size={17} />
                <span>
                  <small>{t("运行计划")}</small>
                  <strong>{formatTaskSchedule(selectedTask)}</strong>
                </span>
              </div>
              <div>
                <Clock3 size={17} />
                <span>
                  <small>{t("下次运行")}</small>
                  <strong>
                    {selectedTask.status === "失败"
                      ? t("等待你确认重试")
                      : getNextRunLabel(selectedTask)}
                  </strong>
                </span>
              </div>
              <div>
                <ShieldCheck size={17} />
                <span>
                  <small>{t("执行策略")}</small>
                  <strong>
                    {t(selectedTask.requiresApproval ?? true
                      ? t("对外操作前必须确认")
                      : t("按任务范围自动执行"))}
                  </strong>
                </span>
              </div>
            </section>

            <section className="task-run-health" aria-label={t("运行健康")}>
              <div className="task-run-health-heading">
                <span>
                  <small>{t("运行健康")}</small>
                  <strong>{t("最近执行是否稳定")}</strong>
                </span>
                <em
                  className={
                    selectedTaskRecoveryReady
                      ? "is-ready"
                      : selectedTask.status === "失败"
                      ? "is-attention"
                      : selectedTask.status === "运行中"
                        ? "is-live"
                        : "is-healthy"
                  }
                >
                  {t(selectedTaskRecoveryReady
                    ? t("可以恢复")
                    : selectedTask.status === "失败"
                      ? t("需要处理")
                    : selectedTask.status === "运行中"
                      ? t("正在运行")
                      : t("运行正常"))}
                </em>
              </div>
              <div className="task-run-metrics">
                <span>
                  <small>{t("成功率")}</small>
                  <strong>
                    {selectedTaskSuccessRate === null
                      ? t("暂无")
                      : `${selectedTaskSuccessRate}%`}
                  </strong>
                </span>
                <span>
                  <small>{t("近期开跑")}</small>
                  <strong>{t("{length} 次", { length: selectedTaskRuns.length })}</strong>
                </span>
                <span>
                  <small>{t("平均耗时")}</small>
                  <strong>
                    {selectedTaskAverageDuration === undefined
                      ? t("暂无")
                      : formatTaskRunDuration(selectedTaskAverageDuration)}
                  </strong>
                </span>
              </div>
              {selectedTaskRuns.length > 0 ? (
                <ol className="task-run-list">
                  {selectedTaskRuns.slice(0, 3).map((run) => (
                    <li className={`run-${run.status}`} key={run.id}>
                      <button
                        type="button"
                        aria-label={t("查看运行：{id}", { id: run.id })}
                        onClick={() => openTaskRun(selectedTask.id, run.id)}
                      >
                        <span>
                          {run.status === "成功" && <CheckCircle2 size={14} />}
                          {run.status === "失败" && <AlertTriangle size={14} />}
                          {run.status === "运行中" && (
                            <LoaderCircle className="is-spinning" size={14} />
                          )}
                          {run.status === "已取消" && <Pause size={14} />}
                        </span>
                        <span>
                          <strong>{t(run.status)}</strong>
                          <small>{run.summary}</small>
                        </span>
                        <span>
                          <time dateTime={run.startedAt}>
                            {formatTaskRunTime(run.startedAt)}
                          </time>
                          <small>
                            {formatTaskRunDuration(run.durationSeconds)}
                          </small>
                        </span>
                        <ChevronRight size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="task-run-empty">
                  
                  {t("第一次运行开始后，这里会显示成功率和耗时。")}
                </div>
              )}
            </section>

            <section className="task-detail-artifacts">
              <div>
                <span>{t("关联成果")}</span>
                <button
                  type="button"
                  onClick={() => openTaskArtifacts(selectedTask.id)}
                >
                  {artifacts.filter((artifact) => artifact.taskId === selectedTask.id)
                    .length}{" "}
                  
                  {t("项")}
                  <ChevronRight size={14} />
                </button>
              </div>
              {selectedTaskArtifacts.length > 0 ? (
                <div className="task-artifact-list">
                  {selectedTaskArtifacts.map((artifact) => {
                    const ArtifactIcon = artifactIconMap[artifact.type];
                    return (
                      <button
                        key={artifact.id}
                        type="button"
                        onClick={() =>
                          openArtifact(artifact.id, { taskId: selectedTask.id })
                        }
                      >
                        <span className={`type-${artifact.type}`}>
                          <ArtifactIcon size={15} />
                        </span>
                        <span>
                          <strong>{artifact.title}</strong>
                          <small>
                            {artifact.format} · {artifact.sizeKb.toFixed(1)} KB
                          </small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="task-artifact-empty">
                  <Files size={17} />
                  <span>
                    <strong>{t("还没有生成成果")}</strong>
                    <small>{t("任务完成交付后会自动显示在这里。")}</small>
                  </span>
                </div>
              )}
            </section>

            <section className="task-detail-trace">
              <div>
                <span>{t("最近动作")}</span>
                <button
                  type="button"
                  onClick={() => openTaskActivity(selectedTask.id)}
                >
                  
                  {t("完整记录")}
                  <ChevronRight size={14} />
                </button>
              </div>
              {selectedTaskActivity.length > 0 ? (
                <ol className="task-activity-list">
                  {selectedTaskActivity.map((item) => {
                    const TraceIcon = activityIconMap[item.icon] ?? Activity;
                    return (
                      <li className={`trace-${item.tone}`} key={item.id}>
                        <i>
                          <TraceIcon size={13} />
                        </i>
                        <span>
                          <strong>{item.title}</strong>
                          <small>
                            <time dateTime={item.createdAt}>{item.time}</time>
                            {item.detail}
                          </small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="task-trace-empty">
                  <History size={18} />
                  <span>
                    <strong>{t("还没有可用记录")}</strong>
                    <small>{t("新的关键动作会自动显示在这里。")}</small>
                  </span>
                </div>
              )}
            </section>

            <footer className="task-detail-actions">
              <button
                className="primary"
                type="button"
                onClick={() => updateTaskStatus(selectedTask)}
              >
                {selectedTask.status === "运行中" && <Pause size={16} />}
                {selectedTask.status === "待确认" && <ShieldCheck size={16} />}
                {selectedTask.status === "失败" &&
                  (selectedTaskRecoveryReady ? (
                    <Play size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  ))}
                {(selectedTask.status === "已暂停" || selectedTask.status === "已完成") && (
                  <Play size={16} />
                )}
                {selectedTask.status === "运行中" && t("暂停任务")}
                {selectedTask.status === "待确认" && t("处理确认")}
                {selectedTask.status === "失败" &&
                  (selectedTaskRecoveryReady ? t("继续运行") : t("重试任务"))}
                {selectedTask.status === "已暂停" && t("继续任务")}
                {selectedTask.status === "已完成" && t("再次运行")}
              </button>
              {selectedTask.pinned ? (
                <button type="button" onClick={closeTaskDetail}>
                  
                  {t("关闭")}
                </button>
              ) : (
                <button
                  className="danger"
                  type="button"
                  onClick={() => requestDeleteTask(selectedTask)}
                >
                  <Trash2 size={15} />
                  
                  {t("删除")}
                </button>
              )}
            </footer>
          </aside>
        </div>
      )}

      {composerOpen && (
        <div
          className="clarity-dialog-backdrop task-composer-backdrop"
          onMouseDown={requestCloseComposer}
        >
          <form
            className="clarity-dialog"
            role="dialog"
            aria-modal="true"
            aria-busy={isSavingTask}
            aria-hidden={taskDiscardOpen || undefined}
            aria-label={editingTaskId ? t("编辑任务") : t("新建任务")}
            aria-labelledby="task-composer-title"
            inert={taskDiscardOpen}
            onSubmit={createTask}
            onMouseDown={(event) => event.stopPropagation()}
            noValidate
          >
            <div className="clarity-dialog-heading">
              <div>
                <span>{(editingTaskId ? t("编辑配置") : t("任务配置"))}</span>
                <h2 id="task-composer-title">
                  {editingTaskId
                    ? t("更新任务设置")
                    : runtimeMode
                      ? t("交给智能体一项工作")
                      : t("交给 Unzoo One 一项工作")}
                </h2>
                <p>
                  {editingTaskId
                    ? t("修改会立即保存，正在运行的任务会使用新配置。")
                    : runtimeMode
                      ? t("说清楚要做什么、交付什么，智能体会自己规划步骤；每次要动手前都会先问你。")
                      : t("描述结果，选择节奏，然后让 AI 持续执行。")}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("关闭")}
                disabled={isSavingTask}
                onClick={requestCloseComposer}
              >
                <X size={17} />
              </button>
            </div>

            {!isOnline && (
              <div className="task-offline-note" role="status">
                <Globe2 size={16} />
                <span>
                  <strong>{t("当前处于离线状态")}</strong>
                  <small>
                    
                    {t("任务配置会保存在本机，但不会显示为正在运行；恢复网络后可以手动开始。")}
                  </small>
                </span>
              </div>
            )}

            {!editingTaskId && budgetRunBlocked && (
              <div className="task-budget-note" role="status">
                <ShieldCheck size={16} />
                <span>
                  <strong>{t("月度额度已用完")}</strong>
                  <small>
                    
                    {t("任务可以保存，但会保持暂停；提高额度后再手动开始运行。")}
                  </small>
                </span>
              </div>
            )}

            {!runtimeMode && (
            <nav className="task-composer-progress" aria-label={t("任务配置步骤")}>
              <span className="task-composer-progress-meta">
                <strong>{taskComposerReadyCount}/3</strong>
                
                {t("项配置就绪")}
              </span>
              <div>
                <button
                  className={taskDefinitionReady ? "is-ready" : ""}
                  type="button"
                  onClick={() => focusTaskComposerSection("definition")}
                >
                  <i>{taskDefinitionReady ? <Check size={15} /> : "1"}</i>
                  <span>
                    <strong>{t("定义任务")}</strong>
                    <small>{t("来源与交付结果")}</small>
                  </span>
                </button>
                <button
                  className={taskScheduleReady ? "is-ready" : ""}
                  type="button"
                  onClick={() => focusTaskComposerSection("schedule")}
                >
                  <i>{taskScheduleReady ? <Check size={15} /> : "2"}</i>
                  <span>
                    <strong>{t("运行计划")}</strong>
                    <small>{formatSchedule(taskSchedule, taskScheduleTime, taskScheduleDay)}</small>
                  </span>
                </button>
                <button
                  className="is-ready"
                  type="button"
                  onClick={() => focusTaskComposerSection("policy")}
                >
                  <i><Check size={15} /></i>
                  <span>
                    <strong>{t("安全确认")}</strong>
                    <small>{(taskApproval ? t("敏感操作先确认") : t("按范围自动执行"))}</small>
                  </span>
                </button>
              </div>
            </nav>
            )}

            {runtimeMode ? (
              <div className="task-composer-simple">
                <label
                  className={`composer-instruction composer-request ${
                    taskFormSubmitted && taskFormErrors.description ? "has-error" : ""
                  }`}
                >
                  <span>{t("你想让智能体做什么？")}</span>
                  <textarea
                    ref={taskDescriptionRef}
                    autoFocus
                    data-overlay-initial-focus
                    required
                    rows={7}
                    maxLength={requestMaxLength}
                    aria-invalid={Boolean(taskFormSubmitted && taskFormErrors.description)}
                    aria-describedby={
                      taskFormSubmitted && taskFormErrors.description ? "task-description-error" : undefined
                    }
                    value={taskDescription}
                    placeholder={t("例如：把 Downloads 里本周的销售表汇总成一页英文周报，存成 report.md，标出下降超过 10% 的地区。")}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    onKeyDown={(event) => {
                      // Ctrl/⌘ + Enter 直接提交。
                      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <span className="composer-field-meta">
                    {taskFormSubmitted && taskFormErrors.description ? (
                      <small className="composer-field-error" id="task-description-error">
                        <AlertTriangle size={13} />
                        {taskFormErrors.description}
                      </small>
                    ) : (
                      <small>
                        {editingTaskId
                          ? t("要用到的网址、文件夹直接写在里面。Ctrl + Enter 保存。")
                          : t("要用到的网址、文件夹直接写在里面。Ctrl + Enter 开始。")}
                      </small>
                    )}
                    <small>
                      {taskDescription.length}/{requestMaxLength}
                    </small>
                  </span>
                </label>

                {editingTaskId && (
                  <label className={`composer-request-name ${taskFormSubmitted && taskFormErrors.name ? "has-error" : ""}`}>
                    <span>{t("任务名称")}</span>
                    <input
                      ref={taskNameRef}
                      maxLength={80}
                      value={taskName}
                      placeholder={titleFromRequest(taskDescription) || t("不填就用需求的第一行")}
                      onChange={(event) => setTaskName(event.target.value)}
                    />
                    {taskFormSubmitted && taskFormErrors.name && (
                      <small className="composer-field-error">
                        <AlertTriangle size={13} />
                        {taskFormErrors.name}
                      </small>
                    )}
                  </label>
                )}

                <section className="task-composer-section task-composer-schedule-section composer-request-schedule">
                  {renderTaskSchedule()}
                </section>
              </div>
            ) : (
            <div className="task-composer-workspace">
              <section
                className="task-composer-section task-composer-definition"
                id="task-composer-definition"
              >
                <header className="task-composer-section-heading">
                  <span>01</span>
                  <div>
                    <h3>{t("定义任务")}</h3>
                    <p>{t("告诉 AI 去哪里工作，以及最终要交付什么。")}</p>
                  </div>
                  <strong className={taskDefinitionReady ? "is-ready" : ""}>
                    {taskDefinitionReady ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {(taskDefinitionReady ? t("已完整") : t("待完善"))}
                  </strong>
                </header>

                {!editingTaskId && (
                  <section className="task-template-picker" aria-label={t("快速模板")}>
                    <span>
                      <strong>{t("选择一个起点")}</strong>
                      <small>{t("点击模板会填入一套可继续修改的配置")}</small>
                    </span>
                    <div>
                      {taskTemplates.map((template) => (
                        <button
                          className={
                            activeTaskTemplateId === template.id ? "active" : ""
                          }
                          key={template.id}
                          type="button"
                          aria-pressed={activeTaskTemplateId === template.id}
                          onClick={() => applyTaskTemplate(template)}
                        >
                          <template.icon size={16} />
                          <span>{template.label}</span>
                          <span className="task-template-check" aria-hidden="true">
                            {activeTaskTemplateId === template.id && <Check size={14} />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <div className="composer-field-grid">
                  <label className={taskFormSubmitted && taskFormErrors.name ? "has-error" : ""}>
                    <span>{t("任务名称")}</span>
                    <input
                      ref={taskNameRef}
                      autoFocus
                      data-overlay-initial-focus
                      required
                      maxLength={80}
                      aria-invalid={Boolean(taskFormSubmitted && taskFormErrors.name)}
                      aria-describedby={
                        taskFormSubmitted && taskFormErrors.name
                          ? "task-name-error"
                          : undefined
                      }
                      value={taskName}
                      placeholder={t("例如：每天跟踪竞品更新")}
                      onChange={(event) => setTaskName(event.target.value)}
                    />
                    {taskFormSubmitted && taskFormErrors.name && (
                      <small className="composer-field-error" id="task-name-error">
                        <AlertTriangle size={13} />
                        {taskFormErrors.name}
                      </small>
                    )}
                  </label>

                  <label className={taskFormSubmitted && taskFormErrors.target ? "has-error" : ""}>
                    <span>{t("数据来源或网址")}</span>
                    <input
                      ref={taskTargetRef}
                      required
                      maxLength={240}
                      aria-invalid={Boolean(taskFormSubmitted && taskFormErrors.target)}
                      aria-describedby={
                        taskFormSubmitted && taskFormErrors.target
                          ? "task-target-error"
                          : undefined
                      }
                      value={taskTarget}
                      placeholder={
                        activeTaskTemplate?.targetHint ??
                        t("网页、文件夹或资料库")
                      }
                      onChange={(event) => setTaskTarget(event.target.value)}
                    />
                    {taskFormSubmitted && taskFormErrors.target && (
                      <small className="composer-field-error" id="task-target-error">
                        <AlertTriangle size={13} />
                        {taskFormErrors.target}
                      </small>
                    )}
                  </label>
                </div>

                <label
                  className={`composer-instruction ${
                    taskFormSubmitted && taskFormErrors.description ? "has-error" : ""
                  }`}
                >
                  <span>{t("希望得到什么结果")}</span>
                  <textarea
                    ref={taskDescriptionRef}
                    required
                    maxLength={500}
                    aria-invalid={Boolean(
                      taskFormSubmitted && taskFormErrors.description,
                    )}
                    aria-describedby={
                      taskFormSubmitted && taskFormErrors.description
                        ? "task-description-error"
                        : undefined
                    }
                    value={taskDescription}
                    placeholder={t("说清楚要做什么、保留哪些证据，以及最终交付什么结果。")}
                    onChange={(event) => setTaskDescription(event.target.value)}
                  />
                  <span className="composer-field-meta">
                    {taskFormSubmitted && taskFormErrors.description ? (
                      <small className="composer-field-error" id="task-description-error">
                        <AlertTriangle size={13} />
                        {taskFormErrors.description}
                      </small>
                    ) : (
                      <small>{t("描述交付结果，AI 会自行规划执行步骤")}</small>
                    )}
                    <small>{taskDescription.length}/500</small>
                  </span>
                </label>

                <div
                  className={`task-composer-launch-preview${
                    !editingTaskId && budgetRunBlocked ? " is-budget-blocked" : ""
                  }`}
                >
                  <span>
                    {!editingTaskId && budgetRunBlocked ? (
                      <ShieldCheck size={17} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                  </span>
                  <div>
                    <strong>
                      {t(!editingTaskId && budgetRunBlocked
                        ? t("任务会先保存，不会运行")
                        : t("任务启动预览"))}
                    </strong>
                    <p>
                      {!editingTaskId && budgetRunBlocked ? (
                        <>
                          
                          {t("当前已使用")} <b>{t("{usedCredits} / {monthlyBudget} 点", { usedCredits, monthlyBudget: usageSettings.monthlyBudget })}</b>{t("； 预算保护会把任务保存为已暂停，提高额度后可手动继续。")}
                        </>
                      ) : (
                        <>
                          
                          {t("AI 将从")} <b>{taskTarget.trim() || t("你指定的数据来源")}</b>  {t("开始， 按")} <b>{formatSchedule(taskSchedule, taskScheduleTime, taskScheduleDay)}</b>
                          {t(taskApproval
                            ? t(" 执行；遇到敏感操作会等待你确认。")
                            : t(" 自动执行已授权的步骤。"))}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <div className="task-composer-side">
                <section
                  className="task-composer-section task-composer-schedule-section"
                  id="task-composer-schedule"
                >
                  <header className="task-composer-section-heading">
                    <span>02</span>
                    <div>
                      <h3>{t("运行计划")}</h3>
                      <p>{t("决定什么时候开始，以及多久执行一次。")}</p>
                    </div>
                    <strong className={taskScheduleReady ? "is-ready" : ""}>
                      {taskScheduleReady ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {(taskScheduleReady ? t("已设置") : t("待设置"))}
                    </strong>
                  </header>

                  {renderTaskSchedule()}
                </section>

                <section
                  className="task-composer-section task-composer-policy-section"
                  id="task-composer-policy"
                >
                  <header className="task-composer-section-heading">
                    <span>03</span>
                    <div>
                      <h3>{t("安全确认")}</h3>
                      <p>{t("为外部操作保留一道人工确认。")}</p>
                    </div>
                  </header>

                  <div className="composer-policy">
                    <span className="composer-policy-icon">
                      <ShieldCheck size={18} />
                    </span>
                    <span>
                      <strong>{t("敏感操作需要确认")}</strong>
                      <small>{t("对外发送、登录访问和写入文件前先询问你。")}</small>
                    </span>
                    <button
                      className={`switch-control ${taskApproval ? "on" : ""}`}
                      type="button"
                      role="switch"
                      aria-checked={taskApproval}
                      aria-label={t("敏感操作需要确认")}
                      onClick={() => setTaskApproval((value) => !value)}
                    >
                      <i />
                    </button>
                  </div>

                </section>
              </div>
            </div>
            )}

            <div className="clarity-dialog-actions">
              {taskFormSubmitted && taskFormHasErrors && (
                <span className="composer-error-summary" role="alert">
                  <AlertTriangle size={14} />
                  
                  {t("请先修正标出的内容")}
                </span>
              )}
              {!(taskFormSubmitted && taskFormHasErrors) && taskComposerDirty && (
                <span
                  className={`composer-dirty-summary ${
                    taskDraftSaveFailed
                      ? "failed"
                      : taskDraftIsAutoSaved
                        ? "saved"
                        : "saving"
                  }`}
                  aria-live="polite"
                >
                  {taskDraftSaveFailed ? (
                    <AlertTriangle size={14} />
                  ) : taskDraftIsAutoSaved ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {t(taskDraftSaveFailed
                    ? t("草稿保存失败，请立即提交")
                    : taskDraftIsAutoSaved
                      ? t("草稿已自动保存，仍需提交")
                      : t("正在保护你的修改"))}
                </span>
              )}
              <button
                type="button"
                disabled={isSavingTask}
                onClick={requestCloseComposer}
              >
                
                {t("取消")}
              </button>
              <button className="confirm" type="submit" disabled={isSavingTask}>
                {isSavingTask ? (
                  <LoaderCircle className="composer-saving-icon" size={16} />
                ) : editingTaskId ? (
                  <Pencil size={16} />
                ) : !isOnline || budgetRunBlocked ? (
                  <Save size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {t(isSavingTask
                  ? editingTaskId
                    ? t("正在保存")
                    : isOnline && !budgetRunBlocked
                      ? t("正在创建")
                      : t("正在保存")
                  : editingTaskId
                    ? t("保存修改")
                    : runtimeMode && taskSchedule !== "仅运行一次"
                      ? t("保存，到点运行")
                    : runtimeMode
                      ? t("开始")
                    : budgetRunBlocked
                      ? t("保存为已暂停")
                    : isOnline
                      ? t("创建并运行")
                      : t("保存，联网后运行"))}
              </button>
            </div>
          </form>
        </div>
      )}

      {taskDiscardOpen && composerOpen && (
        <div
          className="clarity-dialog-backdrop task-discard-backdrop"
          onMouseDown={() => setTaskDiscardOpen(false)}
        >
          <section
            className="task-discard-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-discard-title"
            aria-describedby="task-discard-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t("关闭放弃任务草稿确认")}
              onClick={() => setTaskDiscardOpen(false)}
            >
              <X size={17} />
            </button>
            <span>
              <AlertTriangle size={20} />
            </span>
            <small>{t("未保存修改")}</small>
            <h2 id="task-discard-title">
              {(editingTaskId ? t("放弃任务修改？") : t("放弃这个新任务？"))}
            </h2>
            <p id="task-discard-description">
              {editingTaskId
                ? t("对“{value}”的配置修改还没有保存，放弃后无法恢复。", { value: taskDraftBaseline?.name ?? taskName })
                : runtimeMode
                  ? t("写好的需求还没有交给智能体，放弃后需要重新输入。")
                  : t("名称、目标、运行计划和审批设置还没有创建，放弃后需要重新填写。")}
            </p>
            <div>
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setTaskDiscardOpen(false)}
              >
                
                {t("继续编辑")}
              </button>
              <button
                className="danger"
                type="button"
                onClick={confirmDiscardTaskDraft}
              >
                {(editingTaskId ? t("放弃修改") : t("放弃草稿"))}
              </button>
            </div>
          </section>
        </div>
      )}

      {editingArtifact && (
        <div
          className="clarity-dialog-backdrop artifact-editor-backdrop"
          onMouseDown={requestCloseArtifactEditor}
        >
          <form
            className="artifact-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-busy={isSavingArtifact}
            aria-labelledby="artifact-editor-title"
            aria-describedby="artifact-editor-description"
            onSubmit={(event) => {
              event.preventDefault();
              saveArtifactEdit();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            noValidate
          >
            <header className="artifact-editor-heading">
              <span className="artifact-editor-icon">
                <Pencil size={20} />
              </span>
              <div>
                <span>{t("成果编辑")}</span>
                <h2 id="artifact-editor-title">{t("修订内容并保存新版本")}</h2>
                <p id="artifact-editor-description">{t("保存不会覆盖原文件。当前 v{editingArtifactVersion} 会进入版本记录， 新内容保存为 v{value}。", { editingArtifactVersion, value: editingArtifactVersion + 1 })}</p>
              </div>
              <button
                type="button"
                aria-label={t("关闭成果编辑器")}
                disabled={isSavingArtifact}
                onClick={requestCloseArtifactEditor}
              >
                <X size={17} />
              </button>
            </header>

            <div className="artifact-editor-workspace">
              <section className="artifact-editor-main">
                <div className="artifact-editor-field-grid">
                  <label
                    className={
                      artifactEditSubmitted && artifactFormErrors.title
                        ? "has-error"
                        : ""
                    }
                  >
                    <span>{t("成果名称")}</span>
                    <input
                      ref={artifactTitleRef}
                      data-overlay-initial-focus
                      required
                      maxLength={100}
                      aria-invalid={Boolean(
                        artifactEditSubmitted && artifactFormErrors.title,
                      )}
                      aria-describedby={
                        artifactEditSubmitted && artifactFormErrors.title
                          ? "artifact-title-error"
                          : undefined
                      }
                      value={artifactTitleDraft}
                      onChange={(event) =>
                        setArtifactTitleDraft(event.target.value)
                      }
                    />
                    {artifactEditSubmitted && artifactFormErrors.title && (
                      <small
                        className="artifact-editor-error"
                        id="artifact-title-error"
                      >
                        <AlertTriangle size={13} />
                        {artifactFormErrors.title}
                      </small>
                    )}
                  </label>

                  <label
                    className={
                      artifactEditSubmitted && artifactFormErrors.filename
                        ? "has-error"
                        : ""
                    }
                  >
                    <span>{t("文件名")}</span>
                    <input
                      ref={artifactFilenameRef}
                      required
                      maxLength={120}
                      spellCheck={false}
                      aria-invalid={Boolean(
                        artifactEditSubmitted && artifactFormErrors.filename,
                      )}
                      aria-describedby={
                        artifactEditSubmitted && artifactFormErrors.filename
                          ? "artifact-filename-error"
                          : undefined
                      }
                      value={artifactFilenameDraft}
                      onChange={(event) =>
                        setArtifactFilenameDraft(event.target.value)
                      }
                    />
                    {artifactEditSubmitted && artifactFormErrors.filename && (
                      <small
                        className="artifact-editor-error"
                        id="artifact-filename-error"
                      >
                        <AlertTriangle size={13} />
                        {artifactFormErrors.filename}
                      </small>
                    )}
                  </label>
                </div>

                <label
                  className={`artifact-editor-content ${
                    artifactEditSubmitted && artifactFormErrors.content
                      ? "has-error"
                      : ""
                  }`}
                >
                  <span>
                    <strong>{t("内容")}</strong>
                    <small>{t("{format} · 支持 Markdown", { format: editingArtifact.format })}</small>
                  </span>
                  <textarea
                    ref={artifactContentRef}
                    required
                    maxLength={100000}
                    spellCheck
                    aria-invalid={Boolean(
                      artifactEditSubmitted && artifactFormErrors.content,
                    )}
                    aria-describedby={
                      artifactEditSubmitted && artifactFormErrors.content
                        ? "artifact-content-error"
                        : "artifact-content-meta"
                    }
                    value={artifactContentDraft}
                    onChange={(event) =>
                      setArtifactContentDraft(event.target.value)
                    }
                  />
                  <span className="artifact-editor-content-meta">
                    {artifactEditSubmitted && artifactFormErrors.content ? (
                      <small
                        className="artifact-editor-error"
                        id="artifact-content-error"
                      >
                        <AlertTriangle size={13} />
                        {artifactFormErrors.content}
                      </small>
                    ) : (
                      <small id="artifact-content-meta">
                        
                        {t("人工修订会写入审计，不改变来源任务与原始证据。")}
                      </small>
                    )}
                    <small>
                      {artifactContentDraft.length.toLocaleString()} / 100,000
                    </small>
                  </span>
                </label>
              </section>

              <aside className="artifact-version-panel">
                <div className="artifact-version-current">
                  <span>
                    <History size={17} />
                    
                    {t("当前版本")}
                  </span>
                  <strong>v{editingArtifactVersion}</strong>
                  <p>{editingArtifact.filename}</p>
                  <dl>
                    <div>
                      <dt>{t("状态")}</dt>
                      <dd>{t(editingArtifact.status)}</dd>
                    </div>
                    <div>
                      <dt>{t("最近编辑")}</dt>
                      <dd>{editingArtifact.editedBy ?? "Unzoo One AI"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="artifact-version-history">
                  <div>
                    <span>{t("历史版本")}</span>
                    <em>{t("{length} 个", { length: artifactRevisionHistory.length })}</em>
                  </div>
                  {artifactRevisionHistory.length > 0 ? (
                    <div>
                      {artifactRevisionHistory.map((revision) => (
                        <button
                          key={`${editingArtifact.id}-${revision.version}`}
                          type="button"
                          onClick={() => loadArtifactRevision(revision)}
                        >
                          <span>v{revision.version}</span>
                          <span>
                            <strong>{revision.title}</strong>
                            <small>
                              {revision.editor} ·{" "}
                              {new Date(revision.createdAt).toLocaleDateString(
                                dateLocale(),
                                { month: "numeric", day: "numeric" },
                              )}
                            </small>
                          </span>
                          <RotateCcw size={14} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="artifact-version-empty">
                      <History size={20} />
                      <strong>{t("这是第一个版本")}</strong>
                      <small>{t("首次保存修改后，v1 会保留在这里。")}</small>
                    </div>
                  )}
                </div>

                <div className="artifact-version-safety">
                  <ShieldCheck size={16} />
                  <span>
                    <strong>{t("原始记录受保护")}</strong>
                    <small>{t("数据和证据不可编辑；报告修订会保留全部版本。")}</small>
                  </span>
                </div>
              </aside>
            </div>

            <footer className="artifact-editor-actions">
              <span
                className={`artifact-editor-save-state ${
                  artifactEditorDirty
                    ? artifactDraftSaveFailed
                      ? "is-dirty failed"
                      : artifactDraftIsAutoSaved
                        ? "is-dirty saved"
                        : "is-dirty saving"
                    : ""
                }`}
                aria-live="polite"
              >
                <i />
                {t(artifactEditorDirty
                  ? artifactDraftSaveFailed
                    ? t("草稿保存失败，请立即保存版本")
                    : artifactDraftIsAutoSaved
                      ? t("草稿已自动保存，仍需保存版本")
                      : t("正在保护你的修改")
                  : t("当前内容未修改"))}
                <kbd>Ctrl S</kbd>
              </span>
              {artifactEditSubmitted && artifactFormHasErrors && (
                <span className="artifact-editor-summary" role="alert">
                  <AlertTriangle size={14} />
                  
                  {t("请先修正标出的内容")}
                </span>
              )}
              <button
                type="button"
                disabled={isSavingArtifact}
                onClick={requestCloseArtifactEditor}
              >
                
                {t("取消")}
              </button>
              <button
                className="confirm"
                type="submit"
                disabled={isSavingArtifact || !artifactEditorDirty}
              >
                {isSavingArtifact ? (
                  <LoaderCircle className="composer-saving-icon" size={16} />
                ) : (
                  <Save size={16} />
                )}
                {isSavingArtifact
                  ? t("正在保存")
                  : t("保存为 v{value}", { value: editingArtifactVersion + 1 })}
              </button>
            </footer>
          </form>
        </div>
      )}

      {artifactDiscardOpen && editingArtifact && (
        <div
          className="clarity-dialog-backdrop artifact-discard-backdrop"
          onMouseDown={() => setArtifactDiscardOpen(false)}
        >
          <section
            className="artifact-discard-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="artifact-discard-title"
            aria-describedby="artifact-discard-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t("关闭放弃修改确认")}
              onClick={() => setArtifactDiscardOpen(false)}
            >
              <X size={17} />
            </button>
            <span>
              <AlertTriangle size={20} />
            </span>
            <small>{t("未保存修改")}</small>
            <h2 id="artifact-discard-title">{t("放弃这次成果修订？")}</h2>
            <p id="artifact-discard-description">{t("对“{title}”的修改还没有保存，关闭后无法恢复。", { title: editingArtifact.title })}</p>
            <div>
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setArtifactDiscardOpen(false)}
              >
                
                {t("继续编辑")}
              </button>
              <button
                className="danger"
                type="button"
                onClick={confirmDiscardArtifactDraft}
              >
                
                {t("放弃修改")}
              </button>
            </div>
          </section>
        </div>
      )}

      {deletingArtifact && (
        <div
          className="clarity-dialog-backdrop artifact-delete-backdrop"
          onMouseDown={() => setArtifactDeleteId(null)}
        >
          <section
            className="artifact-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="artifact-delete-title"
            aria-describedby="artifact-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="artifact-delete-close"
              type="button"
              aria-label={t("关闭成果删除确认")}
              onClick={() => setArtifactDeleteId(null)}
            >
              <X size={17} />
            </button>

            <header className="artifact-delete-heading">
              <span>
                <Trash2 size={21} />
              </span>
              <div>
                <small>{t("删除成果")}</small>
                <h2 id="artifact-delete-title">{t("删除“{title}”？", { title: deletingArtifact.title })}</h2>
                <p id="artifact-delete-description">
                  
                  {t("文件与全部修订版本将从当前工作区移除，完成后可在底部提示中撤销。")}
                </p>
              </div>
            </header>

            <div className="artifact-delete-file">
              <span
                className={`artifact-preview-icon type-${deletingArtifact.type}`}
              >
                <DeletingArtifactIcon size={19} />
              </span>
              <span>
                <strong>{deletingArtifact.filename}</strong>
                <small>
                  {deletingArtifact.format} ·{" "}
                  {deletingArtifact.sizeKb.toFixed(1)} KB
                </small>
              </span>
              <em>{t(deletingArtifact.status)}</em>
            </div>

            <div className="artifact-delete-facts" aria-label={t("删除影响")}>
              <span>
                <small>{t("将移除")}</small>
                <strong>{t("{value} 个版本", { value: (deletingArtifact.revisions?.length ?? 0) + 1 })}</strong>
              </span>
              <span>
                <small>{t("关联任务")}</small>
                <strong>{deletingArtifactTask?.title ?? t("原任务已移除")}</strong>
              </span>
              <span>
                <small>{t("撤销时间")}</small>
                <strong>{t("10 秒")}</strong>
              </span>
            </div>

            <div className="artifact-delete-safety">
              <ShieldCheck size={18} />
              <span>
                <strong>{t("任务和审计记录不会被删除")}</strong>
                <small>
                  
                  {t("系统会保留来源任务及删除事件，方便后续追溯是谁在何时执行了操作。")}
                </small>
              </span>
            </div>

            <div className="artifact-delete-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setArtifactDeleteId(null)}
              >
                
                {t("保留成果")}
              </button>
              <button
                className="danger"
                type="button"
                onClick={confirmDeleteArtifact}
              >
                <Trash2 size={15} />
                
                {t("确认删除")}
              </button>
            </div>
          </section>
        </div>
      )}

      {workspaceProfileOpen && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={requestCloseWorkspaceProfile}
        >
          <form
            className="workspace-profile-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-profile-title"
            aria-describedby="workspace-profile-description"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveWorkspaceProfile}
          >
            <button
              className="workspace-profile-close"
              type="button"
              aria-label={t("关闭工作区资料")}
              onClick={requestCloseWorkspaceProfile}
            >
              <X size={17} />
            </button>

            <span className="workspace-profile-icon">
              <Building2 size={21} />
            </span>
            <span className="workspace-profile-eyebrow">{t("工作区资料")}</span>
            <h2 id="workspace-profile-title">{t("让团队看到一致的工作区身份")}</h2>
            <p id="workspace-profile-description">
              
              {t("名称会显示在全局入口，说明用于帮助成员确认当前工作范围。")}
            </p>

            <div className="workspace-profile-preview" aria-label={t("工作区资料预览")}>
              <span>{getWorkspaceInitial(workspaceNameDraft)}</span>
              <span>
                <small>{planLabel}</small>
                <strong>{workspaceNameDraft.trim() || t("未命名工作区")}</strong>
                <em>
                  {workspaceDescriptionDraft.trim() || t("尚未填写工作区说明")}
                </em>
              </span>
              <ShieldCheck size={18} />
            </div>

            <label
              className={`workspace-profile-field ${
                workspaceProfileSubmitted && workspaceProfileFormErrors.name
                  ? "has-error"
                  : ""
              }`}
            >
              <span>
                <strong>{t("工作区名称")}</strong>
                <small>{workspaceNameDraft.length}/40</small>
              </span>
              <input
                ref={workspaceNameRef}
                data-overlay-initial-focus
                required
                maxLength={40}
                aria-invalid={Boolean(
                  workspaceProfileSubmitted && workspaceProfileFormErrors.name,
                )}
                aria-describedby={
                  workspaceProfileSubmitted && workspaceProfileFormErrors.name
                    ? "workspace-name-error"
                    : undefined
                }
                value={workspaceNameDraft}
                placeholder={t("例如：增长运营中心")}
                onChange={(event) => setWorkspaceNameDraft(event.target.value)}
              />
              {workspaceProfileSubmitted && workspaceProfileFormErrors.name && (
                <small
                  className="workspace-profile-error"
                  id="workspace-name-error"
                  role="alert"
                >
                  <AlertTriangle size={13} />
                  {workspaceProfileFormErrors.name}
                </small>
              )}
            </label>

            <label
              className={`workspace-profile-field ${
                workspaceProfileSubmitted &&
                workspaceProfileFormErrors.description
                  ? "has-error"
                  : ""
              }`}
            >
              <span>
                <strong>{t("工作区说明")}</strong>
                <small>{workspaceDescriptionDraft.length}/100</small>
              </span>
              <textarea
                id="workspace-description-field"
                required
                maxLength={100}
                aria-invalid={Boolean(
                  workspaceProfileSubmitted &&
                    workspaceProfileFormErrors.description,
                )}
                aria-describedby={
                  workspaceProfileSubmitted &&
                  workspaceProfileFormErrors.description
                    ? "workspace-description-error"
                    : undefined
                }
                value={workspaceDescriptionDraft}
                placeholder={t("说明团队会在这里运行和审核哪些 AI 工作")}
                onChange={(event) =>
                  setWorkspaceDescriptionDraft(event.target.value)
                }
              />
              {workspaceProfileSubmitted &&
                workspaceProfileFormErrors.description && (
                  <small
                    className="workspace-profile-error"
                    id="workspace-description-error"
                    role="alert"
                  >
                    <AlertTriangle size={13} />
                    {workspaceProfileFormErrors.description}
                  </small>
                )}
            </label>

            <div className="workspace-profile-actions">
              <span>
                <HardDrive size={14} />
                {(settings.local ? t("修改会自动保存在本机") : t("当前为临时会话"))}
              </span>
              <button type="button" onClick={requestCloseWorkspaceProfile}>
                
                {t("取消")}
              </button>
              <button
                className="confirm"
                type="submit"
                disabled={!workspaceProfileDirty}
              >
                <Save size={15} />
                
                {t("保存资料")}
              </button>
            </div>
          </form>
        </div>
      )}

      {settingsDiscardTarget && activeSettingsDiscardCopy && (
        <div
          className="clarity-dialog-backdrop settings-discard-backdrop"
          onMouseDown={() => setSettingsDiscardTarget(null)}
        >
          <section
            className="settings-discard-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="settings-discard-title"
            aria-describedby="settings-discard-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t("关闭放弃设置确认")}
              onClick={() => setSettingsDiscardTarget(null)}
            >
              <X size={17} />
            </button>
            <span>
              <AlertTriangle size={22} />
            </span>
            <small>{activeSettingsDiscardCopy.eyebrow}</small>
            <h2 id="settings-discard-title">
              {activeSettingsDiscardCopy.title}
            </h2>
            <p id="settings-discard-description">
              {activeSettingsDiscardCopy.description}
            </p>
            <div>
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setSettingsDiscardTarget(null)}
              >
                
                {t("继续编辑")}
              </button>
              <button
                className="danger"
                type="button"
                onClick={discardSettingsDraft}
              >
                {activeSettingsDiscardCopy.discardLabel}
              </button>
            </div>
          </section>
        </div>
      )}

      {planCenterOpen && (
        <div
          className="clarity-dialog-backdrop plan-center-backdrop"
          onMouseDown={closePlanCenter}
        >
          <section
            className="plan-center-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-center-title"
            aria-describedby="plan-center-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="plan-center-close"
              type="button"
              aria-label={t("关闭方案中心")}
              data-overlay-initial-focus
              onClick={closePlanCenter}
            >
              <X size={17} />
            </button>

            <div className="plan-center-head">
              <span className="plan-center-mark">
                <Sparkles size={22} />
              </span>
              <span>
                <span className="plan-center-eyebrow">{t("当前方案")}</span>
                <h2 id="plan-center-title">{planLabel}</h2>
                <p id="plan-center-description">
                  
                  {t("当前工作区的额度、席位和安全能力都在这里汇总，可直接调整预算或管理成员。")}
                </p>
              </span>
            </div>

            <div className="plan-center-status">
              <span>
                <small>{t("本月 AI 额度")}</small>
                <strong>{t("{usedCredits} / {monthlyBudget} 点", { usedCredits, monthlyBudget: usageSettings.monthlyBudget })}</strong>
              </span>
              <div
                className="plan-center-progress"
                role="progressbar"
                aria-label={t("Team 方案本月额度使用")}
                aria-valuemin={0}
                aria-valuemax={usageSettings.monthlyBudget}
                aria-valuenow={Math.min(
                  usedCredits,
                  usageSettings.monthlyBudget,
                )}
              >
                <span style={{ width: `${usageProgressPercent}%` }} />
              </div>
              <em>
                {budgetExceeded
                  ? t("额度已用完")
                  : budgetAlertReached
                    ? t("接近预算上限")
                    : t("{remainingCredits} 点可用", { remainingCredits })}
              </em>
            </div>

            <div className="plan-center-metrics" aria-label={t("方案用量概览")}>
              <span>
                <Users size={18} />
                <small>{t("团队席位")}</small>
                <strong>
                  {teamMembers.length} / {teamSeatLimit}
                </strong>
                <em>{t("{availableSeatCount} 个可用", { availableSeatCount })}</em>
              </span>
              <span>
                <Activity size={18} />
                <small>{t("连接器健康")}</small>
                <strong>
                  {healthyConnectorCount} / {connectorCatalog.length}
                </strong>
                <em>{t("{connectedConnectorCount} 项已连接", { connectedConnectorCount })}</em>
              </span>
              <span>
                <ShieldCheck size={18} />
                <small>{t("到限保护")}</small>
                <strong>{(usageSettings.pauseAtLimit ? t("已开启") : t("仅提醒"))}</strong>
                <em>{t("{alertThreshold}% 触发提醒", { alertThreshold: usageSettings.alertThreshold })}</em>
              </span>
              <span>
                <Clock3 size={18} />
                <small>{t("额度刷新")}</small>
                <strong>{t("8 月 1 日")}</strong>
                <em>{t("自动进入新周期")}</em>
              </span>
            </div>

            <div className="plan-center-body">
              <div className="plan-center-included">
                <span className="plan-center-section-title">{t("已包含")}</span>
                <ul>
                  <li>
                    <CheckCircle2 size={17} />
                    <span>
                      <strong>{t("审批边界与完整审计")}</strong>
                      <small>{t("任何外部发送、权限访问和关键修改都可追溯。")}</small>
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={17} />
                    <span>
                      <strong>{t("工作区备份与恢复")}</strong>
                      <small>{t("导入前校验，替换前可先生成本地备份。")}</small>
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 size={17} />
                    <span>
                      <strong>{t("连接器健康检查")}</strong>
                      <small>{t("浏览器、邮件、日历和长期记忆的状态集中展示。")}</small>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="plan-center-protection">
                <span>
                  <ShieldCheck size={19} />
                </span>
                <small>{t("安全策略")}</small>
                <strong>
                  {t(usageSettings.pauseAtLimit
                    ? t("到限自动保护已开启")
                    : t("到限后仅提醒，不会自动暂停任务"))}
                </strong>
                <p>{t("当前提醒线为 {alertThreshold}%； 本月预计消耗 {forecastCredits} 点。", { alertThreshold: usageSettings.alertThreshold, forecastCredits })}</p>
              </div>
            </div>

            <div className="plan-center-actions">
              <button type="button" onClick={exportUsageReport}>
                <Download size={16} />
                
                {t("导出用量")}
              </button>
              <button type="button" onClick={openPlanMembers}>
                <Users size={16} />
                
                {t("管理成员")}
              </button>
              <button className="confirm" type="button" onClick={openPlanBudget}>
                <Pencil size={16} />
                
                {t("调整预算")}
              </button>
            </div>
          </section>
        </div>
      )}

      {usageBudgetOpen && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={requestCloseUsageBudget}
        >
          <section
            className="usage-budget-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="usage-budget-title"
            aria-describedby="usage-budget-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="usage-budget-close"
              type="button"
              aria-label={t("关闭预算设置")}
              onClick={requestCloseUsageBudget}
            >
              <X size={17} />
            </button>
            <div className="usage-budget-dialog-head">
              <span className="usage-budget-icon">
                <Sparkles size={21} />
              </span>
              <span>
                <span className="usage-budget-eyebrow">{t("用量与预算")}</span>
                <h2 id="usage-budget-title">{t("设置月度额度和到限保护")}</h2>
                <p id="usage-budget-description">
                  
                  {t("先预览提醒点位和月底影响，再保存到当前工作区。")}
                </p>
              </span>
            </div>

            <div className="usage-budget-facts">
              <span>
                <small>{t("当前已用")}</small>
                <strong>{t("{usedCredits} 点", { usedCredits })}</strong>
              </span>
              <span>
                <small>{t("当前预算")}</small>
                <strong>{t("{monthlyBudget} 点", { monthlyBudget: usageSettings.monthlyBudget })}</strong>
              </span>
              <span>
                <small>{t("月底预计")}</small>
                <strong>{t("{forecastCredits} 点", { forecastCredits })}</strong>
              </span>
            </div>

            <label className="usage-budget-field">
              <span>
                <strong>{t("月度额度")}</strong>
                <small>{t("100 - 50,000 点")}</small>
              </span>
              <span className={usageBudgetDraftInvalid ? "has-error" : ""}>
                <input
                  data-overlay-initial-focus
                  type="number"
                  min={100}
                  max={50000}
                  step={50}
                  aria-label={t("月度 AI 额度")}
                  aria-invalid={usageBudgetDraftInvalid}
                  value={usageBudgetDraft}
                  onChange={(event) => {
                    setUsageBudgetDraft(event.target.value);
                    setUsagePauseConfirmed(false);
                  }}
                />
                <em>{t("点 / 月")}</em>
              </span>
              {usageBudgetDraftInvalid && (
                <small className="usage-budget-error" role="alert">
                  
                  {t("请输入 100 到 50,000 之间的整数额度。")}
                </small>
              )}
            </label>

            <div className="usage-budget-presets" aria-label={t("常用额度")}>
              {[500, 1000, 2000, 5000].map((value) => (
                <button
                  className={
                    usageBudgetDraftValue === value ? "active" : ""
                  }
                  key={value}
                  type="button"
                  onClick={() => {
                    setUsageBudgetDraft(String(value));
                    setUsagePauseConfirmed(false);
                  }}
                >{t("{toLocaleString} 点", { toLocaleString: value.toLocaleString() })}</button>
              ))}
            </div>

            <fieldset className="usage-alert-threshold">
              <legend>
                <strong>{t("提醒阈值")}</strong>
                <small>{t("达到预算比例时显示提醒")}</small>
              </legend>
              <div role="radiogroup" aria-label={t("预算提醒阈值")}>
                {([50, 75, 90] as const).map((threshold) => (
                  <button
                    className={usageAlertDraft === threshold ? "active" : ""}
                    key={threshold}
                    type="button"
                    role="radio"
                    aria-checked={usageAlertDraft === threshold}
                  onClick={() => {
                    setUsageAlertDraft(threshold);
                    setUsagePauseConfirmed(false);
                  }}
                >
                    <strong>{threshold}%</strong>
                    <small>
                      {usageBudgetDraftInvalid
                        ? "—"
                        : t("{toLocaleString} 点", { toLocaleString: Math.round(
                            usageBudgetDraftValue * (threshold / 100),
                          ).toLocaleString() })}
                    </small>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="usage-pause-setting">
              <span>
                <Pause size={17} />
                <span>
                  <strong>{t("达到预算后暂停运行中任务")}</strong>
                  <small>{t("当前有 {usageRunningTaskCount} 个任务运行中；暂停不会删除进度和证据。", { usageRunningTaskCount })}</small>
                </span>
              </span>
              <button
                className={`switch-control ${usagePauseDraft ? "on" : ""}`}
                type="button"
                role="switch"
                aria-checked={usagePauseDraft}
                aria-label={t("达到预算后暂停运行中任务")}
                onClick={() => {
                  setUsagePauseDraft((current) => !current);
                  setUsagePauseConfirmed(false);
                }}
              >
                <i />
              </button>
            </div>

            <div
              className={`usage-budget-impact ${
                usageBudgetDraftInvalid
                  ? "is-neutral"
                  : usageDraftRemaining < 0
                    ? "is-danger"
                    : usageDraftForecastVariance < 0
                      ? "is-warning"
                      : "is-safe"
              }`}
              aria-live="polite"
            >
              <span>
                {usageBudgetDraftInvalid ? (
                  <Sparkles size={17} />
                ) : usageDraftRemaining < 0 ||
                  usageDraftForecastVariance < 0 ? (
                  <AlertTriangle size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )}
              </span>
              <span>
                <small>{t("保存后影响")}</small>
                <strong>
                  {usageBudgetDraftInvalid
                    ? t("输入有效额度后显示影响")
                    : usageDraftRemaining < 0
                      ? t("当前用量将超出新额度 {abs} 点", { abs: Math.abs(usageDraftRemaining) })
                      : usageDraftForecastVariance < 0
                        ? t("月底预计超出 {abs} 点", { abs: Math.abs(usageDraftForecastVariance) })
                        : t("月底预计仍有 {usageDraftForecastVariance} 点可用", { usageDraftForecastVariance })}
                </strong>
                {!usageBudgetDraftInvalid && (
                  <em>{t("{value}{value2}{usageDraftAlertCreditLevel} 点时提醒", { value: usageBudgetChange === 0
                      ? t("额度不变")
                      : t("比当前{value} {abs} 点", { value: t(usageBudgetChange > 0 ? t("增加") : t("减少")), abs: Math.abs(usageBudgetChange) }), value2: " · ", usageDraftAlertCreditLevel })}</em>
                )}
              </span>
              {!usageBudgetDraftInvalid && (
                <b>
                  {Math.round((usedCredits / usageBudgetDraftValue) * 100)}%
                  <small>{t("已使用")}</small>
                </b>
              )}
            </div>

            {budgetWorkspaceConflict && (
              <div className="usage-budget-warning is-conflict" role="alert">
                <AlertTriangle size={16} />
                <span>
                  
                  {t("另一窗口已经更新预算。请先处理顶部的版本冲突，再保存这次调整。")}
                </span>
              </div>
            )}

            {!usageBudgetDraftInvalid && !usagePauseDraft && (
              <div className="usage-budget-warning is-unprotected">
                <AlertTriangle size={16} />
                <span>
                  
                  {t("到达额度后任务仍会继续运行，只显示提醒，可能产生额外消耗。")}
                </span>
              </div>
            )}

            {usageBudgetRequiresConfirmation && (
              <label className="usage-budget-confirm">
                <input
                  type="checkbox"
                  aria-label={t("确认立即暂停 {usageRunningTaskCount} 个运行中任务", { usageRunningTaskCount })}
                  checked={usagePauseConfirmed}
                  onChange={(event) =>
                    setUsagePauseConfirmed(event.target.checked)
                  }
                />
                <span aria-hidden="true">
                  <Check size={14} />
                </span>
                <span>
                  <strong>{t("我已确认立即暂停 {usageRunningTaskCount} 个运行中任务", { usageRunningTaskCount })}</strong>
                  <small>
                    
                    {t("任务进度和证据会保留，提高额度后可以手动继续。")}
                  </small>
                </span>
              </label>
            )}

            {!usageBudgetDraftInvalid &&
              usagePauseDraft &&
              usageBudgetDraftValue <= usedCredits &&
              !usageBudgetRequiresConfirmation && (
                <div className="usage-budget-warning">
                  <AlertTriangle size={16} />
                  <span>
                    
                    {t("当前用量已经达到新额度；保存后，新建、继续和重试任务都会被预算保护阻止。")}
                  </span>
                </div>
              )}

            <div className="usage-budget-actions">
              <span>
                {t(usageBudgetDirty
                  ? t("更改会写入运行记录")
                  : t("修改任一设置后即可保存"))}
              </span>
              <button type="button" onClick={requestCloseUsageBudget}>
                
                {t("取消")}
              </button>
              <button
                className="confirm"
                type="button"
                disabled={!usageBudgetCanSave}
                onClick={saveUsageBudget}
              >
                <Check size={15} />
                {usageBudgetRequiresConfirmation
                  ? t("确认并暂停 {usageRunningTaskCount} 个任务", { usageRunningTaskCount })
                  : t("保存预算")}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkApprovalDecision && selectedApprovals.length > 0 && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={() => {
            setBulkApprovalDecision(null);
            setApprovalRejectReason("");
          }}
        >
          <section
            className={`bulk-approval-dialog is-${bulkApprovalDecision}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bulk-approval-title"
            aria-describedby="bulk-approval-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="bulk-approval-close"
              type="button"
              aria-label={t("关闭批量审批确认")}
              onClick={() => {
                setBulkApprovalDecision(null);
                setApprovalRejectReason("");
              }}
            >
              <X size={17} />
            </button>
            <span className="bulk-approval-icon">
              {bulkApprovalDecision === "approve" ? (
                <Check size={21} />
              ) : (
                <Ban size={21} />
              )}
            </span>
            <span className="bulk-approval-eyebrow">
              {t(bulkApprovalDecision === "approve"
                ? t("批量批准操作")
                : t("批量拒绝操作"))}
            </span>
            <h2 id="bulk-approval-title">
              {bulkApprovalDecision === "approve"
                ? t("批准 {length} 项操作？", { length: bulkApprovableApprovals.length })
                : t("拒绝 {length} 项操作？", { length: selectedApprovals.length })}
            </h2>
            <p id="bulk-approval-description">
              {t(bulkApprovalDecision === "approve"
                ? t("每项授权都只在原申请范围内生效，并会分别写入审计记录。")
                : t("系统不会执行这些外部操作，关联任务将暂停；完成后可在底部提示中撤销。"))}
            </p>

            <div className="bulk-approval-facts">
              <span>
                <small>{t("当前选择")}</small>
                <strong>{t("{length} 项", { length: selectedApprovals.length })}</strong>
              </span>
              <span>
                <small>
                  {t(bulkApprovalDecision === "approve" ? t("可以批准") : t("将拒绝"))}
                </small>
                <strong>{t("{value}{value2}项", { value: bulkApprovalDecision === "approve"
                    ? bulkApprovableApprovals.length
                    : selectedApprovals.length, value2: " " })}</strong>
              </span>
              <span>
                <small>{t("关联任务")}</small>
                <strong>{t("{selectedApprovalTaskCount} 个", { selectedApprovalTaskCount })}</strong>
              </span>
            </div>

            <div className="bulk-approval-list" aria-label={t("批量审批项目")}>
              {(bulkApprovalDecision === "approve"
                ? bulkApprovableApprovals
                : selectedApprovals
              )
                .slice(0, 4)
                .map((approval) => (
                  <span key={approval.id}>
                    <span>
                      <strong>{approval.title}</strong>
                      <small>{approval.target}</small>
                    </span>
                    <em className={`risk-${approval.risk}`}>
                      {t(approval.risk)}
                    </em>
                  </span>
                ))}
              {(bulkApprovalDecision === "approve"
                ? bulkApprovableApprovals.length
                : selectedApprovals.length) > 4 && (
                <small>{t("另有{value}{value2}{value3}项操作", { value: " ", value2: (bulkApprovalDecision === "approve"
                    ? bulkApprovableApprovals.length
                    : selectedApprovals.length) - 4, value3: " " })}</small>
              )}
            </div>

            {bulkApprovalDecision === "approve" &&
              selectedHighRiskApprovalCount > 0 && (
                <div className="bulk-approval-protected-note">
                  <ShieldCheck size={16} />
                  <span>{t("{selectedHighRiskApprovalCount} 项高风险操作不会被批量批准，将保留在队列中逐项审核。", { selectedHighRiskApprovalCount })}</span>
                </div>
              )}

            {bulkApprovalDecision === "reject" && (
              <label className="approval-reject-reason">
                <span>
                  <strong>{t("拒绝原因")}</strong>
                  <small>{t("将写入每一条审批记录")}</small>
                </span>
                <textarea
                  data-overlay-initial-focus
                  aria-label={t("批量拒绝原因")}
                  maxLength={120}
                  placeholder={t("例如：执行对象不正确，需要重新确认授权范围")}
                  value={approvalRejectReason}
                  onChange={(event) =>
                    setApprovalRejectReason(event.target.value)
                  }
                />
                <small>{t("{length} / 120，至少 4 个字", { length: approvalRejectReason.trim().length })}</small>
              </label>
            )}

            <div className="bulk-approval-actions">
              <button
                type="button"
                data-overlay-initial-focus={
                  bulkApprovalDecision === "approve" ? true : undefined
                }
                onClick={() => {
                  setBulkApprovalDecision(null);
                  setApprovalRejectReason("");
                }}
              >
                
                {t("返回检查")}
              </button>
              <button
                className={
                  bulkApprovalDecision === "approve" ? "confirm" : "danger"
                }
                type="button"
                disabled={
                  bulkApprovalDecision === "reject" &&
                  approvalRejectReason.trim().length < 4
                }
                onClick={
                  bulkApprovalDecision === "approve"
                    ? confirmBulkApprove
                    : confirmBulkReject
                }
              >
                {bulkApprovalDecision === "approve" ? (
                  <Check size={15} />
                ) : (
                  <Ban size={15} />
                )}
                {bulkApprovalDecision === "approve"
                  ? t("批准 {length} 项", { length: bulkApprovableApprovals.length })
                  : t("拒绝 {length} 项", { length: selectedApprovals.length })}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkDeleteOpen && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={() => setBulkDeleteOpen(false)}
        >
          <section
            className="bulk-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            aria-describedby="bulk-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="bulk-delete-close"
              type="button"
              aria-label={t("关闭批量删除确认")}
              onClick={() => setBulkDeleteOpen(false)}
            >
              <X size={17} />
            </button>
            <span className="bulk-delete-icon">
              <Trash2 size={21} />
            </span>
            <span className="bulk-delete-eyebrow">{t("批量删除任务")}</span>
            <h2 id="bulk-delete-title">{t("删除 {length} 个任务？", { length: deletableSelectedTasks.length })}</h2>
            <p id="bulk-delete-description">
              
              {t("关联成果、审批事项和任务运行记录会一并移除。完成后可在底部提示中撤销。")}
            </p>

            <div className="bulk-delete-facts">
              <span>
                <small>{t("当前选择")}</small>
                <strong>{t("{length} 个", { length: selectedTasks.length })}</strong>
              </span>
              <span>
                <small>{t("可以删除")}</small>
                <strong>{t("{length} 个", { length: deletableSelectedTasks.length })}</strong>
              </span>
              <span>
                <small>{t("受保护")}</small>
                <strong>{t("{protectedSelectedTaskCount} 个", { protectedSelectedTaskCount })}</strong>
              </span>
            </div>

            <div className="bulk-delete-list" aria-label={t("将删除的任务")}>
              {deletableSelectedTasks.slice(0, 4).map((task) => (
                <span key={task.id}>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.target}</small>
                  </span>
                  <em>{t(task.status)}</em>
                </span>
              ))}
              {deletableSelectedTasks.length > 4 && (
                <small>{t("另有 {value} 个任务", { value: deletableSelectedTasks.length - 4 })}</small>
              )}
            </div>

            {protectedSelectedTaskCount > 0 && (
              <div className="bulk-delete-protected-note">
                <Pin size={16} />
                <span>{t("首页主任务受到保护，不会被删除。")}</span>
              </div>
            )}

            <div className="bulk-delete-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setBulkDeleteOpen(false)}
              >
                
                {t("返回检查")}
              </button>
              <button
                className="danger"
                type="button"
                onClick={confirmBulkDelete}
              >
                <Trash2 size={15} />
                
                {t("删除")} {deletableSelectedTasks.length}  {t("个任务")}
              </button>
            </div>
          </section>
        </div>
      )}

      {deletingTask && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={() => setDeleteTaskId(null)}
        >
          <section
            className="confirm-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            aria-describedby="delete-task-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="confirm-delete-close"
              type="button"
              aria-label={t("关闭删除确认")}
              onClick={() => setDeleteTaskId(null)}
            >
              <X size={17} />
            </button>
            <span className="confirm-delete-icon">
              <Trash2 size={21} />
            </span>
            <span className="confirm-delete-eyebrow">{t("删除任务")}</span>
            <h2 id="delete-task-title">{t("确定删除“{title}”吗？", { title: deletingTask.title })}</h2>
            <p id="delete-task-description">
              
              {t("任务配置、关联成果、审批和本机运行记录将移出工作区；完成后 10 秒内可以恢复，原始数据源不会被删除。")}
            </p>
            <div className="confirm-delete-facts">
              <span>
                <small>{t("运行频率")}</small>
                <strong>{formatTaskSchedule(deletingTask)}</strong>
              </span>
              <span>
                <small>{t("数据来源")}</small>
                <strong>{deletingTask.target}</strong>
              </span>
            </div>
            <div className="confirm-delete-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setDeleteTaskId(null)}
              >
                
                {t("保留任务")}
              </button>
              <button className="danger" type="button" onClick={confirmDeleteTask}>
                <Trash2 size={15} />
                
                {t("确认删除")}
              </button>
            </div>
          </section>
        </div>
      )}

      {approvalConfirmTarget && (
        <div
          className="clarity-dialog-backdrop approval-confirm-backdrop"
          onMouseDown={cancelApprovalConfirmation}
        >
          <section
            className="approval-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="approval-confirm-title"
            aria-describedby="approval-confirm-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="approval-confirm-close"
              type="button"
              aria-label={t("关闭高风险审批确认")}
              onClick={cancelApprovalConfirmation}
            >
              <X size={17} />
            </button>
            <span className="approval-confirm-icon">
              <ShieldCheck size={22} />
            </span>
            <span className="approval-confirm-eyebrow">{t("高风险操作 · 二次核对")}</span>
            <h2 id="approval-confirm-title">{t("确认批准“{title}”？", { title: approvalConfirmTarget.title })}</h2>
            <p id="approval-confirm-description">
              
              {t("批准后系统会立即执行这项操作。本次授权只生效一次，并完整写入审计记录。")}
            </p>

            <div className="approval-confirm-facts">
              <span>
                <small>{t("执行对象")}</small>
                <strong>{approvalConfirmTarget.target}</strong>
              </span>
              <span>
                <small>{t("授权范围")}</small>
                <strong>{approvalConfirmTarget.scope}</strong>
              </span>
              <span>
                <small>{t("授权失效")}</small>
                <strong>{approvalConfirmTarget.expiresAt}</strong>
              </span>
            </div>

            <div className="approval-confirm-impact">
              <AlertTriangle size={17} />
              <span>
                <strong>{t("执行后会发生什么")}</strong>
                <small>{approvalConfirmTarget.impact}</small>
              </span>
            </div>

            <label className="approval-confirm-check">
              <input
                type="checkbox"
                aria-label={t("我已核对执行对象和授权范围")}
                data-overlay-initial-focus
                checked={approvalConfirmAcknowledged}
                onChange={(event) =>
                  setApprovalConfirmAcknowledged(event.target.checked)
                }
              />
              <span aria-hidden="true">
                <Check size={14} />
              </span>
              <span>
                <strong>{t("我已核对执行对象和授权范围")}</strong>
                <small>{t("这不是长期授权，任务结束或超时后会自动失效。")}</small>
              </span>
            </label>

            <div className="approval-confirm-actions">
              <button type="button" onClick={cancelApprovalConfirmation}>
                
                {t("返回检查")}
              </button>
              <button
                className="confirm"
                type="button"
                disabled={!approvalConfirmAcknowledged}
                onClick={confirmHighRiskApproval}
              >
                <ShieldCheck size={16} />
                
                {t("确认批准并执行")}
              </button>
            </div>
          </section>
        </div>
      )}

      {approvalSnoozeTarget && (
        <div
          className="clarity-dialog-backdrop approval-snooze-backdrop"
          onMouseDown={() => setApprovalSnoozeId(null)}
        >
          <section
            className="approval-snooze-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-snooze-title"
            aria-describedby="approval-snooze-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="approval-snooze-close"
              type="button"
              aria-label={t("关闭稍后处理")}
              onClick={() => setApprovalSnoozeId(null)}
            >
              <X size={17} />
            </button>
            <span className="approval-snooze-icon">
              <Clock3 size={21} />
            </span>
            <span className="approval-snooze-eyebrow">{t("稍后处理")}</span>
            <h2 id="approval-snooze-title">{t("什么时候重新提醒你？")}</h2>
            <p id="approval-snooze-description">{t("“{title}”会暂时移出当前待办，到期后自动回来；期间不会执行任何外部操作。", { title: approvalSnoozeTarget.title })}</p>

            <div className="approval-snooze-target">
              <approvalSnoozeTarget.icon size={17} />
              <span>
                <strong>{approvalSnoozeTarget.target}</strong>
                <small>{approvalSnoozeTarget.scope}</small>
              </span>
              <em className={`approval-risk risk-${approvalSnoozeTarget.risk}`}>
                {t(approvalSnoozeTarget.risk)}
              </em>
            </div>

            <div
              className="approval-snooze-options"
              role="group"
              aria-label={t("重新提醒时间")}
            >
              {[
                {
                  id: "15m" as const,
                  label: t("15 分钟后"),
                  detail: t("短暂离开当前队列"),
                  icon: Timer,
                },
                {
                  id: "1h" as const,
                  label: t("1 小时后"),
                  detail: t("留到稍后的工作时段"),
                  icon: Clock3,
                },
                {
                  id: "tomorrow" as const,
                  label: t("明天 09:00"),
                  detail: t("下一个工作日再决定"),
                  icon: CalendarDays,
                },
              ].map((option, index) => {
                const deferredUntil = getApprovalSnoozeUntil(
                  option.id,
                  new Date(approvalClock),
                );
                return (
                  <button
                    key={option.id}
                    type="button"
                    data-overlay-initial-focus={index === 0 ? true : undefined}
                    onClick={() => confirmApprovalSnooze(option.id)}
                  >
                    <span>
                      <option.icon size={17} />
                    </span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.detail}</small>
                    </span>
                    <em>
                      {formatApprovalDeferredUntil(
                        deferredUntil.toISOString(),
                        approvalClock,
                      )}
                    </em>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>

            <button
              className="approval-snooze-cancel"
              type="button"
              onClick={() => setApprovalSnoozeId(null)}
            >
              
              {t("保持当前待办")}
            </button>
          </section>
        </div>
      )}

      {rejectedApproval && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={() => {
            setRejectApprovalId(null);
            setApprovalRejectReason("");
          }}
        >
          <section
            className="approval-reject-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="approval-reject-title"
            aria-describedby="approval-reject-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="approval-reject-close"
              type="button"
              aria-label={t("关闭拒绝确认")}
              onClick={() => {
                setRejectApprovalId(null);
                setApprovalRejectReason("");
              }}
            >
              <X size={17} />
            </button>
            <span className="approval-reject-icon">
              <Ban size={21} />
            </span>
            <span className="approval-reject-eyebrow">{t("拒绝操作")}</span>
            <h2 id="approval-reject-title">{t("确认不允许这次操作？")}</h2>
            <p id="approval-reject-description">{t("系统不会执行“{title}”，并会暂停关联任务，等待你修改任务或重新启动。", { title: rejectedApproval.title })}</p>
            <div className="approval-reject-facts">
              <span>
                <small>{t("执行对象")}</small>
                <strong>{rejectedApproval.target}</strong>
              </span>
              <span>
                <small>{t("授权范围")}</small>
                <strong>{rejectedApproval.scope}</strong>
              </span>
              <span>
                <small>{t("关联任务")}</small>
                <strong>
                  {tasks.find((task) => task.id === rejectedApproval.taskId)?.title ??
                    rejectedApproval.taskId}
                </strong>
              </span>
            </div>
            <label className="approval-reject-reason">
              <span>
                <strong>{t("拒绝原因")}</strong>
                <small>{t("将写入这条审批的审计记录")}</small>
              </span>
              <textarea
                data-overlay-initial-focus
                aria-label={t("拒绝原因")}
                maxLength={120}
                placeholder={t("例如：执行对象不正确，需要重新确认授权范围")}
                value={approvalRejectReason}
                onChange={(event) =>
                  setApprovalRejectReason(event.target.value)
                }
              />
              <small>{t("{length} / 120，至少 4 个字", { length: approvalRejectReason.trim().length })}</small>
            </label>
            <div className="approval-reject-note">
              <ShieldCheck size={16} />
              <span>
                
                {t("不会发生任何外部操作；完成后 10 秒内可以撤销，决定仍会写入审计记录。")}
              </span>
            </div>
            <div className="approval-reject-actions">
              <button
                type="button"
                onClick={() => {
                  setRejectApprovalId(null);
                  setApprovalRejectReason("");
                }}
              >
                
                {t("返回审核")}
              </button>
              <button
                className="danger"
                type="button"
                disabled={approvalRejectReason.trim().length < 4}
                onClick={confirmRejectApproval}
              >
                <Ban size={15} />
                
                {t("确认拒绝")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingWorkspaceImport && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={closeWorkspaceImportPreview}
        >
          <section
            className="workspace-import-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="workspace-import-title"
            aria-describedby="workspace-import-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="workspace-import-close"
              type="button"
              aria-label={t("关闭备份恢复预览")}
              onClick={closeWorkspaceImportPreview}
            >
              <X size={17} />
            </button>
            <span className="workspace-import-icon">
              <Upload size={21} />
            </span>
            <span className="workspace-import-eyebrow">{t("备份已通过校验")}</span>
            <h2 id="workspace-import-title">{t("恢复“{fileName}”中的工作区？", { fileName: pendingWorkspaceImport.fileName })}</h2>
            <p id="workspace-import-description">
              
              {t("确认后，当前任务、成果、团队成员、审批状态、运行记录和设置会被这份备份替换。")}
            </p>

            <div className="workspace-import-meta">
              <span>
                <Clock3 size={16} />
                <span>
                  <small>{t("备份时间")}</small>
                  <strong>
                    {formatAuditTimestamp(
                      pendingWorkspaceImport.backup.exportedAt,
                    )}
                  </strong>
                </span>
              </span>
              <span>
                <FileJson size={16} />
                <span>
                  <small>{t("文件大小")}</small>
                  <strong>
                    {(pendingWorkspaceImport.fileSize / 1024).toFixed(1)} KB
                  </strong>
                </span>
              </span>
            </div>

            <div className="workspace-import-facts" aria-label={t("备份内容")}>
              <span>
                <small>{t("任务")}</small>
                <strong>{pendingWorkspaceImport.backup.tasks.length}</strong>
              </span>
              <span>
                <small>{t("成果")}</small>
                <strong>
                  {(pendingWorkspaceImport.backup.artifacts ?? workspaceDefaults.artifacts).length}
                </strong>
              </span>
              <span>
                <small>{t("运行记录")}</small>
                <strong>{pendingWorkspaceImport.backup.activity.length}</strong>
              </span>
              <span>
                <small>{t("待确认")}</small>
                <strong>
                  {
                    workspaceDefaults.approvals.filter((item) =>
                      pendingWorkspaceImport.backup.approvalIds.includes(item.id),
                    ).length
                  }
                </strong>
              </span>
            </div>

            <div className="workspace-import-comparison">
              <span>
                <small>{t("当前工作区")}</small>
                <strong>{t("{length} 个任务 · {length2} 项成果", { length: tasks.length, length2: artifacts.length })}</strong>
              </span>
              <i><ChevronRight size={17} /></i>
              <span>
                <small>{t("恢复后")}</small>
                <strong>{t("{length} 个任务 ·{value}{length2}{value2}项成果", { length: pendingWorkspaceImport.backup.tasks.length, value: " ", length2: (pendingWorkspaceImport.backup.artifacts ?? workspaceDefaults.artifacts).length, value2: " " })}</strong>
              </span>
            </div>

            <div className="workspace-import-note">
              <ShieldCheck size={16} />
              <span>
                
                {t("文件只在当前设备中读取。恢复前仍可先导出一份当前工作区备份。")}
              </span>
            </div>

            <label
              className={`workspace-import-confirm${
                workspaceImportAcknowledged ? " is-checked" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={workspaceImportAcknowledged}
                onChange={(event) =>
                  setWorkspaceImportAcknowledged(event.target.checked)
                }
              />
              <ShieldCheck size={17} />
              <span>
                <strong>{t("确认替换当前工作区")}</strong>
                <small>{t("恢复完成后，只能通过另一份备份找回当前内容。")}</small>
              </span>
            </label>

            <button
              className={`workspace-import-backup${
                recoveryBackupCreated ? " is-complete" : ""
              }`}
              type="button"
              onClick={exportRecoveryBackup}
            >
              {recoveryBackupCreated ? (
                <CheckCircle2 size={16} />
              ) : (
                <Download size={16} />
              )}
              {t(recoveryBackupCreated
                ? t("当前工作区已备份")
                : t("先备份当前工作区"))}
            </button>

            <div className="workspace-import-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={closeWorkspaceImportPreview}
              >
                
                {t("取消恢复")}
              </button>
              <button
                className="confirm"
                type="button"
                disabled={!workspaceImportAcknowledged}
                onClick={confirmWorkspaceImport}
              >
                <Upload size={15} />
                {(workspaceImportAcknowledged ? t("确认并恢复") : t("请先确认"))}
              </button>
            </div>
          </section>
        </div>
      )}

      {temporaryModeOpen && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={() => setTemporaryModeOpen(false)}
        >
          <section
            className="temporary-session-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="temporary-session-title"
            aria-describedby="temporary-session-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="temporary-session-close"
              type="button"
              aria-label={t("关闭临时会话确认")}
              onClick={() => setTemporaryModeOpen(false)}
            >
              <X size={17} />
            </button>
            <span className="temporary-session-icon">
              <Timer size={21} />
            </span>
            <span className="temporary-session-eyebrow">{t("数据保存方式")}</span>
            <h2 id="temporary-session-title">{t("切换到临时会话？")}</h2>
            <p id="temporary-session-description">
              
              {t("当前页面仍可继续使用，但刷新或关闭页面后，不会自动恢复这次工作区。")}
            </p>
            <div className="temporary-session-facts">
              <span>
                <small>{t("当前任务")}</small>
                <strong>{t("{length} 个", { length: tasks.length })}</strong>
              </span>
              <span>
                <small>{t("任务成果")}</small>
                <strong>{t("{length} 项", { length: artifacts.length })}</strong>
              </span>
              <span>
                <small>{t("运行记录")}</small>
                <strong>{t("{length} 条", { length: activityLog.length })}</strong>
              </span>
            </div>
            <div className="temporary-session-note">
              <ShieldCheck size={16} />
              <span>
                
                {t("这不会上传或立即删除当前页面中的数据。离开前重新开启保存即可保留。")}
              </span>
            </div>
            <button
              className="temporary-session-backup"
              type="button"
              onClick={exportWorkspace}
            >
              <Download size={16} />
              
              {t("先导出工作区备份")}
            </button>
            <div className="temporary-session-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={() => setTemporaryModeOpen(false)}
              >
                
                {t("保持本机保存")}
              </button>
              <button
                className="warning"
                type="button"
                onClick={confirmTemporaryMode}
              >
                <Timer size={15} />
                
                {t("使用临时会话")}
              </button>
            </div>
          </section>
        </div>
      )}

      {workspaceResetOpen && (
        <div
          className="clarity-dialog-backdrop"
          onMouseDown={closeWorkspaceReset}
        >
          <section
            className="workspace-reset-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="workspace-reset-title"
            aria-describedby="workspace-reset-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="workspace-reset-close"
              type="button"
              aria-label={t("关闭重置确认")}
              onClick={closeWorkspaceReset}
            >
              <X size={17} />
            </button>
            <span className="workspace-reset-icon">
              <RotateCcw size={21} />
            </span>
            <span className="workspace-reset-eyebrow">{t("恢复初始状态")}</span>
            <h2 id="workspace-reset-title">{t("重置当前本机工作区？")}</h2>
            <p id="workspace-reset-description">
              
              {t("当前任务、审批状态、运行记录和设置会被示例工作区替换。建议先导出备份。")}
            </p>
            <div className="workspace-reset-facts">
              <span>
                <small>{t("当前任务")}</small>
                <strong>{t("{length} 个", { length: tasks.length })}</strong>
              </span>
              <span>
                <small>{t("任务成果")}</small>
                <strong>{t("{length} 项", { length: artifacts.length })}</strong>
              </span>
              <span>
                <small>{t("运行记录")}</small>
                <strong>{t("{length} 条", { length: activityLog.length })}</strong>
              </span>
              <span>
                <small>{t("待确认")}</small>
                <strong>{t("{length} 件", { length: approvals.length })}</strong>
              </span>
            </div>
            <div className="workspace-reset-impact">
              <span>
                <X size={13} />
                
                {t("当前任务配置")}
              </span>
              <span>
                <X size={13} />
                
                {t("当前成员与权限")}
              </span>
              <span>
                <X size={13} />
                
                {t("当前运行与审计记录")}
              </span>
            </div>
            <label
              className={`workspace-reset-confirm${
                workspaceResetAcknowledged ? " is-checked" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={workspaceResetAcknowledged}
                onChange={(event) =>
                  setWorkspaceResetAcknowledged(event.target.checked)
                }
              />
              <AlertTriangle size={17} />
              <span>
                <strong>{t("我确认恢复为示例工作区")}</strong>
                <small>{t("此操作会立即替换当前本机数据。")}</small>
              </span>
            </label>
            <button
              className={`workspace-reset-backup${
                recoveryBackupCreated ? " is-complete" : ""
              }`}
              type="button"
              onClick={exportRecoveryBackup}
            >
              {recoveryBackupCreated ? (
                <CheckCircle2 size={16} />
              ) : (
                <Download size={16} />
              )}
              {(recoveryBackupCreated ? t("当前工作区已备份") : t("先导出备份"))}
            </button>
            <div className="workspace-reset-actions">
              <button
                type="button"
                data-overlay-initial-focus
                onClick={closeWorkspaceReset}
              >
                
                {t("保留当前数据")}
              </button>
              <button
                className="danger"
                type="button"
                disabled={!workspaceResetAcknowledged}
                onClick={resetWorkspace}
              >
                <RotateCcw size={15} />
                {(workspaceResetAcknowledged ? t("确认重置") : t("请先确认"))}
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && (
        <div
          className={`clarity-toast ${noticeIsCaution ? "caution" : ""} ${
            artifactUndoAvailable ||
            taskDeleteUndoAvailable ||
            approvalRejectUndoAvailable
              ? "has-action"
              : ""
          }`}
          role={noticeIsCaution ? "alert" : "status"}
        >
          {noticeIsCaution ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{notice}</span>
          {taskDeleteUndoAvailable && (
            <button
              className="clarity-toast-undo"
              type="button"
              onClick={undoTaskDelete}
            >
              <RotateCcw size={14} />
              
              {t("恢复任务")}
            </button>
          )}
          {artifactUndoAvailable && (
            <button
              className="clarity-toast-undo"
              type="button"
              onClick={undoArtifactDelete}
            >
              <RotateCcw size={14} />
              
              {t("撤销")}
            </button>
          )}
          {approvalRejectUndoAvailable && (
            <button
              className="clarity-toast-undo"
              type="button"
              onClick={undoApprovalReject}
            >
              <RotateCcw size={14} />
              
              {t("撤销拒绝")}
            </button>
          )}
          <button
            className="clarity-toast-close"
            type="button"
            aria-label={t("关闭提示")}
            onClick={() => {
              setNotice("");
              setTaskDeleteSnapshot(null);
              setArtifactDeleteSnapshot(null);
              setApprovalRejectSnapshot(null);
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}
