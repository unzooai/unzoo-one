---
name: social-publish
description: How to get a finished post, video or article onto a platform (YouTube, TikTok, 抖音, 小红书, B站, 视频号, X, LinkedIn, Instagram, Facebook...) through the person's signed-in Unzoo Browser — fill the platform's own upload form, save a draft, and stop for the person before the final Publish or Schedule click. Use whenever a task ends in posting, uploading, scheduling or publishing content.
---

# Publishing content through the real browser

You publish the way the person would: in the platform's own creator page, in a Unzoo Browser profile that is already signed in. There is no posting API to call and no account to create. Read the `unzoo-browser` skill first; this one adds what is specific to publishing.

## The one rule: the person presses Publish

Publishing is public and hard to undo. You prepare everything; the person makes it go live.

- Fill every field, upload every file, set every option, then **stop before the final button** that makes the post public or queues it: Publish, Post, 发布, 发表, 立即发布, 定时发布, Schedule, Submit for review.
- Hand that click to the person with the unterm tool `agent_session.handover`: one sentence naming the platform, the account shown on the page and what they will publish (for example "Check the YouTube draft 'Q3 recap' on channel Acme and press Publish if it looks right"), plus your `tab_id`. When it returns `done`, take a fresh snapshot and report what the page now shows (the post link, "under review", or an error).
- If `agent_session.handover` is not among your tools, stop and say in your reply exactly which tab is ready and what to press.
- A schedule is a publish. Setting the date is fine; confirming the schedule is the person's click.
- Saving a **draft** that only the person can see is fine to do yourself where the platform has one (YouTube Studio keeps uploads private until published; 公众号, 知乎, Medium and WordPress have drafts). Prefer drafts.
- Never post comments, replies, likes, follows or DMs as part of publishing, and never publish the same content to many accounts of the same platform. If the person asks for that, say no to that part.

## Before you open the platform

- Have the content final in the working folder: the media file(s), and a `post.md` (or one per platform) with title, body, tags, cover file and any links. The person reviews these as deliverables; the browser is only for transfer.
- Check each platform's limits from the brief below and fix the content first (length, aspect ratio, tag count), rather than discovering it in the form.
- Pick the profile. Use the profile you were given or your own. If the creator page asks for a sign-in, a QR scan or an SMS code, hand it over (`agent_session.handover`). Never type credentials, never try to get around a captcha or a risk check.

## Filling the form

1. `tab_create` with the creator page URL; keep the `tab_id`.
2. `browser_a11y_snapshot` and find the upload control. Do not rely on selectors remembered from earlier runs: these pages change often. Look for the button or drop zone by its text ("Select files", "上传视频", "上传图文").
3. Upload:
   - most pages: `browser_set_input_files` with the absolute file paths, **then** click the upload button (`browser_click` with its `ref`); the armed file chooser is filled for you;
   - pages that reject script-set files (ByteDance family: 抖音, 头条, 西瓜; some cover pickers): open the upload dialog so the `<input type=file>` exists, then `browser_upload_trusted` with a selector for that input.
   - Uploading is shown to the person before it happens. If they refuse, stop.
4. Wait for processing with `browser_wait_for_selector` / `browser_wait_for_network_idle`, re-snapshotting every 10–30 s for big videos. Do not fill fields that the page re-renders after upload until it settles.
5. Title, description, tags: click the field, then `browser_input_text` (rich editors ignore plain value setting). Tags on 小红书/抖音 are usually typed as `#tag` then picked from a suggestion list: snapshot, click the suggestion.
6. Cover, visibility, category, "made for kids", AI-generated-content disclosure, location: set what `post.md` says; where it says nothing and the platform requires an answer, choose the conservative option (not for kids unless stated, disclose AI-generated content when it is) and mention it.
7. `browser_screenshot` of the filled form into `work/` so the person can see what was entered, then hand over the final click.

## Platform notes (check against the live page every time)

| Platform | Creator page | Notes |
| --- | --- | --- |
| YouTube | studio.youtube.com → Create → Upload videos | Multi-step dialog (Details → Video elements → Checks → Visibility). Leave visibility on Private or Unlisted and stop at Visibility for the person. Shorts: vertical, ≤ 3 min. |
| TikTok | tiktok.com/tiktokstudio/upload | Caption ≤ 2200 chars; disclose AI content toggle; the Post button is the person's. |
| 抖音 | creator.douyin.com → 发布视频 | Trusted upload often needed. Title ≤ 30 chars, description with #话题. Frequent risk checks: hand them over. |
| 小红书 | creator.xiaohongshu.com → 发布笔记 | 上传视频 or 上传图文 tabs. Title ≤ 20 chars, body ≤ 1000 chars, images 1–18, first image is the cover. |
| B站 | member.bilibili.com/platform/upload | Choose 自制/转载 honestly; 转载 needs the source URL. Partition (分区) required. |
| 视频号 | channels.weixin.qq.com → 发表视频 | Sign-in is a WeChat QR scan: always a handover. |
| X | x.com/compose/post | Composer is Lexical: `browser_input_text`. 280 chars unless the account has longer posts; threads = one post each. |
| LinkedIn | linkedin.com/feed → Start a post | Rich editor; document/video upload through the media button. |
| Instagram / Facebook | business.facebook.com → Content → Create post | Meta Business Suite handles both; schedule there if asked, still the person's click. |

## Afterwards

- Record what happened in `publish-log.md` (or append): platform, account name as shown, title, time, resulting URL or status. Never write cookies or tokens there.
- If the page showed an error, a rejection or a pending review, say so plainly; do not retry by re-uploading unless the person asks.
