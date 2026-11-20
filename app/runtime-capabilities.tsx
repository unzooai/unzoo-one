"use client";

import { Bot, Globe2, RefreshCw, SquareTerminal } from "lucide-react";
import { t } from "./i18n";
import type { BrainAgent, RuntimeCapabilities } from "./lib/provider";

/**
 * 设置 › 能力（装好的产品）：智能体在这台机器上真能用的东西。
 *
 * 演示版的“连接器”（邮件、日历、可调的开关和延迟）是做出来给人看的；单机版
 * 只有三样，都是真的：Unzoo One 的终端、Unzoo 浏览器、装在本机的智能体。
 * 没有的就说没有，以及缺了会怎样。
 */
export function RuntimeCapabilitiesPanel({
  capabilities,
  agents,
  error,
  checking,
  onRefresh,
  onOpenAgents,
  onOpenTerminal,
}: {
  capabilities: RuntimeCapabilities | null;
  agents: BrainAgent[] | null;
  error: string | null;
  checking: boolean;
  onRefresh: () => void;
  onOpenAgents: () => void;
  onOpenTerminal?: () => void;
}) {
  const ready = agents?.filter((agent) => agent.installed && agent.signedIn !== false) ?? [];
  return (
    <section className="settings-group runtime-capabilities" id="settings-connectors">
      <div className="runtime-capabilities-heading">
        <span>
          <span>{t("能力")}</span>
          <h2>{t("智能体在这台电脑上能用的")}</h2>
        </span>
        <button type="button" onClick={onRefresh} disabled={checking} aria-label={t("重新检查")} title={t("重新检查")}>
          <RefreshCw size={14} className={checking ? "is-spinning" : undefined} aria-hidden="true" />
        </button>
      </div>

      {error && <p className="runtime-capabilities-error">{t("读不到能力：{error}", { error })}</p>}

      <ul className="runtime-capabilities-list">
        <li>
          <span className="runtime-capability-icon">
            <SquareTerminal size={17} aria-hidden="true" />
          </span>
          <span>
            <strong>{t("终端")}</strong>
            <small>
              {!capabilities
                ? t("正在检查…")
                : capabilities.terminal.governedReady
                  ? t("受管模式下，智能体的命令都经这里执行；有风险的先进收件箱，你点头才做。")
                  : t("找不到 unterm-cli，受管模式用不了；请重新安装 Unzoo One。")}
            </small>
          </span>
          <em className={capabilities?.terminal.governedReady ? "is-ok" : capabilities ? "is-warn" : ""}>
            {!capabilities ? "…" : capabilities.terminal.governedReady ? t("可用") : t("缺少组件")}
          </em>
          {onOpenTerminal && (
            <button type="button" onClick={onOpenTerminal}>
              {t("打开终端")}
            </button>
          )}
        </li>

        <li>
          <span className="runtime-capability-icon">
            <Globe2 size={17} aria-hidden="true" />
          </span>
          <span>
            <strong>{t("浏览器")}</strong>
            <small>
              {!capabilities
                ? t("正在检查…")
                : capabilities.browser.installed
                  ? t("受管模式下，智能体用它打开和操作网页；上传、读取账号这类操作先进收件箱。")
                  : t("没有安装。受管模式下智能体就没有浏览器可用，只能用终端。")}
            </small>
          </span>
          <em className={capabilities?.browser.installed ? "is-ok" : ""}>
            {!capabilities ? "…" : capabilities.browser.installed ? t("已安装") : t("未安装")}
          </em>
        </li>

        <li>
          <span className="runtime-capability-icon">
            <Bot size={17} aria-hidden="true" />
          </span>
          <span>
            <strong>{t("智能体")}</strong>
            <small>
              {!agents
                ? t("正在检查…")
                : agents.length === 0
                  ? t("这台电脑上没有可以托管运行的智能体。")
                  : agents
                      .map((agent) =>
                        !agent.installed
                          ? t("{name}：未安装", { name: agent.name })
                          : agent.signedIn === false
                            ? t("{name}：未登录", { name: agent.name })
                            : t("{name}：可用", { name: agent.name }),
                      )
                      .join(" · ")}
            </small>
          </span>
          <em className={ready.length > 0 ? "is-ok" : agents ? "is-warn" : ""}>
            {!agents ? "…" : t("{count} 个可用", { count: ready.length })}
          </em>
          <button type="button" onClick={onOpenAgents}>
            {t("管理")}
          </button>
        </li>
      </ul>
    </section>
  );
}
