/**
 * Refinement inventory & intensity (Svelte 5 runes), shared + persisted.
 *
 * Near SvS players stockpile crystals, so what matters isn't what they've already
 * spent — it's how much is LEFT to refine. This holds the player's saved
 * Refined Fire Crystals (RFC, which abate the target directly) plus the chosen
 * intensity preset. Shared so the plan and the per-building panel read the same
 * stash. (Saved raw FC isn't tracked: you still have to refine, and the card
 * reports what you'll SPEND, not what you've got — so it doesn't belong here.)
 */
import { readJson, writeJson } from '$lib/utils/storage';

const STORAGE_KEY = 'upgrade-refinement-v1';

interface Bag {
  /** Refined Fire Crystals already in hand. */
  stockRfc: number;
  /** Intensity preset key (economic | balanced | fast | rush). */
  intensity: string;
}

function load(): Bag {
  const raw = readJson<Partial<Bag>>(STORAGE_KEY);
  const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : 0);
  return {
    stockRfc: num(raw?.stockRfc),
    intensity: typeof raw?.intensity === 'string' ? raw.intensity : 'economic'
  };
}

const state = $state<Bag>(load());
const persist = () => writeJson(STORAGE_KEY, { ...state });

export const refinementStore = {
  get stockRfc(): number {
    return state.stockRfc;
  },
  set stockRfc(v: number) {
    state.stockRfc = Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
    persist();
  },
  get intensity(): string {
    return state.intensity;
  },
  set intensity(v: string) {
    state.intensity = v;
    persist();
  }
};
