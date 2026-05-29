# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Build production site to ./dist/
npm run preview    # Preview production build locally
npm run check      # Run Astro type checking
```

No test or lint scripts are currently configured.

## Architecture

Despite the repo name, this is an **Astro 5** static blog (migrated from Eleventy).

**Content**: Blog posts live in `/src/content/posts/` as Markdown with frontmatter. The Zod schema in `src/content/config.ts` defines required fields (`title`, `date`) and optional fields (`description`, `tags`, `image`, `author`).

**Routing**: Pages are in `/src/pages/`. Dynamic routes (`/posts/[slug].astro`, `/posts/index.astro`) use `getStaticPaths()` + Astro content collections to generate static HTML. The home page (`index.astro`) shows the 3 most recent posts.

**Layouts/Components**: `BaseLayout.astro` is the root HTML wrapper. All components are in `src/components/`. Site metadata (title, URL, author, feed config) lives in `src/data/metadata.json`.

**Styling**: Single global CSS file at `src/styles/main.css` using CSS variables. No preprocessor or CSS-in-JS.

**TypeScript path aliases** (configured in `tsconfig.json`):

- `@components` → `src/components/`
- `@layouts` → `src/layouts/`
- `@styles` → `src/styles/`
- `@utils` → `src/utils/`

**Utilities** (`src/utils/index.ts`): `formatDate()` and `sortPostByDate()` are used across page components.

**Deployment**: Netlify, publishing from `./dist/`. Build command is `DEBUG=* npm run build` (see `netlify.toml`).
