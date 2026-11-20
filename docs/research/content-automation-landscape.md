# 内容生产与发布自动化：开源项目调研

日期：2026-11-19。星数、协议、最近推送时间取自 GitHub API 当天的数据（`stargazers_count`、`license.spdx_id`、`pushed_at`）。只读了公开 README，没有克隆或运行任何第三方代码；只借思路和流程，不拷代码或大段文字。

产出：

- 技能：`apps/unzoo-one/skills/` 下 `social-publish`、`content-repurpose`、`subtitle-and-clip`、`short-video-pipeline`、`blog-to-platforms`、`content-calendar`、`newsletter-digest`。
- 浏览器案例：`examples/unzoo-browser-cases/`（8 个）。
- 插件设计：`docs/research/plugins/`（5 个提案，含 Unzoo 插件机制说明）。

"自动化方式"一栏：**API** = 平台官方/开放接口；**浏览器** = 用 Playwright/Puppeteer/Selenium/go-rod 等驱动浏览器复用登录态；**扩展** = 浏览器扩展借用户已登录的会话调用平台网页接口；**本地** = 纯本地处理，不碰平台。凡原项目用浏览器自动化库的，我们一律改写成 Unzoo MCP 工具步骤，不引入这些库。

## 1. 生成（脚本 → 视频 / 文章 / 音频）

