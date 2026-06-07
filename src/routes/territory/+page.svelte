<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import { TERRITORY_SLIDES } from '$lib/tools/territory/tutorial';
  import { readJson, writeJson } from '$lib/utils/storage';
  import {
    OBJECT_DEFS,
    MODES,
    modeById,
    FURNACE_LEVELS,
    computeTerritory,
    footprintCells,
    coverageCells,
    exportLayout,
    importLayout,
    collides,
    type PlacedObject,
    type TerritoryType
  } from '$lib/tools/territory/territory';
  import { savedMaps } from '$lib/tools/territory/maps.svelte';

  const N = 60; // grid is N×N cells
  const CENTER = N / 2;
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
  // Hive keeps the original key so existing layouts survive.
  const layoutKey = (m: string) => (m === 'hive' ? 'territory-layout-v1' : `territory-layout-${m}`);

  // The transformed group + the click-mapping CTM source.
  let plane: SVGGElement | undefined = $state();
  // 2D isometric: rotate the square grid 45° about its centre and squash it
  // vertically into the classic diamond. Pure affine → clicks stay invertible.
  const ISO = `translate(${CENTER} ${CENTER}) scale(0.7071 0.55) rotate(45) translate(-${CENTER} -${CENTER})`;
  const planeTransform = $derived(view === 'iso' ? ISO : '');

  // Project a plane point through the iso transform — so labels can sit at the
  // right spot but draw OUTSIDE the rotated group (upright, not skewed).
  function isoPoint(x: number, y: number): { x: number; y: number } {
    const c = 0.7071;
    const sx = 0.7071;
    const sy = 0.55;
    const px = x - CENTER;
    const py = y - CENTER;
    return { x: sx * (px * c - py * c) + CENTER, y: sy * (px * c + py * c) + CENTER };
  }
  // Crop the iso viewBox to the diamond's bounds (drops the empty bands).
  const ISO_VIEWBOX = (() => {
    const pts = [isoPoint(0, 0), isoPoint(N, 0), isoPoint(0, N), isoPoint(N, N)];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(...xs) - minX;
    const h = Math.max(...ys) - minY;
    return `${minX - 1} ${minY - 1} ${w + 2} ${h + 2}`;
  })();
  const viewBox = $derived(view === 'iso' ? ISO_VIEWBOX : `0 0 ${N} ${N}`);

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
  let scroller: HTMLDivElement | undefined = $state();
  let importOpen = $state(false);
  let importText = $state('');
  let copied = $state(false);
  let mapsOpen = $state(false);
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

  // Heatmap: colour tagged objects by power, cool → hot, normalised to the max.
  const maxPower = $derived(Math.max(0, ...objects.map((o) => o.power ?? 0)));
  function heatColor(power: number | undefined): string {
    if (!power || maxPower <= 0) return '#475569'; // untagged → slate
    const t = power / maxPower; // 0..1
    const hue = 210 - 210 * t; // 210 (blue) → 0 (red)
    return `hsl(${hue}, 85%, 55%)`;
  }

  const EMPTY = {
    cells: new Set<string>(),
    connected: new Set<string>(),
    orphaned: new Set<string>()
  };
  const territory = $derived(activeMode.connectivity ? computeTerritory(objects) : EMPTY);
  const objName = (k: string) => (i18n.m.territory.obj as Record<string, string>)[k];
  const count = (t: TerritoryType) => objects.filter((o) => o.type === t).length;

  // Map a screen click to a grid cell by inverting the plane's CTM. This works
  // in both views because the iso projection is a plain 2D affine on the <g>,
  // so getScreenCTM() captures it (plus the viewBox) and stays invertible.
  function pointFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const ctm = plane?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }
  function cellFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const p = pointFromEvent(e);
    return p ? { x: Math.floor(p.x), y: Math.floor(p.y) } : null;
  }
  // Pointer interaction depends on the board mode:
  //  · View: drag anywhere = pan the board · tap object = inspect.
  //  · Edit: tap empty = place · tap object = select · drag object = move (the
  //    whole selection if several are picked) · drag empty = marquee-select.
  // Double-tap always removes (see onGridRemove).
  let dragId: string | null = null;
  let dragOff = { x: 0, y: 0 };
  let pendingPlace: { x: number; y: number } | null = null;
  let moved = false;
  let pan: { cx: number; cy: number; left: number; top: number } | null = null;
  // Group move: starting positions of every selected object + the start cell.
  let group: { start: Map<string, { x: number; y: number }>; cx: number; cy: number } | null = null;
  // Marquee (rubber-band) rectangle in grid coords, while drag-selecting.
  let marquee = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  // Two-finger pan: tracks live pointers so a second finger pans the board even
  // in Edit mode (where one finger places / marquee-selects).
  const pointers = new Map<number, { x: number; y: number }>();
  let twoPan: { cx: number; cy: number; left: number; top: number } | null = null;
  const midpoint = () => {
    const p = [...pointers.values()];
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
  };

  function startPan(e: PointerEvent) {
    pan = scroller
      ? { cx: e.clientX, cy: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop }
      : null;
  }
  function onPointerDown(e: PointerEvent) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    // A second finger starts a two-finger pan — abort whatever the first began.
    if (pointers.size >= 2) {
      dragId = pendingPlace = null;
      pan = group = null;
      marquee = null;
      moved = true;
      if (scroller) {
        const m = midpoint();
        twoPan = { cx: m.x, cy: m.y, left: scroller.scrollLeft, top: scroller.scrollTop };
      }
      e.preventDefault();
      return;
    }
    const cell = cellFromEvent(e);
    if (!cell) return;
    const { x, y } = cell;
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    moved = false;
    dragId = null;
    pendingPlace = null;
    pan = null;
    group = null;
    marquee = null;
    const hit = objects.find((o) => footprintCells(o).includes(`${x},${y}`));

    if (boardMode === 'view') {
      // Drag = pan; remember the hit so a tap can still select it.
      dragId = hit?.id ?? null;
      dragOff = hit ? { x: x - hit.x, y: y - hit.y } : { x: 0, y: 0 };
      if (!hit) startPan(e);
    } else if (hit) {
      dragId = hit.id;
      dragOff = { x: x - hit.x, y: y - hit.y };
      // If the grabbed object is part of a multi-selection, move the whole group.
      if (selectedIds.length > 1 && selectedIds.includes(hit.id)) {
        const start = new Map(
          objects.filter((o) => selectedIds.includes(o.id)).map((o) => [o.id, { x: o.x, y: o.y }])
        );
        group = { start, cx: x, cy: y };
      }
    } else {
      pendingPlace = { x, y };
      marquee = { x0: x, y0: y, x1: x, y1: y }; // edit-mode drag = marquee
    }
  }
  function onPointerMove(e: PointerEvent) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Two-finger pan (any mode): follow the midpoint of the two fingers.
    if (twoPan && scroller && pointers.size >= 2) {
      const m = midpoint();
      scroller.scrollLeft = twoPan.left - (m.x - twoPan.cx);
      scroller.scrollTop = twoPan.top - (m.y - twoPan.cy);
      e.preventDefault();
      return;
    }
    // Panning (view mode, dragging empty space).
    if (pan && scroller) {
      const dx = e.clientX - pan.cx;
      const dy = e.clientY - pan.cy;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      scroller.scrollLeft = pan.left - dx;
      scroller.scrollTop = pan.top - dy;
      e.preventDefault();
      return;
    }
    // Group move: shift every selected object by the same (clamped) delta.
    if (group) {
      const cell = cellFromEvent(e);
      if (!cell) return;
      let dx = cell.x - group.cx;
      let dy = cell.y - group.cy;
      for (const [id, s] of group.start) {
        const def = OBJECT_DEFS[objects.find((o) => o.id === id)!.type];
        dx = Math.min(Math.max(dx, -s.x), N - def.w - s.x);
        dy = Math.min(Math.max(dy, -s.y), N - def.h - s.y);
      }
      const moving = new Set(group.start.keys());
      const others = objects.filter((o) => !moving.has(o.id));
      const next = [...group.start].map(([id, s]) => ({ id, x: s.x + dx, y: s.y + dy }));
      const ok = next.every(
        (n) => !collides(others, { ...objects.find((o) => o.id === n.id)!, ...n })
      );
      if (ok) {
        for (const n of next) {
          const o = objects.find((p) => p.id === n.id)!;
          if (o.x !== n.x || o.y !== n.y) {
            o.x = n.x;
            o.y = n.y;
            moved = true;
          }
        }
      }
      e.preventDefault();
      return;
    }
    // Single object move.
    if (dragId && boardMode === 'edit') {
      const cell = cellFromEvent(e);
      const o = objects.find((x) => x.id === dragId);
      if (!cell || !o) return;
      const def = OBJECT_DEFS[o.type];
      const nx = Math.min(Math.max(0, cell.x - dragOff.x), N - def.w);
      const ny = Math.min(Math.max(0, cell.y - dragOff.y), N - def.h);
      // Buildings can't overlap (a banner's 7×7 coverage may; footprints can't).
      if ((nx !== o.x || ny !== o.y) && !collides(objects, { ...o, x: nx, y: ny }, o.id)) {
        o.x = nx;
        o.y = ny;
        moved = true;
      }
      e.preventDefault();
      return;
    }
    // Marquee select (edit mode, dragging empty space).
    if (marquee) {
      const p = pointFromEvent(e);
      if (!p) return;
      marquee = { ...marquee, x1: p.x, y1: p.y };
      if (Math.abs(marquee.x1 - marquee.x0) + Math.abs(marquee.y1 - marquee.y0) > 0.3) moved = true;
      e.preventDefault();
    }
  }
  function onPointerUp(e: PointerEvent) {
    const wasPan = !!twoPan;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) twoPan = null;
    if (wasPan) {
      moved = pointers.size > 0; // keep suppressing taps until all fingers lift
      return;
    }
    if (group) {
      if (moved) persist();
    } else if (marquee && moved) {
      // Select every object whose footprint intersects the marquee rectangle.
      const minX = Math.min(marquee.x0, marquee.x1);
      const maxX = Math.max(marquee.x0, marquee.x1);
      const minY = Math.min(marquee.y0, marquee.y1);
      const maxY = Math.max(marquee.y0, marquee.y1);
      selectedIds = objects
        .filter((o) => {
          const def = OBJECT_DEFS[o.type];
          return o.x < maxX && o.x + def.w > minX && o.y < maxY && o.y + def.h > minY;
        })
        .map((o) => o.id);
    } else if (dragId) {
      if (moved) persist();
      else selectedIds = [dragId]; // a tap selects one
    } else if (pendingPlace && !moved && boardMode === 'edit') {
      const def = OBJECT_DEFS[tool];
      const candidate: PlacedObject = {
        id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: tool,
        x: Math.min(pendingPlace.x, N - def.w),
        y: Math.min(pendingPlace.y, N - def.h)
      };
      if (!collides(objects, candidate)) {
        objects.push(candidate);
        persist();
      }
    } else if (!moved && boardMode === 'view') {
      selectedIds = []; // tapping empty space in view mode clears the selection
    }
    dragId = null;
    pendingPlace = null;
    pan = null;
    group = null;
    marquee = null;
    moved = false;
  }

  // Double-click an object to remove it right on the board (no scrolling).
  function onGridRemove(e: MouseEvent) {
    const cell = cellFromEvent(e);
    if (!cell) return;
    const i = objects.findIndex((o) => footprintCells(o).includes(`${cell.x},${cell.y}`));
    if (i >= 0) {
      selectedIds = selectedIds.filter((id) => id !== objects[i].id);
      objects.splice(i, 1);
      persist();
    }
  }

  // Bear traps numbered by placement order (1..3); cities pick which they join.
  const bearTraps = $derived(objects.filter((o) => o.type === 'bearTrap'));
  const bearNum = (o: PlacedObject) => bearTraps.indexOf(o) + 1;
  const hasBears = $derived(activeMode.types.includes('bearTrap'));
  let bearFocus = $state(0); // 0 = show all; 1..3 = highlight that bear's group
  // If the focused trap was removed, fall back to "show all".
  $effect(() => {
    if (bearFocus > bearTraps.length) bearFocus = 0;
  });
  function inFocus(o: PlacedObject): boolean {
    if (bearFocus === 0) return true;
    if (o.type === 'bearTrap') return bearNum(o) === bearFocus;
    return o.bear?.includes(bearFocus) ?? false;
  }
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
  async function doImport() {
    // Accept a full share link OR a raw code.
    const m = importText.match(/[?&]t=([^&\s]+)/);
    const parsed = await importLayout(m ? decodeURIComponent(m[1]) : importText.trim());
    importText = '';
    importOpen = false;
    if (parsed) applyImport(parsed);
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

  <div class="modebar" role="group" aria-label={i18n.m.territory.modes.label}>
    {#each MODES as m (m.id)}
      <button
        class="mode-btn"
        class:active={mode === m.id}
        type="button"
        onclick={() => setMode(m.id)}
      >
        {(i18n.m.territory.modes as Record<string, string>)[m.i18n]}
      </button>
    {/each}
  </div>

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
    <div class="palette" role="toolbar" aria-label={i18n.m.territory.place}>
      {#each activeMode.types as t (t)}
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
  {/if}

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
    {#if showLabels}
      <Segmented
        value={labelField}
        options={[
          { value: 'furnace', label: i18n.m.territory.labelFurnace },
          { value: 'name', label: i18n.m.territory.labelName }
        ]}
        onChange={(v) => setLabelField(v as 'furnace' | 'name')}
      />
    {/if}
    <button class="toggle" class:on={heatmap} type="button" onclick={() => (heatmap = !heatmap)}
      >{i18n.m.territory.heatmap}</button
    >
    {#if hasBears && bearTraps.length > 0}
      <div class="bear-focus">
        <span class="bf-label">🐻 {i18n.m.territory.bearFocus}</span>
        <Segmented
          value={String(bearFocus)}
          ariaLabel={i18n.m.territory.bearFocus}
          options={[
            { value: '0', label: i18n.m.territory.bearAll },
            ...bearTraps.map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
          ]}
          onChange={(v) => (bearFocus = Number(v))}
        />
      </div>
    {/if}
  </div>

  <div class="board-scroll" bind:this={scroller}>
    <div class="board" class:iso={view === 'iso'} style="width: {zoom * 100}%">
      <svg
        {viewBox}
        class="grid"
        class:view={boardMode === 'view'}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        ondblclick={onGridRemove}
        role="application"
        aria-label="grid"
      >
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
        <rect x={-10} y={-10} width={N + 20} height={N + 20} fill="var(--bg)" />
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
            {@const sel = selectedIds.includes(o.id)}
            {@const lit = inFocus(o)}
            <rect
              class="obj"
              x={o.x + 0.08}
              y={o.y + 0.08}
              width={def.w - 0.16}
              height={def.h - 0.16}
              rx="0.18"
              fill={heatmap ? heatColor(o.power) : def.color}
              fill-opacity={!lit ? 0.12 : orphan && !heatmap ? 0.25 : 0.85}
              stroke={sel
                ? '#ffffff'
                : bearFocus > 0 && lit && o.type === 'bearTrap'
                  ? '#fbbf24'
                  : orphan
                    ? '#fb7185'
                    : 'rgba(0,0,0,0.3)'}
              stroke-width={sel
                ? 0.16
                : bearFocus > 0 && lit && o.type === 'bearTrap'
                  ? 0.18
                  : orphan
                    ? 0.12
                    : 0.05}
            />
          {/each}
          {#if marquee}
            <rect
              class="marquee"
              x={Math.min(marquee.x0, marquee.x1)}
              y={Math.min(marquee.y0, marquee.y1)}
              width={Math.abs(marquee.x1 - marquee.x0)}
              height={Math.abs(marquee.y1 - marquee.y0)}
            />
          {/if}
        </g>
        <!-- Labels live OUTSIDE the transformed group so they stay upright even
             in iso (positioned via the iso projection). -->
        {#if showLabels}
          {#each objects as o (o.id)}
            {@const text = labelField === 'name' ? o.name : o.furnace}
            {#if text}
              {@const def = OBJECT_DEFS[o.type]}
              {@const cx = o.x + def.w / 2}
              {@const cy = o.y + def.h / 2}
              {@const p = view === 'iso' ? isoPoint(cx, cy) : { x: cx, y: cy }}
              <text
                class="tile-label"
                x={p.x}
                y={p.y}
                text-anchor="middle"
                dominant-baseline="central">{text}</text
              >
            {/if}
          {/each}
        {/if}
        <!-- Bear-trap numbers (1..3) — always shown, upright, so cities can be
             matched to the trap they join. -->
        {#each bearTraps as bt, i (bt.id)}
          {@const def = OBJECT_DEFS[bt.type]}
          {@const cx = bt.x + def.w / 2}
          {@const cy = bt.y + def.h / 2}
          {@const p = view === 'iso' ? isoPoint(cx, cy) : { x: cx, y: cy }}
          <text
            class="bear-num"
            class:dim={!inFocus(bt)}
            x={p.x}
            y={p.y}
            text-anchor="middle"
            dominant-baseline="central">{i + 1}</text
          >
        {/each}
      </svg>
    </div>
  </div>

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
    <div class="editor">
      <div class="ed-head">
        <span class="ed-title">{objName(OBJECT_DEFS[selected.type].i18n)}</span>
        <button class="ed-close" type="button" onclick={() => (selectedIds = [])} aria-label="close"
          >×</button
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
        {#if OBJECT_DEFS[selected.type].city}
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
          {#if hasBears && bearTraps.length > 0}
            <div class="ed-field">
              <span class="field-label">{i18n.m.territory.tag.bear}</span>
              <div class="bear-chips">
                {#each bearTraps as _, i (i)}
                  <button
                    type="button"
                    class="bear-chip"
                    class:on={selected.bear?.includes(i + 1)}
                    onclick={() => toggleBear(i + 1)}>🐻 {i + 1}</button
                  >
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>
      <button class="ed-remove" type="button" onclick={removeSelected}
        >× {i18n.m.territory.remove}</button
      >
    </div>
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
      <button class="act" type="button" onclick={doExport} disabled={objects.length === 0}>
        <Icon name={copied ? 'check' : 'share-2'} size={13} />
        {copied ? i18n.m.territory.copied : i18n.m.territory.share}
      </button>
      <button class="act" type="button" onclick={doCopyCode} disabled={objects.length === 0}>
        <Icon name={codeCopied ? 'check' : 'copy'} size={13} />
        {codeCopied ? i18n.m.territory.codeCopied : i18n.m.territory.copyCode}
      </button>
      <button class="act" type="button" onclick={() => (importOpen = !importOpen)}>
        <Icon name="download" size={13} />
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
      <button class="act" type="button" onclick={doImport} disabled={!importText.trim()}>
        {i18n.m.territory.import}
      </button>
    </div>
  {/if}

  <div class="maps" class:open={mapsOpen}>
    <button
      class="maps-head"
      type="button"
      aria-expanded={mapsOpen}
      onclick={() => (mapsOpen = !mapsOpen)}
    >
      <span class="maps-icon" aria-hidden="true">🗺️</span>
      <span class="maps-title">{i18n.m.territory.maps.title}</span>
      {#if savedMaps.all(mode).length > 0}<span class="maps-count"
          >{savedMaps.all(mode).length}</span
        >{/if}
      <Icon name="chevron-down" size={14} class="caret {mapsOpen ? 'up' : ''}" />
    </button>
    {#if mapsOpen}
      <div class="maps-body">
        <div class="maps-save">
          <input
            type="text"
            bind:value={mapName}
            placeholder={i18n.m.territory.maps.name}
            aria-label={i18n.m.territory.maps.name}
          />
          <button
            class="act"
            type="button"
            onclick={saveMap}
            disabled={!mapName.trim() || objects.length === 0}
          >
            {i18n.m.territory.maps.save}
          </button>
        </div>
        {#if savedMaps.all(mode).length === 0}
          <p class="maps-empty">{i18n.m.territory.maps.empty}</p>
        {:else}
          <ul class="maps-list">
            {#each savedMaps.all(mode) as m (m.id)}
              <li class="map-row">
                <button class="map-load" type="button" onclick={() => loadMap(m.id)}>
                  <span class="map-name">{m.name}</span>
                  <span class="map-meta">{m.objects.length} · {i18n.m.territory.maps.load}</span>
                </button>
                <button
                  class="map-upd"
                  type="button"
                  onclick={() => updateMap(m.id, m.name)}
                  disabled={objects.length === 0}
                  title={i18n.m.territory.maps.updateHint}
                >
                  <Icon name="upload" size={12} />
                  {i18n.m.territory.maps.update}
                </button>
                <button
                  class="map-del"
                  type="button"
                  onclick={() => savedMaps.remove(mode, m.id)}
                  aria-label={i18n.m.territory.remove}>×</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>

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
  .modebar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .mode-btn {
    flex: 1;
    min-width: 90px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 14px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .mode-btn.active {
    color: var(--accent);
    border-color: var(--border-accent);
    background: var(--accent-glow);
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
  .bear-focus {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .bf-label {
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
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
    touch-action: none;
    cursor: crosshair; /* Edit: empty space = place */
  }
  .grid.view {
    cursor: grab; /* View: empty space = pan */
  }
  .grid.view:active {
    cursor: grabbing;
  }
  .grid .obj {
    cursor: pointer; /* over a piece (both modes): select/move */
  }
  .marquee {
    fill: rgba(147, 212, 255, 0.12);
    stroke: #93d4ff;
    stroke-width: 0.08;
    stroke-dasharray: 0.3 0.2;
    pointer-events: none;
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
  .bear-num {
    fill: #fff;
    font-family: var(--font-mono);
    font-size: 1.4px;
    font-weight: 800;
    paint-order: stroke;
    stroke: #b91c1c;
    stroke-width: 0.18px;
    pointer-events: none;
  }
  .bear-num.dim {
    opacity: 0.2;
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
  .bear-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .bear-chip {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 7px 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .bear-chip.on {
    color: var(--text);
    border-color: var(--border-accent);
    background: var(--accent-glow);
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
  .maps {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    margin-top: 14px;
  }
  .maps.open {
    border-color: var(--border-accent);
  }
  .maps-head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: transparent;
    border: 0;
    color: var(--text);
    padding: 14px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .maps-icon {
    font-size: 14px;
  }
  .maps-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .maps-count {
    font-size: 11px;
    color: var(--text-dim);
  }
  .maps-head :global(.caret) {
    color: var(--text-dim);
    transition: transform 0.2s ease;
    margin-inline-start: auto;
  }
  .maps-head :global(.caret.up) {
    transform: rotate(180deg);
  }
  .maps-body {
    padding: 0 16px 14px;
    display: grid;
    gap: 12px;
  }
  .maps-save {
    display: flex;
    gap: 8px;
  }
  .maps-save input {
    flex: 1;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 8px 12px;
  }
  .maps-save input:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .maps-empty {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin: 0;
  }
  .maps-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .map-row {
    display: flex;
    gap: 8px;
  }
  .map-load {
    flex: 1;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    padding: 9px 14px;
    cursor: pointer;
    text-align: start;
    transition: border-color 0.2s ease;
  }
  .map-load:hover {
    border-color: var(--border-accent);
  }
  .map-name {
    font-size: 13px;
  }
  .map-meta {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .map-upd {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 0 12px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .map-upd:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  .map-upd:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .map-del {
    flex-shrink: 0;
    width: 36px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-dim);
    font-size: 18px;
    cursor: pointer;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .map-del:hover {
    color: #fb7185;
    border-color: rgba(251, 113, 133, 0.4);
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
