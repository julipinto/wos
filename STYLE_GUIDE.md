# Style Guide — wos-tools

A design system for the small tools in this repo. Paste this whole file as context when starting any new tool and follow it as the source of truth.

---

## The vibe

Dark, glassy, calm. Italic Fraunces titles do most of the visual work — confident and editorial without being loud. DM Mono handles UI labels and body text with a slight technical flavor that fits the "calculator/solver" identity. A single cyan accent ties everything together; restraint with color is the point.

Each tool should look like a small, intentional indie utility — not a SaaS dashboard, not a marketing landing page. Functional first, but allowed to be beautiful.

**Avoid:**
- Generic AI aesthetics (Inter, Roboto, Space Grotesk; purple-on-white gradients; rounded-square neutral icons; cookie-cutter cards)
- Decoration that doesn't earn its place
- More than one accent color per page
- Light theme — this is dark-only
- Marketing voice, exclamation points, emoji in headers

---

## Design tokens

Paste this into the `:root` of every new file. Don't deviate without reason.

```css
:root {
  /* Surfaces */
  --bg: #0b0e16;
  --bg-soft: #11151f;
  --surface: rgba(255, 255, 255, 0.035);
  --surface-hover: rgba(255, 255, 255, 0.055);
  --surface-strong: rgba(255, 255, 255, 0.07);

  /* Borders */
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.12);
  --border-accent: rgba(147, 212, 255, 0.4);

  /* Text */
  --text: rgba(255, 255, 255, 0.92);
  --text-mid: rgba(255, 255, 255, 0.62);
  --text-dim: rgba(255, 255, 255, 0.38);

  /* Accents — cyan is primary; green/red are state-only */
  --accent: #93d4ff;
  --accent-glow: rgba(147, 212, 255, 0.18);
  --ok: #6ee7a8;
  --no: #ff8a8a;

  /* Fonts */
  --font-display: 'Fraunces', serif;
  --font-mono: 'DM Mono', monospace;

  /* Radii */
  --r-card: 20px;
  --r-button: 12px;
  --r-pill: 999px;
}
```

Page body always uses the soft radial gradient atmosphere:

```css
body {
  background: var(--bg);
  background-image:
    radial-gradient(ellipse 70% 50% at 50% -10%, rgba(147, 212, 255, 0.10), transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%, rgba(196, 132, 252, 0.06), transparent 60%),
    radial-gradient(ellipse 50% 35% at 10% 80%, rgba(110, 231, 168, 0.04), transparent 60%);
  color: var(--text);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
}
```

---

## Typography

Load both fonts with preconnect (always do this; it cuts ~100ms off first paint):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Rules

**Fraunces** is display-only. Page titles, tool names, big numbers, solved-state celebrations. **Always italic**, weight 700-800, tight letter-spacing (`-0.02em` to `-0.035em`). Never body text, never UI controls.

**DM Mono** is the workhorse. UI labels, tags, descriptions, body, button text. Weight 400-500. For tags and eyebrows: uppercase + letter-spacing 2-5px.

### Hierarchy

| Use | Font | Size | Style |
|---|---|---|---|
| Hero title | Fraunces italic 800 | `clamp(56px, 14vw, 100px)` | gradient fill |
| Tool/card title | Fraunces italic 700 | 22-26px | letter-spacing -0.01em |
| Section/eyebrow label | DM Mono 500 | 10-11px | uppercase, ls 3-5px, color `--text-dim` |
| Body | DM Mono 400 | 12-13px | color `--text-mid`, line-height 1.5-1.7 |
| Button | DM Mono 500 | 11-13px | uppercase, ls 1-2px |
| Solved/celebratory text | Fraunces italic 600 | inline | color `--ok` |

### Gradient text (hero titles)

