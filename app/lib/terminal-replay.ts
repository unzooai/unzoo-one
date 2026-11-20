/**
 * Replaying an agent's terminal in the console.
 *
 * The runtime keeps what a terminal printed exactly as it arrived (escapes and
 * all), cut into lines at "\n". Fed to a terminal emulator in order, those
 * bytes draw the same screen: colours, cursor, progress bars. The console
 * reads the recent history once, then only what came since -- asking again
 * from the last line it holds, because that line may still be growing.
 */

/** One read of a terminal's output. */
export type TerminalChunk = {
  /** The output from `firstRow` on, lines joined with "\n". */
  text: string;
  /** Index of the first line in `text`. */
  firstRow: number;
  /** How many lines `text` holds. */
  rowCount: number;
};

/** Where the replay is: the last line written, and how much of it. */
export type ReplayState = {
  /** Index of the last line written (it may be partial). */
  line: number;
  /** What of that line has been written. */
  written: string;
};

export type ReplayStep =
  /** Write `data` after what is already there. */
  | { kind: "append"; data: string; state: ReplayState }
  /** What was written no longer matches the terminal: clear and write `data`. */
  | { kind: "reset"; data: string; state: ReplayState };

function stateAfter(chunk: TerminalChunk, lines: string[]): ReplayState {
  if (chunk.rowCount <= 0 || lines.length === 0) return { line: chunk.firstRow, written: "" };
  return { line: chunk.firstRow + lines.length - 1, written: lines[lines.length - 1] };
}

/** The first read: everything it returned. */
export function startReplay(chunk: TerminalChunk): ReplayStep {
  const lines = chunk.rowCount > 0 ? chunk.text.split("\n") : [];
  return { kind: "reset", data: lines.join("\n"), state: stateAfter(chunk, lines) };
}

/**
 * The next read, asked from `state.line`: what to write so the emulator
 * catches up. A reply that does not continue what was written (the runtime
 * dropped old output, the terminal was cleared) starts over from it.
 */
export function continueReplay(state: ReplayState, chunk: TerminalChunk): ReplayStep {
  const lines = chunk.rowCount > 0 ? chunk.text.split("\n") : [];
  if (lines.length === 0) {
    // Nothing at or after our line: the terminal's output shrank under us.
    return chunk.firstRow === state.line && state.written === ""
      ? { kind: "append", data: "", state }
      : startReplay(chunk);
  }
  if (chunk.firstRow !== state.line || !lines[0].startsWith(state.written)) return startReplay(chunk);
  const data = [lines[0].slice(state.written.length), ...lines.slice(1)].join("\n");
  return { kind: "append", data, state: stateAfter(chunk, lines) };
}
