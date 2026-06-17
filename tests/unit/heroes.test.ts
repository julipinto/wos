import { describe, it, expect } from 'vitest';
import {
  STAR_SEGMENT_SHARDS,
  STAR_MAX_INDEX,
  starIndex,
  starLabel,
  starShardsBetween
} from '../../src/lib/tools/upgrade/data/heroes';

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
