import { describe, it, expect } from 'vitest';
import {
  EVENT_DEFS,
  DAY_MS,
  GLOBAL_SVS_ANCHOR,
  eventOccurrences,
  projectEvents,
  lockedEvents
} from '../../src/lib/tools/events/events';

const NOW = Date.parse('2026-06-18T00:00:00Z');
const def = (id: string) => EVENT_DEFS.find((d) => d.id === id)!;

describe('event occurrences', () => {
  it('weekly events land on the right UTC weekday, 7 days apart', () => {
    const ac = def('alliance_championship'); // anchored to a Monday
    const occ = eventOccurrences(ac, GLOBAL_SVS_ANCHOR, NOW, NOW + 28 * DAY_MS);
    expect(occ.length).toBeGreaterThanOrEqual(3);
    for (const o of occ) expect(new Date(o.start).getUTCDay()).toBe(1); // Monday
    expect(occ[1].start - occ[0].start).toBe(7 * DAY_MS);
  });

  it('includes an occurrence already running at "from"', () => {
    const ac = def('alliance_championship'); // 7-day event, always overlaps "now"
    const occ = eventOccurrences(ac, GLOBAL_SVS_ANCHOR, NOW, NOW + 1 * DAY_MS);
    expect(occ.some((o) => o.start <= NOW && o.end >= NOW)).toBe(true);
  });

  it('places cyclic events at their SvS offset', () => {
    const svsDate = Date.parse('2026-06-20T10:00:00Z'); // a Saturday
    const koi = eventOccurrences(def('king_of_icefield'), svsDate, svsDate, svsDate + 28 * DAY_MS);
    expect(koi[0].start).toBe(svsDate + 14 * DAY_MS); // KoI = SvS + 14d
  });
});

describe('projectEvents', () => {
  it('sorts by start and flags cyclic events as estimates without a seeded SvS', () => {
    const items = projectEvents({ nowMs: NOW, horizonDays: 35, serverAgeDays: 300 });
    for (let i = 1; i < items.length; i++)
      expect(items[i].start).toBeGreaterThanOrEqual(items[i - 1].start);
    const svs = items.find((x) => x.def.id === 'svs');
    expect(svs?.estimate).toBe(true);
  });

  it('a seeded SvS date turns cyclic estimates into locked dates', () => {
    const svsDateMs = Date.parse('2026-06-27T10:00:00Z');
    const items = projectEvents({ nowMs: NOW, horizonDays: 60, serverAgeDays: 300, svsDateMs });
    const svs = items.find((x) => x.def.id === 'svs');
    expect(svs?.estimate).toBe(false);
  });

  it('gates events by server age (SvS hidden on a young server)', () => {
    const young = projectEvents({ nowMs: NOW, horizonDays: 35, serverAgeDays: 10 });
    expect(young.some((x) => x.def.id === 'svs')).toBe(false); // unlocks ~day 80
    const old = projectEvents({ nowMs: NOW, horizonDays: 35, serverAgeDays: 300 });
    expect(old.some((x) => x.def.id === 'svs')).toBe(true);
  });
});

describe('lockedEvents', () => {
  it('lists not-yet-unlocked events with their unlock date', () => {
    const locked = lockedEvents({ nowMs: NOW, serverAgeDays: 10 });
    const svs = locked.find((l) => l.def.id === 'svs');
    expect(svs).toBeTruthy();
    expect(svs!.unlockMs).toBeGreaterThan(NOW);
    // server opened 10d ago, SvS unlocks at day 80 → ~70 days from now
    expect(Math.round((svs!.unlockMs - NOW) / DAY_MS)).toBe(70);
  });
});
