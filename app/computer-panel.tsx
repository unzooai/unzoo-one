"use client";

import { ExternalLink, Globe2, LoaderCircle, Monitor, SquareTerminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { t } from "./i18n";
import type { TabView, TerminalScreen } from "./lib/provider";
import { continueReplay, startReplay, type ReplayState, type ReplayStep } from "./lib/terminal-replay";

export type ComputerPanelProps = {
  terminals: string[];
  tabs: string[];
  /** 这段对话有一轮还在跑：画面持续刷新。 */
  live: boolean;
  /** Its output: the recent history, or with `fromLine` what came since. */
  loadScreen: (sessionId: string, fromLine?: number) => Promise<TerminalScreen>;
  /** Keys the person typed into it. */
  sendKeys: (sessionId: string, input: string) => Promise<void>;
  loadTab: (tabId: string) => Promise<TabView>;
  /** 在 Unzoo One 终端里打开这个会话，人来接手。 */
  onOpenTerminal: (sessionId: string) => Promise<void>;
  /** 把标签页切到 Unzoo 浏览器前台。 */
  onShowTab: (tabId: string) => Promise<void>;
  onClose: () => void;
};

type Selection = { kind: "terminal" | "tab"; id: string };

/**
 * 智能体的电脑：它在用的终端和浏览器，就在对话旁边。
 *
 * 终端由终端模拟器照它的输出原样画出来，人可以直接往里输入（答它的提问、
 * 输密码、Ctrl+C）；浏览器是截图。要大动干戈就点“在终端里打开”或“在浏览器里
 * 打开”，到完整的窗口里接手。
 */
export function ComputerPanel(props: ComputerPanelProps) {
  const { terminals, tabs, live, onClose } = props;
  const latest: Selection | null = tabs.length
    ? { kind: "tab", id: tabs[tabs.length - 1] }
    : terminals.length
      ? { kind: "terminal", id: terminals[terminals.length - 1] }
      : null;
  const [selected, setSelected] = useState<Selection | null>(latest);

  // 选中的不在了（换了对话），或者还没选，就跟着最新用到的那个。
  const current =
    selected &&
    ((selected.kind === "terminal" && terminals.includes(selected.id)) || (selected.kind === "tab" && tabs.includes(selected.id)))
      ? selected
      : latest;

  return (
    <aside className="computer-panel" aria-label={t("智能体的电脑")}>
      <header>
        <strong>
          <Monitor size={15} aria-hidden="true" /> {t("智能体的电脑")}
        </strong>
        {live && <em>{t("实时")}</em>}
        <button type="button" onClick={onClose} aria-label={t("收起")} title={t("收起")}>
          <X size={15} aria-hidden="true" />
        </button>
      </header>

      {!current ? (
        <p className="computer-empty">{t("这个任务里智能体还没有用过终端或浏览器。它一用，就会出现在这里。")}</p>
      ) : (
        <>
          <nav className="computer-tabs" aria-label={t("它用过的终端和网页")}>
            {terminals.map((id, index) => (
              <button
                key={`t-${id}`}
                type="button"
                className={current.kind === "terminal" && current.id === id ? "active" : ""}
                onClick={() => setSelected({ kind: "terminal", id })}
              >
                <SquareTerminal size={14} aria-hidden="true" />
                {terminals.length > 1 ? t("终端 {n}", { n: index + 1 }) : t("终端")}
              </button>
            ))}
            {tabs.map((id, index) => (
              <button
                key={`b-${id}`}
                type="button"
                className={current.kind === "tab" && current.id === id ? "active" : ""}
                onClick={() => setSelected({ kind: "tab", id })}
              >
                <Globe2 size={14} aria-hidden="true" />
                {tabs.length > 1 ? t("网页 {n}", { n: index + 1 }) : t("网页")}
              </button>
            ))}
          </nav>
          {current.kind === "terminal" ? (
            <TerminalView key={current.id} id={current.id} {...props} />
          ) : (
            <BrowserView key={current.id} id={current.id} {...props} />
          )}
        </>
      )}
    </aside>
  );
}

/** 每隔一会儿读一次，还在跑时才持续读。 */
function usePolled<T>(load: () => Promise<T>, everyMs: number, live: boolean) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const read = () =>
      load().then(
        (next) => {
          if (!alive) return;
          setValue(next);
          setError(null);
        },
        (failure: unknown) => {
          if (alive) setError(failure instanceof Error ? failure.message : String(failure));
        },
      );
    void read();
    const timer = live ? window.setInterval(() => void read(), everyMs) : undefined;
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
    // load 每次渲染都是新的；换了对象（id）由 key 重建组件。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyMs, live]);
  return { value, error };
}

