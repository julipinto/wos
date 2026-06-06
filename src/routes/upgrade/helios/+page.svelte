<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import {
    sumLadder,
    combine,
    scaleBag,
    formatQty,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { HELIOS_NODES } from '$lib/tools/upgrade/data/helios';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-helios-v1';
  interface Saved {
    count: number;
    nodes: Record<string, { from: string; to: string }>;
  }
  function load(): Saved {
    const raw = readJson<Saved>(STORAGE);
    const nodes: Record<string, { from: string; to: string }> = {};
    for (const n of HELIOS_NODES) {
      const labels = n.ladder.map((l) => l.label);
      const r = raw?.nodes?.[n.id];
      const valid = r && labels.includes(r.from) && labels.includes(r.to);
      nodes[n.id] = valid ? r : { from: labels[0], to: labels[labels.length - 1] };
    }
    return { count: raw?.count && raw.count >= 1 ? raw.count : 1, nodes };
  }
  const state = $state<Saved>(load());
  const persist = () => writeJson(STORAGE, { count: state.count, nodes: { ...state.nodes } });

  const countOptions = [1, 2, 3].map((n) => ({ value: String(n), label: String(n) }));

  const result = $derived(
    scaleBag(
      combine(
        HELIOS_NODES.map((n) => sumLadder(n.ladder, state.nodes[n.id].from, state.nodes[n.id].to))
      ).totals,
      state.count
    )
  );
  const rows = $derived(presentResources(result));
  const nodeName = (k: string) => (i18n.m.upgrade.helios as Record<string, string>)[k];
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.helios} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.helios}
    sub={i18n.m.upgrade.helios.sub}
    backHref="/upgrade"
  />

  <div class="warn" role="note">
    <strong>⚠ {i18n.m.upgrade.unverified}</strong>
    <span>{i18n.m.upgrade.helios.note}</span>
  </div>

  <div class="count">
    <span class="field-label">{i18n.m.upgrade.helios.troopTypes}</span>
    <Select
      value={String(state.count)}
      options={countOptions}
      onChange={(v) => {
        state.count = Number(v);
        persist();
      }}
      ariaLabel={i18n.m.upgrade.helios.troopTypes}
    />
  </div>

  <div class="nodes">
    {#each HELIOS_NODES as node (node.id)}
      <div class="node">
        <span class="node-name">{nodeName(node.i18n)}</span>
        <div class="node-controls">
          <RangeSelect
            labels={node.ladder.map((l) => l.label)}
            from={state.nodes[node.id].from}
            to={state.nodes[node.id].to}
            onChange={(f, t) => {
              state.nodes[node.id].from = f;
              state.nodes[node.id].to = t;
              persist();
            }}
            ariaFrom="{nodeName(node.i18n)} {i18n.m.upgrade.from}"
            ariaTo="{nodeName(node.i18n)} {i18n.m.upgrade.to}"
          />
        </div>
      </div>
    {/each}
  </div>

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
          <span class="res-val">{formatQty(result[key] ?? 0)}</span>
        </div>
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
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
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
  }
  .count {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 20px;
    max-width: 220px;
  }
  .nodes {
    display: grid;
    gap: 8px;
    margin-bottom: 28px;
  }
  .node {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .node-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .node-controls {
    display: flex;
    align-items: center;
    gap: 8px;
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
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