| 项目 | 协议 | ⭐ | 做什么 | 自动化方式 | 我们拿什么 |
| --- | --- | --- | --- | --- | --- |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | MIT | 144.5k | 主题/关键词 → LLM 文案 → 素材检索（Pexels 等）→ TTS → 字幕 → 合成竖屏短视频 | 本地 + 素材站 API | `short-video-pipeline` 的分步流程；`media-forge.render_slideshow` |
| [FujiwaraChoki/MoneyPrinter](https://github.com/FujiwaraChoki/MoneyPrinter) | MIT | 14.2k | 自动生成 YouTube Shorts（MoviePy） | 本地 | 同上，较早的简化版 |
| [FujiwaraChoki/MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2) | AGPL-3.0 | 32.5k | Shorts 生成 + 上传、Twitter 机器人、联盟营销、冷邮件外联 | 浏览器（Selenium） | 只看 Shorts 流程；**机器人发帖、批量外联部分不采纳**（与"无垃圾内容/无假互动"冲突） |
| [RayVentura/ShortGPT](https://github.com/RayVentura/ShortGPT) | MIT | 8.2k | 短视频/频道自动化框架：脚本、配音、素材、翻译配音 | 本地 + 服务 API | "编辑语言"式的分步可检查流程；配音翻译思路 |
| [gyoridavid/short-video-maker](https://github.com/gyoridavid/short-video-maker) | MIT | 1.5k | 通过 MCP/REST 生成 TikTok/Reels/Shorts | 本地 + MCP | 把生成能力暴露为 MCP 工具的形态（→ 插件） |
| [linyqh/NarratoAI](https://github.com/linyqh/NarratoAI) | MIT | 11.9k | 大模型看片 → 解说文案 → 自动剪辑配音 | 本地 | 解说类二创流程；`content-repurpose` 的"先出计划再剪" |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Remotion License（源码可见，企业需商业授权） | 74.2k | 用 React 程序化做视频 | 本地 | 模板化片头/字幕卡的思路；协议限制，不作为依赖 |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | GPL-3.0 | 147.5k | 节点式扩散模型工作流，生成封面/配图 | 本地 + API | 用户本机若有，技能里作为可选的图片来源 |
| [stanford-oval/storm](https://github.com/stanford-oval/storm) | MIT | 31.9k | 研究主题 → 带引用的长文 | 本地 + 搜索 API | 长文"先大纲后成文、每句有来源"原则 |
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) | Apache-2.0 | 30.8k | 自主调研并生成报告 | 本地 + 搜索/浏览 | 资料收集 → 文章的流程（与 `newsletter-digest` 的"先打开再总结"一致） |
| [souzatharsis/podcastfy](https://github.com/souzatharsis/podcastfy) | Apache-2.0 | 6.8k | 文章/PDF/网页 → 多人对话播客音频 | 本地 + TTS API | 播客改写流程（后续可做 `podcast-from-content` 技能） |
| [lfnovo/open-notebook](https://github.com/lfnovo/open-notebook) | MIT | 42.1k | NotebookLM 开源实现：资料库、问答、播客 | 本地 | 资料 → 多种产出的"笔记本"组织方式 |

## 2. 剪辑、字幕、切片

| 项目 | 协议 | ⭐ | 做什么 | 自动化方式 | 我们拿什么 |
| --- | --- | --- | --- | --- | --- |
| [Huanshere/VideoLingo](https://github.com/Huanshere/VideoLingo) | Apache-2.0 | 19.3k | 词级对齐 → NLP+LLM 断句 → 翻译 → 对齐 → 配音，一键 | 本地 | `subtitle-and-clip` 的断句规则；"翻译整句后再切" |
| [jianchang512/pyvideotrans](https://github.com/jianchang512/pyvideotrans) | GPL-3.0 | 19.8k | 视频翻译：识别、翻译、配音、嵌字幕 | 本地 | 多语言字幕轨/配音轨的产物组织 |
| [WEIFENG2333/VideoCaptioner](https://github.com/WEIFENG2333/VideoCaptioner) | GPL-3.0 | 16.6k | LLM 字幕助手：生成、断句、校正、翻译 | 本地 | 术语表/校正步骤（`glossary.txt`） |
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | MIT | 9.2k | 长视频 → 9:16 短片：faster-whisper、场景检测、LLM 选段、人脸跟踪重构图、字幕；通过 Upload-Post API 分发 | 本地 + 发布 API | 完整切片流水线 → `media-forge`；"选段打分" → `content-repurpose` |
| [Anil-matcha/AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) | MIT | 6.3k | Opus Clip 开源替代：长视频 → 竖屏短片 | 本地 | 同上，交叉验证流程 |
| [ClipsAI/clipsai](https://github.com/ClipsAI/clipsai) | MIT | 0.6k | 长视频自动切片库（基于转写的话题分段 + 重构图） | 本地 | 按话题边界切段的思路（已不活跃） |
| [m1guelpf/auto-subtitle](https://github.com/m1guelpf/auto-subtitle) | MIT | 2.3k | Whisper 生成并烧录字幕 | 本地 | 最小可用的字幕流程 |
| [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) | Unlicense | 6.0k | 基于音量/动作自动剪掉静音 | 本地 | `remove_silence` |
| [mifi/lossless-cut](https://github.com/mifi/lossless-cut) | GPL-2.0 | 46.2k | 无损剪切/合并 | 本地（GUI） | 关键帧无损切 vs 重编码精确切的取舍说明 |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | MIT | 98.9k | 开源 CapCut 替代（Web 编辑器） | 本地 | 人工精修的落点：自动粗剪后交给人 |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT | 26.9k | 更快的 Whisper 推理 | 本地 | 推荐的转写后端之一 |
| [openai/whisper](https://github.com/openai/whisper) | MIT | 113.0k | 语音识别 | 本地 | 转写基线 |
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense | 209.0k | 音视频下载 | 本地 | Unzoo 已内置（`media_download_smart` / `ytdlp_download`） |

## 3. 多平台发布

| 项目 | 协议 | ⭐ | 做什么 | 自动化方式 | 我们拿什么 |
| --- | --- | --- | --- | --- | --- |
| [dreammis/social-auto-upload](https://github.com/dreammis/social-auto-upload) | MIT | 16.7k | 上传到抖音、快手、小红书、B站、视频号、TikTok、YouTube、知乎、微博等；每账号一份登录态；`sau` CLI；带 Claude Code/Codex 平台技能 | 浏览器（多数平台） | 平台清单、每平台字段与定时能力 → `social-publish` 平台表、`publish-desk` 适配器 |
| [wechatsync/Wechatsync](https://github.com/wechatsync/Wechatsync) | GPL-3.0 | 6.7k | 一键同步文章到 29+ 平台（公众号、知乎、掘金、头条、CSDN、WordPress…），**默认存草稿**；有 MCP、CLI、Claude Code 技能 | 扩展（复用登录态调网页接口） | "默认草稿、人来发布"、"查登录状态"工具 → `blog-to-platforms`、`publish-desk` |
| [crawlab-team/artipub](https://github.com/crawlab-team/artipub) | BSD-3-Clause | 3.2k | 文章一键分发到多个技术平台 | 浏览器（Puppeteer） | 早期同类方案；流程交叉验证 |
| [xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) | Apache-2.0 | 17.2k | 小红书 MCP：登录、发图文/视频、搜索 | 浏览器（go-rod） | 单平台 MCP 化的粒度；图文笔记字段 → 小红书案例 |
| [aki66938/xhs-toolkit](https://github.com/aki66938/xhs-toolkit) | MIT | 1.4k | 小红书创作者 MCP：发布 + 创作者数据 | 浏览器 | 发布 + 读自己账号数据 → `content-calendar` 的数据输入 |
| [caol64/wenyan-mcp](https://github.com/caol64/wenyan-mcp) / [wenyan](https://github.com/caol64/wenyan) | Apache-2.0 | 1.4k / 1.1k | Markdown 排版后发布到公众号；多平台排版主题 | API（公众号草稿接口）+ 本地 | → `wechat-formatter` 插件、公众号案例 |
| [doocs/md](https://github.com/doocs/md) | WTFPL | 13.5k | 微信 Markdown 编辑器：主题、外链转脚注、图床 | 本地（Web） | 公众号排版规则 |
| [biliup/biliup](https://github.com/biliup/biliup) | MIT | 5.6k | 直播录制 + B站命令行投稿 | API（投稿接口） | B站投稿字段（分区、自制/转载、来源） |
| [makiisthenes/TiktokAutoUploader](https://github.com/makiisthenes/TiktokAutoUploader) | AGPL-3.0 | 1.2k | 用逆向请求上传 TikTok | 非官方接口 | 仅参考字段；**不采用逆向接口方式**（ToS 风险） |
| [tokland/youtube-upload](https://github.com/tokland/youtube-upload) | GitHub 未识别 | 2.2k | 命令行通过 YouTube Data API 上传 | API | API 路线对照；已不活跃 |

## 4. 排期与日历

| 项目 | 协议 | ⭐ | 做什么 | 自动化方式 | 我们拿什么 |
| --- | --- | --- | --- | --- | --- |
| [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | AGPL-3.0 | 41.9k | 自托管社媒排期，多平台，官方 MCP，"agentic" | 官方 API | 帖子 → 平台变体 → 时间槽 数据模型 → `content-scheduler` |
| [inovector/mixpost](https://github.com/inovector/mixpost) | MIT | 3.9k | 自托管 Buffer 替代：排期、发布、管理 | 官方 API | 队列/时间槽模型 |
| [trypostit/trypost](https://github.com/trypostit/trypost) | AGPL-3.0 | 1.2k | 面向 AI 智能体的排期工具，带 MCP | 官方 API | 给智能体的排期工具粒度 |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | Sustainable Use License（fair-code） | 211.2k | 工作流自动化，大量社媒/内容节点 | API | 流程编排思路；协议限制，不嵌入 |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | MIT（社区版）+ 企业版协议 | 25.6k | 工作流自动化 + 约 400 个 MCP | API | 同上 |

## 5. 信息源、趋势与通讯

| 项目 | 协议 | ⭐ | 做什么 | 自动化方式 | 我们拿什么 |
| --- | --- | --- | --- | --- | --- |
| [sansan0/TrendRadar](https://github.com/sansan0/TrendRadar) | GPL-3.0 | 63.7k | 多平台热榜聚合、关键词筛选、AI 分析、推送 | 抓取公开榜单 + RSS | 趋势输入 → `content-calendar`、`feed-radar` |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | AGPL-3.0 | 47.1k | 万物皆可 RSS | 抓取 | 让用户指向自己的 RSSHub 实例作为源 |
| [RSSNext/Folo](https://github.com/RSSNext/Folo) | AGPL-3.0 | 39.3k | AI RSS 阅读器 | RSS | 订阅 + 摘要体验 → `newsletter-digest` |
| [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | MIT | 55.9k | 出版 + 会员 + 邮件通讯 | 自身平台 | 通讯的发送端；草稿 → 人发送 |
| [knadh/listmonk](https://github.com/knadh/listmonk) | AGPL-3.0 | 24.4k | 自托管邮件列表/通讯管理 | 自身平台（API/后台） | 通讯的发送端；"保存活动、人点 Start" |

## 6. 分析（只读自己的数据）

开源里专门做"跨平台创作者数据"的成熟项目很少；可用的做法是 xhs-toolkit 那样读**自己账号**的创作者后台。我们的做法：`content-calendar` 技能在用户自己的已登录 profile 里打开各平台数据中心，用 `extract_table` / `browser_get_text` 只读。Postiz、Mixpost 也自带基础分析（走官方 API）。

## 不采纳 / 排除

- **MoneyPrinterV2 的 Twitter 机器人、联盟营销与冷外联模块**：核心是批量发帖/外联，属于垃圾内容风险。只参考其 Shorts 生成部分。
- **[NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler)**（71.4k，非商业学习协议）：评论/笔记爬虫，非内容生产；协议也不允许商用。排除。
- **TiktokAutoUploader 的逆向接口方式**：绕开官方上传流程，账号风险和 ToS 风险高。
- 任何以多账号矩阵、刷量、自动点赞评论关注、验证码破解为核心卖点的项目：均不收录。

## 共性结论

1. **发布侧几乎都靠复用浏览器登录态**（social-auto-upload、Wechatsync、xiaohongshu-mcp、ArtiPub）。中国平台基本没有开放的个人发布 API，海外平台的 API 要开发者应用和审核。Unzoo 的"真实 Chromium + 每智能体独立 profile + 人接管登录"正好是这条路线的更安全版本：不需要导出 cookie，不需要把凭据交给脚本。
2. **最好的项目都默认"草稿"**（Wechatsync、YouTube 私享、公众号草稿箱）。这与 Unzoo One"发布前进收件箱/交给人"天然一致，我们把它定成硬规则：最终发布键永远是人的。
3. **生成侧的价值在可检查的中间产物**（文案、选段计划、字幕、素材清单），而不是一键黑盒。技能都要求先出计划/文案再花时间渲染。
4. **字幕和切片流程已经高度收敛**：Whisper 词级时间戳 → LLM 断句校对 → ffmpeg 切/重构图/烧录。这部分适合做成插件（确定性代码），判断留给智能体。
5. **平台页面经常改版**：所有项目的 issue 区都是"某平台上传失效"。所以技能和案例里一律"运行时用 a11y 快照按可访问名称找控件"，不写死选择器；插件适配器也用声明式步骤 + 失败时交回智能体。
6. **趋势/信息源**是内容日历和通讯的输入，TrendRadar、RSSHub 证明需求大；做成带状态的 `feed-radar` 插件比每次现抓更稳。

## 优先级建议

| 顺序 | 交付 | 形态 | 理由 |
| --- | --- | --- | --- |
| 1 | `social-publish` | 技能（已写） | 所有发布场景的公共规则与平台表；审批边界在这里定死 |
| 2 | `subtitle-and-clip` + `content-repurpose` | 技能（已写） | 需求最大（VideoLingo / openshorts 星数），只用终端 + 浏览器即可起步 |
| 3 | `blog-to-platforms` | 技能（已写） | 文章多平台草稿，Wechatsync 证明了需求；纯浏览器即可 |
| 4 | `media-forge` | 插件（设计） | 把 ffmpeg/whisper 的易错细节固化，提升 2 的稳定性和速度 |
| 5 | `publish-desk` | 插件（设计） | 平台适配器集中维护；首批 8 个平台直接来自浏览器案例 |
| 6 | `short-video-pipeline` | 技能（已写） | MoneyPrinterTurbo 级别的需求；依赖 TTS/素材的可用性 |
| 7 | `newsletter-digest` + `feed-radar` | 技能（已写）+ 插件（设计） | 周期性任务，状态由插件保存 |
| 8 | `content-calendar` + `content-scheduler` | 技能（已写）+ 插件（设计） | 到点"准备 + 提醒"，不无人值守发布 |
| 9 | `wechat-formatter` | 插件（设计） | 公众号排版是中文市场刚需，但面向英文优先市场时优先级靠后 |
| 后续 | `podcast-from-content`（podcastfy / open-notebook 思路） | 技能 | 依赖 TTS 方案，先观察用户需求 |
