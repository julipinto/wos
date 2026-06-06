// Helios (T11) troop research — the "Ardent" tree in the War Academy. Symmetric
// across Infantry / Lancer / Marksman, so one set of nodes models any troop type
// (multiply by how many branches you're maxing). Costs are Steel + Fire Crystal
// Shards only. Source: wos.h5joy-games.com per-level charts, corroborated by the
// wostools.net and woscalculator.com War Academy calculators. Single source
// family, so the calculator marks this preview. Per-level research TIMES aren't
// published (only a ~271-day per-type total), so times are 0 here.
import type { LevelCost } from '../types';

function ladder(steel: number[], shard: number[]): LevelCost[] {
  const out: LevelCost[] = [{ label: '0', cost: {}, time: 0 }];
  for (let i = 0; i < steel.length; i++) {
    out.push({ label: String(i + 1), cost: { steel: steel[i], fcShard: shard[i] }, time: 0 });
  }
  return out;
}

// Flame Squad (5 levels)
const SQUAD = ladder([5000, 8000, 13000, 21000, 33000], [16, 25, 41, 68, 102]);
// Health & Lethality nodes (8 levels each, same table)
const SKILL8 = ladder(
  [10000, 14000, 18000, 25000, 34000, 46000, 62000, 83000],
  [40, 56, 74, 102, 136, 184, 248, 334]
);
// Attack & Defense nodes (12 levels each, same table)
const ATKDEF = ladder(
  [15000, 18000, 22000, 27000, 33000, 40000, 49000, 60000, 75000, 90000, 100000, 130000],
  [54, 66, 81, 97, 118, 145, 178, 216, 270, 324, 388, 480]
);
// Flame Legion (12 levels)
const LEGION = ladder(
  [23000, 28000, 34000, 41000, 51000, 62000, 76000, 93000, 110000, 130000, 160000, 200000],
  [83, 102, 125, 150, 184, 225, 276, 334, 418, 502, 602, 744]
);
// Final Helios unlock (1 level)
const UNLOCK: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  { label: '1', cost: { steel: 1000000, fcShard: 2236 }, time: 0 }
];

export interface HeliosNode {
  id: string;
  /** i18n suffix under upgrade.helios.* */
  i18n: string;
  ladder: LevelCost[];
}

/** One troop branch's nodes (Infantry/Lancer/Marksman are identical). */
export const HELIOS_NODES: HeliosNode[] = [
  { id: 'flameSquad', i18n: 'flameSquad', ladder: SQUAD },
  { id: 'health', i18n: 'health', ladder: SKILL8 },
  { id: 'lethality', i18n: 'lethality', ladder: SKILL8 },
  { id: 'attack', i18n: 'attack', ladder: ATKDEF },
  { id: 'defense', i18n: 'defense', ladder: ATKDEF },
  { id: 'flameLegion', i18n: 'flameLegion', ladder: LEGION },
  { id: 'unlock', i18n: 'unlock', ladder: UNLOCK }
];
