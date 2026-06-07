/**
 * Buildings-calculator state (Svelte 5 runes). Holds an ADDITIVE list of
 * building upgrades — each row is {building, from-level, to-level} — so you can
 * plan several buildings at once (Furnace + Embassy + camps…), not just one.
 * Persisted to localStorage; the page sums every row. Maths lives in engine.ts.
 */

import { readJson, writeJson } from '$lib/utils/storage';
import { BUILDINGS, buildingById } from './data/buildings';
import type { UpgradeTable } from './types';

const STORAGE_KEY = 'upgrade-buildings-v1';

export interface BuildingRow {
  buildingId: string;
  from: string;
  to: string;
}

const lastLabel = (t: UpgradeTable) => t.levels[t.levels.length - 1].label;

/** Keep a row only if its building exists and its labels are on that ladder. */
function clampRow(row: BuildingRow): BuildingRow | null {
  const table = buildingById(row.buildingId);
  if (!table) return null;
  const labels = table.levels.map((l) => l.label);
  return {
    buildingId: table.id,
    from: labels.includes(row.from) ? row.from : labels[0],
    to: labels.includes(row.to) ? row.to : lastLabel(table)
  };
}

function load(): BuildingRow[] {
  const raw = readJson<BuildingRow[]>(STORAGE_KEY);
  if (!Array.isArray(raw)) return []; // start empty — additive UX
  return raw.map(clampRow).filter((r): r is BuildingRow => r !== null);
}

const state = $state<{ rows: BuildingRow[] }>({ rows: load() });

function persist(): void {
  writeJson(
    STORAGE_KEY,
    state.rows.map((r) => ({ ...r }))
  );
}

// Parallel build queues. The 2nd queue isn't automatic — it needs an active
// build-queue (VIP perk / purchase) — so default to 1 and let the user opt in.
// Separate key so it doesn't disturb the rows array that My Plan reads.
const QUEUES_KEY = 'upgrade-build-queues-v1';
let queues = $state<number>(readJson<number>(QUEUES_KEY) === 2 ? 2 : 1);

export const buildingsCalc = {
  get list() {
    return BUILDINGS;
  },
  get rows() {
    return state.rows;
  },
  /** Buildings not yet added (each building is added at most once). */
  get available() {
    return BUILDINGS.filter((b) => !state.rows.some((r) => r.buildingId === b.id));
  },
  tableOf(id: string): UpgradeTable {
    return buildingById(id) ?? BUILDINGS[0];
  },
  add(id: string): void {
    const table = buildingById(id);
    if (!table || state.rows.some((r) => r.buildingId === id)) return;
    state.rows.push({ buildingId: id, from: table.levels[0].label, to: lastLabel(table) });
    persist();
  },
  remove(i: number): void {
    state.rows.splice(i, 1);
    persist();
  },
  setFrom(i: number, label: string): void {
    if (state.rows[i]) state.rows[i].from = label;
    persist();
  },
  setTo(i: number, label: string): void {
    if (state.rows[i]) state.rows[i].to = label;
    persist();
  },
  get queues(): number {
    return queues;
  },
  setQueues(n: number): void {
    queues = n === 1 ? 1 : 2;
    writeJson(QUEUES_KEY, queues);
  }
};
