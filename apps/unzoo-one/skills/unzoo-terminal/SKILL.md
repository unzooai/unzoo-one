---
name: unzoo-terminal
description: How to run commands on this computer through the Unzoo One terminal (the unterm MCP server) — opening and reusing terminals, short vs long-running commands, reading output, and leaving work running for later. Use whenever a task needs a shell, a script, a build, a server or any command-line tool.
---

# Working in the Unzoo One terminal

Commands on this computer run in the Unzoo One terminal, through its MCP server: `unterm` in a task Unzoo One runs, `unzoo-one` in a client the person connected to it. In a Unzoo One task your own shell tools may be switched off; these tools are the way in. The person can watch the same terminal live in Unzoo One and take it over, so work in it the way a careful colleague would.

## Terminals persist — reuse them

- A terminal is a session that lives in the Unzoo One background service. It survives the end of your turn, and it survives the person closing the window.
- Open one with `session.create` (shown with the server's prefix, such as `mcp__unterm__session_create` or `mcp__unzoo-one__session_create`). Pass `cwd` set to the current working folder. Keep the `session_id` it returns.
- Use the same terminal for the whole task. In a follow-up turn, look at what you did earlier in the conversation: if you opened a terminal before, keep using that `session_id` instead of opening another. Open a second terminal only for something that must run alongside, like a dev server next to a test run.
- Never close (`session.destroy`) a terminal you did not open. Close your own only if the person asks: a running server or a shell that still holds context is often why they asked you here.

## Short commands

- `exec.run_wait` with `session_id` and `command` runs a command and returns its output when it exits. Use it for anything that finishes on its own: `git status`, a build, a test run, a script.
- Set `timeout_ms` for slow commands, such as installs and full builds. The default is short.
- This is Windows unless the prompt or `ver`/`uname` says otherwise. Terminals start the default shell, usually PowerShell 7: use PowerShell syntax (`Get-ChildItem`, `$env:NAME`, `;` between commands). The prompt says which shell it is and which others are installed.
- For a job written for another shell (a bash script, Linux tools), open a terminal for it with `session.create` and `argv`, for example `["C:/Program Files/Git/bin/bash.exe", "--login"]` or `["wsl.exe"]`. A `command` string given to `session.create` runs through `cmd /C` on Windows; to run a command in a particular shell, start that shell with `argv` and use `exec.run_wait`.
- If the job needs a shell or tool that is not installed, install it with `winget install --id <id> -e --source winget` (or `brew install` on a Mac). Installing programs waits for the person's approval; WSL needs an administrator and a restart, so ask the person to install it.

## Long-running commands — servers, watchers, downloads

- Start them with `exec.run` (fire and forget). It returns at once, and the command keeps running in that terminal.
- Read what it printed with `screen.text` (what is on screen now) or `screen.scrollback_text` (everything so far). Wait a few seconds between reads; do not poll in a tight loop.
- `session.idle` tells you whether the terminal has gone quiet; `exec.status` reports on a command started with `exec.run`.
- `screen.detect_errors` picks out error-shaped lines from recent output. Use it before reading everything yourself.
- To stop a command you started, use `exec.cancel`, or send Ctrl+C with `session.input` and `"\u0003"`.
- When you leave something running at the end of your turn, say so in your reply: what is running, in which terminal, and how to stop it.

## Interactive programs

- Use `session.input` to type into a program that is waiting (a prompt, a REPL), then `screen.text` to see its answer.
- If a program wants a password, a 2FA code or a confirmation only the person should give, do not guess or work around it. Stop and say exactly what it is waiting for: the person can type it into the same terminal in Unzoo One.

## Being asked first

Unzoo One shows risky commands to the person before they run: deleting, force-pushing, `git reset --hard`, killing processes, pushing, uploading, and requests that send data. If one is refused, do not try another way to do the same thing. Say what you needed it for and stop.
