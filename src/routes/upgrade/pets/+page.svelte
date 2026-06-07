<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { sumLadder } from '$lib/tools/upgrade/engine';
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

  const petItems = $derived(
    rows.map((r) => ({
      label: `${petById(r.pet)?.name ?? r.pet} ${r.from} → ${r.to}`,
      totals: sumLadder(petLadder(petById(r.pet)?.max ?? 0), r.from, r.to).totals
    }))
  );
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

  <Totals items={petItems} emptyHint={i18n.m.upgrade.addHint} />
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
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
