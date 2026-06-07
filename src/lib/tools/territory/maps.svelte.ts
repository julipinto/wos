/**
 * Saved territory maps (Svelte 5 runes). A named collection of layouts so you
 * can plan several places and switch between them. Persisted separately from
 * the active board (`territory-layout-v1`).
 */
import { readJson, writeJson } from '$lib/utils/storage';
import { OBJECT_DEFS, type PlacedObject } from './territory';

const KEY = 'territory-maps-v1';

export interface SavedMap {
  id: string;
  name: string;
  objects: PlacedObject[];
  savedAt: number;
}

function load(): SavedMap[] {
  const raw = readJson<SavedMap[]>(KEY);
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

const maps = $state<SavedMap[]>(load());
const persist = () =>
  writeJson(
    KEY,
    maps.map((m) => ({ ...m, objects: m.objects.map((o) => ({ ...o })) }))
  );
const clone = (objects: PlacedObject[]) => objects.map((o) => ({ ...o }));

export const savedMaps = {
  /** Newest first. */
  get all(): SavedMap[] {
    return [...maps].sort((a, b) => b.savedAt - a.savedAt);
  },
  /** Save (or overwrite a same-named map) the given layout under `name`. */
  save(name: string, objects: PlacedObject[]): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = maps.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      existing.objects = clone(objects);
      existing.savedAt = Date.now();
    } else {
      maps.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        objects: clone(objects),
        savedAt: Date.now()
      });
    }
    persist();
  },
  /** A fresh copy of a saved map's objects (new for the live board). */
  objectsOf(id: string): PlacedObject[] {
    const m = maps.find((x) => x.id === id);
    return m ? clone(m.objects) : [];
  },
  remove(id: string): void {
    const i = maps.findIndex((m) => m.id === id);
    if (i >= 0) maps.splice(i, 1);
    persist();
  }
};
