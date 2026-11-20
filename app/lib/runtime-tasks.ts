/**
 * 控制台任务和 unterm 运行时之间的换算。
 *
 * 装好的 Unzoo One 里，任务归运行时管（unterm GET /api/console/tasks）：
 * 关掉页面任务照样跑，定时任务到点自己起来，换个浏览器任务还在。页面仍然
 * 本地优先地改任务，改完整个推给运行时；运行记录和由它决定的任务状态则只
 * 从运行时读回来。
 *
 * 这里全是纯函数，页面和测试共用。
 */

import type { ArtifactItem, ArtifactType, TaskItem, TaskRun, TaskRunStatus, TaskStatus, TaskWatch, Weekday } from "../types";
import { dateLocale, t } from "../i18n";

export type RuntimeSchedule =
  | { kind: "daily"; time: string }
  | { kind: "weekdays"; time: string }
  | { kind: "weekly"; time: string; weekday: number }
  | { kind: "every"; minutes: number }
  | { kind: "once"; at: string };

/** 运行时里的监视对象。 */
export type RuntimeWatch =
  | { kind: "web"; url: string; every_minutes: number }
  | { kind: "folder"; path: string }
  | { kind: "mail"; address: string; host: string; port?: number; filter: string }
  | { kind: "calendar"; minutes_before: number };

/** 运行时里一次运行：引擎的 run 加上它那一步 agent_turn 的记录。 */
export type RuntimeRun = {
  id: string;
  attempt: number;
  /** pending | running | succeeded | failed | cancelled | interrupted */
  state: string;
  started_at: string;
  ended_at?: string | null;
  trigger?: string | null;
  agent?: string | null;
  adapter?: string | null;
  session_id?: string | null;
  summary?: string | null;
  error?: string | null;
  /** 运行时自己结束这一轮的原因（start_failed、idle_timeout、session_lost、service_restarted）。 */
  error_code?: string | null;
  /** 正等人在收件箱批准一次工具调用。 */
  waiting?: boolean;
  usage?: { input_tokens?: number; output_tokens?: number; cached_input_tokens?: number } | null;
  /** 这次运行所在的目录。 */
  workdir?: string | null;
  /** 这次运行写下或改过的文件，相对 workdir，新的在前。 */
  outputs?: RuntimeOutput[];
};

/**
 * 智能体在一轮里做的一件事（一次工具调用），由运行时整理好：verb 是哪类事，
 * target 是命令、路径或网址（已截成一行）。
 */
export type RuntimeActivity = {
  call_id?: string | null;
  tool: string;
  /** run read search edit delete terminal watch open look click type download upload plan use */
  verb: string;
  target?: string | null;
  /** 网关的风险等级：read local_mutation exec external_side_effect credential_access financial destructive */
  risk?: string | null;
  /** 这件事问过人：问的那一条的 id。 */
  request_id?: string | null;
  /** 谁放行或拒绝的：autonomy（按自主程度）、policy（常设规则）、person（人）。 */
  decided_by?: string | null;
  decision?: "allow" | "deny" | null;
  ok?: boolean | null;
  at?: string | null;
  /** 这一步会发出、发布、付款或删除东西：点的是哪个按钮、在哪个网站、发出去的字。 */
  commit?: RuntimeCommit | null;
  /** 同样的提交这次会话里刚做过一次（可能已经发出去了）。 */
  repeat?: boolean | null;
  /** 审核员（你自己的智能体）看过：running 正在看；ask 交给你，附理由；allow 它替你放行了，附理由。 */
  review?: { state: "running" | "ask" | "allow"; reason?: string | null } | null;
};

/** 一个提交类动作，运行时按结构给出，界面按语言拼成句子。 */
export type RuntimeCommit = {
  /** click 点按钮；enter 在输入框里按回车发出；form 填表并提交；script 用脚本点击或提交。 */
  kind: "click" | "enter" | "form" | "script";
  label?: string | null;
  site?: string | null;
  text?: string | null;
  risk?: string | null;
};

