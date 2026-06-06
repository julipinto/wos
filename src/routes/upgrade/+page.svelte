<script lang="ts">
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { HUB_CARDS, effectiveStatus } from '$lib/tools/upgrade/catalog';

  // Category names are looked up by a string id, so index through a cast.
  const catName = (k: string) => (i18n.m.upgrade.cat as Record<string, string>)[k];
</script>

<svelte:head>
  <title>{i18n.m.upgrade.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.title} sub={i18n.m.upgrade.sub} backHref="/" />

  <h2 class="section-label">{i18n.m.upgrade.hubEyebrow}</h2>
  <div class="grid">
    {#each HUB_CARDS as card (card.id)}
      {@const status = effectiveStatus(card)}
      {#if status === 'soon'}
        <div class="card is-soon">
          <span class="icon" aria-hidden="true">{card.icon}</span>
          <span class="name">{catName(card.i18n)}</span>
          <span class="tag">{i18n.m.upgrade.soon}</span>
        </div>
      {:else}
        <a href="{base}{card.route}" class="card">
          <span class="icon" aria-hidden="true">{card.icon}</span>
          <span class="name">{catName(card.i18n)}</span>
          {#if status === 'preview'}<span class="tag tag--preview">{i18n.m.upgrade.preview}</span
            >{/if}
        </a>
      {/if}
    {/each}
  </div>
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .section-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0 16px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 22px 20px;
    min-height: 116px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: inherit;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }
  a.card:hover {
    background: var(--surface-hover);
    border-color: var(--border-accent);
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
  }
  .icon {
    font-size: 30px;
    line-height: 1;
  }
  .name {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 19px;
    line-height: 1.1;
    margin-top: auto;
  }
  .tag {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 2px 8px;
  }
  .tag--preview {
    color: var(--accent);
    border-color: var(--border-accent);
  }

  .card.is-soon {
    background: transparent;
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.07);
    cursor: default;
  }
  .card.is-soon .icon,
  .card.is-soon .name {
    opacity: 0.45;
  }

  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
    .card {
      padding: 18px 16px;
      min-height: 104px;
    }
    .name {
      font-size: 17px;
    }
  }
</style>
