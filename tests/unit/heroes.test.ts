import { describe, it, expect } from 'vitest';
import {
  STAR_SEGMENT_SHARDS,
  STAR_MAX_INDEX,
  starIndex,
  starLabel,
  starShardsBetween,
  HERO_ENHANCE,
  HERO_MASTERY,
  HERO_EMPOWER
} from '../../src/lib/tools/upgrade/data/heroes';
import { sumLadder } from '../../src/lib/tools/upgrade/engine';
import { gearStatsAt, gearStatGain, pieceGroup } from '../../src/lib/tools/upgrade/hero-gear-stats';

describe('hero star segments', () => {
  it('has 5 stars × 6 segments, with the verified per-star totals', () => {
    expect(STAR_SEGMENT_SHARDS).toHaveLength(5);
    const totals = STAR_SEGMENT_SHARDS.map((s) => s.reduce((a, b) => a + b, 0));
    expect(totals).toEqual([10, 40, 115, 300, 600]);
    expect(STAR_MAX_INDEX).toBe(30);
  });

  it('0★→5★ costs the full 1065 shards', () => {
    expect(starShardsBetween(0, STAR_MAX_INDEX)).toBe(1065);
  });

  it('indexes a granular position (star + segments)', () => {
    expect(starIndex(0, 0)).toBe(0);
    expect(starIndex(3, 0)).toBe(18); // 3★
    expect(starIndex(3, 3)).toBe(21); // 3★ +3/6
    expect(starIndex(5, 0)).toBe(30); // 5★ (clamped)
    expect(starIndex(9, 9)).toBe(30); // over-clamped
  });

  it('labels positions readably', () => {
    expect(starLabel(0)).toBe('0★');
    expect(starLabel(18)).toBe('3★');
    expect(starLabel(21)).toBe('3★ +3/6');
    expect(starLabel(30)).toBe('5★');
  });

  it('sums only the segments between two positions', () => {
    // 3★ → 5★ = 300 + 600
    expect(starShardsBetween(18, 30)).toBe(900);
    // single segment: 4★ segment 1 = 40
    expect(starShardsBetween(18, 19)).toBe(40);
  });

  it('subtracts shards already banked toward the current segment', () => {
    // From "3★ +3/6" with 10 banked toward the 4th segment, up to 5★.
    // segments 21..29: [40,40,100] (rest of 4★) + [100×6] (5★) = 780; − 10 = 770
    expect(starShardsBetween(21, 30, 10)).toBe(770);
  });

  it('never goes negative and treats backwards/equal ranges as 0', () => {
    expect(starShardsBetween(30, 0)).toBe(0);
    expect(starShardsBetween(10, 10)).toBe(0);
    expect(starShardsBetween(0, 1, 999)).toBe(0);
  });
});

describe('hero gear cost tables (verified 2026-06-17)', () => {
  it('enhancement 0→100 totals 73,320 XP and has no ascension gear baked in', () => {
    const r = sumLadder(HERO_ENHANCE, '0', '100');
    expect(r.totals.gearXp).toBe(73320);
    expect(r.totals.mythicHeroGear ?? 0).toBe(0); // ascension is a separate node
    expect(HERO_ENHANCE).toHaveLength(101); // labels 0..100
  });

  it('mastery 0→20 totals 2,100 essence + 55 mythic gear', () => {
    const r = sumLadder(HERO_MASTERY, '0', '20');
    expect(r.totals.essenceStones).toBe(2100);
    expect(r.totals.mythicHeroGear).toBe(55);
  });

  it('empowerment 0→100 totals 150 mithril + 33 mythic gear', () => {
    const r = sumLadder(HERO_EMPOWER, '0', '100');
    expect(r.totals.mithril).toBe(150);
    expect(r.totals.mythicHeroGear).toBe(33);
  });
});

describe('hero gear stat curves (community-modelled, cross-validated)', () => {
  it('maps pieces to the right group', () => {
    expect(pieceGroup('goggles')).toBe('atk');
    expect(pieceGroup('boots')).toBe('atk');
    expect(pieceGroup('gloves')).toBe('def');
    expect(pieceGroup('belt')).toBe('def');
  });

  it('hits the verified L100 anchors (infantry atk piece)', () => {
    const s = gearStatsAt('atk', 'infantry', 100, 0);
    expect(s.heroAtk).toBe(345);
    expect(s.heroHp).toBe(3375);
    expect(s.commandPct).toBeCloseTo(50, 5);
    expect(s.commandKind).toBe('lethality');
  });

  it('matches the cross-validated lethality curve (3.33/8/12.66/50)', () => {
    expect(gearStatsAt('atk', 'lancer', 0).commandPct).toBeCloseTo(3.33, 5);
    expect(gearStatsAt('atk', 'lancer', 10).commandPct).toBeCloseTo(8, 5);
    expect(gearStatsAt('atk', 'lancer', 20).commandPct).toBeCloseTo(12.66, 5);
    // lancer L50: ATK 240, HP 1200
    const l50 = gearStatsAt('atk', 'lancer', 50);
    expect(l50.heroAtk).toBe(240);
    expect(l50.heroHp).toBe(1200);
  });

  it('mastery is a ×(1+0.1·level) multiplier (×3 at M20)', () => {
    const base = gearStatsAt('atk', 'infantry', 100, 0);
    const maxed = gearStatsAt('atk', 'infantry', 100, 20);
    expect(maxed.heroAtk).toBeCloseTo((base.heroAtk ?? 0) * 3, 5);
    expect(maxed.commandPct).toBeCloseTo(150, 5); // 50% × 3
  });

  it('def pieces carry hero DEF + troop-health, no atk', () => {
    const s = gearStatsAt('def', 'marksman', 100, 0);
    expect(s.heroDef).toBe(450);
    expect(s.heroAtk).toBeUndefined();
    expect(s.commandKind).toBe('troopHealth');
  });

  it('gain is the delta between two states, clamped at 0', () => {
    const g = gearStatGain('atk', 'infantry', 0, 100, 0, 0);
    expect(g.heroAtk).toBe(322); // 345 − 23
    expect(g.heroHp).toBe(3150); // 3375 − 225
    expect(g.commandPct).toBeCloseTo(46.67, 2);
    expect(gearStatGain('atk', 'infantry', 100, 0).heroHp).toBe(0); // backwards → 0
  });
});
