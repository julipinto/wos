<script lang="ts">
  /**
   * Additive multi-slot ladder calculator. Starts empty; you add only the slots
   * you care about (e.g. just the Winter Hat) from the "add" chips, each climbing
   * the same upgrade ladder from a current to a target tier. Shows the combined
   * material total. Used by the gear and charm calculators. Persists per `storageKey`.
   */
  import RangeSelect from './RangeSelect.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { sumLadder, combine, formatQty, presentResources } from './engine';
  import { RESOURCES, type LevelCost } from './types';
  import { readJson, writeJson } from '$lib/utils/storage';

  interface Slot {
    id: string;
    name: string;
  }
  interface Props {
    ladder: LevelCost[];
    slots: Slot[];
    storageKey: string;
  }
  let { ladder, slots, storageKey }: Props = $props();

  const labels = $derived(ladder.map((l) => l.label));
  const firstLabel = () => ladder[0]?.label ?? '';
  const lastLabel = () => ladder[ladder.length - 1]?.label ?? '';
  const slotName = (sid: string) => slots.find((s) => s.id === sid)?.name ?? sid;

  interface Active {
    sid: string;
    from: string;
    to: string;
  }
  function load(): Active[] {
    const raw = readJson<Active[]>(storageKey);
    if (!Array.isArray(raw)) return [];
    // Keep only entries for slots that still exist with valid labels.
    return raw.filter(
      (a) =>
        slots.some((s) => s.id === a.sid) &&
        ladder.some((l) => l.label === a.from) &&
        ladder.some((l) => l.label === a.to)
    );
  }
  const active = $state<Active[]>(load());
  const persist = () =>
    writeJson(
      storageKey,
      active.map((a) => ({ sid: a.sid, from: a.from, to: a.to }))
    );

  const available = $derived(slots.filter((s) => !active.some((a) => a.sid === s.id)));

  function addSlot(sid: string) {
    active.push({ sid, from: firstLabel(), to: lastLabel() });
    persist();
  }
  function removeSlot(i: number) {
    active.splice(i, 1);
    persist();
  }

  let allFrom = $state(firstLabel());
  let allTo = $state(lastLabel());
  function applyAll() {
    for (const a of active) {
      a.from = allFrom;
      a.to = allTo;
    }
    persist();
  }

  const result = $derived(combine(active.map((a) => sumLadder(ladder, a.from, a.to))));
  const rows = $derived(presentResources(result.totals));
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
</script>

{#if active.length > 0}
  <div class="slots">
    {#each active as a, i (a.sid)}
      <div class="slot">
        <span class="slot-name">{slotName(a.sid)}</span>
        <div class="slot-controls">
          <RangeSelect
            {labels}
            from={a.from}
            to={a.to}
            onChange={(f, t) => {
              a.from = f;
              a.to = t;
              persist();
            }}
            ariaFrom="{slotName(a.sid)} {i18n.m.upgrade.from}"
            ariaTo="{slotName(a.sid)} {i18n.m.upgrade.to}"
          />
          <button
            class="remove"
            type="button"
            onclick={() => removeSlot(i)}
            aria-label={i18n.m.upgrade.troops.remove}>×</button
          >
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if active.length >= 2}
  <div class="setall">
    <span class="field-label">{i18n.m.upgrade.setAll}</span>
    <div class="setall-row">
      <RangeSelect
        {labels}
        from={allFrom}
        to={allTo}
        onChange={(f, t) => {
          allFrom = f;
          allTo = t;
        }}
        ariaFrom={i18n.m.upgrade.from}
        ariaTo={i18n.m.upgrade.to}
      />
      <button class="apply" type="button" onclick={applyAll}>{i18n.m.upgrade.apply}</button>
    </div>
  </div>
{/if}

{#if available.length > 0}
  <div class="add">
    <span class="field-label">{i18n.m.upgrade.add}</span>
    <div class="chips">
      {#each available as s (s.id)}
        <button class="chip" type="button" onclick={() => addSlot(s.id)}>+ {s.name}</button>
      {/each}
    </div>
  </div>
{/if}

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
{/if}

<style>
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .slots {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .slot {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .slot-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .slot-controls {
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

  .setall {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin-bottom: 16px;
  }
  .setall-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .apply {
    flex-shrink: 0;
    background: var(--accent-glow);
    border: 1px solid var(--border-accent);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 10px 14px;
    border-radius: var(--r-pill);
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .apply:hover {
    background: var(--accent-glow-strong);
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
</style>
