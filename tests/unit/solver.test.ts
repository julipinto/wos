import { describe, it, expect } from 'vitest';
import { solve, suggestBestGuess, getConfirmedPositions, blockedAtSlot } from '../../src/lib/tools/slush/solver';
import type { Round } from '../../src/lib/tools/slush/types';

const R = '#ef4444';
const G = '#4ade80';
const B = '#60a5fa';
const Y = '#facc15';

describe('solve', () => {
  it('returns the full permutation set when no rounds', () => {
    const result = solve({ inventory: [R, G, B], rounds: [] });
    expect(result.contradiction).toBe(false);
    // 3! = 6 distinct permutations
    expect(result.total).toBe(6);
  });

  it('multiset dedup: [R,R,B] has 3 distinct permutations (3!/2!)', () => {
    const result = solve({ inventory: [R, R, B], rounds: [] });
    expect(result.total).toBe(3);
  });

  it('locks a slot when feedback ✓', () => {
    const rounds: Round[] = [{ guess: [R, G, B], feedback: [true, null, null] }];
    const result = solve({ inventory: [R, G, B], rounds });
    // Slot 0 locked to R → remaining 2 slots permute G and B → 2 solutions
    expect(result.total).toBe(2);
    for (const sol of result.valid) expect(sol[0]).toBe(R);
  });

  it('excludes a color at a slot when feedback ✕', () => {
    const rounds: Round[] = [{ guess: [R, G, B], feedback: [false, null, null] }];
    const result = solve({ inventory: [R, G, B], rounds });
    // Slot 0 cannot be R. Of 6 perms, 2 had R at slot 0, leaving 4.
    expect(result.total).toBe(4);
    for (const sol of result.valid) expect(sol[0]).not.toBe(R);
  });

  it('detects contradiction: same slot confirmed to two different colors', () => {
    const rounds: Round[] = [
      { guess: [R, G, B], feedback: [true, null, null] },
      { guess: [G, R, B], feedback: [true, null, null] }
    ];
    const result = solve({ inventory: [R, G, B], rounds });
    expect(result.contradiction).toBe(true);
    expect(result.total).toBe(0);
  });

  it('detects contradiction: confirmed color also marked wrong at same slot', () => {
    const rounds: Round[] = [
      { guess: [R, G, B], feedback: [true, null, null] },
      { guess: [R, B, G], feedback: [false, null, null] }
    ];
    const result = solve({ inventory: [R, G, B], rounds });
    expect(result.contradiction).toBe(true);
  });

  it('contradiction: confirmed count exceeds inventory', () => {
    // Two slots confirmed to R, but inventory only has one R.
    const rounds: Round[] = [
      { guess: [R, B, G], feedback: [true, null, null] },
      { guess: [G, R, B], feedback: [null, true, null] }
    ];
    const result = solve({ inventory: [R, G, B], rounds });
    expect(result.contradiction).toBe(true);
  });

  it('perPosition contains union of colors across all valid solutions', () => {
    const result = solve({ inventory: [R, G, B], rounds: [] });
    for (let i = 0; i < 3; i++) {
      expect(new Set(result.perPosition[i])).toEqual(new Set([R, G, B]));
    }
  });
});

describe('suggestBestGuess', () => {
  it('returns null on empty possibilities', () => {
    expect(suggestBestGuess([])).toBeNull();
  });

  it('returns the only solution when possibilities = 1', () => {
    const only = [R, G, B];
    expect(suggestBestGuess([only])).toBe(only);
  });

  it('returns a guess from the candidate set', () => {
    const result = solve({ inventory: [R, G, B], rounds: [] });
    const pick = suggestBestGuess(result.valid);
    expect(pick).not.toBeNull();
    // Pick should match one of the valid solutions exactly
    const pickStr = JSON.stringify(pick);
    expect(result.valid.some((p) => JSON.stringify(p) === pickStr)).toBe(true);
  });
});

describe('getConfirmedPositions', () => {
  it('aggregates ✓ feedback across rounds', () => {
    const rounds: Round[] = [
      { guess: [R, G, B], feedback: [true, false, null] },
      { guess: [R, B, G], feedback: [null, null, true] }
    ];
    expect(getConfirmedPositions(rounds, 3)).toEqual([R, null, G]);
  });

  it('later rounds win on conflict', () => {
    const rounds: Round[] = [
      { guess: [R, G, B], feedback: [true, null, null] },
      { guess: [G, R, B], feedback: [true, null, null] }
    ];
    // Both confirm slot 0 but to different colors — last write wins
    // (contradiction is detected separately in solve()).
    expect(getConfirmedPositions(rounds, 3)).toEqual([G, null, null]);
  });
});

describe('blockedAtSlot', () => {
  it('collects ✕ colors per slot', () => {
    const rounds: Round[] = [
      { guess: [R, G, B], feedback: [false, null, null] },
      { guess: [Y, G, B], feedback: [false, null, null] }
    ];
    expect(blockedAtSlot(rounds, 0)).toEqual(new Set([R, Y]));
    expect(blockedAtSlot(rounds, 1)).toEqual(new Set());
  });
});
