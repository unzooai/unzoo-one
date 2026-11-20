---
name: short-video-pipeline
description: How to make a short vertical video from a topic or a script — write the script, gather licensed footage or images, generate a voice-over, time subtitles to it, add music, and render with ffmpeg — ending with an mp4 and a post text for review. Use when the person asks for a Short, a TikTok/抖音/Reels video, an explainer clip or a faceless video from a topic.
---

# Short video from a topic

The pattern (topic → script → visuals → voice → subtitles → render) is what open-source generators such as MoneyPrinterTurbo and ShortGPT automate. Here you do it step by step, so the person can check each step, and everything stays as files in the working folder.

## 1. Script first, and show it

- Ask for (or infer) topic, audience, language, length (default 30–45 s ≈ 80–120 words in English, 150–220 characters in Chinese) and tone.
- Write `script.md`: a hook in the first sentence, 3–5 beats, one call to action at most. Facts must be checkable: list sources at the bottom of the file. No fabricated numbers, quotes or testimonials.
- Split the script into scenes in `scenes.csv`: `id,text,visual_query,duration_hint`.
- Show the script before spending time on media unless the person said to go straight through.

## 2. Visuals

In order of preference:

1. The person's own footage or images in the working folder.
2. Licensed stock: search Pexels / Pixabay / Unsplash in your tab, check the licence on the item page, and download with `download_url` (or `media_download_smart` for video pages) into `work/media/`. Record source URL and licence per file in `work/media/credits.csv`.
3. Generated images, if the person has a tool for it (a local ComfyUI, or a service they are signed in to). Mark them as AI-generated in the post.

Never take footage from other creators' videos for this. Aim for 1 clip per 3–5 s of voice-over; vertical sources (1080×1920) first.

## 3. Voice-over

- Use whatever TTS the person has: a local engine (Piper, edge-tts if installed), or a signed-in service in the browser (record the generated file into `work/voice.mp3`). Ask before installing one.
- Do not clone a real person's voice unless it is the person's own and they asked for it.
- Measure the result with `ffprobe`; that length drives scene durations.

## 4. Subtitles

Transcribe `work/voice.mp3` with word timestamps (see `subtitle-and-clip`) rather than guessing timings from the script, then correct the words against the script. Short lines, 1–2 lines on screen, large font, centred in the lower third but above the platform's UI area.

## 5. Render with ffmpeg

- Normalise every visual to 1080×1920, 30 fps: scale + crop for video, a slow zoom (`zoompan`) for still images, trimmed to its scene duration.
- Concatenate scenes (concat demuxer with a list file in `work/`), add the voice track, mix music at about -18 dB under the voice (`amix` with `volume`), burn subtitles last.
- Music: only tracks the person supplies or royalty-free ones whose licence you recorded.
- Run long renders with `exec.run` and watch `screen.text`.

## 6. Check and hand over

- Watch for: black frames, scenes shorter than the subtitle on screen, audio clipping, subtitle overlap with UI. Grab 3 frames and look at them.
- Deliverables: `short-<slug>.mp4`, `script.md`, `post.md` (title, caption, tags for each target platform, AI-content disclosure if any visuals or voice are generated), `credits.md`.
- Offer `social-publish` to upload it; the person presses Publish.
