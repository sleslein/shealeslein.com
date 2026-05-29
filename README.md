# shealeslein.com

[![Deployed on Fly.io](https://img.shields.io/badge/deployed%20on-Fly.io-blueviolet)](https://fly.io)

Personal blog built with [Astro 5](https://astro.build), deployed on [Fly.io](https://fly.io) via Docker.

## Project Structure

```
/
├── public/                  # Static assets
├── src/
│   ├── components/          # Astro components (Header, PostList, PostTag, etc.)
│   ├── content/
│   │   ├── config.ts        # Content collection schema (Zod)
│   │   └── posts/           # Markdown blog posts
│   ├── data/
│   │   └── metadata.json    # Site metadata (title, URL, author, feed config)
│   ├── layouts/
│   │   └── BaseLayout.astro # Root HTML wrapper
│   ├── pages/
│   │   ├── index.astro      # Home page (3 most recent posts)
│   │   ├── about/
│   │   └── posts/           # Post index + dynamic [slug] routes
│   ├── styles/
│   │   └── main.css         # Global styles (CSS variables, no preprocessor)
│   └── utils/
│       └── index.ts         # formatDate(), sortPostByDate()
├── Dockerfile
├── fly.toml
└── astro.config.mjs
```

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start dev server at `localhost:4321`        |
| `npm run build`   | Build production site to `./dist/`          |
| `npm run preview` | Preview production build locally            |
| `npm run check`   | Run Astro type checking                     |
| `npm run backup`  | Back up the production SQLite database      |
| `npm run deploy`  | Back up the database, then deploy to Fly.io |

## Adding a Post

Create a new `.md` file in `src/content/posts/` with the following frontmatter:

```markdown
---
title: My Post Title
date: 2026-01-01
description: Optional description
tags: [optional, tags]
---

Post content here.
```

## Deployment

The site runs on Fly.io in the `iad` region using the `@astrojs/node` standalone adapter. All blog posts are pre-rendered at build time. Future dynamic routes can opt out of prerendering with `export const prerender = false`.

Use `npm run deploy` rather than `fly deploy` directly — it backs up the database before deploying:

```bash
npm run deploy
```

### Database backups

The SQLite database lives on a Fly.io persistent volume at `/data/bloodbowl.db`. Before every deploy, `scripts/deploy.sh` downloads a timestamped copy to `backups/` (gitignored).

To back up manually without deploying:

```bash
npm run backup
# → backups/bloodbowl-YYYYMMDD-HHMMSS.db
```

To restore a backup:

```bash
fly sftp put backups/bloodbowl-<timestamp>.db /data/bloodbowl.db
```
