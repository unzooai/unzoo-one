---
name: content-repurpose
description: How to turn one long piece of content (a video, a podcast episode, a talk, a blog post, a PDF) into many smaller ones — short clips, a thread, a LinkedIn post, a 小红书 note, a newsletter blurb, quote cards — each fitted to its platform and saved as files for review. Use when the person asks to repurpose, cut down, "make posts from" or "get clips out of" something.
---

# Repurposing one piece of content into many

The source is the single place the facts come from. Every output is a file in the working folder the person can review before anything is posted. Posting, if asked, follows the `social-publish` skill.

## 1. Get the source and its text

- A web video (YouTube, B站, a podcast page): open it in your tab, then
  - YouTube: `youtube_transcript` on the loaded video gives timestamped text without downloading;
  - otherwise, or when you also need the video for clips: `media_download_smart` into `work/source/`, then transcribe (see `subtitle-and-clip`).
  - Only download what the person has the right to reuse: their own channel, licensed material, or clearly permitted content. If unsure, ask.
- An article or page: `browser_get_text` on the article element, or `extract_structured` for title/author/date/body. Save as `work/source.md`.
- A local file: read it from the working folder. PDFs and slides: extract text with whatever is installed; ask before installing anything.
- Keep the transcript with timestamps (`work/transcript.srt` or `.json`). Every clip and every quote must point back to a timestamp or a paragraph.

## 2. Find the moments

Read the whole transcript, then list 5–15 candidate moments in `repurpose-plan.md`:

- the hook (one sentence a stranger would stop for), start/end time or paragraph, why it works on its own, which outputs it feeds;
- prefer self-contained stretches of 15–60 s for vertical video, 1–3 min for horizontal clips;
- avoid moments that need earlier context, that name private people, or that make claims the source does not support.

Show the plan before cutting video if the source is long or the person did not say how many outputs they want.

## 3. Make the outputs

One folder per output under `outputs/` (or flat files with clear names):

| Output | What to produce |
| --- | --- |
| Vertical clips (Shorts, TikTok, Reels, 抖音, 视频号) | `clip-01.mp4` 9:16 with burned-in subtitles + `clip-01.md` (title, caption, tags per platform). Cutting and reframing: `subtitle-and-clip`. |
| Thread (X, Threads, Bluesky) | `thread.md`, one post per block, each within the limit, first post is the hook, last post links the source. |
| LinkedIn post | `linkedin.md`, ≤ 3000 chars, short paragraphs, no hashtag walls (3 at most). |
| 小红书 note | `xiaohongshu.md`: title ≤ 20 chars, body ≤ 1000 chars, 3–8 #话题, plus 1–9 images (quote cards or frames). |
| Newsletter blurb | `newsletter.md`, 80–150 words and a link. |
| Quote cards | `quote-01.png`, rendered locally (an HTML template screenshotted with `browser_screenshot`, or ImageMagick/ffmpeg if installed). |

Rules for every output:

- Write in the language of the platform's audience (ask if unclear), not by literal translation: rewrite.
- Quote the source accurately; paraphrase must not change the meaning. Credit the original creator when it is not the person's own work.
- No made-up statistics, testimonials or engagement bait ("comment YES to get…").

## 4. Hand over

Reply with the list of outputs and what each is for. Offer to post them with `social-publish` or put them on a calendar with `content-calendar`; do not post unasked.
