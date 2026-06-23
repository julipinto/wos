/**
 * Chief (Governor) Gear STAT/POWER bonuses, keyed by the GEAR_LADDER tier label.
 * Each piece grants BOTH Troop Attack% and Defense% to its troop type (one value
 * serves both — the game stores a single statPct per tier, shared by all pieces).
 * Construction power per piece = statPct × 24,000. Verified 2026-06-17 across
 * three machine-readable sources that agree exactly (Marco-Cardia
 * WhiteOutCompanionOnline, zenpaiang/wos-database, wostools.net).
 *
 * Pieces pair by TROOP, not by stat: Hat+Watch = Lancer, Coat+Pants = Infantry,
 * Ring+Cudgel = Marksman. Set bonuses (3pc → all-troop DEF, 6pc → all-troop ATK)
 * are GENERAL but have no published per-tier numbers, so they're not modelled.
 */

export type ChiefTroop = 'infantry' | 'lancer' | 'marksman';

/** Which troop each chief-gear piece (data/gear.ts ids) buffs. */
export const CHIEF_PIECE_TROOP: Record<string, ChiefTroop> = {
  hat: 'lancer',
  watch: 'lancer',
  coat: 'infantry',
  pants: 'infantry',
  ring: 'marksman',
  cudgel: 'marksman'
};

/** Troop Attack% = Defense% per GEAR_LADDER tier label (both stats share it). */
const TIER_PCT: Record<string, number> = {
  None: 0,
  Green: 9.35,
  'Green 1-Star': 12.75,
  Blue: 17,
  'Blue 1-Star': 21.25,
  'Blue 2-Star': 25.5,
  'Blue 3-Star': 29.75,
  Purple: 34,
  'Purple 1-Star': 36.89,
  'Purple 2-Star': 39.78,
  'Purple 3-Star': 42.67,
  'Purple T1': 45.56,
  'Purple T1 1-Star': 48.45,
  'Purple T1 2-Star': 51.34,
  'Purple T1 3-Star': 54.23,
  Gold: 56.78,
  'Gold 1-Star': 59.33,
  'Gold 2-Star': 61.88,
  'Gold 3-Star': 64.43,
  'Gold T1': 66.98,
  'Gold T1 1-Star': 69.53,
  'Gold T1 2-Star': 72.08,
  'Gold T1 3-Star': 74.63,
  'Gold T2': 77.18,
  'Gold T2 1-Star': 79.73,
  'Gold T2 2-Star': 82.28,
  'Gold T2 3-Star': 85.0,
  Red: 89.25,
  'Red 1-Star': 93.5,
  'Red 2-Star': 97.75,
  'Red 3-Star': 102,
  'Red T1': 106.25,
  'Red T1 1-Star': 110.5,
  'Red T1 2-Star': 114.75,
  'Red T1 3-Star': 119,
  'Red T2': 123.25,
  'Red T2 1-Star': 127.5,
  'Red T2 2-Star': 131.75,
  'Red T2 3-Star': 136,
  'Red T3': 140.25,
  'Red T3 1-Star': 144.5,
  'Red T3 2-Star': 148.75,
  'Red T3 3-Star': 153,
  'Red T4': 161.5,
  'Red T4 1-Star': 170,
  'Red T4 2-Star': 178.5,
  'Red T4 3-Star': 187
};

export const chiefStatPct = (label: string) => TIER_PCT[label] ?? 0;
export const chiefPower = (label: string) => chiefStatPct(label) * 24000;

export interface ChiefGearGain {
  troop: ChiefTroop;
  /** Troop Attack% AND Defense% gained (same value applies to both). */
  statPct: number;
  power: number;
}

/** Stat/power gain from upgrading a piece between two tier labels (clamped ≥ 0). */
export function chiefGearGain(pieceId: string, from: string, to: string): ChiefGearGain {
  return {
    troop: CHIEF_PIECE_TROOP[pieceId] ?? 'infantry',
    statPct: Math.max(0, chiefStatPct(to) - chiefStatPct(from)),
    power: Math.max(0, chiefPower(to) - chiefPower(from))
  };
}

/**
 * Chief gear CHARMS — each charm (3 slots per piece) buffs the SAME troop as its
 * piece, granting equal Lethality% and Health% (cumulative per charm, index =
 * charm level 0..16). Verified 2026-06-17 (woscalculator + wostools + wiki agree).
 */
export const CHARM_STAT_BY_LEVEL = [
  0, 9, 12, 16, 19, 25, 30, 35, 40, 45, 50, 55, 64, 73, 82, 91, 100
];
export const charmStatPct = (level: number) =>
  CHARM_STAT_BY_LEVEL[Math.max(0, Math.min(16, Math.round(level)))] ?? 0;

/** Lethality%/Health% gain (equal) from leveling one charm between two levels. */
export const charmStatGain = (from: number, to: number) =>
  Math.max(0, charmStatPct(to) - charmStatPct(from));
