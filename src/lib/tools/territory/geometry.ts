// Pure board geometry for the territory canvas — the isometric projection and the
// shape maths, kept out of Board.svelte so they're testable and the component stays
// focused on interaction/rendering. No component state in here.

export const N = 60; // grid is N×N cells
const CENTER = N / 2;
const ISO_C = 0.7071; // cos/sin 45°
const ISO_SX = 0.7071; // horizontal squash
const ISO_SY = 0.55; // vertical squash (the classic diamond)

/** The CSS/SVG transform that turns the flat grid into the iso diamond. Pure 2D
 *  affine, so getScreenCTM() stays invertible (clicks map back to cells). */
export const ISO_TRANSFORM = `translate(${CENTER} ${CENTER}) scale(${ISO_SX} ${ISO_SY}) rotate(45) translate(-${CENTER} -${CENTER})`;
export const FLAT_VIEWBOX = `0 0 ${N} ${N}`;

/** Project a flat grid point through the iso transform (for upright HTML overlays). */
export function isoPoint(x: number, y: number): { x: number; y: number } {
  const px = x - CENTER;
  const py = y - CENTER;
  return {
    x: ISO_SX * (px * ISO_C - py * ISO_C) + CENTER,
    y: ISO_SY * (px * ISO_C + py * ISO_C) + CENTER
  };
}

/** The iso viewBox cropped to the diamond's bounds (drops the empty bands). */
export const ISO_VB = (() => {
  const pts = [isoPoint(0, 0), isoPoint(N, 0), isoPoint(0, N), isoPoint(N, N)];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX - 1, y: minY - 1, w: Math.max(...xs) - minX + 2, h: Math.max(...ys) - minY + 2 };
})();
export const ISO_VIEWBOX = `${ISO_VB.x} ${ISO_VB.y} ${ISO_VB.w} ${ISO_VB.h}`;

/** Map a continuous grid point → percent position inside the rendered board box
 *  (view-aware), so HTML overlays (labels, peer cursors) sit at the right spot. */
export function gridToPct(
  view: 'flat' | 'iso',
  gx: number,
  gy: number
): { left: number; top: number } {
  if (view === 'iso') {
    const p = isoPoint(gx, gy);
    return { left: ((p.x - ISO_VB.x) / ISO_VB.w) * 100, top: ((p.y - ISO_VB.y) / ISO_VB.h) * 100 };
  }
  return { left: (gx / N) * 100, top: (gy / N) * 100 };
}

/** SVG points for an octagon inscribed in the rect (x0,y0)–(x1,y1) — the bear-trap
 *  shape, mirroring the in-game icon. */
export function octagon(x0: number, y0: number, x1: number, y1: number): string {
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
