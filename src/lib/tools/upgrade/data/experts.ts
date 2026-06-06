// Dawn Academy "Experts" — Affinity track. In-game the affinity bar runs through
// 11 NAMED relationship tiers (Stranger → Intimate); the first (Stranger) is the
// free starting state and the other 10 each cost Expert Sigils to advance into.
// So the ladder is the base "Stranger" + 10 paid steps. Source: wostools.net
// experts-calculator data bundle, cross-checked vs wos-guide.com (byte-identical
// sigil arrays) and the named-tier table on outof.games — per-expert totals
// VERIFIED across 3 independent sources (Cyrille/Agnes 275 … Romulus 1820, incl.
// Romulus's irregular 3rd step of 80). The separate Skill track (Books of
// Knowledge) isn't modelled yet.
import type { LevelCost } from '../types';

// The 11 affinity tiers, in order. TIERS[0] = Stranger (free start); the rest are
// the 10 Expert-Sigil advancements.
const TIERS = [
  'Stranger',
  'Acquaintance 1',
  'Acquaintance 2',
  'Acquaintance 3',
  'Casual 1',
  'Casual 2',
  'Casual 3',
  'Close 1',
  'Close 2',
  'Close 3',
  'Intimate'
];

function ladder(sigil: number[]): LevelCost[] {
  const out: LevelCost[] = [{ label: TIERS[0], cost: {}, time: 0 }];
  sigil.forEach((c, i) => out.push({ label: TIERS[i + 1], cost: { expertSigil: c }, time: 0 }));
  return out;
}

export interface Expert {
  id: string;
  name: string;
  /** Short focus area, shown as a subtitle. */
  focus: string;
  ladder: LevelCost[];
}

export const EXPERTS: Expert[] = [
  {
    id: 'cyrille',
    name: 'Cyrille',
    focus: 'Bear Hunt',
    ladder: ladder([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
  },
  {
    id: 'agnes',
    name: 'Agnes',
    focus: 'City Economy',
    ladder: ladder([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
  },
  {
    id: 'holger',
    name: 'Holger',
    focus: 'Arena',
    ladder: ladder([8, 16, 24, 32, 40, 48, 56, 64, 72, 80])
  },
  {
    id: 'romulus',
    name: 'Romulus',
    focus: 'PvP / Military',
    ladder: ladder([20, 40, 80, 120, 160, 200, 240, 280, 320, 360])
  },
  {
    id: 'baldur',
    name: 'Baldur',
    focus: 'Alliance Events',
    ladder: ladder([6, 12, 18, 24, 30, 36, 42, 48, 54, 60])
  },
  {
    id: 'fabian',
    name: 'Fabian',
    focus: 'Foundry Battle',
    ladder: ladder([12, 24, 36, 48, 60, 72, 84, 96, 108, 120])
  },
  {
    id: 'valeria',
    name: 'Valeria',
    focus: 'SvS Battle',
    ladder: ladder([20, 40, 60, 80, 100, 120, 140, 160, 180, 200])
  },
  {
    id: 'ronne',
    name: 'Ronne',
    focus: 'Tundra Trade',
    ladder: ladder([8, 16, 24, 32, 40, 48, 56, 64, 72, 80])
  },
  {
    id: 'kathy',
    name: 'Kathy',
    focus: 'Mining',
    ladder: ladder([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
  }
];
