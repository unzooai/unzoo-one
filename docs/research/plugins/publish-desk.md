# 插件提案：publish-desk（多平台发布台）

## 目的

把"打开某平台创作页 → 上传 → 填标题/正文/标签/封面/声明 → 停在发布按钮前 → 交给人"做成按平台维护的适配器，加一个发布记录。技能 `social-publish` / `blog-to-platforms` 让智能体每次靠快照摸索，可靠但慢、费 token；平台改版时每个智能体都要重新踩坑。适配器把每个平台的步骤、等待条件、上传方式（普通 vs trusted）集中维护，一处修好处处生效。

## 灵感来源

- social-auto-upload（MIT）：每平台一个上传器、每账号一份登录态、统一 `sau` CLI、给 Claude Code/Codex 的平台技能。
- Wechatsync（GPL-3.0）：复用浏览器登录态、默认存草稿、MCP 暴露"列平台 / 查登录 / 同步文章"。
- xiaohongshu-mcp（Apache-2.0）、xhs-toolkit（MIT）：把单平台发布做成 MCP 工具。
- Postiz（AGPL-3.0）、TryPost（AGPL-3.0）：统一的"帖子"数据模型 + 每平台 provider。
- 只借数据模型和流程设计。上述项目内部用 Playwright/Puppeteer/go-rod 的部分，全部改写成 Unzoo 工具调用。

## 运行形态

- `[runtime] type = "service"`。适配器是**声明式步骤文件**（每平台一个 JSON/YAML：入口 URL、要找的可访问名称、等待条件、上传方式、字段映射、限制），由 service 解释执行，逐步调用 Unzoo 工具。不写死 CSS 选择器：每步按可访问名称/角色在 `browser_a11y_snapshot` 结果里匹配，匹配失败就返回 `needs_agent` 让智能体接手当前步骤。
- `[permissions] allowed_tools`：`tab_create, browser_navigate, browser_a11y_snapshot, browser_click, browser_input_text, browser_press_key, browser_set_input_files, browser_upload_trusted, browser_wait_for_selector, browser_wait_for_network_idle, browser_get_text, browser_get_url, browser_screenshot`。不含 cookie_* 和 evaluate。
- `allowed_domains`：各平台创作后台域名（studio.youtube.com、creator.xiaohongshu.com、creator.douyin.com、member.bilibili.com、channels.weixin.qq.com、mp.weixin.qq.com、zhuanlan.zhihu.com、medium.com、x.com、linkedin.com、business.facebook.com 以及用户配置的 WordPress/Ghost 站点）。
- `network_access = false`（所有网络都在浏览器里发生）。

## 工具（`mcp__unzoo__publish_desk__*`）

| 工具 | 输入 | 输出 |
| --- | --- | --- |
| `platforms` | — | 已支持平台、每平台限制（标题/正文长度、图片数、视频规格）、适配器版本 |
| `check_session` | `platform`, `profile_id` | `signed_in` / `needs_sign_in`（+ 页面上显示的账号名），只读 |
| `validate` | `platform`, `post`（标题、正文、标签、媒体路径、封面、可见性、AI 声明、原创声明） | 不合规项列表（超长、比例不对、文件缺失） |
| `prepare` | `platform`, `profile_id`, `post`, `mode: draft|ready` | `job_id`；执行到"存草稿"（draft）或"停在发布前"（ready） |
| `job_status` | `job_id` | 当前步骤、截图路径、`needs_agent`/`needs_human`（附原因）、完成时的草稿链接 |
| `log` | `since?` | 发布记录（平台、账号名、标题、时间、状态、链接），不含凭据 |
| `record_result` | `job_id`, `url?`, `status` | 人发布后补记结果 |

## 审批点（硬规则，写在 service 里，不靠提示词）

1. **最终发布键不在任何适配器里**：步骤文件的 schema 不允许把"发布/发表/群发/定时发布/Post/Schedule/Submit"类按钮作为可点击目标；`ready` 模式结束时返回 `needs_human`，由智能体调用 `agent_session.handover`。
2. 文件上传：每次 `browser_set_input_files`/`browser_upload_trusted` 都经 Unzoo One 风险规则显示给人。
3. 登录、扫码、短信、滑块、风控：一律 `needs_human`，不做任何验证码处理。
4. 账号：只用调用方给的 `profile_id`；一次 `prepare` 只发一个账号；不提供批量多账号接口。
5. 不提供点赞、评论、关注、私信任何工具。

## 首批平台

YouTube Studio、小红书、抖音、B站、微信公众号（草稿）、知乎（草稿）、WordPress、X。对应的手工流程见 `examples/unzoo-browser-cases/`，可直接作为适配器的第一版步骤。
