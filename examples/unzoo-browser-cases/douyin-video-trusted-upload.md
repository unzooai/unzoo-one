# Case: 抖音 video post with a trusted upload

**Goal.** Upload a vertical video to 抖音创作者中心, fill title/description/话题/cover, and stop before 发布.

**Inspired by.** social-auto-upload's 抖音 uploader (cookie-based sessions per account). Here: one signed-in Unzoo profile, and `browser_upload_trusted` for the ByteDance uploader that ignores script-set files.

## Prerequisites

- A profile signed in at creator.douyin.com.
- `clip-01.mp4` (9:16, ≤ 15 min for normal accounts), `clip-01.md` (作品标题 ≤ 30 chars, 简介 with #话题), optional `cover.jpg`.

## Steps

1. `tab_create(profile_id="<douyin profile>", url="https://creator.douyin.com/creator-micro/content/upload")` → `T`.
2. `browser_wait_for_network_idle(tab_id=T)`; `browser_a11y_snapshot(tab_id=T)`. Sign-in/QR → handover.
3. Try the normal route: `browser_set_input_files(tab_id=T, file_paths=["<cwd>/clip-01.mp4"])`, click **上传视频**.
4. Snapshot after 5 s. If the page did not move to the edit form, the upload was ignored: `browser_query_selector_all(tab_id=T, selector="input[type=file]")` to find the input, then `browser_upload_trusted(tab_id=T, selector="<that input>", file_path="<cwd>/clip-01.mp4")`.
5. Wait for the edit form (`browser_wait_for_selector` on the title field from the snapshot) and for the upload progress to reach 100% (re-snapshot every 15 s).
6. 作品标题: click, `browser_input_text`. 作品简介: click, `browser_input_text`; for each #话题 type `#<tag>` and click the suggestion.
7. Cover: **选择封面** → **上传封面** → open the dialog so its file input exists → `browser_upload_trusted(selector=…, file_path="<cwd>/cover.jpg")` → **完成**.
8. Settings from `clip-01.md`: 谁可以看 (default 公开 unless stated), 允许他人保存视频, and 自主声明 → 内容由 AI 生成 when applicable.
9. `browser_screenshot(tab_id=T)` → `work/douyin-filled.png`.

## Human approval / handover

- Sign-in, 短信验证, 滑块验证: `agent_session.handover(text="请在这个标签页完成抖音登录/验证", tab_id=T)`. Never solve the slider yourself.
- Final: `agent_session.handover(text="抖音作品《<title>》已填好，请检查后点击「发布」", tab_id=T)`.

## Failure handling

- "上传失败" or format error → `ffprobe` the file; re-encode to H.264/AAC MP4 in the terminal and retry once.
- 风险提示/账号异常 → stop and report. Do not switch accounts or retry repeatedly.
- 话题 suggestion missing → leave the tag as plain text and note it.
