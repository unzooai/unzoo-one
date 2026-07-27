# Unzoo One 交付路线图与开发 Backlog

> 状态：Draft
> 日期：2026-07-26
> 规划方式：以验收门槛推进，不以日期掩盖未完成能力

## 1. 仓库职责

### `unzooai/unzoo-one`

负责：

- 产品规格和跨仓库 Architecture Decision。
- Unzoo One Desktop / Web 产品体验。
- 安装、绑定和版本兼容矩阵。
- 端到端测试与发布清单。
- 产品文档和整合发行。

不负责：

- 重复实现 Task Engine。
- 重复实现浏览器自动化。
- 在 UI 层直接启动 Brain CLI 绕过 Unterm。
- 保存另一份权限、审批或审计真相。

### `zhitongblog/unterm`

负责：

- Headless Core。
- Task Engine。
- Brain Adapter。
- Policy / Approval。
- Provider Registry。
- Audit / Artifact。

对应 Issue：

- [#12 True Headless Core](https://github.com/zhitongblog/unterm/issues/12)
- [#13 Brain Adapter](https://github.com/zhitongblog/unterm/issues/13)
- [#14 Task Engine](https://github.com/zhitongblog/unterm/issues/14)
- [#15 Policy & Approval](https://github.com/zhitongblog/unterm/issues/15)
- [#16 PTY 授权旁路](https://github.com/zhitongblog/unterm/issues/16)
- [#17 Provider Registry](https://github.com/zhitongblog/unterm/issues/17)
- [#18 Audit & Artifact](https://github.com/zhitongblog/unterm/issues/18)
- [#20 总 Epic](https://github.com/zhitongblog/unterm/issues/20)

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

- Unterm Headless Core。
- SQLite Task Engine。
- Codex CLI JSONL Adapter。
- 统一 PTY Policy。
- Persistent Audit 最小实现。

退出标准：

- [ ] GUI 未启动时可创建并完成代码任务。
- [ ] Core 重启后任务不会消失。
- [ ] Cancel 能中断 Brain 与 PTY。
- [ ] 重复 idempotency key 不重复执行命令。
- [ ] #16 权限旁路关闭。

## M2：Browser Coworker

目标：

- 跑通 Unterm Core 到 Unzoo Browser Provider 的完整授权链。

范围：

- Provider Registry。
- Unzoo Client Identity 和 Lease。
- Browser Capability Manifest。
- Browser action evidence。
- Artifact 回传。

退出标准：

- [ ] Unterm 自动发现和绑定 Unzoo。
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
| ONE-C001 | P0-Blocker | unzoo-one | 冻结跨仓库对象和错误 schema | 无 | `contracts/v0` |
| ONE-C002 | P0-Blocker | unterm | 修复 PTY 授权旁路 | 无 | #16 测试通过 |
| ONE-C003 | P0 | unterm | Headless Core 最小服务 | C001 | 无 GUI CLI demo |
| ONE-C004 | P0 | unterm | SQLite Task Engine | C001,C003 | 重启恢复测试 |
| ONE-C005 | P0 | unterm | Codex JSONL Adapter | C001,C003 | Brain event demo |
| ONE-C006 | P0 | unterm | Claude Adapter | C001,C003 | Brain event demo |
| ONE-C007 | P0 | unterm | Policy/Approval v0 | C001,C004 | 决策解释测试 |
| ONE-C008 | P0 | unzoo | Structured Risk Metadata | C001 | Tool manifest |
| ONE-C009 | P0 | unzoo | Local Client Identity/Lease | C001 | 认证测试 |
| ONE-C010 | P0 | unterm | Provider Registry v0 | C001,C004 | Provider demo |
| ONE-C011 | P0 | unzoo | Unterm Native Binding | C009,C010 | 绑定自检 |
| ONE-C012 | P0 | unterm | Audit/Artifact v0 | C004,C007 | 证据包 |
| ONE-C013 | P0 | unzoo-one | First-run onboarding | C003,C011 | 5 分钟首个 Artifact |
| ONE-C014 | P0 | unzoo-one | Task Composer/Detail | C004,C005 | 四条主链路 |
| ONE-C015 | P0 | unzoo-one | Approval Inbox | C007 | 审批测试 |
| ONE-C016 | P0 | unzoo-one | Artifact Center | C012 | 打开/导出测试 |
| ONE-C017 | P0 | unzoo-one | Diagnostics | C003,C011 | 诊断包 |
| ONE-C018 | P0 | unzoo-one | 端到端测试套件 | C013-C017 | Alpha Gate |
| ONE-C019 | P0 | unterm | Automation 与 Attention Routing v0 | C004,C007 | 场景 D |
| ONE-C020 | P0 | unzoo-one | MCP Connector 导入与 Gallery | C010 | Connector demo |
| ONE-C021 | P0 | unzoo-one | GitHub + 邮件/日历 + 双向消息验证 | C020 | Connector E2E |
| ONE-C022 | P0 | unzoo-one | Ask/Work/Code/Automate 入口预设 | C014,C019 | 四入口 UX |
| ONE-C101 | P1 | unzoo | Desktop Observation | M3 | #66 |
| ONE-C102 | P1 | unzoo | Secure Desktop Input | C101 | #67 |
| ONE-C103 | P1 | unterm | Memory/Trigger/Connector | M3 | #19 |

## 4. 跨仓库契约清单

M0 建议建立：

```text
contracts/
  task/v0/
    task.schema.json
    event.schema.json
    approval.schema.json
    artifact.schema.json
  brain/v0/
    adapter.schema.json
    events.schema.json
  provider/v0/
    manifest.schema.json
    invoke.schema.json
    action-result.schema.json
  security/v0/
    risk.schema.json
    capability-grant.schema.json
```

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

1. 在本仓库增加 `contracts/v0`。
2. 完成 Task、Brain、Provider、Risk 四组 schema。
3. 用静态 mock 写一个完整任务事件样例。
4. 在 Unterm 实现 #16，再开始 Headless Core。
5. 在 Unzoo 实现 #68/#69，为 Binding 打基础。
6. 用 CLI 完成 M1/M2 后再实现完整产品 UI。
