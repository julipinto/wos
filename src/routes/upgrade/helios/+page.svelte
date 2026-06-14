<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { sumLadder, scaleBag } from '$lib/tools/upgrade/engine';
  import { HELIOS_NODES } from '$lib/tools/upgrade/data/helios';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-helios-v1';
  interface Saved {
    count: number;
    nodes: Record<string, { from: string; to: string }>;
    /** Which evolutions are in the plan (removable, like the building rows). */
    included: string[];
  }
  const ALL_IDS = HELIOS_NODES.map((n) => n.id);
  function load(): Saved {
    const raw = readJson<Saved>(STORAGE);
    const nodes: Record<string, { from: string; to: string }> = {};
    for (const n of HELIOS_NODES) {
      const labels = n.ladder.map((l) => l.label);
      const r = raw?.nodes?.[n.id];
      const valid = r && labels.includes(r.from) && labels.includes(r.to);
      nodes[n.id] = valid ? r : { from: labels[0], to: labels[labels.length - 1] };
    }
    const inc =
      raw && Array.isArray(raw.included)
        ? raw.included.filter((id) => ALL_IDS.includes(id))
        : ALL_IDS;
    return { count: raw?.count && raw.count >= 1 ? raw.count : 1, nodes, included: inc };
  }
  const state = $state<Saved>(load());
  const persist = () =>
    writeJson(STORAGE, {
      count: state.count,
      nodes: { ...state.nodes },
      included: [...state.included]
    });

  const countOptions = [1, 2, 3].map((n) => ({ value: String(n), label: String(n) }));

  const nodeName = (k: string) => (i18n.m.upgrade.helios as Record<string, string>)[k];

  // Only the evolutions you've kept; remove drops one, the add chips bring it back.
  const shownNodes = $derived(HELIOS_NODES.filter((n) => state.included.includes(n.id)));
  const availableNodes = $derived(HELIOS_NODES.filter((n) => !state.included.includes(n.id)));
  function removeNode(id: string) {
    state.included = state.included.filter((x) => x !== id);
    persist();
  }
  function addNode(id: string) {
    state.included = [...state.included, id];
    persist();
  }

  // Per-node totals scaled by how many troop types you're maxing.
  const heliosItems = $derived(
    shownNodes.map((n) => ({
      label: nodeName(n.i18n),
      totals: scaleBag(
        sumLadder(n.ladder, state.nodes[n.id].from, state.nodes[n.id].to).totals,
        state.count
      )
    }))
  );
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

  {#if shownNodes.length > 0}
    <div class="nodes">
      {#each shownNodes as node (node.id)}
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
            <button
              class="remove"
              type="button"
              onclick={() => removeNode(node.id)}
              aria-label={i18n.m.upgrade.troops.remove}>×</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if availableNodes.length > 0}
    <div class="add">
      <span class="field-label">{i18n.m.upgrade.add}</span>
      <div class="chips">
        {#each availableNodes as node (node.id)}
          <button class="chip" type="button" onclick={() => addNode(node.id)}
            >+ {nodeName(node.i18n)}</button
          >
        {/each}
      </div>
    </div>
  {/if}

  <Totals items={heliosItems} emptyHint={i18n.m.upgrade.addHint} />
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
    margin-bottom: 16px;
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
  .remove {
    flex-shrink: 0;
    width: 36px;
    height: 44px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .remove:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .add {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 28px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .chip:hover {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--surface-hover);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
