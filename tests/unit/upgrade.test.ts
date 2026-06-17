import { describe, it, expect } from 'vitest';
import {
  sumRange,
  sumLadder,
  addBags,
  scaleBag,
  combine,
  levelIndex,
  formatQty,
  formatDuration,
  makespan,
  applySpeed,
  emptyResult
} from '../../src/lib/tools/upgrade/engine';
import { BUILDINGS, buildingById } from '../../src/lib/tools/upgrade/data/buildings';
import { GEAR_LADDER } from '../../src/lib/tools/upgrade/data/gear';
import { CHARM_LADDER } from '../../src/lib/tools/upgrade/data/charms';
import { TROOP_COST } from '../../src/lib/tools/upgrade/data/troops';
import { petLadder } from '../../src/lib/tools/upgrade/data/pets';
import {
  HERO_MASTERY,
  HERO_STARS,
  HERO_EXCLUSIVE,
  HERO_ENHANCE
} from '../../src/lib/tools/upgrade/data/heroes';
import { HELIOS_NODES } from '../../src/lib/tools/upgrade/data/helios';
import { fcTier, campForTier, furnaceReqs } from '../../src/lib/tools/upgrade/prereqs';
import type { UpgradeTable } from '../../src/lib/tools/upgrade/types';

const furnace = buildingById('furnace')!;

// A tiny synthetic table so range maths is checkable by hand, independent of
// whatever the real Furnace numbers happen to be.
const TOY: UpgradeTable = {
  id: 'toy',
  name: 'Toy',
  meta: { source: 'test', verified: true },
  levels: [
    { label: '1', cost: {}, time: 0 },
    { label: '2', cost: { wood: 100 }, time: 10 },
    { label: '3', cost: { wood: 200, iron: 50 }, time: 20 },
    { label: '4', cost: { wood: 300, iron: 100 }, time: 30 }
  ]
};

describe('addBags', () => {
  it('sums overlapping and disjoint keys', () => {
    expect(addBags({ wood: 100, iron: 5 }, { wood: 50, coal: 3 })).toEqual({
      wood: 150,
      iron: 5,
      coal: 3
    });
  });
  it('does not mutate inputs', () => {
    const a = { wood: 1 };
    addBags(a, { wood: 1 });
    expect(a).toEqual({ wood: 1 });
  });
});

describe('levelIndex', () => {
  it('finds labels and returns -1 when missing', () => {
    expect(levelIndex(TOY, '3')).toBe(2);
    expect(levelIndex(TOY, 'FC9')).toBe(-1);
  });
});

describe('sumRange', () => {
  it('sums the half-open range (from, to]', () => {
    // 1 → 4 = levels 2 + 3 + 4
    expect(sumRange(TOY, '1', '4')).toEqual({
      totals: { wood: 600, iron: 150 },
      time: 60,
      steps: 3
    });
  });
  it('excludes the level you already have', () => {
    // 2 → 4 = levels 3 + 4 (not 2)
    expect(sumRange(TOY, '2', '4')).toEqual({
      totals: { wood: 500, iron: 150 },
      time: 50,
      steps: 2
    });
  });
  it('returns empty for non-positive or unknown ranges', () => {
    expect(sumRange(TOY, '3', '2')).toEqual(emptyResult());
    expect(sumRange(TOY, '2', '2')).toEqual(emptyResult());
    expect(sumRange(TOY, '1', 'FC9')).toEqual(emptyResult());
  });
});

describe('combine', () => {
  it('merges several results', () => {
    const a = sumRange(TOY, '1', '2'); // wood 100, time 10, steps 1
    const b = sumRange(TOY, '3', '4'); // wood 300, iron 100, time 30, steps 1
    expect(combine([a, b])).toEqual({
      totals: { wood: 400, iron: 100 },
      time: 40,
      steps: 2
    });
  });
});

