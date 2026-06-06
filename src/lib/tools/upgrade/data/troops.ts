// Troop training cost PER SINGLE TROOP, tiers T1–T11. Source: woscalc.com
// embedded data; T11 values verified against community references for all three
// troop types. Time is base seconds (no training-speed bonus applied).
import type { ResourceBag } from '../types';

export interface TroopCost {
  cost: ResourceBag;
  /** Base training time per troop, seconds. */
  time: number;
}

export const TROOP_TYPES = [
  { id: 'infantry', i18n: 'infantry' },
  { id: 'marksman', i18n: 'marksman' },
  { id: 'lancer', i18n: 'lancer' }
] as const;

export const MAX_TIER = 11;

/** Index 0 = T1 … index 10 = T11. */
export const TROOP_COST: Record<string, TroopCost[]> = {
  infantry: [
    { cost: { meat: 36, wood: 27, coal: 7, iron: 2 }, time: 12 },
    { cost: { meat: 58, wood: 44, coal: 10, iron: 3 }, time: 17 },
    { cost: { meat: 92, wood: 69, coal: 17, iron: 4 }, time: 24 },
    { cost: { meat: 120, wood: 90, coal: 21, iron: 5 }, time: 32 },
    { cost: { meat: 156, wood: 117, coal: 27, iron: 6 }, time: 44 },
    { cost: { meat: 186, wood: 140, coal: 33, iron: 7 }, time: 60 },
    { cost: { meat: 279, wood: 210, coal: 49, iron: 11 }, time: 83 },
    { cost: { meat: 558, wood: 419, coal: 98, iron: 21 }, time: 113 },
    { cost: { meat: 1394, wood: 1046, coal: 244, iron: 51 }, time: 131 },
    { cost: { meat: 2788, wood: 2091, coal: 488, iron: 102 }, time: 152 },
    { cost: { meat: 6970, wood: 5228, coal: 1220, iron: 253 }, time: 180 }
  ],
  marksman: [
    { cost: { meat: 23, wood: 34, coal: 6, iron: 2 }, time: 12 },
    { cost: { meat: 36, wood: 54, coal: 9, iron: 4 }, time: 17 },
    { cost: { meat: 58, wood: 86, coal: 15, iron: 5 }, time: 24 },
    { cost: { meat: 75, wood: 111, coal: 19, iron: 6 }, time: 32 },
    { cost: { meat: 97, wood: 144, coal: 24, iron: 8 }, time: 44 },
    { cost: { meat: 117, wood: 173, coal: 29, iron: 10 }, time: 60 },
    { cost: { meat: 175, wood: 258, coal: 44, iron: 14 }, time: 83 },
    { cost: { meat: 349, wood: 516, coal: 87, iron: 28 }, time: 113 },
    { cost: { meat: 872, wood: 1290, coal: 217, iron: 70 }, time: 131 },
    { cost: { meat: 1740, wood: 2579, coal: 433, iron: 140 }, time: 152 },
    { cost: { meat: 4357, wood: 6448, coal: 1081, iron: 349 }, time: 180 }
  ],
  lancer: [
    { cost: { meat: 32, wood: 30, coal: 7, iron: 2 }, time: 12 },
    { cost: { meat: 51, wood: 48, coal: 10, iron: 3 }, time: 17 },
    { cost: { meat: 81, wood: 76, coal: 16, iron: 4 }, time: 24 },
    { cost: { meat: 105, wood: 99, coal: 21, iron: 5 }, time: 32 },
    { cost: { meat: 136, wood: 129, coal: 27, iron: 7 }, time: 44 },
    { cost: { meat: 163, wood: 154, coal: 32, iron: 8 }, time: 60 },
    { cost: { meat: 244, wood: 231, coal: 48, iron: 11 }, time: 83 },
    { cost: { meat: 488, wood: 461, coal: 95, iron: 22 }, time: 113 },
    { cost: { meat: 1220, wood: 1151, coal: 237, iron: 55 }, time: 131 },
    { cost: { meat: 2440, wood: 2301, coal: 474, iron: 109 }, time: 152 },
    { cost: { meat: 6099, wood: 5751, coal: 1185, iron: 271 }, time: 180 }
  ]
};
