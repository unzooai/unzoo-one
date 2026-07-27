# Unzoo One 产品体验详细规格

> 状态：Draft
> 日期：2026-07-26
> 适用版本：Private Alpha → Beta

## 1. 体验目标

用户不需要理解 Agent、MCP、Provider、PTY 或 Capability Lease。用户只需要理解：

1. 我要什么结果。
2. 系统准备怎么做。
3. 它现在做到哪里。
4. 为什么需要我。
5. 最终产物在哪里。

产品体验的核心不是 Chat，而是 **Outcome Workspace**。

每个任务都必须持续回答：

```text
目标是什么？
当前在做什么？
使用了哪些数据和能力？
是否需要用户决定？
最终产生了什么？
```

## 2. 全局导航

桌面端主导航：

| 导航 | 目的 |
|---|---|
| Home | 新建任务、查看需要关注的事情 |
| Tasks | 所有一次性任务和运行历史 |
| Inbox | 跨任务审批、问题、接管和通知 |
| Automations | 定时和事件驱动任务 |
| Artifacts | 所有成品与证据 |
| Integrations | Brain、Provider、Connector、MCP、Skill |
| Memory | 个人记忆及其来源和权限 |
| Settings | 数据、权限、更新、诊断 |

全局状态栏：

- Unterm Core 状态。
- Unzoo 状态。
- 当前活动 Brain 数量。
- 运行中 Task 数量。
- 等待用户数量。
- 紧急停止按钮。

紧急停止：

- 永远可见。
- 第一次点击暂停所有新工具调用。
- 二次确认后中断全部活动 Brain 和 Provider Action。
- 不删除任务数据。
- 显示仍无法停止的外部动作。

## 3. Home

## 3.1 页面结构

从上到下：

1. Greeting + Composer。
2. Attention Strip。
3. Running Tasks。
4. Recent Results。
5. Suggested Automations。
6. System Health。

## 3.2 Composer

默认占位文案：

> 想完成什么？可以交给我调研、写文档、处理代码，或定期帮你做。

输入支持：

- 文本。
- 拖入文件。
- 粘贴图片。
- 粘贴 URL。
- 选择工作区。
- `@` 引用 Integration、Profile、Artifact 或 Task。
- 语音输入。

输入下方提供四个模式：

| 模式 | 用户语言 | 默认能力 |
|---|---|---|
| Ask | 问一下 | 无副作用，最小上下文 |
| Work | 做件事 | 文件、浏览器、Connector、Artifact |
| Code | 改代码 | Git、文件、终端、测试 |
| Automate | 定期做 | Trigger、Standing Grant、Inbox |

默认自动推荐模式，但推荐结果可改。

高级选项折叠显示：

- Brain：Auto / Codex / Claude / Gemini / Local。
- Workspace。
- Browser Profile。
- Permission Mode。
- Max cost。
- Deadline。
- 是否先看计划。

## 3.3 Attention Strip

只展示可行动事项：

- `3 个审批等待你`
- `1 个任务需要登录`
- `2 个任务失败，可重试`
- `Unzoo 已离线`

不展示普通成功通知。

点击后进入对应筛选视图。

## 3.4 空状态

首次用户：

- 展示三个真实任务模板。
- 不展示空白统计图。
- 首个模板必须只读且能生成 Artifact。

模板：

1. “总结这三个网页并生成报告。”
2. “检查这个代码仓库并生成技术概览。”
3. “每天早上生成今日工作简报。”

## 4. Task Composer 详细流程

## 4.1 目标解析

提交后先创建 Draft Task，不立即执行。

系统展示：

- 目标理解。
- 建议输出。
- 预计步骤。
- 预计能力。
- 预计风险。
- 预计成本区间。

简单 Ask 可以跳过 Plan；涉及工具的 Work/Code 默认生成 Plan Preview。

## 4.2 Plan Preview

Plan Card 包含：

