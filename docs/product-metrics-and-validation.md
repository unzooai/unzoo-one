# Unzoo One 产品指标与验证计划

> 状态：产品规格草案
> 原则：衡量“用户获得了可验证结果”，不以对话轮数、Token 消耗或在线时长作为成功。

## 1. 产品北极星

**每周完成且被用户接受的验证结果数（Weekly Verified Outcomes, WVO）**

一个结果只有同时满足以下条件才计入：

- Task 进入 `completed`。
- 至少生成一个可查看 Artifact，或完成一个可验证的外部状态变化。
- 没有待处理的高风险审批。
- 用户未在 24 小时内标记“结果错误”或执行全量撤销。

北极星的价值在于同时约束可用性、执行力和可信度，避免产品通过制造更多任务或通知虚增数据。

## 2. 核心指标树

```text
Weekly Verified Outcomes
├── 激活用户数
│   ├── 安装与自检成功率
│   ├── Brain 连接成功率
│   └── 首个结果完成率
├── 人均有效任务数
│   ├── 任务启动率
│   ├── 端到端成功率
│   └── 自动化按期成功率
├── 结果接受率
│   ├── Artifact 打开/导出
│   ├── 用户接受或继续使用
│   └── 低撤销与低纠错
└── 信任与安全
    ├── 审批可理解率
    ├── 非预期副作用率
    └── 权限与隐私事件数
```

## 3. 激活漏斗

### 3.1 定义

| 阶段 | 成功定义 | Alpha 目标 |
| --- | --- | --- |
| 安装 | Desktop、Supervisor 和数据库正常 | ≥ 95% |
| 环境就绪 | Self-test 无阻断项 | ≥ 90% |
| Brain 就绪 | 至少一个 Brain 可响应 | ≥ 85% |
| 首个任务启动 | 提交真实或示例任务 | ≥ 80% |
| 首个结果完成 | 24 小时内获得 Artifact | ≥ 65% |
| 首周复用 | 七天内完成第二个真实任务 | ≥ 40% |

### 3.2 Time to First Value

关键时间点：

- `T_install_started`
- `T_app_interactive`
- `T_brain_ready`
- `T_first_task_submitted`
- `T_first_artifact_ready`
- `T_first_artifact_opened`

目标：中位首个 Artifact 时间小于 10 分钟；P90 小于 30 分钟。

## 4. 任务质量指标

### 4.1 成功率

- 端到端完成率：所有启动任务中进入 `completed` 的比例。
- 首次完成率：无需用户修改要求或重跑即成功。
- 恢复后完成率：首次失败后通过产品建议恢复成功。
- 外部变更确认率：写操作确实在目标系统产生预期状态。
- Artifact 接受率：用户打开、导出、发送或继续使用结果。

### 4.2 失败分类

所有失败必须归入稳定分类：

- `user_intent_unclear`
- `permission_denied`
- `approval_expired`
- `brain_error`
- `provider_unavailable`
- `provider_contract_violation`
- `authentication_required`
- `external_service_error`
- `environment_missing`
- `policy_blocked`
- `resource_exhausted`
- `cancelled_by_user`
- `unknown_outcome`
- `product_bug`

`unknown` 不是长期分类；每周必须审查并降低未知失败比例。

### 4.3 重复与纠错

- 同一意图 30 分钟内重复提交率。
- 用户追加“不是这个意思”的纠错率。
- 已完成任务的全量撤销率。
- Artifact 被手动大幅重写的比例。
- Provider 产生重复外部写入的次数。

## 5. 自动化指标

- 触发准点率。
- 无人值守完成率。
- 因审批转入 Inbox 的比例。
- Inbox 中位响应时间。
- 错过截止时间的任务数。
- 连续失败后正确暂停率。
- 自动化噪音率：无价值运行、重复结果或无操作通知。

无人值守不等于零审批。应单独衡量“无需注意完成率”和“正确请求注意率”，不能通过跳过审批提高前者。

## 6. 信任与安全指标

### 6.1 用户信任

- 审批卡一次读懂率。
- 用户查看“为什么需要此权限”的比例。
- 审批后立即撤销的比例。
- 长期授权主动收回率。
- 用户对任务执行过程可解释性的评分。

### 6.2 安全

| 指标 | 目标 |
| --- | --- |
| 未经授权的外部写入 | 0 |
| 重放造成的重复写入 | 0 |
| 跨工作区数据访问 | 0 |
| 凭据进入日志或诊断包 | 0 |
| 高风险操作无证据记录 | 0 |
| Prompt Injection 测试拦截率 | 100% 高危样本 |
| Emergency Stop 生效时间 | P95 < 2 秒 |

安全指标不能只依赖遥测。必须结合红队测试、审计抽样和用户报告。

## 7. 可靠性与性能指标

- 崩溃自由会话率。
- Provider 可用率与分位延迟。
- Task Event 丢失或乱序率。
- Desktop 重启后的恢复成功率。
- Action 状态为 `unknown_outcome` 的比例。
- CPU、内存、磁盘和浏览器 Profile 增长。
- 更新成功率、回滚率、迁移耗时。
- 各版本错误码分布与回归变化。

指标必须按 Desktop、Unterm、Unzoo、Brain Adapter 和 Connector 分组件归因。

## 8. 成本指标

本地优先不等于成本不可见。每个 Task 可展示：

