// Wrap Chinese interface text in t(), telling display text from data by type.
// Usage: npm run i18n:wrap -- app/some-file.tsx   (then: npm run i18n:missing)
const ts = require(require.resolve("typescript", { paths: [process.argv[2]] }));
const path = require("path");
const fs = require("fs");

const repo = process.argv[2];
const target = path.resolve(repo, process.argv[3]);
const dry = process.argv.includes("--dry");
const CJK = /[　-〿一-鿿＀-￯]/;

const configPath = ts.findConfigFile(repo, ts.sys.fileExists, "tsconfig.json");
const parsed = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, repo);
const program = ts.createProgram([target], { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const sf = program.getSourceFile(target);
const text = sf.getFullText();

// ---- what counts as data -------------------------------------------------
function literalMembers(type) {
  if (!type) return null;
  if (type.isUnion()) {
    const all = [];
    for (const t of type.types) {
      const m = literalMembers(t);
      if (m === null) return null;
      all.push(...m);
    }
    return all;
  }
  if (type.isStringLiteral()) return [type.value];
  if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) return [];
  return null;
}
/** A union of string literals with Chinese in it: one of the data enums. */
function isCjkEnum(type) {
  const members = literalMembers(type);
  return Boolean(members && members.length && members.some((m) => CJK.test(m)));
}
/** Any member of the type is a Chinese string literal (e.g. SetStateAction<TaskSort>). */
function containsCjkLiteral(type) {
  if (!type) return false;
  if (type.isUnion()) return type.types.some(containsCjkLiteral);
  return Boolean(type.isStringLiteral() && CJK.test(type.value));
}
// Values compared anywhere: treat as data even where typed `string`.
const compared = new Set();
(function collect(node) {
  if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(node.operatorToken.kind)) {
    for (const side of [node.left, node.right]) if (ts.isStringLiteralLike(side) && CJK.test(side.text)) compared.add(side.text);
  }
  if (ts.isCaseClause(node) && ts.isStringLiteralLike(node.expression) && CJK.test(node.expression.text)) compared.add(node.expression.text);
  ts.forEachChild(node, collect);
})(sf);

function isTCall(node) {
  return node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t";
}

function isDataLiteral(node) {
  const parent = node.parent;
  if (isTCall(parent)) return true;
  if (ts.isLiteralTypeNode(parent) || ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return true;
  if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent) || ts.isMethodDeclaration(parent)) && parent.name === node) return true;
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return true;
  if (ts.isCaseClause(parent)) return true;
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind !== ts.SyntaxKind.PlusToken && parent.operatorToken.kind !== ts.SyntaxKind.BarBarToken && parent.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionToken && parent.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return true;
  const contextual = checker.getContextualType(node);
  if (contextual && (isCjkEnum(contextual) || containsCjkLiteral(contextual))) return true;
  if (contextual && literalMembers(contextual)) return true; // some other literal union
  if (compared.has(node.text)) return true;
  if (!contextual && enumValues.has(node.text)) return true;
  return false;
}

// Every value of a Chinese enum the file can see (types.ts).
const enumValues = new Set();
for (const file of program.getSourceFiles()) {
  if (!file.fileName.replace(/\\/g, "/").endsWith("app/types.ts")) continue;
  (function walk(node) {
    if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal) && CJK.test(node.literal.text)) enumValues.add(node.literal.text);
    ts.forEachChild(node, walk);
  })(file);
}

// ---- edits ---------------------------------------------------------------
const edits = []; // {start, end, text}
function addEdit(start, end, replacement) {
  for (let i = edits.length - 1; i >= 0; i--) {
    if (edits[i].start >= start && edits[i].end <= end) edits.splice(i, 1);
  }
  edits.push({ start, end, text: replacement });
}
function withEdits(start, end) {
  const inner = edits.filter((e) => e.start >= start && e.end <= end).sort((a, b) => b.start - a.start);
  let out = text.slice(start, end);
  for (const e of inner) out = out.slice(0, e.start - start) + e.text + out.slice(e.end - start);
  return out;
}
const js = (s) => JSON.stringify(s);

function placeholderName(expr, used) {
  let base = "value";
  let e = expr;
  while (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e)) e = e.expression;
  if (ts.isIdentifier(e)) base = e.text;
  else if (ts.isPropertyAccessExpression(e)) base = e.name.text;
  else if (ts.isCallExpression(e)) {
    const callee = e.expression;
    base = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "value";
  }
  base = base.replace(/[^A-Za-z0-9_]/g, "") || "value";
  let name = base;
  let i = 2;
  while (used.has(name)) name = `${base}${i++}`;
  used.add(name);
  return name;
}

/** Source text for an embedded value; a Chinese-enum value is translated too. */
function valueText(expr) {
  const inner = withEdits(expr.getStart(sf), expr.getEnd());
  const type = checker.getTypeAtLocation(expr);
  return isCjkEnum(type) ? `t(${inner})` : inner;
}

