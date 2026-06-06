<script lang="ts">
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';

  const slushJars: { x: number; hex: string; dark: string; delay: number }[] = [
    { x: 2, hex: '#ef4444', dark: '#a83333', delay: 0 },
    { x: 46, hex: '#60a5fa', dark: '#3a78c4', delay: 0.3 },
    { x: 90, hex: '#4ade80', dark: '#2c8a4f', delay: 0.6 }
  ];
</script>

<svelte:head>
  <title>{i18n.m.landing.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.landing.title} sub={i18n.m.landing.sub} backHref={null} large />

  <div class="tools">
    <h2 class="section-label">{i18n.m.landing.sectionEveryday}</h2>
    <a href="{base}/upgrade" class="tool-card">
      <div class="tool-visual" aria-hidden="true">
        <svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
          {#each [10, 38, 66, 94] as x, i (i)}
            {@const h = 12 + i * 11}
            <rect
              {x}
              y={50 - h}
              width="22"
              height={h}
              rx="2"
              fill={i === 3 ? 'rgba(255,209,102,0.18)' : 'rgba(147,212,255,0.10)'}
              stroke={i === 3 ? 'rgba(255,209,102,0.55)' : 'rgba(147,212,255,0.3)'}
            />
          {/each}
          <g class="t-bob" style="transform-origin: 105px 8px;">
            <path
              d="M105 3 L108 9 L114 9 L109 13 L111 19 L105 15 L99 19 L101 13 L96 9 L102 9 Z"
              fill="rgba(255,209,102,0.7)"
            />
          </g>
        </svg>
      </div>
      <div class="tool-body">
        <h2 class="tool-name">{i18n.m.landing.upgrade.title}</h2>
        <p class="tool-desc">{i18n.m.landing.upgrade.desc}</p>
      </div>
      <svg
        class="tool-arrow"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 10 H14 M10 6 L14 10 L10 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>

    <a href="{base}/tz" class="tool-card">
      <div class="tool-visual" aria-hidden="true">
        <svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tz-track" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(255,255,255,0.05)" />
              <stop offset="50%" stop-color="rgba(255,255,255,0.15)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          <rect x="8" y="28" width="116" height="4" rx="2" fill="url(#tz-track)" />
          <line x1="8" y1="24" x2="8" y2="36" stroke="rgba(255,255,255,0.18)" />
          <line x1="37" y1="26" x2="37" y2="34" stroke="rgba(255,255,255,0.10)" />
          <line x1="66" y1="24" x2="66" y2="36" stroke="rgba(255,255,255,0.18)" />
          <line x1="95" y1="26" x2="95" y2="34" stroke="rgba(255,255,255,0.10)" />
          <line x1="124" y1="24" x2="124" y2="36" stroke="rgba(255,255,255,0.18)" />
          <g class="t-bob" style="animation-delay: 0s; transform-origin: 66px 30px;">
            <line
              x1="66"
              y1="16"
              x2="66"
              y2="44"
              stroke="#93d4ff"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <circle cx="66" cy="14" r="3.5" fill="#93d4ff" />
          </g>
          <g class="t-bob" style="animation-delay: 0.25s; transform-origin: 42px 32px;">
            <line
              x1="42"
              y1="20"
              x2="42"
              y2="44"
              stroke="#fb923c"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <circle cx="42" cy="18" r="3" fill="#fb923c" />
          </g>
          <g class="t-bob" style="animation-delay: 0.5s; transform-origin: 100px 32px;">
            <line
              x1="100"
              y1="20"
              x2="100"
              y2="44"
              stroke="#4ade80"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <circle cx="100" cy="18" r="3" fill="#4ade80" />
          </g>
        </svg>
      </div>
      <div class="tool-body">
        <h2 class="tool-name">{i18n.m.landing.tz.title}</h2>
        <p class="tool-desc">{i18n.m.landing.tz.desc}</p>
      </div>
      <svg
        class="tool-arrow"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 10 H14 M10 6 L14 10 L10 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>

    <h2 class="section-label section-label--later">{i18n.m.landing.sectionEvents}</h2>
    <a href="{base}/slush" class="tool-card">
      <div class="tool-visual" aria-hidden="true">
        <svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
          {#each slushJars as jar, i (i)}
            <g transform="translate({jar.x}, 5)">
              <g class="t-bob" style="animation-delay: {jar.delay}s;">
                <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a" />
                <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)" />
                <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)" />
                <rect x="12" y="9" width="16" height="3" fill={jar.dark} />
                <path
                  d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
                  fill={jar.hex}
                />
                <path
                  d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z"
                  fill="rgba(0,0,0,0.18)"
                />
                <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)" />
                <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)" />
                <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)" />
                <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)" />
                <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)" />
                <path
                  d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
                  fill="rgba(0,0,0,0.2)"
                />
              </g>
            </g>
          {/each}
        </svg>
      </div>
      <div class="tool-body">
        <h2 class="tool-name">{i18n.m.landing.slush.title}</h2>
        <p class="tool-desc">{i18n.m.landing.slush.desc}</p>
      </div>
      <svg
        class="tool-arrow"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 10 H14 M10 6 L14 10 L10 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>

    <a href="{base}/gingado" class="tool-card">
      <div class="tool-visual" aria-hidden="true">
        <svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
          {#each [22, 44, 66, 88, 110, 33, 55, 77, 99, 44, 66, 88] as cx, i (i)}
            {@const cy = i < 5 ? 16 : i < 9 ? 30 : 44}
            <circle {cx} {cy} r="2.2" fill="rgba(205,233,255,0.55)" />
          {/each}
          {#each [22, 46, 70, 94] as x, i (i)}
            <rect
              x={x - 1}
              y="50"
              width="20"
              height="8"
              rx="1.5"
              fill={i === 1 ? 'rgba(255,209,102,0.16)' : 'rgba(147,212,255,0.08)'}
              stroke={i === 1 ? 'rgba(255,209,102,0.5)' : 'rgba(147,212,255,0.25)'}
            />
          {/each}
          <g class="t-bob" style="transform-origin: 66px 8px;">
            <circle cx="66" cy="8" r="4" fill="#fff" />
          </g>
        </svg>
      </div>
      <div class="tool-body">
        <h2 class="tool-name">{i18n.m.landing.gingado.title}</h2>
        <p class="tool-desc">{i18n.m.landing.gingado.desc}</p>
      </div>
      <svg
        class="tool-arrow"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 10 H14 M10 6 L14 10 L10 14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>

    <div class="tool-card is-ghost">
      <div class="tool-visual" aria-hidden="true">
        <svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
          {#each [2, 46, 90] as x, i (i)}
            <g transform="translate({x}, 5)" opacity="0.35">
              <rect
                x="11"
                y="3"
                width="18"
                height="6"
                rx="1.5"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                stroke-width="1"
                stroke-dasharray="2 2"
              />
              <path
                d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.18)"
                stroke-width="1"
                stroke-dasharray="3 3"
              />
            </g>
          {/each}
        </svg>
      </div>
      <div class="tool-body">
        <h2 class="tool-name">{i18n.m.landing.ghost.title}</h2>
        <p class="tool-desc">{i18n.m.landing.ghost.desc}</p>
      </div>
    </div>
  </div>

  <!-- Personal signature — intentionally not localized, stays the same in
       every language. -->
  <footer class="foot">3214 ❤️ SUV</footer>
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }

  .tools {
    display: grid;
    gap: 14px;
  }
  .section-label {
    /* Style guide section divider — uppercase mono label with a fading rule
     * on the trailing side. */
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0 -2px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  /* The second (and any subsequent) section gets a little extra breathing
   * room above so the groups read as separate. */
  .section-label--later {
    margin-top: 24px;
  }

  .tool-card {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 22px 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: inherit;
    text-decoration: none;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease,
      box-shadow 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .tool-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 240px 120px at 0% 50%,
      rgba(147, 212, 255, 0.08),
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  a.tool-card:hover {
    background: var(--surface-hover);
    border-color: var(--border-accent);
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
  }
  a.tool-card:hover::before {
    opacity: 1;
  }
  .tool-visual {
    flex-shrink: 0;
    width: 104px;
    height: 48px;
  }
  .tool-visual svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .tool-body {
    flex: 1;
    min-width: 0;
  }
  .tool-name {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 22px;
    line-height: 1.15;
    margin: 0 0 6px;
    letter-spacing: -0.01em;
  }
  .tool-desc {
    font-family: var(--font-mono);
    color: var(--text-mid);
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
  }
  .tool-arrow {
    flex-shrink: 0;
    color: var(--text-dim);
    transition:
      color 0.25s ease,
      transform 0.25s ease;
  }
  a.tool-card:hover .tool-arrow {
    color: var(--accent);
    transform: translateX(4px);
  }

  .tool-card.is-ghost {
    background: transparent;
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.07);
    cursor: default;
  }
  .tool-card.is-ghost::before {
    display: none;
  }
  .tool-card.is-ghost .tool-name {
    color: var(--text-mid);
  }
  .tool-card.is-ghost .tool-desc {
    color: var(--text-dim);
  }

  .foot {
    margin-top: 56px;
    text-align: center;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
    .tool-card {
      padding: 18px;
      gap: 16px;
    }
    .tool-visual {
      width: 82px;
      height: 40px;
    }
    .tool-name {
      font-size: 19px;
    }
    .tool-desc {
      font-size: 11px;
    }
  }
</style>
