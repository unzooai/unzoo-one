# 内容自动化插件设计（提案）

技能和插件怎么分、插件怎么带控制页面和自己的浏览器身份/模型、第一个外部插件 Xdoaipm 怎么接入：见 [xdoaipm-integration.md](xdoaipm-integration.md)。

这些是设计文档，没有实现代码。判断标准：

- **技能（SKILL.md）**：智能体用现有的终端（unterm）和 Unzoo Browser 工具就能做完，只缺"怎么做、什么时候停"的知识。见 `apps/unzoo-one/skills/`。
- **插件**：需要可复用的代码或新工具——每次都让智能体现写 ffmpeg 命令/解析器会出错、慢或不一致，或者需要常驻状态（队列、定时、去重）。

## Unzoo 插件机制（2026-11-19 只读查看本机 Unzoo Browser 2.5.58）

- REST：`GET /api/v1/plugins`（列表）、`POST /api/v1/plugins/install`（从 URL 或路径安装）、`/{id}/enable|disable|uninstall`、`POST /api/v1/plugins/{id}/run`（调用入口）。另有 `GET/POST /api/v1/scheduler` 与 `/{job_id}/pause|resume`、`DELETE /{job_id}`（定时任务）。
- 插件目录 `services/plugins/<id>/`，清单 `plugin.toml`（以自带的 `echo-plugin` 为例）：
  - `[plugin]` id / name / version / description / author；
  - `[runtime]` `type = "service"`、`entrypoint`（可执行文件）、`restart_policy`、`health_check_path`、`startup_timeout_secs`；
  - `[permissions]` `allowed_tools`（插件可调用的 Unzoo 工具白名单）、`allowed_domains`、`network_access`、`file_system_access`、`spawn_subprocess`；
  - `[[http_routes]]` `prefix`（REST 反代到插件服务）；
  - `[[mcp_tools_decl]]` name / description / `input_schema_file`——工具以 `mcp__unzoo__<plugin_id>__<tool>` 出现在 MCP 里（如 `mcp__unzoo__echo_plugin__echo`）；
  - `[[browser_inject]]` match / script / run_at / world（向匹配页面注入脚本）。
- 因此下面每个插件都写成：一个本地 service 可执行文件 + 声明的 MCP 工具 + 最小权限。发布类动作仍然走 Unzoo One 的审批（收件箱）和 `agent_session.handover`，插件自己不按最终"发布"键。

## 提案列表

| 插件 | 解决什么 | 优先级 |
| --- | --- | --- |
| [media-forge](media-forge.md) | 转写、字幕整形、剪辑、9:16 重构图、去静音、渲染——稳定的本地媒体工具集 | P0 |
| [publish-desk](publish-desk.md) | 各平台上传页的"填表到发布前一步"适配器 + 发布记录 + 审批交接 | P0 |
| [wechat-formatter](wechat-formatter.md) | Markdown → 公众号/知乎/头条可用的内联样式 HTML，主题可选 | P1 |
| [feed-radar](feed-radar.md) | RSS/页面/热榜聚合、去重、"自上次以来的新内容" | P1 |
| [content-scheduler](content-scheduler.md) | 内容日历存储 + 到点"准备好并提醒"，基于 Unzoo scheduler | P2 |

所有插件都遵守：不引入 Playwright / Puppeteer / Selenium / WebDriverIO / 原生 CDP 客户端；浏览器动作只通过 `allowed_tools` 里声明的 Unzoo 工具完成。
