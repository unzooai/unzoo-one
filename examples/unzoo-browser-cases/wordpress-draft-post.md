# Case: WordPress post as a draft (Gutenberg)

**Goal.** Create a WordPress post from `article.md` with images, category, tags, featured image and excerpt, and **Save draft**.

**Inspired by.** Wechatsync and ArtiPub (both sync to WordPress through the signed-in session). The WordPress REST API with an application password is the alternative when the person sets one up; this case uses the browser so no credential is handed to the agent.

## Prerequisites

- A profile signed in to `<site>/wp-admin` with an Author/Editor role.
- `article.md` with front matter (title, excerpt, tags, category, cover, canonical_url); images in `images/`.
- Rendered body: `work/article.html` (Markdown → HTML locally).

## Steps

1. `tab_create(profile_id="<wp profile>", url="https://<site>/wp-admin/post-new.php")` → `T`. `browser_wait_for_network_idle(tab_id=T)`.
2. `browser_a11y_snapshot(tab_id=T)`. Login form → handover. Close the "Welcome to the block editor" guide if shown.
3. Title: click "Add title", `browser_input_text(text="<title>")`.
4. Body: click the first empty block, then paste the HTML so Gutenberg converts it into blocks:
   `browser_evaluate(tab_id=T, expression="(() => { const dt = new DataTransfer(); dt.setData('text/html', HTML); dt.setData('text/plain', TEXT); document.activeElement.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true})); })()")` with `HTML`/`TEXT` inlined as JSON strings from `work/article.html`.
5. Snapshot; check headings, lists and code blocks. Images with local paths show as broken: for each, select the block → **Replace → Upload**, `browser_set_input_files(file_paths=["<cwd>/images/…"])`, click **Upload**.
6. Settings sidebar (**Post** tab): Categories (tick), Tags (`browser_input_text` + Enter each), Excerpt, **Set featured image → Upload files** with `browser_set_input_files`, then **Set featured image**.
7. Canonical URL: only if an SEO plugin panel (Yoast/Rank Math) exposes it; otherwise note it.
8. Click **Save draft** (top bar). `browser_wait_for_selector(text="Saved")`. Copy the preview link. `browser_screenshot` → `work/wp-draft.png`.

## Human approval / handover

- Login / 2FA: `agent_session.handover(text="Sign in to <site> WordPress in this tab", tab_id=T)`.
- Publishing: **Publish** opens a pre-publish panel; that whole step is the person's. Report the draft link and, if they want it live now, `agent_session.handover(text="The draft '<title>' is saved. Press Publish if it looks right.", tab_id=T)`.

## Failure handling

- Paste produced one Classic block → use **Convert to blocks** from the block menu.
- Upload size error → resize images locally (ImageMagick/ffmpeg) and retry once.
- Autosave conflict banner → reload the draft and compare; never overwrite a newer version without asking.
