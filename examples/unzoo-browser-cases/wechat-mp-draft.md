# Case: 微信公众号 article into 草稿箱

**Goal.** Put a formatted article into the 公众号 草稿箱 (title, author, body with images, cover, 摘要) and stop at 保存为草稿.

**Inspired by.** doocs/md and 文颜 (Markdown → inline-styled 公众号 HTML), wenyan-mcp and Wechatsync (draft creation through the signed-in backend).

## Prerequisites

- A profile where the person scans the QR to sign in at mp.weixin.qq.com (sessions expire; expect a handover each time).
- `variants/wechat.html`: inline-styled HTML (no `<style>` blocks, no external links in the body; references listed at the end), images local.
- Cover image 2.35:1 (900×383 recommended), 摘要 ≤ 120 chars, title ≤ 64 chars.

## Steps

1. `tab_create(profile_id="<mp profile>", url="https://mp.weixin.qq.com")` → `T`.
2. `browser_a11y_snapshot(tab_id=T)`. QR page → handover; after `done`, snapshot again.
3. **内容管理 → 草稿箱 → 新的创作 → 写新图文**. The editor opens in a **new tab**: `tab_list` and pick the new editor tab (it belongs to your profile) → `E`.
4. Title: click 请在这里输入标题, `browser_input_text(tab_id=E, text="<title>")`. 作者: same.
5. Body: click the editor area, paste HTML with a `paste` ClipboardEvent via `browser_evaluate(tab_id=E, …)` (as in the WordPress case). Snapshot; check styling survived.
6. Images: the editor does not accept local paths in pasted HTML. For each image placeholder, put the caret there, click the toolbar **图片 → 本地上传**, `browser_set_input_files(tab_id=E, file_paths=["<cwd>/images/…"])`, then the chooser opens and is filled. Wait for the thumbnail.
7. Cover: **拖拽或选择封面 → 从正文选择** or **本地上传** (`browser_set_input_files`), crop dialog → **完成**.
8. 摘要: `browser_input_text`. 原创声明 only if the person confirms it is their original work. 合集/留言 settings as stated in the brief.
9. Click **保存为草稿**. Wait for 已保存. `browser_screenshot(tab_id=E)` → `work/wechat-draft.png`.

## Human approval / handover

- QR sign-in and any 管理员扫码验证: `agent_session.handover(text="请用微信扫码登录公众号后台", tab_id=T)`.
- 发表 / 群发 always: `agent_session.handover(text="文章《<title>》已保存到草稿箱，请预览后自行发表/群发", tab_id=E)`. Do not use 预览 → 发送到手机 for anyone other than the person.

## Failure handling

- Styles stripped after paste → the HTML had `<style>`/class-based CSS; regenerate with inline styles and paste again into a fresh editor.
- 图片上传失败 (size/format) → convert to JPG < 10 MB locally, retry once.
- Session expired mid-edit → the editor autosaves; after the re-scan handover, reopen the draft from 草稿箱 rather than starting a new one.
