<script lang="ts">
  import {
    OBJECT_DEFS,
    computeTerritory,
    footprintCells,
    coverageCells,
    collides,
    type PlacedObject
  } from './territory';

  // The interactive canvas: renders the grid + objects and owns all pointer
  // interaction (place / select / move / marquee / pan). It mutates `objects`
  // and `selectedIds` directly (bindable) and calls `onPersist` after changes.
  interface Props {
    objects: PlacedObject[];
    selectedIds: string[];
    bearFocus: number;
    view: 'flat' | 'iso';
    zoom: number;
    boardMode: 'edit' | 'view';
    tool: string;
    showLabels: boolean;
    labelField: 'furnace' | 'name';
    heatmap: boolean;
    connectivity: boolean;
    onPersist: () => void;
  }
  let {
    objects,
    selectedIds = $bindable(),
    bearFocus = $bindable(),
    view,
    zoom,
    boardMode,
    tool,
    showLabels,
    labelField,
    heatmap,
    connectivity,
    onPersist
  }: Props = $props();

  const N = 60; // grid is N×N cells
  const CENTER = N / 2;

  // The transformed group + the click-mapping CTM source, and the scroll box.
  let plane: SVGGElement | undefined = $state();
  let scroller: HTMLDivElement | undefined = $state();

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
  const territory = $derived(connectivity ? computeTerritory(objects) : EMPTY);

  const toCells = (s: Iterable<string>) =>
    [...s].map((c) => {
      const [x, y] = c.split(',').map(Number);
      return { x, y };
    });
  const territoryCells = $derived(toCells(territory.cells));
  // Union of every banner's 7×7 reach (deduped so overlaps don't darken).
  const reachCells = $derived.by(() => {
    const s = new Set<string>();
    for (const o of objects) if (o.type === 'banner') for (const c of coverageCells(o)) s.add(c);
    return toCells(s);
  });

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
      if (moved) onPersist();
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
      if (moved) onPersist();
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
        onPersist();
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
      onPersist();
    }
  }

  // Bear traps numbered by placement order (1..3); cities pick which they join.
  const bearTraps = $derived(objects.filter((o) => o.type === 'bearTrap'));
  const bearNum = (o: PlacedObject) => bearTraps.indexOf(o) + 1;
  // If the focused trap was removed, fall back to "show all".
  $effect(() => {
    if (bearFocus > bearTraps.length) bearFocus = 0;
  });
  function inFocus(o: PlacedObject): boolean {
    if (bearFocus === 0) return true;
    if (o.type === 'bearTrap') return bearNum(o) === bearFocus;
    return o.bear?.includes(bearFocus) ?? false;
  }
</script>

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

<style>
  .board-scroll {
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-card);
  }
  /* On phones the 60×60 board is taller than the screen, which buried the
     controls above/below it. Bound it to a viewport you pan inside (Excalidraw
     style) so the toolbars stay in reach. */
  @media (max-width: 540px) {
    .board-scroll {
      height: 50vh;
    }
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
  /* touch-action isn't inherited, so a touch starting ON a piece (or any inner
     element) would still scroll the page — pin it off across the whole svg. */
  .grid :global(*) {
    touch-action: none;
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
</style>
