import { describe, it, expect } from 'vitest';
import { diffLayouts, fmtPower } from '../../src/lib/tools/territory/compare';
import { type PlacedObject } from '../../src/lib/tools/territory/territory';

const city = (o: Partial<PlacedObject> & { x: number; y: number }): PlacedObject => ({
  id: `c-${o.x}-${o.y}`,
  type: 'city',
  ...o
});

describe('fmtPower', () => {
  it('compacts to K/M/B and dashes empties', () => {
    expect(fmtPower(undefined)).toBe('—');
    expect(fmtPower(0)).toBe('—');
    expect(fmtPower(484_800_000)).toBe('484.8M');
    expect(fmtPower(2_000_000_000)).toBe('2B');
    expect(fmtPower(500)).toBe('500');
  });
});

describe('diffLayouts', () => {
  it('flags added and removed cities', () => {
    const before = [city({ x: 1, y: 1, name: 'A' })];
    const after = [city({ x: 1, y: 1, name: 'A' }), city({ x: 4, y: 4, name: 'B' })];
    const d = diffLayouts(before, after);
    expect(d.counts.added).toBe(1);
    expect(d.counts.removed).toBe(0);
    expect(d.counts.unchanged).toBe(1);
    expect(d.pieces.find((p) => p.kind === 'added')?.label).toBe('B');

    const d2 = diffLayouts(after, before);
    expect(d2.counts.removed).toBe(1);
    expect(d2.pieces.find((p) => p.kind === 'removed')?.label).toBe('B');
  });

  it('detects a move (same name, new position) and records the old cell', () => {
    const d = diffLayouts([city({ x: 1, y: 1, name: 'A' })], [city({ x: 5, y: 7, name: 'A' })]);
    expect(d.counts.moved).toBe(1);
    const moved = d.pieces.find((p) => p.kind === 'moved')!;
    expect(moved.from).toEqual({ x: 1, y: 1 });
    expect(moved.changes.find((c) => c.field === 'pos')).toEqual({
      field: 'pos',
      before: '1,1',
      after: '5,7'
    });
  });

  it('matches by player ID even when the name changed', () => {
    const d = diffLayouts(
      [city({ x: 1, y: 1, name: 'Old', uid: '777' })],
      [city({ x: 1, y: 1, name: 'New', uid: '777' })]
    );
    expect(d.counts.added).toBe(0);
    expect(d.counts.removed).toBe(0);
    expect(d.counts.changed).toBe(1);
    const c = d.pieces.find((p) => p.kind === 'changed')!;
    expect(c.changes.find((f) => f.field === 'name')).toEqual({
      field: 'name',
      before: 'Old',
      after: 'New'
    });
  });

  it('reports tag changes (power, furnace, farm) as a single changed piece', () => {
    const d = diffLayouts(
      [city({ x: 2, y: 2, name: 'A', power: 480_000_000, furnace: 'FC7' })],
      [city({ x: 2, y: 2, name: 'A', power: 495_000_000, furnace: 'FC8', farm: true })]
    );
    expect(d.counts.changed).toBe(1);
    const fields = d.pieces.find((p) => p.kind === 'changed')!.changes.map((c) => c.field);
    expect(fields).toContain('power');
    expect(fields).toContain('furnace');
    expect(fields).toContain('farm');
  });

  it('counts identical layouts as all unchanged', () => {
    const objs = [city({ x: 1, y: 1, name: 'A' }), city({ x: 4, y: 4, name: 'B' })];
    const d = diffLayouts(
      objs,
      objs.map((o) => ({ ...o }))
    );
    expect(d.counts.unchanged).toBe(2);
    expect(d.counts.added + d.counts.removed + d.counts.moved + d.counts.changed).toBe(0);
  });
});
