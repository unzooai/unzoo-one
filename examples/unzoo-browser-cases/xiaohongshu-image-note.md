# Case: 小红书图文笔记 in the creator center

**Goal.** Fill a 图文 note (images, title, body, 话题) in 小红书创作服务平台 and stop before 发布.

**Inspired by.** xiaohongshu-mcp and xhs-toolkit (browser automation behind an MCP server), social-auto-upload's 小红书 uploader. Here the same flow runs in the person's signed-in Unzoo profile.

## Prerequisites

- A profile signed in at creator.xiaohongshu.com (QR sign-in is a handover).
- `xiaohongshu.md`: title ≤ 20 chars, body ≤ 1000 chars, 3–8 #话题; images `xhs-01.jpg …` (1–18, 3:4 recommended, first is the cover).

## Steps

1. `tab_create(profile_id="<xhs profile>", url="https://creator.xiaohongshu.com/publish/publish")` → `T`.
2. `browser_wait_for_network_idle(tab_id=T)`; `browser_a11y_snapshot(tab_id=T)`. Sign-in page/QR → handover.
3. Click the **上传图文** tab (the page defaults to 上传视频).
4. `browser_set_input_files(tab_id=T, file_paths=["<cwd>/xhs-01.jpg", "<cwd>/xhs-02.jpg", …])`, then click **上传图片**. If the snapshot shows no images after 10 s, the input rejected script-set files: open the picker so the `<input type=file>` exists and use `browser_upload_trusted(tab_id=T, selector="input[type=file]", file_paths=[…])`.
5. Wait until every thumbnail shows (snapshot; count images). Reorder by drag only if the order is wrong (`browser_drag_and_drop`).
6. Title field (placeholder like "填写标题会有更多赞哦"): click, `browser_input_text(text="<title>")`.
7. Body editor: click, `browser_input_text(text="<body without tags>")`.
8. 话题: for each tag, `browser_input_text(text="#<tag>")`, `browser_a11y_snapshot`, click the matching suggestion in the dropdown (so it becomes a real topic link, not plain text).
9. Optional settings from `xiaohongshu.md`: 添加地点, 权限设置 (公开/仅自己可见), 声明原创, AI 生成内容声明 when images/text were generated.
10. `browser_screenshot(tab_id=T)` → `work/xhs-filled.png`.

## Human approval / handover

- QR sign-in or 安全验证: `agent_session.handover(text="请在这个标签页扫码登录小红书创作服务平台", tab_id=T)`.
- Final: `agent_session.handover(text="小红书笔记《<title>》已填好，请检查后点击「发布」（或定时发布）", tab_id=T)`. You never click 发布 or 定时发布.
- If the person wants it saved instead, the page's **暂存离开** keeps a draft; you may click that.

## Failure handling

- Title/body over limit → the page shows a counter in red; shorten in `xiaohongshu.md` first, then re-enter.
- 违禁词/敏感词 warning → report the flagged words; do not try spelling tricks to slip them past the filter.
- Upload spinner never ends → re-snapshot once after 30 s; then report and leave the tab open.
