"use client";

import { BookOpen, Check, Globe2, Plug, RefreshCw, SquareTerminal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";
import type { RuntimeClients, RuntimeTaskPort } from "./lib/provider";

/**
 * 设置 › 能力 › 接入其它 AI 客户端。
 *
 * 喜欢在 Claude 桌面版、Cursor、Codex 里干活的人，也能用上 Unzoo One 的终端
 * 和浏览器：终端由这里写进客户端的 MCP 配置；浏览器由 Unzoo 自己的接入程序
 * 管。外部客户端往终端里写东西之前，问题进 Unzoo One 的收件箱。
 */
export function ClientsPanel({
  runtime,
  notify,
}: {
  runtime: Pick<RuntimeTaskPort, "clients" | "connectClient" | "setupBrowserForClients">;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<RuntimeClients | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await runtime.clients());
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(id: string, name: string, connect: boolean, skills: boolean) {
    setBusy(id);
    try {
      await runtime.connectClient(id, connect);
      notify(
        connect
          ? skills
            ? t("已把 Unzoo One 的终端和技能接入 {name}。重启 {name} 后生效。", { name })
            : t("已把 Unzoo One 的终端接入 {name}。重启 {name} 后生效。", { name })
          : skills
            ? t("已从 {name} 移除 Unzoo One 的终端和技能", { name })
            : t("已从 {name} 移除 Unzoo One 的终端", { name }),
      );
      await load();
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(null);
    }
  }

  async function setupBrowser() {
    setBusy("browser");
    try {
      await runtime.setupBrowserForClients();
      notify(t("Unzoo 浏览器已接入这些客户端。重启客户端后生效。"));
      await load();
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(null);
    }
  }

  const installed = data?.clients.filter((client) => client.detected) ?? [];
  const missingBrowser = data?.browserInstalled && installed.some((client) => !client.browser);

  return (
    <section className="settings-group clients-group" id="settings-clients" aria-label={t("接入其它 AI 客户端")}>
      <div className="skills-heading">
        <span>{t("接入其它 AI 客户端")}</span>
        <h2>{t("在 Claude 桌面版、Cursor、Codex 里也能用这台电脑")}</h2>
        <button type="button" onClick={() => void load()} aria-label={t("重新检查")} title={t("重新检查")} disabled={busy !== null}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="skills-intro">
        {t("接入后，你在那些客户端里用的智能体也能操作 Unzoo One 的终端和浏览器，并拿到一段终端用法说明；Claude Code、Codex、OpenCode 还会装上你在“技能”里启用的技能，断开时一并移除。它在终端里做的事按“智能体 › 自主程度”判断：普通命令直接执行，删除、推送这类会先进这里的收件箱等你确认；Unzoo One 没打开、手机上也没开着时，要确认的操作会被拒绝。")}
      </p>

      {error ? (
        <p className="skills-empty">{t("读不到客户端：{error}", { error })}</p>
      ) : !data ? (
        <p className="skills-empty">{t("正在读取…")}</p>
      ) : installed.length === 0 ? (
        <p className="skills-empty">{t("这台电脑上没有找到能接入的 AI 客户端。")}</p>
      ) : (
        <ul className="clients-list">
          {installed.map((client) => (
            <li key={client.id}>
              <Plug size={15} aria-hidden="true" />
              <span>
                <strong>{client.name}</strong>
                {client.error ? (
                  <small className="is-error">{t("配置文件有问题，没有改动：{error}", { error: client.error })}</small>
                ) : (
                  <small title={client.config}>
                    <em className={client.terminal ? "is-on" : ""}>
                      <SquareTerminal size={12} aria-hidden="true" /> {client.terminal ? t("终端已接入") : t("终端未接入")}
                    </em>
                    <em className={client.browser ? "is-on" : ""}>
                      <Globe2 size={12} aria-hidden="true" /> {client.browser ? t("浏览器已接入") : t("浏览器未接入")}
                    </em>
                    {client.skills && client.terminal && (
                      <em className="is-on">
                        <BookOpen size={12} aria-hidden="true" /> {t("技能已装入")}
                      </em>
                    )}
                  </small>
                )}
              </span>
              {!client.error && (
                <button
                  type="button"
                  className={client.terminal ? "" : "primary"}
                  disabled={busy !== null || !data.terminalReady}
                  onClick={() => void toggle(client.id, client.name, !client.terminal, client.skills === true)}
                >
                  {client.terminal ? t("断开终端") : (
                    <>
                      <Check size={14} aria-hidden="true" /> {t("接入终端")}
                    </>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && !data.terminalReady && (
        <p className="skills-empty">{t("缺少 Unzoo One 的终端组件，重新安装 Unzoo One 可以修复。")}</p>
      )}
      {missingBrowser && (
        <div className="clients-browser">
          <span>{t("浏览器由 Unzoo 自己的接入程序配置：它会接入所有它认识的客户端，并把这些客户端里其它浏览器自动化工具的配置备份后移除。")}</span>
          <button type="button" disabled={busy !== null} onClick={() => void setupBrowser()}>
            {busy === "browser" ? t("正在接入…") : t("接入 Unzoo 浏览器")}
          </button>
        </div>
      )}
    </section>
  );
}
