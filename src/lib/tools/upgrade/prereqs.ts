/**
 * Fire Crystal building prerequisites (pure, testable). Rules (cross-checked
 * vs whiteoutsurvival.wiki + WOS Handbook):
 *  - The Furnace into FC tier n needs Embassy FC(n-1) AND a rotating troop camp
 *    FC(n-1), cycling Lancer → Infantry → Marksman (FC2 Lancer, FC3 Infantry,
 *    FC4 Marksman, FC5 Lancer, …). So at Furnace FCn you've passed every gate up
 *    to n — the cumulative end-state requirement per camp is the highest tier it
 *    gated. (Rotation phase is the commonly-cited one; verify vs in-game.)
 *  - Every support building into FCn needs the Furnace at FCn.
 *  - Master invariant: no building's level may exceed the Furnace's.
 *  - Gates use whole FC tiers, never sub-levels.
 */

/** Whole FC tier of a level label: '30' → 0, 'FC1'/'FC1-2' → 1, 'FC10' → 10. */
export function fcTier(label: string): number {
  const m = /^FC(\d+)/.exec(label);
  return m ? Number(m[1]) : 0;
}

/** The camp that gates the Furnace's climb INTO tier t (t ≥ 2). */
const CAMP_CYCLE = ['lancerCamp', 'infantryCamp', 'marksmanCamp'] as const;
export function campForTier(t: number): string {
  return CAMP_CYCLE[(t - 2) % 3];
}

export interface Prereq {
  building: string;
  tier: number;
}

/**
 * Buildings (+ min FC tier) required to have the Furnace AT tier `f`. That's
 * Embassy FC(f-1) plus, for each camp, the highest tier it gated on the way up.
 * f < 2 → no FC prerequisites.
 */
export function furnaceReqs(f: number): Prereq[] {
  if (f < 2) return [];
  const reqs: Prereq[] = [{ building: 'embassy', tier: f - 1 }];
  const campMax = new Map<string, number>();
  for (let t = 2; t <= f; t++) {
    const c = campForTier(t);
    campMax.set(c, Math.max(campMax.get(c) ?? 0, t - 1));
  }
  for (const [building, tier] of campMax) reqs.push({ building, tier });
  return reqs;
}
