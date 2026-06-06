<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import {
    addBags,
    formatQty,
    formatDuration,
    applySpeed,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { boosters } from '$lib/tools/upgrade/boosters-store.svelte';
  import { RESOURCES, type ResourceBag } from '$lib/tools/upgrade/types';
  import { RESEARCH_TREES } from '$lib/tools/upgrade/data/research';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-research-v1';
  function load(): Record<string, boolean> {
    const def = Object.fromEntries(RESEARCH_TREES.map((t) => [t.id, false]));
    const raw = readJson<Record<string, boolean>>(STORAGE);
    return raw ? { ...def, ...raw } : def;
  }
  const selected = $state<Record<string, boolean>>(load());
  function toggle(id: string) {
    selected[id] = !selected[id];
    writeJson(STORAGE, { ...selected });
  }

  const result = $derived.by(() => {
    let totals: ResourceBag = {};
    let time = 0;
    for (const t of RESEARCH_TREES) {
      if (selected[t.id]) {
        totals = addBags(totals, t.total);
        time += t.time;
      }
    }
    return { totals, time };
  });
  const rows = $derived(presentResources(result.totals));
  const effTime = $derived(applySpeed(result.time, boosters.total('research')));
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
  const treeName = (k: string) => (i18n.m.upgrade.research as Record<string, string>)[k];
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.research} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.research}
    sub={i18n.m.upgrade.research.sub}
    backHref="/upgrade"
  />

  <div class="warn" role="note">
    <strong>⚠ {i18n.m.upgrade.unverified}</strong>
    <span>{i18n.m.upgrade.research.note}</span>
  </div>

  <div class="trees">
    {#each RESEARCH_TREES as tree (tree.id)}
      <button
        class="tree"
        class:on={selected[tree.id]}
        type="button"
        role="switch"
        aria-checked={selected[tree.id]}
        onclick={() => toggle(tree.id)}
      >
        <span class="check" aria-hidden="true">{selected[tree.id] ? '✓' : ''}</span>
        <span class="tree-name">{treeName(tree.i18n)}</span>
        <span class="tree-meta">{tree.nodes} {i18n.m.upgrade.research.nodes}</span>
      </button>
    {/each}
  </div>

  <Boosters categories={['research']} />

  <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
  {#if rows.length === 0}
    <p class="empty">{i18n.m.upgrade.addHint}</p>
  {:else}
    <div class="totals">
      {#each rows as key (key)}
        {@const def = resDef(key)}
        <div class="res">
          <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
          <span class="res-name">{resName(key)}</span>
          <span class="res-val">{formatQty(result.totals[key] ?? 0)}</span>
        </div>
      {/each}
    </div>
    <div class="meta">
      <span class="field-label">{i18n.m.upgrade.researchTime}</span>
      <span class="meta-val">{formatDuration(effTime)}</span>
      {#if boosters.total('research') > 0}
        <span class="meta-base">{i18n.m.upgrade.boosters.base}: {formatDuration(result.time)}</span>
      {/if}
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
  .warn {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(251, 146, 60, 0.08);
    border: 1px solid rgba(251, 146, 60, 0.35);
    border-radius: var(--r-card);
    padding: 14px 16px;
    margin-bottom: 22px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-mid);
  }
  .warn strong {
    color: #fb923c;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .trees {
    display: grid;
    gap: 10px;
    margin-bottom: 28px;
  }
  .tree {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    cursor: pointer;
    text-align: start;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .tree.on {
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .check {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    color: var(--accent);
    font-size: 13px;
  }
  .tree.on .check {
    border-color: var(--accent);
  }
  .tree-name {
    flex: 1;
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 18px;
  }
  .tree-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
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
  .empty {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
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
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    margin-top: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .meta-val {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
  }
  .meta-base {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 2px;
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
