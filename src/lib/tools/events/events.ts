/**
 * Recurring-events projection. Two clocks (see research): time-of-day is
 * UNIVERSAL UTC for every server; which-week is per-server, anchored to the SvS
 * 28-day cycle + server age. So we project from:
 *   - a server age in days (→ server open date) that GATES events by unlock day, and
 *   - an SvS anchor: the global estimate by default, or a real SvS date the user
 *     gives to lock the cyclic events precisely.
 *
 * Tiers (honesty): 'deterministic' = real UTC weekly/daily cadence (exact);
 * 'estimate' = cyclic events placed from the global SvS anchor (real date only
 * once the user seeds their SvS); 'cadence' = day is known but the in-game hour
 * is alliance-set/unconfirmed. Data verified 2026-06-18 (see memory wos-events-data).
 */
import STATE_OPEN_DATES from './state-open-dates.json';

export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Global SvS battle anchor (Sat 10:00 UTC) used when the user hasn't seeded one. */
export const GLOBAL_SVS_ANCHOR = Date.parse('2024-10-12T10:00:00Z');

/**
 * State open-date anchors (UTC), to estimate server age from a state number.
 * The exact per-state dates live behind whiteoutsurvival.pl's backend (not usable
 * offline); these ~20 anchors interpolate to within a few days. States open
 * sequentially; merges remove some numbers but don't move open dates. Verified
 * 2026-06-18 against the whiteoutsurvival.pl timeline.
 */
const STATE_ANCHORS: { s: number; t: number }[] = [
  { s: 1, t: Date.parse('2023-02-12') },
  { s: 210, t: Date.parse('2023-07-02') },
  { s: 300, t: Date.parse('2023-08-02') },
  { s: 350, t: Date.parse('2023-08-20') },
  { s: 500, t: Date.parse('2023-10-19') },
  { s: 600, t: Date.parse('2023-11-22') },
  { s: 700, t: Date.parse('2023-12-25') },
  { s: 800, t: Date.parse('2024-01-21') },
  { s: 1000, t: Date.parse('2024-03-25') },
  { s: 1200, t: Date.parse('2024-05-17') },
  { s: 1400, t: Date.parse('2024-07-02') },
  { s: 1600, t: Date.parse('2024-08-15') },
  { s: 1800, t: Date.parse('2024-09-25') },
  { s: 2000, t: Date.parse('2024-11-01') },
  { s: 2200, t: Date.parse('2024-12-12') },
  { s: 2400, t: Date.parse('2025-01-14') },
  { s: 2600, t: Date.parse('2025-02-23') },
  { s: 2800, t: Date.parse('2025-04-19') },
  { s: 3000, t: Date.parse('2025-06-10') },
  { s: 3200, t: Date.parse('2025-07-26') }
];

/**
 * Open date (ms) for a state number. Exact when the scraped table has it
 * (scripts/scrape-state-dates.mjs → state-open-dates.json, source
 * whiteoutsurvival.pl); otherwise piecewise-linear over the anchors for states
 * past the snapshot.
 */
export function estimateStateOpenMs(state: number): number {
  const exact = (STATE_OPEN_DATES as Record<string, string>)[String(Math.round(state))];
  if (exact) return Date.parse(`${exact}T00:00:00Z`);
  const A = STATE_ANCHORS;
  const lerp = (p: { s: number; t: number }, q: { s: number; t: number }) =>
    p.t + ((state - p.s) * (q.t - p.t)) / (q.s - p.s);
  if (state <= A[0].s) return lerp(A[0], A[1]); // extrapolate before the first anchor
  for (let i = 1; i < A.length; i++) if (state <= A[i].s) return lerp(A[i - 1], A[i]);
  return lerp(A[A.length - 2], A[A.length - 1]); // extrapolate past the last anchor
}

/** Estimated server age in days for a state number (clamped at 0). */
export function estimateStateAgeDays(state: number, nowMs: number): number {
  return Math.max(0, Math.round((nowMs - estimateStateOpenMs(state)) / DAY_MS));
}

export type EventTier = 'deterministic' | 'estimate' | 'cadence' | 'seasonal';
export type EventCategory = 'pvp' | 'alliance' | 'growth' | 'seasonal';

export interface EventDef {
  id: string;
  category: EventCategory;
  tier: EventTier;
  /** Fixed events: a real past occurrence start (ISO UTC). */
  anchorUtc?: string;
  /** Cyclic events: offset in days from the SvS battle anchor. */
  svsOffsetDays?: number;
  /** Annual seasonal event on a fixed UTC month/day (recurs every year). */
  annual?: { month: number; day: number; durationDays: number };
  /** Repeat period in days (1 daily, 7 weekly, 14 biweekly, 28 monthly-cycle). */
  repeatDays?: number;
  durationHours: number;
  /** Hide until the server reaches this age in days (unlock gate). */
  availableAfterAgeDays?: number;
  /**
   * Multi-day event with a per-day focus (e.g. SvS prep arms-race). Each entry
   * is a theme i18n key; the event expands to one 24h (UTC-day) occurrence per
   * theme, starting on the event's anchor day. Overrides durationHours.
   */
  dailyThemes?: string[];
}

