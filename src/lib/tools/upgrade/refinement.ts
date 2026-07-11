/**
 * Fire Crystal refinement estimator (pure, unit-tested).
 *
 * Given the Refined Fire Crystals (RFC) a building upgrade needs, estimate the
 * Fire Crystals (FC) and weeks to produce them at a chosen weekly intensity.
 *
 * Super-refine = FC → RFC, 100/week across 5 tiers of 20 refines. Cost per RFC
 * worsens up the tiers (cheap tiers are efficient, expensive tiers buy speed),
 * so the "how hard do you push" choice trades FC cost against time. `estimate`
 * simulates this week by week (cheap tiers first) rather than using a blended
 * rate, so a small target — which never leaves tier 1 — costs the same at any
 * intensity. The plan ladder below sets the refines/week per intensity; its
 * pre-computed fcPerWeek/rfcPerWeek are kept as reference (the guide's figures).
 *
 * Because each refine is a dice roll, the FC bill is a range, not a point. We
 * report a *typical band* (~85% of outcomes) alongside the expected value: the
 * per-refine RFC distributions are known, refines are independent, so the total
 * is ~normal (CLT) and we propagate the standard deviation. See `estimate`.
 *
 * Sources (researched 2026-06-08): whiteoutsurvival.wiki/refinement-in-crystal-
 * laboratory, wos.h5joy-games.com/guides/cf-refinement. Probability tables are
 * community-sourced (Century Games doesn't publish them) → treat as ~estimates.
 *
 * TIERS / TIER_COST below verified 2026-06-15 against
 * https://www.whiteoutsurvival.wiki/refinement-in-crystal-laboratory/ and
 * cross-checked in-game by the user — costs + every distribution matched exactly.
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
 * Named intensity presets surfaced in the UI. Anchored on the key plans:
 * superEconomic = L2 (only the 20 cheap T1 refines/week, all discounted →
 * lowest FC/RFC, slowest), L3 = the "20 Monday + 1/day" alliance optimum,
 * L10 = rush (most RFC/week, worst FC/RFC).
 */
export const PRESETS: { key: string; plan: string }[] = [
  { key: 'superEconomic', plan: 'L2' },
  { key: 'economic', plan: 'L3' },
  { key: 'balanced', plan: 'L5' },
  { key: 'fast', plan: 'L8' },
  { key: 'rush', plan: 'L10' }
];

/**
 * Per-tier super-refine output (single source of truth): the FC cost to start a
 * refine and the RFC-output distribution [amount, probability]. Mean and variance
 * are derived from it, so the comparison table and the estimator can't drift.
 * Optimal play fills cheap tiers first (20 refines each, T1→T5).
 */
const TIER_DATA: { cost: number; dist: [number, number][] }[] = [
  {
    cost: 20,
    dist: [
      [1, 0.65],
      [2, 0.25],
      [3, 0.1]
    ]
  },
  {
    cost: 50,
    dist: [
      [2, 0.85],
      [3, 0.15]
    ]
  },
  {
    cost: 100,
    dist: [
      [3, 0.85],
      [4, 0.125],
      [5, 0.02],
      [6, 0.005]
    ]
  },
  {
    cost: 130,
    dist: [
      [3, 0.75],
      [4, 0.15],
      [5, 0.05],
      [6, 0.03],
      [7, 0.01],
      [8, 0.005],
      [9, 0.005]
    ]
  },
  {
    cost: 160,
    dist: [
      [3, 0.7],
      [4, 0.12],
      [5, 0.09],
      [6, 0.04],
      [7, 0.015],
      [8, 0.01],
      [9, 0.01],
      [10, 0.005],
      [11, 0.005],
      [12, 0.005]
    ]
  }
];
const distMean = (d: [number, number][]) => d.reduce((s, [x, p]) => s + x * p, 0);
const distVar = (d: [number, number][]) => {
  const m = distMean(d);
  return d.reduce((s, [x, p]) => s + x * x * p, 0) - m * m;
};
const TIERS = TIER_DATA.map((t) => ({ mu: distMean(t.dist), variance: distVar(t.dist) }));
const TIER_COST = TIER_DATA.map((t) => t.cost);

/** Per-tier reference for the "how we calculate" table (derived from TIER_DATA). */
export interface TierInfo {
  cost: number;
  dist: [number, number][];
  mean: number;
  fcPerRfc: number;
}
export const TIER_TABLE: TierInfo[] = TIER_DATA.map((t) => ({
  cost: t.cost,
  dist: t.dist,
  mean: distMean(t.dist),
  fcPerRfc: t.cost / distMean(t.dist)
}));

const TIER_CAP = 20; // refines available per tier per week
const TIERS_PER_WEEK = TIER_DATA.length; // 5 tiers → 100 refines/week
const WEEK_REFINES = TIER_CAP * TIERS_PER_WEEK; // 100
const DAYS_PER_WEEK = 7; // also the max daily 50%-off discounts per week

/** A rhythm-free ("dry") estimate: how many refines + FC to reach the target. */
export interface RawEstimate {
  /** Refines to reach the target (each is one super-refine action). */
  refines: number;
  /** Fire Crystals spent — raw, BEFORE the daily 50%-off (that depends on how
   *  you spread refines across days, i.e. rhythm). */
  fcTotal: number;
  /** FC per RFC actually produced (efficiency). */
  fcPerRfc: number;
  /** Expected RFC produced by those refines (≥ target; refines are whole). */
  rfcProduced: number;
  /** 1-based tier you're currently in, from refines already done this week. */
  startTier: number;
  /** Refines still available this week (100 − done). */
  refinesLeftThisWeek: number;
  /** Calendar weeks the job spans (1 if it fits the current week's slots). */
  weeks: number;
}

