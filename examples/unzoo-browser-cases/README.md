# Unzoo Browser cases: content production and publishing

Worked browser workflows for the content skills in `apps/unzoo-one/skills/` (`social-publish`, `blog-to-platforms`, `content-repurpose`, `subtitle-and-clip`, `newsletter-digest`). Each case lists the exact sequence of Unzoo MCP tool calls, where the person takes over, and what to do when a step fails.

Conventions used in every case:

- Calls are written `tool(arg=value)`; in a client they appear as `mcp__unzoo__<tool>`. `agent_session.handover` is the Unzoo One terminal (unterm) tool.
- `T` is the `tab_id` returned by the first `tab_create`; pass it on every later call.
- `ref=N` values come from the **latest** `browser_a11y_snapshot`. Element names in the steps ("Select files", "发布") are what to look for in the snapshot, not hard-coded selectors; these pages change often.
- Files are absolute paths in the task's working folder.
- Nothing in these cases presses the final Publish / Post / 发布 / 发表 / Schedule button. That click is always handed to the person.

| Case | Platform | Ends at |
| --- | --- | --- |
| [download-source-and-transcript](download-source-and-transcript.md) | YouTube / B站 / any video page | local video + transcript |
| [youtube-studio-upload-draft](youtube-studio-upload-draft.md) | YouTube Studio | private draft, person publishes |
| [xiaohongshu-image-note](xiaohongshu-image-note.md) | 小红书创作服务平台 | filled note, person publishes |
| [douyin-video-trusted-upload](douyin-video-trusted-upload.md) | 抖音创作者中心 | filled video post, person publishes |
| [wordpress-draft-post](wordpress-draft-post.md) | WordPress (Gutenberg) | saved draft |
| [wechat-mp-draft](wechat-mp-draft.md) | 微信公众号 | 草稿箱 draft |
| [crosspost-medium-zhihu](crosspost-medium-zhihu.md) | Medium + 知乎 | two drafts |
| [x-thread-draft](x-thread-draft.md) | X | composed thread, person posts |