```css
.hero-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 800;
  letter-spacing: -0.035em;
  background: linear-gradient(180deg, #ffffff 20%, #93d4ff 130%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Layout

Mobile-first, single column by default. Pages use a `.wrap` with `max-width: 640-720px` centered. Generous vertical padding (56-80px top/bottom).

### Breakpoints

```css
/* default = small phones (< 380px) */
@media (min-width: 380px)  { /* normal phones */ }
@media (min-width: 640px)  { /* tablet / large phones — bigger jars, more padding */ }
@media (min-width: 1024px) { /* desktop — 2-col tool layouts available */ }
@media (min-width: 1280px) { /* large desktop — bigger imagery */ }
```

For tool pages with input + output, do 2-col at `>= 1024px` with output sticky:

```css
@media (min-width: 1024px) {
  .layout-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    max-width: 1180px;
  }
  .col-output { position: sticky; top: 24px; align-self: start; }
}
```

---

## Components

### Hero

Tag (mono uppercase with side-dashes) → giant Fraunces title → one-sentence DM Mono subtitle.

```html
<header class="hero">
  <div class="hero-tag">whiteout survival</div>
  <h1 class="hero-title">tool name</h1>
  <p class="hero-sub">One sentence on what this does.</p>
</header>
```

```css
.hero-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: var(--text-dim);
  display: inline-flex;
  align-items: center;
  gap: 14px;
}
.hero-tag::before, .hero-tag::after {
  content: "";
  width: 22px;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}
```

### Card

```html
<a href="..." class="card">
  <div class="card-visual">[svg]</div>
  <div class="card-body">
    <h2 class="card-name">Name</h2>
    <p class="card-desc">What it does.</p>
  </div>
  <svg class="card-arrow">[arrow]</svg>
</a>
```

```css
.card {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 22px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  color: inherit;
  text-decoration: none;
  transition: background .25s ease, border-color .25s ease, transform .25s ease, box-shadow .25s ease;
  position: relative;
  overflow: hidden;
}
.card:hover {
  background: var(--surface-hover);
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
}
/* Left-edge cyan glow on hover */
.card::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 240px 120px at 0% 50%, rgba(147,212,255,0.08), transparent 70%);
  opacity: 0;
  transition: opacity .3s ease;
  pointer-events: none;
}
.card:hover::before { opacity: 1; }
```

For "coming soon" cards, use a `.is-ghost` modifier: dashed border, no hover lift, dimmer text.

### Button

```css
.btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 12px 22px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:hover {
  border-color: var(--border-accent);
  background: var(--accent-glow);
}
.btn-primary {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}
.btn-primary:hover { transform: translateX(1px); filter: brightness(1.05); }
```

For "advance to next step" actions inside a tool (e.g. submit), use a small pill with the `→` arrow in cyan rather than a green ✓ — keeps the check mark reserved for feedback states.

### Modal

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(11, 14, 22, 0.6);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  padding: 18px;
}
.modal {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 28px;
  max-width: 420px;
  width: 100%;
  position: relative;
}
.modal-close {
  position: absolute; top: 14px; right: 14px;
  width: 32px; height: 32px;
  background: transparent; border: 0; cursor: pointer;
  color: var(--text-mid);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: var(--surface); color: var(--text); }
```

### Section label (divider)

```css
.section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border), transparent);
}
```

---

## Motion

Subtle and purposeful. Animations should:
- Telegraph interactivity (hover lifts, arrow shifts)
- Add ambient life (slow bobs on idle illustrations)
- Reinforce state changes (fade between tutorial slides)

Skip:
- Loops longer than ~3s
- Anything that moves while the user reads
- More than 2-3 simultaneous animations on screen

### Standards

- **Easing:** `ease` or `ease-in-out` for everything. Skip cubic-bezier unless there's a specific reason.
- **Hover transitions:** 0.2-0.25s
- **State changes / fades:** 0.28-0.4s
- **Idle ambient loops:** 2.5-4s

### ⚠️ The SVG transform gotcha (READ THIS)

In SVG, the CSS `transform` property **overrides** the SVG `transform` attribute on the same element. So:

```html
<!-- BROKEN: the SVG translate is ignored, element snaps to (0,0) -->
<g class="bouncing" transform="translate(100, 50)">...</g>
```

