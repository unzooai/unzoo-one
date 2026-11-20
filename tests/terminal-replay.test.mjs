import assert from "node:assert/strict";
import { test } from "node:test";

import { continueReplay, startReplay } from "../.test-build/terminal-replay.mjs";

test("the first read writes everything and remembers the last, partial line", () => {
  const step = startReplay({ text: "\x1b[31mred\x1b[m\r\nPS> ", firstRow: 10, rowCount: 2 });
  assert.equal(step.kind, "reset");
  assert.equal(step.data, "\x1b[31mred\x1b[m\r\nPS> ");
  assert.deepEqual(step.state, { line: 11, written: "PS> " });
});

test("later reads write only what came since, finishing the partial line", () => {
  const first = startReplay({ text: "a\r\nPS> ", firstRow: 0, rowCount: 2 });
  const next = continueReplay(first.state, { text: "PS> dir\r\nfile\r\nPS> ", firstRow: 1, rowCount: 3 });
  assert.equal(next.kind, "append");
  assert.equal(next.data, "dir\r\nfile\r\nPS> ");
  assert.deepEqual(next.state, { line: 3, written: "PS> " });
  const idle = continueReplay(next.state, { text: "PS> ", firstRow: 3, rowCount: 1 });
  assert.deepEqual(idle, { kind: "append", data: "", state: next.state });
});

test("output that no longer continues what was written starts over", () => {
  const first = startReplay({ text: "a\r\nPS> ", firstRow: 0, rowCount: 2 });
  const moved = continueReplay(first.state, { text: "other", firstRow: 5, rowCount: 1 });
  assert.equal(moved.kind, "reset");
  assert.equal(moved.data, "other");
  const changed = continueReplay(first.state, { text: "XX", firstRow: 1, rowCount: 1 });
  assert.equal(changed.kind, "reset");
});

test("an empty terminal is nothing to write", () => {
  const empty = startReplay({ text: "", firstRow: 0, rowCount: 0 });
  assert.deepEqual(empty, { kind: "reset", data: "", state: { line: 0, written: "" } });
  assert.equal(continueReplay(empty.state, { text: "", firstRow: 0, rowCount: 0 }).kind, "append");
  const started = continueReplay(empty.state, { text: "PS> ", firstRow: 0, rowCount: 1 });
  assert.deepEqual(started, { kind: "append", data: "PS> ", state: { line: 0, written: "PS> " } });
});
