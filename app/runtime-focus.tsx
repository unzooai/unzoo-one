"use client";

import { ChevronRight, Pause, Play, Plus, Sparkles } from "lucide-react";
import type { TaskItem } from "./types";
import { dateLocale, t } from "./i18n";

/**
 * 首页的"正在做的事"，装好的产品里用：本机运行时里真正在跑的任务；
 * 没有在跑的就是最近动过的那个；一个任务都没有，就请人建第一个。
 *
 * 演示版的首页卡片是一段写好的剧本（固定的步骤和工具），这里只显示运行时
 * 真的报回来的东西。
 */
export function RuntimeFocusCard({
  tasks,
  schedule,
  onOpen,
  onToggle,
  onCreate,
}: {
  tasks: TaskItem[];
  schedule: (task: TaskItem) => string;
  onOpen: (taskId: string) => void;
  onToggle: (task: TaskItem) => void;
  onCreate: () => void;
}) {
  const focus = pickFocusTask(tasks);

  if (!focus) {
    return (
      <section className="active-task-panel runtime-focus is-empty" aria-label={t("正在运行的任务")}>
        <div className="runtime-focus-empty">
          <Sparkles size={22} aria-hidden="true" />
          <strong>{t("还没有任务")}</strong>
          <p>{t("说清楚要做什么，交给智能体去做。它每一次用工具前都会先来这里问你。")}</p>
          <button className="primary" type="button" onClick={onCreate}>
            <Plus size={15} />
            {t("新建第一个任务")}
          </button>
        </div>
      </section>
    );
  }

  const latest = focus.runs?.[0];
  const running = focus.status === "运行中";
  const waiting = running && latest?.waiting === true;
  return (
    <section className="active-task-panel runtime-focus" aria-label={t("正在运行的任务")}>
      <header>
        <span>
          {schedule(focus)} · {running ? (waiting ? t("等你确认") : t("正在运行")) : t(focus.status)}
        </span>
        <strong>{focus.title}</strong>
        {focus.description && <p>{focus.description}</p>}
      </header>
      {latest && (
        <div className={`runtime-focus-run is-${running ? "running" : latest.status === "成功" ? "done" : "other"}`}>
          <small>
            {t("最近一次")} · {new Date(latest.startedAt).toLocaleString(dateLocale(), { hour12: false })}
            {latest.durationSeconds !== undefined ? ` · ${t("{seconds} 秒", { seconds: latest.durationSeconds })}` : ""}
          </small>
          <p>{latest.summary || t("智能体正在处理")}</p>
        </div>
      )}
      <footer>
        <button type="button" onClick={() => onToggle(focus)}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? t("停下") : t("再运行一次")}
        </button>
        <button type="button" onClick={() => onOpen(focus.id)}>
          {t("查看任务")}
          <ChevronRight size={14} />
        </button>
      </footer>
    </section>
  );
}

/** 在跑的优先，其次最近一次运行最晚的，再次列表里第一个。 */
export function pickFocusTask(tasks: TaskItem[]): TaskItem | null {
  const running = tasks.find((task) => task.status === "运行中");
  if (running) return running;
  let best: TaskItem | null = null;
  let bestAt = -Infinity;
  for (const task of tasks) {
    const at = Date.parse(task.runs?.[0]?.startedAt ?? "");
    if (!Number.isNaN(at) && at > bestAt) {
      best = task;
      bestAt = at;
    }
  }
  return best ?? tasks[0] ?? null;
}
