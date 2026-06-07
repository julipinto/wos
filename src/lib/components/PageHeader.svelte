<script lang="ts">
  import type { Snippet } from 'svelte';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { i18n } from '$lib/i18n/index.svelte';
  import Icon from './Icon.svelte';
  import LocaleSwitcher from './LocaleSwitcher.svelte';

  interface Props {
    /** Big italic Fraunces title (lowercase, see voice guide). */
    title: string;
    /** One-line subtitle in DM Mono. */
    sub?: string;
    /** Back link target relative to base — pass null on the landing. Default '/'. */
    backHref?: string | null;
    /** Tool-specific action buttons rendered before LocaleSwitcher. */
    actions?: Snippet;
    /** Larger hero + centered kicker-with-side-dashes above the title.
     * Use on the landing — tool pages keep the compact left-aligned kicker. */
    large?: boolean;
  }

  let { title, sub, backHref = '/', actions, large = false }: Props = $props();

  const back = $derived(backHref === null ? null : `${base}${backHref}`);

  // On any upgrade sub-tool (but not the plan page itself), offer a quick jump
  // to the combined overview so users can hop straight to "My Plan".
  const showPlanLink = $derived(
    $page.url.pathname.includes('/upgrade/') && !$page.url.pathname.endsWith('/upgrade/plan')
  );
</script>

<header class="page-header">
  <!-- Pref row: locale switcher only. Stays at the very top because it's
       low-frequency — the tool actions get the more prominent position. -->
  <div class="pref-row">
    <LocaleSwitcher />
  </div>

  <!-- Tool pages: kicker lives next to the back link in the top-row.
       Landing: kicker moves into the hero with side-dashes (original
       treatment), so the top-row is just actions. -->
  <div class="top-row" class:no-kicker={large}>
    {#if back}
      <a class="back" href={back} aria-label="Back">
        <Icon name="arrow-left" size={12} />
        <span class="kicker">{i18n.m.landing.kicker}</span>
      </a>
    {:else if !large}
      <span class="kicker kicker-static">{i18n.m.landing.kicker}</span>
    {:else}
      <span></span>
    {/if}
    <div class="actions">
      {#if showPlanLink}
        <a class="plan-link" href="{base}/upgrade/plan">
          <Icon name="clipboard-list" size={13} />
          <span>{i18n.m.upgrade.cat.plan}</span>
        </a>
      {/if}
      {#if actions}{@render actions()}{/if}
    </div>
  </div>

  <div class="hero" class:large>
    {#if large}
      <div class="hero-kicker">{i18n.m.landing.kicker}</div>
    {/if}
    <h1 class="hero-title">{title}</h1>
    {#if sub}<p class="hero-sub">{sub}</p>{/if}
  </div>
</header>

<style>
  .page-header {
    margin-bottom: 22px;
  }
  .pref-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 14px;
  }
  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 28px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-mid);
    text-decoration: none;
    padding: 4px 8px;
    margin-inline-start: -8px;
    border-radius: var(--r-pill);
    transition:
      color 0.2s ease,
      background 0.2s ease;
  }
  .back:hover {
    color: var(--text);
    background: var(--surface);
  }
  .kicker {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .back:hover .kicker {
    color: var(--text-mid);
  }
  .kicker-static {
    padding: 4px 0;
  }
  .actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .plan-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    background: var(--surface);
    color: var(--text-mid);
    text-decoration: none;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .plan-link:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .hero {
    text-align: center;
    padding: 8px 0 16px;
  }
  .hero.large {
    padding: 8px 0 48px;
  }
  .hero-kicker {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin: 0 auto 24px;
    display: inline-flex;
    align-items: center;
    gap: 14px;
  }
  .hero-kicker::before,
  .hero-kicker::after {
    content: '';
    width: 22px;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
  @media (max-width: 540px) {
    .hero-kicker {
      font-size: 10px;
      letter-spacing: 4px;
    }
  }
  .hero-title {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: clamp(48px, 12vw, 84px);
    line-height: 0.92;
    /* Italic descenders (p, g) overflow the tight line box and were clipped /
       crowded by the subtitle — give them room. */
    padding-bottom: 0.14em;
    margin: 0;
    letter-spacing: -0.035em;
    background: linear-gradient(180deg, #ffffff 20%, #93d4ff 130%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero.large .hero-title {
    font-size: clamp(64px, 16vw, 104px);
  }
  .hero-sub {
    font-family: var(--font-mono);
    color: var(--text-mid);
    font-size: 13px;
    line-height: 1.6;
    max-width: 420px;
    margin: 14px auto 0;
  }
  .hero.large .hero-sub {
    margin-top: 20px;
  }

  @media (max-width: 540px) {
    .pref-row {
      margin-bottom: 10px;
    }
    .top-row {
      margin-bottom: 22px;
    }
    .hero-title {
      font-size: clamp(40px, 13vw, 64px);
    }
    .hero-sub {
      font-size: 12px;
      margin-top: 10px;
    }
  }
</style>
