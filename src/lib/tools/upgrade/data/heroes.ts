// Hero upgrade ladders. Each track was independently cross-checked (two sources)
// and ships verified. The mythic-gear per-level XP track is NOT here — its curve
// is published only as images and couldn't be confirmed.
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
  { id: 'stars', i18n: 'stars', ladder: HERO_STARS, storageKey: 'upgrade-hero-stars-v1' }
];
