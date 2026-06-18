/**
 * Hero roster catalog. Compiled 2026-06-17 from whiteoutdata.com,
 * whiteoutsurvival.wiki, gamsgo, the h5joy database family and tier-list guides
 * (cross-checked ≥2 sources for Gen 1–10). Structure: numbered generations are
 * SSR/mythic-only TRIOS (one infantry / lancer / marksman each); Epic (SR) and
 * Rare (R) heroes are a separate non-generation base pool (generation = null).
 *
 * Confidence: Gen 1–10 HIGH. Gen 11–15 HIGH names/troop, rarity inferred. Gen 16
 * MEDIUM (troop mostly single-source; exclusive gear DISPUTED → left false).
 * Jasser/Seo-yoon are marksman-class but support-role → typed 'support'.
 * Re-verify in-client before treating as final; new generations land ~80 days.
 */
export type HeroRarity = 'mythic' | 'epic' | 'rare';
export type TroopType = 'infantry' | 'lancer' | 'marksman' | 'support';

/** In-game troop icons: shield (infantry), spear/lance (lancer), bow (marksman). */
export const TROOP_EMOJI: Record<TroopType, string> = {
  infantry: '🛡️',
  lancer: '🔱',
  marksman: '🏹',
  support: '🧰'
};

/** Same troops as Iconify "noto" names (consistent SVG; for markup, not text labels). */
export const TROOP_NOTO: Record<TroopType, string> = {
  infantry: 'shield',
  lancer: 'trident-emblem',
  marksman: 'bow-and-arrow',
  support: 'toolbox'
};

export interface CatalogHero {
  id: string;
  name: string;
  rarity: HeroRarity;
  /** Numbered generation (SSR trios). `null` = non-generation base pool (Epic/Rare). */
  generation: number | null;
  troopType: TroopType;
  /** SSR 5th-slot exclusive gear (hero-specific widgets). */
  hasExclusiveGear: boolean;
}

const h = (
  name: string,
  rarity: HeroRarity,
  generation: number | null,
  troopType: TroopType,
  hasExclusiveGear: boolean
): CatalogHero => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  rarity,
  generation,
  troopType,
  hasExclusiveGear
});

export const HERO_CATALOG: CatalogHero[] = [
  // ── Base pool (non-generation Epic / Rare) ────────────────────────────────
  h('Bahiti', 'epic', null, 'marksman', false),
  h('Sergey', 'epic', null, 'infantry', false),
  h('Patrick', 'epic', null, 'lancer', false),
  h('Jessie', 'epic', null, 'lancer', false),
  h('Gina', 'epic', null, 'marksman', false),
  h('Jasser', 'epic', null, 'support', false),
  h('Seo-yoon', 'epic', null, 'support', false),
  h('Walis Bokan', 'epic', null, 'lancer', false),
  h('Ling Xue', 'epic', null, 'lancer', false),
  h('Cloris', 'rare', null, 'marksman', false),
  h('Eugene', 'rare', null, 'infantry', false),
  h('Smith', 'rare', null, 'infantry', false),
  h('Charlie', 'rare', null, 'lancer', false),
  // ── Generation trios (SSR / mythic) ───────────────────────────────────────
  h('Jeronimo', 'mythic', 1, 'infantry', true),
  h('Natalia', 'mythic', 1, 'infantry', true),
  h('Molly', 'mythic', 1, 'lancer', true),
  h('Zinman', 'mythic', 1, 'marksman', true),
  h('Flint', 'mythic', 2, 'infantry', true),
  h('Philly', 'mythic', 2, 'lancer', true),
  h('Alonso', 'mythic', 2, 'marksman', true),
  h('Logan', 'mythic', 3, 'infantry', true),
  h('Mia', 'mythic', 3, 'lancer', true),
  h('Greg', 'mythic', 3, 'marksman', true),
  h('Ahmose', 'mythic', 4, 'infantry', true),
  h('Reina', 'mythic', 4, 'lancer', true),
  h('Lynn', 'mythic', 4, 'marksman', true),
  h('Hector', 'mythic', 5, 'infantry', true),
  h('Norah', 'mythic', 5, 'lancer', true),
  h('Gwen', 'mythic', 5, 'marksman', true),
  h('Wu Ming', 'mythic', 6, 'infantry', true),
  h('Renee', 'mythic', 6, 'lancer', true),
  h('Wayne', 'mythic', 6, 'marksman', true),
  h('Edith', 'mythic', 7, 'infantry', true),
  h('Gordon', 'mythic', 7, 'lancer', true),
  h('Bradley', 'mythic', 7, 'marksman', true),
  h('Gatot', 'mythic', 8, 'infantry', true),
  h('Sonya', 'mythic', 8, 'lancer', true),
  h('Hendrik', 'mythic', 8, 'marksman', true),
  h('Magnus', 'mythic', 9, 'infantry', true),
  h('Fred', 'mythic', 9, 'lancer', true),
  h('Xura', 'mythic', 9, 'marksman', true),
  h('Gregory', 'mythic', 10, 'infantry', true),
  h('Freya', 'mythic', 10, 'lancer', true),
  h('Blanchette', 'mythic', 10, 'marksman', true),
  h('Eleonora', 'mythic', 11, 'infantry', true),
  h('Lloyd', 'mythic', 11, 'lancer', true),
  h('Rufus', 'mythic', 11, 'marksman', true),
  h('Hervor', 'mythic', 12, 'infantry', true),
  h('Karol', 'mythic', 12, 'lancer', true),
  h('Ligeia', 'mythic', 12, 'marksman', true),
  h('Gisela', 'mythic', 13, 'infantry', true),
  h('Flora', 'mythic', 13, 'lancer', true),
  h('Vulcanus', 'mythic', 13, 'marksman', true),
  h('Elif', 'mythic', 14, 'infantry', true),
  h('Dominic', 'mythic', 14, 'lancer', true),
  h('Cara', 'mythic', 14, 'marksman', true),
  h('Hank', 'mythic', 15, 'infantry', true),
  h('Estrella', 'mythic', 15, 'lancer', true),
  h('Viveca', 'mythic', 15, 'marksman', true),
  h('Seigel', 'mythic', 16, 'infantry', false), // ⚠️ exclusive gear disputed
  h('Ursar', 'mythic', 16, 'lancer', false),
  h('Aisling', 'mythic', 16, 'marksman', false)
];

const byId = new Map(HERO_CATALOG.map((c) => [c.id, c]));
export const heroFromCatalog = (id: string): CatalogHero | undefined => byId.get(id);
