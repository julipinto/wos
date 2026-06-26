<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import ModeBar from '$lib/tools/territory/ModeBar.svelte';
  import Controls from '$lib/tools/territory/Controls.svelte';
  import Rail from '$lib/tools/territory/Rail.svelte';
  import Board from '$lib/tools/territory/Board.svelte';
  import Search from '$lib/tools/territory/Search.svelte';
  import Editor from '$lib/tools/territory/Editor.svelte';
  import MapsPanel from '$lib/tools/territory/MapsPanel.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import { TERRITORY_SLIDES } from '$lib/tools/territory/tutorial';
  import { readJson, writeJson } from '$lib/utils/storage';
  import {
    OBJECT_DEFS,
    MODES,
    modeById,
    FURNACE_LEVELS,
    exportLayout,
    importLayout,
    collides,
    type PlacedObject,
    type TerritoryType
  } from '$lib/tools/territory/territory';
  import { savedMaps } from '$lib/tools/territory/maps.svelte';

  const VIEW_KEY = 'territory-view-v1';
  const MODE_KEY = 'territory-mode-v1';

  type View = 'flat' | 'iso';
  let view = $state<View>(readJson<View>(VIEW_KEY) === 'iso' ? 'iso' : 'flat');
  function setView(v: View) {
    view = v;
    writeJson(VIEW_KEY, v);
  }

  // Planner mode (hive / sunfire / state) — each has its own palette + storage.
  const initialMode = modeById(readJson<string>(MODE_KEY) ?? 'hive').id;
  let mode = $state<string>(initialMode);
  const activeMode = $derived(modeById(mode));
  const modeOptions = $derived(
    MODES.map((m) => ({
      id: m.id,
      label: (i18n.m.territory.modes as Record<string, string>)[m.i18n]
    }))
  );
  // Hive keeps the original key so existing layouts survive.
  const layoutKey = (m: string) => (m === 'hive' ? 'territory-layout-v1' : `territory-layout-${m}`);

  function loadLayout(m: string): PlacedObject[] {
    const raw = readJson<PlacedObject[]>(layoutKey(m));
    const allowed = new Set(modeById(m).types);
    return Array.isArray(raw) ? raw.filter((o) => allowed.has(o.type)) : [];
  }
  const objects = $state<PlacedObject[]>(loadLayout(initialMode));

  // ── Undo / redo (bounded) ───────────────────────────────────────────────
  // History snapshots are kept off-reactive and capped, and rapid edits (e.g.
  // typing a label) coalesce into one step, so the stack stays small.
  const HIST_MAX = 50;
  const COALESCE_MS = 400;
  const cloneLayout = (a: PlacedObject[]) =>
    a.map((o) => ({ ...o, bear: o.bear ? [...o.bear] : undefined }));
  let undoStack: PlacedObject[][] = [];
  let redoStack: PlacedObject[][] = [];
  let lastSnap = cloneLayout(objects);
  let lastPush = 0;
  let canUndo = $state(false);
  let canRedo = $state(false);
  const refreshHist = () => {
    canUndo = undoStack.length > 0;
    canRedo = redoStack.length > 0;
  };
  const save = () => writeJson(layoutKey(mode), cloneLayout(objects));

  function persist() {
    const now = Date.now();
    if (now - lastPush > COALESCE_MS) {
      undoStack.push(lastSnap);
      if (undoStack.length > HIST_MAX) undoStack.shift();
      redoStack = [];
    }
    lastPush = now;
    lastSnap = cloneLayout(objects);
    refreshHist();
    save();
  }

  function restoreHist(snap: PlacedObject[]) {
    objects.splice(0, objects.length, ...cloneLayout(snap));
    selectedIds = [];
    lastSnap = cloneLayout(objects);
    lastPush = 0;
    save();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(cloneLayout(objects));
    if (redoStack.length > HIST_MAX) redoStack.shift();
    restoreHist(undoStack.pop()!);
    refreshHist();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(cloneLayout(objects));
    if (undoStack.length > HIST_MAX) undoStack.shift();
    restoreHist(redoStack.pop()!);
    refreshHist();
  }
  // Loading a different layout (mode switch / load / import) is a new document.
  function clearHist() {
    undoStack = [];
    redoStack = [];
    lastSnap = cloneLayout(objects);
    lastPush = 0;
    refreshHist();
  }

  function setMode(m: string) {
    if (m === mode) return;
    mode = m;
    writeJson(MODE_KEY, m);
    objects.splice(0, objects.length, ...loadLayout(m));
    selectedIds = [];
    bearFocus = 0;
    highlight = '';
    tool = modeById(m).types[0];
    clearHist();
    autoFit();
  }

  let tool = $state<TerritoryType>(modeById(initialMode).types[0]);
  // Selection is a set so several objects can be moved/removed together. The tag
  // editor only shows when exactly one is selected.
  let selectedIds = $state<string[]>([]);
  const selected = $derived(
    selectedIds.length === 1 ? (objects.find((o) => o.id === selectedIds[0]) ?? null) : null
  );
  // Edit ⟷ View, like Excalidraw: Edit places/moves/marquee-selects; View just
  // pans the board by dragging (so drag-to-pan and marquee don't fight).
  const BOARDMODE_KEY = 'territory-boardmode-v1';
  let boardMode = $state<'edit' | 'view'>(
    readJson<'edit' | 'view'>(BOARDMODE_KEY) === 'view' ? 'view' : 'edit'
  );
  function setBoardMode(b: 'edit' | 'view') {
    boardMode = b;
    writeJson(BOARDMODE_KEY, b);
    if (b === 'view') selectedIds = [];
  }
  let zoom = $state(1);
  let showLabels = $state(false);
  const LABELBY_KEY = 'territory-labelby-v1';
  let labelField = $state<'furnace' | 'name'>(
    readJson<'furnace' | 'name'>(LABELBY_KEY) === 'name' ? 'name' : 'furnace'
  );
  function setLabelField(f: 'furnace' | 'name') {
    labelField = f;
    writeJson(LABELBY_KEY, f);
  }
  let heatmap = $state(false);
  let highlight = $state(''); // '' = off · a type · 'orphaned'
  let importOpen = $state(false);
  let importText = $state('');
  let copied = $state(false);
  let mapName = $state('');
  const HELP_KEY = 'territory-help-seen-v1';
  let helpOpen = $state(false);

  // A confirm dialog (e.g. before overwriting a saved map).
  let confirmMsg = $state('');
  let confirmAction = $state<(() => void) | null>(null);
  function askConfirm(message: string, onYes: () => void) {
    confirmMsg = message;
    confirmAction = onYes;
  }
  function doConfirm() {
    confirmAction?.();
    confirmAction = null;
    confirmMsg = '';
  }

  function saveMap() {
    const name = mapName.trim();
    if (!name || objects.length === 0) return;
    const existing = savedMaps.all(mode).find((m) => m.name.toLowerCase() === name.toLowerCase());
    const commit = () => {
      savedMaps.save(mode, name, objects);
      mapName = '';
    };
    if (existing) askConfirm(fmt(i18n.m.territory.maps.overwrite, { name }), commit);
    else commit();
  }
  function updateMap(id: string, name: string) {
    askConfirm(fmt(i18n.m.territory.maps.overwrite, { name }), () =>
      savedMaps.update(mode, id, objects)
    );
  }
  function loadMap(id: string) {
    objects.splice(0, objects.length, ...savedMaps.objectsOf(mode, id));
    selectedIds = [];
    save();
    clearHist();
    autoFit();
  }

  const furnaceOptions = [
    { value: '', label: '—' },
    ...FURNACE_LEVELS.map((l) => ({ value: l, label: l }))
  ];

  const objName = (k: string) => (i18n.m.territory.obj as Record<string, string>)[k];
  const count = (t: TerritoryType) => objects.filter((o) => o.type === t).length;

  const hasBears = $derived(activeMode.types.includes('bearTrap'));
  const bearCount = $derived(objects.filter((o) => o.type === 'bearTrap').length);
  let bearFocus = $state(0); // 0 = show all; 1..3 = highlight that bear's group
  // A city can join several bear traps (different days) — toggle each on/off.
  function toggleBear(n: number) {
    const o = selected;
    if (!o) return;
    const set = new Set(o.bear ?? []);
    if (set.has(n)) set.delete(n);
    else set.add(n);
    if (set.size) o.bear = [...set].sort((a, b) => a - b);
    else delete o.bear;
    persist();
  }

  function setTag<K extends 'name' | 'label' | 'furnace' | 'power'>(k: K, v: PlacedObject[K]) {
    const o = selected;
    if (!o) return;
    if (v === '' || v === 0 || v === undefined) delete o[k];
    else o[k] = v;
    persist();
  }
  // Bulk edit: apply a label/furnace/power across the whole multi-selection
  // (furnace/power only land on cities). Empty/zero clears the tag, like setTag.
  function bulkSet<K extends 'label' | 'furnace' | 'power'>(k: K, v: PlacedObject[K]) {
    for (const o of selectedObjects()) {
      if ((k === 'furnace' || k === 'power') && !OBJECT_DEFS[o.type].city) continue;
      if (v === '' || v === 0 || v === undefined) delete o[k];
      else o[k] = v;
    }
    persist();
  }
  // Convert a single object to another type in place, clamped to the grid and
  // rejected if the new footprint would collide. City-only tags drop if it stops
  // being a city.
  function convertSelected(type: string) {
    const o = selected;
    if (!o || o.type === type) return;
    const def = OBJECT_DEFS[type];
    const x = Math.min(o.x, N - def.w);
    const y = Math.min(o.y, N - def.h);
    if (collides(objects, { ...o, type, x, y }, o.id)) return;
    o.type = type;
    o.x = x;
    o.y = y;
    if (!OBJECT_DEFS[type].city) {
      delete o.furnace;
      delete o.power;
      delete o.bear;
    }
    persist();
  }
  function removeSelected() {
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    for (let i = objects.length - 1; i >= 0; i--) if (ids.has(objects[i].id)) objects.splice(i, 1);
    selectedIds = [];
    persist();
  }
  // Arrow-key nudge: shift the whole selection by (dx,dy) cells, clamped to the
  // 60×60 grid and rejected if it would collide with an unselected footprint.
  const N = 60;
  function nudge(dx: number, dy: number) {
    const sel = selectedObjects();
    if (!sel.length) return;
    const ids = new Set(sel.map((o) => o.id));
    const others = objects.filter((o) => !ids.has(o.id));
    const next = sel.map((o) => {
      const def = OBJECT_DEFS[o.type];
      return {
        o,
        x: Math.min(Math.max(0, o.x + dx), N - def.w),
        y: Math.min(Math.max(0, o.y + dy), N - def.h)
      };
    });
    if (next.some((n) => collides(others, { ...n.o, x: n.x, y: n.y }, n.o.id))) return;
    let changed = false;
    for (const n of next) {
      if (n.o.x !== n.x || n.o.y !== n.y) {
        n.o.x = n.x;
        n.o.y = n.y;
        changed = true;
      }
    }
    if (changed) persist();
  }

  // ── Duplicate / copy-paste ──────────────────────────────────────────────
  const newId = (type: string) =>
    `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  /** Drop clones of `src` onto the board at the first diagonal offset that fits. */
  function placeClones(src: PlacedObject[]) {
    if (!src.length) return;
    let off = 2;
    const fits = (k: number) =>
      src.every((o) => !collides(objects, { ...o, id: '__t', x: o.x + k, y: o.y + k }, '__t'));
    while (off <= 16 && !fits(off)) off++;
    const copies = src.map((o) => ({
      ...o,
      bear: o.bear ? [...o.bear] : undefined,
      id: newId(o.type),
      x: o.x + off,
      y: o.y + off
    }));
    objects.push(...copies);
    selectedIds = copies.map((c) => c.id);
    persist();
  }
  const selectedObjects = () => objects.filter((o) => selectedIds.includes(o.id));
  function duplicateSelected() {
    placeClones(selectedObjects());
  }
  let clipboard: PlacedObject[] = [];
  function copySelection() {
    clipboard = selectedObjects().map((o) => ({ ...o, bear: o.bear ? [...o.bear] : undefined }));
  }
  function pasteClipboard() {
    placeClones(clipboard);
  }
  function reset() {
    objects.splice(0, objects.length);
    selectedIds = [];
    persist();
  }

  // ── Search / go-to ──────────────────────────────────────────────────────
  let board = $state<ReturnType<typeof Board>>();
  /** Frame the freshly-loaded hive once the new objects have rendered. */
  function autoFit() {
    tick().then(() => requestAnimationFrame(() => board?.fit()));
  }
  function focusObject(o: PlacedObject) {
    const def = OBJECT_DEFS[o.type];
    selectedIds = [o.id];
    board?.focusCell(o.x + def.w / 2, o.y + def.h / 2);
  }
  function gotoCoord(x: number, y: number) {
    selectedIds = [];
    board?.focusCell(x + 0.5, y + 0.5);
  }
  // Quick-jump targets for the top-bar presets.
  const seedObj = $derived(objects.find((o) => OBJECT_DEFS[o.type].seed) ?? null);
  const firstBear = $derived(objects.find((o) => o.type === 'bearTrap') ?? null);
  // Highlight filter options: off · each type · orphaned (when connectivity matters).
  const highlightOptions = $derived([
    { value: '', label: '—' },
    ...activeMode.types.map((t) => ({ value: t, label: objName(OBJECT_DEFS[t].i18n) })),
    ...(activeMode.connectivity
      ? [{ value: 'orphaned', label: i18n.m.territory.legend.orphan }]
      : [])
  ]);

  // Precompute the share link (off the current page URL, so it follows the host)
  // whenever the layout/mode changes. Compression is async, so doing it here and
  // copying synchronously on click keeps the clipboard gesture valid (Safari).
  let shareUrl = $state('');
  let shareCode = $state('');
  let codeCopied = $state(false);
  // ~2000 chars is the safe cross-app ceiling (Chrome address bar / Discord
  // message). Past it, nudge users to the code+import path instead of the link.
  const urlTooLong = $derived(shareUrl.length > 2000);
  $effect(() => {
    const snapshot = objects.map((o) => ({ ...o }));
    const m = mode;
    exportLayout(m, snapshot).then((code) => {
      shareCode = code;
      shareUrl = `${location.origin}${location.pathname}?t=${encodeURIComponent(code)}`;
    });
  });
  function doExport() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        copied = true;
        setTimeout(() => (copied = false), 1800);
      },
      () => (copied = false)
    );
  }
  function doCopyCode() {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode).then(
      () => {
        codeCopied = true;
        setTimeout(() => (codeCopied = false), 1800);
      },
      () => (codeCopied = false)
    );
  }
  function applyImport(parsed: { mode: string; objects: PlacedObject[] }) {
    mode = parsed.mode;
    writeJson(MODE_KEY, mode);
    objects.splice(0, objects.length, ...parsed.objects);
    tool = modeById(mode).types[0];
    selectedIds = [];
    save();
    clearHist();
    autoFit();
  }
  // Accept a full share link OR a raw code; apply if it parses.
  async function parseAndApply(text: string): Promise<boolean> {
    const m = text.match(/[?&]t=([^&\s]+)/);
    const parsed = await importLayout(m ? decodeURIComponent(m[1]) : text.trim());
    if (parsed) applyImport(parsed);
    return !!parsed;
  }
  async function doImport() {
    await parseAndApply(importText);
    importText = '';
    importOpen = false;
  }
  // Download the layout as a .txt file — the no-length-limit way to share a big hive.
  function doDownload() {
    if (!shareCode) return;
    const blob = new Blob([shareCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wos-${mode}-territory.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function onImportFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    input.value = ''; // let the same file be picked again later
    if (await parseAndApply(text)) importOpen = false;
  }

  function closeHelp() {
    helpOpen = false;
    writeJson(HELP_KEY, true);
  }

  // A shared layout link (?t=CODE) loads on open — into its embedded mode.
  onMount(async () => {
    if (!readJson<boolean>(HELP_KEY)) helpOpen = true; // first visit → quick tour
    const code = new URLSearchParams(location.search).get('t');
    if (!code) return;
    const parsed = await importLayout(code);
    if (parsed && parsed.objects.length) applyImport(parsed);
  });

  // Keyboard shortcuts. Skip while typing in a field so the browser's own
  // editing (text undo, copy, etc.) still works there.
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement?.tagName;
      if (el === 'INPUT' || el === 'TEXTAREA' || el === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (e.key === 'y' || e.shiftKey) redo();
        else undo();
      } else if (mod && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (mod && e.key === 'c') {
        copySelection();
      } else if (mod && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) {
          e.preventDefault();
          removeSelected();
        }
      } else if (e.key === 'Escape') {
        selectedIds = [];
      } else if (e.key.startsWith('Arrow') && selectedIds.length) {
        e.preventDefault();
        const d = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowUp') nudge(0, -d);
        else if (e.key === 'ArrowDown') nudge(0, d);
        else if (e.key === 'ArrowLeft') nudge(-d, 0);
        else if (e.key === 'ArrowRight') nudge(d, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<svelte:head>
  <title>{i18n.m.landing.territory.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.landing.territory.title} sub={i18n.m.territory.sub} backHref="/" />

  <ModeBar
    modes={modeOptions}
    active={mode}
    ariaLabel={i18n.m.territory.modes.label}
    onSelect={setMode}
  />

  <div class="topbar">
    <Controls bind:zoom onFit={() => board?.fit()} />
    <div class="tb-actions">
      {#if seedObj}
        <button
          class="help-btn glyph"
          type="button"
          onclick={() => seedObj && focusObject(seedObj)}
          title={i18n.m.territory.jumpHq}
          aria-label={i18n.m.territory.jumpHq}>⌂</button
        >
      {/if}
      {#if firstBear}
        <button
          class="help-btn glyph"
          type="button"
          onclick={() => firstBear && focusObject(firstBear)}
          title={i18n.m.territory.jumpBear}
          aria-label={i18n.m.territory.jumpBear}>🐻</button
        >
      {/if}
      <button
        class="help-btn glyph"
        type="button"
        onclick={undo}
        disabled={!canUndo}
        aria-label={i18n.m.territory.undo}
        title={i18n.m.territory.undo}>↶</button
      >
      <button
        class="help-btn glyph"
        type="button"
        onclick={redo}
        disabled={!canRedo}
        aria-label={i18n.m.territory.redo}
        title={i18n.m.territory.redo}>↷</button
      >
      <button
        class="help-btn"
        type="button"
        onclick={() => (helpOpen = true)}
        aria-label={i18n.m.territory.help.title}
        title={i18n.m.territory.help.title}><Icon name="circle-help" size={16} /></button
      >
    </div>
  </div>

  <div class="stage">
    <div class="rail-col">
      <Rail
        {boardMode}
        onBoardMode={setBoardMode}
        {view}
        onView={setView}
        types={activeMode.types}
        {tool}
        nameOf={objName}
        {count}
        onPick={(t) => (tool = t)}
        bind:showLabels
        {labelField}
        onLabelField={setLabelField}
        bind:heatmap
        bind:bearFocus
        bind:highlight
        {highlightOptions}
        {hasBears}
        {bearCount}
        connectivity={!!activeMode.connectivity}
      />
    </div>

    <div class="stage-board">
      {#if objects.length > 0}
        <Search {objects} nameOf={objName} onPick={focusObject} onGoto={gotoCoord} />
        <p class="obj-count">
          {fmt(i18n.m.territory.objectsN, { n: objects.length })}{#if selectedIds.length > 0}
            · {fmt(i18n.m.territory.selectedN, { n: selectedIds.length })}{/if}
        </p>
      {/if}
      <Board
        bind:this={board}
        {objects}
        bind:selectedIds
        bind:bearFocus
        {view}
        bind:zoom
        {boardMode}
        {tool}
        {showLabels}
        {labelField}
        {heatmap}
        {highlight}
        connectivity={!!activeMode.connectivity}
        onPersist={persist}
      />
    </div>

    <div class="stage-side">
      {#if selectedIds.length > 1}
        <div class="group-bar">
          <span class="group-count"
            >{fmt(i18n.m.territory.selectedN, { n: selectedIds.length })}</span
          >
          <div class="bulk-fields">
            <span class="bulk-title">{i18n.m.territory.bulkEdit}</span>
            <input
              class="bulk-input"
              type="text"
              placeholder={i18n.m.territory.tag.label}
              aria-label={i18n.m.territory.tag.label}
              oninput={(e) => bulkSet('label', e.currentTarget.value)}
            />
            <Select
              value=""
              options={furnaceOptions}
              onChange={(v) => bulkSet('furnace', v)}
              ariaLabel={i18n.m.territory.tag.furnace}
            />
            <NumberInput
              value={0}
              onChange={(n) => bulkSet('power', n)}
              ariaLabel={i18n.m.territory.tag.power}
              placeholder={i18n.m.territory.tag.power}
            />
          </div>
          <div class="bulk-actions">
            <button class="reset" type="button" onclick={duplicateSelected}>
              ⧉ {i18n.m.territory.duplicate}
            </button>
            <button class="reset" type="button" onclick={removeSelected}>
              × {i18n.m.territory.remove}
            </button>
            <button class="reset" type="button" onclick={() => (selectedIds = [])}>
              {i18n.m.common.close}
            </button>
          </div>
        </div>
      {:else if selected}
        <Editor
          {selected}
          typeLabel={objName(OBJECT_DEFS[selected.type].i18n)}
          isCity={!!OBJECT_DEFS[selected.type].city}
          {hasBears}
          {bearCount}
          {furnaceOptions}
          convertOptions={activeMode.types
            .filter((t) => t !== selected.type)
            .map((t) => ({ value: t, label: objName(OBJECT_DEFS[t].i18n) }))}
          {setTag}
          {toggleBear}
          onConvert={convertSelected}
          onDuplicate={duplicateSelected}
          onRemove={removeSelected}
          onClose={() => (selectedIds = [])}
        />
      {:else}
        <p class="side-hint">{i18n.m.territory.selectHint}</p>
      {/if}
    </div>
  </div>

  <div class="footer">
    <p class="hint">{i18n.m.territory.hint}</p>
    <div class="footer-actions">
      <button
        class="act"
        type="button"
        onclick={doExport}
        disabled={objects.length === 0 || urlTooLong}
        title={urlTooLong ? i18n.m.territory.urlLong : ''}
      >
        <Icon name={copied ? 'check' : 'share-2'} size={13} />
        {copied ? i18n.m.territory.copied : i18n.m.territory.share}
      </button>
      <button class="act" type="button" onclick={doCopyCode} disabled={objects.length === 0}>
        <Icon name={codeCopied ? 'check' : 'copy'} size={13} />
        {codeCopied ? i18n.m.territory.codeCopied : i18n.m.territory.copyCode}
      </button>
      <button class="act" type="button" onclick={doDownload} disabled={objects.length === 0}>
        <Icon name="download" size={13} />
        {i18n.m.territory.download}
      </button>
      <button class="act" type="button" onclick={() => (importOpen = !importOpen)}>
        <Icon name="upload" size={13} />
        {i18n.m.territory.import}
      </button>
      <button class="reset" type="button" onclick={reset} disabled={objects.length === 0}>
        {i18n.m.common.reset}
      </button>
    </div>
    {#if urlTooLong}
      <p class="warn">⚠️ {i18n.m.territory.urlLong}</p>
    {/if}
  </div>

  {#if importOpen}
    <div class="import-box">
      <textarea
        bind:value={importText}
        placeholder={i18n.m.territory.importHint}
        rows="2"
        aria-label={i18n.m.territory.import}
      ></textarea>
      <div class="import-actions">
        <button class="act" type="button" onclick={doImport} disabled={!importText.trim()}>
          {i18n.m.territory.import}
        </button>
        <label class="act file-act">
          <Icon name="upload" size={13} />
          {i18n.m.territory.fromFile}
          <input type="file" accept=".txt,text/plain" onchange={onImportFile} />
        </label>
      </div>
    </div>
  {/if}

  <MapsPanel
    {mode}
    hasObjects={objects.length > 0}
    bind:mapName
    onSave={saveMap}
    onUpdate={updateMap}
    onLoad={loadMap}
  />

  <ConfirmDialog
    open={!!confirmAction}
    message={confirmMsg}
    onConfirm={doConfirm}
    onCancel={() => (confirmAction = null)}
  />

  <Tutorial
    open={helpOpen}
    onClose={closeHelp}
    slides={[
      {
        title: i18n.m.territory.tour.welcomeTitle,
        caption: i18n.m.territory.tour.welcomeCaption,
        svg: TERRITORY_SLIDES[0]()
      },
      {
        title: i18n.m.territory.tour.modesTitle,
        caption: i18n.m.territory.tour.modesCaption,
        svg: TERRITORY_SLIDES[1]()
      },
      {
        title: i18n.m.territory.tour.placeTitle,
        caption: i18n.m.territory.tour.placeCaption,
        svg: TERRITORY_SLIDES[2]()
      },
      {
        title: i18n.m.territory.tour.selectTitle,
        caption: i18n.m.territory.tour.selectCaption,
        svg: TERRITORY_SLIDES[3]()
      },
      {
        title: i18n.m.territory.tour.bearsTitle,
        caption: i18n.m.territory.tour.bearsCaption,
        svg: TERRITORY_SLIDES[4]()
      }
    ]}
  />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .stage {
    display: grid;
    gap: 14px;
  }
  /* Wide desktop: three columns — the left rail, the board, and a sticky editor
     column on the right (Figma style) so editing a piece never scrolls the page.
     Below this the rail collapses into a horizontal band above the board. */
  @media (min-width: 1024px) {
    .wrap {
      max-width: 1240px;
    }
    .stage {
      grid-template-columns: 200px minmax(0, 1fr) 300px;
      gap: 20px;
      align-items: start;
    }
    .rail-col,
    .stage-side {
      position: sticky;
      top: 20px;
    }
    .stage-side :global(.editor),
    .stage-side .group-bar {
      margin-top: 0;
    }
  }
  .obj-count {
    margin: -4px 0 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .side-hint {
    display: none;
  }
  @media (min-width: 1024px) {
    .side-hint {
      display: block;
      margin: 0;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-dim);
      text-align: center;
      padding: 28px 18px;
      border: 1px dashed var(--border);
      border-radius: var(--r-card);
    }
  }
  .topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .tb-actions {
    margin-inline-start: auto;
    display: inline-flex;
    gap: 8px;
  }
  .help-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .help-btn.glyph {
    font-size: 17px;
    line-height: 1;
  }
  .help-btn:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .help-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .group-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-card);
  }
  .group-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    margin-inline-end: auto;
  }
  .bulk-fields {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-basis: 100%;
  }
  .bulk-title {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .bulk-input {
    min-width: 0;
    flex: 1 1 120px;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 8px 12px;
  }
  .bulk-input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .bulk-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-basis: 100%;
  }
  .warn {
    flex-basis: 100%;
    margin: 8px 0 0;
    color: #fbbf24;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
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
  .import-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .file-act {
    position: relative;
    overflow: hidden;
    justify-content: center;
  }
  .file-act input[type='file'] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
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
    /* Stack the share row so the long hint + buttons stop overflowing. */
    .footer {
      flex-direction: column;
      align-items: stretch;
    }
    .footer-actions {
      justify-content: stretch;
    }
    .footer-actions .act {
      flex: 1 1 auto;
      justify-content: center;
    }
    .footer-actions .reset {
      flex: 1 1 100%;
      text-align: center;
    }
    /* Multi-select bar floats as a bottom sheet (like the editor) instead of
       pushing the page. */
    .group-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      background: var(--bg-soft);
      border-top: 1px solid var(--border-accent);
      border-radius: 16px 16px 0 0;
      z-index: 60;
      padding: 14px 16px max(14px, env(safe-area-inset-bottom));
      box-shadow: 0 -14px 44px rgba(0, 0, 0, 0.6);
    }
  }
</style>
