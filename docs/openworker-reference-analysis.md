# OpenWorker 参考分析与 Unzoo One 产品覆盖策略

> 状态：Draft
> 日期：2026-07-26
> 参考项目：[andrewyng/openworker](https://github.com/andrewyng/openworker)
> 审计快照：`db93d75bf634e3a855b29e00d8f5d677438cac1f`

## 1. 参考原则

Unzoo One 将 OpenWorker 视为首要产品参考基线。

“完全学习”不等于复制 UI 或源代码，而是：

1. 完整理解它解决的用户问题。
2. 覆盖它已经证明有效的产品闭环。
3. 保留它在易用性、安全和本地优先方面的正确设计。
4. 用 Unterm 和 Unzoo 扩展执行范围、可靠性和可控性。
5. 对采用的 MIT 源代码保持许可证和归属合规。

Unzoo One 的目标不是“功能列表更多”，而是：

> OpenWorker 能完成的日常知识工作，Unzoo One 应当更稳定地完成；OpenWorker 当前不能覆盖的终端、真实浏览器、多账号、桌面应用和长期任务，Unzoo One 继续完成。

## 2. OpenWorker 的产品公式

OpenWorker 的核心并不是 Agent Loop，而是以下组合：

```text
Outcome-oriented UX
  + Local agent server
  + Multi-model
  + Files / Shell / Connectors
  + Typed permissions
  + Durable human Inbox
  + Automations
  + Finished artifacts
```

它向用户承诺的是“成品”：

- 可打开的文档。
- 可分享的报告。
- 已准备好的 Slack 回复。
- 已更新的日历。
- 已整理的 Inbox。

这是 Unzoo One 必须继承的第一原则：**任务完成标准是可用结果，而不是 Agent 停止输出。**

## 3. 已验证的 OpenWorker 能力

## 3.1 产品入口

OpenWorker 提供三种内置 Agent：

- **Chat**：无文件和 Shell 的普通问答。
- **Cowork**：面向知识工作的工作区 Agent，必须维护进度并交付文件。
- **Code**：面向代码仓库的工程 Agent。

同时支持 Persona：

- Persona Manifest 声明工具、Connector、MCP 和推荐权限模式。
- 安装前展示权限和风险。
- 新 Persona 默认禁用，等待用户同意。

### Unzoo One 学习方式

保留三种清晰心智，但避免把它们做成三个割裂产品：

| 用户入口 | 系统预设 | 适用场景 |
|---|---|---|
| Ask | 无副作用、最小工具 | 快速问答 |
| Work | 文件、浏览器、Connector、Artifact | 日常知识工作 |
| Code | Git、文件、终端、测试、Review | 软件开发 |
| Automate | Scheduler、Inbox、精确 Standing Grant | 周期任务 |

它们共享同一个 Task Engine、Approval Inbox 和 Artifact Center。

## 3.2 首次上手

OpenWorker 的上手流程是：

1. 选择模型 Provider 并填写 Key。
2. 连接用户工具。
3. 开始工作。

Provider Gallery 与 Settings 复用同一组件，避免状态漂移。

### Unzoo One 学习方式

Unzoo One 首次启动控制在三步：

1. **Choose a brain**：自动检测 Codex/Claude 登录态，也支持 API Key/Ollama。
2. **Connect your tools**：自动绑定 Unterm 与 Unzoo，展示可选 Connector。
3. **Try a real task**：运行只读任务并生成一个真实 Artifact。

要求：

- 不手工编辑 MCP。
- 不复制 Token。
- 不要求用户理解 Provider 端口。
- 5 分钟内看到第一个成品。

## 3.3 权限模型

OpenWorker 的工具风险分为：

| 风险 | 含义 |
|---|---|
| `read` | 无副作用 |
| `write_local` | 修改本地工作区 |
| `exec` | 执行命令 |
| `external` | 产生机器外副作用 |

运行模式：

- `discuss`
- `plan`
- `interactive`
- `auto`
- `custom`

值得学习的细节：

- Plan/Discuss 在引擎层只读，不依赖 Prompt 自觉。
- 写文件始终受 writable root 限制。
- Shell allowlist 会解析 argv。
- 命令包含 `; & | > <`、命令替换或换行时不能自动放行。
- Connector 的长期授权绑定到精确工具和目标。
- “Allow every time” 对 Automation 持久化，但可撤销。

### Unzoo One 的增强

在相同心智上扩展为：

```text
read
local_mutation
exec
external_side_effect
credential_access
financial
destructive
```

同时加入：

- Client Identity。
- Task Capability Grant。
- Provider/Profile/Domain/Path/Window scope。
- TTL 和撤销。
- Approval 与 Grant 的持久关联。
- 未声明风险默认 fail-closed。

OpenWorker 对无法识别且没有 `requires_approval` 元数据的工具可能回落为 read；Unzoo One 不采用这一回退策略。

## 3.4 Unattended 与 Inbox

OpenWorker 最值得学习的设计之一：

> Unattended 不提高自治上限，只改变人在哪里收到请求。

审批、问题、目录授权和计划都进入统一 Inbox：

- Item 是持久化对象。
- `pending → resolved` 只能转换一次。
- First responder wins。
- 可从 App 或消息 Connector 回答。
- 重启后可恢复等待中的工具调用。
- 删除 Session 会关闭孤立审批。

### Unzoo One 学习方式

直接采用“注意力路由”和“自治等级”分离的产品概念：

- **Autonomy Policy**：决定能不能自动做。
- **Attention Route**：决定去哪里找用户。

Approval Inbox 必须是唯一事实来源；桌面、手机、Slack、飞书或企业微信只是不同 Transport。

## 3.5 Session 与恢复

OpenWorker：

- SQLite 保存 Session 索引。
- Conversation 使用 append-only JSONL。
- Session 持久化 mode、model、workspace、roots、grants、origin。
- 未完成 tool call 可在重启后从持久历史恢复。
- Stop 能中断 stream、tool、approval 和 question。
- 部分输出和 interruption notice 会保留。

### Unzoo One 的增强

在 Session 之外增加完整 Task 层：

```text
Task → Run → Step → BrainTurn → ToolCall
```

这样：

- Conversation 不再等于 Task。
- 一个 Task 可以跨多个 Brain Thread。
- 一个 Task 可以包含 Terminal、Browser、Connector 和 Desktop Provider。
- 重试和取消能在 Step/ToolCall 层做到幂等。

## 3.6 Automation

OpenWorker：

- ScheduledTask 和 Run 使用 SQLite。
- 支持 Cron 和 One-shot。
- 每次运行有独立 Session。
- 支持时区、run count、next run、通知和 catch-up。
- 创建 Automation 本身需要审批。
- Standing Grant 绑定到精确工具和目标。

### Unzoo One 学习方式

完整覆盖以上能力，并增加：

- Webhook、文件变化、邮件/日历和 Provider Event。
- Misfire policy。
- Concurrency policy。
- Retry/backoff。
- Exactly-once idempotency boundary。
- Automation 运行预算。
- 审批过期和升级策略。

## 3.7 Connector

OpenWorker 当前官方描述中包含 39 个 Connector：

```text
Telegram, Slack, Email/IMAP, Gmail, Google Calendar, Browser, GitHub,
Outlook, Jira, monday.com, Confluence, Zendesk, Linear, GitLab, Discord,
Stripe, Asana, HubSpot, Dropbox, Box, WhatsApp, QuickBooks, Datadog,
Salesforce, DocuSign, ClickUp, Google Drive, Canva, Figma, Descript,
Clay, Close, Notion, Attio, PostHog, Mixpanel, Amplitude, Apollo,
Hunter, PagerDuty
```

它还支持任意 MCP Server，并提供：

- Connector Gallery。
- Managed OAuth 和手工 Token fallback。
- Secret fields。
- 健康检查。
- 双向消息入口。
- Approval owner。
- 发送文件与互动按钮。

### Unzoo One 覆盖策略

不应逐个手写 39 套孤立逻辑。分三层覆盖：

1. **MCP Import**：立即覆盖标准 MCP Connector。
2. **Generic Connector Runtime**：OAuth、Secret、Health、Tool Schema、Webhook、Polling 通用化。
3. **Native Priority Connector**：为高频和本地市场场景提供深度体验。

V1 原生优先：

- GitHub。
- Slack。
- Gmail / Outlook / IMAP。
- Google Calendar / Outlook Calendar。
- Notion。
- Google Drive / Dropbox。
- Telegram。
- 飞书。
- 企业微信。
- 钉钉。

其余 Connector 先通过 MCP 覆盖，再按使用量升级为原生体验。

## 3.8 多模型

OpenWorker：

- OpenAI、Anthropic、Gemini 原生 Provider。
- 多个 OpenAI-compatible Provider。
- Together / Fireworks。
- Ollama 本地模型。
- Curated model matrix 只推荐经过工具调用验证的模型。
- 自定义模型允许使用，但给出降级风险。
- 会话中可以切换模型。

### Unzoo One 学习方式

保持 Curated Matrix，并增加两种接入：

- **Agent Runtime**：Codex SDK、Claude Agent SDK、Gemini CLI/ACP、OpenCode。
- **Direct Model**：OpenAI/Anthropic/Gemini/Ollama 等直接 API。

两者不能混成一个配置项：

- Agent Runtime 自带规划、上下文和工具循环。
- Direct Model 由 Unterm Brain Adapter 承担 Agent Loop。

模型选择需要展示：

- Tool calling。
- Vision/PDF。
- Context。
- Local/cloud。
- 预计成本。
- 已验证版本。

## 3.9 Memory

OpenWorker 使用 SQLite Memory Store，支持：

- Workspace scope。
- Session scope。
- Keyed memory。
- 增、删、改、查。

### Unzoo One 增强

- Working / Episodic / Semantic 分层。
- 用户可视化管理。
- 敏感级别与加密。
- Source 和 confidence。
- TTL / retention。
- 每次 Memory read/write 的审计。
- 不允许模型静默建立永久敏感记忆。

## 3.10 成品与进度

OpenWorker 的 Cowork Prompt 强制：

- 工具任务先创建 Todo。
- 保持一个 `in_progress`。
- 最终交付实际文件。
- 用 `artifact:` 链接让用户一键打开。

这不是 Prompt 小技巧，而是产品协议。

### Unzoo One 学习方式

将其提升为运行时要求：

- 有工具的任务必须有可观察 Step。
- 成功 Task 必须产生 Result Summary 或 Artifact。
- Artifact 由 Registry 注册，不依赖模型手写路径协议。
- UI 能在模型失误时仍从 ToolCall/Filesystem 发现产物。

## 3.11 桌面与打包

OpenWorker：

- Python FastAPI 本地 Agent Server。
- React + Tauri Desktop。
- Server 使用每次启动 Token。
- macOS 签名/公证和自动更新。
- Windows 安装包。
- Rust STT Sidecar。
- Hermetic E2E 与真实 Server E2E 分开。

### Unzoo One 学习方式

- Unzoo One Desktop 是薄客户端。
- Unterm Core 是唯一控制平面。
- Unzoo daemon 是 Browser/Computer Provider。
- Installer 负责版本矩阵、安装、更新、回滚和自检。
- UI 测试继续区分 hermetic mock 与 live integration。

## 4. 能力覆盖矩阵

| 能力 | OpenWorker | Unzoo One 目标 |
|---|---|---|
| 成品交付 | 已有 | 完全覆盖；Artifact Registry 强化 |
| Chat/Cowork/Code | 已有 | Ask/Work/Code/Automate 统一入口 |
| 本地优先 | 已有 | 覆盖；增加 Client Identity/Lease |
| 多模型 API | 已有 | 覆盖 |
| Ollama | 已有 | V1 覆盖 |
| Agent SDK/CLI | 较弱 | Codex/Claude/Gemini/OpenCode 原生 |
| 权限模式 | 5 种 | 覆盖并增加细粒度 Scope |
| Approval Inbox | 已有 | 覆盖；多端唯一事实来源 |
| 定时 Automation | 已有 | 覆盖并扩展 Event Trigger |
| 长期授权 | 工具+目标 | 覆盖并升级 Capability Grant |
| Connector | 39 个 + MCP | MCP 全覆盖 + 重点原生 + 中国生态 |
| Memory | SQLite CRUD | 分层、可视、加密、可遗忘 |
| Browser | Playwright 独立浏览器 | Unzoo 真实 Chromium/Profile/Human Mode |
| 多账号浏览器 | 有限 | Unzoo Profile 隔离 |
| 反检测 | 非核心 | Unzoo 原生 |
| Terminal | Shell 工具 | Unterm PTY、真实会话、截图和审计 |
| 多 Agent | Subagent/Persona | Cockpit、Fleet、Review + Brain Router |
| Desktop Computer Use | 不完整 | Windows/macOS Observe–Act–Verify |
| 持久任务 | Session/Automation | Task/Run/Step/ToolCall 完整模型 |
| 幂等副作用 | 部分 | Provider 全链路 idempotency |
| 动作证据 | 部分 | before/after Evidence Contract |
| 手机接管 | 路线中 | 审批、通知、接管、紧急停止 |
| 中国本地生态 | 少 | 飞书、企业微信、钉钉、微信方向 |

## 5. Unzoo One 必须优先补齐的差距

当前规划相对 OpenWorker 仍有四个产品差距，必须调整：

### 5.1 Connector 不能全部放到后期

Private Alpha 至少需要：

- 任意 MCP Connector 导入。
- GitHub。
- 一个邮件 Connector。
- 一个日历 Connector。
- 一个双向消息入口。

否则只能证明执行技术，不能证明“个人数字同事”。

### 5.2 必须提供 Automate 入口

即使首版只支持 Cron，也要有：

- 创建时的能力预览。
- Standing Grant。
- Run History。
- Approval Inbox。
- 通知。

### 5.3 必须支持本地模型或无 API Key 路径

V1 加入 Ollama；首次 Alpha 可先允许用户使用已登录的 Codex/Claude，降低 API Key 配置成本。

### 5.4 Persona/Skill 必须有安装许可

Unzoo One 的 Skill/Persona 不能安装后自动获得工具权限。安装页必须展示：

- 它是谁。
- 能读取什么。
- 能修改什么。
- 会连接什么服务。
- 推荐运行模式。

## 6. 更可用的产品规则

1. **五分钟首个成品**，不是五分钟完成配置。
2. **一个 Inbox**，所有 Agent 和 Automation 共用。
3. **一个任务状态真相**，不向用户暴露互相矛盾的 calling/running。
4. **错误必须可行动**：Retry、Switch Brain、Reconnect Provider、Approve、Take Over。
5. **权限说人话**：展示动作、目标、影响和持续时间，不展示原始 JSON。
6. **自动化不等于放宽权限**。
7. **成品优先于对话**：首页突出 Artifact 和结果。
8. **自动检测优先于手工配置**。
9. **已有登录态优先复用**，但必须让用户选择具体 Browser Profile。
10. **用户随时可抢回控制权**。

## 7. 更广范围的产品边界

Unzoo One 的执行范围按层扩展：

```text
Ask
  → Files
  → Terminal
  → Browser
  → SaaS Connectors
  → Messaging Channels
  → Desktop Applications
  → Scheduled / Event-driven Work
  → Multi-agent Teams
```

每增加一层，都必须同时交付：

- Capability。
- Policy。
- Approval。
- Cancellation。
- Evidence。
- Audit。
- Recovery。

没有这些安全与可靠性闭环的“支持”，不算产品能力。

## 8. 结论

OpenWorker 已经证明了桌面数字同事的正确产品形态：

- 本地运行。
- 可换模型。
- 连接日常工具。
- 做完工作并交付成品。
- 重要动作先问用户。
- 无人值守仍不越权。

Unzoo One 不应偏离这些原则。我们的差异化建立在更强的底座之上：

- Unterm 提供真实终端、Headless Core、多 Agent 和可恢复任务。
- Unzoo 提供真实浏览器、多 Profile、Human Mode 和未来桌面操作。
- Unzoo One 提供比 OpenWorker 更统一的任务、授权、证据和跨设备体验。

产品验收口径不是“比 OpenWorker 多几个工具”，而是：

> 兼容它的核心使用方式，覆盖它的高频工作场景，并把执行范围从文件和 SaaS 扩展到真实终端、真实浏览器、桌面应用和长期自动化。
