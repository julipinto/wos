/**
 * Shared, persisted speed-up bonuses, applied live to every calculator's times.
 * Displayed times are the game's BASE times; these reduce them. WOS speed
 * bonuses stack ADDITIVELY, so effective time = base / (1 + totalPercent/100)
 * (engine `applySpeed`). You enable each booster as you unlock it and set its
 * value; the active ones in a category are summed.
 *
 * Two kinds:
 *   - additive boosters (`BOOSTER_DEFS`): research/alliance/decoration/hero
 *     sources that all stack. Tiered ones use a dropdown; others a free %.
 *   - a single POSITION (`POSITIONS`): you can hold only ONE state position at
 *     a time, so it's a mutually-exclusive choice that adds to its categories.
 *
 * Per-timer effects (Chief Orders, Alliance Help, pet Builder's Aide) act on a
 * single running timer, not a planned total, so they're intentionally excluded.
 */
import { readJson, writeJson } from '$lib/utils/storage';

export type BoosterCategory = 'construction' | 'research' | 'training';
export type BoosterSource = 'alliance' | 'hero' | 'island';

export interface BoosterDef {
  id: string;
  category: BoosterCategory;
  /** i18n suffix under upgrade.boosters.* for the label. */
  i18n: string;
  /** Origin tag (i18n under upgrade.boosters.src.*); omitted for the manual total. */
  source?: BoosterSource;
  /**
   * If present, the booster is picked from a dropdown of these tier percentages
   * (index 0 = none/off, so the stored value is the selected index). Otherwise
   * it's a free percent the user types.
   */
  tiers?: number[];
  /**
   * When set, tier options read as "<unit> <index>" (e.g. "VIP 4 · +10%") since
   * the index is an in-game level whose percent can repeat across levels.
   */
  tierUnit?: string;
}

/** Zinman "Bastionist" passive construction speed by skill level (index 0–5). */
export const ZIMAN_PCT = [0, 3, 6, 9, 12, 15];
/** Alliance speed tech (I+II combined): up to +10%, +1% per merged level. */
const ALLIANCE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/**
 * VIP construction speed by VIP level (index = VIP level, 0–12): 0% at VIP 0–3,
 * +10% at VIP 4–8, +20% at VIP 9–12. Confirmed in-game by the user (2026-06-06):
 * VIP grants construction speed ONLY — no research/training speed — so only
 * construction is modelled. The bonus applies only while VIP status is active.
 */
export const VIP_CONSTRUCTION = [0, 0, 0, 0, 10, 10, 10, 10, 10, 20, 20, 20, 20];

export const BOOSTER_DEFS: BoosterDef[] = [
  // Construction
  { id: 'constructionSpeed', category: 'construction', i18n: 'construction' },
  { id: 'zinman', category: 'construction', i18n: 'zinman', source: 'hero', tiers: ZIMAN_PCT },
  {
    id: 'adaptiveTools',
    category: 'construction',
    i18n: 'adaptiveTools',
    source: 'alliance',
    tiers: ALLIANCE
  },
  { id: 'vip', category: 'construction', i18n: 'vip', tierUnit: 'VIP', tiers: VIP_CONSTRUCTION },
  // Research
  { id: 'researchSpeed', category: 'research', i18n: 'research' },
  {
    id: 'mechanisms',
    category: 'research',
    i18n: 'mechanisms',
    source: 'alliance',
    tiers: ALLIANCE
  },
  {
    id: 'skatingRink',
    category: 'research',
    i18n: 'skatingRink',
    source: 'island',
    tiers: [0, 2, 4, 6, 8, 10]
  },
  // Training
  { id: 'trainingSpeed', category: 'training', i18n: 'training' },
  {
    id: 'advancedTraining',
    category: 'training',
    i18n: 'advancedTraining',
    source: 'alliance',
    tiers: ALLIANCE
  },
  {
    id: 'barbecue',
    category: 'training',
    i18n: 'barbecue',
    source: 'island',
    tiers: [0, 1, 2, 3, 4, 5]
  },
  { id: 'skiResort', category: 'training', i18n: 'skiResort', source: 'island' }
];

export interface PositionDef {
  id: string;
  /** i18n suffix under upgrade.boosters.* */
  i18n: string;
  construction?: number;
  research?: number;
  training?: number;
}

/** State positions — you hold ONE at a time (or none). */
export const POSITIONS: PositionDef[] = [
  { id: 'vicePresident', i18n: 'vicePresident', construction: 10, training: 10 },
  { id: 'minister', i18n: 'minister', training: 50 }
];
const POS_BY_ID = new Map(POSITIONS.map((p) => [p.id, p]));

const DEF_BY_ID = new Map(BOOSTER_DEFS.map((d) => [d.id, d]));
const STORAGE_KEY = 'upgrade-boosters-v3';

interface State {
  /** boosterId → raw value (percent, or tier index for dropdown ones). */
  b: Record<string, number>;
  /** held position id, or '' for none. */
  position: string;
}

function load(): State {
  const raw = readJson<State>(STORAGE_KEY);
  const b: Record<string, number> = {};
  if (raw?.b && typeof raw.b === 'object') {
    for (const d of BOOSTER_DEFS) if (typeof raw.b[d.id] === 'number') b[d.id] = raw.b[d.id];
  }
  const position = raw?.position && POS_BY_ID.has(raw.position) ? raw.position : '';
  return { b, position };
}

const state = $state<State>(load());
const persist = () => writeJson(STORAGE_KEY, { b: { ...state.b }, position: state.position });

const clampPct = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
const clampIndex = (v: number, len: number) => Math.max(0, Math.min(len - 1, Math.round(v) || 0));

/** The % a booster currently contributes (0 if unset). */
function contribution(id: string): number {
  const def = DEF_BY_ID.get(id);
  if (!def) return 0;
  const v = state.b[id] ?? 0;
  if (def.tiers) return def.tiers[clampIndex(v, def.tiers.length)] ?? 0;
  return clampPct(v);
}

/** The held position's bonus for a category (0 if none). */
function positionBonus(cat: BoosterCategory): number {
  const p = POS_BY_ID.get(state.position);
  return (p?.[cat] as number | undefined) ?? 0;
}

export const boosters = {
  defsFor(cat: BoosterCategory): BoosterDef[] {
    return BOOSTER_DEFS.filter((d) => d.category === cat);
  },
  value(id: string): number {
    return state.b[id] ?? 0;
  },
  contribution,
  isActive(id: string): boolean {
    return contribution(id) > 0;
  },
  set(id: string, value: number): void {
    const def = DEF_BY_ID.get(id);
    if (!def) return;
    state.b[id] = def.tiers ? clampIndex(value, def.tiers.length) : clampPct(value);
    persist();
  },
  // Position (single, mutually exclusive)
  get position(): string {
    return state.position;
  },
  setPosition(id: string): void {
    state.position = POS_BY_ID.has(id) ? id : '';
    persist();
  },
  positionBonus,
  /** True if any position affects one of these categories (whether to show the picker). */
  positionAffects(cats: BoosterCategory[]): boolean {
    return POSITIONS.some((p) => cats.some((c) => (p[c] ?? 0) > 0));
  },
  /** Summed effective bonus % for a category (additive boosters + held position). */
  total(cat: BoosterCategory): number {
    return (
      BOOSTER_DEFS.filter((d) => d.category === cat).reduce(
        (sum, d) => sum + contribution(d.id),
        0
      ) + positionBonus(cat)
    );
  }
};