function convertTemplate(node) {
  const used = new Set();
  let pattern = node.head.text;
  const values = [];
  for (const span of node.templateSpans) {
    const name = placeholderName(span.expression, used);
    pattern += `{${name}}` + span.literal.text;
    values.push(`${name}: ${valueText(span.expression)}`);
  }
  const shorthand = values.map((v) => {
    const [k, ...rest] = v.split(": ");
    return rest.join(": ") === k ? k : v;
  });
  return `t(${js(pattern)}, { ${shorthand.join(", ")} })`;
}

/** React's whitespace rules for JSX text. */
function jsxTextValue(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines.length === 1) return raw;
  const kept = [];
  lines.forEach((line, i) => {
    let l = line;
    if (i !== 0) l = l.replace(/^[ \t]+/, "");
    if (i !== lines.length - 1) l = l.replace(/[ \t]+$/, "");
    if (l) kept.push(l);
  });
  return kept.join(" ");
}

function isStringish(expr) {
  const type = checker.getTypeAtLocation(expr);
  const flags = ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.Undefined | ts.TypeFlags.Null;
  if (type.isUnion()) return type.types.every((t) => t.flags & flags);
  return Boolean(type.flags & flags);
}

const DISPLAY_ATTRS = new Set(["aria-label", "title", "placeholder", "alt", "aria-description", "aria-valuetext", "label", "description", "summary", "detail", "hint"]);

function visit(node) {
  ts.forEachChild(node, visit);

  // An element whose children are text and plain values: one sentence.
  if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && node.children.length > 1) {
    const kids = node.children;
    const textual = kids.every((k) => (ts.isJsxText(k)) || (ts.isJsxExpression(k) && k.expression && isStringish(k.expression)));
    const hasCjk = kids.some((k) => ts.isJsxText(k) && CJK.test(k.text));
    const hasExpr = kids.some((k) => ts.isJsxExpression(k));
    if (textual && hasCjk && hasExpr) {
      const used = new Set();
      let pattern = "";
      const values = [];
      for (const k of kids) {
        if (ts.isJsxText(k)) pattern += jsxTextValue(k.text);
        else {
          const name = placeholderName(k.expression, used);
          pattern += `{${name}}`;
          const v = valueText(k.expression);
          values.push(v === name ? name : `${name}: ${v}`);
        }
      }
      const lead = pattern.match(/^\s*/)[0];
      const trail = pattern.match(/\s*$/)[0];
      const core = pattern.trim();
      const start = kids[0].getFullStart();
      const end = kids[kids.length - 1].getEnd();
      addEdit(start, end, `${lead ? "{\" \"}" : ""}{t(${js(core)}, { ${values.join(", ")} })}${trail ? "{\" \"}" : ""}`);
      return;
    }
  }

  if (ts.isJsxText(node) && CJK.test(node.text)) {
    const value = jsxTextValue(node.text);
    const core = value.trim();
    if (!core) return;
    const raw = node.text;
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    // Keep the original whitespace around the expression so layout is unchanged.
    addEdit(node.getStart(sf, true), node.getEnd(), `${lead}{t(${js(core)})}${trail}`);
    return;
  }

  if (ts.isJsxExpression(node) && node.expression && ts.isJsxElement(node.parent) === false && ts.isJsxAttribute(node.parent) === false) {
    // children of fragments are handled the same way below
  }
  if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
    const type = checker.getTypeAtLocation(node.expression);
    if (isCjkEnum(type) && !isTCall(node.expression)) {
      addEdit(node.expression.getStart(sf), node.expression.getEnd(), `t(${withEdits(node.expression.getStart(sf), node.expression.getEnd())})`);
    }
    return;
  }

  if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && CJK.test(node.initializer.text)) {
    const contextual = checker.getContextualType(node.initializer);
    if (contextual && (isCjkEnum(contextual) || literalMembers(contextual))) return;
    addEdit(node.initializer.getStart(sf), node.initializer.getEnd(), `{t(${js(node.initializer.text)})}`);
    return;
  }

  if (ts.isNoSubstitutionTemplateLiteral(node) && CJK.test(node.text)) {
    if (isDataLiteral(node)) return;
    addEdit(node.getStart(sf), node.getEnd(), `t(${js(node.text)})`);
    return;
  }

  if (ts.isStringLiteral(node) && CJK.test(node.text)) {
    if (ts.isJsxAttribute(node.parent)) return;
    if (isDataLiteral(node)) return;
    addEdit(node.getStart(sf), node.getEnd(), `t(${js(node.text)})`);
    return;
  }

  if (ts.isTemplateExpression(node)) {
    const literalText = node.head.text + node.templateSpans.map((s) => s.literal.text).join("");
    if (!CJK.test(literalText)) return;
    if (ts.isTaggedTemplateExpression(node.parent)) return;
    addEdit(node.getStart(sf), node.getEnd(), convertTemplate(node));
  }
}
visit(sf);

// ---- apply ---------------------------------------------------------------
const sorted = edits.sort((a, b) => b.start - a.start);
let out = text;
for (const e of sorted) out = out.slice(0, e.start) + e.text + out.slice(e.end);

const keys = new Set();
for (const m of out.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
console.error(`${edits.length} edits, ${keys.size} distinct keys in file`);
if (!dry) fs.writeFileSync(target, out);
