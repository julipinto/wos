import { describe, it, expect } from 'vitest';
import {
  computeTerritory,
  coverageCells,
  footprintCells,
  exportLayout,
  importLayout,
  type PlacedObject
} from '../../src/lib/tools/territory/territory';

const hq = (x: number, y: number): PlacedObject => ({ id: 'hq', type: 'hq', x, y });
const banner = (id: string, x: number, y: number): PlacedObject => ({ id, type: 'banner', x, y });

describe('territory geometry', () => {
  it('HQ footprint is 3×3', () => {
    expect(footprintCells(hq(10, 10))).toHaveLength(9);
  });
  it('banner coverage is 7×7 centred on the cell', () => {
    const cells = coverageCells(banner('b', 11, 11));
    expect(cells).toHaveLength(49);
    expect(cells).toContain('11,11');
    expect(cells).toContain('8,8');
    expect(cells).toContain('14,14');
  });
});

describe('territory connectivity', () => {
  it('a banner overlapping the HQ is connected; a far one is orphaned', () => {
    const objs = [hq(10, 10), banner('near', 11, 11), banner('far', 25, 25)];
    const r = computeTerritory(objs);
    expect(r.connected.has('near')).toBe(true);
    expect(r.orphaned.has('far')).toBe(true);
    // territory includes the HQ seed and the near banner's coverage
    expect(r.cells.has('10,10')).toBe(true);
    expect(r.cells.has('8,8')).toBe(true);
  });

  it('chains: a banner connects through another connected banner', () => {
    const objs = [hq(10, 10), banner('a', 11, 11), banner('b', 17, 11)];
    const r = computeTerritory(objs);
    // b doesn't reach the HQ directly, but a's coverage overlaps b's.
    expect(r.connected.has('a')).toBe(true);
    expect(r.connected.has('b')).toBe(true);
    expect(r.orphaned.size).toBe(0);
  });

  it('no HQ means every banner is orphaned', () => {
    const r = computeTerritory([banner('a', 5, 5), banner('b', 6, 6)]);
    expect(r.connected.size).toBe(0);
    expect(r.orphaned.size).toBe(2);
    expect(r.cells.size).toBe(0);
  });
});

describe('import / export', () => {
  it('round-trips a layout incl. tags (ids regenerated)', () => {
    const objs: PlacedObject[] = [
      hq(10, 10),
      { id: 'c1', type: 'city', x: 12, y: 12, name: 'Juli', furnace: 'FC7', power: 42000000 },
      banner('b', 11, 11)
    ];
    const code = exportLayout(objs);
    const back = importLayout(code)!;
    expect(back).toHaveLength(3);
    expect(back.map((o) => o.type)).toEqual(['hq', 'city', 'banner']);
    const city = back.find((o) => o.type === 'city')!;
    expect(city).toMatchObject({ x: 12, y: 12, name: 'Juli', furnace: 'FC7', power: 42000000 });
  });
  it('rejects garbage', () => {
    expect(importLayout('nope')).toBeNull();
    expect(importLayout('T1@@@')).toBeNull();
  });
});
