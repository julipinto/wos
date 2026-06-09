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

export interface RefineEstimate {
  /** Fire Crystals needed (point estimate). */
  fcTotal: number;
  /** Whole weeks to finish at this plan. */
  weeks: number;
  /** FC spent per RFC at this plan (efficiency). */
  fcPerRfc: number;
}

/** Estimate FC + weeks to produce `rfcNeeded` RFC at the given plan. */
export function estimate(rfcNeeded: number, plan: RefinePlan): RefineEstimate {
  const fcPerRfc = plan.fcPerWeek / plan.rfcPerWeek;
  if (rfcNeeded <= 0) return { fcTotal: 0, weeks: 0, fcPerRfc };
  return {
    fcTotal: Math.round(rfcNeeded * fcPerRfc),
    weeks: Math.ceil(rfcNeeded / plan.rfcPerWeek),
    fcPerRfc
  };
}
