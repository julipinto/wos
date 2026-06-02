import { describe, it, expect } from 'vitest';
import {
  BINS,
  JACKPOT,
  VALUES,
  SEP_XS,
  LW,
  binOf,
  sampleAngle,
  simulateOne,
  summarize,
  makeWorld,
  type SimWorld
} from '../../src/lib/tools/gingado/physics';
import type { Layout } from '../../src/lib/tools/gingado/types';

// A representative board built inline so the test stays pure (no runes store).
const LAYOUT: Layout = {
  penguins: [{ x: LW * 0.11 }, { x: LW * 0.5 }, { x: LW * 0.89 }],
  bumpers: [
    { x: 97, y: 298, r: 33 },
    { x: 268, y: 298, r: 33 }
  ],
  bars: [{ x1: 108, y1: 186, x2: 150, y2: 176, r: 6 }],
  pins: [
    { x: 182, y: 196, r: 11 },
    { x: 116, y: 126, r: 6 },
    { x: 244, y: 127, r: 6 },
    { x: 82, y: 230, r: 5 },
    { x: 283, y: 230, r: 5 },
    { x: 168, y: 279, r: 5 }
  ]
};
const PHYSICS = { rest: 0.65, kick: 3.0, grav: 1.0 };
const LAUNCH = { pow: 35, aimDeg: 0, swDeg: 30, angleMode: 'edges' as const };

/** Deterministic PRNG so simulation is reproducible in tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('pot geometry', () => {
  it('has 7 pots worth the classic ladder, jackpot in the center', () => {
    expect(BINS).toBe(7);
    expect(VALUES).toEqual([10, 70, 130, 500, 130, 70, 10]);
    expect(VALUES[JACKPOT]).toBe(500);
  });

  it('binOf maps x to the column it falls in and clamps out-of-range', () => {
    expect(binOf(-100)).toBe(0);
    expect(binOf(LW + 100)).toBe(BINS - 1);
    // center of each slot resolves to that slot
    for (let i = 0; i < BINS; i++) {
      const mid = (SEP_XS[i] + SEP_XS[i + 1]) / 2;
      expect(binOf(mid)).toBe(i);
    }
  });
});

describe('summarize', () => {
  it('computes EV, jackpot % and average hits', () => {
    const counts = [0, 0, 0, 10, 0, 0, 0]; // all in the 500 pot
    const s = summarize(counts, 25, 10);
    expect(s.ev).toBe(500);
    expect(s.jp).toBe(100);
    expect(s.hits).toBe(2.5);
    expect(s.n).toBe(10);
  });

  it('weights pots by value', () => {
    const counts = [1, 0, 0, 0, 0, 0, 1]; // one 10 + one 10
    expect(summarize(counts, 0, 2).ev).toBe(10);
    const mix = [1, 1, 0, 0, 0, 0, 0]; // 10 + 70
    expect(summarize(mix, 0, 2).ev).toBe(40);
  });

  it('is safe on an empty batch', () => {
    const s = summarize([0, 0, 0, 0, 0, 0, 0], 0, 0);
    expect(s.ev).toBe(0);
    expect(s.jp).toBe(0);
    expect(s.hits).toBe(0);
  });
});

describe('sampleAngle', () => {
  const base: SimWorld = makeWorld(LAYOUT, PHYSICS, { ...LAUNCH, angleMode: 'uniform' });

  it('uniform stays within ±sw around aim', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 500; i++) {
      const a = sampleAngle(base, rng);
      expect(Math.abs(a)).toBeLessThanOrEqual(base.sw + 1e-9);
    }
  });

  it('edges bias keeps magnitude in [0.5·sw, sw] — a near-straight drop is rare', () => {
    const edges: SimWorld = { ...base, angleMode: 'edges' };
    const rng = mulberry32(2);
    for (let i = 0; i < 500; i++) {
      const mag = Math.abs(sampleAngle(edges, rng));
      expect(mag).toBeGreaterThanOrEqual(0.5 * edges.sw - 1e-9);
      expect(mag).toBeLessThanOrEqual(edges.sw + 1e-9);
    }
  });
});

describe('simulateOne', () => {
  const world = makeWorld(LAYOUT, PHYSICS, LAUNCH);

  it('always settles into a valid pot', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const b = simulateOne(world, LW / 2, rng);
      expect(b.done).toBe(true);
      expect(b.bin).toBeGreaterThanOrEqual(0);
      expect(b.bin).toBeLessThan(BINS);
      expect(b.hits).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = simulateOne(world, LW / 2, mulberry32(7));
    const b = simulateOne(world, LW / 2, mulberry32(7));
    expect(a.bin).toBe(b.bin);
    expect(a.hits).toBe(b.hits);
  });

  it('produces a non-degenerate distribution over many drops', () => {
    const rng = mulberry32(123);
    const counts = new Array(BINS).fill(0);
    for (let i = 0; i < 800; i++) counts[simulateOne(world, LW / 2, rng).bin]++;
    const nonEmpty = counts.filter((c) => c > 0).length;
    // a chaotic board should spread across several pots, not collapse to one
    expect(nonEmpty).toBeGreaterThan(1);
    expect(counts.reduce((x, y) => x + y, 0)).toBe(800);
  });
});
