# wos-tools

Small calculators and solvers for Whiteout Survival, served as a static site at `https://julipinto.github.io/wos/`.

Two tools live here:

- **slush station** — solver for the in-game event with per-slot feedback and a minimax next-pick suggestion
- **time tool** — UTC ↔ multi-timezone converter with a draggable 0-24h slider, chronological zone list, and people tags per timezone

Migrated from vanilla HTML to SvelteKit + Svelte 5 (runes) in May 2026. See `STYLE_GUIDE.md` for the design system that all UI follows.

## Stack

- SvelteKit 2 + Svelte 5 (runes)
- `@sveltejs/adapter-static` → fully prerendered, no server needed
- TypeScript strict, ESLint, Prettier
- Vitest for the algorithm tests
- Custom i18n (5 languages: en, pt, es, ru, ar) — pure JSON dictionaries + a runes store. Arabic flips `<html dir>` to RTL.

## Develop

```bash
npm install
npm run dev      # localhost:5173
npm run build    # produces ./build
npm run preview  # preview the static build
npm test         # vitest run (solver + time helpers)
```

If `npm install` fails with `Cannot find module @rollup/rollup-linux-x64-gnu` (npm/cli#4828):

```bash
npm install --no-save @rollup/rollup-linux-x64-gnu
```

## Structure

```
src/
  routes/
    +layout.svelte         shell — global Snackbar, LocaleSwitcher, css imports
    +layout.ts             prerender + always-trailing-slash
    +page.svelte           landing
    slush/+page.svelte
    tz/+page.svelte
  lib/
    components/            design system (Modal, Snackbar, Tutorial, Jar, …)
    tools/
      slush/               solver, tutorial visuals, runes store
      tz/                  time helpers, catalog, runes store
    i18n/                  messages/*.json + runes store + LocaleSwitcher
    stores/                singleton runes (snackbar)
    styles/                tokens, reset, typography, animations
    utils/                 drag, flip, storage, format, copy
tests/
  unit/                    vitest: solver.test.ts, time.test.ts
static/
  .nojekyll                GitHub Pages: don't process underscored paths
.github/workflows/
  deploy.yml               build + deploy-pages
```

## Deploy

Every push to `main` triggers `.github/workflows/deploy.yml` which builds the static site and publishes via `actions/deploy-pages`. The base path `/wos` is passed at build time via `BASE_PATH`; locally it's empty so dev/preview works at `/`.

### One-time GitHub setup

Before the first deploy lands you need to enable Pages in the repo settings:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (or run the `Deploy to GitHub Pages` workflow manually under the Actions tab). The first run will create the `github-pages` environment.

No secrets needed — `GITHUB_TOKEN` is sufficient with the `pages: write` and `id-token: write` permissions set in the workflow.

## i18n

All UI strings live in `src/lib/i18n/messages/{en,pt,es,ru,ar}.json`. The five files share the same shape. **All five currently contain the English text as a placeholder** — translations are pending.

To translate: edit a single locale file and the change appears live in dev. The runes store reads the current locale from `localStorage` (key `wos-locale`); first-visit users get sniffed from `navigator.language` and fall back to `en`.

The Arabic locale sets `dir="rtl"` on `<html>`. The 0-24h slider in the TZ tool stays LTR even under RTL — see the comment in `src/routes/tz/+page.svelte`.

## localStorage keys

- `slush-inventory-v1` — `{ inventory: hex[] }`
- `slush-tour-seen` — `'1'` when the tutorial has been dismissed
- `tz-zones-v1` — `[{ id, tags: [...] }, ...]`; backward-compatible with the legacy `string[]` format from `tz.html`
- `tz-tour-seen` — `'1'`
- `wos-locale` — current locale code
