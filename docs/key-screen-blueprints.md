# Unzoo One 关键页面与状态蓝图

> 版本：Screen Blueprints v0.1
> 依赖：[C1 产品设计系统](c1-product-design-system.md)、[产品体验详细规格](product-experience-spec.md)

## 1. 页面状态模型

所有一级页面都必须设计以下五类状态：

1. First use：第一次进入，没有历史数据。
2. Ready：正常可操作。
3. Running：存在活动任务或后台工作。
4. Attention：需要审批、输入或复核。
5. Degraded：Provider、网络、凭据或数据异常。

设计稿不能只展示 Ready 状态。

## 2. Onboarding

### 2.1 页面序列

| 步骤 | 内容 | 退出条件 |
| --- | --- | --- |
| Welcome | 品牌承诺与本地优先说明 | 开始设置 |
| Brain | Codex、Claude、本地模型 | 至少一个可用或选择稍后 |
| Capabilities | 检测 Unterm 与 Unzoo | Self-test 完成 |
| Workspace | 默认目录与 Browser Profile | Scope 已确认 |
| Safety | Standard 模式与审批说明 | 用户确认 |
| First outcome | 运行示例或真实任务 | Artifact 已打开 |

### 2.2 设计规则

- 每页只做一个决定。
- 步骤条只显示进度，不允许跳过安全说明。
- Brain 凭据输入不进入普通日志。
- Self-test 失败时提供修复，不把用户丢到文档。
- 最后一步以 Artifact 为完成标准，不以“配置成功”为标准。

## 3. Home

### 3.1 Ready

```text
┌ Primary Nav ┬─────────────────────────────────────────────┐
│             │ Good evening, Alex                         │
│             │ [ Hero Composer                          ] │
│             │                                             │
│             │ Needs attention                             │
│             │ [Approval] [Failed task] [Input required]   │
│             │                                             │
│             │ Recent work            Upcoming automation  │
└─────────────┴─────────────────────────────────────────────┘
```

优先级：

1. Composer。
2. Needs Attention。
3. Recent Artifacts。
4. Upcoming Automations。
5. Templates。

最近聊天不作为 Home 主体。

### 3.2 First Use

- C1 Flow Line 低透明度背景。
- Composer 中给出三个真实示例。
- 显示可访问的 Workspace 和已连接能力。
- 不展示空的统计卡片。

### 3.3 Running

- Composer 收缩。
- 顶部出现 Active Task Strip。
- Strip 显示当前步骤、运行时间、Pause、Open。
- 同时活动任务超过三条时只显示最高优先级三条。

### 3.4 Degraded

Home 顶部显示 System Banner：

- 缺失组件。
- 受影响能力。
- 仍可使用的能力。
- 修复入口。

## 4. New Task 与 Plan Preview

### 4.1 提交流程

```text
Compose
  → Intent parsing
  → Plan Preview
  → Access Preview
  → Start
```

简单只读任务可从 Compose 直接进入 Running，但 Access Preview 随时可查看。

### 4.2 Plan Preview

显示：

- 目标重述。
- 3–7 个高层步骤。
- 预计 Provider。
- 预计 Artifact。
- 可能的审批点。
- 成本与时间区间。

允许：

- 修改目标。
- 删除步骤。
- 禁用 Provider。
- 调整交付格式。

禁止让用户编辑模型内部推理。

## 5. Task Detail

