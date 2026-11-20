---
name: subtitle-and-clip
description: How to transcribe a video or audio file, make clean subtitles (split, corrected, translated), burn or attach them, cut highlight clips, reframe to 9:16 and trim silences — with ffmpeg and Whisper-family tools in the Unzoo One terminal. Use for subtitles, captions, translation of a video, cutting clips, vertical versions, or removing pauses.
---

# Subtitles and clips with the terminal

All of this runs locally in the Unzoo One terminal (`unzoo-terminal` skill). Files stay in the working folder: source in `work/source/`, intermediate files in `work/`, finished files at the top level.

## Tools, and asking before installing

- Check first: `ffmpeg -version`, `ffprobe -version`, and one speech-to-text tool: `faster-whisper` / `whisper` (Python), `whisper.cpp` (`whisper-cli`), or `whisperx`.
- If something is missing, say what you would install and how big it is (Whisper models are 75 MB–3 GB), and wait for the person to agree. Prefer a Python venv inside `work/` over global installs. Never install browser-automation packages for this.
- Large models are slow on CPU. Default to a small/medium model; offer the large one when accuracy matters (names, technical terms, non-English).

## 1. Transcribe

- Extract audio: `ffmpeg -i input.mp4 -vn -ac 1 -ar 16000 work/audio.wav`.
- Run the recogniser with word timestamps on, output SRT and JSON. Set the language if known; auto-detect otherwise.
- Long files: run it with `exec.run` and check progress with `screen.text`, not `exec.run_wait`.

## 2. Make the subtitles readable

Raw recogniser segments are too long and break mid-phrase. Rework them (this is where an LLM helps, and you are one):

- one subtitle ≤ 42 Latin characters per line (≤ 18 CJK characters), at most 2 lines, 1–7 s on screen;
- break at clause boundaries, never inside a name or number;
- fix obvious mis-hearings using context and a glossary: ask the person for names and product terms, or take them from the video's title/description; keep a `work/glossary.txt`;
- keep timestamps from the word-level data when you re-split; do not invent timing.
- Translation: translate whole sentences with surrounding context, then re-split for the target language; keep the original as a second track if they want bilingual subtitles. Write `name.en.srt`, `name.zh.srt`.

## 3. Attach or burn

- Soft subtitles (selectable, for YouTube/B站 uploads): upload the `.srt` alongside, or mux: `ffmpeg -i in.mp4 -i in.en.srt -c copy -c:s mov_text out.mp4`.
- Burned in (for Shorts/TikTok/抖音/小红书, where most viewers watch muted): `ffmpeg -i in.mp4 -vf "subtitles=in.srt:force_style='FontSize=…,Outline=2,MarginV=…'" -c:a copy out.mp4`. On Windows, escape the path in the filter (`C\:/path/in.srt`) or run from the folder that holds the file. Pick a font that has the glyphs (CJK needs a CJK font).

## 4. Cut clips

- Choose moments from the transcript (see `content-repurpose`). Note start/end in `clips.csv`: `id,start,end,title`.
- Cut with re-encode for frame-accurate edges: `ffmpeg -ss START -to END -i in.mp4 -c:v libx264 -crf 20 -c:a aac clip-01.mp4`. Lossless `-c copy` only cuts on keyframes; use it only when exact edges do not matter.
- Shift subtitles to the clip: cut the SRT to the same range and subtract the start time, then burn.

## 5. Reframe to 9:16

- Centre crop when the speaker stays centred: `-vf "crop=ih*9/16:ih,scale=1080:1920"`.
- Speaker moves or two people: sample frames (`ffmpeg -vf fps=1`), look at them, and pick crop x-offsets per segment; or use a blurred-background layout (`split` → scaled blurred background + fitted foreground via `overlay`) when cropping would cut someone out.
- Screen recordings: do not crop text off; use the fitted-with-background layout.

## 6. Remove silences and filler (optional)

- Find pauses with `ffmpeg -af silencedetect=noise=-35dB:d=0.6 -f null -`, build keep-segments from the gaps, and concatenate. `auto-editor` does this in one command if it is already installed.
- Leave ~0.15 s of padding so speech does not sound clipped. Always keep the original.

## Check before handing over

- `ffprobe` each output: duration, resolution, audio present.
- Grab one frame per clip (`ffmpeg -ss 2 -i clip.mp4 -frames:v 1 clip.jpg`) and look at it: subtitles visible, not covered by platform UI (keep the bottom ~15% and right edge clear for Shorts/TikTok).
- Name files so they sort: `clip-01-hook-title.mp4`.
