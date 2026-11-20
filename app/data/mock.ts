import { t } from "../i18n";
import { Brain, CalendarDays, FileText, Globe2, HardDrive, Mail, Send, Sparkles } from "lucide-react";
import type {
  ConnectorState,
  ActivityItem,
  ApprovalItem,
  ArtifactItem,
  ConnectorDefinition,
  ConnectorId,
  TaskItem,
  TaskSchedule,
  TeamMember,
  TeamRole,
  Weekday,
} from "../types";

export const connectorTestLatencies: Record<ConnectorId, number> = {
  browser: 176,
  workspace: 38,
  mail: 214,
  calendar: 196,
};

export const connectorErrorCodes: Record<ConnectorId, string[]> = {
  browser: ["BROWSER_AUTH_EXPIRED"],
  workspace: ["WORKSPACE_PERMISSION_REVOKED"],
  mail: ["MAIL_AUTH_EXPIRED"],
  calendar: ["CALENDAR_AUTH_EXPIRED"],
};

export const connectorCatalog: ConnectorDefinition[] = [
  {
    id: "browser",
    name: "Unzoo Browser",
    description: t("读取网页、保存截图与提取页面结构"),
    scope: t("仅限任务指定页面"),
    dataFlow: t("外部网页 → 任务上下文"),
    credential: t("浏览器会话授权"),
    lastUsed: t("刚刚 · 跟踪竞品发布动态"),
    permissions: [t("读取指定网页"), t("保存页面截图"), t("使用已授权会话")],
    icon: Globe2,
    tone: "blue",
  },
  {
    id: "workspace",
    name: t("本机工作区"),
    description: t("读取项目文件并写入已批准的成果"),
    scope: t("仅限当前项目目录"),
    dataFlow: t("本机文件 ↔ 任务成果"),
    credential: t("设备本机权限"),
    lastUsed: t("8 分钟前 · 整理本周项目进展"),
    permissions: [t("读取项目文件"), t("创建任务成果"), t("保留版本记录")],
    icon: HardDrive,
    tone: "green",
  },
  {
    id: "mail",
    name: t("邮件连接器"),
    description: t("发送已批准的摘要、提醒与报告"),
    scope: t("发送前必须确认"),
    dataFlow: t("审批结果 → 外部收件人"),
    credential: t("邮箱 OAuth 授权"),
    lastUsed: t("等待确认 · 竞品摘要"),
    permissions: [t("创建邮件草稿"), t("读取发送状态"), t("批准后发送邮件")],
    icon: Mail,
    tone: "amber",
  },
  {
    id: "calendar",
    name: t("日历连接器"),
    description: t("读取空闲时间并安排自动任务"),
    scope: t("仅限空闲与任务日程"),
    dataFlow: t("日历忙闲 ↔ 任务计划"),
    credential: t("日历 OAuth 授权"),
    lastUsed: t("尚未使用"),
    permissions: [t("读取空闲时间"), t("创建日程提醒"), t("更新任务时间")],
    icon: CalendarDays,
    tone: "violet",
  },
];

export const teamRoleDetails: Record<
  TeamRole,
  { summary: string; permissions: string[] }
> = {
  所有者: {
    summary: t("管理工作区、成员、任务与全部审批"),
    permissions: [t("管理成员与角色"), t("创建和编辑任务"), t("审批外部操作")],
  },
  管理员: {
    summary: t("管理任务、连接器与团队日常设置"),
    permissions: [t("邀请新成员"), t("创建和编辑任务"), t("审批外部操作")],
  },
  审批者: {
    summary: t("查看任务成果并处理待确认操作"),
    permissions: [t("查看全部任务"), t("查看和下载成果"), t("审批外部操作")],
  },
  成员: {
    summary: t("查看任务与成果，不可修改安全设置"),
    permissions: [t("查看全部任务"), t("查看和下载成果"), t("添加任务备注")],
  },
};

export const teamSeatLimit = 10;