/** 对话里的一轮：一次运行，加上说了什么、做了什么、答了什么。 */
export type RuntimeTurn = RuntimeRun & {
  prompt?: string | null;
  reply?: string | null;
  activity: RuntimeActivity[];
  /** 追问时有：true 接上了原来的对话，false 没有可接的、开了新的。 */
  continued?: boolean | null;
  /** 这一轮里智能体用过的终端会话（Unzoo One 终端的 id）。 */
  terminals: string[];
  /** 这一轮里智能体用过的 Unzoo 浏览器标签页。 */
  tabs: string[];
  /** save_skill：这一轮是“把对话存为技能”。 */
  purpose?: string | null;
  /** 自己运行的那一轮觉得不用打扰你：quiet 没什么要说的，later 不急、留着你有空看。 */
  fold?: "quiet" | "later" | null;
  /** 存成的技能名。 */
  saved_skills?: string[] | null;
  /** 没存成的原因。 */
  skill_error?: string | null;
  /** 智能体这一轮交给别的智能体做的事，每个帮手一条。 */
  helpers?: RuntimeHelper[] | null;
  /** 智能体请人亲自做的事（登录、验证码），和人做了没有。 */
  handovers?: RuntimeHandover[] | null;
};

/** 智能体请人接手的一件事。 */
export type RuntimeHandover = {
  id: string;
  /** 给人的一句话：做什么、在哪做。 */
  what: string;
  tab_id?: string | null;
  state: "waiting" | "done" | "cannot";
  note?: string | null;
};

/**
 * 帮手：对话里的智能体交出去一段活的另一个智能体（agent_session.delegate）。
 * 它在同一个文件夹里、按同样的自主程度干活，要问的照样问人。
 */
export type RuntimeHelper = {
  session_id: string;
  agent: string;
  /** 交给它的活（最近一次）。 */
  prompt: string;
  state: "working" | "waiting" | "done" | "failed" | "stopped";
  waiting?: boolean;
  reply?: string | null;
  error?: string | null;
  activity: RuntimeActivity[];
  terminals: string[];
  tabs: string[];
};

/** 一个任务作为一段对话。 */
export type RuntimeThread = Omit<RuntimeTask, "runs"> & { turns: RuntimeTurn[] };

/** 一次运行写下的一个文件。 */
export type RuntimeOutput = { path: string; size: number; modified: string };

/** 读回来的一个产出文件。 */
export type RuntimeOutputContent = {
  path: string;
  absolutePath: string;
  size: number;
  truncated: boolean;
  binary: boolean;
  text: string | null;
};

export type RuntimeTask = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  prompt?: string | null;
  schedule?: RuntimeSchedule | null;
  paused: boolean;
  watch?: RuntimeWatch | null;
  /** 最近一次查看监视对象的时间和出的错。 */
  watch_status?: { checked_at?: string | null; error?: string | null; has_secret?: boolean } | null;
  agent?: string | null;
  keep_conversation?: boolean;
  /** 控制台自己的那份任务，运行时原样存、原样还。 */
  console?: unknown;
  /** 运行设置没指定目录时，这个任务自己的文件夹（第一次运行时才有）。 */
  workdir?: string | null;
  /** 最新的在前。 */
  runs: RuntimeRun[];
};

/** 推给运行时的一条任务。 */
export type RuntimeTaskPut = {
  id: string;
  title: string;
  prompt?: string;
  schedule: RuntimeSchedule | null;
  paused: boolean;
  watch: RuntimeWatch | null;
  agent: string | null;
  keep_conversation: boolean;
  console: Omit<TaskItem, "runs" | "watchError" | "watchHasSecret">;
};

/** 隔多少分钟，运行时接受 5 分钟到一周。 */
export const minEveryMinutes = 5;
export const maxEveryMinutes = 7 * 24 * 60;

