/**
 * Core types for the upgrade planner.
 *
 * Design note: the maths of an upgrade is trivial — it's just the sum of each
 * level's cost across the range. *All* the risk is in the DATA being right, so
 * every table carries provenance (`DataMeta`) and the hub hides anything not
 * yet cross-checked. See `engine.ts` for the (pure, tested) summation.
 */

/**
 * Every spendable resource we model. Base four are the day-one currencies;
 * the fire-crystal pair covers the post-30 progression the game added later:
 *   - `fireCrystal`        — Fire Crystal furnace, FC1–FC5
 *   - `refinedFireCrystal` — Refined Fire Crystal, FC6–FC8 (and beyond)
 * `crystal` is the generic Crystal currency used by other (future) calculators.
 */
export type ResourceKey =
  | 'meat'
  | 'wood'
  | 'coal'
  | 'iron'
  | 'crystal'
  | 'steel'
  | 'fireCrystal'
  | 'refinedFireCrystal'
  | 'fcShard'
  // Chief gear materials
  | 'hardenedAlloy'
  | 'polishingSolution'
  | 'designPlans'
  | 'lunarAmber'
  // Chief charm materials
  | 'charmDesign'
  | 'charmGuide'
  | 'charmSecret'
  // Pet materials
  | 'petFood'
  | 'tamingManual'
  | 'energizingPotion'
  | 'strengtheningSerum'
  // Hero materials
  | 'essenceStones'
  | 'mythicHeroGear'
  | 'widget'
  | 'heroShard'
  | 'mythicShard'
  | 'epicShard'
  | 'rareShard'
  | 'mithril'
  | 'gearXp'
  // Expert (Dawn Academy) materials
  | 'expertSigil'
  | 'bookOfKnowledge';

/** A sparse map of resource → amount. Absent keys mean "none of that". */
export type ResourceBag = Partial<Record<ResourceKey, number>>;

/** Display metadata for a resource — icon + i18n key + accent colour. */
export interface ResourceDef {
  key: ResourceKey;
  /** Emoji placeholder; swap for sprites later without touching callers. */
  icon: string;
  color: string;
}

/**
 * Canonical render order. The buildings calculator only ever produces the
 * first four, but later tools (FC buildings, gear) lean on the rest.
 */
export const RESOURCES: ResourceDef[] = [
  { key: 'meat', icon: '🥩', color: '#f87171' },
  { key: 'wood', icon: '🪵', color: '#a3e635' },
  { key: 'coal', icon: '⛏️', color: '#94a3b8' },
  { key: 'iron', icon: '⚙️', color: '#60a5fa' },
  { key: 'crystal', icon: '💎', color: '#22d3ee' },
  { key: 'steel', icon: '🪙', color: '#cbd5e1' },
  { key: 'fireCrystal', icon: '🔥', color: '#fb923c' },
  { key: 'refinedFireCrystal', icon: '✨', color: '#c084fc' },
  { key: 'fcShard', icon: '🔸', color: '#fb7185' },
  { key: 'hardenedAlloy', icon: '🔩', color: '#94a3b8' },
  { key: 'polishingSolution', icon: '🧪', color: '#34d399' },
  { key: 'designPlans', icon: '📜', color: '#fbbf24' },
  { key: 'lunarAmber', icon: '🟡', color: '#f59e0b' },
  { key: 'charmDesign', icon: '📃', color: '#fcd34d' },
  { key: 'charmGuide', icon: '📕', color: '#d97706' },
  { key: 'charmSecret', icon: '📓', color: '#ef4444' },
  { key: 'petFood', icon: '🍗', color: '#f59e0b' },
  { key: 'tamingManual', icon: '📖', color: '#a3e635' },
  { key: 'energizingPotion', icon: '⚗️', color: '#22d3ee' },
  { key: 'strengtheningSerum', icon: '💉', color: '#f472b6' },
  { key: 'essenceStones', icon: '🔆', color: '#fcd34d' },
  { key: 'mythicHeroGear', icon: '🎖️', color: '#f87171' },
  { key: 'widget', icon: '🔧', color: '#94a3b8' },
  { key: 'heroShard', icon: '🔱', color: '#c084fc' },
  { key: 'mythicShard', icon: '💠', color: '#fb7185' },
  { key: 'epicShard', icon: '💠', color: '#c084fc' },
  { key: 'rareShard', icon: '💠', color: '#60a5fa' },
  { key: 'mithril', icon: '🔘', color: '#cbd5e1' },
  { key: 'gearXp', icon: '⭐', color: '#fcd34d' },
  { key: 'expertSigil', icon: '🔷', color: '#38bdf8' },
  { key: 'bookOfKnowledge', icon: '📚', color: '#a78bfa' }
];

/** Cost + time to upgrade INTO one level from the previous one. */
export interface LevelCost {
  /**
   * Level label. Numeric levels are "1".."30"; Fire Crystal levels continue
   * as "FC1".."FC5" (fire-crystal furnace), "FC6".."FC8" (refined), "FC9"+
   * for the newer tiers. Kept as a string so the range UI reads naturally.
   */
  label: string;
  /** Resources to reach this level from the previous. Empty for the base level. */
  cost: ResourceBag;
  /** Build time in seconds (raw, before any speedups). */
  time: number;
  /** Optional power granted at this level. */
  power?: number;
}

/** Provenance for a table — the heart of the accuracy guarantee. */
export interface DataMeta {
  /** Where the numbers came from (URL or repo + file). */
  source: string;
  /**
   * True only once cross-checked against 2+ independent sources. The hub hides
   * unverified tables in production (project rule), so users never act on
   * numbers we haven't confirmed.
   */
  verified: boolean;
  /** ISO date (YYYY-MM-DD) of the last verification, when verified. */
  verifiedAt?: string;
  /** Known gaps or caveats worth surfacing. */
  notes?: string;
}

/** A single upgradable thing (a building, a gear slot, …) with its level ladder. */
export interface UpgradeTable {
  id: string;
  /** Fallback English name; UI prefers the i18n entry when present. */
  name: string;
  /** Ordered ladder; `levels[0]` is the base/start level (empty cost). */
  levels: LevelCost[];
  meta: DataMeta;
}
