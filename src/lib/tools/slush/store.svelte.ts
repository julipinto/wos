import { readJson, writeJson, readString, writeString } from '$lib/utils/storage';
import {
  solve,
  suggestBestGuess,
  getConfirmedPositions,
  blockedAtSlot,
  remainingCounts
} from './solver';
import type { Hex, Round, Feedback, SolverResult } from './types';

export const DEFAULT_INVENTORY: Hex[] = [
  '#ef4444',
  '#fb923c',
  '#f472b6',
  '#60a5fa',
  '#c084fc',
  '#4ade80'
];

export const COLOR_POOL: Hex[] = [
  ...DEFAULT_INVENTORY,
  '#facc15',
  '#22d3ee',
  '#a3e635',
  '#fb7185',
  '#fcd34d',
  '#a78bfa'
];

export const MAX_JARS = 8;
export const MIN_JARS = 2;

const STORAGE_KEY = 'slush-inventory-v1';
const TOUR_KEY = 'slush-tour-seen';

interface StoredState {
  inventory: Hex[];
}

interface SlushState {
  inventory: Hex[];
  rounds: Round[];
  currentGuess: (Hex | null)[];
  currentFeedback: Feedback[];
}

function makeBlank(slots: number): { guess: (Hex | null)[]; feedback: Feedback[] } {
  return {
    guess: Array(slots).fill(null),
    feedback: Array(slots).fill(null)
  };
}

function loadInventory(): Hex[] {
  const stored = readJson<StoredState>(STORAGE_KEY);
  if (stored && Array.isArray(stored.inventory) && stored.inventory.length >= MIN_JARS) {
    return [...stored.inventory];
  }
  return [...DEFAULT_INVENTORY];
}

const initialInventory = loadInventory();
const initialBlank = makeBlank(initialInventory.length);

const state = $state<SlushState>({
  inventory: initialInventory,
  rounds: [],
  currentGuess: initialBlank.guess,
  currentFeedback: initialBlank.feedback
});

function persistInventory(): void {
  writeJson<StoredState>(STORAGE_KEY, { inventory: state.inventory });
}

function applyAutoLock(): void {
  const N = state.inventory.length;
  const confirmed = getConfirmedPositions(state.rounds, N);
  const blank = makeBlank(N);
  state.currentGuess = blank.guess;
  state.currentFeedback = blank.feedback;
  for (let i = 0; i < N; i++) {
    if (confirmed[i]) {
      state.currentGuess[i] = confirmed[i];
      state.currentFeedback[i] = true;
    }
  }
}

function firstEmptySlot(): number {
  const confirmed = getConfirmedPositions(state.rounds, state.inventory.length);
  for (let i = 0; i < state.currentGuess.length; i++) {
    if (state.currentGuess[i] === null && !confirmed[i]) return i;
  }
  return -1;
}

export const slush = {
  get inventory() {
    return state.inventory;
  },
  get rounds() {
    return state.rounds;
  },
  get currentGuess() {
    return state.currentGuess;
  },
  get currentFeedback() {
    return state.currentFeedback;
  },
  get slots() {
    return state.inventory.length;
  },

  get solution(): SolverResult {
    return solve({ inventory: state.inventory, rounds: state.rounds });
  },
  get confirmed(): (Hex | null)[] {
    return getConfirmedPositions(state.rounds, state.inventory.length);
  },
  get isWon(): boolean {
    const N = state.inventory.length;
    if (N === 0) return false;
    return this.confirmed.every((c) => c !== null);
  },
  get currentFilled(): boolean {
    return (
      state.currentGuess.every((c) => c !== null) && state.currentFeedback.every((f) => f !== null)
    );
  },

  blockedAt(idx: number): Set<Hex> {
    return blockedAtSlot(state.rounds, idx);
  },
  remaining(): Map<Hex, number> {
    return remainingCounts(state.inventory, state.currentGuess);
  },

  /** Place `hex` at the first empty unlocked slot. Returns the slot index or -1. */
  placeAtFirstEmpty(hex: Hex): number {
    const slot = firstEmptySlot();
    if (slot === -1) return -1;
    state.currentGuess[slot] = hex;
    return slot;
  },
  /** Place `hex` at a specific slot (used by pos-grid clicks). */
  placeAt(slot: number, hex: Hex): void {
    state.currentGuess[slot] = hex;
  },
  /** Tap-to-return: empty slot `slot` if it isn't locked. */
  clearSlot(slot: number): void {
    if (this.confirmed[slot]) return;
    state.currentGuess[slot] = null;
  },
  /** Cycle feedback null → ✓ → ✕ → null at `slot`. */
  cycleFeedback(slot: number): void {
    if (this.confirmed[slot]) return;
    const cf = state.currentFeedback[slot];
    state.currentFeedback[slot] = cf === null ? true : cf === true ? false : null;
  },

  submitRound(): void {
    if (!this.currentFilled) return;
    state.rounds.push({
      guess: state.currentGuess.map((c) => c!),
      feedback: state.currentFeedback.map((f) => f!)
    });
    applyAutoLock();
  },
  deleteRound(idx: number): void {
    state.rounds.splice(idx, 1);
    applyAutoLock();
  },
  resetRounds(): void {
    state.rounds = [];
    applyAutoLock();
  },

  /** Apply suggested guess to current row, preserving locked ✓. */
  applySuggestion(): void {
    const sol = this.solution;
    if (sol.valid.length === 0) return;
    const best = suggestBestGuess(sol.valid);
    if (!best) return;
    const N = state.inventory.length;
    state.currentGuess = [...best];
    state.currentFeedback = Array(N).fill(null);
    const confirmed = this.confirmed;
    for (let i = 0; i < N; i++) {
      if (confirmed[i]) state.currentFeedback[i] = true;
    }
  },

  /** Add another jar of `hex` (duplicates allowed — multiset). */
  addInventoryColor(hex: Hex): void {
    if (state.inventory.length >= MAX_JARS) return;
    state.inventory = [...state.inventory, hex];
    state.rounds = [];
    applyAutoLock();
    persistInventory();
  },
  /** Remove one jar of `hex` (the first occurrence). */
  decrementInventoryColor(hex: Hex): void {
    if (state.inventory.length <= MIN_JARS) return;
    const idx = state.inventory.indexOf(hex);
    if (idx < 0) return;
    state.inventory = state.inventory.filter((_, i) => i !== idx);
    state.rounds = [];
    applyAutoLock();
    persistInventory();
  },
  /** Reset inventory back to DEFAULT_INVENTORY. Clears rounds too — the
   * multiset is changing, so feedback collected against the old set is no
   * longer meaningful. */
  resetInventoryToDefault(): void {
    state.inventory = [...DEFAULT_INVENTORY];
    state.rounds = [];
    applyAutoLock();
    persistInventory();
  },
  /** Apply a new ORDER of unique colors. Preserves the count of each color. */
  setInventoryOrder(orderedUniqueHexes: Hex[]): void {
    const counts = new Map<Hex, number>();
    for (const h of state.inventory) counts.set(h, (counts.get(h) ?? 0) + 1);
    const next: Hex[] = [];
    for (const h of orderedUniqueHexes) {
      const ct = counts.get(h) ?? 0;
      for (let i = 0; i < ct; i++) next.push(h);
    }
    if (next.length === state.inventory.length) {
      state.inventory = next;
      persistInventory();
    }
  },

  hasSeenTour(): boolean {
    return readString(TOUR_KEY) === '1';
  },
  markTourSeen(): void {
    writeString(TOUR_KEY, '1');
  }
};
