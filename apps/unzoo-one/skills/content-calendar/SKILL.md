---
name: content-calendar
description: How to plan what to publish and when — gather topics from the person's own material, their past posts and current trends, draft a dated calendar per platform as a CSV/Markdown file, keep it updated as items are made and published, and set up reminders instead of unattended posting. Use when the person asks for a content plan, a posting schedule, topic ideas for the coming weeks, or to "keep my channels going".
---

# Content calendar

A calendar is a file the person owns: `content-calendar.csv` (for sorting and spreadsheets) plus `content-calendar.md` (to read). Each row is one planned piece; it moves through `idea → drafted → ready → scheduled → published` as work happens.

## 1. Inputs

- What the person already has: a backlog, recordings, articles, product news. Ask for the folder or links.
- What worked before: if they want, open their own analytics pages in the signed-in profile (YouTube Studio → Analytics, 小红书创作者中心 → 数据中心, B站 → 数据中心, LinkedIn → analytics) and read numbers with `extract_table` or `browser_get_text`. Only their own accounts; read only.
- What is current: trends and news in their field, from public sources — RSS feeds, Google Trends, platform hot lists (微博热搜, 知乎热榜, B站热门), Hacker News, subreddits. `extract_links` / `extract_structured` on those pages; note the date you read them.
- Constraints: platforms, how often they can realistically produce, languages, dates to avoid or to hit (launches, holidays, events).

## 2. The calendar file

Columns: `date,time,timezone,platform,format,title,angle,source,status,owner,asset_path,post_url,notes`.

- Spread by realistic capacity, not by maximum frequency. Better 3 good posts a week than 14 thin ones.
- One idea can feed several rows (see `content-repurpose`), staggered by a day or two, each adapted to its platform.
- Times: use the platform's own audience insights if read in step 1; otherwise state that the time is a guess.
- Mark anything time-sensitive (trend, news) with an expiry in `notes`.

## 3. Keeping it alive

- When asked "what's next", read the file, list the next 7 days, and say what is not ready.
- After making something, update `status` and `asset_path`; after the person publishes, fill `post_url`.
- Edit the same file; do not create `content-calendar-v2.csv`.

## 4. Scheduling, without unattended posting

- Platform-native scheduling (YouTube Studio, Meta Business Suite, 小红书定时发布, B站定时发布) is a publish: prepare it as in `social-publish` and let the person confirm the schedule.
- For reminders, suggest a scheduled Unzoo One task or a calendar entry that **prepares** the post on the day and pings the person; it must not press Publish by itself.
- Never set up posting from many accounts, automated likes/follows/comments, or posting on a fixed frequency without content review.

## Reply

Give the next two weeks at a glance (a short table), name the files, and list the decisions the person needs to make (which ideas to drop, which dates are fixed).