export const initialTeamMembers: TeamMember[] = [
  {
    id: "member-owner",
    name: t("刘一帆"),
    email: "yifan@unzoo.local",
    role: "所有者",
    status: "在线",
    avatar: t("刘"),
    tone: "blue",
    lastActive: t("正在使用"),
  },
  {
    id: "member-admin",
    name: t("王安"),
    email: "wangan@unzoo.local",
    role: "管理员",
    status: "在线",
    avatar: t("王"),
    tone: "green",
    lastActive: t("12 分钟前"),
  },
  {
    id: "member-approver",
    name: t("陈默"),
    email: "chenmo@unzoo.local",
    role: "审批者",
    status: "离线",
    avatar: t("陈"),
    tone: "amber",
    lastActive: t("昨天 18:42"),
  },
];

export const initialTasks: TaskItem[] = [
  {
    id: "sales-digest",
    title: t("同步销售线索周报"),
    description: t("汇总新增线索和跟进状态，生成摘要后发送给销售负责人。"),
    target: t("销售工作区 / 邮件连接器"),
    status: "失败",
    progress: 42,
    updated: t("6 分钟前失败"),
    schedule: "每周",
    scheduleTime: "10:00",
    scheduleDay: "周一",
    requiresApproval: true,
    lastError: t("邮件连接器授权已过期，任务在发送前安全停止。"),
    errorCode: "MAIL_AUTH_EXPIRED",
    retryCount: 1,
    runs: [
      {
        id: "run-sales-20260729",
        status: "失败",
        startedAt: "2026-07-29T15:18:00+08:00",
        durationSeconds: 94,
        summary: t("已生成销售摘要，但没有执行外部发送。"),
        errorCode: "MAIL_AUTH_EXPIRED",
        errorMessage: t("邮件连接器授权已过期。"),
      },
      {
        id: "run-sales-20260722",
        status: "成功",
        startedAt: "2026-07-22T10:00:00+08:00",
        durationSeconds: 128,
        summary: t("周报已生成并在确认后发送给销售负责人。"),
      },
      {
        id: "run-sales-20260715",
        status: "成功",
        startedAt: "2026-07-15T10:00:00+08:00",
        durationSeconds: 121,
        summary: t("完成 18 条销售线索汇总并保存证据。"),
      },
    ],
  },
  {
    id: "competitor",
    title: t("跟踪竞品发布动态"),
    description: t("每天检查 3 个竞品页面，有变化时生成一份摘要。"),
    target: "https://example.com/competitors",
    status: "运行中",
    progress: 68,
    updated: t("刚刚更新"),
    schedule: "每天",
    scheduleTime: "09:00",
    requiresApproval: true,
    pinned: true,
    runs: [
      {
        id: "run-competitor-current",
        status: "运行中",
        startedAt: "2026-07-29T15:24:00+08:00",
        summary: t("正在比对 3 个竞品页面的最新变化。"),
      },
      {
        id: "run-competitor-previous",
        status: "成功",
        startedAt: "2026-07-28T09:00:00+08:00",
        durationSeconds: 156,
        summary: t("发现 2 处有效变化并生成竞品摘要。"),
      },
    ],
  },
  {
    id: "weekly-report",
    title: t("整理本周项目进展"),
    description: t("汇总项目文件和工作记录，生成周报草稿。"),
    target: t("本地项目工作区"),
    status: "待确认",
    progress: 92,
    updated: t("8 分钟前"),
    schedule: "每周",
    scheduleTime: "17:30",
    scheduleDay: "周五",
    requiresApproval: true,
    runs: [
      {
        id: "run-weekly-current",
        status: "运行中",
        startedAt: "2026-07-29T15:12:00+08:00",
        summary: t("周报草稿已完成，正在等待发送确认。"),
      },
      {
        id: "run-weekly-previous",
        status: "成功",
        startedAt: "2026-07-25T17:30:00+08:00",
        durationSeconds: 202,
        summary: t("已汇总 5 个项目文件并保存周报草稿。"),
      },
    ],
  },
  {
    id: "meeting",
    title: t("准备产品评审材料"),
    description: t("整理评审议题、相关文件和待解决问题。"),
    target: t("产品评审资料库"),
    status: "已完成",
    progress: 100,
    updated: t("今天 10:32"),
    schedule: "仅运行一次",
    requiresApproval: true,
    runs: [
      {
        id: "run-meeting-complete",
        status: "成功",
        startedAt: "2026-07-29T10:28:00+08:00",
        durationSeconds: 244,
        summary: t("评审材料、议题和待解决问题已整理完成。"),
      },
    ],
  },
  {
    id: "research",
    title: t("收集 AI 浏览器产品资料"),
    description: t("保存产品页面并提取功能、定价和团队信息。"),
    target: "https://example.com/research",
    status: "已完成",
    progress: 100,
    updated: t("昨天 18:06"),
    schedule: "仅运行一次",
    requiresApproval: false,
    runs: [
      {
        id: "run-research-complete",
        status: "成功",
        startedAt: "2026-07-28T17:58:00+08:00",
        durationSeconds: 486,
        summary: t("已保存 8 个产品页面并提取结构化信息。"),
      },
    ],
  },
];

