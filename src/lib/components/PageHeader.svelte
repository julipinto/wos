<script lang="ts">
  import type { Snippet } from 'svelte';
  import { base } from '$app/paths';
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
    /** Larger hero size — use on the landing. */
    large?: boolean;
  }

  let { title, sub, backHref = '/', actions, large = false }: Props = $props();

  const back = $derived(backHref === null ? null : `${base}${backHref}`);
</script>

<header class="page-header">
  <div class="top-row">
    {#if back}
      <a class="back" href={back} aria-label="Back">
        <Icon name="arrow-left" size={12} />
        <span class="kicker">{i18n.m.landing.kicker}</span>
      </a>
    {:else}
      <span class="kicker kicker-static">{i18n.m.landing.kicker}</span>
    {/if}
    <div class="actions">
      {#if actions}{@render actions()}{/if}
      <LocaleSwitcher />
    </div>
  </div>

  <div class="hero" class:large>
    <h1 class="hero-title">{title}</h1>
    {#if sub}<p class="hero-sub">{sub}</p>{/if}
  </div>
</header>

<style>
  .page-header {
    margin-bottom: 22px;
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
  .hero {
    text-align: center;
    padding: 8px 0 16px;
  }
  .hero.large {
    padding: 24px 0 48px;
  }
  .hero-title {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 800;
    font-size: clamp(48px, 12vw, 84px);
    line-height: 0.92;
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
