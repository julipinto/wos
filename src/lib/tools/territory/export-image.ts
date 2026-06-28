// Render a hive layout to a canvas (for PNG export + the export dialog preview).
// A dedicated, configurable draw pass (NOT a screenshot of the live SVG) so we
// control resolution and can include labels, legend, title and the balance table.
// Supports a top-down (flat) view and an isometric (iso) projection; flat reads
// best for a printable reference, iso matches how the planner looks on screen.
import { OBJECT_DEFS, computeTerritory, coverageCells, type PlacedObject } from './territory';

const N = 60;
const TRAP_COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee'];
const trapColor = (n: number) => TRAP_COLORS[(n - 1) % TRAP_COLORS.length];

export interface ImageOpts {
  labels: boolean;
  ids: boolean;
  coverage: boolean;
  grid: boolean;
  legend: boolean;
  table: boolean;
  colorByPrimary: boolean;
  title: string;
  background: 'dark' | 'light';
  crop: 'hive' | 'grid';
  /** top-down (flat) or isometric (iso). Default flat. */
  view?: 'flat' | 'iso';
  cellPx: number;
  connectivity: boolean;
  /** localised type name for the legend */
  typeName: (type: string) => string;
}

interface Theme {
  bg: string;
  text: string;
  dim: string;
  grid: string;
  outline: string;
}
const THEMES: Record<'dark' | 'light', Theme> = {
  dark: {
    bg: '#0b1220',
    text: '#e5e7eb',
    dim: '#94a3b8',
    grid: 'rgba(255,255,255,0.08)',
    outline: 'rgba(0,0,0,0.85)'
  },
  light: {
    bg: '#ffffff',
    text: '#1f2937',
    dim: '#6b7280',
    grid: 'rgba(0,0,0,0.12)',
    outline: 'rgba(255,255,255,0.9)'
  }
};

const cityPrimary = (o: PlacedObject) =>
  o.bearMain?.length ? trapColor(o.bearMain[0]) : '#64748b';

function octagonPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const c = s * 0.29;
  const pts: [number, number][] = [
    [x + c, y],
    [x + s - c, y],
    [x + s, y + c],
    [x + s, y + s - c],
    [x + s - c, y + s],
    [x + c, y + s],
    [x, y + s - c],
    [x, y + c]
  ];
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
}

