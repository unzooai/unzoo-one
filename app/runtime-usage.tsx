"use client";

import { Gauge } from "lucide-react";
import { dateLocale, t } from "./i18n";
import type { UsageRow, UsageSummary } from "./lib/runtime-tasks";

/**
 * 设置 › 用量（装好的产品）：本月智能体实际报的 token 用量。
 *
 * 演示版的“额度、预算、点数”是估出来的，单机版没有计费，也不该假装有；
 * 这里只列真的数字：每次运行结束时智能体自己报的输入、输出 token。
 * 花多少钱由各家的账户决定，这里不折算。
 */
export function RuntimeUsagePanel({ summary }: { summary: UsageSummary | null }) {
  const number = (value: number) => value.toLocaleString(dateLocale());
  const since = summary
    ? new Date(summary.since).toLocaleDateString(dateLocale(), { month: "long", day: "numeric" })
    : "";
  return (
    <section className="settings-group runtime-usage" id="settings-usage">
      <div>
        <span>{t("用量")}</span>
        <h2>
          {!summary
            ? t("正在读取用量…")
            : summary.runs === 0
              ? t("本月还没有运行")
              : t("本月 {runs} 次运行，共 {tokens} 个 token", {
                  runs: summary.runs,
                  tokens: number(summary.input + summary.output),
                })}
        </h2>
      </div>

      {summary && summary.runs > 0 && (
        <>
          <div className="runtime-usage-totals" aria-label={t("本月合计")}>
            <span>
              <small>{t("输入")}</small>
              <strong>{number(summary.input)}</strong>
            </span>
            <span>
              <small>{t("输出")}</small>
              <strong>{number(summary.output)}</strong>
            </span>
            <span>
              {/* Claude 把读缓存单独报，Codex 算在输入里：不说"其中"。 */}
              <small>{t("缓存输入")}</small>
              <strong>{number(summary.cached)}</strong>
            </span>
          </div>
          <UsageTable title={t("按智能体")} rows={summary.byAgent} number={number} />
          <UsageTable title={t("用得最多的任务")} rows={summary.byTask} number={number} />
        </>
      )}

      <p className="runtime-usage-note">
        <Gauge size={14} aria-hidden="true" />
        {t("自 {since} 起，按智能体每次运行结束时自己报的数字统计；费用以各家账户为准。每个任务只计最近 20 次运行。", {
          since,
        })}
      </p>
    </section>
  );
}

function UsageTable({ title, rows, number }: { title: string; rows: UsageRow[]; number: (value: number) => string }) {
  if (rows.length === 0) return null;
  return (
    <div className="runtime-usage-table">
      <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{title}</th>
            <th scope="col">{t("运行")}</th>
            <th scope="col">{t("输入")}</th>
            <th scope="col">{t("输出")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{number(row.runs)}</td>
              <td>{number(row.input)}</td>
              <td>{number(row.output)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
