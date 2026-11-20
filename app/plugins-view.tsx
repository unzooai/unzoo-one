"use client";

import { FolderPlus, Puzzle, RefreshCw, RotateCcw, ScrollText, Settings2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "./i18n";
import type { RuntimePlugin, RuntimePluginRole, RuntimePlugins, RuntimeTaskPort } from "./lib/provider";

type Port = Pick<
  RuntimeTaskPort,
  "plugins" | "addPlugin" | "enablePlugin" | "restartPlugin" | "removePlugin" | "bindPluginRole" | "pluginLog"
>;

const AGENTS: { id: string; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex-cli", label: "Codex" },
  { id: "agy", label: "Antigravity CLI" },
  { id: "opencode", label: "OpenCode" },
];
const EFFORTS = ["", "low", "medium", "high", "xhigh", "max"];

function statusLabel(plugin: RuntimePlugin): string {
  if (!plugin.enabled) return t("已关闭");
  switch (plugin.status) {
    case "running":
      return t("运行中");
    case "starting":
      return t("正在启动");
    case "not_answering":
      return t("启动了但没有响应");
    case "failed":
      return t("没有运行起来");
    case "tools_only":
      return t("只提供工具");
    case "broken":
      return t("清单有问题");
    default:
      return t("已停止");
  }
}

function doesLabel(word: string): string {
  switch (word) {
    case "read":
      return t("只读");
    case "change":
      return t("改本机的东西");
    case "run":
      return t("运行程序");
    case "pay":
      return t("花钱");
    case "delete":
      return t("删除");
    default:
      return t("发到外部");
  }
}

function errorText(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure);
}

/**
 * 插件：在 Unzoo One 旁边运行的程序，有自己的控制页面、状态和给智能体的工具。
 *
 * 技能只是给智能体看的做法；需要控制页面、常驻状态或自己代码的，是插件。插件的每个角色可以
 * 单独指定浏览器身份（哪个账号）和智能体、模型（谁来写）。
 */
