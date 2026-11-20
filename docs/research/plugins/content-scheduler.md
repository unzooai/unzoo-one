# 插件提案：content-scheduler（内容日历与到点准备）

## 目的

`content-calendar` 技能把日历写成 CSV；但"到周三上午把这条准备好并提醒我"需要定时器和状态。Postiz、Mixpost 这类工具会到点直接发——Unzoo One 的原则是到点**准备好并交给人**，不无人值守发布。

## 灵感来源

- Postiz（AGPL-3.0）：日历视图、每帖多平台、队列、MCP。
- Mixpost（MIT）：自托管的 Buffer 替代，账号/帖子/队列模型。
- TryPost（AGPL-3.0）：面向 AI 智能体的排期 + MCP。
- 只借数据模型（帖子 → 多个平台变体 → 时间槽 → 状态）。

## 运行形态

- `[runtime] type = "service"`，SQLite 存日历；时间触发用 Unzoo 已有的 `/api/v1/scheduler`（创建/暂停/恢复/删除 job），不自己跑 cron。
- 到点动作：在 Unzoo One 里创建一个任务（"准备《X》在小红书发布"），由智能体按 `social-publish` / `publish-desk.prepare(mode=ready)` 执行到发布前一步，然后进收件箱等人。
- `allowed_tools = []`（自身不碰浏览器），`network_access = false`。

## 工具（`mcp__unzoo__content_scheduler__*`）

| 工具 | 输入 | 输出 |
| --- | --- | --- |
| `calendar_import` / `calendar_export` | CSV 路径（与 `content-calendar` 技能列一致） | 条目数 / CSV 路径 |
| `slot_add` / `slot_update` / `slot_remove` | 日期时间、时区、平台、标题、素材路径、状态 | 条目 |
| `upcoming` | `days=7` | 未来条目 + 缺什么（素材未就绪、文案未写） |
| `arm_reminder` | `slot_id`, `lead_minutes` | 对应的 scheduler `job_id`；到点生成"准备任务"并通知人 |
| `disarm` | `slot_id` | — |

## 审批点

- `arm_reminder` 本身显示给人确认（它会在将来自动开始一个任务）。
- 到点只"准备"，最终发布/确认定时仍是人的点击。
- 不支持"同一内容按固定频率发多个账号"之类的批量排程。
