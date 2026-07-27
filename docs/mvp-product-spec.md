# Unzoo One MVP 产品规格

> 状态：Draft
> 日期：2026-07-26
> 目标版本：Private Alpha

> 产品参考基线：完整学习 [OpenWorker](openworker-reference-analysis.md) 已验证的成品交付、本地优先、多模型、Connector、权限、Inbox 与 Automation 体验。

## 1. 产品定义

Unzoo One 是面向个人用户的本地 AI 工作台。用户只需要描述目标，系统即可选择合适的大脑，调用终端和浏览器完成任务，并在需要授权、登录或人工判断时把控制权交还给用户。

首版产品承诺：

> 一个任务入口，一套权限体系，一条可恢复的执行链，一份用户可以直接打开、分享或继续使用的最终成品。

Unzoo One 不是新的通用 Agent 框架，也不复制 Unterm 和 Unzoo 已有能力：

- **Unzoo One** 负责产品体验、安装绑定、版本契约和整体验收。
- **Unterm Core** 负责全局任务、大脑、权限、审批、审计和产物。
- **Unzoo** 负责浏览器观察、执行、Profile 和动作证据。
- **Brain Provider** 负责推理和规划，不持有最终权限。

## 2. 首批目标用户

### 2.1 独立开发者

典型任务：

- 调研技术方案，修改代码并运行测试。
- 追踪 Issue、阅读文档、生成实现计划。
- 在多个仓库间完成重复性维护。

核心价值：

- 浏览器调研和终端执行在一个任务中连续完成。
- 可以切换 Codex、Claude 等大脑。
- 所有命令、文件和网页动作可回看。

### 2.2 内容与运营人员

典型任务：

- 搜集资料并整理成文章或报告。
- 登录多个平台读取数据。
- 生成待发布内容，并在发布前请求批准。

核心价值：

- 复用浏览器登录态。
- 外部发布动作有明确的提交前审批。
- 最终文件、截图和来源统一保存。

### 2.3 小团队负责人

典型任务：

- 把一个目标拆成调研、实现、验证任务。
- 同时调用多个 Agent。
- 查看谁在做什么、哪里需要人工处理。

核心价值：

- 将 Unterm Cockpit/Fleet 投影为普通任务视图。
- 快速找到等待审批、失败或需要接管的步骤。

## 3. MVP 使用场景

MVP 核心执行闭环承诺三条主链路，并增加一条 Automation 验证链路。

### 场景 A：网页调研并形成报告

用户输入：

> 调研三款竞品，比较定位、价格和核心功能，最后生成一份 Markdown 报告。

系统流程：

1. 生成任务计划。
2. 选择 Codex 或 Claude。
3. 向 Unzoo 申请只读浏览器能力。
4. 浏览和提取页面内容。
5. 生成报告 Artifact。
6. 展示来源、执行记录和报告。

### 场景 B：代码任务

用户输入：

> 修复当前仓库的失败测试，不要提交远端。

系统流程：

1. 绑定工作区。
2. 生成 git checkpoint。
3. 向 Unterm 申请终端和文件修改能力。
4. Brain 修改代码并运行测试。
5. 输出 diff、测试结果和变更说明。
6. 不执行 commit 或 push。

### 场景 C：浏览器与终端混合任务

用户输入：

> 阅读这个 Issue，检查本地实现，给出修复方案并运行验证。

系统流程：

1. Unzoo 读取 Issue。
2. Unterm 检查仓库并运行诊断。
3. Brain 综合网页与本地上下文。
4. 根据权限选择只给方案或直接修改。
5. 生成诊断、diff 和测试 Artifact。

### 场景 D：周期任务与审批 Inbox

用户输入：

> 每个工作日上午整理 GitHub Issue 和日历，生成今日工作简报；不要自动发送给其他人。

系统流程：

1. 生成 Automation 及能力预览。
2. 用户批准数据源、时间和精确资源范围。
3. 无 GUI 时由 Unterm Core 触发。
4. 需要新增权限时进入 Approval Inbox，不提高自治等级。
5. 生成简报 Artifact 并通知用户。

