/**
 * Hero-gear STAT bonuses (power gain), as closed-form per-enhancement-level
 * curves. Two independent community sources cross-validate exactly on the key
 * curve (wostools.net's data chunk and the WhyBanditWhy master sheet):
 * Lethality% L0=3.33 · L10=8 · L20=12.66 · L100=50. Community-MODELLED, not an
 * official datamine — surface a "verify in-game" flag. Verified 2026-06-17.
 *
 * Piece groups: Goggles/Boots add Hero ATK + the troop's Lethality%; Gloves/Belt
 * add Hero DEF + the troop's Troop-Health%. Hero HP is on every piece. The
 * command % (Lethality / Troop-Health) and Hero HP per troop are the same curve
 * for both groups; only the flat ATK/DEF combat stat differs.
 *
 * Mastery Forging (Mythic+) is a flat ×(1 + 0.10·level) multiplier on ALL of a
 * piece's bonuses (×1.1 at M1 … ×3.0 at M20) — so a Gold piece at enh100/M20
 * gives 50%×3 = 150% Lethality, matching the ×4-piece total of 600% reported
 * elsewhere. Empowerment (Legendary) milestone buffs are NOT modelled here yet.
 */

export type GearTroop = 'infantry' | 'lancer' | 'marksman';
/** 'atk' = Goggles/Boots (Hero ATK + Lethality); 'def' = Gloves/Belt (Hero DEF + Troop Health). */
export type GearGroup = 'atk' | 'def';

export const pieceGroup = (pieceId: string): GearGroup =>
  pieceId === 'goggles' || pieceId === 'boots' ? 'atk' : 'def';

// Base curves at enhancement level i (0..100). Each reproduces its L100 anchor
// exactly (e.g. command 50.0, inf ATK 345, inf HP 3375).
const command = (i: number) => 3.33 + Math.round((700 * i) / 15) / 100; // Lethality% or TroopHealth%
const atk = {
  infantry: (i: number) => 23 + Math.floor((29 * i) / 9),
  lancer: (i: number) => 30 + Math.floor((21 * i) / 5),
  marksman: (i: number) => Math.round(36 + (51 * i) / 10)
};
const def = (i: number) => 30 + Math.floor((21 * i) / 5); // same for all troops
const hp = {
  infantry: (i: number) => 225 + 31 * i + Math.floor(i / 2),
  lancer: (i: number) => 150 + 21 * i,
  marksman: (i: number) => Math.round(112 + 15.75 * i)
};

const clampLvl = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const masteryMult = (m: number) => 1 + 0.1 * Math.max(0, Math.min(20, m));

export interface GearStats {
  /** Present only for 'atk' pieces. */
  heroAtk?: number;
  /** Present only for 'def' pieces. */
  heroDef?: number;
  heroHp: number;
  /** Lethality% ('atk' group) or Troop-Health% ('def' group). */
  commandPct: number;
  commandKind: 'lethality' | 'troopHealth';
}

/** Total stats a piece grants at a given enhancement + mastery state. */
export function gearStatsAt(
  group: GearGroup,
  troop: GearTroop,
  enhLevel: number,
  masteryLevel = 0
): GearStats {
  const i = clampLvl(enhLevel);
  const mult = masteryMult(masteryLevel);
  const heroHp = hp[troop](i) * mult;
  const commandPct = command(i) * mult;
  if (group === 'atk') {
    return { heroAtk: atk[troop](i) * mult, heroHp, commandPct, commandKind: 'lethality' };
  }
  return { heroDef: def(i) * mult, heroHp, commandPct, commandKind: 'troopHealth' };
}

/** Stat GAIN from (enhFrom, masFrom) → (enhTo, masTo). Negative deltas clamp to 0. */
export function gearStatGain(
  group: GearGroup,
  troop: GearTroop,
  enhFrom: number,
  enhTo: number,
  masFrom = 0,
  masTo = 0
): GearStats {
  const from = gearStatsAt(group, troop, enhFrom, masFrom);
  const to = gearStatsAt(group, troop, enhTo, masTo);
  const pos = (a: number, b: number) => Math.max(0, b - a);
  return {
    heroAtk: group === 'atk' ? pos(from.heroAtk ?? 0, to.heroAtk ?? 0) : undefined,
    heroDef: group === 'def' ? pos(from.heroDef ?? 0, to.heroDef ?? 0) : undefined,
    heroHp: pos(from.heroHp, to.heroHp),
    commandPct: pos(from.commandPct, to.commandPct),
    commandKind: to.commandKind
  };
}
