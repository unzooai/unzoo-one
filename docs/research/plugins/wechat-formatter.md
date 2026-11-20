# 插件提案：wechat-formatter（Markdown → 平台排版）

## 目的

公众号编辑器只认内联样式 HTML，外链不可点，代码块、表格、公式需要特殊处理；知乎、头条、掘金各有细节。让智能体每次手写转换脚本既慢又不稳定。插件提供确定性的 Markdown → 平台 HTML 转换和若干主题。

## 灵感来源

- doocs/md（WTFPL）：微信 Markdown 编辑器，主题、代码高亮、外链转脚注。
- 文颜 wenyan / wenyan-mcp（Apache-2.0）：Markdown 排版后发布到公众号、头条、知乎的 MCP。
- 只借规则（外链转文末参考、内联样式、主题思路），主题 CSS 自己写。

## 运行形态

- `[runtime] type = "service"`，纯本地转换，无网络、无浏览器工具：`allowed_tools = []`、`network_access = false`、`file_system_access = true`（限工作文件夹）、`spawn_subprocess = false`。

## 工具（`mcp__unzoo__wechat_formatter__*`）

| 工具 | 输入 | 输出 |
| --- | --- | --- |
| `themes` | — | 可用主题及预览图路径 |
| `render` | `markdown_path`, `platform: wechat|zhihu|toutiao|juejin|generic`, `theme`, `links: footnotes|keep` | `html_path`, `text_path`, 图片清单（本地路径 + 在正文中的位置），警告（超长标题、未找到图片） |
| `preview` | `html_path` | 一张预览截图路径（内部打开本地文件渲染，不联网） |

## 审批点

无发布动作。产物交给 `blog-to-platforms` 技能或 `publish-desk` 的 `prepare(mode=draft)`；存草稿以外的动作仍由人完成。

## 备注

代码高亮、数学公式转图片等可选能力按需加；公式转图片若需要外部服务，必须单独征得同意。
