/**
 * Saved territory maps (Svelte 5 runes), namespaced PER MODE so each planner
 * type (hive / sunfire / state) keeps its own named layouts. Persisted under
 * `territory-maps-<mode>`, separate from the active board.
 */
import { readJson, writeJson } from '$lib/utils/storage';
import { OBJECT_DEFS, type PlacedObject } from './territory';

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

// Lazily-loaded per-mode cache (reactive).
const cache = $state<Record<string, SavedMap[]>>({});
function ensure(mode: string): SavedMap[] {
  if (!cache[mode]) cache[mode] = read(mode);
  return cache[mode];
}
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
