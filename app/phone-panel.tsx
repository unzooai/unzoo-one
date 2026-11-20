"use client";

import { QrCode, RefreshCw, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dateLocale, t } from "./i18n";
import type { RuntimePhone, RuntimeTaskPort } from "./lib/provider";

/**
 * 设置 › 能力 › 手机。
 *
 * 同一个 Wi-Fi（或都装了 Tailscale）的手机扫码配对后，在手机浏览器里看对话、
 * 回答智能体的问题和接手请求、发新任务。连接只在局域网里，不经过任何服务器；
 * 手机开着这个页面时，外部客户端要确认的操作也会等它回答，而不是直接拒绝。
 */
export function PhonePanel({
  runtime,
  notify,
}: {
  runtime: Pick<RuntimeTaskPort, "phone" | "pairPhone" | "unpairPhone" | "setPhoneEnabled">;
  notify: (message: string) => void;
}) {
  const [data, setData] = useState<RuntimePhone | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setData(await runtime.phone());
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, [runtime]);

  useEffect(() => {
    void load();
  }, [load]);

  // 配对码显示期间：每秒走一次倒计时，每 3 秒看一次手机配上了没有。
  const pairing = data?.pairing && data.pairing.expiresAt > now ? data.pairing : undefined;
  useEffect(() => {
    if (!data?.pairing) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => void load(), 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [data?.pairing, load]);

  async function act(work: () => Promise<RuntimePhone>, done?: string) {
    setBusy(true);
    try {
      setData(await work());
      setNow(Date.now());
      if (done) notify(done);
    } catch (failure) {
      notify(t("没有做成：{error}", { error: failure instanceof Error ? failure.message : String(failure) }));
    } finally {
      setBusy(false);
    }
  }

  const kindLabel = (kind: string) => (kind === "tailscale" ? t("Tailscale") : t("Wi-Fi / 局域网"));
  const seconds = pairing ? Math.max(0, Math.round((pairing.expiresAt - now) / 1000)) : 0;

  return (
    <section className="settings-group clients-group phone-group" id="settings-phone" aria-label={t("手机")}>
      <div className="skills-heading">
        <span>{t("手机")}</span>
        <h2>{t("在手机上看对话、批准、发任务")}</h2>
        <button type="button" onClick={() => void load()} aria-label={t("重新检查")} title={t("重新检查")} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="skills-intro">
        {t("手机和这台电脑连着同一个 Wi-Fi，或都装了 Tailscale 时，扫码就能配对。手机上能看对话进展、回答智能体的问题和接手请求，也能发新任务。连接只在你的网络里，不经过任何服务器。手机上开着这个页面时，外部客户端要确认的操作也会等你在手机上回答。")}
      </p>

      {error ? (
        <p className="skills-empty">{t("读不到手机连接的状态：{error}", { error })}</p>
      ) : !data ? (
        <p className="skills-empty">{t("正在读取…")}</p>
      ) : (
        <>
          {pairing ? (
            <div className="phone-pairing">
              {pairing.addresses.length === 0 ? (
                <p className="skills-empty">{t("这台电脑现在没有连在局域网里，手机连不上它。")}</p>
              ) : (
                <ul className="phone-codes">
                  {pairing.addresses.map((address) => (
                    <li key={address.ip}>
                      {address.qr && (
                        <img
                          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(address.qr)}`}
                          alt={t("配对二维码")}
                          width={168}
                          height={168}
                        />
                      )}
                      <small>{kindLabel(address.kind)}</small>
                      <code>{address.url}</code>
                    </li>
                  ))}
                </ul>
              )}
              <p className="phone-code">
                {t("或在手机上打开上面的地址，输入配对码")} <strong>{pairing.code}</strong>
                <small>{t("{seconds} 秒内有效，只能用一次", { seconds })}</small>
              </p>
            </div>
          ) : (
            <div className="phone-actions">
              <button type="button" className="primary" disabled={busy} onClick={() => void act(() => runtime.pairPhone())}>
                <QrCode size={14} aria-hidden="true" /> {t("配对一台手机")}
              </button>
              {data.enabled && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(() => runtime.setPhoneEnabled(false), t("已关闭手机连接，配对过的手机暂时连不上"))}
                >
                  {t("关闭手机连接")}
                </button>
              )}
              {!data.enabled && data.devices.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(() => runtime.setPhoneEnabled(true), t("已打开手机连接"))}
                >
                  {t("打开手机连接")}
                </button>
              )}
            </div>
          )}

          {data.devices.length > 0 && (
            <ul className="clients-list">
              {data.devices.map((device) => (
                <li key={device.id}>
                  <Smartphone size={15} aria-hidden="true" />
                  <span>
                    <strong>{device.name}</strong>
                    <small>
                      {t("上次连接：{when}", { when: formatWhen(device.lastSeen) })}
                      {device.scope === "readonly" ? ` · ${t("只能看")}` : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(() => runtime.unpairPhone(device.id), t("已取消 {name} 的配对", { name: device.name }))}
                  >
                    {t("取消配对")}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="skills-empty">
            {t("第一次配对时，Windows 可能会问是否允许 Unzoo One 访问网络：选“专用网络”并允许，手机才连得上。")}
          </p>
        </>
      )}
    </section>
  );
}

function formatWhen(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return iso;
  return new Date(at).toLocaleString(dateLocale(), { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