/** Curated v1 event set. Cyclic offsets are relative to the SvS battle (Sat). */
export const EVENT_DEFS: EventDef[] = [
  // ── Universal weekly (deterministic from the UTC week) ──
  {
    id: 'alliance_championship',
    category: 'alliance',
    tier: 'deterministic',
    anchorUtc: '2024-01-01T00:00:00Z', // a Monday
    repeatDays: 7,
    durationHours: 7 * 24
  },
  {
    id: 'hall_of_heroes',
    category: 'growth',
    tier: 'deterministic',
    anchorUtc: '2023-12-31T00:00:00Z', // a Sunday (Sun–Tue)
    repeatDays: 7,
    durationHours: 3 * 24
  },
  // Crazy Joe runs Tue + Thu of the SvS / KoI / Hall-of-Chiefs week → biweekly
  // (those are weeks 1 & 3 of the 28-day cycle). ~40 min each; alliance-set time.
  {
    id: 'crazy_joe',
    category: 'pvp',
    tier: 'cadence',
    svsOffsetDays: -4, // Tuesday of the SvS week
    repeatDays: 14,
    durationHours: 1
  },
  {
    id: 'crazy_joe_thu',
    category: 'pvp',
    tier: 'cadence',
    svsOffsetDays: -2, // Thursday of the SvS week
    repeatDays: 14,
    durationHours: 1
  },
  // ── Biweekly (alternating / fortnightly) ──
  {
    id: 'sunfire_castle',
    category: 'pvp',
    tier: 'estimate',
    svsOffsetDays: 0, // a Saturday, fortnightly from SvS week
    repeatDays: 14,
    durationHours: 5,
    availableAfterAgeDays: 53
  },
  {
    id: 'foundry_battle',
    category: 'pvp',
    tier: 'cadence',
    svsOffsetDays: 1, // Sunday
    repeatDays: 14,
    durationHours: 1
  },
  {
    id: 'frostfire_mine',
    category: 'pvp',
    tier: 'cadence',
    svsOffsetDays: 8, // Sunday, alternating with Foundry
    repeatDays: 14,
    durationHours: 0.5 // 30 min, fixed UTC slots
  },
  {
    id: 'alliance_mobilization',
    category: 'alliance',
    tier: 'estimate',
    svsOffsetDays: -7, // Monday, off-SvS fortnight
    repeatDays: 14,
    durationHours: 6 * 24
  },
  // ── 28-day headline rotation (Saturdays), anchored to SvS ──
  {
    id: 'svs_prep',
    category: 'growth',
    tier: 'estimate',
    svsOffsetDays: -5, // Monday before the Saturday battle
    repeatDays: 28,
    durationHours: 24,
    availableAfterAgeDays: 80,
    dailyThemes: ['construction', 'research', 'beasts', 'heroes', 'power'] // Mon→Fri
  },
  {
    id: 'svs',
    category: 'pvp',
    tier: 'estimate',
    svsOffsetDays: 0,
    repeatDays: 28,
    durationHours: 12,
    availableAfterAgeDays: 80
  },
  {
    id: 'canyon_clash',
    category: 'pvp',
    tier: 'cadence',
    svsOffsetDays: 7,
    repeatDays: 28,
    durationHours: 1
  },
  {
    id: 'king_of_icefield',
    category: 'pvp',
    tier: 'estimate',
    svsOffsetDays: 14,
    repeatDays: 28,
    durationHours: 7 * 24,
    availableAfterAgeDays: 80
  },
  {
    id: 'brothers_in_arms',
    category: 'alliance',
    tier: 'cadence',
    svsOffsetDays: 20, // Friday 00:00 → Sunday 00:00
    repeatDays: 28,
    durationHours: 48
  },
  // ── Seasonal (annual real-world holidays; stable windows, names rotate yearly).
  // Lunar New Year is omitted (its date drifts with the lunar calendar); Summer
  // is announced-only. Windows verified across 2024–2026 occurrences.
  {
    id: 'valentine',
    category: 'seasonal',
    tier: 'seasonal',
    annual: { month: 2, day: 11, durationDays: 7 },
    durationHours: 0
  },
  {
    id: 'anniversary',
    category: 'seasonal',
    tier: 'seasonal',
    annual: { month: 3, day: 5, durationDays: 9 },
    durationHours: 0
  },
  {
    id: 'halloween',
    category: 'seasonal',
    tier: 'seasonal',
    annual: { month: 10, day: 26, durationDays: 8 },
    durationHours: 0
  },
  {
    id: 'thanksgiving',
    category: 'seasonal',
    tier: 'seasonal',
    annual: { month: 11, day: 21, durationDays: 9 },
    durationHours: 0
  },
  {
    id: 'christmas',
    category: 'seasonal',
    tier: 'seasonal',
    annual: { month: 12, day: 23, durationDays: 7 },
    durationHours: 0
  }
];

function annualOccurrence(def: EventDef, year: number): { start: number; end: number } {
  const a = def.annual!;
  const start = Date.UTC(year, a.month - 1, a.day);
  return { start, end: start + a.durationDays * DAY_MS };
}

