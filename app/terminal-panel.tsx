"use client";

import { Download, RefreshCw, SquareTerminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "./i18n";
import type { RuntimeShells, RuntimeTaskPort } from "./lib/provider";

/**
 * 设置 › 能力 › 终端。
 *
 * 新开的终端（你开的、智能体开的）用哪个 shell；本机还缺哪个，能一键装的就装；
 * 终端里的程序看到的终端名。智能体自己也会拿到这份清单，按需要挑，缺了会先问你。
 */
export function TerminalPanel({
  runtime,
  notify,
}: {
  runtime: Pick<RuntimeTaskPort, "shells" | "setDefaultShell" | "installShell" | "setTermProgram">;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<RuntimeShells | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [termName, setTermName] = useState("");
  const poll = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await runtime.shells();
      setData(next);
      setTermName(next.termProgram);
      setError(null);
      return next;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
      return null;
    }
  }, [runtime]);

  useEffect(() => {
    void load();
    return () => {
      if (poll.current !== null) window.clearTimeout(poll.current);
    };
  }, [load]);

  // 装的时候每 5 秒看一次，装完就停。
  useEffect(() => {
    if (!data?.shells.some((shell) => shell.installing)) return;
    poll.current = window.setTimeout(() => void load(), 5000);
    return () => {
      if (poll.current !== null) window.clearTimeout(poll.current);
    };
  }, [data, load]);

  async function act(key: string, work: () => Promise<void>, done: string) {
    setBusy(key);
    try {
      await work();
      notify(done);
      await load();
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(null);
    }
  }

  const installed = data?.shells.filter((shell) => shell.installed) ?? [];
  const missing = data?.shells.filter((shell) => !shell.installed && (shell.installCommand || shell.installing)) ?? [];
  const current = data?.defaultShell.source === "config" ? (data.defaultShell.id ?? "") : "";
  const presets = data ? Array.from(new Set([data.termProgramDefault, ...data.termProgramPresets])).filter(Boolean) : [];

  return (
    <section className="settings-group clients-group" id="settings-terminal" aria-label={t("终端")}>
      <div className="skills-heading">
        <span>{t("终端")}</span>
        <h2>{t("新开的终端用哪个 shell")}</h2>
        <button type="button" onClick={() => void load()} aria-label={t("重新检查")} title={t("重新检查")} disabled={busy !== null}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="skills-intro">
        {t("你开的终端和智能体开的终端都用这里选的 shell。智能体也知道本机装了哪些，需要时会换一个用；缺了要装时，会先进收件箱问你。")}
      </p>

      {error ? (
        <p className="skills-empty">{t("读不到 shell：{error}", { error })}</p>
      ) : !data ? (
        <p className="skills-empty">{t("正在读取…")}</p>
      ) : (
        <>
          <div className="terminal-settings-row">
            <label htmlFor="terminal-default-shell">{t("默认 shell")}</label>
            <select
              id="terminal-default-shell"
              value={current}
              disabled={busy !== null}
              onChange={(event) => {
                const id = event.target.value;
                const name = installed.find((shell) => shell.id === id)?.name ?? id;
                void act(
                  "default",
                  () => runtime.setDefaultShell(id),
                  id ? t("新开的终端会用 {name}", { name }) : t("新开的终端会用系统默认的 shell"),
                );
              }}
            >
              <option value="">
                {t("自动（现在是 {name}）", { name: data.defaultShell.source === "platform" ? data.defaultShell.label : t("系统默认") })}
              </option>
              {installed.map((shell) => (
                <option key={shell.id} value={shell.id}>
                  {shell.version ? `${shell.name} · ${shell.version}` : shell.name}
                </option>
              ))}
            </select>
          </div>

          <ul className="clients-list">
            {installed.map((shell) => (
              <li key={shell.id}>
                <SquareTerminal size={15} aria-hidden="true" />
                <span>
                  <strong>{shell.name}</strong>
                  <small title={shell.path}>{shell.version ?? shell.path}</small>
                </span>
              </li>
            ))}
            {missing.map((shell) => (
              <li key={shell.id}>
                <Download size={15} aria-hidden="true" />
                <span>
                  <strong>{shell.name}</strong>
                  <small className={shell.installError ? "is-error" : undefined}>
                    {shell.installError
                      ? t("没装成：{error}", { error: shell.installError })
                      : shell.installByHand
                        ? t("要管理员权限，装完要重启。在管理员 PowerShell 里运行：{command}", { command: shell.installCommand ?? "" })
                        : shell.description}
                  </small>
                </span>
                {!shell.installByHand && (
                  <button
                    type="button"
                    disabled={busy !== null || shell.installing}
                    onClick={() =>
                      void act(
                        shell.id,
                        () => runtime.installShell(shell.id),
                        t("正在安装 {name}，可能会弹出系统的确认窗口", { name: shell.name }),
                      )
                    }
                  >
                    {shell.installing ? t("正在安装…") : t("安装")}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="terminal-settings-row">
            <label htmlFor="terminal-name">{t("终端名")}</label>
            <input
              id="terminal-name"
              list="terminal-name-presets"
              value={termName}
              maxLength={64}
              disabled={busy !== null}
              onChange={(event) => setTermName(event.target.value)}
            />
            <datalist id="terminal-name-presets">
              {presets.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <button
              type="button"
              disabled={busy !== null || termName.trim() === data.termProgram}
              onClick={() =>
                void act("name", () => runtime.setTermProgram(termName.trim()), t("新开的终端会用这个名字"))
              }
            >
              {t("保存")}
            </button>
          </div>
          <p className="skills-intro">
            {t("终端里的程序通过 TERM_PROGRAM 看到这个名字。个别工具只认识几种终端，用不了时可以改成 WezTerm 或 xterm。留空恢复默认（{name}）。", {
              name: data.termProgramDefault,
            })}
          </p>
        </>
      )}
    </section>
  );
}
