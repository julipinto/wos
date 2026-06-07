<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import { readJson, writeJson } from '$lib/utils/storage';
  import {
    OBJECT_DEFS,
    TERRITORY_TYPES,
    FURNACE_LEVELS,
    computeTerritory,
    footprintCells,
    coverageCells,
    exportLayout,
    importLayout,
    type PlacedObject,
    type TerritoryType
  } from '$lib/tools/territory/territory';

  const N = 30; // grid is N×N cells
  const STORAGE = 'territory-layout-v1';
  const VIEW_KEY = 'territory-view-v1';

  type View = 'flat' | 'iso';
  let view = $state<View>(readJson<View>(VIEW_KEY) === 'iso' ? 'iso' : 'flat');
  function setView(v: View) {
    view = v;
    writeJson(VIEW_KEY, v);
  }

  // The transformed group + the click-mapping CTM source.
  let plane: SVGGElement | undefined = $state();
  // 2D isometric: rotate the square grid 45° about its centre and squash it
  // vertically into the classic diamond. Pure affine → clicks stay invertible.
  const ISO = 'translate(15 15) scale(0.7071 0.55) rotate(45) translate(-15 -15)';
  const planeTransform = $derived(view === 'iso' ? ISO : '');
  // In iso the diamond only spans y≈3–27, so crop the viewBox to drop the bands.
  const viewBox = $derived(view === 'iso' ? '-1 2.5 32 25' : '0 0 30 30');

  function load(): PlacedObject[] {
    const raw = readJson<PlacedObject[]>(STORAGE);
    return Array.isArray(raw) ? raw.filter((o) => OBJECT_DEFS[o.type]) : [];
  }
  const objects = $state<PlacedObject[]>(load());
  const persist = () =>
    writeJson(
      STORAGE,
      objects.map((o) => ({ ...o }))
    );

  let tool = $state<TerritoryType>('banner');
  let selectedId = $state<string | null>(null);
  let zoom = $state(1);
  let showLabels = $state(false);
  let heatmap = $state(false);
  let importOpen = $state(false);
  let importText = $state('');
  let copied = $state(false);

  const selected = $derived(objects.find((o) => o.id === selectedId) ?? null);
  const furnaceOptions = [
    { value: '', label: '—' },
    ...FURNACE_LEVELS.map((l) => ({ value: l, label: l }))
  ];

  // Heatmap: colour tagged objects by power, cool → hot, normalised to the max.
  const maxPower = $derived(Math.max(0, ...objects.map((o) => o.power ?? 0)));
  function heatColor(power: number | undefined): string {
    if (!power || maxPower <= 0) return '#475569'; // untagged → slate
    const t = power / maxPower; // 0..1
    const hue = 210 - 210 * t; // 210 (blue) → 0 (red)
    return `hsl(${hue}, 85%, 55%)`;
  }

  const territory = $derived(computeTerritory(objects));
  const objName = (k: string) => (i18n.m.territory.obj as Record<string, string>)[k];
  const count = (t: TerritoryType) => objects.filter((o) => o.type === t).length;

  // Map a screen click to a grid cell by inverting the plane's CTM. This works
  // in both views because the iso projection is a plain 2D affine on the <g>,
  // so getScreenCTM() captures it (plus the viewBox) and stays invertible.
  function cellFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const ctm = plane?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: Math.floor(p.x), y: Math.floor(p.y) };
  }
  function onGrid(e: MouseEvent) {
    const cell = cellFromEvent(e);
    if (!cell) return;
    const { x, y } = cell;
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    // Clicking an existing object SELECTS it (edit/remove via the panel); an
    // empty cell places the current tool.
    const hit = objects.find((o) => footprintCells(o).includes(`${x},${y}`));
    if (hit) {
      selectedId = hit.id;
      return;
    }
    const def = OBJECT_DEFS[tool];
    const px = Math.min(x, N - def.w);
    const py = Math.min(y, N - def.h);
    objects.push({
      id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: tool,
      x: px,
      y: py
    });
    persist();
  }

  function setTag<K extends 'name' | 'furnace' | 'power'>(k: K, v: PlacedObject[K]) {
    const o = objects.find((x) => x.id === selectedId);
    if (!o) return;
    if (v === '' || v === 0 || v === undefined) delete o[k];
    else o[k] = v;
    persist();
  }
  function removeSelected() {
    const i = objects.findIndex((o) => o.id === selectedId);
    if (i >= 0) objects.splice(i, 1);
    selectedId = null;
    persist();
  }
  function reset() {
    objects.splice(0, objects.length);
    selectedId = null;
    persist();
  }

  async function doExport() {
    try {
      await navigator.clipboard.writeText(exportLayout(objects));
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }
  function doImport() {
    const parsed = importLayout(importText);
    if (!parsed) {
      importText = '';
      return;
    }
    objects.splice(0, objects.length, ...parsed);
    selectedId = null;
    importOpen = false;
    importText = '';
    persist();
  }

  // A shared layout link (?t=CODE) loads on open.
  onMount(() => {
    const code = new URLSearchParams(location.search).get('t');
    if (!code) return;
    const parsed = importLayout(code);
    if (parsed && parsed.length) {
      objects.splice(0, objects.length, ...parsed);
      persist();
    }
  });

  const toCells = (s: Iterable<string>) =>
    [...s].map((c) => {
      const [x, y] = c.split(',').map(Number);
      return { x, y };
    });

  // Parse territory cells into {x,y} for rendering.
  const territoryCells = $derived(toCells(territory.cells));

  // Union of every banner's 7×7 reach (deduped so overlaps don't darken).
  const reachCells = $derived.by(() => {
    const s = new Set<string>();
    for (const o of objects) if (o.type === 'banner') for (const c of coverageCells(o)) s.add(c);
    return toCells(s);
  });
</script>

<svelte:head>
  <title>{i18n.m.landing.territory.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.landing.territory.title} sub={i18n.m.territory.sub} backHref="/" />

  <div class="viewbar" role="group" aria-label={i18n.m.territory.view.label}>
    <span class="viewbar-label">{i18n.m.territory.view.label}</span>
    <div class="seg">
      <button
        class="seg-btn"
        class:active={view === 'flat'}
        type="button"
        onclick={() => setView('flat')}>{i18n.m.territory.view.flat}</button
      >
      <button
        class="seg-btn"
        class:active={view === 'iso'}
        type="button"
        onclick={() => setView('iso')}>{i18n.m.territory.view.tilt}</button
      >
    </div>
  </div>

  <div class="palette" role="toolbar" aria-label={i18n.m.territory.place}>
    {#each TERRITORY_TYPES as t (t)}
      {@const def = OBJECT_DEFS[t]}
      <button
        class="tool"
        class:active={tool === t}
        type="button"
        onclick={() => (tool = t)}
        style="--c: {def.color}"
      >
        <span class="swatch" style="background: {def.color}"></span>
        <span class="tool-name">{objName(def.i18n)}</span>
        <span class="tool-count">{count(t)}{def.max ? `/${def.max}` : ''}</span>
      </button>
    {/each}
  </div>

  <div class="controls">
    <div class="zoom">
      <button
        class="ctl"
        type="button"
        onclick={() => (zoom = Math.max(1, +(zoom - 0.5).toFixed(1)))}
        disabled={zoom <= 1}
        aria-label="zoom out">−</button
      >
      <span class="zoom-val">{Math.round(zoom * 100)}%</span>
      <button
        class="ctl"
        type="button"
        onclick={() => (zoom = Math.min(3, +(zoom + 0.5).toFixed(1)))}
        disabled={zoom >= 3}
        aria-label="zoom in">+</button
      >
    </div>
    <button
      class="toggle"
      class:on={showLabels}
      type="button"
      onclick={() => (showLabels = !showLabels)}>{i18n.m.territory.labels}</button
    >
    <button class="toggle" class:on={heatmap} type="button" onclick={() => (heatmap = !heatmap)}
      >{i18n.m.territory.heatmap}</button
    >
  </div>

  <div class="board-scroll">
    <div class="board" class:iso={view === 'iso'} style="width: {zoom * 100}%">
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <svg {viewBox} class="grid" onclick={onGrid} role="application" aria-label="grid">
        <defs>
          <pattern id="cells" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect
              width="1"
              height="1"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              stroke-width="0.03"
            />
          </pattern>
        </defs>
        <!-- panel backdrop, generously sized to cover both viewBoxes -->
        <rect x="-5" y="-5" width="42" height="42" fill="var(--bg)" />
        <g bind:this={plane} transform={planeTransform}>
          <!-- the playable floor — lighter than the backdrop so the iso diamond
             reads as a distinct surface -->
          <rect width={N} height={N} fill="var(--bg-soft)" />
          <!-- banner reach (7×7), subtle amber under everything -->
          {#each reachCells as c (c.x + '_' + c.y)}
            <rect x={c.x} y={c.y} width="1" height="1" fill="rgba(251,191,36,0.1)" />
          {/each}
          <!-- connected territory -->
          {#each territoryCells as c (c.x + '_' + c.y)}
            <rect x={c.x} y={c.y} width="1" height="1" fill="rgba(147,212,255,0.16)" />
          {/each}
          <rect width={N} height={N} fill="url(#cells)" />
          <!-- objects -->
          {#each objects as o (o.id)}
            {@const def = OBJECT_DEFS[o.type]}
            {@const orphan = territory.orphaned.has(o.id)}
            {@const sel = o.id === selectedId}
            <rect
              x={o.x + 0.08}
              y={o.y + 0.08}
              width={def.w - 0.16}
              height={def.h - 0.16}
              rx="0.18"
              fill={heatmap ? heatColor(o.power) : def.color}
              fill-opacity={orphan && !heatmap ? 0.25 : 0.85}
              stroke={sel ? '#ffffff' : orphan ? '#fb7185' : 'rgba(0,0,0,0.3)'}
              stroke-width={sel ? 0.16 : orphan ? 0.12 : 0.05}
            />
            {#if showLabels && (o.furnace || o.name)}
              <text
                class="tile-label"
                x={o.x + def.w / 2}
                y={o.y + def.h / 2}
                text-anchor="middle"
                dominant-baseline="central">{o.furnace ?? o.name}</text
              >
            {/if}
          {/each}
        </g>
      </svg>
    </div>
  </div>

  {#if selected}
    <div class="editor">
      <div class="ed-head">
        <span class="ed-title">{objName(OBJECT_DEFS[selected.type].i18n)}</span>
        <button
          class="ed-close"
          type="button"
          onclick={() => (selectedId = null)}
          aria-label="close">×</button
        >
      </div>
      <div class="ed-fields">
        <label class="ed-field">
          <span class="field-label">{i18n.m.territory.tag.name}</span>
          <input
            type="text"
            value={selected.name ?? ''}
            oninput={(e) => setTag('name', e.currentTarget.value)}
          />
        </label>
        <label class="ed-field">
          <span class="field-label">{i18n.m.territory.tag.furnace}</span>
          <Select
            value={selected.furnace ?? ''}
            options={furnaceOptions}
            onChange={(v) => setTag('furnace', v)}
            ariaLabel={i18n.m.territory.tag.furnace}
          />
        </label>
        <label class="ed-field">
          <span class="field-label">{i18n.m.territory.tag.power}</span>
          <NumberInput
            value={selected.power ?? 0}
            onChange={(n) => setTag('power', n)}
            ariaLabel={i18n.m.territory.tag.power}
          />
        </label>
      </div>
      <button class="ed-remove" type="button" onclick={removeSelected}
        >× {i18n.m.territory.remove}</button
      >
    </div>
  {/if}

  <div class="legend">
    <span class="leg"><span class="dot reach"></span>{i18n.m.territory.legend.reach}</span>
    <span class="leg"><span class="dot terr"></span>{i18n.m.territory.legend.connected}</span>
  </div>

  <div class="footer">
    <p class="hint">{i18n.m.territory.hint}</p>
    <div class="footer-actions">
      <button class="act" type="button" onclick={doExport} disabled={objects.length === 0}>
        <Icon name={copied ? 'check' : 'copy'} size={13} />
        {copied ? i18n.m.territory.copied : i18n.m.territory.export}
      </button>
      <button class="act" type="button" onclick={() => (importOpen = !importOpen)}>
        <Icon name="download" size={13} />
        {i18n.m.territory.import}
      </button>
      <button class="reset" type="button" onclick={reset} disabled={objects.length === 0}>
        {i18n.m.common.reset}
      </button>
    </div>
  </div>

  {#if importOpen}
    <div class="import-box">
      <textarea
        bind:value={importText}
        placeholder={i18n.m.territory.importHint}
        rows="2"
        aria-label={i18n.m.territory.import}
      ></textarea>
      <button class="act" type="button" onclick={doImport} disabled={!importText.trim()}>
        {i18n.m.territory.import}
      </button>
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
  .viewbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .viewbar-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .seg {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 3px;
    gap: 2px;
  }
  .seg-btn {
    background: none;
    border: none;
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 5px 14px;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  .seg-btn.active {
    background: var(--bg-soft);
    color: var(--text);
  }
  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .tool {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }
  .tool.active {
    border-color: var(--c);
    color: var(--text);
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .tool-count {
    color: var(--text-dim);
    font-size: 11px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .zoom {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ctl {
    width: 30px;
    height: 30px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-mid);
    font-size: 16px;
    cursor: pointer;
  }
  .ctl:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .zoom-val {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    min-width: 38px;
    text-align: center;
  }
  .toggle {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 6px 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .toggle.on {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
  }
  .board-scroll {
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  .board {
    overflow: hidden;
    background: var(--bg);
    min-width: 100%;
  }
  .grid {
    display: block;
    width: 100%;
    height: auto;
    touch-action: manipulation;
    cursor: crosshair;
  }
  .tile-label {
    fill: #fff;
    font-family: var(--font-mono);
    font-size: 0.5px;
    font-weight: 700;
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.55);
    stroke-width: 0.06px;
    pointer-events: none;
  }
  .editor {
    margin-top: 14px;
    background: var(--surface);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-card);
    padding: 14px 16px;
  }
  .ed-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .ed-title {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .ed-close {
    background: none;
    border: 0;
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
  }
  .ed-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ed-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .ed-field input {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 14px;
    padding: 10px 12px;
  }
  .ed-field input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .field-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ed-remove {
    margin-top: 12px;
    background: transparent;
    border: 1px solid rgba(251, 113, 133, 0.4);
    border-radius: var(--r-pill);
    color: #fb7185;
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 7px 14px;
    cursor: pointer;
  }
  .footer-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .act {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 8px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .act:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .act:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .import-box {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .import-box textarea {
    flex: 1;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 8px 10px;
    resize: vertical;
  }
  .import-box textarea:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  /* The iso view just swaps the viewBox + plane transform; nothing extra here. */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 14px;
  }
  .leg {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .dot.reach {
    background: rgba(251, 191, 36, 0.35);
    border: 1px solid rgba(251, 191, 36, 0.5);
  }
  .dot.terr {
    background: rgba(147, 212, 255, 0.35);
    border: 1px solid rgba(147, 212, 255, 0.5);
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }
  .hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }
  .reset {
    flex-shrink: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 14px;
    cursor: pointer;
  }
  .reset:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .reset:disabled {
    opacity: 0.4;
    cursor: default;
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
