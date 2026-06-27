// Diff two hive layouts (before → after) into a set of per-piece changes, so the
// compare screen can colour a merged board and list every difference. Pure and
// framework-free → unit-tested in tests/unit/compare.test.ts.
import { type PlacedObject } from './territory';

export type ChangeKind = 'added' | 'removed' | 'moved' | 'changed' | 'unchanged';

export type FieldKey =
  | 'pos'
  | 'power'
  | 'furnace'
  | 'bear'
  | 'primary'
  | 'farm'
  | 'name'
  | 'uid'
  | 'label'
  | 'type';

export interface FieldChange {
  field: FieldKey;
  /** already display-formatted (power compacted, sets joined, '—' for empty) */
  before: string;
  after: string;
}

export interface DiffPiece {
  /** object to draw — after-position for kept/added/changed/moved, before for removed */
  o: PlacedObject;
  kind: ChangeKind;
  changes: FieldChange[];
  /** display handle: name → uid → '' (UI falls back to "type x,y") */
  label: string;
  /** for 'moved': the previous top-left cell (to draw a ghost + arrow) */
  from?: { x: number; y: number };
}

export interface LayoutDiff {
  pieces: DiffPiece[];
  counts: Record<ChangeKind, number>;
}

const UNITS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K']
];
/** Compact power (484800000 → "484.8M"), matching the planner's number input. */
export function fmtPower(n: number | undefined): string {
  if (!n) return '—';
  if (n < 1000) return String(n);
  for (const [v, s] of UNITS) {
    if (n >= v) {
      const x = n / v;
      // Keep a decimal even above 100 so 484.8M stays distinct from 485.2M.
      const d = x >= 10 ? 1 : 2;
      return x.toFixed(d).replace(/\.?0+$/, '') + s;
    }
  }
  return String(n);
}

const norm = (s?: string) => (s ?? '').trim();
const arr = (a?: number[]) => (a && a.length ? [...a].sort((x, y) => x - y).join('·') : '—');
const handle = (o: PlacedObject) => norm(o.name) || norm(o.uid) || '';

function fieldChanges(b: PlacedObject, a: PlacedObject): FieldChange[] {
  const ch: FieldChange[] = [];
  const push = (field: FieldKey, before: string, after: string) => {
    if (before !== after) ch.push({ field, before, after });
  };
  if (b.x !== a.x || b.y !== a.y)
    ch.push({ field: 'pos', before: `${b.x},${b.y}`, after: `${a.x},${a.y}` });
  push('type', b.type, a.type);
  push('name', norm(b.name) || '—', norm(a.name) || '—');
  push('uid', norm(b.uid) || '—', norm(a.uid) || '—');
  push('furnace', norm(b.furnace) || '—', norm(a.furnace) || '—');
  // Compare RAW power (not the compacted string) so tiny changes aren't masked.
  if ((b.power ?? 0) !== (a.power ?? 0))
    ch.push({ field: 'power', before: fmtPower(b.power), after: fmtPower(a.power) });
  push('bear', arr(b.bear), arr(a.bear));
  push('primary', arr(b.bearMain), arr(a.bearMain));
  push('farm', b.farm ? 'yes' : '—', a.farm ? 'yes' : '—');
  push('label', norm(b.label) || '—', norm(a.label) || '—');
  return ch;
}

/**
 * Match pieces across the two layouts (by player ID, then name, then position),
 * then classify each as added / removed / moved / changed / unchanged.
 */
export function diffLayouts(before: PlacedObject[], after: PlacedObject[]): LayoutDiff {
  const remB = [...before];
  const remA = [...after];
  const pairs: [PlacedObject, PlacedObject][] = [];

  // Greedy multi-pass matching: strongest identity first so a renamed city still
  // matches by ID, and a moved-but-same-name city matches by name before position.
  const matchBy = (keyFn: (o: PlacedObject) => string | null) => {
    const buckets = new Map<string, PlacedObject[]>();
    for (const b of remB) {
      const k = keyFn(b);
      if (k == null) continue;
      let bucket = buckets.get(k);
      if (!bucket) buckets.set(k, (bucket = []));
      bucket.push(b);
    }
    for (let i = remA.length - 1; i >= 0; i--) {
      const k = keyFn(remA[i]);
      if (k == null) continue;
      const bucket = buckets.get(k);
      if (bucket && bucket.length) {
        const b = bucket.shift()!;
        pairs.push([b, remA[i]]);
        remA.splice(i, 1);
        remB.splice(remB.indexOf(b), 1);
      }
    }
  };

  matchBy((o) => (norm(o.uid) ? `uid:${norm(o.uid)}` : null));
  matchBy((o) => (norm(o.name) ? `name:${norm(o.name).toLowerCase()}` : null));
  matchBy((o) => `pos:${o.type}:${o.x},${o.y}`);

  const pieces: DiffPiece[] = [];
  const counts: Record<ChangeKind, number> = {
    added: 0,
    removed: 0,
    moved: 0,
    changed: 0,
    unchanged: 0
  };

  for (const [b, a] of pairs) {
    const changes = fieldChanges(b, a);
    const moved = changes.some((c) => c.field === 'pos');
    const kind: ChangeKind = moved ? 'moved' : changes.length ? 'changed' : 'unchanged';
    counts[kind]++;
    pieces.push({
      o: a,
      kind,
      changes,
      label: handle(a) || handle(b),
      from: moved ? { x: b.x, y: b.y } : undefined
    });
  }
  for (const a of remA) {
    counts.added++;
    pieces.push({ o: a, kind: 'added', changes: [], label: handle(a) });
  }
  for (const b of remB) {
    counts.removed++;
    pieces.push({ o: b, kind: 'removed', changes: [], label: handle(b) });
  }

  return { pieces, counts };
}
