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
  it('HQ footprint is 15×15', () => {
    expect(footprintCells(hq(10, 10))).toHaveLength(225);
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
    // HQ is 15×15 (covers 0..14); near overlaps it, far is well outside.
    const objs = [hq(0, 0), banner('near', 16, 16), banner('far', 35, 35)];
    const r = computeTerritory(objs);
    expect(r.connected.has('near')).toBe(true);
    expect(r.orphaned.has('far')).toBe(true);
    // territory includes the HQ seed and the near banner's coverage
    expect(r.cells.has('0,0')).toBe(true);
    expect(r.cells.has('16,16')).toBe(true);
  });

  it('chains: a banner connects through another connected banner', () => {
    const objs = [hq(0, 0), banner('a', 16, 16), banner('b', 22, 16)];
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
  it('round-trips a layout incl. mode + tags (ids regenerated)', async () => {
    const objs: PlacedObject[] = [
      hq(10, 10),
      { id: 'c1', type: 'city', x: 12, y: 12, name: 'Juli', furnace: 'FC7', power: 42000000 },
      banner('b', 11, 11)
    ];
    const back = (await importLayout(await exportLayout('hive', objs)))!;
    expect(back.mode).toBe('hive');
    expect(back.objects).toHaveLength(3);
    expect(back.objects.map((o) => o.type)).toEqual(['hq', 'city', 'banner']);
    const city = back.objects.find((o) => o.type === 'city')!;
    expect(city).toMatchObject({ x: 12, y: 12, name: 'Juli', furnace: 'FC7', power: 42000000 });
  });
  it('round-trips a city bear-trap assignment', async () => {
    const objs: PlacedObject[] = [
      hq(10, 10),
      { id: 'bt', type: 'bearTrap', x: 30, y: 30 },
      { id: 'c1', type: 'city', x: 12, y: 12, name: 'Ana', bear: 2 }
    ];
    const back = (await importLayout(await exportLayout('hive', objs)))!;
    const city = back.objects.find((o) => o.type === 'city')!;
    expect(city.bear).toBe(2);
  });
  it('carries the mode and drops objects foreign to it', async () => {
    const code = await exportLayout('sunfire', [{ id: 's', type: 'sunCastle', x: 5, y: 5 }]);
    const back = (await importLayout(code))!;
    expect(back.mode).toBe('sunfire');
    expect(back.objects.map((o) => o.type)).toEqual(['sunCastle']);
  });
  it('rejects garbage', async () => {
    expect(await importLayout('nope')).toBeNull();
    expect(await importLayout('T1@@@')).toBeNull();
  });
});
