/**
 * Alliance territory / hive layout model. Pure logic (no DOM) so it's unit-
 * testable. The interactive grid page renders these objects and the computed
 * connected-territory cells.
 *
 * Game rules modelled (sources: WOS wiki — Alliance Territory / banner tips):
 *  - A Banner covers a 7×7 square centred on it.
 *  - Territory is the connected union of banner coverage seeded from the HQ:
 *    a banner counts only if its coverage overlaps the HQ footprint or an
 *    already-connected banner's coverage. Disconnected banners would expire.
 *  - Other structures (city, bear trap, farm, obstacle) just occupy cells.
 */

/** An object type id (varies per planner mode). */
export type TerritoryType = string;

export interface TerritoryDef {
  /** footprint width / height in cells */
  w: number;
  h: number;
  /** banner coverage square side (odd), centred on the object's first cell */
  coverage?: number;
  /** seeds territory (the HQ) */
  seed?: boolean;
  /** in-game placement cap (for the counter) */
  max?: number;
  /** a member city — gets the furnace/power tags in the editor */
  city?: boolean;
  /** i18n suffix under territory.obj.* */
  i18n: string;
  color: string;
}

// --- Per-mode object palettes. The same grid/iso/tags/import/zoom/saved-maps
// system is reused for several organisation types. NOTE: Sunfire Castle and
// State objects are sensible PLACEHOLDERS — easy to refine, they're just data.
const HIVE_OBJECTS: Record<string, TerritoryDef> = {
  hq: { w: 3, h: 3, seed: true, max: 1, i18n: 'hq', color: '#93d4ff' },
  banner: { w: 1, h: 1, coverage: 7, i18n: 'banner', color: '#fbbf24' },
  city: { w: 2, h: 2, city: true, i18n: 'city', color: '#4ade80' },
  // Officially 2 bear traps (the counter caps at 2); a 3rd is an extraordinary
  // case (teaming with another alliance) and shows as 3/2 — placement isn't blocked.
  bearTrap: { w: 3, h: 3, max: 2, i18n: 'bearTrap', color: '#fb7185' },
  farm: { w: 2, h: 2, i18n: 'farm', color: '#c084fc' },
  obstacle: { w: 1, h: 1, i18n: 'obstacle', color: '#64748b' }
};
// Sunfire Castle: a central castle, "shooting" turrets, and member cities
// (user-described). Refine sizes/turret count freely — it's just data.
const SUNFIRE_OBJECTS: Record<string, TerritoryDef> = {
  sunCastle: { w: 3, h: 3, max: 1, i18n: 'sunCastle', color: '#fb7185' },
  sunTurret: { w: 1, h: 1, i18n: 'sunTurret', color: '#fb923c' },
  sunCity: { w: 2, h: 2, city: true, i18n: 'sunCity', color: '#4ade80' },
  sunObstacle: { w: 1, h: 1, i18n: 'obstacle', color: '#64748b' }
};
// State: PLACEHOLDER set (the exact structures aren't pinned down yet) — a
// central building, member cities and obstacles. Easy to flesh out later.
const STATE_OBJECTS: Record<string, TerritoryDef> = {
  capitol: { w: 3, h: 3, i18n: 'capitol', color: '#93d4ff' },
  stateCity: { w: 2, h: 2, city: true, i18n: 'stateCity', color: '#4ade80' },
  stateObstacle: { w: 1, h: 1, i18n: 'obstacle', color: '#64748b' }
};

/** Union of every mode's objects — a stable lookup for footprint/render. */
export const OBJECT_DEFS: Record<string, TerritoryDef> = {
  ...HIVE_OBJECTS,
  ...SUNFIRE_OBJECTS,
  ...STATE_OBJECTS
};

export interface PlannerMode {
  id: string;
  /** i18n suffix under territory.modes.* */
  i18n: string;
  /** types belonging to this mode (palette + which objects it shows) */
  types: string[];
  /** hive uses banner→HQ flood-fill; others don't */
  connectivity?: boolean;
}

export const MODES: PlannerMode[] = [
  { id: 'hive', i18n: 'hive', types: Object.keys(HIVE_OBJECTS), connectivity: true },
  { id: 'sunfire', i18n: 'sunfire', types: Object.keys(SUNFIRE_OBJECTS) },
  { id: 'state', i18n: 'state', types: Object.keys(STATE_OBJECTS) }
];
export const modeById = (id: string): PlannerMode => MODES.find((m) => m.id === id) ?? MODES[0];