- 任务目标。
- 3–8 个用户可理解步骤。
- 每步预计使用的 Provider。
- 预计产生的 Artifact。
- 权限升级点。
- 不确定事项。

按钮：

- Start。
- Edit goal。
- Change access。
- Change brain。
- Cancel。

Plan 只是执行意图，不是永久批准。执行期间若实际动作超出预览范围，仍需审批。

## 4.3 Access Preview

按资源分组：

```text
Files
  Read: D:\projects\demo
  Write: D:\projects\demo\reports

Browser
  Profile: Work
  Domains: github.com, docs.example.com

Terminal
  Commands: git status, test runner

External
  None
```

用户可以：

- 移除资源。
- 将读写改为只读。
- 限定域名。
- 改用空白 Browser Profile。
- 要求所有命令逐次审批。

## 5. Task Detail

## 5.1 顶部摘要

展示：

- Task title。
- User goal。
- 状态。
- 当前 Step。
- 已运行时间。
- Brain。
- Workspace / Profile。
- Pause / Resume / Stop。

状态文案必须是用户语言：

| 内部状态 | UI 文案 |
|---|---|
| `draft` | 草稿 |
| `queued` | 等待开始 |
| `planning` | 正在制定计划 |
| `running` | 正在工作 |
| `waiting_approval` | 等待你批准 |
| `waiting_human` | 需要你接管 |
| `waiting_provider` | 等待组件恢复 |
| `paused` | 已暂停 |
| `cancelling` | 正在停止 |
| `succeeded` | 已完成 |
| `failed` | 未完成 |
| `cancelled` | 已取消 |
| `interrupted` | 被中断，可恢复 |

禁止直接展示 `calling`。

## 5.2 Progress

每个 Step 行显示：

- 序号和标题。
- 状态。
- Provider icon。
- 开始/结束时间。
- 简短结果。
- Artifact 数量。
- 重试次数。

Step 展开后显示：

- Brain decision summary。
- ToolCall。
- Approval。
- Evidence。
- Error 和 recovery action。

默认隐藏完整 reasoning，不把私有推理当产品功能。可以展示简洁的 reasoning summary。

## 5.3 Live Work

右侧或底部可切换：

- Terminal。
- Browser Live View。
- Computer View。
- Logs。

规则：

- 默认只显示当前活动 Provider。
- Live View 与实际任务状态绑定。
- 用户进入 Take Over 后 Agent 自动暂停。
- Take Over 结束需显式 Resume。

## 5.4 Timeline

Timeline 是只读事实记录：

```text
10:03 Task created
10:03 Plan approved
10:04 Read github.com/...
10:05 Approval requested: write report.md
10:06 Approved once
10:07 Artifact created
10:07 Task completed
```

每条记录可以展开查看：

- Actor。
- Provider。
- Grant。
- Resource。
- Evidence。

## 5.5 Result

完成后页面默认聚焦 Result，而不是 Transcript。

Result 包含：

- 完成摘要。
- 主要 Artifact。
- 关键来源。
- 变更影响。
- 验证结果。
- 未完成事项。
- 建议下一步。

按钮：

- Open。
- Reveal in folder。
- Export。
- Share。
- Continue task。
- Turn into automation。

## 6. Approval Inbox

## 6.1 Inbox Item 类型

- Approval。
- Question。
- Plan。
- Directory request。
- Login / MFA handoff。
- Provider reconnect。
- Notification。

状态：

```text
pending → resolved
pending → expired
pending → cancelled
```

一次解决，First responder wins。

## 6.2 Approval Card

卡片必须显示：

- 动作：将要做什么。
- 目标：作用于哪里/谁。
- 内容：将写入、发送或执行什么。
- 影响：本地还是外部。
- 可逆性。
- 来源 Task 和 Step。
- 请求者 Brain。
- 授权持续时间。

按钮按风险变化：

### Local mutation

