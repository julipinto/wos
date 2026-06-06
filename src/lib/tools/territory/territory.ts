/**
 * Alliance territory / hive layout model. Pure logic (no DOM) so it's unit-
 * testable. The interactive grid page renders these objects and the computed
 * connected-territory cells.
 *
 * Game rules modelled (sources: WOS wiki — Alliance Territory / banner tips):
 *  - A Banner covers a 7×7 square centred on it.
 *  - Territory is the connected union of banner coverage seeded from the HQ:
 *    a banner counts only if its coverage overlaps the HQ footprint or an
 *    already-connected banner's coverage. Disconnected banners would expire.
 *  - Other structures (city, bear trap, farm, obstacle) just occupy cells.
 */

export type TerritoryType = 'hq' | 'banner' | 'city' | 'bearTrap' | 'farm' | 'obstacle';

export interface TerritoryDef {
  /** footprint width / height in cells */
  w: number;
  h: number;
  /** banner coverage square side (odd), centred on the object's first cell */
  coverage?: number;
  /** seeds territory (the HQ) */
  seed?: boolean;
  /** in-game placement cap (for the counter) */
  max?: number;
  /** i18n suffix under territory.obj.* */
  i18n: string;
  color: string;
}

export const OBJECT_DEFS: Record<TerritoryType, TerritoryDef> = {
  hq: { w: 3, h: 3, seed: true, max: 2, i18n: 'hq', color: '#93d4ff' },
  banner: { w: 1, h: 1, coverage: 7, i18n: 'banner', color: '#fbbf24' },
  city: { w: 2, h: 2, i18n: 'city', color: '#4ade80' },
  bearTrap: { w: 3, h: 3, max: 2, i18n: 'bearTrap', color: '#fb7185' },
  farm: { w: 2, h: 2, i18n: 'farm', color: '#c084fc' },
  obstacle: { w: 1, h: 1, i18n: 'obstacle', color: '#64748b' }
};

export const TERRITORY_TYPES = Object.keys(OBJECT_DEFS) as TerritoryType[];

export interface PlacedObject {
  id: string;
  type: TerritoryType;
  /** top-left grid cell */
  x: number;
  y: number;
}

const key = (x: number, y: number) => `${x},${y}`;

/** Cells occupied by an object's footprint. */
export function footprintCells(o: PlacedObject): string[] {
  const def = OBJECT_DEFS[o.type];
  const out: string[] = [];
  for (let dx = 0; dx < def.w; dx++)
    for (let dy = 0; dy < def.h; dy++) out.push(key(o.x + dx, o.y + dy));
  return out;
}

/** The 7×7 (or `coverage`×`coverage`) cells a banner covers, centred on its cell. */
export function coverageCells(o: PlacedObject): string[] {
  const def = OBJECT_DEFS[o.type];
  if (!def.coverage) return [];
  const r = (def.coverage - 1) / 2;
  const out: string[] = [];
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++) out.push(key(o.x + dx, o.y + dy));
  return out;
}

export interface TerritoryResult {
  /** every cell inside connected territory */
  cells: Set<string>;
  /** ids of banners connected to the HQ network */
  connected: Set<string>;
  /** ids of banners that are placed but NOT connected (would expire) */
  orphaned: Set<string>;
}

/**
 * Flood-fill territory from the HQ through overlapping banner coverage.
 */
export function computeTerritory(objects: PlacedObject[]): TerritoryResult {
  const seed = new Set<string>();
  for (const o of objects)
    if (OBJECT_DEFS[o.type].seed) for (const c of footprintCells(o)) seed.add(c);

  const banners = objects.filter((o) => o.type === 'banner');
  const cov = new Map(banners.map((b) => [b.id, coverageCells(b)]));
  const connected = new Set<string>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const b of banners) {
      if (connected.has(b.id)) continue;
      const cells = cov.get(b.id)!;
      const touchesSeed = cells.some((c) => seed.has(c));
      const touchesConnected =
        !touchesSeed &&
        banners.some((o) => connected.has(o.id) && cov.get(o.id)!.some((c) => cells.includes(c)));
      if (touchesSeed || touchesConnected) {
        connected.add(b.id);
        changed = true;
      }
    }
  }

  const cells = new Set(seed);
  for (const b of banners) if (connected.has(b.id)) for (const c of cov.get(b.id)!) cells.add(c);

  const orphaned = new Set(banners.filter((b) => !connected.has(b.id)).map((b) => b.id));
  return { cells, connected, orphaned };
}