## 4. MVP 非目标

Private Alpha 暂不承诺：

- 任意桌面应用的通用 Computer Use。
- 大规模 Connector 原生覆盖；Private Alpha 至少验证 MCP 导入、GitHub、一个邮件/日历数据源和一个双向消息入口。
- 自动支付、购买或转账。
- 无人审批的外部发布。
- 跨机器分布式任务。
- 企业多租户和组织级权限。
- 云端长期保存用户凭证或完整任务数据。
- 让多个大脑同时竞争同一个任务的自动仲裁。

## 5. 产品信息架构

### 5.1 Home

展示：

- 新建任务输入框。
- 最近任务。
- 等待审批。
- 需要人工接管。
- 失败任务。
- 最近产物。
- Unterm、Unzoo 和 Brain Provider 健康状态。

### 5.2 Task Composer

用户可设置：

- 目标描述。
- 工作区。
- Browser Profile。
- 首选 Brain 或自动选择。
- 执行模式。
- 权限范围。

执行模式：

| 模式 | 行为 |
|---|---|
| 只规划 | 不执行工具，只生成计划 |
| 审批后执行 | 所有 Mutation 首次执行前审批 |
| 范围内自动 | 在用户授权范围内自动执行 |

### 5.3 Task Detail

展示：

- 目标和当前状态。
- Plan / Run / Step 时间线。
- Brain 消息摘要。
- ToolCall 及其 Provider。
- 权限和审批记录。
- 实时终端或浏览器证据。
- Artifact。
- Stop、Pause、Resume、Take Over。

### 5.4 Approval Inbox

每个审批卡片必须回答：

- 谁要执行？
- 为哪个任务？
- 要调用什么能力？
- 会影响什么资源？
- 是否可逆？
- 不批准会怎样？
- 批准范围和有效期是什么？

支持：

- Allow once。
- Allow for task。
- Allow selected resources。
- Deny。

高风险动作不得提供模糊的“全部允许”。

### 5.5 Artifact Center

支持：

- 报告与文档。
- Diff / patch / checkpoint。
- 测试结果。
- 截图与动作证据。
- 下载文件。
- 任务证据包。

### 5.6 Settings & Diagnostics

设置：

- Brain Provider。
- Unterm Core。
- Unzoo Provider。
- Identity Profile 和 Vault。
- 默认审批策略。
- 数据保留和磁盘配额。

诊断：

- 组件版本。
- Provider 心跳。
- 最近失败调用。
- 数据库迁移版本。
- 日志导出。

## 6. 核心用户流程

### 6.1 首次启动

1. 检测或安装 Unterm Core。
2. 检测或安装 Unzoo。
3. 创建 Unzoo One Client Identity。
4. 绑定至少一个 Brain。
5. 运行本地自检。
6. 执行一个只读示例任务并生成真实 Artifact。

首次启动成功标准：

- 用户无需手工编辑 MCP 配置。
- 不要求复制 Token。
- 能明确看到数据保存位置。
- 默认权限仅允许只读演示。
- 从启动到看到第一个成品不超过 5 分钟。

### 6.2 创建任务

```text
输入目标
  → 选择上下文
  → 生成计划
  → 展示预计能力与风险
  → 用户确认
  → 创建 Run
```

### 6.3 工具调用

```text
Brain 请求工具
  → Unterm Policy 决策
  → 必要时 Approval
  → 签发 Capability Grant
  → Provider 执行
  → 返回 Evidence
  → 写入 Event 与 Artifact
  → Brain 继续
```

### 6.4 失败与恢复

失败后系统必须区分：

- 可自动重试。
- 需要重新规划。
- Provider 离线。
- 权限不足。
- 需要登录或人工接管。
- 无法安全继续。

用户只能看到可行动的状态，不能长期停留在模糊的 `calling` 或 `running`。