- Allow once。
- Allow for task。
- Deny。

### Exec

- Run once。
- Allow exact command for task。
- Deny。

不允许基于字符串前缀模糊授权带 Shell operator 的命令。

### External side effect

- Send/Publish once。
- 对支持精确 target 的 Automation 可 `Always for this automation`。
- Deny。

### Credential / Financial / Destructive

- 每次明确批准。
- 不提供 Always。
- 二次确认展示最终目标和影响。

## 6.3 Inbox 路由

唯一事实源在 Unterm Core。

Transport：

- In-app。
- System notification。
- Slack。
- Telegram。
- 飞书。
- 企业微信。
- 手机 App。

任一 Transport 回答后其他端立即显示已处理。

审批所有者：

- 默认仅设备主人。
- 可为团队任务指定 Approval Owner。
- 非 Owner 可查看时必须脱敏敏感内容。

## 7. Automations

## 7.1 列表

显示：

- 标题。
- Schedule/Trigger。
- 下次运行。
- 最近状态。
- 未读结果。
- Pending approval。
- Enabled。

## 7.2 创建

支持自然语言和表单：

- Instructions。
- Trigger。
- Workspace/Profile。
- Brain。
- Output。
- Notification route。
- Standing Grants。
- Budget。
- Timeout。
- Concurrency。

创建前必须展示：

- 每次会读取什么。
- 每次允许写入/发送什么。
- 哪些动作仍会每次审批。

## 7.3 Trigger

Alpha：

- Cron。
- Once。

Beta：

- Webhook。
- File changed。
- Email received。
- Calendar event。
- GitHub event。
- Provider event。

## 7.4 Run History

每次 Run 有独立：

- 状态。
- Session。
- Artifact。
- Approval。
- Cost。
- Trigger reason。
- Retry。

Automation 的 Standing Grant 在 Automation 页面可逐条撤销。

## 8. Artifact Center

## 8.1 分类

- Documents。
- Code changes。
- Data。
- Images/video。
- Downloads。
- Evidence。
- Task export。

## 8.2 Artifact Card

展示：

- 名称和预览。
- 类型与大小。
- 来源 Task。
- 创建时间。
- Workspace。
- 敏感级别。
- 验证状态。

## 8.3 版本

同一逻辑 Artifact 可有多个版本：

- Draft。
- Revised。
- Final。

版本之间显示：

- 创建者。
- 来源 Run。
- Diff。
- Validation。

## 8.4 清理

用户可：

- Pin。
- Delete。
- Set retention。
- Reveal。
- Export。

删除前显示是否被 Task、Memory 或 Automation 引用。

## 9. Integrations

分组：

- Brains。
- Providers。
- Connectors。
- MCP Servers。
- Skills & Personas。

统一 Integration Card：

- 名称、图标、状态。
- 能做什么。
- 已授权资源。
- 最近使用。
- 健康。
- 版本。
- Configure / Test / Pause / Disconnect。

## 9.1 Brain

展示能力标签：

- Tools。
- Vision。
- PDF。
- Local。
- Context。
- Cost tier。
- Verified。

支持：

- Agent Runtime 登录态。
- API Key。
- Ollama。
- Custom endpoint。

## 9.2 Provider

Unterm 和 Unzoo 是系统 Provider：

- 默认置顶。
- 不与普通 SaaS Connector 混排。
- 显示协议兼容性。
- 支持一键自检。

## 9.3 Connector

连接流程：

1. 展示用途和风险。
2. 选择 Managed OAuth 或 Manual。
3. 完成认证。
4. 选择账户/组织/Workspace。
5. 设置默认只读权限。
6. Test。

Disconnect：

- 撤销本地 Token。
- 尝试撤销远端授权。
- 关闭相关 Trigger。
- 保留历史审计但脱敏。

## 9.4 Skill / Persona

安装页展示：