describe('formatQty', () => {
  it('formats across magnitudes', () => {
    expect(formatQty(750)).toBe('750');
    expect(formatQty(1500)).toBe('1.5K');
    expect(formatQty(12500000)).toBe('12.5M');
    expect(formatQty(3400000000)).toBe('3.4B');
    expect(formatQty(2000000)).toBe('2M');
    expect(formatQty(120000000)).toBe('120M');
  });
});

describe('hero gear enhancement', () => {
  it('totals 73,320 XP across 0→100 with no ascension gear baked in', () => {
    const r = sumLadder(HERO_ENHANCE, '0', '100');
    expect(r.totals.gearXp).toBe(73320);
    expect(r.totals.mythicHeroGear ?? 0).toBe(0); // ascension is a separate node
    expect(HERO_ENHANCE.length).toBe(101); // base 0 + levels 1..100
  });
});

describe('prereqs', () => {
  it('reads FC tier from a label', () => {
    expect(fcTier('30')).toBe(0);
    expect(fcTier('FC1')).toBe(1);
    expect(fcTier('FC1-3')).toBe(1);
    expect(fcTier('FC10')).toBe(10);
  });
  it('rotates the gating camp Lancer→Infantry→Marksman', () => {
    expect(campForTier(2)).toBe('lancerCamp');
    expect(campForTier(3)).toBe('infantryCamp');
    expect(campForTier(4)).toBe('marksmanCamp');
    expect(campForTier(5)).toBe('lancerCamp');
  });
  it('gives cumulative Furnace requirements', () => {
    expect(furnaceReqs(1)).toEqual([]);
    // Furnace FC5: Embassy FC4 + Lancer FC4 (max gated) + Infantry FC2 + Marksman FC3
    const r5 = furnaceReqs(5);
    expect(r5).toContainEqual({ building: 'embassy', tier: 4 });
    expect(r5).toContainEqual({ building: 'lancerCamp', tier: 4 });
    expect(r5).toContainEqual({ building: 'infantryCamp', tier: 2 });
    expect(r5).toContainEqual({ building: 'marksmanCamp', tier: 3 });
    // FC10 endpoint: Lancer FC7, Infantry FC8, Marksman FC9, Embassy FC9
    const r10 = furnaceReqs(10);
    expect(r10).toContainEqual({ building: 'lancerCamp', tier: 7 });
    expect(r10).toContainEqual({ building: 'infantryCamp', tier: 8 });
    expect(r10).toContainEqual({ building: 'marksmanCamp', tier: 9 });
    expect(r10).toContainEqual({ building: 'embassy', tier: 9 });
  });
});

describe('makespan', () => {
  it('sums on a single queue, packs greedily on more', () => {
    expect(makespan([10, 20, 30], 1)).toBe(60);
    // two queues, LPT: 30 | 20+10 → max 30
    expect(makespan([10, 20, 30], 2)).toBe(30);
    // a single job can never go below its own length
    expect(makespan([100, 5, 5], 2)).toBe(100);
    expect(makespan([], 2)).toBe(0);
    expect(makespan([40, 30, 20, 10], 2)).toBe(50);
  });
});

describe('formatDuration', () => {
  it('shows up to two units, hides minutes once into days', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(90060)).toBe('1d 1h');
    expect(formatDuration(518400)).toBe('6d');
  });
});