export const demoTaskIds = new Set(initialTasks.map((task) => task.id));

export const initialApprovals: ApprovalItem[] = [
  {
    id: "send-summary",
    taskId: "competitor",
    title: t("把竞品摘要发送到领导沟通群"),
    reason: t("摘要已经生成，下一步会通过邮件连接器发送到群组。"),
    impact: t("发送后，群内 3 位成员可以看到这份摘要。"),
    action: t("发送摘要"),
    target: t("领导沟通群 · 3 人"),
    scope: t("仅发送本次摘要"),
    risk: "中风险",
    requestedAt: t("8 分钟前"),
    expiresAt: t("今天 18:00"),
    policy: t("外部发送保护"),
    icon: Send,
  },
  {
    id: "browser-access",
    taskId: "competitor",
    title: t("读取工作浏览器的登录状态"),
    reason: t("目标页面需要登录，系统想使用当前浏览器的会话继续访问。"),
    impact: t("只用于本次任务，任务结束后自动失效。"),
    action: t("允许本次访问"),
    target: t("当前工作浏览器"),
    scope: t("只读会话 · 单次任务"),
    risk: "高风险",
    requestedAt: t("12 分钟前"),
    expiresAt: t("30 分钟后"),
    policy: t("凭证访问保护"),
    icon: Globe2,
  },
  {
    id: "write-report",
    taskId: "weekly-report",
    title: t("把报告保存到项目目录"),
    reason: t("系统准备把生成的报告写入当前项目。"),
    impact: t("将新增文件 competitor-report.md，不会修改其他文件。"),
    action: t("允许保存"),
    target: t("项目目录 / competitor-report.md"),
    scope: t("仅新增 1 个 Markdown 文件"),
    risk: "低风险",
    requestedAt: t("16 分钟前"),
    expiresAt: t("今天 20:00"),
    policy: t("本机文件写入保护"),
    icon: FileText,
  },
];

