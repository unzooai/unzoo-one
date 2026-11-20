# Unzoo One

**智能体的电脑。**

[English](README.md)

Unzoo One 不是另一个聊天客户端，而是给 AI 智能体干活用的电脑。思考交给你已经在用的智能体：Claude Code、Codex、Antigravity CLI（agy）、OpenCode，用的是你自己的订阅。Unzoo One 提供它们在自家客户端里拿不到的东西：

- **不会断的终端**：会话在后台服务里，窗口关了照样跑；长时间跑的程序下次还在，你可以在同一个终端里看着、随时接手。
- **带真实登录的浏览器**：真 Chromium、你自己的账号，每个智能体有隔离的身份；能下载媒体、处理验证码，要登录时交给你，它等着。
- **管得住**：每个动作按风险处理，低风险的直接做；删除、推送、付款这类会先进收件箱等你批准；全部留记录。

不绑定模型厂商。终端和浏览器也通过 MCP 提供给 Claude 桌面版、Cursor 等别的客户端。

## 现在能做什么（个人版）

- **直接说，不用填表**：写一句想做的事就开始；对话就是任务，追问接着做，批准就地处理。
- **看着它干活**：对话旁边实时显示它用的终端和浏览器，随时接手。
- **技能**：自带终端、浏览器技能，统一管理；智能体做过的事可以存成技能。
- **中枢和帮手**：你的主智能体可以把一段活交给别的智能体（比如 Claude Code 交给 Codex）；长期帮手专管一块，记得以前做过什么。
- **自己会跑**：
  - 按时运行：每天、工作日、每周、每隔几分钟，或定时跑一次。
  - 有变化时运行：网页变了、文件夹里有新文件、收到新邮件、日程快开始。
- **手机**：同一个 Wi-Fi 或 Tailscale 下，在手机上看对话、批准、接手、发任务。
- **多语言**：英文优先，同时支持中文。

### 隐私

个人版的一切都在你自己的电脑上：任务、对话、邮件密码、日历地址、浏览器登录状态都不经过我们的服务器。

- 密码和日历地址只存在系统凭据库（Windows 凭据管理器）里，不交给智能体。
- 网页和邮件的内容只作为数据交给智能体，不当成指令。

代价是电脑关机时不跑；睡着或关机时错过的运行，开机后补上。

## 以后的方向

| | 个人版 | 企业版（规划中） |
|---|---|---|
| 在哪运行 | 只在你的电脑 | 你的电脑，加上企业自己的服务器 |
| 电脑关机时 | 等开机后补跑 | 任务在服务器上继续跑 |
| 数据 | 不离开你的电脑 | 不离开你的企业 |
| 使用者 | 一个人 | 团队：共用智能体、技能和规则 |
| 管控 | 自己批准 | 统一规则、审批分派、审计导出、单点登录 |

个人版接下来做：

- macOS 和 Linux 安装包。
- 正式签名的 Windows 安装包。
- 把录制下来的操作变成技能。
- 让智能体除了终端和浏览器，也能操作桌面应用。

## 仓库结构

| 路径 | 内容 |
|---|---|
| `unterm/` | 运行时：后台服务、终端、智能体会话、调度、网关（Rust）。第三方代码，MIT 协议，见 [NOTICE.md](NOTICE.md) |
| `app/` | 界面（Next.js 16 + React 19，基于 [vinext](https://github.com/cloudflare/vinext)），静态构建后打进桌面客户端 |
| `apps/unzoo-one/` | 桌面客户端（Tauri 2）和安装包，见[它的说明](apps/unzoo-one/README.md) |
| `contracts/` | 跨仓库 JSON Schema |
| `docs/` | 产品和设计文档。当前计划见 [docs/plans/2026-11-12-agent-computer.md](docs/plans/2026-11-12-agent-computer.md) |
| `one-core/` | 早期的运行时原型，已冻结 |

## 构建

```bash
npm install
npm run build:static          # 界面 -> dist/client
npm test                      # 界面测试
cd unterm && cargo build -p unterm-core -p unterm-app    # 运行时和终端
```

Windows 安装包：`powershell -File apps\unzoo-one\build-installer.ps1`。

- 安装包、签名和开机后台运行：见 [apps/unzoo-one/README.md](apps/unzoo-one/README.md)。
- 界面开发：见 [docs/web-console-setup.md](docs/web-console-setup.md)。

在本仓库里工作的智能体必须遵守 [AGENTS.md](AGENTS.md)：浏览器自动化一律走 Unzoo Browser，不许用 Playwright、Puppeteer 这类工具。

## 协议

Unzoo One 是**源码公开的受控自由软件**，采用 [Business Source License 1.1](LICENSE)：

- **可以**：看、改、构建代码；自己用；在公司内部用，包括生产环境。
- **不可以**（需要商业授权）：拿去给别人做托管或代运营服务，或者放进和 Unzoo One 竞争的产品里。
- **四年后**：每个版本发布满四年，自动改为 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)。

`unterm/` 里的运行时和其它第三方代码保留各自的协议（MIT 等），见 [NOTICE.md](NOTICE.md)。要商业授权或企业版，请发邮件到 [dev@unzoo.ai](mailto:dev@unzoo.ai)。
