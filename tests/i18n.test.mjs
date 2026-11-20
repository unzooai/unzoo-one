import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { en } from "../.test-build/i18n-en.mjs";
import { localeFor, translate } from "../.test-build/i18n.mjs";

/** Every `t("…")` key in the console's source, as JavaScript reads it. */
function sourceKeys() {
  const keys = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== "api" && name !== "i18n") walk(path);
      } else if (/\.(ts|tsx)$/.test(name)) {
        const text = readFileSync(path, "utf8");
        for (const match of text.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
          keys.set(JSON.parse(`"${match[1]}"`), path);
        }
      }
    }
  };
  walk("app");
  return keys;
}

test("every interface string has an English translation", () => {
  const missing = [...sourceKeys()].filter(([key]) => !(key in en)).map(([key, path]) => `${path}: ${key}`);
  assert.deepEqual(missing, [], `untranslated:\n${missing.join("\n")}`);
});

test("every Chinese data value (enum member) has English for where it is shown", () => {
  // TaskStatus, Weekday, TeamRole … are compared in code, so they stay
  // Chinese as data and are translated where displayed: t(task.status).
  const types = readFileSync("app/types.ts", "utf8");
  const values = new Set();
  for (const [, body] of types.matchAll(/export type \w+ =([^;]*);/g)) {
    for (const [, value] of body.matchAll(/"([^"]*[一-鿿][^"]*)"/g)) values.add(value);
  }
  assert.ok(values.size > 20, "found the enums");
  const missing = [...values].filter((value) => !(value in en));
  assert.deepEqual(missing, []);
});

test("translations keep their placeholders", () => {
  const names = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const broken = Object.entries(en).filter(([zh, english]) => names(zh).join() !== names(english).join());
  assert.deepEqual(broken, []);
});

test("English for everyone except Chinese speakers; values are filled in", () => {
  assert.equal(localeFor(["en-US", "zh-CN"]), "en");
  assert.equal(localeFor(["zh-CN", "en-US"]), "zh-CN");
  assert.equal(localeFor(["zh-TW"]), "zh-CN");
  assert.equal(localeFor(["de-DE"]), "en");
  assert.equal(localeFor([]), "en");
  assert.equal(translate("en", "已添加规则：{rule}", { rule: "Deny Bash" }), "Rule added: Deny Bash");
  assert.equal(translate("zh-CN", "已添加规则：{rule}", { rule: "拒绝 Bash" }), "已添加规则：拒绝 Bash");
  assert.equal(translate("en", "没有翻译的话"), "没有翻译的话", "a missing entry shows the source rather than nothing");
});
