<script lang="ts">
  /**
   * Comparator — put SETS of building upgrades side by side to decide between
   * plans ("Furnace + Lancer vs Furnace + Embassy?"). Each column is a set: a
   * list of building ranges whose costs are summed. We compare the summed
   * totals of each set; the lowest cell per row is highlighted. Reuses the
   * engine (sumRange/combine) + the refinement model (estimate) at the shared
   * intensity.
   */
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Select from '$lib/components/Select.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import RangeSelect from '$lib/tools/upgrade/RangeSelect.svelte';
  import { buildingsCalc } from '$lib/tools/upgrade/store.svelte';
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

  const STORAGE = 'upgrade-compare-v2';
  interface Row {
    buildingId: string;
    from: string;
    to: string;
  }
  interface SetScn {
    name: string;
    rows: Row[];
  }

  const tableOf = (id: string) => buildingById(id) ?? BUILDINGS[0];
  const labelsOf = (id: string) => tableOf(id).levels.map((l) => l.label);
  const letterFor = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));

  function cleanRow(r: Row): Row {
    const t = tableOf(r.buildingId);
    const labels = t.levels.map((l) => l.label);
    return {
      buildingId: t.id,
      from: labels.includes(r.from) ? r.from : labels[0],
      to: labels.includes(r.to) ? r.to : labels[labels.length - 1]
    };
  }
  function fullRow(id = BUILDINGS[0].id): Row {
    const labels = labelsOf(id);
    return { buildingId: id, from: labels[0], to: labels[labels.length - 1] };
  }
  function load(): SetScn[] {
    const raw = readJson<SetScn[]>(STORAGE);
    if (Array.isArray(raw) && raw.length) {
      return raw.map((s, i) => ({
        name: s.name || letterFor(i),
        rows: (s.rows ?? []).map(cleanRow).length ? s.rows.map(cleanRow) : [fullRow()]
      }));
    }
    return [
      { name: letterFor(0), rows: [fullRow()] },
      { name: letterFor(1), rows: [fullRow()] }
    ];
  }
  const sets = $state<SetScn[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      sets.map((s) => ({ name: s.name, rows: s.rows.map((r) => ({ ...r })) }))
    );

  // Seed from "?s=building:from:to,…" via the Buildings "Compare" button. The
  // seeded rows become Set A, and Set B starts as a copy so there's something
  // to tweak against. Runs once, on client navigation or a full reload.
  let seeded = false;
  $effect(() => {
    const s = $page.url.searchParams.get('s');
    if (seeded || !s) return;
    seeded = true;
    const rows = s
      .split(',')
      .map((part) => {
        const [b, from, to] = part.split(':');
        return b ? cleanRow({ buildingId: b, from, to }) : null;
      })
      .filter((x): x is Row => x !== null);
    if (rows.length) {
      sets.splice(
        0,
        sets.length,
        { name: letterFor(0), rows: rows.map((r) => ({ ...r })) },
        { name: letterFor(1), rows: rows.map((r) => ({ ...r })) }
      );
      persist();
    }
  });

  const buildingOptions = BUILDINGS.map((b) => ({ value: b.id, label: b.name }));

  function setName(si: number, name: string) {
    sets[si].name = name;
    persist();
  }
  function setBuilding(si: number, ri: number, id: string) {
    sets[si].rows[ri] = fullRow(id);
    persist();
  }
  function setRange(si: number, ri: number, from: string, to: string) {
    sets[si].rows[ri] = { ...sets[si].rows[ri], from, to };
    persist();
  }
  function addRow(si: number) {
    const last = sets[si].rows[sets[si].rows.length - 1] ?? fullRow();
    sets[si].rows.push({ ...last });
    persist();
  }
  function removeRow(si: number, ri: number) {
    sets[si].rows.splice(ri, 1);
    persist();
  }
  function addSet() {
    const last = sets[sets.length - 1];
    sets.push({ name: letterFor(sets.length), rows: last.rows.map((r) => ({ ...r })) });
    persist();
  }
  function removeSet(si: number) {
    sets.splice(si, 1);
    persist();
  }

  // "Use as my plan" — replace the buildings-page plan with this set's rows,
  // confirmed via a modal. We stay on the comparator (so you can keep comparing)
  // and show a notice with a link to the plan instead of redirecting away.
  let confirmSet = $state<number | null>(null);
  let appliedName = $state<string | null>(null);
  function applySet(si: number) {
    buildingsCalc.replace(sets[si].rows.map((r) => ({ ...r })));
    appliedName = sets[si].name;
    confirmSet = null;
  }

  const plan = $derived(
    planById(PRESETS.find((p) => p.key === refinementStore.intensity)?.plan ?? 'L3')
  );

  interface Col {
    name: string;
    totals: ResourceBag;
    time: number;
    rfc: number;
    fc: number;
    days: number;
  }
  const resultOf = (set: SetScn) =>
    combine(set.rows.map((r) => sumRange(tableOf(r.buildingId), r.from, r.to)));
  const cols = $derived<Col[]>(
    sets.map((set) => {
      const r = resultOf(set);
      const rfc = r.totals.refinedFireCrystal ?? 0;
      const e = estimate(rfc, plan);
      return { name: set.name, totals: r.totals, time: r.time, rfc, fc: e.fcTotal, days: e.days };
    })
  );

  // Resources present across every set, RFC handled as its own row.
  const allRes = $derived(combine(sets.map(resultOf)).totals);
  const resKeys = $derived(presentResources(allRes).filter((k) => k !== 'refinedFireCrystal'));
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
    backHref="/upgrade/buildings"
  />

  {#if appliedName !== null}
    <div class="applied" role="status">
      <span>✓ {fmt(i18n.m.upgrade.compare.applied, { name: appliedName })}</span>
      <a href="{base}/upgrade/buildings">{i18n.m.upgrade.compare.viewPlan}</a>
    </div>
  {/if}

  <div class="sets">
    {#each sets as set, si (si)}
      <div class="set">
        <div class="set-head">
          <span class="set-tag">{i18n.m.upgrade.compare.set}</span>
          <input
            class="set-name"
            value={set.name}
            oninput={(e) => setName(si, e.currentTarget.value)}
            aria-label={i18n.m.upgrade.compare.set}
          />
          {#if sets.length > 1}
            <button
              class="set-remove"
              type="button"
              onclick={() => removeSet(si)}
              aria-label={i18n.m.upgrade.troops.remove}
              title={i18n.m.upgrade.troops.remove}>🗑</button
            >
          {/if}
        </div>
        {#each set.rows as r, ri (ri)}
          {@const t = tableOf(r.buildingId)}
          <div class="row">
            <Select
              value={r.buildingId}
              options={buildingOptions}
              onChange={(v) => setBuilding(si, ri, v)}
              ariaLabel={i18n.m.upgrade.compare.building}
            />
            <div class="row-range">
              <RangeSelect
                labels={t.levels.map((l) => l.label)}
                from={r.from}
                to={r.to}
                onChange={(f, to) => setRange(si, ri, f, to)}
                ariaFrom="{t.name} {i18n.m.upgrade.from}"
                ariaTo="{t.name} {i18n.m.upgrade.to}"
              />
              {#if set.rows.length > 1}
                <button
                  class="remove"
                  type="button"
                  onclick={() => removeRow(si, ri)}
                  aria-label={i18n.m.upgrade.troops.remove}>×</button
                >
              {/if}
            </div>
          </div>
        {/each}
        <div class="set-foot">
          <button class="add" type="button" onclick={() => addRow(si)}
            >+ {i18n.m.upgrade.compare.addBuilding}</button
          >
          <button class="use" type="button" onclick={() => (confirmSet = si)}
            >🔁 {i18n.m.upgrade.compare.use}</button
          >
        </div>
      </div>
    {/each}
    <button class="add add-set" type="button" onclick={addSet}
      >+ {i18n.m.upgrade.compare.addSet}</button
    >
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
          {#each cols as c, i (i)}<th>{i18n.m.upgrade.compare.set} {c.name}</th>{/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>✨ RFC</th>
          {#each cols as c, i (i)}<td class:win={rfcLow[i]}>{formatQty(c.rfc)}</td>{/each}
        </tr>
        <tr>
          <th>🔥 {i18n.m.upgrade.compare.refineFc}</th>
          {#each cols as c, i (i)}<td class:win={fcLow[i]}>~{formatQty(c.fc)}</td>{/each}
        </tr>
        <tr>
          <th>⏱ {i18n.m.upgrade.compare.refineDays}</th>
          {#each cols as c, i (i)}<td class:win={daysLow[i]}>~{c.days}</td>{/each}
        </tr>
        <tr class="div">
          <th>🔨 {i18n.m.upgrade.buildTime}</th>
          {#each cols as c, i (i)}<td class:win={timeLow[i]}>{formatDuration(c.time)}</td>{/each}
        </tr>
        {#each resKeys as k (k)}
          {@const low = resLow(k)}
          <tr>
            <th
              ><span class="ic" style="--c: {resDef(k).color}">{resDef(k).icon}</span>
              {resName(k)}</th
            >
            {#each cols as c, i (i)}
              <td class:win={low[i]}>{formatQty(c.totals[k as keyof ResourceBag] ?? 0)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="note">{i18n.m.upgrade.compare.note}</p>
</div>

<ConfirmDialog
  open={confirmSet !== null}
  message={confirmSet !== null
    ? fmt(i18n.m.upgrade.compare.useConfirm, { name: sets[confirmSet].name })
    : ''}
  confirmLabel={i18n.m.upgrade.compare.use}
  onConfirm={() => confirmSet !== null && applySet(confirmSet)}
  onCancel={() => (confirmSet = null)}
/>

<style>
  .wrap {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: color-mix(in srgb, #4ade80 12%, transparent);
    border: 1px solid color-mix(in srgb, #4ade80 35%, transparent);
    border-radius: var(--r-card);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .applied a {
    color: #4ade80;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  .applied a:hover {
    text-decoration: underline;
  }
  .sets {
    display: grid;
    gap: 12px;
    margin-bottom: 18px;
  }
  .set {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .set-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .set-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .set-name {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    padding: 4px 2px;
  }
  .set-name:focus {
    outline: none;
    border-bottom-color: var(--border-accent);
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row-range {
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
  /* Distinct from the row × pills: a borderless trash glyph. */
  .set-remove {
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 4px 6px;
    font-size: 16px;
    line-height: 1;
    opacity: 0.55;
    cursor: pointer;
  }
  .set-remove:hover {
    opacity: 1;
  }
  .set-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .use {
    background: var(--accent-glow);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    cursor: pointer;
  }
  .use:hover {
    border-color: var(--accent);
  }
  .add {
    align-self: start;
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
  .add-set {
    justify-self: start;
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
