<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import { sumLadder, combine, formatQty, presentResources } from '$lib/tools/upgrade/engine';
  import { RESOURCES } from '$lib/tools/upgrade/types';
  import { PETS, petLadder } from '$lib/tools/upgrade/data/pets';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-pets-v2';
  interface Row {
    pet: string;
    from: string;
    to: string;
  }
  const petById = (id: string) => PETS.find((p) => p.id === id);
  function load(): Row[] {
    const raw = readJson<Row[]>(STORAGE);
    if (!Array.isArray(raw)) return [];
    return raw.filter((r) => petById(r.pet));
  }
  const rows = $state<Row[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      rows.map((r) => ({ ...r }))
    );

  const available = $derived(PETS.filter((p) => !rows.some((r) => r.pet === p.id)));
  const levels = (max: number) => Array.from({ length: max }, (_, i) => String(i + 1));

  function addPet(id: string) {
    const p = petById(id);
    if (!p) return;
    rows.push({ pet: id, from: '1', to: String(p.max) });
    persist();
  }
  function removeRow(i: number) {
    rows.splice(i, 1);
    persist();
  }

  const result = $derived(
    combine(rows.map((r) => sumLadder(petLadder(petById(r.pet)?.max ?? 0), r.from, r.to)))
  );
  const totalRows = $derived(presentResources(result.totals));
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.pets} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.pets} sub={i18n.m.upgrade.pets.sub} backHref="/upgrade" />

  {#if rows.length > 0}
    <div class="rows">
      {#each rows as row, i (row.pet)}
        {@const max = petById(row.pet)?.max ?? 0}
        <div class="row">
          <span class="pet-name">{petById(row.pet)?.name}</span>
          <div class="row-controls">
            <RangeSelect
              labels={levels(max)}
              from={row.from}
              to={row.to}
              onChange={(f, t) => {
                rows[i].from = f;
                rows[i].to = t;
                persist();
              }}
              ariaFrom={i18n.m.upgrade.from}
              ariaTo={i18n.m.upgrade.to}
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
        {#each available as p (p.id)}
          <button class="chip" type="button" onclick={() => addPet(p.id)}>+ {p.name}</button>
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
          <span class="res-val">{formatQty(result.totals[key] ?? 0)}</span>
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
  .pet-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .row-controls {
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
