/**
 * Speedup inventory (Svelte 5 runes). The player's stash of time speedups per
 * queue, entered in days/hours/minutes and stored as seconds. Subtracted from a queue's
 * (already booster-adjusted) time to show the REAL remaining wait, clamped at 0.
 * Persisted; shared so the plan and per-calculator pages can both use it.
 */
import { readJson, writeJson } from '$lib/utils/storage';
import type { BoosterCategory } from './boosters-store.svelte';

const STORAGE_KEY = 'upgrade-speedups-v1';
const DAY = 86400;

/** Entry units — minutes let you enter an exact stash, not just half-days. */
export type SpeedUnit = 'd' | 'h' | 'm';
const UNIT_SEC: Record<SpeedUnit, number> = { d: DAY, h: 3600, m: 60 };

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
  /** Stored amount expressed in the given unit (for the input). */
  amount(cat: BoosterCategory, unit: SpeedUnit): number {
    const v = (state[cat] ?? 0) / UNIT_SEC[unit];
    // Trim float noise so the field shows e.g. 90 (min), not 89.999.
    return Math.round(v * 100) / 100;
  },
  /** Set from a value in the given unit (decimals allowed). */
  setAmount(cat: BoosterCategory, value: number, unit: SpeedUnit): void {
    state[cat] = Number.isFinite(value) && value > 0 ? Math.round(value * UNIT_SEC[unit]) : 0;
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
