# 插件提案：media-forge（本地媒体加工）

## 目的

把"转写 → 断句/校对 → 翻译 → 烧字幕 → 剪片段 → 9:16 → 去静音 → 合成"做成一组确定性的工具。技能 `subtitle-and-clip` / `short-video-pipeline` 现在让智能体现写 ffmpeg 命令：可行，但在 Windows 路径转义、字幕滤镜、竖屏布局上容易出错，每次结果也不一致。插件把这些固化下来，智能体只负责判断（选哪段、怎么改字幕）。

## 灵感来源

- openshorts（MIT）：yt-dlp → faster-whisper 词级时间戳 → PySceneDetect → LLM 选段 → FFmpeg 切 → 人脸跟踪 9:16 → 字幕。
- VideoLingo（Apache-2.0）：词级对齐后用 NLP + LLM 断句、翻译后再对齐、配音。
- auto-editor（Unlicense）：基于音量的静音裁剪。
- MoneyPrinterTurbo（MIT）：素材 + TTS + 字幕的合成流程。
- 只借思路和流程，不拷代码。

## 运行形态

- `[runtime] type = "service"`，单个可执行文件（Rust 或打包的 Python），调用本机 ffmpeg/ffprobe（Unzoo 已自带）和一个 whisper 后端（whisper.cpp 优先：单文件、无 Python 依赖）。
- 模型和二进制不随插件分发：首次需要时返回 `dependency_consent_required`，由智能体问人后再下载（与 `media_deps_ensure` 同样的模式）。
- `[permissions]`：`file_system_access = true`（限工作文件夹）、`spawn_subprocess = true`（ffmpeg/whisper）、`network_access = false`（模型下载走单独的、需同意的工具）、`allowed_tools = []`。

## 工具（`mcp__unzoo__media_forge__*`）

| 工具 | 输入 | 输出 |
| --- | --- | --- |
| `probe` | `path` | 时长、分辨率、帧率、音轨、字幕轨 |
| `transcribe` | `path`, `language?`, `model?`, `word_timestamps=true` | `job_id`；完成后 `{srt, json}` 路径 |
| `job_status` | `job_id` | 进度、日志尾部、结果 |
| `resegment_subtitles` | `json`, `max_chars`, `max_lines`, `max_duration`, `glossary?` | 重新断句的 SRT（不改文字，只按词级时间切；文字校对由智能体做后再 `apply_text_edits`） |
| `apply_text_edits` | `srt`, `edits[{index,text}]` | 新 SRT，校验时间不变 |
| `cut` | `input`, `segments[{start,end,name}]`, `accurate=true` | 片段路径列表 + 同步平移的 SRT |
| `reframe_vertical` | `input`, `mode: center|track|blur_fit|split`, `keyframes?` | 1080×1920 输出；`track` 模式用帧采样 + 人脸框（本地模型，可选） |
| `burn_subtitles` | `input`, `srt`, `style{font,size,outline,margin_v}`, `safe_area=shorts|tiktok|none` | 输出视频；自动处理 Windows 路径转义和 CJK 字体 |
| `remove_silence` | `input`, `threshold_db`, `min_silence`, `padding` | 输出视频 + 保留片段列表 |
| `render_slideshow` | `scenes[{media,duration,caption?}]`, `voice?`, `music?`, `music_db=-18` | 竖屏成片 |
| `thumbnail_frames` | `input`, `count` | 抽帧图片路径（供智能体挑封面/自检） |

所有工具：只读写调用方给出的工作文件夹内的路径；拒绝越界路径；长任务一律异步 `job_id`。

## 审批点

- 下载模型 / 外部二进制：必须人同意（返回 `dependency_consent_required`）。
- 覆盖已有文件：默认不覆盖，`overwrite=true` 时由 Unzoo One 风险规则显示给人。
- 不涉及发布，无需最终审批。

## 不做

- 不做"从别人视频搬运"的去重/洗稿（镜像、加速、加边框规避检测）。
- 不做声音克隆。
