"use client";

import { BellRing, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";
import type { RuntimeTaskPort, RuntimeTellRules, RuntimeTellWish } from "./lib/provider";

function wishLabel(wish: RuntimeTellWish): string {
  if (wish === "now") return t("马上告诉我");
  if (wish === "later") return t("不急，留着我有空看");
  return t("不用告诉我");
}

/**
 * 设置 › 能力 › 提醒。
 *
 * 定时运行、有变化时运行的任务会自己发消息给你。你回它一句“这个早该告诉我”“这类别提醒了”，
 * 它就记下来：明确说了的直接成规则，只是这一次的反应先记一条线索，同类的第二次再成规则。
 * 晚上 22 点到早上 8 点不打扰，除非规则说要马上告诉你。都只存在这台电脑上。
 */
export function TellRulesPanel({
  runtime,
  notify,
}: {
  runtime: Pick<RuntimeTaskPort, "tellRules" | "forgetTellRule">;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<RuntimeTellRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await runtime.tellRules());
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  async function forget(kind: string) {
    setBusy(true);
    try {
      await runtime.forgetTellRule(kind);
      notify(t("忘掉了：{kind}", { kind }));
      await load();
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-group clients-group" id="settings-tell" aria-label={t("提醒")}>
      <div className="skills-heading">
        <span>{t("提醒")}</span>
        <h2>{t("什么事马上告诉你，什么事不打扰")}</h2>
        <button type="button" onClick={() => void load()} aria-label={t("重新检查")} title={t("重新检查")} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="skills-intro">
        {t("定时运行和有变化时运行的任务会自己给你发消息。你回一句“这个早该告诉我”或“这类别提醒了”，它就记下来；同类事第二次这样说就成了规则，明确说“以后”的马上成规则。晚上 22 点到早上 8 点不打扰，除非规则说要马上告诉你。这些只存在这台电脑上。")}
      </p>
      {error ? (
        <p className="skills-empty">{t("读不到提醒规则：{error}", { error })}</p>
      ) : !data ? (
        <p className="skills-empty">{t("正在读取…")}</p>
      ) : data.rules.length === 0 && data.clues.length === 0 ? (
        <p className="skills-empty">{t("还没有学到规则。")}</p>
      ) : (
        <ul className="clients-list">
          {data.rules.map((rule) => (
            <li key={`rule-${rule.kind}-${rule.hours ?? ""}`}>
              <BellRing size={15} aria-hidden="true" />
              <span>
                <strong>
                  {rule.hours ? t("{kind}（{hours}）", { kind: rule.kind, hours: rule.hours }) : rule.kind} → {wishLabel(rule.wish)}
                </strong>
                <small title={rule.said}>{t("你说过：{said}", { said: rule.said })}</small>
              </span>
              <button type="button" disabled={busy} onClick={() => void forget(rule.kind)} aria-label={t("忘掉")} title={t("忘掉")}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
          {data.clues.map((clue) => (
            <li key={`clue-${clue.kind}-${clue.wish}`}>
              <BellRing size={15} aria-hidden="true" className="is-muted" />
              <span>
                <strong>
                  {clue.kind} → {wishLabel(clue.wish)}
                </strong>
                <small title={clue.said}>{t("线索，再有一次就成规则。你说过：{said}", { said: clue.said })}</small>
              </span>
              <button type="button" disabled={busy} onClick={() => void forget(clue.kind)} aria-label={t("忘掉")} title={t("忘掉")}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