### 5.1 Running 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Task Header                                                 │
├──────────────────────────────────────┬──────────────────────┤
│ Goal / Progress / Result             │ Activity Rail        │
│                                      │                      │
│ Step 1  completed                    │ 00:12 searched        │
│ Step 2  running                      │ 00:43 extracted       │
│ Step 3  pending                      │ 01:02 writing         │
│                                      │                      │
│ [Compact Composer]                   │ Evidence thumbnails  │
└──────────────────────────────────────┴──────────────────────┘
```

Task 页面不是聊天页面。自然语言交互位于底部 Compact Composer。

### 5.2 Waiting Approval

- 当前 Step 停止运行表现。
- Approval Card 插入当前 Step 下方。
- Activity Rail 显示“尚未发生外部写操作”。
- 页面标题和系统托盘出现 Attention 状态。
- 用户可以拒绝、修改 Scope、批准本次或查看证据。

### 5.3 Completed

页面重心从 Progress 转向 Result：

- 主 Artifact Preview 占据首屏。
- Summary。
- Sources / Evidence。
- Changes。
- Cost / Runtime。
- Follow-up actions。

完成动画不超过 600ms。

### 5.4 Failed

首屏必须显示：

- 失败步骤。
- 已完成进度。
- 是否产生修改。
- 最后成功 Checkpoint。
- Retry / Continue from checkpoint / Change provider。
- Diagnostic details 折叠入口。

### 5.5 User Takeover

Browser 或 Desktop 需要用户接管时：

- Task 进入 `waiting_user`。
- 主视区显示实时画面或明确的目标应用。
- 说明 One 暂停了哪些输入。
- 用户完成后点击“交还控制”。
- 接管期间不自动恢复输入动作。

## 6. Tasks

### 6.1 列表视图

筛选：

- Status。
- Mode。
- Workspace。
- Automation。
- Provider。
- Date。

每行：

- 标题。
- 状态。
- 当前步骤或结果。
- Mode。
- 更新时间。
- Artifact 数。
- Attention。

### 6.2 分组

默认分组：

- Needs attention。
- Running。
- Recent。
- Archived。

Running 永远排在 Recent 前，但不能盖过 Needs Attention。

## 7. Inbox

### 7.1 三列布局

```text
┌ Filter 220px ┬ Item list 380px ┬ Detail / Action         ┐
```

最小窗口下变为列表 → Detail 两层导航。

### 7.2 批量处理

只在以下条件同时满足时开放：

- 相同动作。
- 相同对象类型。
- 相同风险。
- 相同 Scope。
- 非 High / Critical。

### 7.3 SLA

显示：

- Requested at。
- Deadline。
- Consequence if ignored。

过期后按钮变为“重新评估”，不允许旧审批继续执行。

## 8. Automations

### 8.1 列表

顶部摘要只保留：

- Active。
- Needs attention。
- Failed last 24h。
- Next run。

不做复杂数据看板。

### 8.2 Builder

左侧步骤导航，右侧表单：

```text
Trigger
Goal
Access
Delivery
Test
```

Test 页面显示 Simulation Timeline。用户确认后才启用。

### 8.3 Run Detail

与普通 Task Detail 共用组件，但标明：

- Automation 来源。
- 计划触发时间。
- 实际开始时间。
- 重试次数。
- 幂等 Key。
- 下次运行。

## 9. Artifacts

### 9.1 Center

默认视图是最近 Artifact，而不是文件类型统计。

筛选：

- Type。
- Workspace。
- Task。
- Verified。
- Updated。

### 9.2 Viewer

顶部主动作：

- Open externally。
- Compare。
- Export。
- Share，若有 Connector。

删除 Artifact 前说明是否仍存在外部副本。

## 10. Integrations

### 10.1 Overview

分区：

- Brains。
- Execution Providers。
- Connectors。
- Skills。

每区先显示健康状态，再显示安装入口。

### 10.2 Detail

标签：

- Overview。
- Capabilities。
- Accounts。
- Permissions。
- Activity。
- Diagnostics。

Disconnect 默认保留历史 Task 与 Artifact，只撤销未来访问。

## 11. Memory

### 11.1 Overview

顶部先显示当前 Memory 状态：

- Enabled Scope。
- 最近新增。
- 即将过期。
- Sensitive items。

### 11.2 Review

用户可以：

- Edit。
- Forget。
- Change Scope。
- Set expiry。
- View source。

批量清除前生成可下载摘要。

## 12. Settings

左侧二级导航：

1. General
2. Brains
3. Permissions
4. Data
5. Notifications
6. Appearance
7. Updates
8. Diagnostics
9. Advanced

高风险开关：

- Always allow 外部写操作。
- Desktop Control。
- Unattended High Risk。
- Developer Mode。

这些开关不能直接 Toggle；点击后进入说明页或确认对话框。

## 13. Command Palette

`Ctrl/Cmd + K` 打开：

- New task。
- Go to。
- Search task/artifact。
- Run automation。
- Connect integration。
- Toggle density/theme。
- Diagnostics。

危险操作不直接执行，只导航到对应确认界面。

## 14. System Tray 与后台状态

Tray 菜单：

- Active Tasks。
- Needs Attention。
- Pause All。
- Open Unzoo One。
- Emergency Stop。
- Quit UI。

Quit UI 与 Stop Tasks 是两个动作。退出桌面端不自动终止安全运行中的后台任务。

## 15. 通知跳转

每个通知只跳转到可解决问题的位置：

| 通知 | 目标 |
| --- | --- |
| Approval | Inbox Detail |
| Task failed | Failed Step |
| Artifact ready | Artifact Viewer |
| Automation paused | Automation Run Detail |
| Provider offline | Integration Diagnostics |

通知不得只打开 Home。

## 16. 页面级验收场景

### SCREEN-001 首次运行

- 用户完成 Brain 与 Provider 检测。
- 十分钟内打开第一个 Artifact。
- 用户能找到任务访问范围与停止入口。

### SCREEN-002 跨 Provider 任务

- Task 同时调用 Unzoo 和 Unterm。
- Step 和 Activity Rail 能区分来源。
- 用户面对的仍是一个任务，而非两个工具页面。

### SCREEN-003 等待审批

- 所有运行暗示停止。
- 页面说明尚未产生写操作。
- 拒绝后 Task 能继续、结束或请求替代方案。

### SCREEN-004 组件降级

- Unzoo 离线时浏览任务被阻止。
- 本地只读任务仍可创建。
- Banner 清楚说明影响与恢复。

### SCREEN-005 恢复

- Desktop 崩溃后重新打开。
- Task 回到最后确认状态。
- Unknown Outcome 不自动重放。