/** Hive types — kept for callers that predate modes. */
export const TERRITORY_TYPES = Object.keys(HIVE_OBJECTS);

export interface PlacedObject {
  id: string;
  type: TerritoryType;
  /** top-left grid cell */
  x: number;
  y: number;
  /** Optional tags (mainly for cities): owner name, furnace level, power, and
   *  which bear traps (1..3) the city joins — a city can take part in several
   *  (on different days). */
  name?: string;
  /** Free annotation, kept alongside the name (any object, incl. HQ/banners). */
  label?: string;
  furnace?: string;
  power?: number;
  bear?: number[];
}

/** Furnace levels for tagging — plain in-game display: 1–30 then FC1–FC11. */
export const FURNACE_LEVELS: string[] = [
  ...Array.from({ length: 30 }, (_, i) => String(i + 1)),
  ...Array.from({ length: 11 }, (_, i) => `FC${i + 1}`)
];

const key = (x: number, y: number) => `${x},${y}`;

// --- Import / export (share a layout as a copyable code) -------------------
// 'T2' = DEFLATE-compressed (CompressionStream) → base64url; 'T1' = plain
// utf8-base64 (fallback for browsers without CompressionStream, and still read
// on import). Compression shrinks repetitive layouts (many banners/cities) a lot.
const utf8ToB64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64ToUtf8 = (s: string) => decodeURIComponent(escape(atob(s)));

function bytesToB64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function deflate(s: string): Promise<string> {
  const cs = new CompressionStream('deflate-raw');
  const buf = await new Response(new Blob([s]).stream().pipeThrough(cs)).arrayBuffer();
  return bytesToB64url(new Uint8Array(buf));
}
async function inflate(b64: string): Promise<string> {
  const ds = new DecompressionStream('deflate-raw');
  const part = b64urlToBytes(b64) as unknown as BlobPart;
  const stream = new Blob([part]).stream().pipeThrough(ds);
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

// Stable global order for compact numeric encoding (append-only — never reorder,
// or old index-coded links break; old codes used strings and stay safe).
const TYPE_ORDER = Object.keys(OBJECT_DEFS);

function encodeLayout(mode: string, objects: PlacedObject[]): string {
  const mi = Math.max(
    0,
    MODES.findIndex((m) => m.id === mode)
  );
  const o = objects.map((ob) => {
    const base: (string | number | number[])[] = [TYPE_ORDER.indexOf(ob.type), ob.x, ob.y];
    if (ob.name || ob.furnace || (ob.power ?? 0) > 0 || (ob.bear?.length ?? 0) > 0 || ob.label)
      base.push(
        ob.name ?? '',
        ob.furnace ? FURNACE_LEVELS.indexOf(ob.furnace) + 1 : 0,
        ob.power ?? 0,
        ob.bear?.length ? ob.bear : 0,
        ob.label ?? ''
      );
    return base;
  });
  return JSON.stringify({ m: mi, o });
}

/** Serialise a layout (incl. its mode) to a compact, copy-pasteable code. */
export async function exportLayout(mode: string, objects: PlacedObject[]): Promise<string> {
  const json = encodeLayout(mode, objects);
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'T2' + (await deflate(json));
    } catch {
      /* fall through to plain */
    }
  }
  return 'T1' + utf8ToB64(json);
}

export interface ImportedLayout {
  mode: string;
  objects: PlacedObject[];
}

/** Parse an exported code into {mode, objects} (new ids; objects filtered to
 *  the embedded mode). Null if invalid. Handles both T2 (compressed) and T1. */