If `.bouncing` has any CSS `animation` that touches `transform` (even just `transform: scale(1)`), the SVG translate is wiped out. The element will animate from the SVG origin instead of from (100, 50).

**Always wrap**: outer `<g>` positions via the SVG attribute, inner `<g>` animates via CSS class:

```html
<!-- CORRECT: position and animation compose -->
<g transform="translate(100, 50)">
  <g class="bouncing">...</g>
</g>
```

This is non-negotiable for any SVG element that needs both positioning and CSS animation.

### Cycle animation (non-overlapping)

For multiple sibling elements that should appear in sequence at the same spot (e.g., feedback states cycling empty → ✓ → ✕):

```css
@keyframes cycle-visible {
  0%, 1% { opacity: 0; transform: scale(0.85); }
  4%     { opacity: 1; transform: scale(1); }
  30%    { opacity: 1; transform: scale(1); }
  33%    { opacity: 0; transform: scale(0.85); }
  100%   { opacity: 0; transform: scale(0.85); }
}
.cycle {
  animation: cycle-visible 3s ease-in-out backwards infinite;
  transform-origin: center;
  transform-box: fill-box;
}
```

Stagger siblings with `animation-delay: 0s, 1s, 2s` — each gets a clean 1-second slot in the 3s cycle, no cross-fade overlap. `backwards` fill-mode keeps elements hidden during their initial delay (without it they'd flash visible before their turn).

---

## SVG primitives

### Jar (40 × 52)

The hero shape across slush. Returns inner paths only (no `<svg>` wrapper), so it composes into any SVG context:

```js
function jarInner(hex, darkLabel) {
  // darkLabel: a darker shade of hex for the label band (e.g. shade(hex, -25))
  return `
    <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a"/>
    <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)"/>
    <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)"/>
    <rect x="12" y="9" width="16" height="3" fill="${darkLabel}"/>
    <path d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z" fill="${hex}"/>
    <path d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z" fill="rgba(0,0,0,0.18)"/>
    <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)"/>
    <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)"/>
    <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)"/>
    <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)"/>
    <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)"/>
    <path d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z" fill="rgba(0,0,0,0.2)"/>
  `;
}
```

### Empty slot (dashed, same dimensions)

```js
function slotInner() {
  return `
    <rect x="11" y="3" width="18" height="6" rx="1.5" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="3 3"/>
  `;
}
```

### Standard color palette (jars / accents in tools)

Default set:

```js
const COLORS_DEFAULT = ['#ef4444', '#fb923c', '#f472b6', '#60a5fa', '#c084fc', '#4ade80'];
//                       red       orange    pink      blue      purple    green
```

Extended pool (when the tool needs more variety):

```js
const COLORS_EXTRA = ['#facc15', '#22d3ee', '#a3e635', '#fb7185', '#fbbf24', '#a78bfa'];
//                     yellow    cyan      lime      rose      amber     violet
```

### Icons

Match the existing icon language: stroke-based, single weight (1.5px), `stroke-linecap="round" stroke-linejoin="round"`. The check `M -4 0 -1 3 4 -3`, the cross (two crossing lines), the right arrow `M 5 10 H14 M10 6 L14 10 L10 14`. Hand-drawn to match; don't pull in an icon library.

---

## Voice & copy

Lowercase for titles, tool names, section labels. Sentence case for descriptions.

Be terse. The interface should mostly explain itself; copy is for the bits it can't.

✓ "Solver for the in-game event. Tracks per-slot feedback and suggests your next pick."

✗ "An intelligent companion to help you optimize your Slush Station gameplay with cutting-edge solving algorithms."

Avoid: "powerful", "intelligent", "seamless", "magical", exclamation points, emoji in body copy. The reader is the player; they already know what they need.

Restrained playfulness is fine in empty states and ghost cards — `"more cooking · stay frosty"` ties the WoS theme in without overdoing it.

---

## File structure

