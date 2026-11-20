# Case: download a source video and get its transcript

**Goal.** Bring a video the person has the right to reuse (their own upload, a licensed or explicitly permitted video) into the working folder with a timestamped transcript, as the input for `content-repurpose` / `subtitle-and-clip`.

**Inspired by.** The ingest step of openshorts, AI-Youtube-Shorts-Generator and VideoLingo (yt-dlp + Whisper), done with Unzoo's built-in downloader instead.

## Prerequisites

- The URL, and the person's confirmation that reuse is allowed.
- Your own profile is enough for public videos. Members-only or private videos need a profile already signed in to that account.
- yt-dlp/ffmpeg are bundled with Unzoo; if a call answers `dependency_consent_required`, ask the person before `media_deps_ensure`.

## Steps

1. `tab_create(url="<video url>")` → `T`.
2. `browser_wait_for_network_idle(tab_id=T)`; `browser_a11y_snapshot(tab_id=T)`. Confirm title and channel match what the person meant (save title, channel, upload date into `work/source.json`).
3. Transcript first (cheap, no download):
   - YouTube: `youtube_transcript(tab_id=T, lang="<preferred>")` → save to `work/transcript.json` (and an `.srt` rendering).
   - Other sites: look in the snapshot for a "subtitles/CC/字幕" control; if none, the transcript comes from step 5.
4. Download: `media_download_smart(url="<video url>", tab_id=T, output_dir="<cwd>/work/source", format="bestvideo[height<=1080]+bestaudio/best")` → returns `task_id` for yt-dlp routes. Poll with `download_get(task_id=…)` every ~10 s until finished. Native-route downloads land in `output_dir` directly.
5. No platform transcript: run Whisper in the terminal on the downloaded file (see `subtitle-and-clip`).
6. Verify in the terminal: `ffprobe` duration ≈ the page's duration; audio stream present.

## Human approval / handover

- None for public videos. If the page shows a sign-in wall, an age gate or a captcha: `agent_session.handover(text="Please sign in / confirm age on this video page", tab_id=T)` and continue on `done`.

## Failure handling

- `dependency_consent_required` → ask the person; never install silently.
- DRM / encrypted stream error → stop; it is out of scope. Tell the person.
- Download stalls (no progress for 2 polls) → `download_get` once more, then retry once with a lower `format` (`best[height<=720]`). Do not loop.
- Transcript language wrong → call `youtube_transcript` again with `lang`; if only auto-captions exist, say so (quality is lower).
