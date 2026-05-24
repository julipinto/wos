import { readJson, writeJson, readString, writeString } from '$lib/utils/storage';
import { nowUtcMinutes, offsetMinutes, dayOffsetFor } from './time';
import { CATALOG, type CatalogEntry } from './catalog';

export interface Zone {
  id: string;
  name: string;
  loc: string;
  iana: string | null;
  offsetMin: number;
  color: string;
  removable: boolean;
  tags: string[];
}

export const PIN_COLORS = [
  '#fb923c',
  '#4ade80',
  '#c084fc',
  '#f472b6',
  '#facc15',
  '#22d3ee',
  '#a3e635',
  '#fb7185'
];

const STORAGE_KEY = 'tz-zones-v1';
const TOUR_KEY = 'tz-tour-seen';
const TAG_MAX = 24;

const UTC_ZONE: Zone = {
  id: 'utc',
  name: 'UTC',
  loc: 'Coordinated Universal Time',
  iana: null,
  offsetMin: 0,
  color: '#93d4ff',
  removable: false,
  tags: []
};

type StoredEntry = { id: string; tags: string[] } | string;

function loadUserZones(): Zone[] {
  const raw = readJson<StoredEntry[]>(STORAGE_KEY);
  if (!raw || !Array.isArray(raw)) return defaults();
  const out: Zone[] = [];
  let colorIdx = 0;
  for (const e of raw) {
    const id = typeof e === 'string' ? e : e?.id;
    const tags = typeof e === 'string' ? [] : Array.isArray(e?.tags) ? e.tags : [];
    if (!id) continue;
    const cat = CATALOG.find((c) => c.id === id);
    if (!cat) continue;
    out.push(makeZone(cat, colorIdx++, tags));
  }
  return out.length > 0 ? out : defaults();
}

function defaults(): Zone[] {
  return [
    makeZone(CATALOG.find((c) => c.id === 'America/Sao_Paulo')!, 0),
    makeZone(CATALOG.find((c) => c.id === 'America/New_York')!, 1)
  ];
}

function makeZone(cat: CatalogEntry, colorIdx: number, tags: string[] = []): Zone {
  return {
    id: cat.id,
    name: cat.name,
    loc: cat.loc,
    iana: cat.iana,
    offsetMin: offsetMinutes(cat.iana),
    color: PIN_COLORS[colorIdx % PIN_COLORS.length],
    removable: true,
    tags: [...tags]
  };
}

interface TzState {
  baseUtcMin: number;
  isManual: boolean;
  zones: Zone[];
}

const initialZones: Zone[] = [UTC_ZONE, ...loadUserZones()];

const state = $state<TzState>({
  baseUtcMin: nowUtcMinutes(),
  isManual: false,
  zones: initialZones
});

function persist(): void {
  const payload = state.zones.filter((z) => z.removable).map((z) => ({ id: z.id, tags: z.tags }));
  writeJson(STORAGE_KEY, payload);
}

function recycleColors(): void {
  let i = 0;
  for (const z of state.zones) {
    if (!z.removable) continue;
    z.color = PIN_COLORS[i++ % PIN_COLORS.length];
  }
}

export const tz = {
  get baseUtcMin() {
    return state.baseUtcMin;
  },
  get isManual() {
    return state.isManual;
  },
  get zones() {
    return state.zones;
  },

  setBaseUtcMin(v: number): void {
    state.baseUtcMin = v;
  },
  setManual(manual: boolean): void {
    state.isManual = manual;
  },
  /** Reset to current real time and switch to live mode. */
  resetToNow(): void {
    state.baseUtcMin = nowUtcMinutes();
    state.isManual = false;
  },
  /** Pull fresh offsets from Intl — call on a 1h interval to absorb DST. */
  resyncOffsets(): void {
    for (const z of state.zones) {
      if (z.iana) z.offsetMin = offsetMinutes(z.iana);
    }
  },

  addZone(cat: CatalogEntry): boolean {
    if (state.zones.some((z) => z.id === cat.id)) return false;
    const colorIdx = state.zones.filter((z) => z.removable).length;
    state.zones.push(makeZone(cat, colorIdx));
    persist();
    return true;
  },
  removeZone(id: string): void {
    const idx = state.zones.findIndex((z) => z.id === id);
    if (idx < 0) return;
    const z = state.zones[idx];
    if (!z.removable) return;
    state.zones.splice(idx, 1);
    recycleColors();
    persist();
  },

  addTag(zoneId: string, raw: string): void {
    const z = state.zones.find((z) => z.id === zoneId);
    if (!z) return;
    const cleaned = raw.trim().slice(0, TAG_MAX);
    if (!cleaned) return;
    if (z.tags.includes(cleaned)) return;
    z.tags.push(cleaned);
    persist();
  },
  removeTag(zoneId: string, tag: string): void {
    const z = state.zones.find((z) => z.id === zoneId);
    if (!z) return;
    z.tags = z.tags.filter((t) => t !== tag);
    persist();
  },

  /** zones sorted chronologically, including day-offset. UTC mixes in among the rest. */
  sortedZones(): Zone[] {
    return [...state.zones].sort((a, b) => {
      const aDay = dayOffsetFor(state.baseUtcMin, a.offsetMin);
      const bDay = dayOffsetFor(state.baseUtcMin, b.offsetMin);
      const aLocal = (((state.baseUtcMin + a.offsetMin) % 1440) + 1440) % 1440;
      const bLocal = (((state.baseUtcMin + b.offsetMin) % 1440) + 1440) % 1440;
      return aDay * 1440 + aLocal - (bDay * 1440 + bLocal);
    });
  },

  hasSeenTour(): boolean {
    return readString(TOUR_KEY) === '1';
  },
  markTourSeen(): void {
    writeString(TOUR_KEY, '1');
  }
};
