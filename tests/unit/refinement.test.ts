import { describe, it, expect } from 'vitest';
import { PLANS, PRESETS, planById, estimate } from '../../src/lib/tools/upgrade/refinement';

describe('refinement plans', () => {
  it('has the L1–L10 ladder, ascending in throughput', () => {
    expect(PLANS).toHaveLength(10);
    for (let i = 1; i < PLANS.length; i++) {
      expect(PLANS[i].rfcPerWeek).toBeGreaterThan(PLANS[i - 1].rfcPerWeek);
      expect(PLANS[i].fcPerWeek).toBeGreaterThan(PLANS[i - 1].fcPerWeek);
    }
  });
  it('cost per RFC worsens as intensity climbs (cheap tiers are efficient)', () => {
    const perRfc = (p: (typeof PLANS)[number]) => p.fcPerWeek / p.rfcPerWeek;
    expect(perRfc(planById('L10'))).toBeGreaterThan(perRfc(planById('L3')));
  });
  it('presets point at real plans', () => {
    for (const p of PRESETS) expect(PLANS.some((pl) => pl.id === p.plan)).toBe(true);
  });
  it('planById falls back to L1 for an unknown id', () => {
    expect(planById('nope').id).toBe('L1');
  });
});

describe('estimate', () => {
  it('Furnace FC5→FC8 (270 RFC) on the economic plan (L3)', () => {
    const e = estimate(270, planById('L3'));
    // 540/41.9 ≈ 12.89 FC/RFC → ~3480 FC, ceil(270/41.9) = 7 weeks
    expect(e.weeks).toBe(7);
    expect(e.fcTotal).toBe(3480);
    expect(e.fcPerRfc).toBeCloseTo(12.89, 1);
  });
  it('the same 270 RFC rushes (L10) much faster but costs more FC', () => {
    const eco = estimate(270, planById('L3'));
    const rush = estimate(270, planById('L10'));
    expect(rush.weeks).toBeLessThan(eco.weeks);
    expect(rush.fcTotal).toBeGreaterThan(eco.fcTotal);
    expect(rush.weeks).toBe(1); // 270 / 278.6 → ceil = 1
  });
  it('zero RFC needs nothing', () => {
    expect(estimate(0, planById('L5'))).toMatchObject({ fcTotal: 0, weeks: 0 });
  });
});
