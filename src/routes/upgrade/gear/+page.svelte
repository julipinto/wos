<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SlotLadder from '$lib/tools/upgrade/SlotLadder.svelte';
  import { GEAR_PIECES, GEAR_LADDER } from '$lib/tools/upgrade/data/gear';
  import { chiefGearGain, type ChiefTroop } from '$lib/tools/upgrade/chief-gear-stats';
  import { formatQty } from '$lib/tools/upgrade/engine';

  const slots = GEAR_PIECES.map((p) => ({ id: p.id, name: p.name }));
  const tx = $derived(i18n.m.upgrade.gear as unknown as Record<string, string>);
  const troopName = (t: ChiefTroop) => tx[t];
  const fmtPct = (n: number) => `${Math.round(n * 100) / 100}%`;

  type Row = { sid: string; from: string; to: string };
  // Chief gear is troop-specific (each piece's ATK%/DEF% buffs its own troop), so
  // aggregate the % per troop, plus total construction power.
  const summarize = (rows: Row[]) => {
    const byTroop = new Map<ChiefTroop, number>();
    let power = 0;
    for (const r of rows) {
      const g = chiefGearGain(r.sid, r.from, r.to);
      power += g.power;
      if (g.statPct > 0) byTroop.set(g.troop, (byTroop.get(g.troop) ?? 0) + g.statPct);
    }
    return { byTroop: [...byTroop.entries()], power };
  };
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.gear} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.gear} sub={i18n.m.upgrade.gear.sub} backHref="/upgrade" />
  <SlotLadder ladder={GEAR_LADDER} {slots} storageKey="upgrade-gear-v1">
    {#snippet footer(rows)}
      {@const s = summarize(rows)}
      {#if s.byTroop.length > 0 || s.power > 0}
        <section class="power">
          <h2 class="section-label">📈 {tx.powerGain}</h2>
          {#each s.byTroop as [troop, pct] (troop)}
            <div class="res">
              <span class="res-name">{tx.atkDef} ({troopName(troop)})</span>
              <span class="res-val">+{fmtPct(pct)}</span>
            </div>
          {/each}
          {#if s.power > 0}
            <div class="res">
              <span class="res-name">⚡ {tx.power}</span>
              <span class="res-val">+{formatQty(s.power)}</span>
            </div>
          {/if}
          <p class="note">{tx.powerNote}</p>
        </section>
      {/if}
    {/snippet}
  </SlotLadder>
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .power {
    margin-top: 8px;
    display: grid;
    gap: 10px;
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
    margin: 8px 0 4px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .res {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
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
    font-size: 18px;
    color: #4ade80;
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
