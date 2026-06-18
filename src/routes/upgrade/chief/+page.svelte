<script lang="ts">
  /**
   * Chief loadout — gear + charms in one place. Gear is one slot per piece;
   * charms are 3 slots per piece. Both buff the SAME troop per piece (Hat/Watch=
   * Lancer, Coat/Pants=Infantry, Ring/Cudgel=Marksman). Shows a combined material
   * total and a combined power-gain panel (gear ATK/DEF% + charm Lethality/Health%
   * per troop, + construction power). Reuses the original storage keys so My Plan
   * keeps reading them.
   */
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import RemoveButton from '$lib/components/RemoveButton.svelte';
  import EmojiIcon from '$lib/components/EmojiIcon.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { sumLadder, formatQty } from '$lib/tools/upgrade/engine';
  import { GEAR_PIECES, GEAR_LADDER } from '$lib/tools/upgrade/data/gear';
  import { CHARM_SLOTS_PER_PIECE, CHARM_LADDER } from '$lib/tools/upgrade/data/charms';
  import {
    chiefGearGain,
    charmStatGain,
    CHIEF_PIECE_TROOP,
    type ChiefTroop
  } from '$lib/tools/upgrade/chief-gear-stats';
  import { readJson, writeJson } from '$lib/utils/storage';

  const tx = $derived(i18n.m.upgrade.chief as unknown as Record<string, string>);
  const pieceName = (id: string) => GEAR_PIECES.find((p) => p.id === id)?.name ?? id;
  const troopName = (t: ChiefTroop) => tx[t];
  const fmtPct = (n: number) => `${Math.round(n * 100) / 100}%`;

  interface Active {
    sid: string;
    from: string;
    to: string;
  }

  // ── Gear: one slot per piece (storage 'upgrade-gear-v1') ────────────────────
  const GEAR_KEY = 'upgrade-gear-v1';
  const gLabels = GEAR_LADDER.map((l) => l.label);
  const gFirst = gLabels[0];
  const gLast = gLabels[gLabels.length - 1];
  const gear = $state<Active[]>(
    (readJson<Active[]>(GEAR_KEY) ?? []).filter(
      (a) =>
        GEAR_PIECES.some((p) => p.id === a.sid) &&
        gLabels.includes(a.from) &&
        gLabels.includes(a.to)
    )
  );
  const persistGear = () =>
    writeJson(
      GEAR_KEY,
      gear.map((a) => ({ sid: a.sid, from: a.from, to: a.to }))
    );
  const gearAvailable = $derived(GEAR_PIECES.filter((p) => !gear.some((a) => a.sid === p.id)));
  function addGear(id: string) {
    gear.push({ sid: id, from: gFirst, to: gLast });
    persistGear();
  }
  function removeGear(i: number) {
    gear.splice(i, 1);
    persistGear();
  }
  function setGear(i: number, f: string, t: string) {
    gear[i] = { ...gear[i], from: f, to: t };
    persistGear();
  }

  // ── Charms: 3 slots per piece (storage 'upgrade-charms-v1', sid 'piece_n') ──
  const CHARM_KEY = 'upgrade-charms-v1';
  const cLabels = CHARM_LADDER.map((l) => l.label);
  const cFirst = cLabels[0];
  const cLast = cLabels[cLabels.length - 1];
  const SLOTS = Array.from({ length: CHARM_SLOTS_PER_PIECE }, (_, i) => i + 1);
  const csid = (id: string, n: number) => `${id}_${n}`;
  const validCharmSid = (s: string) => {
    const i = s.lastIndexOf('_');
    const n = Number(s.slice(i + 1));
    return GEAR_PIECES.some((p) => p.id === s.slice(0, i)) && n >= 1 && n <= CHARM_SLOTS_PER_PIECE;
  };
  const charms = $state<Active[]>(
    (readJson<Active[]>(CHARM_KEY) ?? []).filter(
      (a) => validCharmSid(a.sid) && cLabels.includes(a.from) && cLabels.includes(a.to)
    )
  );
  const persistCharms = () =>
    writeJson(
      CHARM_KEY,
      charms.map((a) => ({ sid: a.sid, from: a.from, to: a.to }))
    );
  const charmOf = (id: string, n: number) => charms.find((a) => a.sid === csid(id, n));
  function toggleCharm(id: string, n: number) {
    const s = csid(id, n);
    const i = charms.findIndex((a) => a.sid === s);
    if (i >= 0) charms.splice(i, 1);
    else charms.push({ sid: s, from: cFirst, to: cLast });
    persistCharms();
  }
  function setCharm(id: string, n: number, f: string, t: string) {
    const a = charmOf(id, n);
    if (a) {
      a.from = f;
      a.to = t;
      persistCharms();
    }
  }

  // ── Combined material total ─────────────────────────────────────────────────
  const items = $derived([
    ...gear.map((a) => ({
      label: `${pieceName(a.sid)} ${a.from} → ${a.to}`,
      totals: sumLadder(GEAR_LADDER, a.from, a.to).totals
    })),
    ...charms.map((a) => {
      const i = a.sid.lastIndexOf('_');
      return {
        label: `${pieceName(a.sid.slice(0, i))} ·${a.sid.slice(i + 1)} ${a.from} → ${a.to}`,
        totals: sumLadder(CHARM_LADDER, a.from, a.to).totals
      };
    })
  ]);

  // ── Combined power gain, per troop ──────────────────────────────────────────
  interface TroopPower {
    atkDef: number;
    lethality: number;
    health: number;
  }
  const powerByTroop = $derived.by(() => {
    const m = new Map<ChiefTroop, TroopPower>();
    const bump = (t: ChiefTroop, k: keyof TroopPower, v: number) => {
      if (v <= 0) return;
      const cur = m.get(t) ?? { atkDef: 0, lethality: 0, health: 0 };
      cur[k] += v;
      m.set(t, cur);
    };
    let power = 0;
    for (const a of gear) {
      const g = chiefGearGain(a.sid, a.from, a.to);
      power += g.power;
      bump(g.troop, 'atkDef', g.statPct);
    }
    for (const a of charms) {
      const id = a.sid.slice(0, a.sid.lastIndexOf('_'));
      const troop = CHIEF_PIECE_TROOP[id] ?? 'infantry';
      const gain = charmStatGain(Number(a.from) || 0, Number(a.to) || 0);
      bump(troop, 'lethality', gain);
      bump(troop, 'health', gain);
    }
    return { troops: [...m.entries()], power };
  });
  const hasPower = $derived(powerByTroop.troops.length > 0 || powerByTroop.power > 0);
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.chief} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.chief} sub={tx.sub} backHref="/upgrade" />

  <!-- Gear -->
  <h2 class="section-label"><EmojiIcon name="shield" size={14} /> {tx.gear}</h2>
  {#if gear.length > 0}
    <div class="rows">
      {#each gear as a, i (a.sid)}
        <div class="row">
          <span class="row-name">{pieceName(a.sid)}</span>
          <div class="row-ctl">
            <RangeSelect
              labels={gLabels}
              from={a.from}
              to={a.to}
              onChange={(f, t) => setGear(i, f, t)}
              ariaFrom="{pieceName(a.sid)} {i18n.m.upgrade.from}"
              ariaTo="{pieceName(a.sid)} {i18n.m.upgrade.to}"
            />
            <RemoveButton onclick={() => removeGear(i)} />
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {#if gearAvailable.length > 0}
    <div class="chips">
      {#each gearAvailable as p (p.id)}
        <button class="chip" type="button" onclick={() => addGear(p.id)}>+ {p.name}</button>
      {/each}
    </div>
  {/if}

  <!-- Charms -->
  <h2 class="section-label"><EmojiIcon name="prayer-beads" size={14} /> {tx.charms}</h2>
  <div class="rows">
    {#each GEAR_PIECES as p (p.id)}
      <div class="piece">
        <div class="piece-head">
          <span class="row-name">{p.name}</span>
          <div class="slot-btns">
            {#each SLOTS as n (n)}
              <button
                class="slot-btn"
                class:on={!!charmOf(p.id, n)}
                type="button"
                aria-pressed={!!charmOf(p.id, n)}
                aria-label="{p.name} · {n}"
                onclick={() => toggleCharm(p.id, n)}>{n}</button
              >
            {/each}
          </div>
        </div>
        {#each SLOTS as n (n)}
          {@const a = charmOf(p.id, n)}
          {#if a}
            <div class="slot-range">
              <span class="slot-lbl">{n}</span>
              <RangeSelect
                labels={cLabels}
                from={a.from}
                to={a.to}
                onChange={(f, t) => setCharm(p.id, n, f, t)}
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

  {#if hasPower}
    <section class="power">
      <h2 class="section-label"><EmojiIcon name="chart-increasing" size={14} /> {tx.powerGain}</h2>
      {#each powerByTroop.troops as [troop, p] (troop)}
        <div class="troop-row">
          <span class="troop-name">{troopName(troop)}</span>
          <span class="stats">
            {#if p.atkDef > 0}<span class="g">+{fmtPct(p.atkDef)} {tx.atkDef}</span>{/if}
            {#if p.lethality > 0}<span class="g">+{fmtPct(p.lethality)} {tx.lethality}</span>{/if}
            {#if p.health > 0}<span class="g">+{fmtPct(p.health)} {tx.health}</span>{/if}
          </span>
        </div>
      {/each}
      {#if powerByTroop.power > 0}
        <div class="troop-row">
          <span class="troop-name"><EmojiIcon name="high-voltage" size={13} /> {tx.power}</span>
          <span class="stats"><span class="g">+{formatQty(powerByTroop.power)}</span></span>
        </div>
      {/if}
      <p class="note">{tx.powerNote}</p>
    </section>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
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
    margin: 24px 0 12px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .rows {
    display: grid;
    gap: 8px;
    margin-bottom: 12px;
  }
  .row,
  .piece {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 12px 14px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
  }
  .row-ctl {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .piece-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .piece-head .row-name {
    flex: 1;
    color: var(--text);
    font-size: 13px;
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
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
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
  }
  .chip:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .power {
    margin-top: 8px;
    display: grid;
    gap: 8px;
  }
  .troop-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .troop-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mid);
    flex-shrink: 0;
    min-width: 84px;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .stats .g {
    color: #4ade80;
    font-weight: 700;
  }
  .note {
    margin: 4px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