/** What xterm says back to the program by itself (cursor reports, device
 * attributes): answers to questions in the output being replayed, which the
 * program already had answered when it first ran. */
const TERMINAL_REPORT = /^\x1b\[(\??[\d;]*[Rcn]|>[\d;]*c)$/;
/** Focus in / out: clicking the panel is not focusing the agent's terminal. */
const FOCUS_REPORT = /^\x1b\[[IO]$/;

/**
 * The agent's terminal, drawn by a terminal emulator from what it printed:
 * colours, cursor and history as in the terminal itself. The person can type
 * into it -- answer a prompt, enter a password, Ctrl+C -- and their keys go
 * to that terminal, recorded as theirs.
 */
function TerminalView({ id, live, loadScreen, sendKeys, onOpenTerminal }: ComputerPanelProps & { id: string }) {
  const host = useRef<HTMLDivElement>(null);
  const liveRef = useRef(live);
  liveRef.current = live;
  const [status, setStatus] = useState<"loading" | "ready" | "closed" | "failed">("loading");
  const [readError, setReadError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let term: import("@xterm/xterm").Terminal | null = null;
    let state: ReplayState | null = null;
    let replaying = false;
    let closed = false;
    let timer: number | undefined;
    let reading = false;
    let readAgain = false;
    let typedAt = 0;
    let typed = "";
    let flushTimer: number | undefined;

    const schedule = (ms?: number) => {
      window.clearTimeout(timer);
      if (!alive || closed) return;
      const active = liveRef.current || Date.now() - typedAt < 60_000;
      timer = window.setTimeout(() => void read(), ms ?? (active ? 800 : 4000));
    };

    const write = (step: ReplayStep) =>
      new Promise<void>((resolve) => {
        if (!term) return resolve();
        if (step.kind === "reset") term.reset();
        if (!step.data) return resolve();
        replaying = true;
        term.write(step.data, () => {
          replaying = false;
          resolve();
        });
      });

    const flush = () => {
      flushTimer = undefined;
      const keys = typed;
      typed = "";
      if (!keys || closed) return;
      sendKeys(id, keys).then(
        () => {
          if (!alive) return;
          setKeysError(null);
          schedule(120);
        },
        (failure: unknown) => {
          if (alive) setKeysError(failure instanceof Error ? failure.message : String(failure));
        },
      );
    };

    const open = async (screen: TerminalScreen) => {
      const { Terminal } = await import("@xterm/xterm");
      if (!alive || !host.current) return;
      const created = new Terminal({
        cols: screen.cols || 80,
        rows: screen.rows || 24,
        scrollback: 5000,
        fontSize: 12,
        fontFamily: 'ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace',
        cursorBlink: false,
        // The runtime keeps output cut at line feeds, without the carriage returns before them.
        convertEol: true,
        theme: { background: "#15171c", foreground: "#d9dee6" },
      });
      created.open(host.current);
      created.attachCustomKeyEventHandler((event) => {
        // Ctrl+C with text selected copies it; without, it goes to the terminal.
        if (
          event.type === "keydown" &&
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "c" &&
          created.hasSelection()
        ) {
          void navigator.clipboard?.writeText(created.getSelection());
          created.clearSelection();
          return false;
        }
        return true;
      });
      created.onData((data) => {
        if (closed || FOCUS_REPORT.test(data) || (replaying && TERMINAL_REPORT.test(data))) return;
        typed += data;
        typedAt = Date.now();
        if (flushTimer === undefined) flushTimer = window.setTimeout(flush, 25);
      });
      term = created;
    };

    const read = async () => {
      if (reading) {
        readAgain = true;
        return;
      }
      reading = true;
      try {
        const screen = await loadScreen(id, state ? state.line : undefined);
        if (!alive) return;
        if (!term) await open(screen);
        if (!term) return;
        if (screen.cols && screen.rows && (term.cols !== screen.cols || term.rows !== screen.rows)) {
          term.resize(screen.cols, screen.rows);
        }
        const step = state ? continueReplay(state, screen) : startReplay(screen);
        state = step.state;
        await write(step);
        if (step.kind === "reset") term.scrollToBottom();
        setStatus("ready");
        setReadError(null);
      } catch (failure: unknown) {
        if (!alive) return;
        const message = failure instanceof Error ? failure.message : String(failure);
        if (term) {
          // Read before, gone now: keep what it showed.
          if (/closed|resolve pane/i.test(message)) {
            closed = true;
            term.options.disableStdin = true;
            setStatus("closed");
          } else {
            setReadError(message);
          }
        } else {
          setStatus("failed");
          setReadError(message);
        }
      } finally {
        reading = false;
      }
      if (readAgain) {
        readAgain = false;
        schedule(0);
      } else {
        schedule();
      }
    };

    void read();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearTimeout(flushTimer);
      term?.dispose();
    };
    // One terminal per mount: switching terminals remounts it (key = id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="computer-view">
      {status === "failed" ? (
        <p className="computer-error">{t("读不到这个终端：{message}", { message: readError ?? "" })}</p>
      ) : status === "loading" ? (
        <p className="computer-loading">
          <LoaderCircle size={15} className="spin" aria-hidden="true" /> {t("正在读取")}
        </p>
      ) : null}
      {status === "closed" && <p className="computer-note">{t("这个终端已经关了，下面是它最后的样子。")}</p>}
      <div ref={host} className="computer-terminal-host" aria-label={t("终端画面")} hidden={status === "failed"} />
      {readError && status === "ready" && (
        <p className="computer-error">{t("读不到这个终端：{message}", { message: readError })}</p>
      )}
      {keysError && <p className="computer-error">{t("没能把按键送进终端：{message}", { message: keysError })}</p>}
      <footer>
        <button
          type="button"
          disabled={busy || status === "closed"}
          onClick={() => {
            setBusy(true);
            setActionError(null);
            onOpenTerminal(id)
              .catch((failure: unknown) => setActionError(failure instanceof Error ? failure.message : String(failure)))
              .finally(() => setBusy(false));
          }}
        >
          <ExternalLink size={14} aria-hidden="true" />
          {t("在终端里打开")}
        </button>
        {status !== "closed" && <small>{t("点一下终端就能直接输入：回答它的提问、输密码，或按 Ctrl+C 让它停下。")}</small>}
      </footer>
      {actionError && <p className="computer-error">{actionError}</p>}
    </div>
  );
}

function BrowserView({ id, live, loadTab, onShowTab }: ComputerPanelProps & { id: string }) {
  const { value, error } = usePolled(() => loadTab(id), 3000, live);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  return (
    <div className="computer-view">
      {value && (
        <div className="computer-address" title={value.url}>
          <Globe2 size={13} aria-hidden="true" />
          <span>{value.title || value.url || t("（没有标题）")}</span>
          {value.url && value.title && <small>{value.url}</small>}
        </div>
      )}
      {error && !value ? (
        <p className="computer-error">{t("读不到这个网页：{message}", { message: error })}</p>
      ) : !value ? (
        <p className="computer-loading">
          <LoaderCircle size={15} className="spin" aria-hidden="true" /> {t("正在读取")}
        </p>
      ) : value.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="computer-shot" src={value.image} alt={t("智能体看到的网页")} />
      ) : (
        <p className="computer-empty">{t("这个网页没有截到图。")}</p>
      )}
      <footer>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setActionError(null);
            onShowTab(id)
              .catch((failure: unknown) => setActionError(failure instanceof Error ? failure.message : String(failure)))
              .finally(() => setBusy(false));
          }}
        >
          <ExternalLink size={14} aria-hidden="true" />
          {t("在浏览器里打开")}
        </button>
        <small>{t("要登录、过验证码或自己点几下，就在浏览器里接手。")}</small>
      </footer>
      {actionError && <p className="computer-error">{actionError}</p>}
    </div>
  );
}
