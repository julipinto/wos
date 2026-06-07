<script lang="ts">
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import StepList from '$lib/tools/upgrade/StepList.svelte';
  import Totals from '$lib/tools/upgrade/Totals.svelte';
  import { buildingsCalc } from '$lib/tools/upgrade/store.svelte';
  import {
    sumRange,
    combine,
    formatDuration,
    applySpeed,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { boosters } from '$lib/tools/upgrade/boosters-store.svelte';
  import { type LevelCost } from '$lib/tools/upgrade/types';

  // Additive: one combined result across every building row.
  const rows = $derived(buildingsCalc.rows);
  const result = $derived(
    combine(rows.map((r) => sumRange(buildingsCalc.tableOf(r.buildingId), r.from, r.to)))
  );
  const resRows = $derived(presentResources(result.totals));
  const buildingItems = $derived(
    rows.map((r) => {
      const t = buildingsCalc.tableOf(r.buildingId);
      return { label: `${t.name} ${r.from} → ${r.to}`, totals: sumRange(t, r.from, r.to).totals };
    })
  );

  // Speed % first, then subtract any flat reduction (Agnes), clamped at 0 —
  // time can never go negative.
  const effTime = $derived(
    Math.max(
      0,
      applySpeed(result.time, boosters.total('construction')) - boosters.flatTotal('construction')
    )
  );

  // Combined per-building step breakdown — each level prefixed with its building.
  const steps = $derived.by(() => {
    const out: LevelCost[] = [];
    for (const r of rows) {
      const t = buildingsCalc.tableOf(r.buildingId);
      const lv = t.levels;
      const fromI = lv.findIndex((l) => l.label === r.from);
      const toI = lv.findIndex((l) => l.label === r.to);
      if (fromI < 0 || toI < 0) continue;
      for (const level of lv.slice(fromI + 1, toI + 1))
        out.push({ label: `${t.name} · ${level.label}`, cost: level.cost, time: level.time });
    }
    return out;
  });

  // Any FC level still without a sourced time would under-report — flag it.
  const timeUnsourced = $derived(steps.some((s) => s.time === 0 && Object.keys(s.cost).length > 0));
  const anyUnverified = $derived(
    rows.some((r) => !buildingsCalc.tableOf(r.buildingId).meta.verified)
  );

  // Zinman's skill (set in the boosters panel) also cuts base-resource cost for
  // construction by the same %, applied to meat/wood/coal/iron only.
  const ZIMAN_BASE = ['meat', 'wood', 'coal', 'iron'];
  const zimanPct = $derived(boosters.contribution('zinman'));
  const effRes = (key: string, amt: number) =>
    zimanPct > 0 && ZIMAN_BASE.includes(key) ? Math.round(amt * (1 - zimanPct / 100)) : amt;
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.buildings} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.buildings}
    sub={i18n.m.upgrade.buildings.sub}
    backHref="/upgrade"
  />

  {#if anyUnverified}
    <div class="warn" role="note">
      <strong>⚠ {i18n.m.upgrade.unverified}</strong>
      <span>{i18n.m.upgrade.unverifiedNote}</span>
    </div>
  {/if}

  {#if rows.length > 0}
    <div class="building-rows">
      {#each rows as row, i (row.buildingId)}
        {@const table = buildingsCalc.tableOf(row.buildingId)}
        <div class="building-row">
          <span class="b-name">{table.name}</span>
          <div class="row-controls">
            <RangeSelect
              labels={table.levels.map((l) => l.label)}
              from={row.from}
              to={row.to}
              onChange={(f, t) => {
                buildingsCalc.setFrom(i, f);
                buildingsCalc.setTo(i, t);
              }}
              ariaFrom="{table.name} {i18n.m.upgrade.from}"
              ariaTo="{table.name} {i18n.m.upgrade.to}"
            />
            <button
              class="remove"
              type="button"
              onclick={() => buildingsCalc.remove(i)}
              aria-label={i18n.m.upgrade.troops.remove}>×</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if buildingsCalc.available.length > 0}
    <div class="add">
      <span class="field-label">{i18n.m.upgrade.add}</span>
      <div class="chips">
        {#each buildingsCalc.available as b (b.id)}
          <button class="chip" type="button" onclick={() => buildingsCalc.add(b.id)}
            >+ {b.name}</button
          >
        {/each}
      </div>
    </div>
  {/if}

  <Boosters categories={['construction']} />

  <Totals items={buildingItems} adjust={effRes} emptyHint={i18n.m.upgrade.addHint} />

  {#if resRows.length > 0}
    {#if zimanPct > 0}
      <p class="ziman-note">{fmt(i18n.m.upgrade.zimanCut, { pct: zimanPct })}</p>
    {/if}

    <div class="meta-row">
      <div class="meta">
        <span class="meta-label">{i18n.m.upgrade.buildTime}</span>
        <span class="meta-val">{result.time > 0 ? formatDuration(effTime) : '—'}</span>
        {#if result.time > 0 && boosters.total('construction') > 0}
          <span class="meta-base"
            >{i18n.m.upgrade.boosters.base}: {formatDuration(result.time)}</span
          >
        {/if}
        {#if timeUnsourced}
          <span class="meta-base">{i18n.m.upgrade.timePartial}</span>
        {/if}
      </div>
      <div class="meta">
        <span class="meta-label">{i18n.m.upgrade.levelUps}</span>
        <span class="meta-val">{result.steps}</span>
      </div>
    </div>

    <StepList {steps} />
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
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
    letter-spacing: 0.5px;
  }

  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .building-rows {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .building-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .b-name {
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

  .ziman-note {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--accent);
    margin: 12px 0 0;
  }

  .meta-row {
    display: flex;
    gap: 12px;
    margin-top: 18px;
  }
  .meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
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
