// AUTO-GENERATED research-tree totals (cost to max every node from zero).
// Source: wosnerdwarriors/wos-data research-upgrades.json (single source — the
// only complete structured research dataset found). Standard Research Center
// tech only; War Academy / Fire Crystal research is not yet covered.
// Regenerate with /tmp/gen_research.mjs.
import type { ResourceBag } from '../types';

export interface ResearchTree {
  id: string;
  /** i18n suffix under upgrade.research.trees.* */
  i18n: string;
  nodes: number;
  levels: number;
  total: ResourceBag;
  /** Total research time in seconds (base, no research-speed bonus). */
  time: number;
}

export const RESEARCH_TREES: ResearchTree[] = [
  {
    id: 'Growth',
    i18n: 'growth',
    nodes: 45,
    levels: 129,
    total: { meat: 212936910, wood: 212936910, coal: 41928050, iron: 10667410, steel: 3567230 },
    time: 76306573
  },
  {
    id: 'Economy',
    i18n: 'economy',
    nodes: 44,
    levels: 132,
    total: { meat: 162921000, wood: 162921000, coal: 32402820, iron: 8088480, steel: 3224660 },
    time: 14365430
  },
  {
    id: 'Battle',
    i18n: 'battle',
    nodes: 102,
    levels: 459,
    total: { meat: 901101200, wood: 901101200, coal: 180581420, iron: 45264010, steel: 16429900 },
    time: 337973110
  }
];
