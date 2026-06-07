/**
 * Pure upgrade maths + formatting. No runes, no DOM — fully unit-testable.
 *
 * The whole engine is one idea: the cost of going from level A to level B is
 * the sum of every level cost strictly after A up to and including B. Keeping
 * it pure means the tests in tests/unit/upgrade.test.ts can lock known totals.
 */

import type { LevelCost, ResourceBag, ResourceKey, UpgradeTable } from './types';
import { RESOURCES } from './types';

export interface CalcResult {
  totals: ResourceBag;
  /** Total build time in seconds (raw, no speedups applied). */
  time: number;
  /** Number of level-ups summed (B index − A index). */
  steps: number;
}

export function emptyResult(): CalcResult {
  return { totals: {}, time: 0, steps: 0 };
}

/** Multiply every amount in a bag by `n` (pure). */
export function scaleBag(bag: ResourceBag, n: number): ResourceBag {
  const out: ResourceBag = {};
  for (const r of RESOURCES) {
    const v = bag[r.key];
    if (v) out[r.key] = v * n;
  }
  return out;
}

/** Sum two bags into a new bag (pure). */
export function addBags(a: ResourceBag, b: ResourceBag): ResourceBag {
  const out: ResourceBag = { ...a };
  for (const r of RESOURCES) {
    const add = b[r.key];
    if (add) out[r.key] = (out[r.key] ?? 0) + add;
  }
  return out;
}

/** Index of a level label in a ladder, or -1 if absent. */
export function levelIndexIn(levels: LevelCost[], label: string): number {
  return levels.findIndex((l) => l.label === label);
}

/** Index of a level label in a table's ladder, or -1 if absent. */
export function levelIndex(table: UpgradeTable, label: string): number {
  return levelIndexIn(table.levels, label);
}

/**
 * Total cost + time to climb a ladder from `fromLabel` to `toLabel`.
 *
 * Sums levels in the half-open range (from, to] — you pay for every level you
 * climb into, not the one you already have. Returns an empty result if a label
 * is unknown or the range is non-positive (to ≤ from).
 */
export function sumLadder(levels: LevelCost[], fromLabel: string, toLabel: string): CalcResult {
  const from = levelIndexIn(levels, fromLabel);
  const to = levelIndexIn(levels, toLabel);
  if (from < 0 || to < 0 || to <= from) return emptyResult();

  let totals: ResourceBag = {};
  let time = 0;
  for (let i = from + 1; i <= to; i++) {
    totals = addBags(totals, levels[i].cost);
    time += levels[i].time;
  }
  return { totals, time, steps: to - from };
}

/** Total cost + time to go from `fromLabel` to `toLabel` on a building/table. */
export function sumRange(table: UpgradeTable, fromLabel: string, toLabel: string): CalcResult {
  return sumLadder(table.levels, fromLabel, toLabel);
}

/** Combine several results into one (for multi-building / queue planning). */
export function combine(results: CalcResult[]): CalcResult {
  return results.reduce<CalcResult>(
    (acc, r) => ({
      totals: addBags(acc.totals, r.totals),
      time: acc.time + r.time,
      steps: acc.steps + r.steps
    }),
    emptyResult()
  );
}

/** Drop trailing zeros from a fixed-decimal string: "12.50" → "12.5", "3.00" → "3". */
function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/**
 * Compact resource quantity: 1500 → "1.5K", 12_500_000 → "12.5M", 3.4e9 → "3.4B".
 * Keeps more precision the smaller the leading number so 1.25M doesn't become 1M.
 */
export function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n < 1000) return String(Math.round(n));
  const units: { v: number; s: string }[] = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' }
  ];
  for (const u of units) {
    if (n >= u.v) {
      const val = n / u.v;
      const decimals = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `${trimZeros(val.toFixed(decimals))}${u.s}`;
    }
  }
  return String(Math.round(n));
}

/**
 * Wall-clock time to finish `jobs` (each a building's total seconds) across
 * `queues` parallel build queues, using longest-processing-time greedy packing
 * (a solid makespan estimate). queues=1 is just the sum; a single huge job can
 * never go below its own length.
 */
export function makespan(jobs: number[], queues: number): number {
  const q = Math.max(1, Math.floor(queues) || 1);
  if (q === 1) return jobs.reduce((a, b) => a + b, 0);
  const bins = new Array<number>(q).fill(0);
  for (const j of [...jobs].sort((a, b) => b - a)) {
    let lightest = 0;
    for (let i = 1; i < q; i++) if (bins[i] < bins[lightest]) lightest = i;
    bins[lightest] += j;
  }
  return Math.max(0, ...bins);
}

/**
 * Human build time: 518400 → "6d", 90060 → "1d 1h", 5400 → "1h 30m".
 * Shows at most two units; minutes are hidden once we're into days (too noisy).
 */
export function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return '0m';
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m && !d) parts.push(`${m}m`);
  if (parts.length === 0) parts.push('<1m');
  return parts.join(' ');
}

/**
 * Apply an additive speed-up bonus to a base time. `percent` of 100 halves the
 * time (base / 2), 50 → base / 1.5, 0 → unchanged. Bonuses are summed by the
 * caller into one percent before calling this (WOS stacks them additively).
 */
export function applySpeed(seconds: number, percent: number): number {
  if (!(percent > 0)) return seconds;
  return Math.round(seconds / (1 + percent / 100));
}

/** Resource keys present in a result, in canonical render order. */
export function presentResources(bag: ResourceBag): ResourceKey[] {
  return RESOURCES.map((r) => r.key).filter((k) => (bag[k] ?? 0) > 0);
}
