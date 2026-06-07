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
