# Case: compose an X thread for the person to post

**Goal.** Enter a multi-post thread from `thread.md` into X's composer, attach media, and leave **Post all** to the person.

**Inspired by.** Postiz / Mixpost / TryPost (thread scheduling through the X API). The browser route needs no developer app or API keys; X's composer is a Lexical editor, so text goes through `browser_input_text`.

## Prerequisites

- A profile signed in to the right X account.
- `thread.md`: one block per post separated by `---`, each ≤ 280 chars (or the account's limit), optional media per block.

## Steps

1. Count characters per block in the terminal first; split any block that is over the limit.
2. `tab_create(profile_id="<x profile>", url="https://x.com/compose/post")` → `T`. `browser_wait_for_network_idle(tab_id=T)`.
3. `browser_a11y_snapshot(tab_id=T)`. Check the avatar/handle in the composer is the expected account; if not, stop.
4. First post: click the textbox ("What is happening?!"), `browser_input_text(tab_id=T, text="<block 1>")`.
5. Media for a block: `browser_set_input_files(tab_id=T, file_paths=[…])`, click the **Add photos or video** button; wait until the thumbnail shows. Add alt text via **Edit → Alt text** when the brief has it.
6. Next posts: click **Add post** (the "+" under the composer), snapshot, click the new empty textbox, `browser_input_text` the next block. Repeat.
7. Snapshot the whole composer; compare each box's text to `thread.md` with `browser_get_text`.
8. `browser_screenshot(tab_id=T)` → `work/x-thread.png`.

## Human approval / handover

- Sign-in / "unusual activity": `agent_session.handover(text="Sign in to X in this tab", tab_id=T)`.
- Final: `agent_session.handover(text="The thread (<n> posts) is in the composer. Review and press Post all, or schedule it.", tab_id=T)`.
- Optional: the composer's **Drafts** keep unsent posts (single posts only); saving there is fine.

## Failure handling

- Text typed into the wrong box after re-render → clear that box (`Control+A`, `Backspace`) and re-enter; re-snapshot before every box.
- Over-limit warning (red counter) → shorten in `thread.md`, never truncate silently.
- Media processing error → convert locally (MP4 H.264, ≤ 512 MB) and retry once.
