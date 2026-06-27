<script lang="ts">
  import { OBJECT_DEFS } from './territory';
  import { octagon } from './geometry';
  import type { LayoutDiff, ChangeKind, DiffPiece } from './compare';

  // Read-only merged diff board: draws the "after" layout coloured by change kind,
  // plus ghosts for removed/moved pieces. Cropped to the changed region so the diff
  // fills the frame instead of floating in an empty 60×60 grid.
  interface Props {
    diff: LayoutDiff;
    objName: (i18nKey: string) => string;
  }
  let { diff, objName }: Props = $props();

  const COLORS: Record<ChangeKind, string> = {
    added: '#4ade80',
    removed: '#fb7185',
    moved: '#fbbf24',
    changed: '#60a5fa',
    unchanged: '#64748b'
  };

  // Bounding box over every drawn cell (incl. old positions of moved pieces).
  const vb = $derived.by(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of diff.pieces) {
      const d = OBJECT_DEFS[p.o.type];
      const fx = p.from?.x ?? p.o.x;
      const fy = p.from?.y ?? p.o.y;
      minX = Math.min(minX, p.o.x, fx);
      minY = Math.min(minY, p.o.y, fy);
      maxX = Math.max(maxX, p.o.x + d.w, fx + d.w);
      maxY = Math.max(maxY, p.o.y + d.h, fy + d.h);
    }
    if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 60, h: 60 };
    const pad = 2;
    const x = Math.max(0, minX - pad);
    const y = Math.max(0, minY - pad);
    return { x, y, w: Math.min(60, maxX + pad) - x, h: Math.min(60, maxY + pad) - y };
  });

  // Draw unchanged underneath; changes (esp. added) on top.
  const ORDER: ChangeKind[] = ['unchanged', 'removed', 'changed', 'moved', 'added'];
  const sorted = $derived(
    [...diff.pieces].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
  );
  const fontSize = $derived(Math.max(0.7, Math.min(1.8, vb.w / 34)));
  const labelOf = (p: DiffPiece) =>
    p.label || `${objName(OBJECT_DEFS[p.o.type].i18n)} ${p.o.x},${p.o.y}`;
</script>

<svg
  class="cb"
  viewBox="{vb.x} {vb.y} {vb.w} {vb.h}"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="diff"
>
  <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="var(--bg-soft)" />
  {#each sorted as p (p.o.id + '_' + p.kind)}
    {@const d = OBJECT_DEFS[p.o.type]}
    {@const c = COLORS[p.kind]}
    {@const dim = p.kind === 'unchanged'}
    {#if p.from}
      <rect
        x={p.from.x + 0.1}
        y={p.from.y + 0.1}
        width={d.w - 0.2}
        height={d.h - 0.2}
        rx="0.2"
        fill="none"
        stroke={c}
        stroke-width="0.1"
        stroke-dasharray="0.4 0.3"
        opacity="0.55"
      />
      <line
        x1={p.from.x + d.w / 2}
        y1={p.from.y + d.h / 2}
        x2={p.o.x + d.w / 2}
        y2={p.o.y + d.h / 2}
        stroke={c}
        stroke-width="0.09"
        stroke-dasharray="0.3 0.2"
        opacity="0.55"
      />
    {/if}
    {#if p.o.type === 'bearTrap'}
      <polygon
        points={octagon(p.o.x + 0.1, p.o.y + 0.1, p.o.x + d.w - 0.1, p.o.y + d.h - 0.1)}
        fill={c}
        fill-opacity={dim ? 0.12 : 0.82}
        stroke={c}
        stroke-width="0.12"
        stroke-dasharray={p.kind === 'removed' ? '0.4 0.3' : undefined}
        stroke-linejoin="round"
      />
    {:else}
      <rect
        x={p.o.x + 0.1}
        y={p.o.y + 0.1}
        width={d.w - 0.2}
        height={d.h - 0.2}
        rx="0.2"
        fill={c}
        fill-opacity={dim ? 0.12 : 0.82}
        stroke={c}
        stroke-width="0.12"
        stroke-dasharray={p.kind === 'removed' ? '0.4 0.3' : undefined}
      />
    {/if}
  {/each}
  {#each sorted as p (p.o.id + '_lbl')}
    {#if p.kind !== 'unchanged'}
      {@const d = OBJECT_DEFS[p.o.type]}
      <text
        class="cb-label"
        x={p.o.x + d.w / 2}
        y={p.o.y + d.h / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={fontSize}>{labelOf(p)}</text
      >
    {/if}
  {/each}
</svg>

<style>
  .cb {
    width: 100%;
    height: auto;
    display: block;
    border-radius: var(--r-card);
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .cb-label {
    fill: #fff;
    font-family: var(--font-mono);
    font-weight: 600;
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.72);
    stroke-width: 0.07;
    stroke-linejoin: round;
  }
</style>
