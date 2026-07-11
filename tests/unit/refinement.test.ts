import { describe, it, expect } from 'vitest';
import {
  PLANS,
  PRESETS,
  planById,
  estimate,
  estimateRaw
} from '../../src/lib/tools/upgrade/refinement';

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
    // 6 full economic weeks (540 FC each) + a cheap T1-only final week → ~3460 FC.
    expect(e.weeks).toBe(7);
    expect(e.fcTotal).toBe(3460);
    expect(e.fcPerRfc).toBeCloseTo(12.8, 1);
  });
  it('the same 270 RFC rushes (L10) much faster but costs more FC', () => {
    const eco = estimate(270, planById('L3'));
    const rush = estimate(270, planById('L10'));
    expect(rush.weeks).toBeLessThan(eco.weeks);
    expect(rush.fcTotal).toBeGreaterThan(eco.fcTotal);
    expect(rush.weeks).toBe(1); // 270 / 278.6 → ceil = 1
  });
  it('zero RFC needs nothing', () => {
    expect(estimate(0, planById('L5'))).toMatchObject({
      fcTotal: 0,
      fcLow: 0,
      fcHigh: 0,
      weeks: 0
    });
  });
  it('a tiny target never leaves tier 1, so intensity barely changes the cost', () => {
    const eco = estimate(7, planById('L3'));
    const rush = estimate(7, planById('L10'));
    // ~5 tier-1 refines either way — nowhere near rush's blended 31.3 FC/RFC.
    expect(eco.fcPerRfc).toBeLessThan(15);
    expect(rush.fcPerRfc).toBeLessThan(15);
    expect(Math.abs(rush.fcTotal - eco.fcTotal)).toBeLessThan(60);
  });
});

describe('tier-by-tier cost (rush fills one week cheap-first)', () => {
  // In a single rush week (100 refines) the cumulative RFC reaches each tier in
  // turn: ~29 (T1), ~72 (+T2), ~136 (+T3), ~204 (+T4), ~278 (+T5). Picking a
  // target inside each band lets us check the marginal tier shows up in the cost.
  const rush = planById('L10');
  const perRfc = (n: number) => estimate(n, rush).fcPerRfc;

  it('cost per RFC climbs monotonically as the target reaches deeper tiers', () => {
    const t1 = perRfc(25); // tier 1 only
    const t2 = perRfc(70); // into tier 2
    const t3 = perRfc(130); // into tier 3
    const t4 = perRfc(200); // into tier 4
    const t5 = perRfc(270); // into tier 5
    expect(t1).toBeLessThan(t2);
    expect(t2).toBeLessThan(t3);
    expect(t3).toBeLessThan(t4);
    expect(t4).toBeLessThan(t5);
  });

  it('a tier-1 target is far cheaper per RFC than a deep-tier one', () => {
    expect(perRfc(25)).toBeLessThan(15); // ~T1 base 13.8, minus discount
    expect(perRfc(270)).toBeGreaterThan(25); // dragged up by T4/T5
  });

  it('staying within one tier keeps cost per RFC roughly flat', () => {
    // Two targets both inside tier 1 (≤ ~29 RFC) should cost about the same rate.
    expect(Math.abs(perRfc(12) - perRfc(26))).toBeLessThan(3);
  });

  it('economic keeps a large target cheap by redoing tier 1 every week', () => {
    // 260 RFC: rush burns T1–T5 in one week; economic redoes 20×T1 weekly → cheaper.
    expect(estimate(260, planById('L3')).fcPerRfc).toBeLessThan(
      estimate(260, planById('L10')).fcPerRfc
    );
  });

  it('a target past one weekly quota rolls into the next week (reset reused)', () => {
    // ~278 RFC fills one rush week; 600 needs the quota to reset across ~3 weeks.
    const oneWeek = estimate(278, rush);
    const big = estimate(600, rush);
    expect(oneWeek.weeks).toBe(1);
    expect(big.weeks).toBe(3);
    // Each fresh week repeats the cheap→expensive cycle, so the rate stays steady
    // instead of climbing forever — proof the weekly reset is applied.
    expect(Math.abs(big.fcPerRfc - oneWeek.fcPerRfc)).toBeLessThan(2);
  });
});

describe('estimateRaw (dry, no rhythm)', () => {
  it("the user's example: 20 done → +5 RFC lands in tier 2, ~3 refines", () => {
    const r = estimateRaw(5, 20);
    expect(r.startTier).toBe(2); // 20 done → entering T2
    expect(r.refines).toBe(3); // T2 gives ~2.15 RFC each → 3 refines clear 5
    expect(r.rfcProduced).toBeGreaterThanOrEqual(5);
    expect(r.fcTotal).toBe(150); // 3 × 50 FC (T2), pre-discount
    expect(r.refinesLeftThisWeek).toBe(80);
    expect(r.weeks).toBe(1);
  });
  it('from a fresh week starts in tier 1 (cheapest)', () => {
    const r = estimateRaw(10, 0);
    expect(r.startTier).toBe(1);
    expect(r.fcTotal).toBeLessThan(estimateRaw(10, 20).fcTotal); // T1 cheaper than T2
  });
  it('more refines already done this week → pricier remaining (higher tier)', () => {
    const early = estimateRaw(10, 0); // T1
    const late = estimateRaw(10, 60); // T4
    expect(late.fcPerRfc).toBeGreaterThan(early.fcPerRfc);
  });
  it('a target beyond the weekly quota spills into the next week', () => {
    const r = estimateRaw(400, 90); // only 10 slots left this week
    expect(r.weeks).toBeGreaterThan(1);
  });
  it('zero target needs nothing but still reports the current tier', () => {
    const r = estimateRaw(0, 40);
    expect(r).toMatchObject({ refines: 0, fcTotal: 0, weeks: 0, startTier: 3 });
  });
  it('clamps refines-done to the 0–100 weekly range', () => {
    expect(estimateRaw(5, -10).startTier).toBe(1);
    expect(estimateRaw(5, 999).refinesLeftThisWeek).toBe(0);
  });
});

describe('typical band (RNG spread)', () => {
  it('brackets the expected value with a real spread', () => {
    const e = estimate(270, planById('L3'));
    expect(e.fcLow).toBeLessThan(e.fcTotal);
    expect(e.fcHigh).toBeGreaterThan(e.fcTotal);
    expect(e.fcLow).toBeGreaterThan(0);
  });
  it('relative spread shrinks as the target grows (CLT: ∝ 1/√N)', () => {
    const small = estimate(20, planById('L5'));
    const large = estimate(2000, planById('L5'));
    const rel = (e: typeof small) => (e.fcHigh - e.fcLow) / e.fcTotal;
    expect(rel(large)).toBeLessThan(rel(small));
  });
  it('never reports a negative low end', () => {
    const e = estimate(5, planById('L10'));
    expect(e.fcLow).toBeGreaterThanOrEqual(0);
  });
});