const weekdays: readonly Weekday[] = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function scheduleOf(task: TaskItem): RuntimeSchedule | null {
  const time = task.scheduleTime && /^\d{1,2}:\d{2}$/.test(task.scheduleTime) ? task.scheduleTime : "09:00";
  if (task.schedule === "每天") return { kind: "daily", time };
  if (task.schedule === "工作日") return { kind: "weekdays", time };
  if (task.schedule === "每周") {
    const index = weekdays.indexOf(task.scheduleDay ?? "周一");
    return { kind: "weekly", time, weekday: (index < 0 ? 0 : index) + 1 };
  }
  if (task.schedule === "每隔") {
    const minutes = Math.round(task.scheduleEvery ?? 60);
    return { kind: "every", minutes: Math.min(maxEveryMinutes, Math.max(minEveryMinutes, minutes)) };
  }
  if (task.schedule === "定时一次" && task.scheduleAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(task.scheduleAt)) {
    return { kind: "once", at: task.scheduleAt };
  }
  return null;
}

/**
 * 运行时里的计划 → 页面上的字段。一个不是在页面上建的任务（手机、智能体、
 * 别的客户端建的）没有页面自己那份，就按运行时说的显示；否则页面推回去时
 * 会把它的计划、监视和负责的智能体都抹掉。
 */
export function planFromRuntime(
  task: Pick<RuntimeTask, "schedule" | "watch" | "agent" | "keep_conversation">,
): Pick<TaskItem, "schedule" | "scheduleTime" | "scheduleDay" | "scheduleEvery" | "scheduleAt" | "watch" | "helperAgent" | "keepConversation"> {
  const plan: ReturnType<typeof planFromRuntime> = {};
  const schedule = task.schedule;
  if (schedule?.kind === "daily") Object.assign(plan, { schedule: "每天", scheduleTime: schedule.time });
  if (schedule?.kind === "weekdays") Object.assign(plan, { schedule: "工作日", scheduleTime: schedule.time });
  if (schedule?.kind === "weekly")
    Object.assign(plan, { schedule: "每周", scheduleTime: schedule.time, scheduleDay: weekdays[schedule.weekday - 1] ?? "周一" });
  if (schedule?.kind === "every") Object.assign(plan, { schedule: "每隔", scheduleEvery: schedule.minutes });
  if (schedule?.kind === "once") Object.assign(plan, { schedule: "定时一次", scheduleAt: schedule.at });
  if (task.watch?.kind === "web") plan.watch = { kind: "web", url: task.watch.url, everyMinutes: task.watch.every_minutes };
  if (task.watch?.kind === "folder") plan.watch = { kind: "folder", path: task.watch.path };
  if (task.watch?.kind === "mail")
    plan.watch = { kind: "mail", address: task.watch.address, host: task.watch.host ?? "", filter: task.watch.filter ?? "" };
  if (task.watch?.kind === "calendar") plan.watch = { kind: "calendar", minutesBefore: task.watch.minutes_before };
  if (task.agent) plan.helperAgent = task.agent;
  if (task.keep_conversation) plan.keepConversation = true;
  return plan;
}

