<script lang="ts">
  import type { Component } from 'svelte';
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import GlyphUpgrade from '$lib/components/icons/GlyphUpgrade.svelte';
  import GlyphTerritory from '$lib/components/icons/GlyphTerritory.svelte';
  import GlyphTz from '$lib/components/icons/GlyphTz.svelte';
  import GlyphCalendar from '$lib/components/icons/GlyphCalendar.svelte';
  import GlyphSlush from '$lib/components/icons/GlyphSlush.svelte';
  import GlyphGingado from '$lib/components/icons/GlyphGingado.svelte';
  import GlyphSoon from '$lib/components/icons/GlyphSoon.svelte';

  // Each everyday tool: its route, glyph component, and i18n key.
  const tools: {
    href: string;
    glyph: Component;
    key: 'upgrade' | 'territory' | 'tz' | 'calendar';
  }[] = [
    { href: 'upgrade', glyph: GlyphUpgrade, key: 'upgrade' },
    { href: 'territory', glyph: GlyphTerritory, key: 'territory' },
    { href: 'events', glyph: GlyphCalendar, key: 'calendar' },
    { href: 'tz', glyph: GlyphTz, key: 'tz' }
  ];
  const events: { href: string; glyph: Component; key: 'slush' | 'gingado' }[] = [
    { href: 'slush', glyph: GlyphSlush, key: 'slush' },
    { href: 'gingado', glyph: GlyphGingado, key: 'gingado' }
  ];
</script>

{#snippet toolCard(href: string, Glyph: Component, title: string, desc: string)}
  <a href="{base}/{href}" class="tool-card">
    <div class="tool-visual" aria-hidden="true"><Glyph /></div>
    <div class="tool-body">
      <h2 class="tool-name">{title}</h2>
      <p class="tool-desc">{desc}</p>
    </div>
    <Icon name="arrow-right" size={20} class="tool-arrow" />
  </a>
{/snippet}

<svelte:head>
  <title>{i18n.m.landing.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.landing.title} sub={i18n.m.landing.sub} backHref={null} large />

  <div class="tools">
    <h2 class="section-label">{i18n.m.landing.sectionEveryday}</h2>
    {#each tools as t (t.href)}
      {@render toolCard(t.href, t.glyph, i18n.m.landing[t.key].title, i18n.m.landing[t.key].desc)}
    {/each}

    <h2 class="section-label section-label--later">{i18n.m.landing.sectionEvents}</h2>
    {#each events as t (t.href)}
      {@render toolCard(t.href, t.glyph, i18n.m.landing[t.key].title, i18n.m.landing[t.key].desc)}
    {/each}

    <div class="tool-card is-ghost">
      <div class="tool-visual" aria-hidden="true"><GlyphSoon /></div>
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
  /* The glyph svg lives inside a child component, so reach it with :global. */
  .tool-visual :global(svg) {
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
  /* tool-arrow is the shared Icon (a child component), so target it globally
     but scoped under .tool-card to stay contained. */
  .tool-card :global(.tool-arrow) {
    flex-shrink: 0;
    color: var(--text-dim);
    transition:
      color 0.25s ease,
      transform 0.25s ease;
  }
  a.tool-card:hover :global(.tool-arrow) {
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
