---
name: newsletter-digest
description: How to build a periodic digest or newsletter from sources — RSS feeds, websites, YouTube channels, newsletters, GitHub releases — by collecting new items since the last issue, summarising and grouping them with links, and producing a ready-to-send Markdown/HTML issue saved as a draft in the person's newsletter tool (Ghost, Substack, listmonk, Mailchimp, Buttondown, 公众号). Use for weekly roundups, industry digests, "what happened this week" and newsletters.
---

# Newsletter and digest

The digest is a file first (`issues/<yyyy-mm-dd>.md` and an `.html` render), and a draft in the sending tool second. Sending to subscribers is always the person's click.

## 1. Sources

- Keep them in `sources.csv`: `name,url,type(rss|page|youtube|github|newsletter),language,weight`. Ask for it the first time; offer a starter list if they want one.
- RSS/Atom: fetch with `download_url` (or `browser_navigate` + `browser_get_text` if the feed needs the browser's session) and parse the XML in the terminal. Many sites without feeds have RSSHub routes; the person can point you to their own RSSHub instance.
- Pages without feeds: `browser_navigate` then `extract_links` / `extract_structured` for the article list.
- YouTube: the channel's feed `https://www.youtube.com/feeds/videos.xml?channel_id=…`; for summaries, `youtube_transcript` on each new video.
- Paywalled or signed-in sources: only through the person's own signed-in profile, and only short summaries plus a link, never full text.

## 2. What is new

- Track what was covered in `state/seen.json` (URL → first-seen date). Only items newer than the last issue go in; if `seen.json` does not exist, use the last 7 days.
- Drop duplicates across sources (same URL, or same story from several outlets — keep the primary source and mention the others).

## 3. Write the issue

- Read each item (open it; do not summarise from the title). 1–3 sentences per item, in the reader's language: what happened, why it matters to this audience. Link the original.
- Group into 3–6 sections by topic; lead with the 1–3 most important items. Add an opening paragraph of 2–3 sentences.
- Quotes short and attributed. No made-up details: if you could not open an item, leave it out or say so in `work/skipped.md`.
- Length target: what the person asks; default 800–1200 words.
- Render HTML for email: simple inline styles, images with alt text, plain-text fallback (`.txt`).

## 4. Into the sending tool, as a draft

Follow `blog-to-platforms` for the browser steps (title, body paste, Save draft) with these entry points, all found by a11y snapshot on the live page:

- Ghost: new post → paste → **Save draft**. Publish/Send is the person's.
- Substack: Dashboard → New post → draft autosaves; stop at "Continue".
- listmonk: Campaigns → New → paste HTML, pick list → **Save**; Start campaign is the person's.
- Mailchimp / Buttondown: create campaign/email as draft; stop before Send/Schedule.
- 公众号: as in `blog-to-platforms`, 保存为草稿 only.

Never send a test email to addresses the person did not give you, and never add or import subscribers.

## 5. After

Update `state/seen.json` only after the person confirms the issue (so items are not lost if they discard it). Reply with the issue's headline items, the files, and the draft link.
