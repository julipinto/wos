<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    OBJECT_DEFS,
    computeTerritory,
    footprintCells,
    coverageCells,
    collides,
    type PlacedObject
  } from './territory';
  import type { PeerState } from './collab';

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
    highlight: string;
    viewport?: { x: number; y: number; w: number; h: number };
    peers?: PeerState[];
    onContextMenu?: (id: string, x: number, y: number) => void;
    onCursor?: (p: { x: number; y: number } | null) => void;
    onLiveSync?: () => void;
    onPersist: () => void;
  }
  let {
    objects,
    selectedIds = $bindable(),
    bearFocus = $bindable(),
    view,
    zoom = $bindable(),
    boardMode,
    tool,
    showLabels,
    labelField,
    heatmap,
    connectivity,
    highlight,
    viewport = $bindable(),
    peers = [],
    onContextMenu,
    onCursor,
    onLiveSync,
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
  // Crop the iso viewBox to the diamond's bounds (drops the empty bands). Keep the
  // numeric box too, so the HTML label overlay can map grid points → % positions.
  const ISO_VB = (() => {
    const pts = [isoPoint(0, 0), isoPoint(N, 0), isoPoint(0, N), isoPoint(N, N)];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX - 1,
      y: minY - 1,
      w: Math.max(...xs) - minX + 2,
      h: Math.max(...ys) - minY + 2
    };
  })();
  const ISO_VIEWBOX = `${ISO_VB.x} ${ISO_VB.y} ${ISO_VB.w} ${ISO_VB.h}`;
  const viewBox = $derived(view === 'iso' ? ISO_VIEWBOX : `0 0 ${N} ${N}`);

  // Map an object's centre to a percent position inside the board box, view-aware
  // (the overlay div fills the same box the SVG renders into). Labels are HTML so
  // they get a constant, readable font size + a chip — never shrinking with zoom.
  // Map a continuous grid point → percent inside the board box (view-aware). Used
  // by labels and by remote peer cursors (both are HTML over the board).
  function gridToPct(gx: number, gy: number): { left: number; top: number } {
    if (view === 'iso') {
      const p = isoPoint(gx, gy);
      return {
        left: ((p.x - ISO_VB.x) / ISO_VB.w) * 100,
        top: ((p.y - ISO_VB.y) / ISO_VB.h) * 100
      };
    }
    return { left: (gx / N) * 100, top: (gy / N) * 100 };
  }
  function labelPos(o: PlacedObject): { left: number; top: number } {
    const def = OBJECT_DEFS[o.type];
    return gridToPct(o.x + def.w / 2, o.y + def.h / 2);
  }
  // Octagon inscribed in a rect — bear traps render as octagons (game icon shape).
  function octagon(x0: number, y0: number, x1: number, y1: number): string {
    const c = Math.min(x1 - x0, y1 - y0) * 0.29;
    return [
      [x0 + c, y0],
      [x1 - c, y0],
      [x1, y0 + c],
      [x1, y1 - c],
      [x1 - c, y1],
      [x0 + c, y1],
      [x0, y1 - c],
      [x0, y0 + c]
    ]
      .map((p) => p.join(','))
      .join(' ');
  }
  // Other peers' selections → coloured halos (rendered in the transformed plane).
  const remoteSel = $derived.by(() => {
    const out: { key: string; color: string; x: number; y: number; w: number; h: number }[] = [];
    for (const p of peers) {
      if (p.self || !p.selection) continue;
      for (const id of p.selection) {
        const o = objects.find((x) => x.id === id);
        if (!o) continue;
        const d = OBJECT_DEFS[o.type];
        out.push({ key: `${p.id}_${id}`, color: p.color, x: o.x, y: o.y, w: d.w, h: d.h });
      }
    }
    return out;
  });
  // Other peers' live cursors (self excluded), positioned over the board.
  const remoteCursors = $derived(peers.filter((p) => !p.self && p.cursor));
  // Label font must be PROPORTIONAL to the rendered cell, not a fixed px size —
  // otherwise on a 60×60 board (tiny cells) the text dwarfs the grid. We measure
  // the board's pixel width and derive cell px = boardPx/60 · zoom (× an iso
  // squash factor), then font = clamp(min, 0.45·cell, max). Mirrors wostools.
  let scrollerW = $state(0);
  const cellPx = $derived(((scrollerW || 600) * zoom * (view === 'iso' ? 0.62 : 1)) / N);
  const labelFont = $derived(Math.max(7, Math.min(16, 0.45 * cellPx)));
  // Which objects get a label, precomputed (name/furnace + optional sub-label).
  const labelled = $derived.by(() => {
    if (!showLabels) return [];
    return objects
      .map((o) => {
        const primary = o.type === 'bearTrap' ? o.name : labelField === 'name' ? o.name : o.furnace;
        return { o, primary, sub: o.label };
      })
      .filter((l) => l.primary || l.sub);
  });

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
  // A short pulse ring drawn where search/go-to last centred the view.
  let flash = $state<{ x: number; y: number; n: number } | null>(null);
  let flashN = 0;
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  // The cell under the cursor — drives the crosshair + the live coordinate badge.
  let hoverCell = $state<{ x: number; y: number } | null>(null);
  // Id of the object being dragged (reactive) → drives the alignment guides.
  let activeDrag = $state<string | null>(null);
  // Smart guides: while dragging one object, draw a line wherever its left/centre/
  // right edge lines up with another object's edge — Figma-style alignment hints.
  const guides = $derived.by(() => {
    if (!activeDrag) return { v: [], h: [] };
    const o = objects.find((p) => p.id === activeDrag);
    if (!o) return { v: [], h: [] };
    const d = OBJECT_DEFS[o.type];
    const myX = [o.x, o.x + d.w / 2, o.x + d.w];
    const myY = [o.y, o.y + d.h / 2, o.y + d.h];
    const v = new Set<number>();
    const h = new Set<number>();
    for (const p of objects) {
      if (p.id === o.id) continue;
      const pd = OBJECT_DEFS[p.type];
      for (const ex of [p.x, p.x + pd.w / 2, p.x + pd.w]) if (myX.includes(ex)) v.add(ex);
      for (const ey of [p.y, p.y + pd.h / 2, p.y + pd.h]) if (myY.includes(ey)) h.add(ey);
    }
    return { v: [...v], h: [...h] };
  });
  // Coordinate badge text: prefer the hovered cell, else the single selection.
  const readout = $derived.by(() => {
    if (hoverCell) return `${hoverCell.x},${hoverCell.y}`;
    if (selectedIds.length === 1) {
      const o = objects.find((p) => p.id === selectedIds[0]);
      if (o) return `${o.x},${o.y}`;
    }
    return null;
  });
  // Two-finger pan: tracks live pointers so a second finger pans the board even
  // in Edit mode (where one finger places / marquee-selects).
  const pointers = new Map<number, { x: number; y: number }>();
  // Pinch state: the last applied midpoint + finger distance, so each move zooms
  // (distance ratio, anchored at the midpoint) and pans (midpoint travel) at once.
  let twoPan: { dist: number; mx: number; my: number } | null = null;
  let pinchBusy = false;
  const midpoint = () => {
    const p = [...pointers.values()];
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
  };
  const pointDist = () => {
    const p = [...pointers.values()];
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  };

  function startPan(e: PointerEvent) {
    pan = scroller
      ? { cx: e.clientX, cy: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop }
      : null;
  }

  // Throttle collab broadcasts to one per animation frame so a fast drag / move
  // doesn't flood awareness updates.
  let cursorPending: { x: number; y: number } | null = null;
  let cursorScheduled = false;
  function queueCursor(p: { x: number; y: number } | null) {
    if (!onCursor) return;
    cursorPending = p;
    if (cursorScheduled) return;
    cursorScheduled = true;
    requestAnimationFrame(() => {
      cursorScheduled = false;
      onCursor?.(cursorPending);
    });
  }
  let syncScheduled = false;
  function queueSync() {
    if (!onLiveSync || syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      onLiveSync?.();
    });
  }

  // ── Zoom (wheel-to-cursor / pinch / fit) ────────────────────────────────
  // The board is a square 60×60 that's often taller than the (62vh) viewport,
  // so the floor goes below 100% to let the whole hive fit on screen at once;
  // the ceiling goes higher for fine single-cell work. Keep in sync with Controls.
  const MINZ = 0.35;
  const MAXZ = 8;
  /** Zoom keeping the point under (clientX,clientY) fixed. Content scales by an
   *  exact ratio, so the new scroll is pure math (applied once width relays). */
  async function zoomAt(target: number, clientX: number, clientY: number) {
    if (!scroller) return;
    const next = Math.min(MAXZ, Math.max(MINZ, +target.toFixed(2)));
    if (next === zoom) return;
    const rect = scroller.getBoundingClientRect();
    const ax = clientX - rect.left;
    const ay = clientY - rect.top;
    const beforeX = scroller.scrollLeft + ax;
    const beforeY = scroller.scrollTop + ay;
    const ratio = next / zoom;
    zoom = next;
    await tick();
    if (!scroller) return;
    scroller.scrollLeft = beforeX * ratio - ax;
    scroller.scrollTop = beforeY * ratio - ay;
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    zoomAt(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  }
  /** Two-finger gesture: zoom by the finger-distance ratio (anchored at the
   *  midpoint) and pan by the midpoint's travel, in one combined step. Guarded
   *  so overlapping moves don't fight the post-relayout scroll correction. */
  async function pinchMove() {
    if (pinchBusy || !twoPan || !scroller) return;
    pinchBusy = true;
    const m = midpoint();
    const dist = pointDist();
    const rect = scroller.getBoundingClientRect();
    const target = Math.min(MAXZ, Math.max(MINZ, +(zoom * (dist / (twoPan.dist || 1))).toFixed(3)));
    const r = target / zoom;
    const ax = m.x - rect.left;
    const ay = m.y - rect.top;
    const nextLeft = (scroller.scrollLeft + ax) * r - ax - (m.x - twoPan.mx);
    const nextTop = (scroller.scrollTop + ay) * r - ay - (m.y - twoPan.my);
    twoPan = { dist, mx: m.x, my: m.y };
    if (target !== zoom) {
      zoom = target;
      await tick();
    }
    if (scroller) {
      scroller.scrollLeft = nextLeft;
      scroller.scrollTop = nextTop;
    }
    pinchBusy = false;
  }

  /** Fit the placed objects into view — uses the live CTM so it works in iso too.
   *  Exported so the page can auto-frame the hive after a load / import / mode switch. */
  export async function fit() {
    if (!scroller) return;
    if (!objects.length || !plane) {
      scroller.scrollLeft = 0;
      scroller.scrollTop = 0;
      return;
    }
    const ctm = plane.getScreenCTM();
    if (!ctm) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const o of objects) {
      const def = OBJECT_DEFS[o.type];
      minX = Math.min(minX, o.x);
      minY = Math.min(minY, o.y);
      maxX = Math.max(maxX, o.x + def.w);
      maxY = Math.max(maxY, o.y + def.h);
    }
    const pts = [
      [minX, minY],
      [maxX, minY],
      [minX, maxY],
      [maxX, maxY]
    ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(ctm));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const sw = Math.max(...xs) - Math.min(...xs) || 1;
    const sh = Math.max(...ys) - Math.min(...ys) || 1;
    const rect = scroller.getBoundingClientRect();
    const scale = Math.min((rect.width * 0.85) / sw, (rect.height * 0.85) / sh);
    const next = Math.min(MAXZ, Math.max(MINZ, +(zoom * scale).toFixed(2)));
    const ratio = next / zoom;
    const contentCx = scroller.scrollLeft + ((Math.min(...xs) + Math.max(...xs)) / 2 - rect.left);
    const contentCy = scroller.scrollTop + ((Math.min(...ys) + Math.max(...ys)) / 2 - rect.top);
    zoom = next;
    await tick();
    if (!scroller) return;
    scroller.scrollLeft = contentCx * ratio - rect.width / 2;
    scroller.scrollTop = contentCy * ratio - rect.height / 2;
  }

  /** Centre the viewport on grid point (cx,cy) and pulse a ring there. Accepts
   *  continuous coords so callers can pass an object's centre or a cell centre.
   *  Exported → the page calls it from the search box. Works in iso (uses CTM). */
  export function focusCell(cx: number, cy: number) {
    if (!scroller || !plane) return;
    const ctm = plane.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(cx, cy).matrixTransform(ctm);
    const rect = scroller.getBoundingClientRect();
    scroller.scrollLeft += p.x - rect.left - rect.width / 2;
    scroller.scrollTop += p.y - rect.top - rect.height / 2;
    flash = { x: cx, y: cy, n: ++flashN };
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = null), 1300);
  }

  // Report the visible grid region (for the minimap). Maps the scroller's screen
  // corners back through the plane CTM and takes the bounding box (in iso the
  // visible area is a diamond, so the box is a safe over-approximation).
  function computeViewport() {
    if (!scroller || !plane || viewport === undefined) return;
    const ctm = plane.getScreenCTM();
    if (!ctm) return;
    const r = scroller.getBoundingClientRect();
    const inv = ctm.inverse();
    const corners = [
      [r.left, r.top],
      [r.right, r.top],
      [r.left, r.bottom],
      [r.right, r.bottom]
    ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(inv));
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    const x = Math.max(0, Math.min(...xs));
    const y = Math.max(0, Math.min(...ys));
    viewport = {
      x,
      y,
      w: Math.min(N, Math.max(...xs)) - x,
      h: Math.min(N, Math.max(...ys)) - y
    };
  }

  onMount(() => {
    const el = scroller;
    const wheel = (e: WheelEvent) => onWheel(e);
    el?.addEventListener('wheel', wheel, { passive: false });
    const onScroll = () => computeViewport();
    el?.addEventListener('scroll', onScroll, { passive: true });
    // Track the board's pixel width so label fonts stay proportional to the cells.
    const measure = () => (scrollerW = el?.clientWidth ?? 0);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    // Land framed on the hive (not the empty 60×60) once layout settles.
    requestAnimationFrame(() => {
      if (objects.length) fit();
      computeViewport();
    });
    return () => {
      el?.removeEventListener('wheel', wheel);
      el?.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  });
  // Recompute the viewport whenever zoom or view changes the projection (reading
  // both inside the condition is what registers them as effect dependencies).
  $effect(() => {
    if (zoom && view) tick().then(computeViewport);
  });
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
        twoPan = { dist: pointDist(), mx: m.x, my: m.y };
      }
      e.preventDefault();
      return;
    }
    // Middle-mouse drag pans from any mode (so Edit doesn't have to switch tools).
    if (e.button === 1) {
      moved = false;
      dragId = pendingPlace = null;
      group = null;
      marquee = null;
      startPan(e);
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
      } else {
        activeDrag = hit.id; // single-object move → show alignment guides
      }
    } else {
      pendingPlace = { x, y };
      marquee = { x0: x, y0: y, x1: x, y1: y }; // edit-mode drag = marquee
    }
  }
  function onPointerMove(e: PointerEvent) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Track the hovered cell for the crosshair + coordinate badge, and broadcast
    // the live cursor to peers (mouse only; touch has no hover).
    if (e.pointerType !== 'touch') {
      const pt = pointFromEvent(e);
      const inBounds = !!pt && pt.x >= 0 && pt.y >= 0 && pt.x < N && pt.y < N;
      hoverCell = inBounds ? { x: Math.floor(pt!.x), y: Math.floor(pt!.y) } : null;
      queueCursor(inBounds ? { x: pt!.x, y: pt!.y } : null);
    }
    // Two-finger gesture (any mode): combined pinch-zoom + pan.
    if (twoPan && scroller && pointers.size >= 2) {
      e.preventDefault();
      pinchMove();
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
        if (moved) queueSync();
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
        queueSync();
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
    activeDrag = null;
  }

  // Right-click an object → the page opens a context menu (duplicate / remove).
  function onContext(e: MouseEvent) {
    const cell = cellFromEvent(e);
    if (!cell) return;
    const hit = objects.find((o) => footprintCells(o).includes(`${cell.x},${cell.y}`));
    if (hit) {
      e.preventDefault();
      onContextMenu?.(hit.id, e.clientX, e.clientY);
    }
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
  // Highlight filter (rail): '' = off, 'orphaned' = unconnected banners, else a type.
  function hiOk(o: PlacedObject): boolean {
    if (!highlight) return true;
    if (highlight === 'orphaned') return territory.orphaned.has(o.id);
    return o.type === highlight;
  }
</script>

<div class="board-wrap">
  <button class="fit-btn" type="button" onclick={fit} title="Fit" aria-label="Fit">⊡</button>
  {#if readout}
    <span class="coord-badge">{readout}</span>
  {/if}
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
        onpointerleave={() => {
          hoverCell = null;
          queueCursor(null);
        }}
        oncontextmenu={onContext}
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
            {@const lit = inFocus(o) && hiOk(o)}
            {@const fillC = heatmap ? heatColor(o.power) : def.color}
            {@const fillO = !lit ? 0.12 : orphan && !heatmap ? 0.25 : 0.85}
            {@const strokeC = sel
              ? '#ffffff'
              : bearFocus > 0 && lit && o.type === 'bearTrap'
                ? '#fbbf24'
                : orphan
                  ? '#fb7185'
                  : 'rgba(0,0,0,0.3)'}
            {@const strokeW = sel
              ? 0.16
              : bearFocus > 0 && lit && o.type === 'bearTrap'
                ? 0.18
                : orphan
                  ? 0.12
                  : 0.05}
            {#if o.type === 'bearTrap'}
              <polygon
                class="obj"
                points={octagon(o.x + 0.08, o.y + 0.08, o.x + def.w - 0.08, o.y + def.h - 0.08)}
                fill={fillC}
                fill-opacity={fillO}
                stroke={strokeC}
                stroke-width={strokeW}
                stroke-linejoin="round"
              />
            {:else}
              <rect
                class="obj"
                x={o.x + 0.08}
                y={o.y + 0.08}
                width={def.w - 0.16}
                height={def.h - 0.16}
                rx="0.18"
                fill={fillC}
                fill-opacity={fillO}
                stroke={strokeC}
                stroke-width={strokeW}
              />
            {/if}
          {/each}
          {#if hoverCell && boardMode === 'edit'}
            <rect class="hover" x={hoverCell.x} y={hoverCell.y} width="1" height="1" />
          {/if}
          {#each guides.v as gx (gx)}
            <line class="guide" x1={gx} y1="0" x2={gx} y2={N} />
          {/each}
          {#each guides.h as gy (gy)}
            <line class="guide" x1="0" y1={gy} x2={N} y2={gy} />
          {/each}
          {#each remoteSel as r (r.key)}
            <rect
              class="remote-sel"
              x={r.x - 0.04}
              y={r.y - 0.04}
              width={r.w + 0.08}
              height={r.h + 0.08}
              rx="0.18"
              style="stroke: {r.color}"
            />
          {/each}
          {#if flash}
            {#key flash.n}
              <rect
                class="flash"
                x={flash.x - 1.5}
                y={flash.y - 1.5}
                width="3"
                height="3"
                rx="0.3"
              />
            {/key}
          {/if}
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
      <!-- Labels are HTML over the board (not SVG text) so they stay a constant,
         readable size with a contrast chip — never shrinking into the grid. -->
      {#if showLabels}
        <div class="label-layer" style="font-size: {labelFont}px">
          {#each labelled as l (l.o.id)}
            {@const pos = labelPos(l.o)}
            {@const bear = l.o.type === 'bearTrap'}
            <div class="tile-label" class:bear style="left: {pos.left}%; top: {pos.top}%">
              {#if l.primary}<span class="tl-name">{l.primary}</span>{/if}
              {#if l.sub}<span class="tl-sub">{l.sub}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
      {#if remoteCursors.length}
        <div class="cursor-layer">
          {#each remoteCursors as p (p.id)}
            {@const c = gridToPct(p.cursor!.x, p.cursor!.y)}
            <div class="remote-cursor" style="left: {c.left}%; top: {c.top}%; --pc: {p.color}">
              <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true">
                <path d="M1 1 L1 10 L4 7.5 L6 11 L7.5 10.2 L5.6 6.8 L9.5 6.6 Z" fill={p.color} />
              </svg>
              <span class="rc-name" style="background: {p.color}">{p.name}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .board-wrap {
    position: relative;
  }
  .fit-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 5;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-mid);
    font-size: 16px;
    cursor: pointer;
  }
  .fit-btn:hover {
    color: var(--accent);
    border-color: var(--border-accent);
  }
  /* Live coordinate readout — bottom-left, like a map's cursor position. */
  .coord-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    z-index: 5;
    padding: 3px 8px;
    background: rgba(15, 25, 40, 0.92);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    pointer-events: none;
  }
  .board-scroll {
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    /* the board is square, so cap its height (it'd be as tall as it is wide on
       desktop) and let it scroll within. */
    height: 62vh;
    /* Hide the scrollbars — panning is by drag / two-finger / wheel, so the bars
       are just visual noise on the canvas. (Firefox / IE / WebKit.) */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .board-scroll::-webkit-scrollbar {
    display: none;
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
    position: relative;
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
  .hover {
    fill: rgba(147, 212, 255, 0.12);
    stroke: rgba(147, 212, 255, 0.6);
    stroke-width: 0.06;
    pointer-events: none;
  }
  .guide {
    stroke: #f472b6;
    stroke-width: 0.05;
    stroke-dasharray: 0.4 0.3;
    pointer-events: none;
  }
  .remote-sel {
    fill: none;
    stroke-width: 0.14;
    opacity: 0.9;
    pointer-events: none;
  }
  .flash {
    fill: none;
    stroke: #fbbf24;
    pointer-events: none;
    animation: flash-pulse 1.3s ease-out forwards;
  }
  @keyframes flash-pulse {
    0% {
      opacity: 0;
      stroke-width: 0.45;
    }
    15% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      stroke-width: 0.1;
    }
  }
  /* HTML label overlay — fills the same box the SVG renders into. */
  .label-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  }
  /* Remote peer cursors live in their own overlay, above the labels. */
  .cursor-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 7;
  }
  .remote-cursor {
    position: absolute;
    transform: translate(-2px, -2px);
    transition:
      left 0.08s linear,
      top 0.08s linear;
    will-change: left, top;
  }
  .remote-cursor svg {
    display: block;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
  .rc-name {
    position: absolute;
    left: 12px;
    top: 10px;
    padding: 1px 6px;
    border-radius: 6px;
    color: #0b1220;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
  .tile-label {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    line-height: 1.1;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-weight: 700;
  }
  /* bears centre a number, so push their text below it */
  .tile-label.bear {
    transform: translate(-50%, 6%);
  }
  /* Outline (not a solid chip) so dense labels stay legible where they overlap —
     the wostools look. Multi-directional text-shadow fakes a crisp stroke. */
  .tl-name,
  .tl-sub {
    text-shadow:
      0 0 2px rgba(0, 0, 0, 0.95),
      1px 1px 1.5px rgba(0, 0, 0, 0.9),
      -1px -1px 1.5px rgba(0, 0, 0, 0.9),
      1px -1px 1.5px rgba(0, 0, 0, 0.9),
      -1px 1px 1.5px rgba(0, 0, 0, 0.9);
  }
  .tl-name {
    color: #fff;
  }
  .tl-sub {
    color: #fbbf24;
    font-size: 0.85em;
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
