import { describe, it, expect } from 'vitest';
import { GEAR_LADDER, GEAR_PIECES } from '../../src/lib/tools/upgrade/data/gear';
import {
  CHIEF_PIECE_TROOP,
  chiefStatPct,
  chiefPower,
  chiefGearGain,
  charmStatPct,
  charmStatGain
} from '../../src/lib/tools/upgrade/chief-gear-stats';

describe('chief gear stat table (verified 2026-06-17, 3 sources agree)', () => {
  it('covers every GEAR_LADDER tier label', () => {
    for (const l of GEAR_LADDER) {
      if (l.label === 'None') continue;
      expect(chiefStatPct(l.label), `missing ${l.label}`).toBeGreaterThan(0);
    }
  });

  it('hits the verified tier anchors', () => {
    expect(chiefStatPct('Green')).toBe(9.35);
    expect(chiefStatPct('Blue')).toBe(17);
    expect(chiefStatPct('Gold')).toBe(56.78);
    expect(chiefStatPct('Red')).toBe(89.25);
    expect(chiefStatPct('Red T3 3-Star')).toBe(153);
    expect(chiefStatPct('None')).toBe(0);
  });

  it('power = statPct × 24000', () => {
    expect(chiefPower('Green')).toBe(9.35 * 24000);
    expect(chiefPower('Red T3 3-Star')).toBe(153 * 24000);
  });

  it('maps every piece to a troop', () => {
    for (const p of GEAR_PIECES) {
      expect(['infantry', 'lancer', 'marksman']).toContain(CHIEF_PIECE_TROOP[p.id]);
    }
    expect(CHIEF_PIECE_TROOP.hat).toBe('lancer');
    expect(CHIEF_PIECE_TROOP.coat).toBe('infantry');
    expect(CHIEF_PIECE_TROOP.ring).toBe('marksman');
  });

  it('computes a clamped gain between tiers', () => {
    const g = chiefGearGain('hat', 'None', 'Green');
    expect(g.troop).toBe('lancer');
    expect(g.statPct).toBe(9.35);
    expect(g.power).toBe(9.35 * 24000);
    expect(chiefGearGain('hat', 'Green', 'None').statPct).toBe(0); // backwards → 0
  });

  it('charm lethality=health per level (0→16 = 0→100)', () => {
    expect(charmStatPct(0)).toBe(0);
    expect(charmStatPct(5)).toBe(25);
    expect(charmStatPct(10)).toBe(50);
    expect(charmStatPct(16)).toBe(100);
    expect(charmStatPct(99)).toBe(100); // clamped
    expect(charmStatGain(10, 16)).toBe(50); // 100 − 50
    expect(charmStatGain(16, 0)).toBe(0); // backwards → 0
  });
});
