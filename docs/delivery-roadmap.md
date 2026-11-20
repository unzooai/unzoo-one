# Unzoo One 交付路线图与开发 Backlog

> 状态：Draft
> 日期：2026-07-26
> 规划方式：以验收门槛推进，不以日期掩盖未完成能力

> **归属修订 2026-08-06**：原划分把控制平面能力全部指派给 Unterm。已纠正为
> 「Unzoo One 是唯一控制平面，Unterm 与 Unzoo 是同级 Provider」。
> 见 `unzoo-one#2`、`unterm#20`、`unzoo#73`。

> **归属修订 2026-11-09（取代上一条的实现部分）**：Unterm 源码已并入本仓库 `unterm/`，
> 采用 `unterm#30` 的**路线 A**——运行时以 unterm 的 Rust 实现为准，`contracts/v0`
> 是它的对外接口，`one-core`（TypeScript）冻结并逐步迁移，Unterm 不再是可选组件。
> 详见 [ADR 0002](adr/0002-absorb-unterm-route-a.md)。下面 §1 尚未按此重写，冲突处以 ADR 为准。

## 1. 仓库职责

### `unzooai/unzoo-one`

负责（**唯一控制平面**）：

- 产品规格和跨仓库 Architecture Decision，以及 `contracts/v0` 契约的定义与冻结。
- `one-core` 自有常驻运行时。
- Task Engine、Policy/Approval/Grant/Inbox、Provider Registry、Workspace、Artifact Registry、Brain Router、Scheduler、Memory。
- Unzoo One Desktop / Web 产品体验。
- 一体化安装、Supervisor、绑定和版本兼容矩阵。
- 端到端测试与发布清单。

不负责：

- 重复实现浏览器自动化或终端本体。
- 在 UI 层直接启动 Brain CLI 绕过 one-core。
- 替 Provider 做它自己那一层的执行闸门（纵深防御的另一层由 Provider 各自实现）。

