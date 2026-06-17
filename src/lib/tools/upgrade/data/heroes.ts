// Hero upgrade ladders. Each track was independently cross-checked (two sources)
// and ships verified.
import type { LevelCost, ResourceBag } from '../types';

/**
 * Hero Gear — Mastery, levels 1→20. Essence Stones = level × 10; Mythic Hero
 * Gear 1→10 is added at levels 11–20. Confirmed: BlueStacks + whiteoutdata.
 * (Cost is per hero gear piece.)
 */
export const HERO_MASTERY: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  ...Array.from({ length: 20 }, (_, i): LevelCost => {
    const n = i + 1;
    const cost: ResourceBag = { essenceStones: n * 10 };
    if (n >= 11) cost.mythicHeroGear = n - 10;
    return { label: String(n), cost, time: 0 };
  })
];

/** Exclusive Hero Gear, levels 1→10. Widgets = level × 5. Confirmed: heaven-guardian. */
export const HERO_EXCLUSIVE: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  ...Array.from(
    { length: 10 },
    (_, i): LevelCost => ({
      label: String(i + 1),
      cost: { widget: (i + 1) * 5 },
      time: 0
    })
  )
];

/**
 * Hero Star promotion, 0★→5★. Hero Shards to reach each star (total 1065 to 5★,
 * excluding the 10-shard recruit). Confirmed: wos.wiki.
 */
export const HERO_STARS: LevelCost[] = [
  { label: '0★', cost: {}, time: 0 },
  { label: '1★', cost: { heroShard: 10 }, time: 0 },
  { label: '2★', cost: { heroShard: 40 }, time: 0 },
  { label: '3★', cost: { heroShard: 115 }, time: 0 },
  { label: '4★', cost: { heroShard: 300 }, time: 0 },
  { label: '5★', cost: { heroShard: 600 }, time: 0 }
];

/**
 * Hero Gear Enhancement (the gear LEVEL track), 0→100, fed by Enhancement XP
 * (XP Components / sacrificed gear: Grey 10 · Green 30 · Blue 60 · Purple 150).
 * Per-level XP extracted verbatim from the wostools hero-gear-calculator data
 * (total 0→100 = 71,320 XP), then level 100 is the imbue gate = 2 Mythic Hero
 * Gear (unlocks the post-100 Ascended track, not modelled). Cost is per hero
 * gear piece (Goggles / Gloves / Belt / Boots).
 */
function enhanceXp(n: number): number {
  if (n <= 29) return 10 + (n - 1) * 5;
  if (n <= 39) return 160 + (n - 30) * 10;
  if (n <= 59) return 270 + (n - 40) * 20;
  if (n <= 69) return 680 + (n - 60) * 30;
  if (n <= 79) return 990 + (n - 70) * 40;
  if (n <= 91) return 1400 + (n - 80) * 50;
  return 2050 + (n - 92) * 50; // levels 92–99
}
export const HERO_ENHANCE: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  ...Array.from(
    { length: 99 },
    (_, i): LevelCost => ({ label: String(i + 1), cost: { gearXp: enhanceXp(i + 1) }, time: 0 })
  ),
  { label: '100', cost: { mythicHeroGear: 2 }, time: 0 } // imbue gate to Ascended
];

/**
 * Hero Gear Empowerment — the post-100 "Ascended/Legendary" track. After a
 * piece hits Enhancement 100 + Mastery 10 it ascends, then empowers in 5
 * milestones (gear level 20→100) keyed on Mithril + Mythic Hero Gear. Per piece:
 * 150 Mithril + 33 Mythic Hero Gear to milestone 100. SINGLE-SOURCED (wiki +
 * helpshift) — flag for in-game verification before treating as final.
 */
export const HERO_EMPOWER: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  { label: '20', cost: { mithril: 10, mythicHeroGear: 3 }, time: 0 },
  { label: '40', cost: { mithril: 20, mythicHeroGear: 5 }, time: 0 },
  { label: '60', cost: { mithril: 30, mythicHeroGear: 5 }, time: 0 },
  { label: '80', cost: { mithril: 40, mythicHeroGear: 10 }, time: 0 },
  { label: '100', cost: { mithril: 50, mythicHeroGear: 10 }, time: 0 }
];