The project is now a SvelteKit app. See `README.md` for the full layout. Key paths for design-system work:

```
src/lib/
├── styles/
│   ├── tokens.css        ← all CSS custom properties (source of truth for the tokens above)
│   ├── reset.css         ← body atmosphere + box-sizing + form resets
│   ├── typography.css    ← .hero, .hero-tag, .hero-title, .hero-sub, .eyebrow
│   └── animations.css    ← shared keyframes (t-bob, pop)
├── components/           ← reusable Svelte primitives (Button, Modal, Card, Snackbar, Jar, Tutorial, …)
├── i18n/                 ← messages/*.json + runes store
└── utils/                ← drag (no setPointerCapture), flip, storage, format, copy
src/routes/
├── +layout.svelte        ← imports styles/app.css, mounts <Snackbar> and <LocaleSwitcher>
├── +page.svelte          ← landing
├── slush/+page.svelte
└── tz/+page.svelte
```

Tokens are imported once at `src/lib/styles/app.css`; everything else reads `var(--token)`. Don't hardcode the same colors/radii/durations in component CSS.

Persistence still uses `localStorage`, wrapped in `src/lib/utils/storage.ts` for try/catch + SSR safety.

### Starter template for a new tool

1. Create the route: `src/routes/<name>/+page.svelte`.
2. Use the `i18n` runes store for strings — add keys to all 5 `messages/*.json` files.
3. Reuse design-system components: `Modal`, `Snackbar` (via the singleton store), `Tutorial`, `Card`, `Button`, `Jar`, etc.
4. Pure algorithms in `src/lib/tools/<name>/`; their UI components in `src/lib/tools/<name>/components/`.
5. Persistence through `src/lib/utils/storage.ts`.
6. If you need pointer drag, use `attachDrag` from `src/lib/utils/drag.ts` — **do not call `setPointerCapture`** (see the comment in that file).

```svelte
<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
</script>

<svelte:head>
  <title>{i18n.m.mytool.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<header class="hero">
  <div class="hero-tag">{i18n.m.landing.kicker}</div>
  <h1 class="hero-title">{i18n.m.mytool.title}</h1>
  <p class="hero-sub">{i18n.m.mytool.sub}</p>
</header>
```

### Adding a new tool to the menu

Edit `src/routes/+page.svelte` and add a new `<a class="tool-card">` block with a unique SVG visual and a `href="{base}/<name>/"`. Add `landing.<name>.title` and `landing.<name>.desc` keys to the i18n files.

When two or more tools are live, you can drop the ghost "more cooking" card.

---

## Anti-patterns

What breaks the system:

- **Multiple accent colors per page.** Cyan is the only primary. `--ok` green and `--no` red are for state feedback only — never for decoration or hierarchy.
- **Any light background.** This is dark end-to-end.
- **Bold sans-serif headings.** Always Fraunces italic for display.
- **Icon libraries.** No Lucide, no Feather, no Heroicons. Hand-draw icons matching the existing weight and feel.
- **Long-form copy.** If a description needs more than 2 sentences, it belongs in a tooltip, a "?" modal, or a sub-page.
- **High-opacity borders.** Borders are always low-opacity (`0.07-0.12`) — glass, not walls.
- **Tight, dense containers.** Generous whitespace is part of the calm feel.
- **First-person marketing voice.** "We think you'll love this." No.
- **CSS `transform` on SVG elements that also have a `transform` attribute.** See the gotcha section. Wrap with an outer group.
- **Physical CSS direction properties** in shared components. Use logical properties (`margin-inline-*`, `inset-inline-*`, `text-align: end`) so the Arabic RTL locale flips layout cleanly. The 0-24h slider in the TZ tool is an explicit exception — it's pinned `dir="ltr"`.
- **`setPointerCapture` for drag.** Use `attachDrag` from `src/lib/utils/drag.ts`, which attaches `pointermove`/`pointerup`/`pointercancel` on `document` and filters by `pointerId`. Capture is fragile on iOS Safari.
