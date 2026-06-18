/**
 * Real in-game item icons (PNG), bundled under static/icons/res/. Maps a
 * resource key to its image path (served from the app root, base-prefixed by
 * ResourceIcon). When a key is present here, ResourceIcon shows the real game
 * art; otherwise it falls back to the Noto colour-emoji SVG (e.g. `crystal`,
 * `widget` have no catalogued item icon). Sourced from the WOS wiki item_icon
 * assets, 2026-06-17.
 */
const KEYS = [
  'crystal',
  'meat',
  'wood',
  'coal',
  'iron',
  'steel',
  'fireCrystal',
  'refinedFireCrystal',
  'fcShard',
  'hardenedAlloy',
  'polishingSolution',
  'designPlans',
  'lunarAmber',
  'charmDesign',
  'charmGuide',
  'charmSecret',
  'petFood',
  'tamingManual',
  'energizingPotion',
  'strengtheningSerum',
  'essenceStones',
  'mythicHeroGear',
  'heroShard',
  'mythicShard',
  'epicShard',
  'rareShard',
  'mithril',
  'expertSigil',
  'bookOfKnowledge',
  'gearXp'
];

export const RESOURCE_PNG: Record<string, string> = Object.fromEntries(
  KEYS.map((k) => [k, `/icons/res/${k}.png`])
);
