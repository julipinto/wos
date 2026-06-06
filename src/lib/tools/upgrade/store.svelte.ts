/**
 * Buildings-calculator state (Svelte 5 runes). Holds the current selection
 * (which building, from-level, to-level) and persists it to localStorage.
 * The actual maths lives in engine.ts — the page derives the result from these.
 */

import { readJson, writeJson } from '$lib/utils/storage';
import { BUILDINGS, buildingById } from './data/buildings';
import type { UpgradeTable } from './types';

const STORAGE_KEY = 'upgrade-buildings-v1';

interface Persisted {
  buildingId: string;
  from: string;
  to: string;
}

function clampSelection(table: UpgradeTable, from: string, to: string): Persisted {
  const labels = table.levels.map((l) => l.label);
  const safeFrom = labels.includes(from) ? from : labels[0];
  const safeTo = labels.includes(to) ? to : labels[labels.length - 1];
  return { buildingId: table.id, from: safeFrom, to: safeTo };
}

function load(): Persisted {
  const first = BUILDINGS[0];
  const raw = readJson<Persisted>(STORAGE_KEY);
  const table = (raw && buildingById(raw.buildingId)) || first;
  return clampSelection(
    table,
    raw?.from ?? table.levels[0].label,
    raw?.to ?? table.levels[table.levels.length - 1].label
  );
}

const state = $state<Persisted>(load());

function persist(): void {
  writeJson(STORAGE_KEY, { ...state });
}

export const buildingsCalc = {
  get list() {
    return BUILDINGS;
  },
  get buildingId() {
    return state.buildingId;
  },
  get from() {
    return state.from;
  },
  get to() {
    return state.to;
  },
  /** The currently selected table (always defined — falls back to the first). */
  get current(): UpgradeTable {
    return buildingById(state.buildingId) ?? BUILDINGS[0];
  },

  setBuilding(id: string): void {
    const table = buildingById(id);
    if (!table) return;
    // Re-clamp the level range against the new building's ladder.
    Object.assign(state, clampSelection(table, state.from, state.to));
    persist();
  },
  setFrom(label: string): void {
    state.from = label;
    persist();
  },
  setTo(label: string): void {
    state.to = label;
    persist();
  }
};