/**
 * "Dry" estimate — no weekly rhythm/intensity. You say how many refines you've
 * already done THIS week; since tiers fill cheapest-first (0–19 = T1, 20–39 = T2,
 * …) that pins which tier you're in now. To reach `rfcTarget` more RFC we just
 * keep refining cheapest-first from that position, spilling into next week (tiers
 * reset) when the 100 weekly refines run out. FC is raw (pre daily discount).
 */
export function estimateRaw(rfcTarget: number, doneThisWeek: number): RawEstimate {
  const done = Math.max(0, Math.min(WEEK_REFINES, Math.floor(doneThisWeek || 0)));
  const startTier = Math.min(TIERS_PER_WEEK, Math.floor(done / TIER_CAP) + 1);
  const refinesLeftThisWeek = WEEK_REFINES - done;
  if (rfcTarget <= 0) {
    return {
      refines: 0,
      fcTotal: 0,
      fcPerRfc: 0,
      rfcProduced: 0,
      startTier,
      refinesLeftThisWeek,
      weeks: 0
    };
  }
  let rfc = 0;
  let fc = 0;
  let refines = 0;
  let pos = done; // refines used this week so far
  let weeks = 1;
  while (rfc < rfcTarget && refines < 100000) {
    if (pos >= WEEK_REFINES) {
      weeks++;
      pos = 0; // new week: tiers reset, back to the cheapest
    }
    const tier = Math.floor(pos / TIER_CAP); // 0..4
    rfc += TIERS[tier].mu;
    fc += TIER_COST[tier];
    refines++;
    pos++;
  }
  return {
    refines,
    fcTotal: Math.round(fc),
    fcPerRfc: rfc > 0 ? +(fc / rfc).toFixed(1) : 0,
    rfcProduced: +rfc.toFixed(1),
    startTier,
    refinesLeftThisWeek,
    weeks
  };
}

/** z for an ~85% two-sided band (7.5% each tail). */
const Z_85 = 1.44;

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
 * Estimate FC + time to produce `rfcNeeded` RFC at the given plan, with a
 * typical (~85%) band around the expected FC.
 *
 * We simulate week by week, filling the CHEAPEST tier first (20 refines/tier,
 * resetting each week) and stopping the moment the target is reached. The cost
 * therefore reflects the tiers you ACTUALLY use — a small target never leaves
 * tier 1, so all intensities cost ~the same; a big target pushed hard burns the
 * expensive tiers in fewer weeks. The 50%-off first refine of each day is spent
 * on the week's most expensive refines (up to 7/week).
 *
 * The intensity (`plan.refines` per week) drives speed: more refines/week → more
 * days of throughput consumed at once, and a bigger week reaches higher tiers.
 *
 * Band: reaching N RFC takes a random number of refines R with Var(R) ≈ N·σ̄²/μ̄³,
 * and FC ≈ R · c̄ (mean FC per refine), so SD(FC) ≈ c̄·√(N·σ̄²/μ̄³); σ̄² is the
 * per-refine RFC variance over the tiers actually used (law of total variance).
 */
export function estimate(rfcNeeded: number, plan: RefinePlan): RefineEstimate {
  if (rfcNeeded <= 0) return { fcTotal: 0, fcLow: 0, fcHigh: 0, days: 0, weeks: 0, fcPerRfc: 0 };

  const R = plan.refines;
  const perDay = Math.max(1, Math.ceil(R / DAYS_PER_WEEK));
  const used = [0, 0, 0, 0, 0]; // refines per tier across the whole job (for the band)
  let rfc = 0;
  let fc = 0;
  let weeks = 0;
  let finalWeekRefines = 0;

  while (rfc < rfcNeeded && weeks < 5000) {
    weeks++;
    const week = [0, 0, 0, 0, 0]; // refines per tier THIS week (tiers reset weekly)
    let inWeek = 0;
    for (let t = 0; t < TIERS.length && inWeek < R && rfc < rfcNeeded; t++) {
      while (week[t] < TIER_CAP && inWeek < R && rfc < rfcNeeded) {
        rfc += TIERS[t].mu;
        week[t]++;
        used[t]++;
        inWeek++;
      }
    }
    finalWeekRefines = inWeek;
    // Spend the daily 50%-off on this week's most expensive refines (top tiers).
    let discounts = Math.min(DAYS_PER_WEEK, Math.ceil(inWeek / perDay));
    for (let t = 0; t < TIERS.length; t++) fc += week[t] * TIER_COST[t];
    for (let t = TIERS.length - 1; t >= 0 && discounts > 0; t--) {
      const take = Math.min(discounts, week[t]);
      fc -= 0.5 * take * TIER_COST[t];
      discounts -= take;
    }
  }

  const fcTotal = Math.round(fc);
  const days = (weeks - 1) * DAYS_PER_WEEK + Math.ceil(finalWeekRefines / perDay);
  const fcPerRfc = fcTotal / rfcNeeded;

  // Typical band from the per-refine RFC variance over the tiers actually used.
  const totalRef = used.reduce((s, n) => s + n, 0) || 1;
  const muBar = used.reduce((s, n, i) => s + n * TIERS[i].mu, 0) / totalRef;
  const eX2 =
    used.reduce((s, n, i) => s + n * (TIERS[i].variance + TIERS[i].mu ** 2), 0) / totalRef;
  const varBar = Math.max(0, eX2 - muBar ** 2);
  const cBar = fc / totalRef;
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
