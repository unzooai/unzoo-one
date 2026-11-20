# Case: cross-post one article to Medium and 知乎 as drafts

**Goal.** Take an article already published on the person's blog and create a Medium draft (with canonical link) and a 知乎专栏 draft, ready for the person to publish.

**Inspired by.** Wechatsync (29+ platforms via the signed-in browser, drafts by default) and ArtiPub.

## Prerequisites

- Two signed-in profiles, or one profile signed in to both (the person decides).
- `article.md` with `canonical_url` set to the original post; images in `images/`; `variants/zhihu.md` if the Chinese version differs.

## Steps: Medium

1. `tab_create(profile_id="<profile>", url="https://medium.com/me/stories/drafts")` → `M`. `browser_a11y_snapshot(tab_id=M)`; sign-in → handover.
2. Prefer import (keeps canonical link automatically): look for **Import a story** (`https://medium.com/p/import`), `browser_navigate(tab_id=M, url="https://medium.com/p/import")`, `browser_input_text` the `canonical_url`, click **Import**.
3. `browser_wait_for_network_idle(tab_id=M)`; snapshot. The import opens a draft in the editor; check title, images and code blocks with `browser_get_text`.
4. If import is unavailable: `https://medium.com/new-story`, title via `browser_input_text`, body via paste ClipboardEvent (`browser_evaluate`), then **⋯ → More settings → Customize canonical link** with `canonical_url`.
5. Medium autosaves; confirm "Saved" in the header. Note the draft URL with `browser_get_url(tab_id=M)`.

## Steps: 知乎

1. `tab_create(profile_id="<profile>", url="https://zhuanlan.zhihu.com/write")` → `Z`. Snapshot; 登录 → handover.
2. Prefer **导入 → 导入文档**: `browser_set_input_files(tab_id=Z, file_paths=["<cwd>/variants/zhihu.md"])`, click the import button. (If the chooser is ignored, `browser_upload_trusted` on the dialog's file input.)
3. Snapshot; check headings/code. Re-upload any image that shows as failed via the toolbar image button with `browser_set_input_files`.
4. Title (≤ 100 chars) with `browser_input_text`; add 题图 if available.
5. At the bottom, add the original link line ("本文首发于 …") if the person wants it. 知乎 drafts autosave; confirm 已保存 in the snapshot. Do not open 发布设置 → 发布.

## Human approval / handover

- Sign-ins: `agent_session.handover(text="Sign in to Medium / 知乎 in this tab", tab_id=M or Z)`.
- Publishing both: report draft URLs in `crosspost-status.md`, then `agent_session.handover(text="Medium and 知乎 drafts for '<title>' are ready in tabs M and Z. Publish them when you are happy.", tab_id=M)`.

## Failure handling

- Medium import fetches a paywalled/blocked page → fall back to step 4.
- 知乎 import loses code language → fix in editor via the code block menu; note it.
- Either platform flags duplicate content → report; never alter text just to evade detection.
