<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import ModeBar from '$lib/tools/territory/ModeBar.svelte';
  import Palette from '$lib/tools/territory/Palette.svelte';
  import Controls from '$lib/tools/territory/Controls.svelte';
  import Board from '$lib/tools/territory/Board.svelte';
  import Editor from '$lib/tools/territory/Editor.svelte';
  import MapsPanel from '$lib/tools/territory/MapsPanel.svelte';
  import { TERRITORY_SLIDES } from '$lib/tools/territory/tutorial';
  import { readJson, writeJson } from '$lib/utils/storage';
  import {
    OBJECT_DEFS,
    MODES,
    modeById,
    FURNACE_LEVELS,
    exportLayout,
    importLayout,
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
  const persist = () =>
    writeJson(
      layoutKey(mode),
      objects.map((o) => ({ ...o }))
    );

  function setMode(m: string) {
    if (m === mode) return;
    mode = m;
    writeJson(MODE_KEY, m);
    objects.splice(0, objects.length, ...loadLayout(m));
    selectedIds = [];
    bearFocus = 0;
    tool = modeById(m).types[0];
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
    persist();
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

  function setTag<K extends 'name' | 'furnace' | 'power'>(k: K, v: PlacedObject[K]) {
    const o = selected;
    if (!o) return;
    if (v === '' || v === 0 || v === undefined) delete o[k];
    else o[k] = v;
    persist();
  }
  function removeSelected() {
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    for (let i = objects.length - 1; i >= 0; i--) if (ids.has(objects[i].id)) objects.splice(i, 1);
    selectedIds = [];
    persist();
  }
  function reset() {
    objects.splice(0, objects.length);
    selectedIds = [];
    persist();
  }

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
    persist();
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

  <div class="viewbar">
    <Segmented
      value={boardMode}
      ariaLabel={i18n.m.territory.boardMode.label}
      options={[
        { value: 'edit', label: `✏️ ${i18n.m.territory.boardMode.edit}` },
        { value: 'view', label: `🖐 ${i18n.m.territory.boardMode.view}` }
      ]}
      onChange={(v) => setBoardMode(v as 'edit' | 'view')}
    />
    <Segmented
      value={view}
      ariaLabel={i18n.m.territory.view.label}
      options={[
        { value: 'flat', label: i18n.m.territory.view.flat },
        { value: 'iso', label: i18n.m.territory.view.tilt }
      ]}
      onChange={(v) => setView(v as View)}
    />
    <button
      class="help-btn"
      type="button"
      onclick={() => (helpOpen = true)}
      aria-label={i18n.m.territory.help.title}
      title={i18n.m.territory.help.title}><Icon name="circle-help" size={16} /></button
    >
  </div>

  {#if boardMode === 'edit'}
    <Palette
      types={activeMode.types}
      {tool}
      ariaLabel={i18n.m.territory.place}
      nameOf={objName}
      {count}
      onPick={(t) => (tool = t)}
    />
  {/if}

  <Controls
    bind:zoom
    bind:showLabels
    bind:heatmap
    bind:bearFocus
    {labelField}
    onLabelField={setLabelField}
    {hasBears}
    {bearCount}
  />

  <Board
    {objects}
    bind:selectedIds
    bind:bearFocus
    {view}
    {zoom}
    {boardMode}
    {tool}
    {showLabels}
    {labelField}
    {heatmap}
    connectivity={!!activeMode.connectivity}
    onPersist={persist}
  />

  {#if selectedIds.length > 1}
    <div class="group-bar">
      <span class="group-count">{fmt(i18n.m.territory.selectedN, { n: selectedIds.length })}</span>
      <button class="reset" type="button" onclick={removeSelected}>
        × {i18n.m.territory.remove}
      </button>
      <button class="reset" type="button" onclick={() => (selectedIds = [])}>
        {i18n.m.common.close}
      </button>
    </div>
  {/if}

  {#if selected}
    <Editor
      {selected}
      typeLabel={objName(OBJECT_DEFS[selected.type].i18n)}
      isCity={!!OBJECT_DEFS[selected.type].city}
      {hasBears}
      {bearCount}
      {furnaceOptions}
      {setTag}
      {toggleBear}
      onRemove={removeSelected}
      onClose={() => (selectedIds = [])}
    />
  {/if}

  <div class="legend">
    <span class="leg"><span class="dot reach"></span>{i18n.m.territory.legend.reach}</span>
    <span class="leg"><span class="dot terr"></span>{i18n.m.territory.legend.connected}</span>
    {#if activeMode.connectivity}
      <span class="leg"><span class="dot orphan"></span>{i18n.m.territory.legend.orphan}</span>
    {/if}
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
  .viewbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .help-btn {
    margin-inline-start: auto;
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
  .help-btn:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .group-bar {
    display: flex;
    align-items: center;
    gap: 10px;
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
  .dot.orphan {
    background: rgba(251, 113, 133, 0.3);
    border: 1px solid #fb7185;
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
  }
</style>
