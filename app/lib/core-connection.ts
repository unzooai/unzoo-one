/**
 * 控制台连到哪个后台服务（Core），拿什么令牌。
 *
 * 两种情况：
 * - **Unzoo One 桌面客户端**：界面打包在客户端里，和 Core 不同源。客户端
 *   外壳（Tauri）负责确保 Core 在跑，从 Core 的发现记录里读出地址和令牌，
 *   通过 `core_connection` 命令交给页面。
 * - **浏览器里打开**（Core 自己提供的页面，远程或调试用）：同源，令牌从
 *   /bootstrap.json 取。
 */

import { t } from "../i18n";

export type CoreConnection = {
  /** 接口地址前缀，如 http://127.0.0.1:19877；同源时为空串。 */
  base: string;
  token: string;
};

type TauriGlobal = {
  core?: { invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown> };
};

function tauri(): TauriGlobal | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null) as TauriGlobal | null;
}

/** 是否运行在 Unzoo One 桌面客户端里。 */
export function inDesktopApp(): boolean {
  return Boolean(tauri()?.core?.invoke);
}

let pending: Promise<CoreConnection> | null = null;

export function coreConnection(): Promise<CoreConnection> {
  if (!pending) {
    pending = resolve().catch((error: unknown) => {
      // 下次再试：Core 可能还在启动，别把一次失败记成永久失败。
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function resolve(): Promise<CoreConnection> {
  const invoke = tauri()?.core?.invoke;
  if (invoke) {
    const value = (await invoke("core_connection")) as Partial<CoreConnection> | null;
    if (!value?.base || !value.token) throw new Error(t("Unzoo One 的后台服务还没有就绪"));
    return { base: value.base.replace(/\/+$/, ""), token: value.token };
  }
  const response = await fetch("/bootstrap.json");
  if (!response.ok) throw new Error(t("bootstrap.json 返回 {status}", { status: response.status }));
  const body = (await response.json()) as { auth_token?: string };
  if (!body.auth_token) throw new Error(t("bootstrap.json 里没有 auth_token"));
  return { base: "", token: body.auth_token };
}

/** 后台服务上一个接口的完整地址。 */
export function coreUrl(connection: CoreConnection, path: string): string {
  return `${connection.base}${path}`;
}

/** Open the terminal next to Unzoo One (desktop app only). */
export async function openTerminal(): Promise<void> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error(t("终端只能在 Unzoo One 桌面版里打开"));
  await invoke("open_terminal");
}

/** Whether the background service starts at sign-in (desktop app on Windows). */
export async function autostartEnabled(): Promise<boolean> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error(t("只有 Unzoo One 桌面版能设置开机启动"));
  return Boolean(await invoke("autostart_get"));
}

export async function setAutostart(enabled: boolean): Promise<boolean> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error(t("只有 Unzoo One 桌面版能设置开机启动"));
  return Boolean(await invoke("autostart_set", { enabled }));
}

/** Show a file in the system's file manager (desktop app only). */
export async function revealPath(path: string): Promise<void> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error(t("只有 Unzoo One 桌面版能打开本机文件夹"));
  await invoke("reveal_path", { path });
}
