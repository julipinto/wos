/**
 * Building Construction Power per level (cumulative). Data: wostools.net
 * building-calculator chunk (community), regenerated via scratch/refresh-buildings.mjs
 * → building-power.json. Buildings grant POWER but no troop combat stats (camps
 * are tier-gates; only War Academy feeds combat, via research not level).
 */
import POWER from './data/building-power.json';

const TABLE = POWER as Record<string, Record<string, number>>;

/** Cumulative construction power at a building's level label (0 if unknown). */
export function buildingPowerAt(buildingId: string, label: string): number {
  return TABLE[buildingId]?.[label] ?? 0;
}

/** Power gained upgrading a building from→to. 0 if either level is unknown. */
export function buildingPowerGain(buildingId: string, from: string, to: string): number {
  const t = TABLE[buildingId];
  if (!t) return 0;
  const a = t[from];
  const b = t[to];
  if (a == null || b == null) return 0;
  return Math.max(0, b - a);
}

/** True if we have a power table for this building. */
export const hasBuildingPower = (buildingId: string): boolean => buildingId in TABLE;
