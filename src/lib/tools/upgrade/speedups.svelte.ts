/**
 * Speedup inventory (Svelte 5 runes). The player's stash of time speedups per
 * queue, entered in DAYS and stored as seconds. Subtracted from a queue's
 * (already booster-adjusted) time to show the REAL remaining wait, clamped at 0.
 * Persisted; shared so the plan and per-calculator pages can both use it.
 */
import { readJson, writeJson } from '$lib/utils/storage';
import type { BoosterCategory } from './boosters-store.svelte';

const STORAGE_KEY = 'upgrade-speedups-v1';
const DAY = 86400;

type Bag = Record<BoosterCategory, number>; // seconds per category

function load(): Bag {
  const raw = readJson<Partial<Bag>>(STORAGE_KEY);
  const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : 0);
  return {
    construction: num(raw?.construction),
    research: num(raw?.research),
    training: num(raw?.training)
  };
}

const state = $state<Bag>(load());
const persist = () => writeJson(STORAGE_KEY, { ...state });

export const speedups = {
  /** Stored seconds for a queue. */
  seconds(cat: BoosterCategory): number {
    return state[cat] ?? 0;
  },
  /** Stored amount expressed in days (for the input). */
  days(cat: BoosterCategory): number {
    return (state[cat] ?? 0) / DAY;
  },
  /** Set from a days value (decimals allowed). */
  setDays(cat: BoosterCategory, days: number): void {
    state[cat] = Number.isFinite(days) && days > 0 ? Math.round(days * DAY) : 0;
    persist();
  },
  /** Remaining wait after spending speedups on this queue's time. */
  remaining(cat: BoosterCategory, seconds: number): number {
    return Math.max(0, seconds - (state[cat] ?? 0));
  },
  get any(): boolean {
    return state.construction > 0 || state.research > 0 || state.training > 0;
  }
};