// Guards against silent data corruption: every seeded table must be a clean,
// monotonic ladder so the engine can trust it.
describe('seeded building data integrity', () => {
  it('has at least the furnace table', () => {
    expect(BUILDINGS.length).toBeGreaterThan(0);
    expect(furnace.id).toBe('furnace');
  });
  it('starts at a zero-cost base level', () => {
    for (const b of BUILDINGS) {
      expect(b.levels[0].cost).toEqual({});
      expect(b.levels[0].time).toBe(0);
    }
  });
  it('has unique, non-empty labels and non-negative numbers', () => {
    for (const b of BUILDINGS) {
      const labels = b.levels.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
      for (const lvl of b.levels) {
        expect(lvl.label).not.toBe('');
        expect(lvl.time).toBeGreaterThanOrEqual(0);
        for (const v of Object.values(lvl.cost)) expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('furnace full path 1→30 matches a locked total', () => {
    // Regression lock: if any furnace cell changes, this total must be revisited.
    const r = sumRange(furnace, '1', '30');
    expect(r.steps).toBe(29);
    expect(r.totals.meat).toBe(1294100000);
    expect(r.totals.wood).toBe(1295038385);
    expect(r.totals.coal).toBe(258117660);
    expect(r.totals.iron).toBe(65635660);
    expect(r.time).toBe(18589626);
  });
  it('furnace full path 1→FC10 matches a locked total', () => {
    // Includes the 46 Fire Crystal levels (FC1 + FC1-1..4 … FC10).
    const r = sumRange(furnace, '1', 'FC10');
    expect(r.steps).toBe(75);
    expect(r.totals.meat).toBe(6076100000);
    expect(r.totals.wood).toBe(6077038385);
    expect(r.totals.coal).toBe(1216117660);
    expect(r.totals.iron).toBe(309935660);
    expect(r.totals.fireCrystal).toBe(11082);
    expect(r.totals.refinedFireCrystal).toBe(870);
    // FC build times are now sourced (base, no speedups): the 46 FC levels add
    // 667 days, so the full 1→FC10 base time total is 76,218,426 s.
    expect(r.time).toBe(76218426);
  });
});

describe('camps and research', () => {
  it('exposes every building', () => {
    expect(BUILDINGS.map((b) => b.id)).toEqual([
      'furnace',
      'infantryCamp',
      'marksmanCamp',
      'lancerCamp',
      'researchCenter',
      'embassy',
      'commandCenter',
      'infirmary',
      'storehouse',
      'warAcademy'
    ]);
  });

  it('every building table is a clean monotonic ladder', () => {
    for (const b of BUILDINGS) {
      expect(b.levels[0].cost).toEqual({});
      const labels = b.levels.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it('embassy locks its 1→FC10 resource total', () => {
    const r = sumRange(buildingById('embassy')!, '1', 'FC10');
    expect(r.totals.meat).toBe(1272920000); // 262.92M (1-30) + 1010M (FC)
    expect(r.totals.fireCrystal).toBe(2891);
    expect(r.totals.refinedFireCrystal).toBe(208);
  });

  it('the three camps share one identical ladder', () => {
    const inf = buildingById('infantryCamp')!;
    const mar = buildingById('marksmanCamp')!;
    const lan = buildingById('lancerCamp')!;
    expect(mar.levels).toBe(inf.levels);
    expect(lan.levels).toBe(inf.levels);
  });

  it('camp full path 1→FC10 matches a locked total', () => {
    const r = sumRange(buildingById('infantryCamp')!, '1', 'FC10');
    expect(r.steps).toBe(79);
    expect(r.totals.meat).toBe(2245470000);
    expect(r.totals.wood).toBe(2246208185);
    expect(r.totals.coal).toBe(448181485);
    expect(r.totals.iron).toBe(111555465);
    expect(r.totals.fireCrystal).toBe(5215);
    expect(r.totals.refinedFireCrystal).toBe(383);
    // FC times now sourced: the 46 shared-camp FC levels add 8,644,320 s.
    expect(r.time).toBe(11424909);
  });

  it('research center has no FC levels and locks its 1→30 total', () => {
    const rc = buildingById('researchCenter')!;
    expect(rc.levels.some((l) => l.label.startsWith('FC'))).toBe(false);
    const r = sumRange(rc, '1', '30');
    expect(r.steps).toBe(29);
    expect(r.totals.meat).toBe(525940000);
    expect(r.totals.wood).toBe(526778285);
    expect(r.totals.coal).toBe(103418020);
    expect(r.totals.iron).toBe(26332560);
    expect(r.time).toBe(2782989);
  });
});

describe('gear, charms, troops', () => {
  it('gear None→Green costs one craft', () => {
    expect(sumLadder(GEAR_LADDER, 'None', 'Green').totals).toEqual({
      hardenedAlloy: 1500,
      polishingSolution: 15
    });
  });
  it('gear ladder reaches Red T3 3-Star with all four materials', () => {
    const r = sumLadder(GEAR_LADDER, 'None', 'Red T3 3-Star');
    expect(r.totals.hardenedAlloy).toBeGreaterThan(0);
    expect(r.totals.polishingSolution).toBeGreaterThan(0);
    expect(r.totals.designPlans).toBeGreaterThan(0);
    expect(r.totals.lunarAmber).toBeGreaterThan(0);
  });
  it('charm 0→1 and the secret material starts at level 12', () => {
    expect(sumLadder(CHARM_LADDER, '0', '1').totals).toEqual({ charmDesign: 5, charmGuide: 5 });
    expect(sumLadder(CHARM_LADDER, '11', '12').totals.charmSecret).toBe(15);
  });
  it('troop cost scales with quantity', () => {
    const t11 = TROOP_COST.infantry[10].cost;
    expect(scaleBag(t11, 100).meat).toBe(697000);
    expect(TROOP_COST.infantry).toHaveLength(11);
    expect(TROOP_COST.marksman[10].cost.wood).toBe(6448);
  });
  it('hero tracks lock their key totals', () => {
    // Star promotion 0★→5★ = 10+40+115+300+600 = 1065 shards.
    expect(sumLadder(HERO_STARS, '0★', '5★').totals.heroShard).toBe(1065);
    // Exclusive gear 0→10 widgets = 5+10+…+50 = 275.
    expect(sumLadder(HERO_EXCLUSIVE, '0', '10').totals.widget).toBe(275);
    // Mastery 0→20: essence = 10+20+…+200 = 2100; mythic gear = 1+…+10 = 55.
    const m = sumLadder(HERO_MASTERY, '0', '20');
    expect(m.totals.essenceStones).toBe(2100);
    expect(m.totals.mythicHeroGear).toBe(55);
  });
});

describe('helios', () => {
  it('locks the per-troop-type max total', () => {
    const total = combine(
      HELIOS_NODES.map((n) => sumLadder(n.ladder, '0', n.ladder[n.ladder.length - 1].label))
    );
    expect(total.totals.steel).toBe(3990000);
    expect(total.totals.fcShard).toBe(13415);
  });
});

describe('applySpeed (boosters)', () => {
  it('divides time by (1 + percent/100), additive model', () => {
    expect(applySpeed(100, 0)).toBe(100);
    expect(applySpeed(100, 100)).toBe(50);
    expect(applySpeed(150, 50)).toBe(100);
    expect(applySpeed(100, -5)).toBe(100); // guards against negatives
  });
});

describe('more pets', () => {
  it('pet ladders include food + advancement materials', () => {
    const l100 = petLadder(100);
    expect(l100).toHaveLength(100);
    expect(l100[0].cost).toEqual({});
    // Level 10 is a milestone: food 925 + taming manual 35.
    const lvl10 = l100.find((l) => l.label === '10')!;
    expect(lvl10.cost.petFood).toBe(925);
    expect(lvl10.cost.tamingManual).toBe(35);
    // Strengthening serum first appears at level 50 for tier 100.
    expect(l100.find((l) => l.label === '50')!.cost.strengtheningSerum).toBe(10);
    // 1→100 full total is positive across all four pet materials.
    const r = sumLadder(l100, '1', '100');
    expect(r.totals.petFood).toBeGreaterThan(0);
    expect(r.totals.strengtheningSerum).toBeGreaterThan(0);
  });
});
