/**
 * "Where to get it" reference for every upgrade material. The calculators say
 * HOW MUCH you need; this says WHERE it reliably comes from.
 *
 * Researched 2026-06-09 (web). Focus is EVERGREEN/recurring sources — event
 * SHOPS and their prices rotate, so we list the durable activities/shops, not a
 * snapshot of the current event. `confidence` flags how sure we are; some
 * materials are gated behind packs or are ambiguous in-game (see `note`).
 *
 * Source strings are intentionally kept in English: they're WOS proper nouns
 * (building / event / shop names) that stay English in every client locale.
 * The page chrome + material names are localised via i18n.
 */

export type Confidence = 'high' | 'medium' | 'low';

/** Grouping for the guide; maps to i18n upgrade.materials.systems.* */
export type MaterialSystem =
  | 'economy'
  | 'fireCrystal'
  | 'chiefGear'
  | 'chiefCharms'
  | 'pets'
  | 'heroGear'
  | 'heroes'
  | 'experts';

export interface MaterialInfo {
  /** Matches a key in upgrade.res.* */
  key: string;
  system: MaterialSystem;
  /** One-line "what it's for". */
  use: string;
  /** Reliable, recurring ways to get it. */
  sources: string[];
  confidence: Confidence;
  note?: string;
}

export const MATERIALS: MaterialInfo[] = [
  // --- Base economy ---
  {
    key: 'meat',
    system: 'economy',
    use: 'Population & troop training; most upgrades.',
    sources: [
      'Hunter’s Hut production',
      'World-map meat tiles',
      'Idle income',
      'Alliance farms',
      'Daily / Intel missions'
    ],
    confidence: 'high'
  },
  {
    key: 'wood',
    system: 'economy',
    use: 'Core building & troop material.',
    sources: [
      'Sawmill production',
      'World-map wood tiles',
      'Idle income',
      'Alliance farms',
      'Daily / Intel missions'
    ],
    confidence: 'high'
  },
  {
    key: 'coal',
    system: 'economy',
    use: 'Furnace & upgrades (usually tight).',
    sources: [
      'Coal Mine production',
      'World-map coal tiles (prioritise)',
      'Idle income',
      'Alliance farms',
      'Daily / Intel missions'
    ],
    confidence: 'high',
    note: 'Coal & iron are the common bottlenecks — gathering tiles are the main top-up.'
  },
  {
    key: 'iron',
    system: 'economy',
    use: 'Advanced buildings & crafting.',
    sources: [
      'Iron Mine production',
      'World-map iron tiles (prioritise)',
      'Idle income',
      'Alliance farms',
      'Daily / Intel missions'
    ],
    confidence: 'high'
  },
  {
    key: 'steel',
    system: 'economy',
    use: 'Higher-tier builds & progression.',
    sources: [
      'Steel Mill production',
      'Exploration idle income + stage clears',
      'Intel missions',
      'Daily quests / events',
      'Packs'
    ],
    confidence: 'high',
    note: 'Mainly a passive Exploration source — no near-city tile like the 4 basics.'
  },
  {
    key: 'crystal',
    system: 'economy',
    use: 'Advanced upgrades / Chief Gear (in-game naming is ambiguous).',
    sources: [
      'Arena & recurring combat rewards',
      'Daily / weekly missions',
      'Alliance & event shops',
      'Packs'
    ],
    confidence: 'low',
    note: 'In-game "Crystal" overlaps with "Fire Crystal" naming — double-check which one you mean.'
  },

  // --- Fire Crystal line ---
  {
    key: 'fireCrystal',
    system: 'fireCrystal',
    use: 'Furnace & building upgrades into the FC ages.',
    sources: [
      'Crystal Lab daily refines (resources → FC)',
      'Daily & Intel missions',
      'Crystal Reactivation event (~2×/month)',
      'Exploration / beast drops',
      'FC packs'
    ],
    confidence: 'high',
    note: 'Needs Furnace 30 + Fire Crystal Age. Daily refine count scales with state FC level.'
  },
  {
    key: 'refinedFireCrystal',
    system: 'fireCrystal',
    use: 'FC6–FC10 building upgrades.',
    sources: [
      'Crystal Lab weekly Super Refine (FC → RFC, ~100/wk, 5 tiers)',
      'Occasional event / pack grants'
    ],
    confidence: 'high',
    note: 'See the refinement estimator in the Buildings tool for the FC → RFC cost & time.'
  },
  {
    key: 'fcShard',
    system: 'fireCrystal',
    use: 'Builds into Fire Crystals for FC tiers.',
    sources: [
      'Daily missions',
      'FC → Shard & Steel exchanges (daily-capped)',
      'Intel missions / Monthly Pass',
      'Events & boss drops',
      'Packs'
    ],
    confidence: 'high',
    note: 'Exchanges are daily-capped, so the F2P rate is limited — plan ahead.'
  },

  // --- Chief Gear ---
  {
    key: 'hardenedAlloy',
    system: 'chiefGear',
    use: 'Chief Gear forging (used at every tier).',
    sources: [
      'Hunt Lv22+ beasts (scales with level)',
      'Polar Terror rallies (Lv3+)',
      'Crazy Joe event',
      'Alliance Championship Shop',
      'Enhancement Material Exchange'
    ],
    confidence: 'high',
    note: 'Beast hunting is the cheap daily farm.'
  },
  {
    key: 'polishingSolution',
    system: 'chiefGear',
    use: 'Chief Gear forging (the scarcer of the pair).',
    sources: [
      'Crazy Joe event (primary)',
      'Alliance Championship Shop',
      'Event milestone / ranking rewards',
      'Enhancement Material Exchange',
      'Packs'
    ],
    confidence: 'high',
    note: 'Scarcer than Hardened Alloy — worth spending Championship Badges here.'
  },
  {
    key: 'designPlans',
    system: 'chiefGear',
    use: 'Chief Gear from Blue (2★) up; feeds the Lunar Amber exchange.',
    sources: [
      'Crazy Joe & recurring events',
      'Alliance Championship Shop',
      'Foundry / Power Region / Canyon shops',
      'Enhancement Material Exchange',
      'Packs'
    ],
    confidence: 'high'
  },
  {
    key: 'lunarAmber',
    system: 'chiefGear',
    use: 'Legendary Chief Gear (Gold T2 / 3★ and up).',
    sources: [
      'Enhancement Exchange (10 Design Plans → 1)',
      'Packs / bundles',
      'Occasional event rewards'
    ],
    confidence: 'medium',
    note: 'No cheap farm — effectively packs or the Design Plans exchange.'
  },

  // --- Chief Charms ---
  {
    key: 'charmDesign',
    system: 'chiefCharms',
    use: 'Chief Charms upgrading (lowest tier).',
    sources: [
      'Frostfire Mine event',
      'Castle Battle event',
      'Giant Elk pet (passive via Intel)',
      'Foundry / Power Region / Canyon shops',
      'Enhancement Material Exchange'
    ],
    confidence: 'high',
    note: 'Giant Elk pet is the standout passive farm.'
  },
  {
    key: 'charmGuide',
    system: 'chiefCharms',
    use: 'Chief Charms upgrading (mid tier).',
    sources: [
      'Frostfire Mine event',
      'Castle Battle event',
      'Foundry / Power Region / Canyon shops',
      'Recurring events',
      'Enhancement Material Exchange'
    ],
    confidence: 'high'
  },
  {
    key: 'charmSecret',
    system: 'chiefCharms',
    use: 'Chief Charms upgrading (top tier — the bottleneck).',
    sources: [
      'Frostfire Mine event (top ranks)',
      'Castle Battle event',
      'Foundry / Power Region / Canyon shops',
      'Event milestones / packs',
      'Enhancement Material Exchange'
    ],
    confidence: 'medium',
    note: 'Rarest charm mat. (Charm levels 12–16 use a separate "Jewel Secret" — not this.)'
  },

  // --- Pets ---
  {
    key: 'petFood',
    system: 'pets',
    use: 'Levels pets in the Beast Cage.',
    sources: [
      'Pet Adventures (4/day)',
      'Beast Whisperer event',
      'Ally Treasures',
      'Daily / event rewards'
    ],
    confidence: 'high'
  },
  {
    key: 'tamingManual',
    system: 'pets',
    use: 'Pet skill advancement (every 10 levels).',
    sources: [
      'Pet Adventures (primary)',
      'Beast Whisperer event',
      'Pet shops / packs',
      'Ally Treasures'
    ],
    confidence: 'high'
  },
  {
    key: 'energizingPotion',
    system: 'pets',
    use: 'Pet advancement (from level 30).',
    sources: ['Pet Adventures', 'Beast Whisperer event', 'Pet shops / packs'],
    confidence: 'high',
    note: 'Only needed at level 30+, so demand is back-loaded.'
  },
  {
    key: 'strengtheningSerum',
    system: 'pets',
    use: 'Pet advancement (from level 50).',
    sources: ['Pet Adventures', 'Beast Whisperer event', 'Pet shops / packs'],
    confidence: 'high',
    note: 'Rarest pet mat — the usual high-level bottleneck.'
  },

  // --- Hero Gear ---
  {
    key: 'mythicHeroGear',
    system: 'heroGear',
    use: 'Mythic hero gear pieces (4 slots/hero).',
    sources: [
      'Arena Shop (Mythic gear chest)',
      'Exploration (chest at battle 300, then 1/100 wins)',
      'Frosty Fortune event',
      'Lucky Hero Gear Chests',
      'Packs'
    ],
    confidence: 'high',
    note: 'Arena + Exploration are the reliable F2P routes.'
  },
  {
    key: 'widget',
    system: 'heroGear',
    use: 'Enhances Exclusive (hero-specific) gear.',
    sources: [
      'Enigma event (hero-specific)',
      'Mystery Shop',
      'Hall of Heroes',
      'Frosty Fortune event',
      'Packs'
    ],
    confidence: 'medium',
    note: 'Largely event/shop-gated; specific event names rotate.'
  },
  {
    key: 'gearXp',
    system: 'heroGear',
    use: 'Enhancement XP to raise gear level (0→100).',
    sources: [
      'Exploration drops',
      'Arena battles / Arena Shop',
      'Sacrificing spare gear as fodder',
      'Events'
    ],
    confidence: 'high'
  },
  {
    key: 'essenceStones',
    system: 'heroGear',
    use: 'Hero Gear Mastery forging (Mythic gear past lvl 20).',
    sources: [
      'Mystery Shop (Mystery Badges)',
      'Arena Shop (Arena Tokens)',
      'Events (e.g. Mia’s Fortune Hut)',
      'Gear / event packs'
    ],
    confidence: 'medium',
    note: 'Belongs to Hero Gear Mastery (not pets), per current sources.'
  },

  // --- Heroes ---
  {
    key: 'heroShard',
    system: 'heroes',
    use: 'Hero recruitment & star promotion.',
    sources: [
      'Intel missions',
      'Polar Terror rallies (General shards)',
      'Foundry / Arena / VIP / Tundra shops',
      'Lucky Wheel (events)',
      'Duplicate recruits, packs'
    ],
    confidence: 'high',
    note: 'Hero-specific shards lock to one hero; General shards convert within a rarity.'
  },

  // --- Experts ---
  {
    key: 'expertSigil',
    system: 'experts',
    use: 'Advances Experts (Furnace 25+).',
    sources: [
      'Tundra Trek encounters (Common Sigils)',
      'Frontier Trek (target a chosen Expert)',
      'VIP Shop (Frontier Trek supplies)',
      'Passes / packs'
    ],
    confidence: 'high',
    note: 'Common Sigils convert to a specific Expert; the Treks are the engine.'
  },
  {
    key: 'bookOfKnowledge',
    system: 'experts',
    use: 'Unlocks the next Expert Skill phase (at skill lvl 10).',
    sources: [
      'Expert Skill level-up rewards',
      'Trek drops (Tundra / Frontier)',
      'Pass rewards',
      'Alliance Championship Shop',
      'Packs'
    ],
    confidence: 'high',
    note: 'Expert system — not the main Research Center.'
  }
];

/** Order the systems appear on the page. */
export const MATERIAL_SYSTEMS: MaterialSystem[] = [
  'economy',
  'fireCrystal',
  'chiefGear',
  'chiefCharms',
  'pets',
  'heroGear',
  'heroes',
  'experts'
];
