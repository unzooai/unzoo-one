# Case: upload a video to YouTube Studio as a private draft

**Goal.** Upload `short-<slug>.mp4` with title, description, tags, thumbnail and subtitles, leave it **Private**, and hand the visibility/publish decision to the person.

**Inspired by.** social-auto-upload's YouTube uploader and youtube-upload (API). Here: the person's own signed-in Studio page, no API keys.

## Prerequisites

- A Unzoo profile signed in to the right Google account and channel (the person names it). Use `profile_list` to find it; then `tab_create(profile_id=…)`. Never use the person's everyday profile unless they say so.
- In the working folder: the video, `post.md` (title ≤ 100 chars, description ≤ 5000 chars, tags), optional `thumb.jpg` (1280×720, < 2 MB), optional `.srt`.

## Steps

1. `tab_create(profile_id="<channel profile>", url="https://studio.youtube.com")` → `T`. `browser_wait_for_network_idle(tab_id=T)`.
2. `browser_a11y_snapshot(tab_id=T)`. If it shows a Google sign-in → handover (below). Note the channel name in the header; if it is not the expected channel, stop and ask.
3. Click **Create** (`browser_click(ref=…)`), snapshot, click **Upload videos**.
4. `browser_set_input_files(tab_id=T, file_paths=["<cwd>/short-<slug>.mp4"])`, then click **Select files** in the dialog. The armed chooser receives the file.
5. `browser_wait_for_selector(tab_id=T, selector="text=Details")` (or snapshot until the Details step shows). Upload continues in the background.
6. Title box: click it, select all (`browser_press_key("Control+A")`), `browser_input_text(tab_id=T, text="<title>")`. Description box: same.
7. Thumbnail: `browser_set_input_files(file_paths=["<cwd>/thumb.jpg"])`, click **Upload thumbnail**. (Unavailable on unverified channels: skip and note it.)
8. Audience: select **No, it's not made for kids** unless `post.md` says otherwise.
9. **Show more** → Tags: `browser_input_text` with comma-separated tags. Altered/synthetic content: set **Yes** if visuals or voice were AI-generated.
10. **Next** to Video elements: if there is an `.srt`, **Add subtitles → Upload file → With timing**, `browser_set_input_files` + click, then **Done**.
11. **Next** to Checks; wait for "No issues found" or read what it reports (`browser_get_text` on the checks panel).
12. **Next** to Visibility. Select **Private**. Click **Save** — the video stays private (a draft only the channel can see). Snapshot; copy the video link shown.
13. `browser_screenshot(tab_id=T)` → `work/youtube-draft.png`. Append to `publish-log.md`.

## Human approval / handover

- Sign-in, 2-step verification, "verify it's you": `agent_session.handover(text="Sign in to the <channel> Google account in this tab", tab_id=T)`.
- Making it Public / Unlisted / Scheduled is the person's: `agent_session.handover(text="The video '<title>' is uploaded as Private on <channel>. Change visibility to Public or schedule it if it looks right.", tab_id=T)`.
- The file upload itself is shown to the person by Unzoo One before it happens.

## Failure handling

- Daily upload limit / "verify your account" banner → stop and report; do not try another account.
- Processing stuck > 10 min → report the Studio link; the draft is saved anyway.
- Copyright claim in Checks → do not continue past Checks; report the claim text.
- Fields re-rendered and lost text → re-snapshot, re-enter; never press Publish to "save".
