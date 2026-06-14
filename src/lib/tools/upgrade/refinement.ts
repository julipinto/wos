/**
 * Fire Crystal refinement estimator (pure, unit-tested).
 *
 * Given the Refined Fire Crystals (RFC) a building upgrade needs, estimate the
 * Fire Crystals (FC) and weeks to produce them at a chosen weekly intensity.
 *
 * Super-refine = FC → RFC, 100/week across 5 tiers of 20 refines. Cost per RFC
 * worsens up the tiers (cheap tiers are efficient, expensive tiers buy speed),
 * so the "how hard do you push" choice trades FC cost against time. The plan
 * ladder below is pre-computed weekly throughput from the strategy guide.
 *
 * Because each refine is a dice roll, the FC bill is a range, not a point. We
 * report a *typical band* (~85% of outcomes) alongside the expected value: the
 * per-refine RFC distributions are known, refines are independent, so the total
 * is ~normal (CLT) and we propagate the standard deviation. See `estimate`.
 *
 * Sources (researched 2026-06-08): whiteoutsurvival.wiki/refinement-in-crystal-
 * laboratory, wos.h5joy-games.com/guides/cf-refinement. Probability tables are
 * community-sourced (Century Games doesn't publish them) → treat as ~estimates.
 */

/** A weekly refinement plan: how many refines, and the FC spent / RFC produced. */
export interface RefinePlan {
  id: string;
  /** refines per week */
  refines: number;
  /** Fire Crystals spent per week */
  fcPerWeek: number;
  /** Refined Fire Crystals produced per week (expected) */
  rfcPerWeek: number;
}

/** Plan ladder L1 (minimum) → L10 (rush). Weekly steady-state throughput. */
export const PLANS: RefinePlan[] = [
  { id: 'L1', refines: 7, fcPerWeek: 70, rfcPerWeek: 10.2 },
  { id: 'L2', refines: 20, fcPerWeek: 330, rfcPerWeek: 29 },
  { id: 'L3', refines: 26, fcPerWeek: 540, rfcPerWeek: 41.9 },
  { id: 'L4', refines: 40, fcPerWeek: 1240, rfcPerWeek: 72 },
  { id: 'L5', refines: 46, fcPerWeek: 1690, rfcPerWeek: 91.1 },
  { id: 'L6', refines: 60, fcPerWeek: 3090, rfcPerWeek: 135.6 },
  { id: 'L7', refines: 66, fcPerWeek: 3780, rfcPerWeek: 156.2 },
  { id: 'L8', refines: 80, fcPerWeek: 5600, rfcPerWeek: 204.4 },
  { id: 'L9', refines: 86, fcPerWeek: 6470, rfcPerWeek: 226.7 },
  { id: 'L10', refines: 100, fcPerWeek: 8710, rfcPerWeek: 278.6 }
];

export const planById = (id: string): RefinePlan => PLANS.find((p) => p.id === id) ?? PLANS[0];

/**
 * Named intensity presets surfaced in the UI (a Segmented control). Anchored on
 * the key plans: L3 = the "20 Monday + 1/day" alliance optimum (cheapest per
 * RFC), L10 = rush (most RFC/week, worst FC/RFC).
 */
export const PRESETS: { key: string; plan: string }[] = [
  { key: 'economic', plan: 'L3' },
  { key: 'balanced', plan: 'L5' },
  { key: 'fast', plan: 'L8' },
  { key: 'rush', plan: 'L10' }
];

/**
 * Per-tier super-refine output: mean RFC and variance per refine, from the
 * locked community probability tables. Optimal play fills cheap tiers first
 * (20 refines each, T1→T5), which is exactly what reproduces the PLANS above.
 */
const TIERS = [
  { mu: 1.45, variance: 0.4475 }, // T1: 1@65% 2@25% 3@10%
  { mu: 2.15, variance: 0.1275 }, // T2: 2@85% 3@15%
  { mu: 3.18, variance: 0.2176 }, // T3: 3@85% 4@12.5% 5@2% 6@0.5%
  { mu: 3.435, variance: 0.896 }, // T4: 3@75% 4@15% 5@5% 6@3% 7@1% 8@0.5% 9@0.5%
  { mu: 3.71, variance: 2.156 } // T5: 3@70% 4@12% 5@9% 6@4% 7@1.5% 8@1% 9@1% 10@.5% 11@.5% 12@.5%
];
const TIER_CAP = 20; // refines available per tier per week

/** z for an ~85% two-sided band (7.5% each tail). */
const Z_85 = 1.44;

/** How a week's `refines` spread across tiers under optimal (cheap-first) play. */
function composition(refines: number): number[] {
  const n = [0, 0, 0, 0, 0];
  let left = Math.max(0, refines);
  for (let i = 0; i < TIERS.length && left > 0; i++) {
    n[i] = Math.min(TIER_CAP, left);
    left -= n[i];
  }
  return n;
}

export interface RefineEstimate {
  /** Fire Crystals needed (expected value). */
  fcTotal: number;
  /** Low / high ends of the ~85% typical band. */
  fcLow: number;
  fcHigh: number;
  /** Days to finish (throughput is independent of the FC discount). */
  days: number;
  /** Whole weeks to finish at this plan. */
  weeks: number;
  /** FC spent per RFC at this plan (efficiency). */
  fcPerRfc: number;
}

/**
 * Estimate FC + weeks to produce `rfcNeeded` RFC at the given plan, with a
 * typical (~85%) band around the expected FC.
 *
 * Mean FC = rfcNeeded × (FC/RFC). The band comes from renewal-process variance:
 * reaching N RFC takes a random number of refines R with Var(R) ≈ N·σ̄²/μ̄³,
 * and FC ≈ R × c̄ (mean FC per refine), so SD(FC) ≈ c̄·√(N·σ̄²/μ̄³). σ̄² is the
 * per-refine RFC variance for this plan's tier mix (law of total variance).
 */
export function estimate(rfcNeeded: number, plan: RefinePlan): RefineEstimate {
  const fcPerRfc = plan.fcPerWeek / plan.rfcPerWeek;
  if (rfcNeeded <= 0) return { fcTotal: 0, fcLow: 0, fcHigh: 0, days: 0, weeks: 0, fcPerRfc };

  const fcTotal = Math.round(rfcNeeded * fcPerRfc);
  // RFC throughput is independent of the FC discount, so time is pure throughput:
  // a smooth daily rate (rfcPerWeek / 7) gives a day-granular estimate.
  const days = Math.ceil((rfcNeeded * 7) / plan.rfcPerWeek);
  const weeks = Math.ceil(rfcNeeded / plan.rfcPerWeek);

  // Per-refine stats for this plan's tier mix.
  const comp = composition(plan.refines);
  const total = comp.reduce((s, n) => s + n, 0) || 1;
  const muBar = comp.reduce((s, n, i) => s + n * TIERS[i].mu, 0) / total;
  const eX2 = comp.reduce((s, n, i) => s + n * (TIERS[i].variance + TIERS[i].mu ** 2), 0) / total;
  const varBar = Math.max(0, eX2 - muBar ** 2);
  const cBar = plan.fcPerWeek / total;

  const sd = cBar * Math.sqrt((rfcNeeded * varBar) / muBar ** 3);
  return {
    fcTotal,
    fcLow: Math.max(0, Math.round(fcTotal - Z_85 * sd)),
    fcHigh: Math.round(fcTotal + Z_85 * sd),
    days,
    weeks,
    fcPerRfc
  };
}