export function PluginsView({ runtime, notify }: { runtime: Port; notify: (message: string) => void }) {
  const [data, setData] = useState<RuntimePlugins | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"page" | "settings" | "log">("page");
  const [dir, setDir] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await runtime.plugins());
      setError(null);
    } catch (failure) {
      setError(errorText(failure));
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  const plugin = useMemo(() => {
    const list = data?.plugins ?? [];
    return list.find((p) => p.id === selected) ?? list[0] ?? null;
  }, [data, selected]);

  // While one is starting, look again shortly.
  const settling = data?.plugins.some((p) => p.enabled && p.status === "starting") ?? false;
  useEffect(() => {
    if (!settling) return;
    const timer = window.setTimeout(() => void load(), 1500);
    return () => window.clearTimeout(timer);
  }, [settling, data, load]);

  const loadLog = useCallback(async () => {
    if (!plugin) return;
    try {
      setLog(await runtime.pluginLog(plugin.id));
    } catch (failure) {
      setLog(errorText(failure));
    }
  }, [plugin, runtime]);

  useEffect(() => {
    if (tab === "log") void loadLog();
  }, [tab, loadLog]);

  async function act(what: () => Promise<unknown>, done?: string) {
    setBusy(true);
    try {
      await what();
      if (done) notify(done);
      await load();
    } catch (failure) {
      notify(t("没有做成：{error}", { error: errorText(failure) }));
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const folder = dir.trim();
    if (!folder) return;
    await act(async () => {
      const id = await runtime.addPlugin(folder);
      setSelected(id);
      setTab("settings");
      setDir("");
    }, t("加好了。看一下它要什么，再打开它。"));
  }

  const effectiveTab = plugin && tab === "page" && !plugin.hasPage ? "settings" : tab;

  return (
    <section className="plugins-view" aria-label={t("插件")}>
      <aside className="plugins-list">
        <div className="skills-heading">
          <span>{t("插件")}</span>
          <button type="button" onClick={() => void load()} aria-label={t("重新检查")} title={t("重新检查")} disabled={busy}>
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
        {error ? <p className="plugins-error">{error}</p> : null}
        {(data?.plugins ?? []).map((item) => (
          <button
            type="button"
            key={item.id}
            className={`plugins-item${plugin?.id === item.id ? " is-active" : ""}`}
            onClick={() => {
              setSelected(item.id);
              setTab(item.hasPage ? "page" : "settings");
            }}
          >
            <Puzzle size={15} aria-hidden="true" />
            <span className="plugins-item-name">{item.name}</span>
            <span className={`plugins-dot is-${item.enabled ? item.status : "off"}`} title={statusLabel(item)} />
          </button>
        ))}
        {data && data.plugins.length === 0 ? (
          <p className="plugins-empty">
            {t("还没有插件。插件是一个带 unzoo-plugin.json 的文件夹：有自己的控制页面、状态，以及给智能体用的工具。")}
          </p>
        ) : null}
        <form
          className="plugins-add"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <input
            value={dir}
            onChange={(event) => setDir(event.target.value)}
            placeholder={t("插件文件夹的路径")}
            aria-label={t("插件文件夹的路径")}
          />
          <button type="submit" disabled={busy || !dir.trim()}>
            <FolderPlus size={14} aria-hidden="true" />
            {t("添加")}
          </button>
        </form>
      </aside>

      <div className="plugins-main">
        {!plugin ? null : (
          <>
            <header className="plugins-header">
              <div>
                <h2>
                  {plugin.name} {plugin.version ? <small>{plugin.version}</small> : null}
                </h2>
                <p>{plugin.description}</p>
              </div>
              <div className="plugins-actions">
                <span className={`plugins-state is-${plugin.enabled ? plugin.status : "off"}`}>{statusLabel(plugin)}</span>
                <label className="plugins-switch">
                  <input
                    type="checkbox"
                    checked={plugin.enabled}
                    disabled={busy || plugin.status === "broken"}
                    onChange={(event) =>
                      void act(
                        () => runtime.enablePlugin(plugin.id, event.target.checked),
                        event.target.checked ? t("{name} 已打开", { name: plugin.name }) : t("{name} 已关闭", { name: plugin.name }),
                      )
                    }
                  />
                  {t("打开")}
                </label>
                <button
                  type="button"
                  title={t("重启")}
                  aria-label={t("重启")}
                  disabled={busy || !plugin.enabled || plugin.status === "tools_only"}
                  onClick={() => void act(() => runtime.restartPlugin(plugin.id), t("{name} 已重启", { name: plugin.name }))}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                </button>
              </div>
            </header>
            {plugin.error ? <p className="plugins-error">{plugin.error}</p> : null}

            <nav className="plugins-tabs" aria-label={t("插件")}>
              {plugin.hasPage ? (
                <button type="button" className={effectiveTab === "page" ? "is-active" : ""} onClick={() => setTab("page")}>
                  <Puzzle size={14} aria-hidden="true" />
                  {t("控制页面")}
                </button>
              ) : null}
              <button type="button" className={effectiveTab === "settings" ? "is-active" : ""} onClick={() => setTab("settings")}>
                <Settings2 size={14} aria-hidden="true" />
                {t("账号与模型")}
              </button>
              <button type="button" className={effectiveTab === "log" ? "is-active" : ""} onClick={() => setTab("log")}>
                <ScrollText size={14} aria-hidden="true" />
                {t("日志")}
              </button>
            </nav>

            {effectiveTab === "page" ? (
              plugin.pageUrl ? (
                <iframe className="plugins-frame" src={plugin.pageUrl} title={plugin.name} />
              ) : (
                <p className="plugins-empty">
                  {plugin.enabled ? t("它还没准备好，页面稍后出现。") : t("打开它之后，控制页面在这里。")}
                </p>
              )
            ) : null}

            {effectiveTab === "settings" ? (
              <PluginSettings plugin={plugin} profiles={data?.browserProfiles ?? []} busy={busy} act={act} runtime={runtime} />
            ) : null}

            {effectiveTab === "log" ? (
              <div className="plugins-log">
                <button type="button" onClick={() => void loadLog()}>
                  <RefreshCw size={14} aria-hidden="true" />
                  {t("刷新")}
                </button>
                <pre>{log || t("还没有输出")}</pre>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function PluginSettings({
  plugin,
  profiles,
  busy,
  act,
  runtime,
}: {
  plugin: RuntimePlugin;
  profiles: { id: string; name: string }[];
  busy: boolean;
  act: (what: () => Promise<unknown>, done?: string) => Promise<void>;
  runtime: Port;
}) {
  return (
    <div className="plugins-settings">
      {plugin.roles.length > 0 ? (
        <section>
          <h3>{t("账号与模型")}</h3>
          <p className="skills-intro">
            {t("每个角色单独指定：浏览器角色用哪个浏览器身份（登录的是哪个账号），智能体角色用哪个智能体和模型。改了之后插件会重启来读取。")}
          </p>
          {plugin.roles.map((role) => (
            <RoleRow key={role.name} plugin={plugin} role={role} profiles={profiles} busy={busy} act={act} runtime={runtime} />
          ))}
        </section>
      ) : null}

      {plugin.tools.length > 0 || plugin.mcpServer ? (
        <section>
          <h3>{t("给智能体的工具")}</h3>
          <p className="skills-intro">
            {t("打开后，对话里的智能体可以直接用这些工具。按它声明的用途判断：只读的直接做，发到外部、删除的照常问你；没声明的都当作发到外部。")}
          </p>
          <ul className="plugins-tools">
            {plugin.tools.map((tool) => (
              <li key={tool.name}>
                <code>{tool.name}</code>
                <span>{doesLabel(tool.does)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plugin.domains.length > 0 ? (
        <section>
          <h3>{t("会访问的网站")}</h3>
          <p>{plugin.domains.join("、")}</p>
        </section>
      ) : null}

      <section>
        <h3>{t("位置")}</h3>
        <p>
          <code>{plugin.dir}</code>
        </p>
        <button
          type="button"
          className="plugins-remove"
          disabled={busy}
          onClick={() => {
            if (window.confirm(t("从 Unzoo One 移除 {name}？它的文件夹和数据都不会删除。", { name: plugin.name }))) {
              void act(() => runtime.removePlugin(plugin.id), t("{name} 已移除", { name: plugin.name }));
            }
          }}
        >
          <Trash2 size={14} aria-hidden="true" />
          {t("移除")}
        </button>
      </section>
    </div>
  );
}

function RoleRow({
  plugin,
  role,
  profiles,
  busy,
  act,
  runtime,
}: {
  plugin: RuntimePlugin;
  role: RuntimePluginRole;
  profiles: { id: string; name: string }[];
  busy: boolean;
  act: (what: () => Promise<unknown>, done?: string) => Promise<void>;
  runtime: Port;
}) {
  const current = role.binding ?? role.default ?? {};
  const [agent, setAgent] = useState(current.agent ?? "");
  const [model, setModel] = useState(current.model ?? "");
  const [effort, setEffort] = useState(current.effort ?? "");
  const saved = t("{role} 已保存", { role: role.label });

  if (role.kind === "browser") {
    const value = role.binding?.profile ?? "";
    return (
      <label className="plugins-role">
        <span>{role.label}</span>
        <select
          value={value}
          disabled={busy}
          onChange={(event) =>
            void act(
              () => runtime.bindPluginRole(plugin.id, role.name, event.target.value ? { profile: event.target.value } : null),
              saved,
            )
          }
        >
          <option value="">{t("还没指定")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          {value && !profiles.some((p) => p.id === value) ? <option value={value}>{value}</option> : null}
        </select>
      </label>
    );
  }

  return (
    <form
      className="plugins-role"
      onSubmit={(event) => {
        event.preventDefault();
        const value: Record<string, string> = { agent };
        if (model.trim()) value.model = model.trim();
        if (effort) value.effort = effort;
        void act(() => runtime.bindPluginRole(plugin.id, role.name, agent ? value : null), saved);
      }}
    >
      <span>{role.label}</span>
      <select value={agent} onChange={(event) => setAgent(event.target.value)} aria-label={t("智能体")}>
        <option value="">{t("还没指定")}</option>
        {AGENTS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <input value={model} onChange={(event) => setModel(event.target.value)} placeholder={t("模型（留空用默认）")} aria-label={t("模型")} />
      <select value={effort} onChange={(event) => setEffort(event.target.value)} aria-label={t("推理强度")}>
        {EFFORTS.map((e) => (
          <option key={e} value={e}>
            {e || t("默认强度")}
          </option>
        ))}
      </select>
      <button type="submit" disabled={busy}>
        {t("保存")}
      </button>
    </form>
  );
}