### 6.5 取消

取消顺序：

1. Task 标记 cancelling。
2. 中断 Brain。
3. 取消 Provider 动作。
4. 停止 PTY 子进程或 Workflow。
5. 释放 Lease。
6. 保存当前 Artifact。
7. Task 标记 cancelled 或 cancel_failed。

## 7. 功能需求

### ONE-001：统一任务入口

- 一个输入框创建跨终端和浏览器任务。
- 可先生成计划再执行。
- 任务拥有稳定 ID 和完整时间线。

### ONE-002：Brain 选择

- 支持 Codex 和 Claude。
- 用户可指定或选择 Auto。
- Auto 的选择理由可查看。
- Brain 切换不改变权限边界。

### ONE-003：能力预览

执行前展示计划可能需要：

- 工作区读写。
- 终端命令。
- Browser Profile。
- 域名访问。
- 下载。
- 外部发布。

### ONE-004：统一审批

- 所有审批由 Unterm Core 持久化。
- GUI、CLI 和移动端未来读取同一审批对象。
- Provider 不得自行把高风险动作降级为普通动作。

### ONE-005：实时状态

- 任务状态变化在 1 秒内显示。
- 每个 Step 有开始、结束、耗时和结果。
- Provider 离线、Brain 退出和等待用户必须明确区分。

### ONE-006：Artifact

- 每个成功任务至少生成一个结果或总结 Artifact。
- 每个 Mutation Step 可关联 before/after evidence。
- Artifact 可从任务详情直接打开。

### ONE-007：暂停、恢复和取消

- 用户可以暂停新工具调用。
- Resume 不重复已成功的副作用。
- Cancel 最终有明确结果。

### ONE-008：本地数据

- 默认数据目录明确。
- 用户可导出和删除任务。
- 凭证只保存到 Vault。
- Prompt、日志和 Artifact 遵守脱敏规则。

### ONE-009：组件健康

- Unterm、Unzoo、Brain 均有版本与心跳。
- 协议不兼容时阻止执行并给出升级建议。
- 设置页提供一键自检。

## 8. 安全基线

### 默认允许

- 读取终端屏幕。
- 读取明确工作区中的普通文件。
- 读取网页结构和公开页面。
- 创建本地非敏感 Artifact。

### 默认需要审批

- 修改文件。
- 执行非只读命令。
- 使用登录态 Profile。
- 下载和上传文件。
- 写剪贴板。

### 每次都需要审批

- 对外发布或发送消息。
- 删除或覆盖重要数据。
- 读取/导出 Cookie、密码和 Token。
- 支付、购买和金融操作。
- 扩大工作区、域名或窗口范围。

## 9. 体验指标

Private Alpha 的成功标准：

| 指标 | 目标 |
|---|---|
| 首个真实 Artifact 完成时间 | 5 分钟内 |
| 四条 MVP 主链路成功率 | ≥ 80% |
| 已完成副作用重复执行率 | 0 |
| Cancel 后继续动作 | 0 |
| 高风险动作无审批执行 | 0 |
| Provider 离线识别时间 | ≤ 5 秒 |
| UI 状态更新时间 | ≤ 1 秒 |
| 重启后任务可解释率 | 100% |

“可解释率”指任务在重启后必须是可恢复、已完成、失败、取消或中断之一，不能消失。

## 10. MVP 发布门槛

Private Alpha 发布前必须满足：

- Unterm Core 可无 GUI 运行。
- Codex 与 Claude 至少各有一个稳定 Adapter。
- Task Engine 可重启恢复。
- PTY 所有写入入口经过统一 Policy。
- Unzoo Browser Provider 完成认证绑定。
- 用户可以完成三条主链路。
- Automation、Approval Inbox 和 Run History 可完成场景 D。
- 支持任意 MCP Connector 导入，并至少验证一个日历/邮件数据源。
- Approval、Cancel、Artifact、Audit 端到端可用。
- 没有已知的高风险权限旁路。
