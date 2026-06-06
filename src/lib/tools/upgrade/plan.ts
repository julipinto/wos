/**
 * "My Plan" aggregation — reads each calculator's saved selection from
 * localStorage and recomputes its total, so the plan page can show one combined
 * grand total across buildings, gear, charms, troops, research, pets, experts,
 * helios and heroes. Pure of boosters: the page applies the Zinman resource cut
 * and the per-category time boosters reactively (they live in a runes store).
 */
import { readJson } from '$lib/utils/storage';
import {
  sumRange,
  sumLadder,
  combine,
  scaleBag,
  addBags,
  presentResources,
  emptyResult
} from './engine';
import type { ResourceBag } from './types';
import type { BoosterCategory } from './boosters-store.svelte';
import { buildingById } from './data/buildings';
import { GEAR_LADDER, GEAR_PIECES } from './data/gear';
import { CHARM_LADDER, CHARM_PIECES } from './data/charms';
import { TROOP_COST } from './data/troops';
import { RESEARCH_TREES } from './data/research';
import { PETS, petLadder } from './data/pets';
import { EXPERTS } from './data/experts';
import { HELIOS_NODES } from './data/helios';
import { HERO_TRACKS } from './data/heroes';
import type { LevelCost } from './types';

export interface PlanLine {
  /** Matches the hub i18n suffix under upgrade.cat.* */
  id: string;
  totals: ResourceBag;
  time: number;
  /** Which booster category reduces this line's time (null = no time). */
  timeCategory: BoosterCategory | null;
  /** Human-readable summary of what was configured, e.g. "Furnace 25 → 30". */
  detail: string[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const range = (from: string, to: string) => `${from} → ${to}`;

const has = (b: ResourceBag) => presentResources(b).length > 0;

interface Pair {
  from: string;
  to: string;
}
function ladderLine(
  key: string,
  ladder: LevelCost[],
  id: string,
  nameFor: (sid: string) => string | undefined
): PlanLine | null {
  const arr = readJson<({ sid: string } & Pair)[]>(key);
  if (!Array.isArray(arr) || arr.length === 0) return null;
  // Drop stale/blank entries the way SlotLadder does: the slot must still
  // resolve to a name, the range must be real (from ≠ to) and both labels must
  // exist on the ladder. Otherwise old localStorage leaks ghost lines here.
  const valid = arr.filter(
    (p) =>
      p &&
      p.from !== p.to &&
      nameFor(p.sid) !== undefined &&
      ladder.some((l) => l.label === p.from) &&
      ladder.some((l) => l.label === p.to)
  );
  const r = combine(valid.map((p) => sumLadder(ladder, p.from, p.to)));
  if (!has(r.totals)) return null;
  return {
    id,
    totals: r.totals,
    time: 0,
    timeCategory: null,
    detail: valid.map((p) => `${nameFor(p.sid)} ${range(p.from, p.to)}`)
  };
}

const gearName = (sid: string): string | undefined => GEAR_PIECES.find((p) => p.id === sid)?.name;
function charmName(sid: string): string | undefined {
  if (!sid) return undefined;
  const i = sid.lastIndexOf('_');
  const piece = CHARM_PIECES.find((p) => p.id === sid.slice(0, i));
  return piece ? `${piece.name} · ${sid.slice(i + 1)}` : undefined;
}

function buildingsLine(): PlanLine | null {
  const arr = readJson<({ buildingId: string } & Pair)[]>('upgrade-buildings-v1');
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const valid = arr.filter((p) => {
    const b = buildingById(p.buildingId);
    return (
      b &&
      p.from !== p.to &&
      b.levels.some((l) => l.label === p.from) &&
      b.levels.some((l) => l.label === p.to)
    );
  });
  const r = combine(valid.map((p) => sumRange(buildingById(p.buildingId)!, p.from, p.to)));
  if (!has(r.totals)) return null;
  return {
    id: 'buildings',
    totals: r.totals,
    time: r.time,
    timeCategory: 'construction',
    detail: valid.map((p) => `${buildingById(p.buildingId)!.name} ${range(p.from, p.to)}`)
  };
}

function troopsLine(): PlanLine | null {
  const rows = readJson<{ type: string; tier: number; qty: number }[]>('upgrade-troops-v1');
  if (!Array.isArray(rows)) return null;
  let totals: ResourceBag = {};
  let time = 0;
  const detail: string[] = [];
  for (const row of rows) {
    const e = TROOP_COST[row.type]?.[row.tier - 1];
    const q = Math.max(0, Math.floor(row.qty) || 0);
    if (!e || q <= 0) continue;
    totals = addBags(totals, scaleBag(e.cost, q));
    time += e.time * q;
    detail.push(`${cap(row.type)} T${row.tier} ×${q}`);
  }
  return has(totals) ? { id: 'troops', totals, time, timeCategory: 'training', detail } : null;
}

function researchLine(): PlanLine | null {
  const sel = readJson<Record<string, boolean>>('upgrade-research-v1');
  if (!sel) return null;
  let totals: ResourceBag = {};
  let time = 0;
  const detail: string[] = [];
  for (const t of RESEARCH_TREES) {
    if (sel[t.id]) {
      totals = addBags(totals, t.total);
      time += t.time;
      detail.push(t.id);
    }
  }
  return has(totals) ? { id: 'research', totals, time, timeCategory: 'research', detail } : null;
}

function petsLine(): PlanLine | null {
  const rows = readJson<({ pet: string } & Pair)[]>('upgrade-pets-v2');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const valid = rows.filter((r) => PETS.find((p) => p.id === r.pet));
  const r = combine(
    valid.map((row) =>
      sumLadder(petLadder(PETS.find((x) => x.id === row.pet)!.max), row.from, row.to)
    )
  );
  if (!has(r.totals)) return null;
  return {
    id: 'pets',
    totals: r.totals,
    time: 0,
    timeCategory: null,
    detail: valid.map(
      (row) => `${PETS.find((p) => p.id === row.pet)!.name} ${range(row.from, row.to)}`
    )
  };
}

function expertsLine(): PlanLine | null {
  const rows = readJson<({ expert: string } & Pair)[]>('upgrade-experts-v1');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const valid = rows.filter((r) => EXPERTS.find((e) => e.id === r.expert));
  const r = combine(
    valid.map((row) =>
      sumLadder(EXPERTS.find((x) => x.id === row.expert)!.ladder, row.from, row.to)
    )
  );
  if (!has(r.totals)) return null;
  return {
    id: 'experts',
    totals: r.totals,
    time: 0,
    timeCategory: null,
    detail: valid.map(
      (row) => `${EXPERTS.find((e) => e.id === row.expert)!.name} ${range(row.from, row.to)}`
    )
  };
}

function heliosLine(): PlanLine | null {
  const s = readJson<{ count: number; nodes: Record<string, Pair> }>('upgrade-helios-v1');
  if (!s?.nodes) return null;
  const r = combine(
    HELIOS_NODES.map((n) => {
      const p = s.nodes[n.id];
      return p ? sumLadder(n.ladder, p.from, p.to) : emptyResult();
    })
  );
  const count = s.count >= 1 ? s.count : 1;
  const totals = scaleBag(r.totals, count);
  return has(totals)
    ? { id: 'helios', totals, time: 0, timeCategory: null, detail: [`×${count} troop types`] }
    : null;
}

const HERO_NAME: Record<string, string> = {
  mastery: 'Gear Mastery',
  exclusive: 'Exclusive Gear',
  stars: 'Star Promotion'
};
function heroesLine(): PlanLine | null {
  const detail: string[] = [];
  const r = combine(
    HERO_TRACKS.map((t) => {
      const p = readJson<Pair>(t.storageKey);
      if (!p) return emptyResult();
      if (p.from !== p.to) detail.push(`${HERO_NAME[t.id] ?? t.id} ${range(p.from, p.to)}`);
      return sumLadder(t.ladder, p.from, p.to);
    })
  );
  return has(r.totals)
    ? { id: 'heroes', totals: r.totals, time: 0, timeCategory: null, detail }
    : null;
}

/** All non-empty calculator totals from saved state (resources raw, no boosters). */
export function planLines(): PlanLine[] {
  return [
    buildingsLine(),
    ladderLine('upgrade-gear-v1', GEAR_LADDER, 'gear', gearName),
    ladderLine('upgrade-charms-v1', CHARM_LADDER, 'charms', charmName),
    troopsLine(),
    researchLine(),
    petsLine(),
    expertsLine(),
    heliosLine(),
    heroesLine()
  ].filter((x): x is PlanLine => !!x);
}

const BASE = ['meat', 'wood', 'coal', 'iron'];
/** Apply Zinman's construction-only base-resource cut to a building line's totals. */
export function cutBase(totals: ResourceBag, pct: number): ResourceBag {
  if (!(pct > 0)) return totals;
  const out: ResourceBag = { ...totals };
  for (const k of BASE)
    if (out[k as keyof ResourceBag])
      out[k as keyof ResourceBag] = Math.round(
        (out[k as keyof ResourceBag] as number) * (1 - pct / 100)
      );
  return out;
}
