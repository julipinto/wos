<script lang="ts">
  import { OBJECT_DEFS, type PlacedObject } from './territory';

  // A small overview map of the 60×60 board: draws every object as a tiny
  // coloured block and a draggable viewport rectangle over them. Click or drag
  // anywhere to recentre the main board (the parent jumps via `onJump`); the
  // rectangle's position is bindable so the parent can keep it in sync.
  interface Props {
    objects: PlacedObject[];
    viewport: { x: number; y: number; w: number; h: number };
    onJump: (cx: number, cy: number) => void;
  }
  let { objects, viewport = $bindable(), onJump }: Props = $props();

  const N = 60; // grid is N×N cells (matches the main board)

  let svg: SVGSVGElement | undefined = $state();
  let dragging = $state(false);

  // Visually clamp the viewport rect to the 0..N range so it never spills out.
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const vx = $derived(clamp(viewport.x, 0, N));
  const vy = $derived(clamp(viewport.y, 0, N));
  const vw = $derived(clamp(viewport.w, 0, N - vx));
  const vh = $derived(clamp(viewport.h, 0, N - vy));

  // Invert the SVG CTM to turn a screen point into grid coords.
  function gridFromEvent(e: PointerEvent): { x: number; y: number } | null {
    const ctm = svg?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function jumpTo(e: PointerEvent) {
    const p = gridFromEvent(e);
    if (p) onJump(p.x, p.y); // pointer position becomes the new view CENTRE
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    svg?.setPointerCapture(e.pointerId);
    jumpTo(e);
  }
  function onPointerMove(e: PointerEvent) {
    if (dragging) jumpTo(e);
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false;
    svg?.releasePointerCapture?.(e.pointerId);
  }
</script>

<svg
  bind:this={svg}
  class="minimap"
  viewBox="0 0 {N} {N}"
  role="application"
  aria-label="minimap"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <rect width={N} height={N} fill="var(--bg-soft)" />
  {#each objects as o (o.id)}
    {@const def = OBJECT_DEFS[o.type]}
    <rect x={o.x} y={o.y} width={def.w} height={def.h} fill={def.color} fill-opacity="0.85" />
  {/each}
  <rect
    class="viewport"
    x={vx}
    y={vy}
    width={vw}
    height={vh}
    fill="rgba(147,212,255,0.12)"
    stroke="var(--border-accent)"
  />
</svg>

<style>
  .minimap {
    display: block;
    width: 120px;
    height: 120px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    touch-action: none;
    cursor: pointer;
  }
  .viewport {
    stroke-width: 0.4;
    pointer-events: none;
  }
</style>
