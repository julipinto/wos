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
import { EXPERT_SKILLS } from './data/expertSkills';
import { HELIOS_NODES } from './data/helios';
import { HERO_TRACKS } from './data/heroes';
import type { LevelCost } from './types';

/** One toggleable sub-item inside a plan line (e.g. a single building range). */
export interface PlanItem {
  /** Unique across the whole plan (`<lineId>:<subId>`). */
  id: string;
  label: string;
  totals: ResourceBag;
  time: number;
}

export interface PlanLine {
  /** Matches the hub i18n suffix under upgrade.cat.* */
  id: string;
  totals: ResourceBag;
  time: number;
  /** Which booster category reduces this line's time; 'learning' is the expert
   *  skill track (no booster), null = no time. */
  timeCategory: BoosterCategory | 'learning' | null;
  /** Human-readable summary of what was configured, e.g. "Furnace 25 → 30". */
  detail: string[];
  /** The individual upgrades that make up this line (toggleable in My Plan). */
  items: PlanItem[];
  /** Route override for the plan link (defaults to /upgrade/<id>). */
  route?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const range = (from: string, to: string) => `${from} → ${to}`;

const has = (b: ResourceBag) => presentResources(b).length > 0;

/** Build a line from its items (totals/time are the sum of the kept items). */
function lineFrom(
  id: string,
  timeCategory: PlanLine['timeCategory'],
  items: PlanItem[],
  route?: string
): PlanLine | null {
  const kept = items.filter((it) => has(it.totals));
  if (kept.length === 0) return null;
  const totals = kept.reduce<ResourceBag>((acc, it) => addBags(acc, it.totals), {});
  if (!has(totals)) return null;
  return {
    id,
    totals,
    time: kept.reduce((s, it) => s + it.time, 0),
    timeCategory,
    detail: kept.map((it) => it.label),
    items: kept,
    ...(route ? { route } : {})
  };
}

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
  return lineFrom(
    id,
    null,
    valid.map((p) => ({
      id: `${id}:${p.sid}`,
      label: `${nameFor(p.sid)} ${range(p.from, p.to)}`,
      totals: sumLadder(ladder, p.from, p.to).totals,
      time: 0
    }))
  );
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
  return lineFrom(
    'buildings',
    'construction',
    valid.map((p) => {
      const b = buildingById(p.buildingId)!;
      const r = sumRange(b, p.from, p.to);
      return {
        id: `buildings:${p.buildingId}`,
        label: `${b.name} ${range(p.from, p.to)}`,
        totals: r.totals,
        time: r.time
      };
    })
  );
}

function troopsLine(): PlanLine | null {
  const rows = readJson<{ type: string; tier: number; qty: number }[]>('upgrade-troops-v1');
  if (!Array.isArray(rows)) return null;
  const items: PlanItem[] = [];
  rows.forEach((row, i) => {
    const e = TROOP_COST[row.type]?.[row.tier - 1];
    const q = Math.max(0, Math.floor(row.qty) || 0);
    if (!e || q <= 0) return;
    items.push({
      id: `troops:${row.type}-${row.tier}-${i}`,
      label: `${cap(row.type)} T${row.tier} ×${q}`,
      totals: scaleBag(e.cost, q),
      time: e.time * q
    });
  });
  return lineFrom('troops', 'training', items);
}

function researchLine(): PlanLine | null {
  const sel = readJson<Record<string, boolean>>('upgrade-research-v1');
  if (!sel) return null;
  return lineFrom(
    'research',
    'research',
    RESEARCH_TREES.filter((t) => sel[t.id]).map((t) => ({
      id: `research:${t.id}`,
      label: t.id,
      totals: t.total,
      time: t.time
    }))
  );
}

function petsLine(): PlanLine | null {
  const rows = readJson<({ pet: string } & Pair)[]>('upgrade-pets-v2');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const valid = rows.filter((r) => PETS.find((p) => p.id === r.pet));
  return lineFrom(
    'pets',
    null,
    valid.map((row) => {
      const pet = PETS.find((x) => x.id === row.pet)!;
      return {
        id: `pets:${row.pet}`,
        label: `${pet.name} ${range(row.from, row.to)}`,
        totals: sumLadder(petLadder(pet.max), row.from, row.to).totals,
        time: 0
      };
    })
  );
}