export function watchOf(task: Pick<TaskItem, "watch">): RuntimeWatch | null {
  const watch: TaskWatch | undefined = task.watch;
  if (!watch) return null;
  if (watch.kind === "web") {
    const url = watch.url.trim();
    if (!/^https?:\/\//i.test(url)) return null;
    const every = Math.min(maxEveryMinutes, Math.max(minEveryMinutes, Math.round(watch.everyMinutes || 30)));
    return { kind: "web", url, every_minutes: every };
  }
  if (watch.kind === "mail") {
    const address = watch.address.trim();
    if (!/^[^@\s]+@[^@\s]+$/.test(address)) return null;
    return { kind: "mail", address, host: watch.host.trim(), filter: watch.filter.trim() };
  }
  if (watch.kind === "calendar") {
    return { kind: "calendar", minutes_before: Math.min(1440, Math.max(0, Math.round(watch.minutesBefore))) };
  }
  const path = watch.path.trim();
  return path ? { kind: "folder", path } : null;
}

/** 常见邮箱的收信服务器，认不出来的要人填。和运行时的猜法一致。 */
export function guessMailHost(address: string): string | null {
  const domain = address.split("@")[1]?.trim().toLowerCase() ?? "";
  const known: Record<string, string> = {
    "gmail.com": "imap.gmail.com",
    "googlemail.com": "imap.gmail.com",
    "outlook.com": "outlook.office365.com",
    "hotmail.com": "outlook.office365.com",
    "live.com": "outlook.office365.com",
    "msn.com": "outlook.office365.com",
    "qq.com": "imap.qq.com",
    "foxmail.com": "imap.qq.com",
    "163.com": "imap.163.com",
    "126.com": "imap.126.com",
    "yeah.net": "imap.yeah.net",
    "sina.com": "imap.sina.com",
    "icloud.com": "imap.mail.me.com",
    "me.com": "imap.mail.me.com",
    "mac.com": "imap.mail.me.com",
    "yahoo.com": "imap.mail.yahoo.com",
    "aliyun.com": "imap.aliyun.com",
  };
  return known[domain] ?? null;
}

/**
 * 交给智能体的那段话：标题、说明、目标。和页面直接跑任务时说的一样。
 * 标题是从说明第一行取的（直接输入需求时），就不再重复一遍。
 */
export function promptOf(task: Pick<TaskItem, "title" | "description" | "target">): string {
  const description = task.description.trim();
  const titleStem = task.title.replace(/…$/, "").trim();
  const title = titleStem && description.startsWith(titleStem) ? "" : task.title;
  return [title, description, task.target && t("目标：{target}", { target: task.target })].filter(Boolean).join("\n");
}

/** 直接输入需求时，任务名取第一行，长了在词边界截断。 */
export function titleFromRequest(request: string, max = 60): string {
  const firstLine = request.trim().split(/\r?\n/)[0]?.trim() ?? "";
  // 第一句话放得下就只取第一句：“Say hello. Don't use tools.” → “Say hello”。
  // 英文的句号后面要有空格（example.com 不算句末），中文的不用。
  const sentence = /^(.{4,}?)(?:[.!?](?:\s|$)|[。！？])/u.exec(firstLine)?.[1]?.trim();
  if (sentence && sentence.length <= max && sentence.length < firstLine.length) return sentence;
  if (firstLine.length <= max) return firstLine;
  const cut = firstLine.slice(0, max);
  // 英文在空格处断；中文没有空格，按字数断。
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:，。；：、]+$/, "")}…`;
}

/**
 * 页面里的任务 → 运行时要存的。运行记录不推：那是运行时写的。
 * 交给智能体的话是任务说明；没写说明就用标题。
 */
export function toRuntimePut(task: TaskItem): RuntimeTaskPut {
  const { runs: _runs, watchError: _watchError, watchHasSecret: _watchHasSecret, ...rest } = task;
  void _runs;
  void _watchError;
  void _watchHasSecret;
  const prompt = promptOf(task);
  return {
    id: task.id,
    title: task.title.trim() || task.id,
    prompt: prompt || undefined,
    schedule: scheduleOf(task),
    paused: task.status === "已暂停",
    watch: watchOf(task),
    agent: task.helperAgent?.trim() || null,
    keep_conversation: task.keepConversation === true,
    console: rest,
  };
}

/**
 * 判断一条任务要不要再推一次。只看会推过去的内容，所以运行时读回来的
 * 状态、进度改变了页面，也不会白推一遍。
 */
export function putSignature(task: TaskItem): string {
  const put = toRuntimePut(task);
  const { status: _status, progress: _progress, updated: _updated, lastError: _lastError, ...stable } =
    put.console;
  void _status;
  void _progress;
  void _updated;
  void _lastError;
  return JSON.stringify({ ...put, console: stable });
}

const runStatus: Record<string, TaskRunStatus> = {
  pending: "运行中",
  running: "运行中",
  succeeded: "成功",
  cancelled: "已取消",
  failed: "失败",
  interrupted: "失败",
};

/**
 * 一次失败运行的原因，用读者的语言：运行时自己结束的，按原因码翻译；
 * agent 自己报的错，原样给出。
 */
export function runError(run: Pick<RuntimeRun, "error" | "error_code">): string | undefined {
  const raw = run.error?.trim() || undefined;
  switch (run.error_code) {
    case "start_failed":
      return t("智能体没能启动：{error}", { error: raw ?? "" });
    case "idle_timeout":
      return t("十分钟没有任何进展，已停止");
    case "session_lost":
      return t("智能体的会话意外中断了");
    case "service_restarted":
      return t("这次运行还没结束，后台服务就停止了");
    default:
      return raw;
  }
}

export function toTaskRun(run: RuntimeRun): TaskRun {
  const status = runStatus[run.state] ?? "失败";
  const started = Date.parse(run.started_at);
  const ended = run.ended_at ? Date.parse(run.ended_at) : NaN;
  const summary = run.summary?.trim() ?? "";
  const scheduled =
    run.trigger === "schedule"
      ? `${t("按计划运行")} · `
      : run.trigger === "watch"
        ? `${t("有变化时运行")} · `
        : run.trigger === "delegate"
          ? `${t("另一个智能体交来的")} · `
          : "";
  let text: string;
  if (status === "运行中") {
    text = run.waiting ? t("等你在收件箱确认一次工具调用") : summary ? summary.slice(-120) : t("智能体正在处理");
  } else if (status === "成功") {
    text = summary ? summary.slice(-160) : t("运行完成");
  } else if (status === "已取消") {
    text = t("已停止");
  } else {
    text = runError(run) || (summary ? summary.slice(-160) : t("运行失败"));
  }
  return {
    id: run.id,
    status,
    startedAt: Number.isNaN(started) ? run.started_at : new Date(started).toISOString(),
    durationSeconds:
      Number.isNaN(started) || Number.isNaN(ended) ? undefined : Math.max(0, Math.round((ended - started) / 1000)),
    summary: `${scheduled}${text}`,
    errorMessage: status === "失败" ? runError(run) : undefined,
    sessionId: run.session_id ?? undefined,
    waiting: status === "运行中" && run.waiting === true,
  };
}

/** 运行时里最近一次运行决定任务的状态；没跑过就沿用页面的。 */
export function statusFrom(remote: RuntimeTask, fallback: TaskStatus): TaskStatus {
  const latest = remote.runs[0];
  if (latest && (latest.state === "running" || latest.state === "pending")) return "运行中";
  if (remote.paused) return "已暂停";
  if (!latest) return fallback === "运行中" ? "待确认" : fallback;
  if (latest.state === "succeeded") return "已完成";
  if (latest.state === "cancelled") return "已暂停";
  return "失败";
}

function isTaskItem(value: unknown): value is Omit<TaskItem, "runs"> {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TaskItem>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.status === "string";
}

/** 刚在页面上发起、运行时还没回报的运行，留这么久。 */
const optimisticMs = 30_000;

/**
 * 把运行时读回来的并进页面的任务列表。
 *
 * 只动运行时说了算的：运行记录、由它们得出的状态、进度和错误。用户正在
 * 页面上改的标题、说明、计划不碰。运行时里还没有的本地任务（刚建、还没
 * 推上去）保留。
 */
export function mergeRuntimeTasks(
  local: TaskItem[],
  remote: RuntimeTask[],
  nowMs = Date.now(),
  /** 页面上刚删掉、删除还没传到运行时的。 */
  removed: ReadonlySet<string> = new Set(),
): TaskItem[] {
  const remoteById = new Map(remote.map((task) => [task.id, task]));
  const merge = (base: TaskItem, from: RuntimeTask): TaskItem => {
    const runs = from.runs.map(toTaskRun);
    const known = new Set(runs.map((run) => run.id));
    // 页面刚发起、运行时还没记下的运行先留着，免得"运行中"闪一下又没了。
    const pending = (base.runs ?? []).filter(
      (run) => !known.has(run.id) && run.status === "运行中" && nowMs - Date.parse(run.startedAt) < optimisticMs,
    );
    const allRuns = [...pending, ...runs].slice(0, 12);
    const view: RuntimeTask = pending.length
      ? { ...from, runs: [{ id: pending[0].id, attempt: 0, state: "running", started_at: pending[0].startedAt }, ...from.runs] }
      : from;
    const status = statusFrom(view, base.status);
    const latest = from.runs[0];
    return {
      ...base,
      status,
      updated: updatedFrom(latest, status, base.updated),
      progress: status === "已完成" ? 100 : status === "运行中" ? Math.max(base.progress, 8) : base.progress,
      runs: allRuns,
      lastError: status === "失败" ? (latest ? runError(latest) : undefined) ?? base.lastError : undefined,
      watchError: from.watch && from.watch_status?.error ? from.watch_status.error : undefined,
      watchHasSecret: from.watch_status?.has_secret,
    };
  };

  const merged = local.map((task) => {
    const from = remoteById.get(task.id);
    return from ? merge(task, from) : task;
  });
  const localIds = new Set(local.map((task) => task.id));
  const fresh = remote
    .filter((task) => !localIds.has(task.id) && !removed.has(task.id))
    .flatMap((task) => {
      const base = isTaskItem(task.console)
        ? ({ ...task.console, id: task.id, title: task.title } as TaskItem)
        : ({
            id: task.id,
            title: task.title,
            description: task.prompt ?? "",
            target: "",
            status: task.paused ? "已暂停" : "待确认",
            progress: 0,
            updated: t("刚刚"),
            ...planFromRuntime(task),
          } satisfies TaskItem);
      return [merge(base, task)];
    });
  return [...fresh, ...merged];
}

/** "最后更新"那一栏：最近一次运行何时结束、怎么结束的。 */
export function updatedFrom(latest: RuntimeRun | undefined, status: TaskStatus, fallback: string): string {
  if (!latest) return fallback;
  if (status === "运行中") return latest.waiting ? t("等你确认") : t("运行中");
  const at = Date.parse(latest.ended_at ?? latest.started_at);
  if (Number.isNaN(at)) return fallback;
  const when = new Date(at).toLocaleString(dateLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const verb = latest.state === "succeeded" ? t("完成") : latest.state === "cancelled" ? t("停止") : t("失败");
  return t("{when} {verb}", { when, verb });
}

/** 是否该快一点刷新：有任务在跑。 */
export function anyRunning(tasks: TaskItem[]): boolean {
  return tasks.some((task) => task.status === "运行中");
}

const imageOrLog = /\.(png|jpe?g|gif|webp|bmp|svg|log|har)$/i;
const dataFile = /\.(csv|tsv|json|jsonl|xlsx?|parquet|sql|xml|ya?ml)$/i;

function outputType(path: string): ArtifactType {
  if (imageOrLog.test(path)) return "证据";
  if (dataFile.test(path)) return "数据";
  return "报告";
}

function baseName(path: string): string {
  return path.split("/").pop() || path;
}

function joinPath(dir: string, path: string): string {
  const separator = dir.includes("\\") ? "\\" : "/";
  return `${dir.replace(/[\\/]+$/, "")}${separator}${path.split("/").join(separator)}`;
}

/** 成果的 id：同一任务里的同一个文件只占一条，后来的运行覆盖前面的。 */
export function outputArtifactId(taskId: string, path: string): string {
  return `out:${taskId}:${path}`;
}

/**
 * 运行时里各次运行写下的文件 → "成果"里的条目。同一个文件被几次运行写过，
 * 只留最近那次，版本号记写过几次。内容这时还没读，选中时再读。
 */
export function runtimeArtifacts(remote: RuntimeTask[]): ArtifactItem[] {
  const items: ArtifactItem[] = [];
  for (const task of remote) {
    const seen = new Map<string, ArtifactItem>();
    for (const run of task.runs) {
      const workdir = run.workdir ?? task.workdir ?? "";
      for (const output of run.outputs ?? []) {
        const known = seen.get(output.path);
        if (known) {
          known.version = (known.version ?? 1) + 1;
          continue;
        }
        const name = baseName(output.path);
        const extension = name.includes(".") ? name.split(".").pop()!.toUpperCase() : t("文件");
        const modified = Date.parse(output.modified);
        const when = Number.isNaN(modified)
          ? output.modified
          : new Date(modified).toLocaleString(dateLocale(), {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
        const item: ArtifactItem = {
          id: outputArtifactId(task.id, output.path),
          taskId: task.id,
          title: name,
          filename: name,
          description: t("“{task}”运行时写下的文件", { task: task.title }),
          type: outputType(output.path),
          status: "已完成",
          format: extension,
          sizeKb: Math.round((output.size / 1024) * 10) / 10,
          updated: when,
          createdAt: Number.isNaN(modified) ? output.modified : new Date(modified).toISOString(),
          content: "",
          highlights: [output.path],
          version: 1,
          file: {
            runId: run.id,
            path: output.path,
            modified: output.modified,
            absolutePath: workdir ? joinPath(workdir, output.path) : undefined,
            loaded: false,
          },
        };
        seen.set(output.path, item);
        items.push(item);
      }
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 把运行时的产出并进页面的成果列表：页面自己的成果不动；产出文件以运行时
 * 为准，已经读过的内容和重点标记在文件没变时留着。
 */
export function mergeRuntimeArtifacts(local: ArtifactItem[], fromRuntime: ArtifactItem[]): ArtifactItem[] {
  const localById = new Map(local.map((item) => [item.id, item]));
  const fresh = fromRuntime.map((item) => {
    const known = localById.get(item.id);
    if (!known?.file) return item;
    const same = known.file.runId === item.file?.runId && known.file.modified === item.file?.modified;
    return same
      ? { ...item, content: known.content, file: { ...item.file!, ...known.file, absolutePath: item.file!.absolutePath ?? known.file.absolutePath }, starred: known.starred }
      : { ...item, starred: known.starred };
  });
  return [...fresh, ...local.filter((item) => !item.file)];
}

export type UsageRow = { key: string; label: string; runs: number; input: number; output: number; cached: number };

export type UsageSummary = {
  /** 统计从这一刻起（本月 1 日 0 点，本地时间）。 */
  since: string;
  runs: number;
  input: number;
  output: number;
  cached: number;
  byAgent: UsageRow[];
  byTask: UsageRow[];
};

const agentNames: Record<string, string> = {
  "claude-code": "Claude Code",
  "codex-cli": "Codex CLI",
  opencode: "OpenCode",
  agy: "Antigravity CLI (agy)",
};

/**
 * 本月各次运行报的 token 用量：合计、按智能体、按任务（多的在前）。
 * 运行时每个任务只回最近 20 次运行，跑得很勤的任务会少算更早的。
 */
export function usageSummary(remote: RuntimeTask[], now: Date = new Date()): UsageSummary {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const empty = (key: string, label: string): UsageRow => ({ key, label, runs: 0, input: 0, output: 0, cached: 0 });
  const agents = new Map<string, UsageRow>();
  const tasks = new Map<string, UsageRow>();
  const total = empty("total", "");
  for (const task of remote) {
    for (const run of task.runs) {
      const at = Date.parse(run.started_at);
      if (Number.isNaN(at) || at < start.getTime()) continue;
      const input = run.usage?.input_tokens ?? 0;
      const output = run.usage?.output_tokens ?? 0;
      const cached = run.usage?.cached_input_tokens ?? 0;
      const agentKey = run.agent ?? "unknown";
      const rows = [
        total,
        agents.get(agentKey) ?? agents.set(agentKey, empty(agentKey, agentNames[agentKey] ?? agentKey)).get(agentKey)!,
        tasks.get(task.id) ?? tasks.set(task.id, empty(task.id, task.title)).get(task.id)!,
      ];
      for (const row of rows) {
        row.runs += 1;
        row.input += input;
        row.output += output;
        row.cached += cached;
      }
    }
  }
  const byTokens = (a: UsageRow, b: UsageRow) => b.input + b.output - (a.input + a.output) || b.runs - a.runs;
  return {
    since: start.toISOString(),
    runs: total.runs,
    input: total.input,
    output: total.output,
    cached: total.cached,
    byAgent: [...agents.values()].sort(byTokens),
    byTask: [...tasks.values()].sort(byTokens).slice(0, 8),
  };
}
