# 插件提案：feed-radar（信息源聚合与去重）

## 目的

`newsletter-digest` 和 `content-calendar` 都需要"从一组信息源里拿到自上次以来的新内容，去重、按主题分组"。这需要持久状态（已读记录、ETag/Last-Modified、失败重试），每次让智能体手写解析器不合适。

## 灵感来源

- RSSHub（AGPL-3.0）：给没有 RSS 的网站生成 feed（只借"路由"概念；用户可以指向自己的 RSSHub 实例）。
- Folo（AGPL-3.0）：AI RSS 阅读器，订阅 + 摘要。
- TrendRadar（GPL-3.0）：多平台热榜聚合、关键词筛选、推送提醒。
- 只借功能设计。

## 运行形态

- `[runtime] type = "service"`，本地 SQLite 存源列表、条目、已读状态。
- `network_access = true`，`allowed_domains` 由用户的源列表决定（添加源时显示给人确认）。
- 需要登录态或 JS 渲染的页面，走浏览器：`allowed_tools = ["tab_create", "browser_navigate", "browser_wait_for_network_idle", "extract_links", "extract_structured", "browser_get_text", "youtube_transcript"]`，只读。

## 工具（`mcp__unzoo__feed_radar__*`）

| 工具 | 输入 | 输出 |
| --- | --- | --- |
| `sources_list` / `sources_add` / `sources_remove` | 源（name、url、type、language、weight、keywords?） | 源列表 |
| `refresh` | `source_ids?` | 新条目数、失败源及原因 |
| `items` | `since?`（默认上次 `mark_used` 之后）、`topics?`、`limit` | 去重后的条目（标题、链接、来源、时间、摘要片段、同一事件的其它来源） |
| `mark_used` | `item_ids`, `issue` | 记录哪些条目进了哪一期 |
| `trends` | `platforms[]`（公开热榜）、`keywords?` | 当前热榜条目及抓取时间（只读公开页面） |

## 审批点

- 添加新源（新域名）显示给人确认。
- 只读，不发布。登录态源只取标题、链接和短摘要，不保存全文。

## 不做

- 不做评论/用户数据的爬取（这类项目如 MediaCrawler 不在本插件范围内）。
