/**
 * Interface language.
 *
 * The console was written in Chinese, so the Chinese text is the key: a
 * string is wrapped as `t("新建任务")` and each other language has a catalog
 * from that text to its own (`en.ts`). Chinese needs no catalog. Values can
 * be filled in with `{name}` placeholders: `t("已删除规则：{rule}", { rule })`.
 *
 * The language is chosen once per page load: a saved choice, otherwise the
 * system's first preferred language (Chinese if it is Chinese, English for
 * everything else). Changing it saves the choice and reloads, so every
 * string -- including ones computed at module load -- is in one language.
 * Server rendering has no system language and uses English.
 */

import { en } from "./en";

export type Locale = "en" | "zh-CN";

export const locales: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh-CN", label: "简体中文" },
];

const STORAGE_KEY = "unzoo-one.locale";

const catalogs: Record<Exclude<Locale, "zh-CN">, Record<string, string>> = { en };

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

/** The language for a list of preferred languages, most preferred first. */
export function localeFor(preferred: readonly string[]): Locale {
  const first = preferred.find(Boolean) ?? "";
  return /^zh(\b|-|_)/i.test(first) ? "zh-CN" : "en";
}

function detect(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage blocked: fall through to the system language.
  }
  const nav = window.navigator;
  return localeFor(nav.languages?.length ? nav.languages : [nav.language]);
}

let current: Locale = detect();

export function locale(): Locale {
  return current;
}

/** Save a choice and reload so the whole interface follows it. */
export function chooseLocale(next: Locale): void {
  if (!isLocale(next) || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not saved; still switch for this session.
  }
  current = next;
  window.location.reload();
}

function fill(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/** The interface text for this Chinese source text, in the current language. */
export function t(source: string, values?: Record<string, string | number>): string {
  return translate(current, source, values);
}

/** As `t`, for a given language (tests, and text meant for another reader). */
export function translate(
  target: Locale,
  source: string,
  values?: Record<string, string | number>,
): string {
  const text = target === "zh-CN" ? source : catalogs[target][source] ?? source;
  return fill(text, values);
}

/** The BCP 47 tag for dates and numbers in the current language. */
export function dateLocale(): string {
  return current === "zh-CN" ? "zh-CN" : "en-US";
}

/** Keep `<html lang>` in step with the language actually shown. */
export function applyDocumentLanguage(): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = current;
  // The page metadata is English (server rendering); the title follows the
  // language actually shown.
  document.title = t("Unzoo One | AI 任务工作台");
}