export const initialArtifacts: ArtifactItem[] = [
  {
    id: "artifact-competitor-report",
    taskId: "competitor",
    title: t("竞品发布动态摘要"),
    filename: "competitor-report.md",
    description: t("汇总 3 个竞品页面的 4 项变化，并给出值得跟进的产品信号。"),
    type: "报告",
    status: "已完成",
    format: "Markdown",
    sizeKb: 18.4,
    updated: t("2 分钟前"),
    createdAt: "2026-07-29T14:28:00+08:00",
    content: t("# 竞品发布动态摘要\n\n## 今日变化\n- Unzoo Browser 更新了团队工作区说明。\n- 两个竞品新增企业权限控制页面。\n- 一个竞品调整了自动化套餐价格。\n- 三个页面共识别出 4 项有效变化。\n\n## 建议\n优先跟进企业权限与审计能力，并确认定价变化是否影响当前产品定位。"),
    highlights: [t("4 项有效变化"), t("3 个竞品页面"), t("2 项高价值信号")],
    starred: true,
  },
  {
    id: "artifact-evidence-package",
    taskId: "competitor",
    title: t("页面变化证据包"),
    filename: "competitor-evidence.json",
    description: t("包含页面地址、采集时间、内容哈希和 12 张页面截图的证据清单。"),
    type: "证据",
    status: "已完成",
    format: "JSON",
    sizeKb: 46.8,
    updated: t("7 分钟前"),
    createdAt: "2026-07-29T14:23:00+08:00",
    content: t("{\n  \"task\": \"跟踪竞品发布动态\",\n  \"capturedAt\": \"2026-07-29T14:23:00+08:00\",\n  \"pages\": 3,\n  \"screenshots\": 12,\n  \"integrity\": \"verified\"\n}"),
    highlights: [t("12 张页面截图"), t("3 个来源"), t("完整性已验证")],
    evidenceCount: 12,
  },
  {
    id: "artifact-change-data",
    taskId: "competitor",
    title: t("竞品变化结构化数据"),
    filename: "competitor-changes.csv",
    description: t("适合继续分析或导入表格的结构化变化明细。"),
    type: "数据",
    status: "已完成",
    format: "CSV",
    sizeKb: 8.2,
    updated: t("8 分钟前"),
    createdAt: "2026-07-29T14:22:00+08:00",
    content: t("竞品,变化类型,优先级,采集时间\nUnzoo Browser,企业权限,高,14:21\nBrowserbase,套餐定价,中,14:20\nMultiOn,产品文案,低,14:18"),
    highlights: [t("3 条结构化记录"), t("1 项高优先级"), t("可直接导入表格")],
    table: {
      columns: [t("竞品"), t("变化类型"), t("优先级"), t("采集时间")],
      rows: [
        ["Unzoo Browser", t("企业权限"), t("高"), "14:21"],
        ["Browserbase", t("套餐定价"), t("中"), "14:20"],
        ["MultiOn", t("产品文案"), t("低"), "14:18"],
      ],
    },
  },
  {
    id: "artifact-weekly-draft",
    taskId: "weekly-report",
    title: t("本周项目进展草稿"),
    filename: "weekly-progress-draft.md",
    description: t("已汇总项目文件和运行记录，等待审批后写入项目目录。"),
    type: "草稿",
    status: "草稿",
    format: "Markdown",
    sizeKb: 12.6,
    updated: t("11 分钟前"),
    createdAt: "2026-07-29T14:19:00+08:00",
    content: t("# 本周项目进展\n\n## 已完成\n- 完成 AI 任务控制台首页与任务管理。\n- 补齐审批、审计和本机数据恢复流程。\n\n## 下周计划\n- 接入真实任务运行数据。\n- 完善团队协作和交付物管理。"),
    highlights: [t("2 项已完成"), t("2 项下周计划"), t("等待写入审批")],
  },
  {
    id: "artifact-review-brief",
    taskId: "meeting",
    title: t("产品评审议题简报"),
    filename: "product-review-brief.md",
    description: t("整理本次产品评审的核心议题、相关背景和待决策问题。"),
    type: "报告",
    status: "已完成",
    format: "Markdown",
    sizeKb: 15.1,
    updated: t("今天 10:32"),
    createdAt: "2026-07-29T10:32:00+08:00",
    content: t("# 产品评审议题简报\n\n## 核心议题\n1. 审批流程是否覆盖高风险外部操作。\n2. 任务成果是否能够完整追溯。\n3. 团队工作区的数据保留策略。"),
    highlights: [t("3 个核心议题"), t("5 份关联资料"), t("评审材料已就绪")],
  },
  {
    id: "artifact-research-data",
    taskId: "research",
    title: t("AI 浏览器产品研究表"),
    filename: "ai-browser-research.csv",
    description: t("包含 6 个产品的功能、团队、定价和企业能力对比。"),
    type: "数据",
    status: "已完成",
    format: "CSV",
    sizeKb: 22.9,
    updated: t("昨天 18:06"),
    createdAt: "2026-07-28T18:06:00+08:00",
    content: t("产品,自动化,团队协作,企业权限\nUnzoo Browser,支持,支持,支持\nBrowserbase,支持,支持,支持\nMultiOn,支持,有限,有限"),
    highlights: [t("6 个产品"), t("4 个对比维度"), t("研究已完成")],
    table: {
      columns: [t("产品"), t("自动化"), t("团队协作"), t("企业权限")],
      rows: [
        ["Unzoo Browser", t("支持"), t("支持"), t("支持")],
        ["Browserbase", t("支持"), t("支持"), t("支持")],
        ["MultiOn", t("支持"), t("有限"), t("有限")],
      ],
    },
  },
];