对应 Issue：`unzoo-one#2`（Epic）、`#3`–`#13`、
[#14 timestamp pattern 放宽](https://github.com/unzooai/unzoo-one/issues/14)（`contracts/v0` 冻结前处理）。

### `zhitongblog/unterm`

负责（**Terminal Provider**，同时是独立终端产品）：

- 终端本体：PTY、Session、Screen、Scrollback、Recording、Capture。
- Headless Core：终端不随 GUI 生死。
- Terminal Action Gateway：本地执行闸门，不信任调用方。
- 终端内 Agent 会话的结构化事件流。
- Provider 契约被动面：manifest、lease 校验、task context 贯穿、cancel、evidence。
- 自身的持久化动作日志。

不负责：通用 Task 引擎、Provider Registry、Workspace 模型、Artifact Registry、
Memory/Scheduler/Connector/Model Router、三进程 Supervisor。

**Unterm 为可选组件**——不需要终端的用户可以不安装。

对应 Issue：

- [#24 0.60 parity gate（唯一前置）](https://github.com/zhitongblog/unterm/issues/24)
- [#12 True Headless Core](https://github.com/zhitongblog/unterm/issues/12)
- [#13 终端内 Agent 事件流](https://github.com/zhitongblog/unterm/issues/13)
- [#15 Terminal Action Gateway](https://github.com/zhitongblog/unterm/issues/15)
- [#16 PTY 授权旁路](https://github.com/zhitongblog/unterm/issues/16)（已完成）
- [#18 Terminal 动作日志](https://github.com/zhitongblog/unterm/issues/18)
- [#22 Managed Agent 约束](https://github.com/zhitongblog/unterm/issues/22)
- [#26 Path Scope 强制](https://github.com/zhitongblog/unterm/issues/26)
- [#27 Provider Manifest / Lease](https://github.com/zhitongblog/unterm/issues/27)
- [#28 可被托管的运行时契约](https://github.com/zhitongblog/unterm/issues/28)
- [#30 contracts/v0 一致性缺口](https://github.com/zhitongblog/unterm/issues/30)（2026-09-04 新开，
  拿 schema 逐条对照 0.71.0 代码之后剩下的差异；第 0 项是控制平面归属，阻塞其余）
- [#20 总 Epic](https://github.com/zhitongblog/unterm/issues/20)

已迁往本仓库并关闭：#14 → `unzoo-one#5`、#17 → `unzoo-one#7`、
#19 → `unzoo-one#13`、#21 → `unzoo-one#9`、#23 → `unzoo-one#12`。

### `unzooai/unzoo`

负责：

- Browser Provider。
- Computer Provider。
- Profile、Cookie、代理和浏览器身份。
- Human Mode、Observe–Act–Verify。
- Provider 认证、Evidence 和取消。

对应 Issue：

- [#66 ComputerProvider 观察层](https://github.com/unzooai/unzoo/issues/66)
- [#67 Secure Desktop Input](https://github.com/unzooai/unzoo/issues/67)
- [#68 风险元数据](https://github.com/unzooai/unzoo/issues/68)
- [#69 localhost 认证与 Lease](https://github.com/unzooai/unzoo/issues/69)
- [#70 Unterm Native Binding](https://github.com/unzooai/unzoo/issues/70)
- [#71 统一任务和审计关联](https://github.com/unzooai/unzoo/issues/71)
- [#73 总 Epic](https://github.com/unzooai/unzoo/issues/73)

## 2. 里程碑

## M0：契约冻结

目标：

- 三个仓库对职责边界达成一致。
- 冻结 Task Event、Brain Adapter、Provider Manifest 和 Capability Grant v0。
- 建立版本兼容策略和端到端测试骨架。

退出标准：

- [ ] `Task/Run/Step/ToolCall/Approval/Artifact` schema 完成评审。
- [ ] Brain Event schema 完成评审。
- [ ] Provider Manifest 和 Invoke/Cancel/Event 接口完成评审。
- [ ] 风险等级和 Capability Grant 完成评审。
- [ ] 明确协议版本、向后兼容和错误格式。
- [ ] 三仓库各自建立对应 Epic。
- [ ] OpenWorker 核心能力覆盖矩阵成为产品验收基线。

## M1：Runtime Spine

目标：

- 在没有产品 UI 的情况下，用 CLI 跑通持久化任务。

范围：

- `one-core` 常驻运行时（One）。
- SQLite Task Engine（One）。
- Codex CLI JSONL Adapter（One 的 Brain Router + Unterm 的终端内 Agent 事件流）。
- 两层授权最小实现：One 的 Policy Gateway + Unterm 的本地闸门。
- Persistent Audit 最小实现（One 的证据链 + Unterm 的动作日志）。

退出标准：

- [ ] GUI 未启动时可创建并完成代码任务。（能创建、能跑完一次 Run，但还没有 Brain，
      所以「完成代码任务」这半条不算数）
- [x] Core 重启后任务不会消失。（`one-core/tests/persistence.test.ts`：关掉再打开，
      任务、Run、事件都在，序号接着往下走，链跨重启仍然接得上）
- [ ] Cancel 能中断 Brain 与 PTY。
- [ ] 重复 idempotency key 不重复执行命令。
- [ ] #16 权限旁路关闭。

## M2：Browser Coworker

目标：

- 跑通 one-core 到 Unzoo Browser Provider 的完整授权链，**不依赖 Unterm**。

范围：

- Provider Registry。
- Unzoo Client Identity 和 Lease。
- Browser Capability Manifest。
- Browser action evidence。
- Artifact 回传。

退出标准：

- [ ] one-core 自动发现和绑定 Unzoo。
- [ ] 未安装 Unterm 时链路仍完整。
- [ ] 完成“网页调研并生成报告”。
- [ ] Provider 离线在 5 秒内反映到 Task。
- [ ] Cancel 能停止 Workflow/CUA。
- [ ] 使用登录 Profile 前会请求审批。

## M3：Unzoo One Private Alpha

目标：

- 提供普通用户可以理解的任务、审批和产物界面。

范围：

- First-run onboarding。
- Home / Task Composer / Task Detail。
- Approval Inbox。
- Artifact Center。
- Automate / Run History。
- 任意 MCP Connector 导入。
- GitHub、一个邮件/日历数据源、一个双向消息入口。
- Settings & Diagnostics。
- Codex + Claude。

退出标准：

- [ ] 四条 MVP 主链路成功率达到 80%。
- [ ] 首个真实 Artifact 可在 5 分钟内完成。
- [ ] 所有高风险动作都有正确审批。
- [ ] Task 状态不出现长期模糊 `calling`。
- [ ] 端到端自检和诊断包可用。
- [ ] 无人值守只改变 Attention Route，不提高 Autonomy Policy。
- [ ] Automation 等待审批时进入同一个 Inbox。

## M4：Computer Use Preview

目标：

- 在受控窗口中验证桌面观察与输入闭环。

范围：

- Windows 窗口与 UI Automation。
- macOS Window/AX 观察。
- InputSimulator 接入。
- Observe–Act–Verify。
- 用户抢占与紧急停止。

退出标准：

- [ ] 输入只能作用于 Lease 绑定窗口。
- [ ] 焦点变化、过期截图和用户输入会安全停止。
- [ ] UAC/Secure Desktop 明确拒绝。
- [ ] 所有动作返回 before/after evidence。

## M5：Personal Assistant Beta

目标：

- 从一次性任务扩展到长期个人助理。

范围：

- Memory。
- Scheduler / Trigger。
- Mail / Calendar。
- 通知和移动审批。
- Model Router 与成本控制。

退出标准：

- [ ] GUI 关闭时定时任务仍可执行。
- [ ] 用户可查看、编辑和删除长期记忆。
- [ ] Connector 凭证不进入 Prompt。
- [ ] 手机可以审批和紧急停止。

## 3. 首批开发 Backlog

优先级定义：

- **P0-Blocker**：不完成就不能安全开始 MVP。
- **P0**：Private Alpha 必须完成。
- **P1**：Private Alpha 后进入。

| ID | 优先级 | 仓库 | 工作项 | 依赖 | 验收产物 |
|---|---|---|---|---|---|
| ONE-C001 | P0-Blocker | unzoo-one | 冻结跨仓库对象和错误 schema（`unzoo-one#3`） | 无 | `contracts/v0` |
| ONE-C002 | P0-Blocker | unterm | 修复 PTY 授权旁路（`unterm#16`） | 无 | 已完成 |
| ONE-C003 | P0 | unzoo-one | **one-core 常驻运行时**（`unzoo-one#4`） | C001 | 骨架已完成：`one-core/`，`npm run cli demo` |
| ONE-C004 | P0 | unzoo-one | SQLite Task Engine（`unzoo-one#5`） | C001,C003 | 重启恢复测试 |
| ONE-C005 | P0 | unzoo-one | Brain Router + Codex Adapter（`unzoo-one#10`） | C001,C003 | Brain event demo |
| ONE-C006 | P0 | unzoo-one | Claude Adapter（`unzoo-one#10`） | C001,C003 | Brain event demo |
| ONE-C007 | P0 | unzoo-one | Policy/Approval v0（`unzoo-one#6`） | C001,C004 | 决策解释测试 |
| ONE-C008 | P0 | unzoo | Structured Risk Metadata | C001 | Tool manifest |
| ONE-C009 | P0 | unzoo | Local Client Identity/Lease | C001 | 认证测试 |
| ONE-C010 | P0 | unzoo-one | Provider Registry v0（`unzoo-one#7`） | C001,C004 | Provider demo |
| ONE-C011 | P0 | unzoo | Orchestrator Binding（绑定对象改为 One） | C009,C010 | 绑定自检 |
| ONE-C012 | P0 | unzoo-one | Artifact Registry 与证据链 v0（`unzoo-one#8`） | C004,C007 | 证据包 |
| ONE-C023 | P0 | unterm | 0.60 终端 parity gate（`unterm#24` 阶段 A） | 无 | parity 台账 |
| ONE-C024 | P0 | unterm | Terminal Provider 化（`unterm#15`/`#26`/`#27`） | C001,C023 | Provider Contract Suite |
| ONE-C025 | P0 | unzoo-one | Workspace Context & Isolation（`unzoo-one#9`） | C004,C007 | 隔离与穿越测试 |
| ONE-C026 | P0 | unzoo-one | Tool Routing 决策（`unzoo-one#11`） | C007,C010 | 旁路测试 |
| ONE-C027 | P0 | unzoo-one | Supervisor 与一体化安装（`unzoo-one#12`） | C003,C010 | 安装/升级/回滚 E2E |
| ONE-C013 | P0 | unzoo-one | First-run onboarding | C003,C011 | 5 分钟首个 Artifact |
| ONE-C014 | P0 | unzoo-one | Task Composer/Detail | C004,C005 | 四条主链路 |
| ONE-C015 | P0 | unzoo-one | Approval Inbox | C007 | 审批测试 |
| ONE-C016 | P0 | unzoo-one | Artifact Center | C012 | 打开/导出测试 |
| ONE-C017 | P0 | unzoo-one | Diagnostics | C003,C011 | 诊断包 |
| ONE-C018 | P0 | unzoo-one | 端到端测试套件 | C013-C017 | Alpha Gate |
| ONE-C019 | P0 | unzoo-one | Automation 与 Attention Routing v0 | C004,C007 | 场景 D |
| ONE-C020 | P0 | unzoo-one | MCP Connector 导入与 Gallery | C010 | Connector demo |
| ONE-C021 | P0 | unzoo-one | GitHub + 邮件/日历 + 双向消息验证 | C020 | Connector E2E |
| ONE-C022 | P0 | unzoo-one | Ask/Work/Code/Automate 入口预设 | C014,C019 | 四入口 UX |
| ONE-C101 | P1 | unzoo | Desktop Observation | M3 | #66 |
| ONE-C102 | P1 | unzoo | Secure Desktop Input | C101 | #67 |
| ONE-C103 | P1 | unzoo-one | Memory/Trigger/Connector/Model Router（`unzoo-one#13`） | M3 | 平台能力验收 |

## 4. 跨仓库契约清单

已建成（2026-09-03）。布局按版本分根，不是按域分版本——每个对象自带
`schema_version`，整个 v0 一起升级：

```text
contracts/v0/
  common/      primitives.schema.json、error.schema.json
  task/        task、run、step、tool-call、approval、inbox-item
  brain/       adapter、thread、events
  provider/    manifest、invoke、action-result
  security/    risk、capability-grant、policy-decision
  workspace/   workspace、capability-scope
  artifact/    artifact
  automation/  automation
  events/      envelope
  examples/    示例 + 一次完整任务的事件流
  invalid/     反例固件
```

用法和版本策略见 [`contracts/v0/README.md`](../contracts/v0/README.md)，
校验跑 `npm run test:contracts`。

契约原则：

- JSON Schema 是跨语言唯一事实来源。
- Rust/TypeScript/Python 类型由 schema 生成或验证。
- 每个请求都带 protocol version。
- 新字段默认可忽略；破坏性变更必须升级 major。
- 错误必须有稳定 code，不能要求调用方解析 message。

## 5. 端到端测试矩阵

### 正常路径

- Browser readonly research。
- Terminal code modification。
- Browser + terminal mixed task。
- Artifact creation and export。

### 权限路径

- Allow once。
- Allow for task。
- Deny。
- Grant expiry。
- Resource scope escalation。
- External commit approval。

### 恢复路径

- Brain 崩溃。
- Unterm Core 重启。
- Unzoo 离线并恢复。
- GUI 关闭并重开。
- 网络中断。
- Cancel during tool execution。

### 安全路径

- PTY 等价入口旁路测试。
- Provider 使用过期 Lease。
- 重复 idempotency key。
- 未声明风险的 Mutation。
- Cookie/Token 日志脱敏。
- Artifact 路径越界。

## 6. 发布策略

### Private Alpha

- 邀请制。
- Windows 优先，macOS 保持协议兼容。
- 默认仅 Terminal + Browser。
- 遥测默认关闭；诊断包由用户主动导出。
- 高风险能力默认关闭。

### Beta

- 增加 macOS 完整支持。
- Computer Use Preview。
- Memory、Trigger 和首批 Connector。
- 可选匿名稳定性遥测。

### General Availability

- 自动更新与回滚。
- 数据迁移和备份。
- 安全审计完成。
- 权限文档和隐私文档完成。
- 支持生命周期和兼容矩阵公开。

## 7. 当前下一步

按顺序执行：

1. ~~在本仓库增加 `contracts/v0`（`unzoo-one#3`，P0-Blocker）。~~ 2026-09-03 完成。
2. ~~完成 Task、Brain、Provider、Risk、Workspace scope、Error 六组 schema~~ 已完成；
   **三仓库共同评审冻结待办**——这是 M0 剩下的唯一一件事。
3. ~~用静态 mock 写一个完整任务事件样例。~~ 见
   `contracts/v0/examples/task-event-stream.json`（22 条事件，从创建到产物）。
4. ~~建立 `one-core` 骨架（`unzoo-one#4`）：认证 IPC、single-instance、SQLite、事件 cursor。~~
   2026-09-05 完成，见 [`one-core/README.md`](../one-core/README.md)。四件事都落地了，
   `npm run cli demo` 是 ONE-C003 的验收物；Brain、Provider、Policy 还没接。
5. 先接 Unzoo Browser Provider 跑通场景 A（不依赖终端），验证边界成立。
6. Unterm 完成 `unterm#24` 阶段 A 后，按 `unterm#27` 作为 Terminal Provider 接入。
7. 用 CLI 完成 M1/M2 后再实现完整产品 UI。
