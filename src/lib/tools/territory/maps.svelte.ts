/**
 * Saved territory maps (Svelte 5 runes), namespaced PER MODE so each planner
 * type (hive / sunfire / state) keeps its own named layouts. Persisted under
 * `territory-maps-<mode>`, separate from the active board.
 */
import { readJson, writeJson } from '$lib/utils/storage';
import { OBJECT_DEFS, MODES, type PlacedObject } from './territory';

export interface SavedMap {
  id: string;
  name: string;
  objects: PlacedObject[];
  savedAt: number;
}

const clone = (objects: PlacedObject[]) => objects.map((o) => ({ ...o }));
const keyFor = (mode: string) => `territory-maps-${mode}`;

function read(mode: string): SavedMap[] {
  const raw = readJson<SavedMap[]>(keyFor(mode));
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m.name === 'string' && Array.isArray(m.objects))
    .map((m) => ({
      id: m.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: m.name,
      objects: m.objects.filter((o) => OBJECT_DEFS[o.type]),
      savedAt: m.savedAt || Date.now()
    }));
}

// Per-mode cache, pre-loaded for every mode at init so reads never mutate state
// during render (which Svelte forbids — state_unsafe_mutation).
const cache = $state<Record<string, SavedMap[]>>(
  Object.fromEntries(MODES.map((m) => [m.id, read(m.id)]))
);
const ensure = (mode: string): SavedMap[] => cache[mode] ?? (cache[mode] = []);
function persist(mode: string) {
  writeJson(
    keyFor(mode),
    ensure(mode).map((m) => ({ ...m, objects: clone(m.objects) }))
  );
}

export const savedMaps = {
  /** Newest first, for a mode. */
  all(mode: string): SavedMap[] {
    return [...ensure(mode)].sort((a, b) => b.savedAt - a.savedAt);
  },
  /** Re-read every mode from storage. Call once on the client (e.g. onMount) so
   *  pages that loaded before localStorage was available — or were prerendered —
   *  pick up the persisted maps. */
  reload(): void {
    for (const m of MODES) cache[m.id] = read(m.id);
  },
  /** Save (or overwrite a same-named map) under `name` for a mode. */
  save(mode: string, name: string, objects: PlacedObject[]): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = ensure(mode);
    const existing = list.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      existing.objects = clone(objects);
      existing.savedAt = Date.now();
    } else {
      list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        objects: clone(objects),
        savedAt: Date.now()
      });
    }
    persist(mode);
  },
  /** Overwrite an existing map (by id) with the current board, keeping its name. */
  update(mode: string, id: string, objects: PlacedObject[]): void {
    const m = ensure(mode).find((x) => x.id === id);
    if (!m) return;
    m.objects = clone(objects);
    m.savedAt = Date.now();
    persist(mode);
  },
  /** A fresh copy of a saved map's objects (new for the live board). */
  objectsOf(mode: string, id: string): PlacedObject[] {
    const m = ensure(mode).find((x) => x.id === id);
    return m ? clone(m.objects) : [];
  },
  remove(mode: string, id: string): void {
    const list = ensure(mode);
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) list.splice(i, 1);
    persist(mode);
  }
};
