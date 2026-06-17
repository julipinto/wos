<script lang="ts">
  /**
   * Additive multi-slot ladder calculator. Starts empty; you add only the slots
   * you care about (e.g. just the Winter Hat) from the "add" chips, each climbing
   * the same upgrade ladder from a current to a target tier. Shows the combined
   * material total. Used by the gear and charm calculators. Persists per `storageKey`.
   */
  import RangeSelect from './RangeSelect.svelte';
  import Totals from './Totals.svelte';
  import RemoveButton from '$lib/components/RemoveButton.svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import { sumLadder } from './engine';
  import { type LevelCost } from './types';
  import { readJson, writeJson } from '$lib/utils/storage';

  import type { Snippet } from 'svelte';
  interface Slot {
    id: string;
    name: string;
  }
  interface Active {
    sid: string;
    from: string;
    to: string;
  }
  interface Props {
    ladder: LevelCost[];
    slots: Slot[];
    storageKey: string;
    /** Optional extra section rendered after the totals, given the active slots
     * (e.g. the gear calculator's power-gain panel). Charms leave it unset. */
    footer?: Snippet<[Active[]]>;
  }
  let { ladder, slots, storageKey, footer }: Props = $props();

  const labels = $derived(ladder.map((l) => l.label));
  const firstLabel = () => ladder[0]?.label ?? '';
  const lastLabel = () => ladder[ladder.length - 1]?.label ?? '';
  const slotName = (sid: string) => slots.find((s) => s.id === sid)?.name ?? sid;

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

  const items = $derived(
    active.map((a) => ({
      label: `${slotName(a.sid)} ${a.from} → ${a.to}`,
      totals: sumLadder(ladder, a.from, a.to).totals
    }))
  );
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
          <RemoveButton onclick={() => removeSlot(i)} />
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

<Totals {items} emptyHint={i18n.m.upgrade.addHint} />

{#if footer && active.length > 0}{@render footer(active)}{/if}

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
</style>