- Brain 请求次数、Token 或本地推理耗时。
- 浏览器运行时间。
- 终端计算时间。
- Connector API 请求数。
- 预计费用区间，如供应商提供计价信息。

产品级指标：

- 每个 Verified Outcome 的平均模型成本。
- 不成功任务的浪费成本。
- 缓存、复用和小模型路由节省比例。
- 用户设置的日/月预算触发次数。

预算限制只能阻止新消费，不能破坏正在进行的原子写操作。

## 9. 隐私友好的事件字典

远程事件只记录结构化元数据。建议事件：

```text
app_installed
self_test_completed
brain_connected
task_created
task_started
task_state_changed
approval_requested
approval_resolved
artifact_created
artifact_opened
automation_triggered
provider_error
emergency_stop
update_completed
support_bundle_created
```

公共字段：

```json
{
  "eventName": "task_state_changed",
  "eventVersion": 1,
  "occurredAt": "2026-07-26T10:00:00Z",
  "installId": "random-resettable-id",
  "appVersion": "0.1.0",
  "platform": "windows",
  "properties": {
    "from": "running",
    "to": "waiting_approval",
    "mode": "work",
    "providerType": "unterm",
    "durationBucket": "10s-60s"
  }
}
```

禁止字段：

- Prompt、模型回复和文件内容。
- 文件名、绝对路径和 URL 全文。
- 命令文本、DOM、截图和剪贴板。
- Connector 对象名称、联系人或消息内容。
- API Key、Cookie、邮箱、手机号和设备用户名。

## 10. 定性研究计划

### 10.1 Alpha 用户组合

第一批 20–30 名用户覆盖：

- 开发者与独立创作者。
- 运营、销售和研究人员。
- 中小企业管理者。
- 熟悉 AI Agent 的高级用户。
- 不熟悉命令行但有明确工作流的普通用户。

不能只招募开发者，否则会高估用户对权限、终端和错误恢复的理解。

### 10.2 核心研究任务

每位用户至少完成：

1. 研究并形成一份可交付报告。
2. 整理本地文件并预览变更。
3. 使用浏览器处理一个有登录态的流程。
4. 创建一个每天运行的自动化。
5. 遇到一次审批、一次故障并完成恢复。

观察重点：

- 用户能否预测产品接下来会做什么。
- 用户是否理解审批的后果。
- 用户是否找到 Artifact、Inbox 和停止按钮。
- 失败时用户是否知道数据有没有被修改。
- 用户愿意把什么长期交给自动化。

### 10.3 访谈问题

- 哪个结果真正节省了你的时间？
- 哪一步让你最不放心？
- 哪次审批你看不懂或觉得多余？
- 如果它明天自动运行，你最担心什么？
- 你希望它记住什么，又绝不希望记住什么？
- 相比手动完成，你还需要验证多少遍？

## 11. 场景验收基准

### 11.1 研究任务

- 引用来源可打开。
- 事实与推断明确区分。
- 最终报告为独立 Artifact。
- 网页失败时保留已完成进度。

### 11.2 本地文件任务

- 修改前有清晰 Diff 或计划。
- 不越出用户授权目录。
- 可撤销操作提供恢复点。
- 同名冲突不静默覆盖。

### 11.3 浏览器任务

- 使用正确 Profile 和账户。
- 登录、付款、发送、发布前遵守审批策略。
- 关键动作有前后证据。
- 页面诱导不得扩大权限。

### 11.4 自动化任务

- 触发时间与时区正确。
- 失败重试不会重复写入。
- 需要注意时进入 Inbox。
- 连续失败达到阈值后暂停。

## 12. 实验纪律

每个产品实验必须写明：

- 假设。
- 目标用户。
- 主指标与护栏指标。
- 最小样本与观察周期。
- 结束条件。
- 隐私影响。

禁止以降低审批、隐藏风险或增加通知来提升表面转化。安全事件、非预期写入和用户撤销率是所有实验的全局护栏。

## 13. 阶段性 Go/No-Go

### 13.1 进入 Private Alpha

- 三条 MVP 主路径端到端可用。
- 首个 Artifact 中位时间 < 15 分钟。
- 已知高危安全缺陷为 0。
- 所有外部写操作可审计。
- Emergency Stop 演练通过。

### 13.2 扩大 Alpha

- 至少 50 个真实任务。
- 端到端完成率 ≥ 70%。
- Artifact 接受率 ≥ 60%。
- `unknown_outcome` < 1%。
- 未经授权外部写入为 0。
- 10 名以上用户完成第二周复用。

### 13.3 进入 Public Beta

- 至少 500 个真实任务和 100 个自动化运行。
- 端到端完成率 ≥ 85%。
- 首周复用率 ≥ 40%。
- 崩溃自由会话率 ≥ 99.5%。
- 高风险审批一次读懂率 ≥ 90%。
- 安全、数据导出和恢复演练全部通过。

## 14. 每周产品评审

固定评审以下内容：

1. 五个成功 Task 与五个失败 Task 的完整时间线。
2. 用户纠错、撤销和 Emergency Stop 案例。
3. Inbox 中等待最久的项目。
4. `unknown_outcome` 与 `product_bug` 根因。
5. Provider、Connector 和版本的质量对比。
6. 一项应删除或简化的摩擦。
7. 一项不能因增长压力而降低的安全门槛。

报表只是入口。真正的产品判断必须回到具体任务、具体证据与真实用户结果。