function expertsLine(): PlanLine | null {
  const rows = readJson<({ expert: string } & Pair)[]>('upgrade-experts-v1');
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const valid = rows.filter((r) => EXPERTS.find((e) => e.id === r.expert));
  return lineFrom(
    'experts',
    null,
    valid.map((row) => {
      const ex = EXPERTS.find((x) => x.id === row.expert)!;
      return {
        id: `experts:${row.expert}`,
        label: `${ex.name} ${range(row.from, row.to)}`,
        totals: sumLadder(ex.ladder, row.from, row.to).totals,
        time: 0
      };
    })
  );
}

function heliosLine(): PlanLine | null {
  const s = readJson<{ count: number; nodes: Record<string, Pair>; included?: string[] }>(
    'upgrade-helios-v1'
  );
  if (!s?.nodes) return null;
  // Only the evolutions kept on the Helios page (the `included` set); older saves
  // without it keep every node. If nothing's included, Helios drops from the plan.
  const inIds = Array.isArray(s.included) ? s.included : HELIOS_NODES.map((n) => n.id);
  const kept = HELIOS_NODES.filter((n) => inIds.includes(n.id));
  if (kept.length === 0) return null;
  const r = combine(
    kept.map((n) => {
      const p = s.nodes[n.id];
      return p ? sumLadder(n.ladder, p.from, p.to) : emptyResult();
    })
  );
  const count = s.count >= 1 ? s.count : 1;
  // Helios scales the combined node cost by troop-type count → a single item.
  return lineFrom('helios', null, [
    { id: 'helios:all', label: `×${count} troop types`, totals: scaleBag(r.totals, count), time: 0 }
  ]);
}

function expertSkillsLine(): PlanLine | null {
  const arr = readJson<({ skill: string } & Pair)[]>('upgrade-expertskills-v1');
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const valid = arr.filter((p) => {
    const s = EXPERT_SKILLS.find((x) => x.id === p.skill);
    return (
      s &&
      p.from !== p.to &&
      s.ladder.some((l) => l.label === p.from) &&
      s.ladder.some((l) => l.label === p.to)
    );
  });
  return lineFrom(
    'expertSkills',
    'learning',
    valid.map((p) => {
      const s = EXPERT_SKILLS.find((x) => x.id === p.skill)!;
      const r = sumLadder(s.ladder, p.from, p.to);
      return {
        id: `expertSkills:${p.skill}`,
        label: `${s.expertName} · ${s.skill} ${range(p.from, p.to)}`,
        totals: r.totals,
        time: r.time
      };
    }),
    '/upgrade/experts'
  );
}

const HERO_NAME: Record<string, string> = {
  mastery: 'Gear Mastery',
  exclusive: 'Exclusive Gear',
  stars: 'Star Promotion',
  enhance: 'Gear Enhancement'
};
function heroesLine(): PlanLine | null {
  const items: PlanItem[] = [];
  for (const t of HERO_TRACKS) {
    const p = readJson<Pair>(t.storageKey);
    if (!p || p.from === p.to) continue;
    items.push({
      id: `heroes:${t.id}`,
      label: `${HERO_NAME[t.id] ?? t.id} ${range(p.from, p.to)}`,
      totals: sumLadder(t.ladder, p.from, p.to).totals,
      time: 0
    });
  }
  return lineFrom('heroes', null, items);
}

/** Every localStorage key holding a plan SELECTION (what you're upgrading), for
 *  a "clear plan" reset. Excludes account config (boosters / stock / speedups). */
export const PLAN_STORAGE_KEYS = [
  'upgrade-buildings-v1',
  'upgrade-gear-v1',
  'upgrade-charms-v1',
  'upgrade-troops-v1',
  'upgrade-research-v1',
  'upgrade-pets-v2',
  'upgrade-experts-v1',
  'upgrade-helios-v1',
  ...HERO_TRACKS.map((t) => t.storageKey)
];

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
    expertSkillsLine(),
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
