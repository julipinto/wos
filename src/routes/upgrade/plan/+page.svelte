<script lang="ts">
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import {
    addBags,
    applySpeed,
    formatQty,
    formatDuration,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES, type ResourceBag } from '$lib/tools/upgrade/types';
  import { boosters, type BoosterCategory } from '$lib/tools/upgrade/boosters-store.svelte';
  import { planLines, cutBase } from '$lib/tools/upgrade/plan';

  // Snapshot of saved selections (read once on load).
  const lines = planLines();

  const zimanPct = $derived(boosters.contribution('zinman'));
  // Apply Zinman's construction base-resource cut to the buildings line.
  const adjLines = $derived(
    lines.map((l) =>
      l.id === 'buildings' && zimanPct > 0 ? { ...l, totals: cutBase(l.totals, zimanPct) } : l
    )
  );

  const grand = $derived(adjLines.reduce<ResourceBag>((acc, l) => addBags(acc, l.totals), {}));
  const grandRows = $derived(presentResources(grand));

  // Time runs in parallel queues, so report per category — never one summed total.
  const TIME_CATS: BoosterCategory[] = ['construction', 'research', 'training'];
  const catTime = (cat: BoosterCategory) =>
    adjLines
      .filter((l) => l.timeCategory === cat)
      .reduce((t, l) => t + applySpeed(l.time, boosters.total(cat)), 0);
  const timeRows = $derived(
    TIME_CATS.map((cat) => ({ cat, secs: catTime(cat) })).filter((t) => t.secs > 0)
  );
  const timeLabel = (cat: BoosterCategory) =>
    cat === 'construction'
      ? i18n.m.upgrade.buildTime
      : cat === 'research'
        ? i18n.m.upgrade.researchTime
        : i18n.m.upgrade.trainTime;

  const catName = (k: string) => (i18n.m.upgrade.cat as Record<string, string>)[k];
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.plan} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.plan} sub={i18n.m.upgrade.plan.sub} backHref="/upgrade" />

  {#if lines.length === 0}
    <p class="empty">{i18n.m.upgrade.plan.empty}</p>
    <a class="cta" href="{base}/upgrade">{i18n.m.common.back}</a>
  {:else}
    <Boosters categories={['construction', 'research', 'training']} />

    <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
    <div class="totals">
      {#each grandRows as key (key)}
        {@const def = resDef(key)}
        <div class="res">
          <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
          <span class="res-name">{resName(key)}</span>
          <span class="res-val">{formatQty(grand[key] ?? 0)}</span>
        </div>
      {/each}
    </div>

    {#if timeRows.length > 0}
      <div class="meta-row">
        {#each timeRows as t (t.cat)}
          <div class="meta">
            <span class="meta-label">{timeLabel(t.cat)}</span>
            <span class="meta-val">{formatDuration(t.secs)}</span>
          </div>
        {/each}
      </div>
      <p class="parallel">{i18n.m.upgrade.plan.parallel}</p>
    {/if}

    <h2 class="section-label">{i18n.m.upgrade.plan.includes}</h2>
    <div class="lines">
      {#each adjLines as l (l.id)}
        <a class="line" href="{base}/upgrade/{l.id}">
          <div class="line-head">
            <span class="line-name">{catName(l.id)}</span>
            <span class="line-res">
              {#each presentResources(l.totals).slice(0, 4) as k (k)}
                <span class="chip">{resDef(k).icon} {formatQty(l.totals[k] ?? 0)}</span>
              {/each}
            </span>
          </div>
          {#if l.detail.length > 0}
            <div class="line-detail">
              {#each l.detail.slice(0, 6) as d, i (i)}
                <span class="dchip">{d}</span>
              {/each}
              {#if l.detail.length > 6}
                <span class="dchip more">+{l.detail.length - 6}</span>
              {/if}
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .empty {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
  }
  .cta {
    display: inline-block;
    margin-top: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
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
    margin: 24px 0 16px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .totals {
    display: grid;
    gap: 10px;
  }
  .res {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .res-icon {
    font-size: 20px;
    line-height: 1;
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .res-name {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-mid);
    flex: 1;
  }
  .res-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }
  .meta {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .meta-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
  }
  .parallel {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin: 10px 0 0;
  }
  .lines {
    display: grid;
    gap: 8px;
  }
  .line {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s ease;
  }
  .line:hover {
    border-color: var(--border-accent);
  }
  .line-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .line-name {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 16px;
  }
  .line-res {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
  .chip {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-mid);
  }
  .line-detail {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .dchip {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 2px 8px;
  }
  .dchip.more {
    color: var(--text-mid);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