/**
 * Mythic→Legendary ascension (gold→red). A discrete promotion node, gated by
 * Enhancement 100 + Mastery 10, that sacrifices 2 more Mythic Hero Gear of the
 * same type. Confirmed across sources 2026-06-17. Empowerment (HERO_EMPOWER) is
 * only available after this ascension.
 */
export const GEAR_ASCENSION_COST: ResourceBag = { mythicHeroGear: 2 };

/** The four normal hero-gear pieces — shared cost ladder, swappable within a troop. */
export const HERO_GEAR_PIECES = [
  { id: 'goggles', name: 'Goggles' },
  { id: 'gloves', name: 'Gloves' },
  { id: 'belt', name: 'Belt' },
  { id: 'boots', name: 'Boots' }
] as const;

/**
 * GRANULAR star progression. Each of the 5 stars is split into 6 segments, and
 * the 6th segment of each star jumps. Values below are the shards to COMPLETE
 * each segment (S1..S6). 30 segments total = 1065 shards to 5★ (the 10 recruit
 * shards to first unlock the hero are separate). Verified in-game 2026-06-17.
 *
 * Shards come in three non-interchangeable types (Mythic / Epic / Rare) chosen
 * by the hero's rarity — but these COUNTS are identical across types, so the
 * maths is rarity-agnostic; the planner just tags which bucket to spend from.
 */
export const STAR_SEGMENT_SHARDS: number[][] = [
  [1, 1, 2, 2, 2, 2], // 1★ = 10
  [5, 5, 5, 5, 5, 15], // 2★ = 40
  [15, 15, 15, 15, 15, 40], // 3★ = 115
  [40, 40, 40, 40, 40, 100], // 4★ = 300
  [100, 100, 100, 100, 100, 100] // 5★ = 600
];

/** Flat per-segment cost: FLAT_STAR_SHARDS[i] = shards to go from index i → i+1. */
const FLAT_STAR_SHARDS = STAR_SEGMENT_SHARDS.flat();
/** Linear segment index runs 0 (0★) → 30 (5★). */
export const STAR_MAX_INDEX = FLAT_STAR_SHARDS.length; // 30
export const STAR_SEGMENTS_PER_STAR = 6;

/** Linear index of a granular position: `star` full stars + `seg` segments into the next. */
export function starIndex(star: number, seg: number): number {
  return Math.max(0, Math.min(STAR_MAX_INDEX, star * STAR_SEGMENTS_PER_STAR + seg));
}

/** Human label for a linear index, e.g. 18 → "3★", 21 → "3★ +3/6", 30 → "5★". */
export function starLabel(index: number): string {
  const i = Math.max(0, Math.min(STAR_MAX_INDEX, index));
  if (i >= STAR_MAX_INDEX) return '5★';
  const star = Math.floor(i / STAR_SEGMENTS_PER_STAR);
  const seg = i % STAR_SEGMENTS_PER_STAR;
  return seg === 0 ? `${star}★` : `${star}★ +${seg}/6`;
}

/**
 * Shards still needed to go from one granular position to another.
 * `savedToward` = shards already banked toward completing the current (from)
 * segment; subtracted from the total (never below 0).
 */
export function starShardsBetween(fromIndex: number, toIndex: number, savedToward = 0): number {
  const a = Math.max(0, Math.min(STAR_MAX_INDEX, fromIndex));
  const b = Math.max(0, Math.min(STAR_MAX_INDEX, toIndex));
  if (b <= a) return 0;
  let sum = 0;
  for (let i = a; i < b; i++) sum += FLAT_STAR_SHARDS[i];
  return Math.max(0, sum - Math.max(0, savedToward));
}

export interface HeroTrack {
  id: string;
  /** i18n suffix under upgrade.heroes.tracks.* */
  i18n: string;
  ladder: LevelCost[];
  storageKey: string;
}

export const HERO_TRACKS: HeroTrack[] = [
  { id: 'mastery', i18n: 'mastery', ladder: HERO_MASTERY, storageKey: 'upgrade-hero-mastery-v1' },
  {
    id: 'exclusive',
    i18n: 'exclusive',
    ladder: HERO_EXCLUSIVE,
    storageKey: 'upgrade-hero-exclusive-v1'
  },
  { id: 'stars', i18n: 'stars', ladder: HERO_STARS, storageKey: 'upgrade-hero-stars-v1' },
  { id: 'enhance', i18n: 'enhance', ladder: HERO_ENHANCE, storageKey: 'upgrade-hero-enhance-v1' }
];
