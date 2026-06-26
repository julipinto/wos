/**
 * Export a hive layout to a draw.io (.drawio) diagram so the alliance can open
 * and edit it in diagrams.net. Pure function — no DOM, no deps.
 *
 * Layout conventions (match the alliance's existing files):
 *  - Scale: 40px per grid cell. A cell (gx,gy) with footprint w×h becomes a
 *    vertex at x=gx*40, y=gy*40, width=w*40, height=h*40.
 *  - Bear traps are numbered by placement order (their index among `bearTrap`
 *    objects + 1). Cities reference those numbers via `bear` / `bearMain`.
 *  - A city's colour is the palette entry for its lowest `bearMain` number;
 *    a city with no primary trap is white/grey.
 */

import { OBJECT_DEFS, type PlacedObject } from './territory';

const CELL = 40;

/** draw.io fill/stroke pairs, indexed by trap number (1-based, modulo-wrapped). */
const TRAP_COLORS: { fill: string; stroke: string }[] = [
  { fill: '#d5e8d4', stroke: '#82b366' },
  { fill: '#ffe6cc', stroke: '#d79b00' },
  { fill: '#f8cecc', stroke: '#b85450' },
  { fill: '#dae8fc', stroke: '#6c8ebf' },
  { fill: '#e1d5e7', stroke: '#9673a6' },
  { fill: '#fff2cc', stroke: '#d6b656' }
];

/** Palette entry for a 1-based trap number (wraps for more than 6 traps). */
function trapColor(n: number): { fill: string; stroke: string } {
  return TRAP_COLORS[(n - 1) % TRAP_COLORS.length];
}

/** XML-escape a value for use in an attribute or text. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Serialise the layout to draw.io (.drawio) XML — editable in diagrams.net. */
export function toDrawio(objects: PlacedObject[]): string {
  // Bear-trap number = index in the filtered list + 1.
  const trapNumber = new Map<string, number>();
  let nextTrap = 0;
  for (const o of objects) {
    if (o.type === 'bearTrap') trapNumber.set(o.id, ++nextTrap);
  }

  const cells = objects.map((o, i) => {
    const def = OBJECT_DEFS[o.type];
    const w = (def?.w ?? 1) * CELL;
    const h = (def?.h ?? 1) * CELL;
    const geom = `<mxGeometry x="${o.x * CELL}" y="${o.y * CELL}" width="${w}" height="${h}" as="geometry"/>`;
    const id = `c${i}`;

    let style: string;
    let value: string;

    if (o.type === 'bearTrap') {
      const n = trapNumber.get(o.id) ?? 0;
      style =
        'whiteSpace=wrap;html=1;aspect=fixed;fillColor=#0050ef;fontColor=#ffffff;strokeColor=#001DBC;rounded=1;';
      value = `Bear Trap&lt;div&gt;${n}&lt;/div&gt;`;
    } else if (o.type === 'hq') {
      style =
        'html=1;shape=mxgraph.basic.8_point_star;fillColor=#dae8fc;strokeColor=#6c8ebf;verticalLabelPosition=bottom;verticalAlign=top;';
      value = 'HQ';
    } else if (def?.city) {
      // Primary colour = palette of the lowest bearMain; none → white/grey.
      const mains = o.bearMain ?? [];
      let fill = '#ffffff';
      let stroke = '#666666';
      if (mains.length) {
        const c = trapColor(Math.min(...mains));
        fill = c.fill;
        stroke = c.stroke;
      }
      style = `whiteSpace=wrap;html=1;aspect=fixed;align=center;verticalAlign=middle;fontFamily=Helvetica;fontSize=12;fillColor=${fill};strokeColor=${stroke};`;
      value = esc(o.name ?? '');
    } else {
      // Banner / other types — a plain box in the object's own colour.
      const color = def?.color ?? '#000000';
      style = `whiteSpace=wrap;html=1;aspect=fixed;fillColor=${color};strokeColor=#000000;fontColor=#ffffff;fontSize=11;`;
      value = o.type === 'banner' ? '' : esc(o.name ?? '');
    }

    return `        <mxCell id="${id}" value="${value}" style="${style}" vertex="1" parent="1">\n          ${geom}\n        </mxCell>`;
  });

  return [
    '<mxfile host="app.diagrams.net">',
    '  <diagram name="Hive" id="hive">',
    '    <mxGraphModel grid="1" gridSize="10">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    ...cells,
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
    ''
  ].join('\n');
}
