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
import { GEAR_LADDER } from './data/gear';
import { CHARM_LADDER } from './data/charms';
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
}

const has = (b: ResourceBag) => presentResources(b).length > 0;

interface Pair {
  from: string;
  to: string;
}
function ladderLine(key: string, ladder: LevelCost[], id: string): PlanLine | null {
  const arr = readJson<({ sid: string } & Pair)[]>(key);
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const r = combine(arr.map((p) => sumLadder(ladder, p.from, p.to)));
  return has(r.totals) ? { id, totals: r.totals, time: 0, timeCategory: null } : null;
}

function buildingsLine(): PlanLine | null {
  const s = readJson<{ buildingId: string } & Pair>('upgrade-buildings-v1');
  const b = s && buildingById(s.buildingId);
  if (!s || !b) return null;
  const r = sumRange(b, s.from, s.to);
  return has(r.totals)
    ? { id: 'buildings', totals: r.totals, time: r.time, timeCategory: 'construction' }
    : null;
}

function troopsLine(): PlanLine | null {
  const rows = readJson<{ type: string; tier: number; qty: number }[]>('upgrade-troops-v1');
  if (!Array.isArray(rows)) return null;
  let totals: ResourceBag = {};
  let time = 0;
  for (const row of rows) {
    const e = TROOP_COST[row.type]?.[row.tier - 1];
    const q = Math.max(0, Math.floor(row.qty) || 0);
    if (!e || q <= 0) continue;
    totals = addBags(totals, scaleBag(e.cost, q));
    time += e.time * q;
  }
  return has(totals) ? { id: 'troops', totals, time, timeCategory: 'training' } : null;
}

function researchLine(): PlanLine | null {
  const sel = readJson<Record<string, boolean>>('upgrade-research-v1');
  if (!sel) return null;
  let totals: ResourceBag = {};
  let time = 0;
  for (const t of RESEARCH_TREES) {
    if (sel[t.id]) {
      totals = addBags(totals, t.total);
      time += t.time;
    }
  }
  return has(totals) ? { id: 'research', totals, time, timeCategory: 'research' } : null;
}

function petsLine(): PlanLine | null {
  const rows = readJson<({ pet: string } & Pair)[]>('upgrade-pets-v2');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = combine(
    rows.map((row) => {
      const p = PETS.find((x) => x.id === row.pet);
      return p ? sumLadder(petLadder(p.max), row.from, row.to) : emptyResult();
    })
  );
  return has(r.totals) ? { id: 'pets', totals: r.totals, time: 0, timeCategory: null } : null;
}

function expertsLine(): PlanLine | null {
  const rows = readJson<({ expert: string } & Pair)[]>('upgrade-experts-v1');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = combine(
    rows.map((row) => {
      const e = EXPERTS.find((x) => x.id === row.expert);
      return e ? sumLadder(e.ladder, row.from, row.to) : emptyResult();
    })
  );
  return has(r.totals) ? { id: 'experts', totals: r.totals, time: 0, timeCategory: null } : null;
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
  const totals = scaleBag(r.totals, s.count >= 1 ? s.count : 1);
  return has(totals) ? { id: 'helios', totals, time: 0, timeCategory: null } : null;
}

function heroesLine(): PlanLine | null {
  const r = combine(
    HERO_TRACKS.map((t) => {
      const p = readJson<Pair>(t.storageKey);
      return p ? sumLadder(t.ladder, p.from, p.to) : emptyResult();
    })
  );
  return has(r.totals) ? { id: 'heroes', totals: r.totals, time: 0, timeCategory: null } : null;
}

/** All non-empty calculator totals from saved state (resources raw, no boosters). */
export function planLines(): PlanLine[] {
  return [
    buildingsLine(),
    ladderLine('upgrade-gear-v1', GEAR_LADDER, 'gear'),
    ladderLine('upgrade-charms-v1', CHARM_LADDER, 'charms'),
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