export const initialActivityItems: ActivityItem[] = [
  {
    id: "activity-sales-auth-failed",
    time: "15:20",
    createdAt: "2026-07-29T15:20:00+08:00",
    title: t("任务已在发送前安全停止"),
    detail: t("邮件连接器授权已过期，未向销售负责人发送任何内容。"),
    icon: "shield",
    tone: "red",
    kind: "系统",
    taskId: "sales-digest",
  },
  {
    id: "activity-summary-ready",
    time: "14:28",
    createdAt: "2026-07-29T14:28:00+08:00",
    title: t("摘要已生成"),
    detail: t("整理出 4 项产品变化和 2 项值得关注的信号。"),
    icon: "sparkles",
    tone: "blue",
    kind: "任务",
    taskId: "competitor",
  },
  {
    id: "activity-analysis-complete",
    time: "14:26",
    createdAt: "2026-07-29T14:26:00+08:00",
    title: t("页面变化整理完成"),
    detail: t("对比了今天与昨天的页面内容，过滤了无意义变化。"),
    icon: "brain",
    tone: "violet",
    kind: "任务",
    taskId: "competitor",
  },
  {
    id: "activity-evidence-saved",
    time: "14:23",
    createdAt: "2026-07-29T14:23:00+08:00",
    title: t("完成 12 张页面截图"),
    detail: t("3 个目标页面均已读取，截图和页面结构已保存。"),
    icon: "globe",
    tone: "green",
    kind: "任务",
    taskId: "competitor",
  },
  {
    id: "activity-schedule-started",
    time: "09:00",
    createdAt: "2026-07-29T09:00:00+08:00",
    title: t("任务按计划开始"),
    detail: t("由每日 09:00 的计划自动启动。"),
    icon: "clock",
    tone: "neutral",
    kind: "系统",
    taskId: "competitor",
  },
];

export const runSteps = [
  {
    id: "collect",
    title: t("检查网页"),
    description: t("3 个页面已读取，保存了 12 张截图"),
    status: t("完成"),
    icon: Globe2,
  },
  {
    id: "analyze",
    title: t("整理变化"),
    description: t("正在把页面变化整理成简短结论"),
    status: t("进行中"),
    icon: Sparkles,
  },
  {
    id: "send",
    title: t("发送摘要"),
    description: t("发送前会先等你确认"),
    status: t("等待"),
    icon: Mail,
  },
];

export const signalBars = [30, 44, 34, 58, 48, 72, 42, 64, 82, 52, 68, 46, 76, 60, 88, 62, 78, 96];

export const signalPoints = signalBars
  .map((height, index) => {
    const x = 2 + (index / (signalBars.length - 1)) * 96;
    const y = 48 - (height / 100) * 42;
    return `${x},${y}`;
  })
  .join(" ");

export const taskTemplates: Array<{
  id: string;
  label: string;
  title: string;
  description: string;
  target: string;
  targetHint: string;
  schedule: TaskSchedule;
  scheduleTime: string;
  scheduleDay: Weekday;
  icon: typeof Globe2;
}> = [
  {
    id: "monitor",
    label: t("网页监控"),
    title: t("跟踪产品页面变化"),
    description: t("检查页面内容变化，只保留有意义的更新并生成摘要。"),
    target: "",
    targetHint: t("粘贴要监控的网页地址"),
    schedule: "每天",
    scheduleTime: "09:00",
    scheduleDay: "周一",
    icon: Globe2,
  },
  {
    id: "research",
    label: t("深度研究"),
    title: t("研究一个新主题"),
    description: t("从可信来源收集信息，交叉验证后整理成结构化结论。"),
    target: "",
    targetHint: t("输入研究主题、网页或资料库"),
    schedule: "仅运行一次",
    scheduleTime: "09:00",
    scheduleDay: "周一",
    icon: Brain,
  },
  {
    id: "report",
    label: t("自动周报"),
    title: t("生成团队每周进展"),
    description: t("汇总本周项目文件和工作记录，生成可直接发送的周报草稿。"),
    target: "",
    targetHint: t("选择项目文件夹或工作区"),
    schedule: "每周",
    scheduleTime: "17:30",
    scheduleDay: "周五",
    icon: FileText,
  },
];

export const defaultConnectorStates: ConnectorState = {
  browser: true,
  workspace: true,
  mail: true,
  calendar: false,
};