/** Draw the hive onto `canvas`, sizing it to fit. Returns nothing. */
export function renderHive(canvas: HTMLCanvasElement, objects: PlacedObject[], opts: ImageOpts) {
  const t = THEMES[opts.background];
  const cell = opts.cellPx;
  const pad = Math.round(cell * 0.6);
  const gap = Math.round(cell * 0.5);

  // Region to draw (whole grid, or the objects' bounding box + 1-cell margin).
  let minX = 0;
  let minY = 0;
  let maxX = N;
  let maxY = N;
  if (opts.crop === 'hive' && objects.length) {
    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;
    for (const o of objects) {
      const d = OBJECT_DEFS[o.type];
      minX = Math.min(minX, o.x);
      minY = Math.min(minY, o.y);
      maxX = Math.max(maxX, o.x + d.w);
      maxY = Math.max(maxY, o.y + d.h);
    }
    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(N, maxX + 1);
    maxY = Math.min(N, maxY + 1);
  }
  const cols = Math.max(1, maxX - minX);
  const rows = Math.max(1, maxY - minY);
  // Iso projection: a cell becomes a rhombus and the board a squashed diamond.
  const iso = opts.view === 'iso';
  const isoHW = cell * 0.5; // half-width per cell step
  const isoHH = cell * 0.28; // half-height per cell step (vertical squash)
  const boardW = iso ? (cols + rows) * isoHW : cols * cell;
  const boardH = iso ? (cols + rows) * isoHH : rows * cell;
  // Board-local projection of a grid point (relative to the board origin).
  const projX = (x: number, y: number) =>
    iso ? (x - minX - (y - minY)) * isoHW + rows * isoHW : (x - minX) * cell;
  const projY = (x: number, y: number) =>
    iso ? (x - minX + (y - minY)) * isoHH : (y - minY) * cell;

  // Bear traps numbered by placement order; balance tally per trap.
  const traps = objects.filter((o) => o.type === 'bearTrap');
  const trapNo = new Map(traps.map((o, i) => [o.id, i + 1]));
  const tally = traps.map((_, i) => {
    const n = i + 1;
    let main = 0;
    let backup = 0;
    for (const o of objects) {
      if (o.type !== 'city' || !o.bear?.includes(n)) continue;
      if (o.bearMain?.includes(n)) main++;
      else backup++;
    }
    return { n, main, backup };
  });

  // Legend entries. When colouring by primary trap, cities are shown as the per-
  // trap colours (not the generic "city" swatch) so the legend matches the board.
  const typesPresent = [...new Set(objects.map((o) => o.type))];
  const byTrap = opts.colorByPrimary && traps.length > 0;
  const legendEntries: { color: string; label: string }[] = [];
  for (const ty of typesPresent) {
    // When colouring by trap, cities + traps show as the per-trap 🐻 swatches.
    if (byTrap && (ty === 'city' || ty === 'bearTrap')) continue;
    legendEntries.push({
      color: OBJECT_DEFS[ty].color,
      label: opts.typeName(OBJECT_DEFS[ty].i18n)
    });
  }
  if (byTrap) {
    for (let n = 1; n <= traps.length; n++)
      legendEntries.push({ color: trapColor(n), label: `🐻 ${n}` });
    legendEntries.push({ color: '#64748b', label: '—' });
  }
  if (opts.connectivity)
    legendEntries.push(
      { color: 'rgba(147,212,255,0.6)', label: 'territory' },
      { color: 'rgba(251,191,36,0.6)', label: 'coverage' }
    );

  const titleH = opts.title ? Math.round(cell * 1.4) : 0;
  const lineH = Math.round(cell * 0.7);
  const legendH =
    opts.legend && legendEntries.length ? Math.ceil(legendEntries.length / 3) * lineH + gap : 0;
  const tableH = opts.table && tally.length ? lineH + tally.length * lineH : 0;

  const W = boardW + pad * 2;
  const H =
    pad + titleH + boardH + (legendH ? gap + legendH : 0) + (tableH ? gap + tableH : 0) + pad;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Title
  if (opts.title) {
    ctx.fillStyle = t.text;
    ctx.font = `700 ${Math.round(cell * 0.7)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.title, pad, pad + titleH / 2);
  }

  // Board origin
  const ox = pad;
  const oy = pad + titleH;
  const gx = (x: number) => ox + (x - minX) * cell;
  const gy = (y: number) => oy + (y - minY) * cell;
  // Absolute screen position of a grid point (works in both views).
  const SX = (x: number, y: number) => ox + projX(x, y);
  const SY = (x: number, y: number) => oy + projY(x, y);
  // Footprint quad path (a rhombus in iso); used for iso fills.
  const quad = (x: number, y: number, w: number, h: number, i = 0) => {
    ctx.beginPath();
    ctx.moveTo(SX(x + i, y + i), SY(x + i, y + i));
    ctx.lineTo(SX(x + w - i, y + i), SY(x + w - i, y + i));
    ctx.lineTo(SX(x + w - i, y + h - i), SY(x + w - i, y + h - i));
    ctx.lineTo(SX(x + i, y + h - i), SY(x + i, y + h - i));
    ctx.closePath();
  };
  const cellFill = (x: number, y: number) => {
    if (iso) {
      quad(x, y, 1, 1);
      ctx.fill();
    } else ctx.fillRect(gx(x), gy(y), cell, cell);
  };

  // "Colour by primary trap" helpers (match the live board). Screen-x extent of a
  // footprint rect (for banded gradients) + a banded gradient builder.
  const xExtent = (x: number, y: number, w: number, h: number): [number, number] => {
    if (!iso) return [SX(x, y), SX(x + w, y)];
    const xs = [SX(x, y), SX(x + w, y), SX(x + w, y + h), SX(x, y + h)];
    return [Math.min(...xs), Math.max(...xs)];
  };
  const bandGradient = (lx: number, rx: number, traps: number[]): CanvasGradient => {
    const g = ctx.createLinearGradient(lx, 0, rx, 0);
    traps.forEach((tt, i) => {
      g.addColorStop(i / traps.length, trapColor(tt));
      g.addColorStop((i + 1) / traps.length, trapColor(tt));
    });
    return g;
  };
  const backupsOf = (o: PlacedObject) => {
    const main = new Set(o.bearMain ?? []);
    return (o.bear ?? []).filter((b) => !main.has(b));
  };
  const fillFor = (
    o: PlacedObject,
    dw: number,
    dh: number,
    color: string
  ): string | CanvasGradient => {
    if (!opts.colorByPrimary) return color;
    if (o.type === 'bearTrap') return trapColor(trapNo.get(o.id) ?? 1);
    if (o.type !== 'city') return color;
    const m = o.bearMain ?? [];
    if (m.length > 1) return bandGradient(...xExtent(o.x, o.y, dw, dh), m);
    return cityPrimary(o);
  };
  // Thin bottom strip = the city's secondary/backup trap colour(s).
  const drawBackupStrip = (o: PlacedObject, dw: number, dh: number) => {
    if (!opts.colorByPrimary || o.type !== 'city') return;
    const bk = backupsOf(o);
    if (!bk.length) return;
    const sx = o.x + 0.18;
    const sy = o.y + dh - 0.08 - 0.16;
    const sw = dw - 0.36;
    const sh = 0.16;
    ctx.fillStyle = bk.length > 1 ? bandGradient(...xExtent(sx, sy, sw, sh), bk) : trapColor(bk[0]);
    if (iso) {
      quad(sx, sy, sw, sh, 0);
      ctx.fill();
    } else {
      ctx.fillRect(gx(sx), gy(sy), sw * cell, sh * cell);
    }
  };

  // Floor
  ctx.fillStyle = opts.background === 'dark' ? '#0f172a' : '#f1f5f9';
  if (iso) {
    quad(minX, minY, cols, rows);
    ctx.fill();
  } else {
    ctx.fillRect(ox, oy, boardW, boardH);
  }

  // Coverage + connected territory tint
  if (opts.coverage && opts.connectivity) {
    const reach = new Set<string>();
    for (const o of objects)
      if (o.type === 'banner') for (const c of coverageCells(o)) reach.add(c);
    ctx.fillStyle = 'rgba(251,191,36,0.12)';
    for (const c of reach) {
      const [x, y] = c.split(',').map(Number);
      cellFill(x, y);
    }
    const terr = computeTerritory(objects);
    ctx.fillStyle = 'rgba(147,212,255,0.18)';
    for (const c of terr.cells) {
      const [x, y] = c.split(',').map(Number);
      cellFill(x, y);
    }
  }

  // Grid + coordinates
  if (opts.grid) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (iso) {
      for (let x = minX; x <= maxX; x++) {
        ctx.moveTo(SX(x, minY), SY(x, minY));
        ctx.lineTo(SX(x, maxY), SY(x, maxY));
      }
      for (let y = minY; y <= maxY; y++) {
        ctx.moveTo(SX(minX, y), SY(minX, y));
        ctx.lineTo(SX(maxX, y), SY(maxX, y));
      }
      ctx.stroke();
    } else {
      for (let x = minX; x <= maxX; x++) {
        ctx.moveTo(gx(x), oy);
        ctx.lineTo(gx(x), oy + boardH);
      }
      for (let y = minY; y <= maxY; y++) {
        ctx.moveTo(ox, gy(y));
        ctx.lineTo(ox + boardW, gy(y));
      }
      ctx.stroke();
      // Coordinate ticks only make sense on the axis-aligned flat grid.
      ctx.fillStyle = t.dim;
      ctx.font = `${Math.round(cell * 0.32)}px sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'center';
      for (let x = minX; x <= maxX; x++) if (x % 5 === 0) ctx.fillText(String(x), gx(x), oy - 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = minY; y <= maxY; y++) if (y % 5 === 0) ctx.fillText(String(y), ox - 3, gy(y));
    }
  }

  // Objects
  for (const o of objects) {
    const d = OBJECT_DEFS[o.type];
    ctx.fillStyle = fillFor(o, d.w, d.h, d.color);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, cell * 0.04);
    if (iso) {
      // Footprint rhombus (no rounding/octagon — the iso shape reads on its own).
      quad(o.x, o.y, d.w, d.h, 0.06);
      ctx.fill();
      ctx.stroke();
    } else if (o.type === 'bearTrap') {
      octagonPath(ctx, gx(o.x) + cell * 0.08, gy(o.y) + cell * 0.08, d.w * cell - cell * 0.16);
      ctx.fill();
      ctx.stroke();
    } else {
      roundRect(
        ctx,
        gx(o.x) + cell * 0.08,
        gy(o.y) + cell * 0.08,
        d.w * cell - cell * 0.16,
        d.h * cell - cell * 0.16,
        cell * 0.18
      );
      ctx.fill();
      ctx.stroke();
    }
    drawBackupStrip(o, d.w, d.h);
    // Bear-trap number — upright, at the projected footprint centre (both views).
    if (o.type === 'bearTrap') {
      const cx = SX(o.x + d.w / 2, o.y + d.h / 2);
      const cy = SY(o.x + d.w / 2, o.y + d.h / 2);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = Math.max(2, cell * 0.06);
      ctx.font = `800 ${Math.round(cell * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nstr = String(trapNo.get(o.id) ?? '');
      ctx.strokeText(nstr, cx, cy);
      ctx.fillText(nstr, cx, cy);
    }
  }

  // Labels (name) and/or the city's user ID — centred, outlined; stacked if both.
  if (opts.labels || opts.ids) {
    const fs = Math.max(9, Math.min(cell * 0.5, 22));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const o of objects) {
      if (o.type === 'bearTrap') continue;
      const name = opts.labels ? o.name || o.furnace || '' : '';
      const id = opts.ids && o.type === 'city' ? o.uid || '' : '';
      if (!name && !id) continue;
      const d = OBJECT_DEFS[o.type];
      const cx = SX(o.x + d.w / 2, o.y + d.h / 2);
      const cy = SY(o.x + d.w / 2, o.y + d.h / 2);
      const both = !!name && !!id;
      if (name) {
        ctx.font = `700 ${Math.round(fs)}px sans-serif`;
        ctx.lineWidth = Math.max(2, fs * 0.22);
        ctx.strokeStyle = t.outline;
        ctx.fillStyle = t.text;
        const ny = both ? cy - fs * 0.5 : cy;
        ctx.strokeText(name, cx, ny);
        ctx.fillText(name, cx, ny);
      }
      if (id) {
        const ifs = fs * 0.82;
        ctx.font = `600 ${Math.round(ifs)}px sans-serif`;
        ctx.lineWidth = Math.max(2, ifs * 0.22);
        ctx.strokeStyle = t.outline;
        ctx.fillStyle = t.dim;
        const iy = both ? cy + ifs * 0.6 : cy;
        ctx.strokeText(id, cx, iy);
        ctx.fillText(id, cx, iy);
      }
    }
  }

  // Legend
  let panelY = oy + boardH + gap;
  if (opts.legend && legendEntries.length) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(cell * 0.34)}px sans-serif`;
    const sw = Math.round(cell * 0.45);
    let ly = panelY + lineH / 2;
    const colW = Math.round((boardW - pad) / 3);
    let col = 0;
    for (const e of legendEntries) {
      const ex = pad + col * colW;
      ctx.fillStyle = e.color;
      roundRect(ctx, ex, ly - sw / 2, sw, sw, sw * 0.25);
      ctx.fill();
      ctx.fillStyle = t.dim;
      ctx.fillText(e.label, ex + sw + 6, ly);
      col++;
      if (col >= 3) {
        col = 0;
        ly += lineH;
      }
    }
    panelY += legendH + gap;
  }

  // Balance table
  if (opts.table && tally.length) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = t.text;
    ctx.font = `700 ${Math.round(cell * 0.36)}px sans-serif`;
    ctx.fillText('Bear balance', pad, panelY + lineH / 2);
    ctx.font = `${Math.round(cell * 0.34)}px sans-serif`;
    let ty2 = panelY + lineH;
    for (const s of tally) {
      ctx.fillStyle = trapColor(s.n);
      ctx.fillText(`🐻 ${s.n}`, pad, ty2 + lineH / 2);
      ctx.fillStyle = t.text;
      ctx.fillText(`${s.main} main`, pad + cell * 1.4, ty2 + lineH / 2);
      ctx.fillStyle = t.dim;
      ctx.fillText(`${s.backup} backup`, pad + cell * 3.4, ty2 + lineH / 2);
      ty2 += lineH;
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Render at the given quality and return a PNG blob. */
export function toPng(objects: PlacedObject[], opts: ImageOpts): Promise<Blob> {
  const canvas = document.createElement('canvas');
  renderHive(canvas, objects, opts);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  );
}
