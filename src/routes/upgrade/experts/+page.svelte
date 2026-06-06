<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import { sumLadder, combine, formatQty, presentResources } from '$lib/tools/upgrade/engine';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { EXPERTS } from '$lib/tools/upgrade/data/experts';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-experts-v1';
  interface Row {
    expert: string;
    from: string;
    to: string;
  }
  const byId = (id: string) => EXPERTS.find((e) => e.id === id);
  function load(): Row[] {
    const raw = readJson<Row[]>(STORAGE);
    return Array.isArray(raw) ? raw.filter((r) => byId(r.expert)) : [];
  }
  const rows = $state<Row[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      rows.map((r) => ({ ...r }))
    );

  const available = $derived(EXPERTS.filter((e) => !rows.some((r) => r.expert === e.id)));
  const options = (id: string) =>
    (byId(id)?.ladder ?? []).map((l) => ({ value: l.label, label: l.label }));

  function addExpert(id: string) {
    const e = byId(id);
    if (!e) return;
    rows.push({ expert: id, from: '0', to: e.ladder[e.ladder.length - 1].label });
    persist();
  }
  function removeRow(i: number) {
    rows.splice(i, 1);
    persist();
  }

  const result = $derived(
    combine(rows.map((r) => sumLadder(byId(r.expert)?.ladder ?? [], r.from, r.to))).totals
  );
  const totalRows = $derived(presentResources(result));
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.experts} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.experts}
    sub={i18n.m.upgrade.experts.sub}
    backHref="/upgrade"
  />

  <div class="warn" role="note">
    <strong>⚠ {i18n.m.upgrade.unverified}</strong>
    <span>{i18n.m.upgrade.experts.note}</span>
  </div>

  {#if rows.length > 0}
    <div class="rows">
      {#each rows as row, i (row.expert)}
        {@const e = byId(row.expert)}
        <div class="row">
          <span class="ex-name">{e?.name}<span class="focus">{e?.focus}</span></span>
          <div class="row-controls">
            <Select
              value={row.from}
              options={options(row.expert)}
              onChange={(v) => {
                rows[i].from = v;
                persist();
              }}
              ariaLabel="{e?.name} {i18n.m.upgrade.from}"
            />
            <span class="arrow" aria-hidden="true">→</span>
            <Select
              value={row.to}
              options={options(row.expert)}
              onChange={(v) => {
                rows[i].to = v;
                persist();
              }}
              ariaLabel="{e?.name} {i18n.m.upgrade.to}"
            />
            <button
              class="remove"
              type="button"
              onclick={() => removeRow(i)}
              aria-label={i18n.m.upgrade.troops.remove}>×</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if available.length > 0}
    <div class="add">
      <span class="field-label">{i18n.m.upgrade.add}</span>
      <div class="chips">
        {#each available as e (e.id)}
          <button class="chip" type="button" onclick={() => addExpert(e.id)}>+ {e.name}</button>
        {/each}
      </div>
    </div>
  {/if}

  <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>
  {#if totalRows.length === 0}
    <p class="empty">{i18n.m.upgrade.addHint}</p>
  {:else}
    <div class="totals">
      {#each totalRows as key (key)}
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
  .rows {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .ex-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .focus {
    font-size: 10px;
    color: var(--text-dim);
  }
  .row-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .arrow {
    color: var(--text-dim);
    flex-shrink: 0;
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
