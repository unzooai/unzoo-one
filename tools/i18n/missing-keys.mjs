// List t("…") keys in app/ that the English catalog lacks, in source order.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const repo = process.argv[2];
const catalog = readdirSync(join(repo, "app/i18n"))
  .filter((f) => /^en.*\.ts$/.test(f))
  .map((f) => readFileSync(join(repo, "app/i18n", f), "utf8"))
  .join("\n");
const known = new Set();
for (const m of catalog.matchAll(/^\s*("(?:[^"\\]|\\.)*")\s*:/gm)) known.add(JSON.parse(m[1]));
const seen = new Set();
const missing = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "api" && name !== "i18n") walk(path);
    } else if (/\.(ts|tsx)$/.test(name)) {
      for (const m of readFileSync(path, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
        const key = JSON.parse(`"${m[1]}"`);
        if (!known.has(key) && !seen.has(key)) {
          seen.add(key);
          missing.push(key);
        }
      }
    }
  }
};
walk(join(repo, "app"));
writeFileSync(process.argv[3], JSON.stringify(missing, null, 0).replace(/","/g, '",\n"'));
console.log(missing.length, "missing;", missing.join("").length, "chars");
