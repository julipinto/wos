<script lang="ts">
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import Boosters from '$lib/tools/upgrade/Boosters.svelte';
  import { buildingsCalc } from '$lib/tools/upgrade/store.svelte';
  import {
    sumRange,
    formatQty,
    formatDuration,
    applySpeed,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { boosters } from '$lib/tools/upgrade/boosters-store.svelte';
  import { RESOURCES } from '$lib/tools/upgrade/types';

  const resDef = (key: string) => RESOURCES.find((r) => r.key === key)!;

  // Reactive selection → result.
  const building = $derived(buildingsCalc.current);
  const result = $derived(sumRange(building, buildingsCalc.from, buildingsCalc.to));
  const rows = $derived(presentResources(result.totals));
  const effTime = $derived(applySpeed(result.time, boosters.total('construction')));

  // Zinman's skill (set in the boosters panel) also cuts base-resource cost for
  // construction by the same %, applied to meat/wood/coal/iron only.
  const ZIMAN_BASE = ['meat', 'wood', 'coal', 'iron'];
  const zimanPct = $derived(boosters.contribution('zinman'));
  const effRes = (key: string, amt: number) =>
    zimanPct > 0 && ZIMAN_BASE.includes(key) ? Math.round(amt * (1 - zimanPct / 100)) : amt;

  // Dropdown options for the building picker.
  const buildingOptions = $derived(buildingsCalc.list.map((b) => ({ value: b.id, label: b.name })));
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

  {#if !building.meta.verified}
    <div class="warn" role="note">
      <strong>⚠ {i18n.m.upgrade.unverified}</strong>
      <span>{i18n.m.upgrade.unverifiedNote}</span>
    </div>
  {/if}

  <div class="controls">
    <div class="field">
      <span class="field-label">{i18n.m.upgrade.buildings.pick}</span>
      <Select
        value={buildingsCalc.buildingId}
        options={buildingOptions}
        onChange={(v) => buildingsCalc.setBuilding(v)}
        ariaLabel={i18n.m.upgrade.buildings.pick}
      />
    </div>

    <div class="range">
      <span class="field-label">{i18n.m.upgrade.from} → {i18n.m.upgrade.to}</span>
      <RangeSelect
        labels={building.levels.map((l) => l.label)}
        from={buildingsCalc.from}
        to={buildingsCalc.to}
        onChange={(f, t) => {
          buildingsCalc.setFrom(f);
          buildingsCalc.setTo(t);
        }}
        ariaFrom={i18n.m.upgrade.from}
        ariaTo={i18n.m.upgrade.to}
      />
    </div>
  </div>

  <Boosters categories={['construction']} />

  <h2 class="section-label">{i18n.m.upgrade.totalEyebrow}</h2>

  {#if rows.length === 0}
    <p class="empty">{i18n.m.upgrade.pickRange}</p>
  {:else}
    <div class="totals">
      {#each rows as key (key)}
        {@const def = resDef(key)}
        <div class="res">
          <span class="res-icon" style="--c: {def.color}" aria-hidden="true">{def.icon}</span>
          <span class="res-name">{i18n.m.upgrade.res[key]}</span>
          <span class="res-val">{formatQty(effRes(key, result.totals[key] ?? 0))}</span>
        </div>
      {/each}
    </div>
    {#if zimanPct > 0}
      <p class="ziman-note">{fmt(i18n.m.upgrade.zimanCut, { pct: zimanPct })}</p>
    {/if}

    <div class="meta-row">
      <div class="meta">
        <span class="meta-label">{i18n.m.upgrade.buildTime}</span>
        <span class="meta-val">{formatDuration(effTime)}</span>
        {#if boosters.total('construction') > 0}
          <span class="meta-base"
            >{i18n.m.upgrade.boosters.base}: {formatDuration(result.time)}</span
          >
        {/if}
      </div>
      <div class="meta">
        <span class="meta-label">{i18n.m.upgrade.levelUps}</span>
        <span class="meta-val">{result.steps}</span>
      </div>
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

  .controls {
    display: grid;
    gap: 14px;
    margin-bottom: 28px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .range {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
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
  .ziman-note {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--accent);
    margin: 12px 0 0;
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
