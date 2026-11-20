"use client";

import { Bot, FolderOpen, Globe2, KeyRound, Plus, RefreshCw, ShieldCheck, SquareTerminal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  agentAutonomyLevels,
  defaultAgentRunSettings,
  readAgentRunSettings,
  writeAgentRunSettings,
  type AgentAutonomy,
  type AgentRunSettings,
} from "./lib/agent-run-settings";
import type { AgentRule, AgentRulePort, BrainAgent, BrainPort, RuntimeBrowser, RuntimeTaskPort } from "./lib/provider";
import { t } from "./i18n";

/**
 * 设置 › 智能体：任务交给 agent 时在哪个目录跑、是否受管，以及托管会话的
 * 常设规则。
 *
 * 规则只能由人在这里加（或审批时勾"记住"）—— agent 没有任何途径给自己加。
 */
export function AgentRunPanel({
  rules: rulePort,
  brain,
  runtime,
  notify,
  openTerminal,
}: {
  rules: AgentRulePort;
  brain: Pick<BrainPort, "agents">;
  /**
   * 有本机运行时就存在运行时里：定时任务在没有页面的时候也要知道交给谁、
   * 在哪个目录跑。没有（演示版）就存在这个浏览器里。
   */
  runtime?: Pick<RuntimeTaskPort, "settings" | "saveSettings" | "browser"> | null;
  notify: (message: string) => void;
  /** 桌面版：打开终端去登录。 */
  openTerminal?: () => void;
}) {
  const [settings, setSettings] = useState<AgentRunSettings>({ ...defaultAgentRunSettings });
  const [agents, setAgents] = useState<BrainAgent[] | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [cwdDraft, setCwdDraft] = useState("");
  const [rules, setRules] = useState<AgentRule[]>([]);
  const [store, setStore] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState("Bash");
  const [prefix, setPrefix] = useState("");
  const [decision, setDecision] = useState<"allow" | "deny">("deny");
  const [scoped, setScoped] = useState(true);
  const [busy, setBusy] = useState(false);
  const [browser, setBrowser] = useState<RuntimeBrowser | null>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [browserChecking, setBrowserChecking] = useState(false);

  const loadBrowser = useCallback(async () => {
    if (!runtime) return;
    setBrowserChecking(true);
    try {
      setBrowser(await runtime.browser());
      setBrowserError(null);
    } catch (error) {
      setBrowserError(error instanceof Error ? error.message : String(error));
    } finally {
      setBrowserChecking(false);
    }
  }, [runtime]);

  useEffect(() => {
    void loadBrowser();
  }, [loadBrowser]);

  // 存储只在浏览器里有，挂载后再读，免得和服务端渲染的首屏对不上。
  useEffect(() => {
    if (runtime) {
      let live = true;
      runtime
        .settings()
        .then((stored) => {
          if (!live) return;
          setSettings(stored);
          setCwdDraft(stored.cwd);
        })
        .catch((error: unknown) => {
          if (live) notify(t("读不到运行设置：{error}", { error: error instanceof Error ? error.message : String(error) }));
        });
      return () => {
        live = false;
      };
    }
    const stored = readAgentRunSettings();
    setSettings(stored);
    setCwdDraft(stored.cwd);
    return undefined;
    // notify 每次渲染都是新的，不该触发重读。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rulePort.list();
      setRules(data.rules);
      setStore(data.store);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [rulePort]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const [checking, setChecking] = useState(false);
  const loadAgents = useCallback(async (refresh = false) => {
    setChecking(true);
    try {
      const list = await brain.agents(refresh ? { refresh: true } : undefined);
      // 只列能托管的：交给不能托管的 agent，工具调用就进不了收件箱。
      setAgents(list.filter((agent) => agent.hosted));
      setAgentsError(null);
    } catch (error: unknown) {
      setAgentsError(error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  }, [brain]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const chosen = agents?.find((agent) => agent.id === settings.agent);

  function save(next: AgentRunSettings, message: string) {
    if (runtime) {
      const previous = settings;
      setSettings(next);
      runtime
        .saveSettings(next)
        .then((saved) => {
          setSettings(saved);
          setCwdDraft(saved.cwd);
          notify(message);
        })
        .catch((error: unknown) => {
          setSettings(previous);
          setCwdDraft(previous.cwd);
          notify(t("没有保存：{error}", { error: error instanceof Error ? error.message : String(error) }));
        });
      return;
    }
    setSettings(next);
    notify(writeAgentRunSettings(next) ? message : t("{message}（这个浏览器不能保存设置，刷新后会恢复默认）", { message }));
  }

  function saveCwd() {
    const cwd = cwdDraft.trim();
    if (cwd === settings.cwd) return;
    save({ ...settings, cwd }, cwd ? t("智能体的工作目录已设为 {cwd}", { cwd }) : t("已清除智能体的工作目录"));
  }

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tool.trim() || busy) return;
    if (scoped && !settings.cwd) {
      notify(t("先设好工作目录，或者取消“只在工作目录里生效”"));
      return;
    }
    setBusy(true);
    try {
      const rule = await rulePort.add({
        tool: tool.trim(),
        commandPrefix: prefix.trim() || undefined,
        decision,
        workspace: scoped ? settings.cwd : undefined,
      });
      setRules((items) => [...items, rule]);
      setPrefix("");
      notify(t("已添加规则：{rule}", { rule: describeRule(rule) }));
    } catch (error) {
      notify(t("没能添加规则：{error}", { error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(false);
    }
  }

  async function removeRule(rule: AgentRule) {
    setBusy(true);
    try {
      await rulePort.remove(rule.id);
      setRules((items) => items.filter((item) => item.id !== rule.id));
      notify(t("已删除规则：{rule}", { rule: describeRule(rule) }));
    } catch (error) {
      notify(t("没能删除规则：{error}", { error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-group agent-run-group" id="settings-agents">
      <div>
        <span>{t("智能体执行")}</span>
        <h2>{t("工作目录、受管模式与常设规则")}</h2>
      </div>

      <label className="setting-row agent-run-agent">
        <span>
          <strong>{t("交给哪个智能体")}</strong>
          <small>
            {agentsError
              ? t("读不到智能体清单：{error}", { error: agentsError })
              : chosen && !chosen.installed
                ? t("{name} 没装在这台机器上，任务会启动失败。", { name: chosen.name })
                : chosen && chosen.signedIn === false
                  ? t("{name} 还没登录，任务会在第一步失败。", { name: chosen.name })
                : chosen && !chosen.governed && settings.governed
                  ? t("{name} 不支持受管，会以托管模式运行：每次工具调用照样先进收件箱。", { name: chosen.name })
                  : t("新建、继续和重试的任务都交给它。继续对话沿用那次运行原来的智能体。")}
          </small>
        </span>
        <span className="agent-run-input agent-run-select">
          <Bot size={14} aria-hidden="true" />
          <select
            aria-label={t("交给哪个智能体")}
            value={settings.agent}
            disabled={!agents}
            onChange={(event) => {
              const next = agents?.find((agent) => agent.id === event.target.value);
              if (next) save({ ...settings, agent: next.id }, t("任务改为交给 {name}", { name: next.name }));
            }}
          >
            {!agents && <option value={settings.agent}>{t("正在读取…")}</option>}
            {agents && !chosen && (
              <option value={settings.agent}>{t("{agent}（清单里没有）", { agent: settings.agent })}</option>
            )}
            {agents?.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
                {agent.installed
                  ? `${agent.version ? ` ${agent.version}` : ""}${agent.signedIn === false ? t("（未登录）") : ""}`
                  : t("（未安装）")}
              </option>
            ))}
          </select>
        </span>
      </label>

      {settings.agent === "opencode" && (
        <p className="agent-run-local-models">
          {t("想用本地模型：在 OpenCode 自己的配置里加上 Ollama 等提供方即可。智能体每一步都要读约 1.6 万 token 的工具说明，需要上下文至少 32k 的模型和较强的显卡；普通电脑上会很慢，或者放不下。")}
        </p>
      )}

      {chosen && chosen.installed && chosen.signedIn === false && (
        <div className="setting-row agent-run-signin" role="status">
          <span>
            <strong>
              <KeyRound size={14} aria-hidden="true" /> {t("先登录 {name}", { name: chosen.name })}
            </strong>
            <small>
              {chosen.signInCommand
                ? t("在终端里运行下面的命令，按提示用浏览器登录，再回来点“重新检查”。")
                : t("按 {name} 自己的说明登录，再回来点“重新检查”。", { name: chosen.name })}
            </small>
            {chosen.signInCommand && <code>{chosen.signInCommand}</code>}
          </span>
          <span className="agent-run-signin-actions">
            {openTerminal && (
              <button type="button" onClick={openTerminal}>
                <SquareTerminal size={14} aria-hidden="true" />
                {t("打开终端")}
              </button>
            )}
            <button type="button" onClick={() => void loadAgents(true)} disabled={checking}>
              <RefreshCw size={14} aria-hidden="true" className={checking ? "is-spinning" : undefined} />
              {t("重新检查")}
            </button>
          </span>
        </div>
      )}

      <form
        className="setting-row agent-run-cwd"
        onSubmit={(event) => {
          event.preventDefault();
          saveCwd();
        }}
      >
        <span>
          <strong>{t("工作目录")}</strong>
          <small>{t("任务交给智能体后，它在这个目录里读写文件、执行命令。留空则每个任务用自己的文件夹：文档 › Unzoo One › 任务名。")}</small>
          <span className="agent-run-input">
            <FolderOpen size={14} aria-hidden="true" />
            <input
              type="text"
              value={cwdDraft}
              spellCheck={false}
              placeholder={t("例如 C:\\code\\my-project")}
              aria-label={t("智能体的工作目录")}
              onChange={(event) => setCwdDraft(event.target.value)}
              onBlur={saveCwd}
            />
          </span>
        </span>
        <button type="submit" disabled={cwdDraft.trim() === settings.cwd}>
          {t("保存")}
        </button>
      </form>

      <label className="setting-row">
        <span>
          <strong>{t("受管模式")}</strong>
          <small>
            {t("关掉 Claude Code 自带的 Bash、PowerShell 和联网工具，命令只能经 Unzoo One 的终端执行，网页只能经 Unzoo 浏览器打开。目前只有 Claude Code 支持；其它智能体用自己的工具。哪些操作要先问你，由下面的自主程度决定。")}
          </small>
        </span>
        <button
          className={`switch-control ${settings.governed ? "on" : ""}`}
          type="button"
          role="switch"
          aria-checked={settings.governed}
          aria-label={t("受管模式")}
          onClick={() =>
            save(
              { ...settings, governed: !settings.governed },
              settings.governed ? t("已改为托管模式") : t("已改为受管模式"),
            )
          }
        >
          <i />
        </button>
      </label>

      {runtime && (
        <fieldset className="setting-row agent-autonomy">
          <legend>
            <strong>{t("自主程度")}</strong>
            <small>{t("智能体不问你就能做多少，也包括你在 Claude Code、Cursor 等客户端里接入的终端。删除、读取账号或密钥、花钱，任何一档都会先问你；下面的常设规则优先。")}</small>
          </legend>
          <div className="agent-autonomy-options" role="radiogroup" aria-label={t("自主程度")}>
            {agentAutonomyLevels.map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={settings.autonomy === level}
                className={settings.autonomy === level ? "active" : ""}
                onClick={() =>
                  settings.autonomy !== level &&
                  save({ ...settings, autonomy: level }, t("自主程度已改为“{level}”", { level: autonomyName(level) }))
                }
              >
                <strong>{autonomyName(level)}</strong>
                <small>{autonomyDetail(level)}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {runtime && (
        <div className="setting-row agent-browser">
          <span>
            <strong>
              <Globe2 size={14} aria-hidden="true" /> {t("浏览器身份")}
            </strong>
            <small>{browserSummary(browser, browserError)}</small>
            {browser?.reachable && (
              <span className="agent-run-input agent-run-select">
                <select
                  aria-label={t("智能体用哪个浏览器身份")}
                  value={settings.browserProfile}
                  onChange={(event) => {
                    const browserProfile = event.target.value;
                    const name = browser.profiles.find((p) => p.id === browserProfile)?.name;
                    save(
                      { ...settings, browserProfile },
                      browserProfile
                        ? t("智能体改用浏览器身份“{name}”", { name: name ?? browserProfile })
                        : t("智能体改用 Unzoo One 的专用身份"),
                    );
                    window.setTimeout(() => void loadBrowser(), 300);
                  }}
                >
                  <option value="">
                    {browser.reserved ? t("Unzoo One 专用身份") : t("Unzoo One 专用身份（还没有建）")}
                  </option>
                  {browser.profiles
                    .filter((profile) => profile.id !== browser.reservedProfile)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  {settings.browserProfile && !browser.profiles.some((p) => p.id === settings.browserProfile) && (
                    <option value={settings.browserProfile}>{t("{name}（已不在）", { name: settings.browserProfile })}</option>
                  )}
                </select>
              </span>
            )}
            {settings.browserProfile && browser?.reachable && (
              <small className="agent-browser-note">
                {t("智能体会用这个身份里已登录的账号。它只在自己新开的标签页里操作，不碰你开着的页面。")}
              </small>
            )}
          </span>
          <span className="agent-run-signin-actions">
            {browser?.reachable && !browser.ready && (
              <a className="agent-browser-upgrade" href="https://unzoo.ai/#pricing" target="_blank" rel="noreferrer">
                {t("升级 Unzoo")}
              </a>
            )}
            <button type="button" onClick={() => void loadBrowser()} disabled={browserChecking}>
              <RefreshCw size={14} aria-hidden="true" className={browserChecking ? "is-spinning" : undefined} />
              {t("重新检查")}
            </button>
          </span>
        </div>
      )}

      <section className="agent-rules" aria-label={t("常设规则")}>
        <header>
          <span>
            <strong>{t("常设规则")}</strong>
            <small>
              {t("命中的工具调用不再进收件箱，直接放行或拒绝。只有人能定规则；放行规则不会匹配拼接命令（&、|、;、重定向）。各家的命令行工具（Bash、PowerShell、shell、run_command）算同一个，写哪个都对它们全部生效。")}
            </small>
          </span>
          <button type="button" aria-label={t("刷新规则")} title={t("刷新规则")} onClick={() => void reload()} disabled={loading}>
            <RefreshCw size={14} className={loading ? "is-spinning" : undefined} />
          </button>
        </header>

        {loadError ? (
          <p className="agent-rules-empty">{t("读取规则失败：{error}", { error: loadError })}</p>
        ) : rules.length === 0 ? (
          <p className="agent-rules-empty">{loading ? t("正在读取…") : t("还没有规则。")}</p>
        ) : (
          <ul>
            {rules.map((rule) => (
              <li key={rule.id} data-rule-id={rule.id}>
                <em className={rule.decision === "allow" ? "is-allow" : "is-deny"}>
                  {rule.decision === "allow" ? t("放行") : t("拒绝")}
                </em>
                <span>
                  <code>
                    {rule.tool}
                    {rule.commandPrefix ? ` · ${rule.commandPrefix}` : ""}
                  </code>
                  <small>
                    {rule.workspace ? t("只在 {workspace}", { workspace: rule.workspace }) : t("所有工作区")}
                    {" · "}
                    {rule.createdBy === "remember" ? t("审批时记住") : t("在设置里添加")}
                  </small>
                </span>
                <button
                  type="button"
                  aria-label={t("删除规则 {rule}", { rule: describeRule(rule) })}
                  title={t("删除规则")}
                  disabled={busy}
                  onClick={() => void removeRule(rule)}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="agent-rule-form" onSubmit={addRule}>
          <select aria-label={t("规则的决定")} value={decision} onChange={(event) => setDecision(event.target.value as "allow" | "deny")}>
            <option value="deny">{t("拒绝")}</option>
            <option value="allow">{t("放行")}</option>
          </select>
          <input
            type="text"
            aria-label={t("工具名")}
            placeholder={t("工具，如 Bash")}
            value={tool}
            spellCheck={false}
            onChange={(event) => setTool(event.target.value)}
          />
          <input
            type="text"
            aria-label={t("命令前缀")}
            placeholder={t("命令前缀（可选），如 git push")}
            value={prefix}
            spellCheck={false}
            onChange={(event) => setPrefix(event.target.value)}
          />
          <label>
            <input type="checkbox" checked={scoped} onChange={(event) => setScoped(event.target.checked)} />
            {t("只在工作目录里生效")}
          </label>
          <button type="submit" disabled={busy || !tool.trim()}>
            <Plus size={14} />
            {t("添加")}
          </button>
        </form>
        {store && (
          <small className="agent-rules-store">
            <ShieldCheck size={12} aria-hidden="true" /> {t("规则保存在 {store}", { store })}
          </small>
        )}
      </section>
    </div>
  );
}

/** 浏览器身份那一行的说明。 */
function browserSummary(browser: RuntimeBrowser | null, error: string | null): string {
  if (error) return t("读不到浏览器的情况：{error}", { error });
  if (!browser) return t("正在读取…");
  if (!browser.installed) return t("这台电脑没有装 Unzoo 浏览器，智能体打不开网页。");
  if (!browser.reachable) return t("Unzoo 浏览器没有在运行。打开它后点“重新检查”。");
  const plan =
    browser.maxProfiles !== undefined
      ? t("Unzoo {plan} 版，身份 {used}/{max}。", { plan: browser.plan ?? "", used: browser.profiles.length, max: browser.maxProfiles })
      : "";
  if (browser.chosen) {
    return browser.chosenMissing
      ? t("{plan}指定的身份已经不在了，换一个。", { plan })
      : t("{plan}智能体用你指定的身份上网。", { plan });
  }
  if (browser.reserved) return t("{plan}智能体有自己的专用身份，和你的浏览器互不干扰。", { plan });
  return t("{plan}身份已用满，建不了智能体的专用身份。选一个现有身份给它用，或者升级 Unzoo。", { plan });
}

function autonomyName(level: AgentAutonomy): string {
  return level === "cautious" ? t("谨慎") : level === "autonomous" ? t("放手") : t("平衡");
}

function autonomyDetail(level: AgentAutonomy): string {
  switch (level) {
    case "cautious":
      return t("只有看文件、看网页不问；改文件、运行命令、打开网页都先问你。");
    case "autonomous":
      return t("除了删除、账号密钥和花钱，都不问；包括推送、上传、改工作文件夹以外的文件。");
    default:
      return t("看、在工作文件夹里改文件、运行普通命令、在它自己的浏览器里操作都不问；推送、上传、发请求、改工作文件夹以外的文件会问。");
  }
}

function describeRule(rule: AgentRule): string {
  const verb = rule.decision === "allow" ? t("放行") : t("拒绝");
  return `${verb} ${rule.tool}${rule.commandPrefix ? ` ${rule.commandPrefix}` : ""}`;
}