export async function importLayout(code: string): Promise<ImportedLayout | null> {
  try {
    const trimmed = code.trim();
    let json: string;
    if (trimmed.startsWith('T2')) json = await inflate(trimmed.slice(2));
    else if (trimmed.startsWith('T1')) json = b64ToUtf8(trimmed.slice(2));
    else return null;
    const data = JSON.parse(json);
    const rows = Array.isArray(data) ? data : data?.o; // tolerate old array form
    if (!Array.isArray(rows)) return null;
    // mode may be a string (old codes) or an index (compact codes).
    const rawMode = Array.isArray(data) ? 'hive' : data?.m;
    const mode = modeById(typeof rawMode === 'number' ? (MODES[rawMode]?.id ?? '') : rawMode);
    const allowed = new Set(mode.types);
    const objects: PlacedObject[] = [];
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const [t, x, y, name, fur, power, bear, label] = row;
      // type + furnace may be strings (old) or indices (compact).
      const type = typeof t === 'number' ? TYPE_ORDER[t] : t;
      if (typeof type !== 'string' || !allowed.has(type)) continue;
      if (typeof x !== 'number' || typeof y !== 'number') continue;
      const ob: PlacedObject = {
        id: `${type}-${objects.length}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        x,
        y
      };
      if (name) ob.name = String(name);
      if (label) ob.label = String(label);
      const furnace = typeof fur === 'number' ? FURNACE_LEVELS[fur - 1] : fur;
      if (furnace) ob.furnace = String(furnace);
      if (typeof power === 'number' && power > 0) ob.power = power;
      // bear may be an array (current) or a single number (older codes).
      const bears = Array.isArray(bear)
        ? bear.filter((n) => typeof n === 'number' && n > 0)
        : typeof bear === 'number' && bear > 0
          ? [bear]
          : [];
      if (bears.length) ob.bear = [...new Set(bears)].sort((a, b) => a - b);
      objects.push(ob);
    }
    return { mode: mode.id, objects };
  } catch {
    return null;
  }
}

/** Cells occupied by an object's footprint. */
export function footprintCells(o: PlacedObject): string[] {
  const def = OBJECT_DEFS[o.type];
  const out: string[] = [];
  for (let dx = 0; dx < def.w; dx++)
    for (let dy = 0; dy < def.h; dy++) out.push(key(o.x + dx, o.y + dy));
  return out;
}

/** The 7×7 (or `coverage`×`coverage`) cells a banner covers, centred on its cell. */
export function coverageCells(o: PlacedObject): string[] {
  const def = OBJECT_DEFS[o.type];
  if (!def.coverage) return [];
  const r = (def.coverage - 1) / 2;
  const out: string[] = [];
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++) out.push(key(o.x + dx, o.y + dy));
  return out;
}

/**
 * True if `o`'s footprint shares any cell with another object's footprint.
 * Buildings can't overlap; a banner's 7×7 coverage is alliance *area* (not a
 * footprint), so it isn't considered here and may freely overlap.
 */
export function collides(objects: PlacedObject[], o: PlacedObject, ignoreId?: string): boolean {
  const mine = new Set(footprintCells(o));
  return objects.some(
    (x) => x.id !== (ignoreId ?? o.id) && footprintCells(x).some((c) => mine.has(c))
  );
}

export interface TerritoryResult {
  /** every cell inside connected territory */
  cells: Set<string>;
  /** ids of banners connected to the HQ network */
  connected: Set<string>;
  /** ids of banners that are placed but NOT connected (would expire) */
  orphaned: Set<string>;
}

/** Every cell within Chebyshev distance 1 of the given cells (the cells + their 8 neighbours). */
function dilate(cells: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const c of cells) {
    const [x, y] = c.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(key(x + dx, y + dy));
  }
  return out;
}

/**
 * Flood-fill territory from the HQ through banner coverage. A banner connects
 * when its 7×7 coverage TOUCHES (is adjacent to) — not only overlaps — the HQ or
 * an already-connected banner's area: in-game, banners just need to abut.
 */
export function computeTerritory(objects: PlacedObject[]): TerritoryResult {
  const seed = new Set<string>();
  for (const o of objects)
    if (OBJECT_DEFS[o.type].seed) for (const c of footprintCells(o)) seed.add(c);

  const banners = objects.filter((o) => o.type === 'banner');
  const cov = new Map(banners.map((b) => [b.id, coverageCells(b)]));
  const connected = new Set<string>();

  // `reach` = HQ + connected coverage; `halo` is it dilated by one cell, so a
  // banner whose coverage falls inside the halo is touching (or overlapping).
  const reach = new Set(seed);
  let halo = dilate(reach);
  let changed = true;
  while (changed) {
    changed = false;
    for (const b of banners) {
      if (connected.has(b.id)) continue;
      if (cov.get(b.id)!.some((c) => halo.has(c))) {
        connected.add(b.id);
        for (const c of cov.get(b.id)!) reach.add(c);
        changed = true;
      }
    }
    if (changed) halo = dilate(reach);
  }

  const orphaned = new Set(banners.filter((b) => !connected.has(b.id)).map((b) => b.id));
  return { cells: reach, connected, orphaned };
}