/** Next occurrence of each annual seasonal event (this year, or next if it's passed). */
export function seasonalNext(
  nowMs: number,
  defs: EventDef[] = EVENT_DEFS
): { def: EventDef; start: number; end: number }[] {
  const y = new Date(nowMs).getUTCFullYear();
  return defs
    .filter((d) => d.annual)
    .map((d) => {
      let occ = annualOccurrence(d, y);
      if (occ.end < nowMs) occ = annualOccurrence(d, y + 1);
      return { def: d, ...occ };
    })
    .sort((a, b) => a.start - b.start);
}

export interface Occurrence {
  def: EventDef;
  start: number; // ms
  end: number; // ms
  /** True when a cyclic event is placed from the global anchor (no real SvS seeded). */
  estimate: boolean;
  /** Per-day theme key, for multi-day themed events (SvS prep). */
  theme?: string;
  /** Literal label for user-defined custom markers (overrides the i18n name). */
  label?: string;
}

/** Floor a timestamp to its UTC midnight (epoch is UTC-aligned to DAY_MS). */
const floorUtcDay = (ms: number) => Math.floor(ms / DAY_MS) * DAY_MS;

function resolveAnchor(def: EventDef, svsAnchorMs: number): number {
  return def.svsOffsetDays != null
    ? svsAnchorMs + def.svsOffsetDays * DAY_MS
    : Date.parse(def.anchorUtc!);
}

/** Occurrences of one event overlapping [fromMs, toMs] (includes one already running). */
export function eventOccurrences(
  def: EventDef,
  svsAnchorMs: number,
  fromMs: number,
  toMs: number
): { start: number; end: number }[] {
  const anchor = resolveAnchor(def, svsAnchorMs);
  const period = (def.repeatDays ?? 0) * DAY_MS;
  const dur = def.durationHours * HOUR_MS;
  if (!period) return [];
  let k = Math.ceil((fromMs - dur - anchor) / period);
  const out: { start: number; end: number }[] = [];
  for (let guard = 0; guard < 500; guard++) {
    const start = anchor + k * period;
    if (start > toMs) break;
    if (start + dur >= fromMs) out.push({ start, end: start + dur });
    k++;
  }
  return out;
}

export interface ProjectOpts {
  nowMs: number;
  horizonDays: number;
  serverAgeDays: number;
  /** Optional real SvS battle date (ms) to lock the cyclic events. */
  svsDateMs?: number;
}

/** All upcoming occurrences across events, gated by server age, sorted by start. */
export function projectEvents(opts: ProjectOpts, defs: EventDef[] = EVENT_DEFS): Occurrence[] {
  const svsAnchor = opts.svsDateMs ?? GLOBAL_SVS_ANCHOR;
  const serverOpen = opts.nowMs - opts.serverAgeDays * DAY_MS;
  const to = opts.nowMs + opts.horizonDays * DAY_MS;
  const items: Occurrence[] = [];
  for (const def of defs) {
    const unlockMs =
      def.availableAfterAgeDays != null
        ? serverOpen + def.availableAfterAgeDays * DAY_MS
        : -Infinity;
    const estimate = def.svsOffsetDays != null && opts.svsDateMs == null;
    if (def.annual) {
      const y = new Date(opts.nowMs).getUTCFullYear();
      for (const yr of [y, y + 1]) {
        const occ = annualOccurrence(def, yr);
        if (occ.end >= opts.nowMs && occ.start <= to) items.push({ def, ...occ, estimate: false });
      }
      continue;
    }
    if (def.dailyThemes?.length) {
      // Expand each cycle into one UTC-day occurrence per theme.
      const span = { ...def, durationHours: def.dailyThemes.length * 24 };
      for (const cycle of eventOccurrences(span, svsAnchor, opts.nowMs, to)) {
        const day0 = floorUtcDay(cycle.start);
        def.dailyThemes.forEach((theme, i) => {
          const start = day0 + i * DAY_MS;
          const end = start + DAY_MS;
          if (end < opts.nowMs || start > to || start < unlockMs) return;
          items.push({ def, start, end, estimate, theme });
        });
      }
      continue;
    }
    for (const o of eventOccurrences(def, svsAnchor, opts.nowMs, to)) {
      if (o.start < unlockMs) continue;
      items.push({ def, ...o, estimate });
    }
  }
  items.sort((a, b) => a.start - b.start);
  return items;
}

/** Events not yet unlocked for this server, with the date they unlock. */
export function lockedEvents(
  opts: Pick<ProjectOpts, 'nowMs' | 'serverAgeDays'>,
  defs: EventDef[] = EVENT_DEFS
): { def: EventDef; unlockMs: number }[] {
  const serverOpen = opts.nowMs - opts.serverAgeDays * DAY_MS;
  return defs
    .filter((d) => d.availableAfterAgeDays != null)
    .map((d) => ({ def: d, unlockMs: serverOpen + (d.availableAfterAgeDays ?? 0) * DAY_MS }))
    .filter((e) => e.unlockMs > opts.nowMs)
    .sort((a, b) => a.unlockMs - b.unlockMs);
}
