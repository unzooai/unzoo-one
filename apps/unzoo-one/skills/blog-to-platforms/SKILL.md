---
name: blog-to-platforms
description: How to take one Markdown article and put it on several writing platforms — WordPress, Ghost, Medium, Substack, 微信公众号, 知乎, 掘金, CSDN, 今日头条 — formatted for each, with images uploaded, saved as drafts in the person's signed-in browser, and left for them to publish. Use when the person asks to cross-post, syndicate or "publish this article everywhere".
---

# One article, many platforms, all as drafts

Tools such as Wechatsync and ArtiPub do this by reusing the browser's sign-ins; you do the same through Unzoo Browser, one platform at a time, ending each at a **draft**. Read `unzoo-browser` and the publishing rule in `social-publish`: the person presses Publish on every platform.

## 1. Prepare the article once

- Source of truth: `article.md` in the working folder, with front matter (`title`, `summary`, `tags`, `cover`, `canonical_url`). Images as local files in `images/`, referenced relatively.
- Check before going anywhere: title length per platform (公众号 ≤ 64 chars, 知乎 ≤ 100), summary present, every image exists, links work.
- Make per-platform variants only when needed, in `variants/<platform>.md` or `.html`:
  - **公众号**: no external links in the body (they are not clickable; move them to a "参考链接" list at the end), inline-styled HTML. Convert Markdown to inline-styled HTML locally (a small script or an installed converter such as the doocs/md or 文颜 CLI if present); keep the theme simple.
  - **知乎 / 掘金 / CSDN**: accept Markdown import or paste; code blocks keep their language.
  - **Medium / Substack**: paste rendered HTML or import from the canonical URL where offered.
  - **WordPress / Ghost**: block editor or Markdown card; set the canonical URL and slug.
- Cross-posting duplicates content: set the canonical URL where the platform allows it, and add "原文首发于 / Originally published at" where it does not, if the person wants that.

## 2. Each platform, the same loop

1. `tab_create` with the platform's editor URL (below). If it shows a sign-in page, hand it over (`agent_session.handover`); never type credentials.
2. `browser_a11y_snapshot`; find title, body and cover fields by their labels at run time.
3. Title: click, `browser_input_text`.
4. Body: preferred order — the platform's own Markdown import or "导入文档" (upload the `.md`/`.docx` with `browser_set_input_files`), else paste rendered HTML into the editor via `browser_evaluate` dispatching a paste event with `text/html`, else `browser_input_text` as plain text and fix headings by hand. After inserting, snapshot and check headings, lists, code and images survived.
5. Images: many editors re-upload pasted remote images; local images go through the editor's image button with `browser_set_input_files` (or `browser_upload_trusted` on ByteDance-family editors such as 头条 and 掘金). Wait until each shows as uploaded.
6. Cover, summary, tags, column/category, original-content declaration (声明原创 only if it truly is the person's original work).
7. **Save draft** (保存草稿 / Save draft / Save) — you may click this. Then screenshot and note the draft's URL.
8. Do not click Publish / 发表 / 群发 / 发布. List the drafts for the person, or hand over the tab if they want to publish now.

## Editor entry points (verify on the live page)

| Platform | Where | Notes |
| --- | --- | --- |
| WordPress | `<site>/wp-admin/post-new.php` | Gutenberg: "Save draft" top right; Publish opens a confirm panel — the person's. |
| Ghost | `<site>/ghost/#/editor/post` | Drafts autosave; Publish/Send as email is the person's. |
| Medium | medium.com/new-story | Autosaves as draft; "Import a story" takes a URL. |
| Substack | `<pub>.substack.com/publish/post` | Draft autosaves; "Continue" leads to send — stop there. |
| 微信公众号 | mp.weixin.qq.com → 内容管理 → 草稿箱 → 新的创作 → 写新图文 | Sign-in is a QR scan: handover. 保存为草稿 is fine; 发表/群发 is the person's. |
| 知乎 | zhuanlan.zhihu.com/write | 导入文档 accepts .md/.docx; drafts autosave. |
| 掘金 | juejin.cn/editor/drafts/new | Markdown editor; publish dialog asks category and tags — stop before 确定并发布. |
| CSDN | editor.csdn.net/md | Markdown editor; 保存草稿 then stop. |
| 今日头条 | mp.toutiao.com → 创作 → 文章 | Trusted upload for images and cover. |

## 3. Hand over

Write `crosspost-status.md`: platform, account shown, draft URL, anything that did not survive formatting. Reply with that table.