- 作者和来源。
- Prompt/Instructions 摘要。
- Tools。
- Connector。
- Risk classes。
- 推荐 Mode。
- 数据访问范围。

新安装默认 disabled，用户确认后启用。

## 10. Memory

页面分组：

- About me。
- Preferences。
- People。
- Projects。
- Routines。
- Session memories。

每条 Memory 显示：

- 内容。
- Scope。
- 来源。
- Confidence。
- 创建者。
- 最近使用。
- Retention。

操作：

- Edit。
- Forget。
- Mark sensitive。
- Restrict to workspace。
- 查看使用历史。

永久 Memory 写入敏感信息前必须审批。

## 11. Settings

### General

- Language。
- Launch at login。
- Default mode。
- Download directory。
- Theme。

### Permissions

- Default policy。
- Standing Grants。
- Trusted roots。
- Browser Profiles。
- Blocked capabilities。

### Data

- Data directory。
- Size usage。
- Retention。
- Backup/export。
- Delete all data。

### Notifications

- In-app。
- System。
- Connector routing。
- Quiet hours。

### Updates

- Channel。
- Current versions。
- Check update。
- Rollback。

### Diagnostics

- Component health。
- Protocol matrix。
- Recent errors。
- Selftest。
- Export support bundle。

## 12. 错误与恢复体验

错误必须包含：

- 发生了什么。
- 是否产生副作用。
- 系统已经做了什么。
- 用户现在能做什么。

标准 Recovery Actions：

- Retry。
- Retry with another brain。
- Reconnect provider。
- Change access。
- Open login。
- Take over。
- Resume from checkpoint。
- Stop and keep results。

示例：

错误文案不要写：

> Tool call failed: 500.

应写：

> GitHub 暂时没有响应。没有创建或修改任何内容。你可以重试，或先保留已经生成的本地报告。

## 13. 通知规则

发送通知：

- 等待审批。
- 等待登录/MFA。
- Task 完成。
- Task 失败且不能自动恢复。
- Automation 连续失败。
- Provider 长时间离线。

不发送：

- 普通 Step 完成。
- 自动重试。
- 短暂网络抖动。

通知点击必须打开具体 Task/Inbox Item，而不是 Home。

## 14. 可访问性与本地化

- 全键盘操作。
- 清晰 focus ring。
- Screen reader label。
- 不仅用颜色表达风险和状态。
- 支持系统字体缩放。
- 中英文首发。
- 时间、时区、数字和路径按系统 Locale。
- 技术名词保留英文但提供解释。

快捷键：

| 操作 | 快捷键 |
|---|---|
| New task | `Ctrl/Cmd+N` |
| Open Inbox | `Ctrl/Cmd+Shift+A` |
| Pause current | `Ctrl/Cmd+Shift+P` |
| Emergency stop | 可配置，避免误触 |
| Command palette | `Ctrl/Cmd+K` |

## 15. 验收用例

### UX-001 首次成品

- 新用户不编辑配置文件。
- 选择或检测 Brain。
- 自动绑定 Unterm/Unzoo。
- 运行只读模板。
- 5 分钟内打开 Artifact。

### UX-002 跨 Provider 任务

- Browser 读取 Issue。
- Terminal 检查本地仓库。
- Task Detail 显示统一 Step。
- 最终生成报告和 diff。

### UX-003 无人值守审批

- Automation 触发。
- 遇到未授权外部动作。
- Run 停在 waiting_approval。
- Inbox/消息渠道收到同一 Item。
- 任一渠道回答一次后恢复。

### UX-004 用户接管

- Agent 正在操作 Browser。
- 用户点击 Take Over。
- Agent 停止新动作。
- 用户完成登录。
- 点击 Resume 后从原 Step 继续。

### UX-005 组件故障

- Unzoo 离线。
- Task 进入 waiting_provider。
- UI 不显示模糊 running。
- 恢复后按策略继续，不重复已完成动作。
