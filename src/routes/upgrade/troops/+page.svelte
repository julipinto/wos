<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { addBags, scaleBag, formatDuration, applySpeed } from '$lib/tools/upgrade/engine';
  import { boosters } from '$lib/tools/upgrade/boosters-store.svelte';
  import { type ResourceBag } from '$lib/tools/upgrade/types';
  import { TROOP_TYPES, TROOP_COST, MAX_TIER } from '$lib/tools/upgrade/data/troops';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-troops-v1';
  interface Row {
    type: string;
    tier: number;
    qty: number;
  }
  function load(): Row[] {
    const raw = readJson<Row[]>(STORAGE);
    return raw && Array.isArray(raw) ? raw : [];
  }
  const rows = $state<Row[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      rows.map((r) => ({ ...r }))
    );

  const typeOptions = TROOP_TYPES.map((t) => ({
    value: t.id,
    label: (i18n.m.upgrade.troops as Record<string, string>)[t.i18n]
  }));
  const tierOptions = Array.from({ length: MAX_TIER }, (_, i) => ({
    value: String(i + 1),
    label: `T${i + 1}`
  }));

  function addRow() {
    rows.push({ type: 'infantry', tier: 11, qty: 1000 });
    persist();
  }
  function removeRow(i: number) {
    rows.splice(i, 1);
    persist();
  }

  const result = $derived.by(() => {
    let totals: ResourceBag = {};
    let time = 0;
    for (const r of rows) {
      const entry = TROOP_COST[r.type]?.[r.tier - 1];
      const qty = Math.max(0, Math.floor(r.qty) || 0);
      if (!entry || qty <= 0) continue;
      totals = addBags(totals, scaleBag(entry.cost, qty));
      time += entry.time * qty;
    }
    return { totals, time };
  });
  const effTime = $derived(applySpeed(result.time, boosters.total('training')));

  const troopItems = $derived(
    rows.map((r) => {
      const entry = TROOP_COST[r.type]?.[r.tier - 1];
      const qty = Math.max(0, Math.floor(r.qty) || 0);
      const typeLabel =
        (i18n.m.upgrade.troops as Record<string, string>)[
          TROOP_TYPES.find((t) => t.id === r.type)?.i18n ?? ''
        ] ?? r.type;
      return {
        label: `${typeLabel} T${r.tier} ×${qty}`,
        totals: entry && qty > 0 ? scaleBag(entry.cost, qty) : {}
      };
    })
  );
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.troops} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.troops}
    sub={i18n.m.upgrade.troops.sub}
    backHref="/upgrade"
  />

  <div class="rows">
    {#each rows as row, i (i)}
      <div class="row">
        <div class="row-field type">
          <span class="field-label">{i18n.m.upgrade.troops.type}</span>
          <Select
            value={row.type}
            options={typeOptions}
            onChange={(v) => {
              row.type = v;
              persist();
            }}
            ariaLabel={i18n.m.upgrade.troops.type}
          />
        </div>
        <div class="row-field tier">
          <span class="field-label">{i18n.m.upgrade.troops.tier}</span>
          <Select
            value={String(row.tier)}
            options={tierOptions}
            onChange={(v) => {
              row.tier = Number(v);
              persist();
            }}
            ariaLabel={i18n.m.upgrade.troops.tier}
          />
        </div>
        <div class="row-field qty">
          <span class="field-label">{i18n.m.upgrade.troops.quantity}</span>
          <NumberInput
            value={row.qty}
            onChange={(n) => {
              row.qty = n;
              persist();
            }}
            ariaLabel={i18n.m.upgrade.troops.quantity}
          />
        </div>
        <button
          class="remove"
          type="button"
          onclick={() => removeRow(i)}
          aria-label={i18n.m.upgrade.troops.remove}>×</button
        >
      </div>
    {/each}
  </div>

  <button class="add" type="button" onclick={addRow}>+ {i18n.m.upgrade.troops.add}</button>

  <Boosters categories={['training']} />

  <Totals items={troopItems} emptyHint={i18n.m.upgrade.addHint} />
  {#if result.time > 0}
    <div class="meta">
      <span class="field-label">{i18n.m.upgrade.trainTime}</span>
      <span class="meta-val">{formatDuration(effTime)}</span>
      {#if boosters.total('training') > 0}
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
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .rows {
    display: grid;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .row-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row-field.type {
    flex: 1.4;
  }
  .row-field.tier {
    width: 90px;
  }
  .row-field.qty {
    flex: 1;
  }
  .remove {
    flex-shrink: 0;
    width: 38px;
    height: 44px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
  }
  .remove:hover:not(:disabled) {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .remove:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .add {
    margin-top: 12px;
    width: 100%;
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-card);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 12px;
    cursor: pointer;
  }
  .add:hover {
    color: var(--text);
    border-color: var(--border-accent);
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
