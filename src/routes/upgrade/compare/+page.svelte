<script lang="ts">
  /**
   * Comparator — put several building ranges side by side to decide a path
   * ("FC6→FC7 vs FC7→FC8, how do I get to FC8?") or an either/or ("upgrade X or
   * Y?"). Each scenario is independent, so the same building can appear twice
   * with different ranges. Reuses the engine (sumRange) + the refinement model
   * (estimate) at the shared intensity. The Σ column sums them (useful when the
   * scenarios chain into one path); the lowest cell per row is highlighted.
   */
  import { page } from '$app/stores';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import { BUILDINGS, buildingById } from '$lib/tools/upgrade/data/buildings';
  import {
    sumRange,
    combine,
    formatQty,
    formatDuration,
    presentResources
  } from '$lib/tools/upgrade/engine';
  import { RESOURCES, type ResourceBag } from '$lib/tools/upgrade/types';
  import { estimate, planById, PRESETS } from '$lib/tools/upgrade/refinement';
  import { refinementStore } from '$lib/tools/upgrade/refinement-store.svelte';
  import { readJson, writeJson } from '$lib/utils/storage';

  const STORAGE = 'upgrade-compare-v1';
  interface Scenario {
    buildingId: string;
    from: string;
    to: string;
  }
  const tableOf = (id: string) => buildingById(id) ?? BUILDINGS[0];
  const labelsOf = (id: string) => tableOf(id).levels.map((l) => l.label);

  function clean(s: Scenario): Scenario {
    const t = tableOf(s.buildingId);
    const labels = t.levels.map((l) => l.label);
    return {
      buildingId: t.id,
      from: labels.includes(s.from) ? s.from : labels[0],
      to: labels.includes(s.to) ? s.to : labels[labels.length - 1]
    };
  }
  function load(): Scenario[] {
    const raw = readJson<Scenario[]>(STORAGE);
    if (Array.isArray(raw) && raw.length) return raw.map(clean);
    const f = BUILDINGS[0];
    const labels = f.levels.map((l) => l.label);
    const full = { buildingId: f.id, from: labels[0], to: labels[labels.length - 1] };
    return [{ ...full }, { ...full }];
  }
  const scenarios = $state<Scenario[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      scenarios.map((s) => ({ ...s }))
    );

  // Seed from "?s=building:from:to,…" when arriving via the Buildings "Compare"
  // button. Runs on client navigation AND a full reload; a single scenario is
  // duplicated so there are two columns to compare, then the URL is cleaned.
  let seeded = false;
  $effect(() => {
    const s = $page.url.searchParams.get('s');
    if (seeded || !s) return;
    seeded = true;
    const parsed = s
      .split(',')
      .map((part) => {
        const [b, from, to] = part.split(':');
        return b ? clean({ buildingId: b, from, to }) : null;
      })
      .filter((x): x is Scenario => x !== null);
    if (parsed.length) {
      scenarios.splice(
        0,
        scenarios.length,
        ...(parsed.length === 1 ? [parsed[0], { ...parsed[0] }] : parsed)
      );
      persist();
    }
    if (typeof history !== 'undefined') history.replaceState(null, '', $page.url.pathname);
  });

  const buildingOptions = BUILDINGS.map((b) => ({ value: b.id, label: b.name }));

  function setBuilding(i: number, id: string) {
    const labels = labelsOf(id);
    scenarios[i] = { buildingId: id, from: labels[0], to: labels[labels.length - 1] };
    persist();
  }
  function setRange(i: number, from: string, to: string) {
    scenarios[i] = { ...scenarios[i], from, to };
    persist();
  }
  function addScenario() {
    const last = scenarios[scenarios.length - 1] ?? load()[0];
    scenarios.push({ ...last });
    persist();
  }
  function removeScenario(i: number) {
    scenarios.splice(i, 1);
    persist();
  }

  const plan = $derived(
    planById(PRESETS.find((p) => p.key === refinementStore.intensity)?.plan ?? 'L3')
  );

  interface Col {
    label: string;
    totals: ResourceBag;
    time: number;
    rfc: number;
    fc: number;
    days: number;
  }
  const cols = $derived<Col[]>(
    scenarios.map((s) => {
      const t = tableOf(s.buildingId);
      const r = sumRange(t, s.from, s.to);
      const rfc = r.totals.refinedFireCrystal ?? 0;
      const e = estimate(rfc, plan);
      return {
        label: `${t.name} ${s.from}→${s.to}`,
        totals: r.totals,
        time: r.time,
        rfc,
        fc: e.fcTotal,
        days: e.days
      };
    })
  );
  const sumResult = $derived(
    combine(scenarios.map((s) => sumRange(tableOf(s.buildingId), s.from, s.to)))
  );
  const sumRfc = $derived(sumResult.totals.refinedFireCrystal ?? 0);
  const sumEst = $derived(estimate(sumRfc, plan));

  // Raw resources present across all scenarios, RFC handled as its own row.
  const resKeys = $derived(
    presentResources(sumResult.totals).filter((k) => k !== 'refinedFireCrystal')
  );
  const resDef = (k: string) => RESOURCES.find((r) => r.key === k)!;
  const resName = (k: string) => (i18n.m.upgrade.res as Record<string, string>)[k];
  const tx = $derived(i18n.m.upgrade.refinement as unknown as Record<string, string>);

  // Lowest value in a row wins (cheaper/faster). No highlight if all equal.
  const lows = (vals: number[]) => {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return vals.map((v) => v === min && min < max);
  };
  const rfcLow = $derived(lows(cols.map((c) => c.rfc)));
  const fcLow = $derived(lows(cols.map((c) => c.fc)));
  const daysLow = $derived(lows(cols.map((c) => c.days)));
  const timeLow = $derived(lows(cols.map((c) => c.time)));
  const resLow = (k: string) => lows(cols.map((c) => c.totals[k as keyof ResourceBag] ?? 0));
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.compare} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.compare}
    sub={i18n.m.upgrade.compare.sub}
    backHref="/upgrade"
  />

  <div class="scenarios">
    {#each scenarios as s, i (i)}
      {@const t = tableOf(s.buildingId)}
      <div class="scn">
        <Select
          value={s.buildingId}
          options={buildingOptions}
          onChange={(v) => setBuilding(i, v)}
          ariaLabel={i18n.m.upgrade.compare.building}
        />
        <div class="scn-range">
          <RangeSelect
            labels={t.levels.map((l) => l.label)}
            from={s.from}
            to={s.to}
            onChange={(f, to) => setRange(i, f, to)}
            ariaFrom="{t.name} {i18n.m.upgrade.from}"
            ariaTo="{t.name} {i18n.m.upgrade.to}"
          />
          {#if scenarios.length > 1}
            <button
              class="remove"
              type="button"
              onclick={() => removeScenario(i)}
              aria-label={i18n.m.upgrade.troops.remove}>×</button
            >
          {/if}
        </div>
      </div>
    {/each}
    <button class="add" type="button" onclick={addScenario}>+ {i18n.m.upgrade.compare.add}</button>
  </div>

  <div class="intensity">
    <span class="field-label">{i18n.m.upgrade.refinement.intensity}</span>
    <Segmented
      value={refinementStore.intensity}
      ariaLabel={i18n.m.upgrade.refinement.intensity}
      options={PRESETS.map((p) => ({ value: p.key, label: tx[p.key] }))}
      onChange={(v) => (refinementStore.intensity = v)}
    />
  </div>

  <div class="table-scroll">
    <table class="cmp">
      <thead>
        <tr>
          <th></th>
          {#each cols as c (c.label)}<th>{c.label}</th>{/each}
          {#if cols.length > 1}<th class="sum">{i18n.m.upgrade.compare.total}</th>{/if}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>✨ RFC</th>
          {#each cols as c, i (c.label)}<td class:win={rfcLow[i]}>{formatQty(c.rfc)}</td>{/each}
          {#if cols.length > 1}<td class="sum">{formatQty(sumRfc)}</td>{/if}
        </tr>
        <tr>
          <th>🔥 {i18n.m.upgrade.compare.refineFc}</th>
          {#each cols as c, i (c.label)}<td class:win={fcLow[i]}>~{formatQty(c.fc)}</td>{/each}
          {#if cols.length > 1}<td class="sum">~{formatQty(sumEst.fcTotal)}</td>{/if}
        </tr>
        <tr>
          <th>⏱ {i18n.m.upgrade.compare.refineDays}</th>
          {#each cols as c, i (c.label)}<td class:win={daysLow[i]}>~{c.days}</td>{/each}
          {#if cols.length > 1}<td class="sum">~{sumEst.days}</td>{/if}
        </tr>
        <tr class="div">
          <th>🔨 {i18n.m.upgrade.buildTime}</th>
          {#each cols as c, i (c.label)}<td class:win={timeLow[i]}>{formatDuration(c.time)}</td
            >{/each}
          {#if cols.length > 1}<td class="sum">{formatDuration(sumResult.time)}</td>{/if}
        </tr>
        {#each resKeys as k (k)}
          {@const low = resLow(k)}
          <tr>
            <th
              ><span class="ic" style="--c: {resDef(k).color}">{resDef(k).icon}</span>
              {resName(k)}</th
            >
            {#each cols as c, i (c.label)}
              <td class:win={low[i]}>{formatQty(c.totals[k as keyof ResourceBag] ?? 0)}</td>
            {/each}
            {#if cols.length > 1}<td class="sum"
                >{formatQty(sumResult.totals[k as keyof ResourceBag] ?? 0)}</td
              >{/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="note">{i18n.m.upgrade.compare.note}</p>
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .scenarios {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
  }
  .scn {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .scn-range {
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
  }
  .remove:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
  }
  .add {
    justify-self: start;
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    cursor: pointer;
  }
  .add:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .intensity {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 18px;
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .table-scroll {
    overflow-x: auto;
  }
  .cmp {
    border-collapse: collapse;
    width: 100%;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .cmp th,
  .cmp td {
    text-align: end;
    padding: 8px 12px;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }
  .cmp thead th {
    color: var(--text-mid);
    font-weight: 600;
    border-bottom: 1px solid var(--border-strong);
  }
  .cmp tbody th {
    text-align: start;
    color: var(--text-mid);
    font-weight: 500;
  }
  .cmp td {
    color: var(--text);
  }
  .cmp td.win {
    color: #4ade80;
    font-weight: 700;
  }
  .cmp .sum {
    color: var(--accent);
    border-inline-start: 1px solid var(--border);
  }
  .cmp tr.div th,
  .cmp tr.div td {
    border-bottom: 1px solid var(--border-strong);
  }
  .ic {
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--c) 40%, transparent));
  }
  .note {
    margin: 14px 0 0;
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
