<script lang="ts">
  /**
   * Charms: one row per gear piece (6) with its charm-slot buttons (1..3).
   * Toggle a slot on and set its own from→to — each slot levels independently.
   * Storage stays the shared {sid:'piece_n', from, to}[] under upgrade-charms-v1
   * so My Plan keeps working.
   */
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { sumLadder } from '$lib/tools/upgrade/engine';
  import {
    CHARM_PIECES,
    CHARM_SLOTS_PER_PIECE,
    CHARM_LADDER
  } from '$lib/tools/upgrade/data/charms';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-charms-v1';
  const labels = CHARM_LADDER.map((l) => l.label);
  const first = labels[0];
  const last = labels[labels.length - 1];
  const SLOTS = Array.from({ length: CHARM_SLOTS_PER_PIECE }, (_, i) => i + 1);

  const sid = (pieceId: string, n: number) => `${pieceId}_${n}`;
  const validSid = (s: string) => {
    const i = s.lastIndexOf('_');
    const n = Number(s.slice(i + 1));
    return CHARM_PIECES.some((p) => p.id === s.slice(0, i)) && n >= 1 && n <= CHARM_SLOTS_PER_PIECE;
  };

  interface Active {
    sid: string;
    from: string;
    to: string;
  }
  function load(): Active[] {
    const raw = readJson<Active[]>(STORAGE);
    if (!Array.isArray(raw)) return [];
    return raw.filter((a) => validSid(a.sid) && labels.includes(a.from) && labels.includes(a.to));
  }
  const active = $state<Active[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      active.map((a) => ({ sid: a.sid, from: a.from, to: a.to }))
    );

  const slotOf = (pieceId: string, n: number) => active.find((a) => a.sid === sid(pieceId, n));
  function toggle(pieceId: string, n: number) {
    const s = sid(pieceId, n);
    const i = active.findIndex((a) => a.sid === s);
    if (i >= 0) active.splice(i, 1);
    else active.push({ sid: s, from: first, to: last });
    persist();
  }
  function setRange(pieceId: string, n: number, f: string, t: string) {
    const a = slotOf(pieceId, n);
    if (a) {
      a.from = f;
      a.to = t;
      persist();
    }
  }

  const pieceName = (id: string) => CHARM_PIECES.find((p) => p.id === id)?.name ?? id;
  const items = $derived(
    active.map((a) => {
      const i = a.sid.lastIndexOf('_');
      return {
        label: `${pieceName(a.sid.slice(0, i))} · ${a.sid.slice(i + 1)} ${a.from} → ${a.to}`,
        totals: sumLadder(CHARM_LADDER, a.from, a.to).totals
      };
    })
  );
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.charms} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.charms}
    sub={i18n.m.upgrade.charms.sub}
    backHref="/upgrade"
  />

  <div class="pieces">
    {#each CHARM_PIECES as p (p.id)}
      <div class="piece">
        <div class="piece-head">
          <span class="p-name">{p.name}</span>
          <div class="slot-btns">
            {#each SLOTS as n (n)}
              <button
                class="slot-btn"
                class:on={!!slotOf(p.id, n)}
                type="button"
                aria-pressed={!!slotOf(p.id, n)}
                aria-label="{p.name} · {n}"
                onclick={() => toggle(p.id, n)}>{n}</button
              >
            {/each}
          </div>
        </div>
        {#each SLOTS as n (n)}
          {@const a = slotOf(p.id, n)}
          {#if a}
            <div class="slot-range">
              <span class="slot-lbl">{n}</span>
              <RangeSelect
                {labels}
                from={a.from}
                to={a.to}
                onChange={(f, t) => setRange(p.id, n, f, t)}
                ariaFrom="{p.name} · {n} {i18n.m.upgrade.from}"
                ariaTo="{p.name} · {n} {i18n.m.upgrade.to}"
              />
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>

  <Totals {items} emptyHint={i18n.m.upgrade.addHint} />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .pieces {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .piece {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 12px 14px;
  }
  .piece-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .p-name {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text);
  }
  .slot-btns {
    display: inline-flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .slot-btn {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 13px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .slot-btn:hover {
    color: var(--text-mid);
    border-color: var(--border-accent);
  }
  .slot-btn.on {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--accent);
  }
  .slot-range {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }
  .slot-lbl {
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
