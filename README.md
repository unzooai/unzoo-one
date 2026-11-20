# Unzoo One

**The agent's computer.**

[中文](README.zh-CN.md)

Unzoo One is not another chat app. It is the computer your AI agents work on.
The thinking comes from the agents you already pay for: Claude Code, Codex,
Antigravity CLI (agy) and OpenCode, on your own subscriptions. Unzoo One gives
them what they can't get inside their own apps:

- **A terminal that stays.** Sessions live in a background service, so they
  keep going when the window closes. Long-running programs are still there next
  time, and you can watch the same terminal and take over at any point.
- **A real browser with real sign-ins.** A full Chromium with your accounts,
  and a separate identity for each agent. It can download media and deal with
  captchas. When a login is needed, it hands the page to you and waits.
- **Governance.** Every action is rated for risk. Low-risk steps just run;
  risky ones (deleting, pushing, paying) wait in your inbox for approval.
  Everything is recorded.

You are not tied to any model vendor. The terminal and browser are also offered
over MCP, so Claude Desktop, Cursor and other clients can use them too.

## What you can do today (personal edition)

- **Talk, don't fill in forms.** Type what you want done. A conversation is a
  task: follow up in the same thread, and approve right where you are.
- **Watch the agent work.** Its terminal and browser appear beside the
  conversation, and you can take over at any time.
- **Skills.** Built-in terminal and browser skills, managed in one place. Save
  something an agent did as a new skill.
- **A hub with helpers.** Your main agent can hand part of the work to another
  agent, for example Claude Code passing a chunk to Codex. Standing helpers own
  an area and remember what they did before.
- **Runs on its own.** Run tasks daily, on weekdays, weekly, every N minutes or
  once at a set time. Tasks can also run when something changes: a web page, a
  folder, new mail, or an upcoming calendar event.
- **Phone.** On the same Wi-Fi or over Tailscale, read conversations, approve
  actions, take over and start tasks from your phone.
- **Languages.** English first, with Chinese as well.

### Private by design

In the personal edition, everything stays on your computer: tasks,
conversations, mail passwords, calendar addresses and browser sign-ins. Nothing
goes through our servers. Secrets live in the system credential store
(Windows Credential Manager) and are never handed to the agents. Page and mail
content reaches the agent as data, never as instructions.

The trade-off is that nothing runs while your computer is off. Runs missed
while it was asleep or off catch up once it is back on.

## Where we are going

| | Personal | Enterprise (planned) |
|---|---|---|
| Where it runs | Your computer only | Your computer plus your organization's own server |
| When the computer is off | Waits, then catches up | Tasks keep running on the server |
| Data | Never leaves your computer | Stays inside your organization |
| People | One | Teams with shared agents, skills and policies |
| Governance | Your own approvals | Central policy, approval routing, audit export, SSO |

Next for the personal edition:

- macOS and Linux packages.
- Signed Windows installers.
- Turning a recording into a skill.
- Letting agents use desktop apps as well as the terminal and browser.

## Repository layout

| Path | What it is |
|---|---|
| `unterm/` | The runtime: background service, terminal, agent sessions, scheduling, gateway (Rust). Third-party, MIT; see [NOTICE.md](NOTICE.md). |
| `app/` | The interface (Next.js 16 + React 19 on [vinext](https://github.com/cloudflare/vinext)), built as static files and bundled into the desktop client. |
| `apps/unzoo-one/` | The desktop client (Tauri 2) and installer. See [its README](apps/unzoo-one/README.md). |
| `contracts/` | Cross-repository JSON Schemas. |
| `docs/` | Product and design documents. The current plan is [docs/plans/2026-11-12-agent-computer.md](docs/plans/2026-11-12-agent-computer.md). |
| `one-core/` | Earlier runtime prototype, now frozen. |

## Building

```bash
npm install
npm run build:static          # interface -> dist/client
npm test                      # interface tests
cd unterm && cargo build -p unterm-core -p unterm-app    # runtime and terminal
```

Windows installer: `powershell -File apps\unzoo-one\build-installer.ps1`.
Details, signing and autostart are covered in
[apps/unzoo-one/README.md](apps/unzoo-one/README.md). The interface's
development setup is in [docs/web-console-setup.md](docs/web-console-setup.md).

Agents working in this repository must follow [AGENTS.md](AGENTS.md). In
particular, all browser automation goes through Unzoo Browser; Playwright,
Puppeteer and similar tools are not allowed.

## License

Unzoo One is **source-available** under the
[Business Source License 1.1](LICENSE). It is free software with controls:

- **Allowed:** reading, changing and building the code; using it yourself; and
  using it inside your company, including in production.
- **Not allowed** without a commercial license: offering it to others as a
  hosted or managed service, or shipping it inside a product that competes
  with Unzoo One.
- **After four years:** each version becomes
  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) four years
  after it is first released.

The runtime in `unterm/` and other third-party code keep their own licenses
(MIT and others); see [NOTICE.md](NOTICE.md). For a commercial or enterprise
license, email [dev@unzoo.ai](mailto:dev@unzoo.ai).
