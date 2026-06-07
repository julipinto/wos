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
 * Some sources are TEMPORARY (activated for minutes, like the Hyena's Builder's
 * Aide, the "Double Time" Chief Order, and the held Position which lasts ~30 min)
 * rather than permanent passives. They're still offered as toggles — the player
 * knows they're momentary and enables them only when modelling an active push.
 * Alliance Help (per-build) stays out as it doesn't map to a planned total.
 */
import { readJson, writeJson } from '$lib/utils/storage';

export type BoosterCategory = 'construction' | 'research' | 'training';
export type BoosterSource =
  | 'alliance'
  | 'hero'
  | 'island'
  | 'president'
  | 'expert'
  | 'pet'
  | 'chief';

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
  /**
   * Custom label per tier index, overriding the generated one. Lets us collapse
   * a redundant per-level dropdown into a few ranges (e.g. VIP "0–3 / 4–8 /
   * 9–12") — the percent is still appended automatically.
   */
  tierLabels?: string[];
  /**
   * 'pct' (default) = a speed % that stacks into the category total. 'time' = a
   * FLAT reduction in SECONDS subtracted from the (already speed-adjusted) time,
   * clamped at 0 — never a percent, never negative. Agnes works this way.
   */
  unit?: 'pct' | 'time';
}

/** Zinman "Bastionist" passive construction speed by skill level (index 0–5). */
export const ZIMAN_PCT = [0, 3, 6, 9, 12, 15];
/** Alliance speed tech (I+II combined): up to +10%, +1% per merged level. */
const ALLIANCE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** Agnes (City Economy expert) FLAT construction-time cut by skill level 0–5, in
 *  SECONDS: 0 / 2h / 3h / 4h / 6h / 8h (user-provided in-game values). Subtracted
 *  from the time, not a percent — and clamped so the time never goes negative. */
export const AGNES_FLAT = [0, 7200, 10800, 14400, 21600, 28800];
/**
 * VIP construction speed, grouped into the 3 ranges that actually matter (the
 * percent is flat within each): 0% at VIP 0–3, +10% at VIP 4–8, +20% at VIP
 * 9–12. Confirmed in-game by the user (2026-06-06): VIP grants construction
 * speed ONLY — no research/training — so only construction is modelled. The
 * bonus applies only while VIP status is active. Grouped (not per-level) so the
 * dropdown is 3 choices instead of 13, with no loss of accuracy.
 */
export const VIP_CONSTRUCTION = [0, 10, 20];
const VIP_LABELS = ['VIP 0–3', 'VIP 4–8', 'VIP 9–12'];

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
  {
    id: 'vip',
    category: 'construction',
    i18n: 'vip',
    tiers: VIP_CONSTRUCTION,
    tierLabels: VIP_LABELS
  },
  // President "Mercantilism" — castable +10% construction for 24h.
  {
    id: 'mercantilism',
    category: 'construction',
    i18n: 'mercantilism',
    source: 'president',
    tiers: [0, 10]
  },
  // Chief Order "Double Time" — castable +20% construction (5-min, temporary).
  {
    id: 'doubleTime',
    category: 'construction',
    i18n: 'doubleTime',
    source: 'chief',
    tiers: [0, 20]
  },
  // Hyena pet skill — construction speed % by pet level (user-provided in-game).
  {
    id: 'hyena',
    category: 'construction',
    i18n: 'hyena',
    source: 'pet',
    tierUnit: 'Lv',
    tiers: [0, 5, 7, 9, 12, 15]
  },
  // Agnes expert skill — FLAT construction-time cut (seconds), not a %.
  {
    id: 'agnes',
    category: 'construction',
    i18n: 'agnes',
    source: 'expert',
    tierUnit: 'Lv',
    unit: 'time',
    tiers: AGNES_FLAT
  },
  // Research
  { id: 'researchSpeed', category: 'research', i18n: 'research' },
  {
    id: 'mechanisms',
    category: 'research',
    i18n: 'mechanisms',
    source: 'alliance',
    tiers: ALLIANCE
  },
  // Jasser hero "Enlightened Warfare" — always-active expedition passive,
  // research-speed analog of Zinman (skill level 0–5).
  {
    id: 'jasser',
    category: 'research',
    i18n: 'jasser',
    source: 'hero',
    tiers: [0, 3, 6, 9, 12, 15]
  },
  // President "Research Advancement" — castable +10% research for 24h.
  {
    id: 'researchAdvancement',
    category: 'research',
    i18n: 'researchAdvancement',
    source: 'president',
    tiers: [0, 10]
  },
  {
    // Natural Hot Spring: user-confirmed in-game +0.8% research per level, 4% at
    // level 5 (verified by inspecting the dismantle preview).
    id: 'hotSpring',
    category: 'research',
    i18n: 'hotSpring',
    source: 'island',
    tiers: [0, 0.8, 1.6, 2.4, 3.2, 4]
  },
  // Training
  { id: 'trainingSpeed', category: 'training', i18n: 'training' },
  // Ling Xue hero "Total Control" — always-active expedition passive, the only
  // training-speed hero (skill level 0–5).
  {
    id: 'lingXue',
    category: 'training',
    i18n: 'lingXue',
    source: 'hero',
    tiers: [0, 4, 8, 12, 16, 20]
  },
  // President "Mobilize" — castable +30% training for 24h.
  { id: 'mobilize', category: 'training', i18n: 'mobilize', source: 'president', tiers: [0, 30] },
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
  // Ski Resort (event-only Epic decoration): +15% training at max (lvl 5),
  // confirmed. Per-level not published — inferred +3%/level from the linear
  // pattern of the other two decorations (Barbecue +1, Skating Rink +2 per lvl).
  {
    id: 'skiResort',
    category: 'training',
    i18n: 'skiResort',
    source: 'island',
    tiers: [0, 3, 6, 9, 12, 15]
  }
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
  // VP gives +10% to all three speeds (user-confirmed in-game).
  { id: 'vicePresident', i18n: 'vicePresident', construction: 10, research: 10, training: 10 },
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
  /** Summed effective speed % for a category (percent boosters + held position).
   *  Flat (unit:'time') boosters are NOT percentages, so they're excluded here. */
  total(cat: BoosterCategory): number {
    return (
      BOOSTER_DEFS.filter((d) => d.category === cat && d.unit !== 'time').reduce(
        (sum, d) => sum + contribution(d.id),
        0
      ) + positionBonus(cat)
    );
  },
  /** Summed FLAT time reduction (seconds) for a category — subtract from the
   *  speed-adjusted time, then clamp at 0. Currently only Agnes (construction). */
  flatTotal(cat: BoosterCategory): number {
    return BOOSTER_DEFS.filter((d) => d.category === cat && d.unit === 'time').reduce(
      (sum, d) => sum + contribution(d.id),
      0
    );
  }
};
