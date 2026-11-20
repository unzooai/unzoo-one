---
name: unzoo-deliverables
description: How to hand over results in Unzoo One — write deliverables as files in the current working folder, choose formats the person can open, and end each turn with a short, concrete answer. Use for any task whose result is a report, a table, a document, data, code or a download.
---

# Handing over results

The person reads your reply in a conversation and finds your files under 成果 (Deliverables), where every file you write or change in the current working folder appears after the turn. Make both easy to use.

## Files

- Put results in the current working folder (your `cwd`), not in temp folders or the home directory. Files elsewhere are not shown as deliverables.
- Use names that say what the file is: `competitor-prices-2026-11.csv`, not `output.csv` or `result2.txt`.
- Pick formats the person can open without tools:
  - Markdown (`.md`) for reports and notes;
  - CSV for tables meant for further work;
  - `.xlsx` when they asked for Excel or the table needs several sheets;
  - plain files for code and data.
- Keep scratch work out of the way: put intermediate files in a `work/` subfolder, or delete them before you finish. Never leave secrets, tokens or cookies in a file.
- If a later turn asks for changes, edit the same file rather than writing `report-v2.md`, unless they asked to keep the old one.

## The reply

- Start with the answer or the outcome in one or two sentences. Do not narrate the steps you took; the person can see them in the action list.
- Name the files you wrote, and say in a few words what each one holds.
- Say what you could not do, and why, plainly: a page that needed a sign-in, a command that was refused, data that was missing.
- Say what you left running, if anything (a server, a download), and how to stop it.
- Answer in the language the person wrote in.
