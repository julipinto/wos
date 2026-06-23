// AUTO-GENERATED chief gear ladder. Source: deepfriedmind/wos-tools, cross-checked
// vs woscalculator.com + wostools.net + whiteoutdata.com (41 levels agree).
// Regenerate with /tmp/gen_gearcharm.mjs.
import type { LevelCost } from '../types';

/** The six chief gear pieces (all share the same upgrade cost ladder). */
export const GEAR_PIECES = [
  { id: 'hat', name: 'Winter Hat' },
  { id: 'coat', name: "Valor's Embrace" },
  { id: 'ring', name: 'Ring of Resilience' },
  { id: 'watch', name: 'Durable Watch' },
  { id: 'pants', name: 'Explorer Pants' },
  { id: 'cudgel', name: 'Cudgel' }
] as const;

/** Cost to upgrade INTO each tier from the previous. 'None' = unowned base. */
export const GEAR_LADDER: LevelCost[] = [
  { label: 'None', cost: {}, time: 0 },
  { label: 'Green', cost: { hardenedAlloy: 1500, polishingSolution: 15 }, time: 0 },
  { label: 'Green 1-Star', cost: { hardenedAlloy: 3800, polishingSolution: 40 }, time: 0 },
  { label: 'Blue', cost: { hardenedAlloy: 7000, polishingSolution: 70 }, time: 0 },
  { label: 'Blue 1-Star', cost: { hardenedAlloy: 9700, polishingSolution: 95 }, time: 0 },
  { label: 'Blue 2-Star', cost: { designPlans: 45 }, time: 0 },
  { label: 'Blue 3-Star', cost: { designPlans: 50 }, time: 0 },
  { label: 'Purple', cost: { designPlans: 60 }, time: 0 },
  { label: 'Purple 1-Star', cost: { designPlans: 70 }, time: 0 },
  {
    label: 'Purple 2-Star',
    cost: { hardenedAlloy: 6500, polishingSolution: 65, designPlans: 40 },
    time: 0
  },
  {
    label: 'Purple 3-Star',
    cost: { hardenedAlloy: 8000, polishingSolution: 80, designPlans: 50 },
    time: 0
  },
  {
    label: 'Purple T1',
    cost: { hardenedAlloy: 10000, polishingSolution: 95, designPlans: 60 },
    time: 0
  },
  {
    label: 'Purple T1 1-Star',
    cost: { hardenedAlloy: 11000, polishingSolution: 110, designPlans: 70 },
    time: 0
  },
  {
    label: 'Purple T1 2-Star',
    cost: { hardenedAlloy: 13000, polishingSolution: 130, designPlans: 85 },
    time: 0
  },
  {
    label: 'Purple T1 3-Star',
    cost: { hardenedAlloy: 15000, polishingSolution: 160, designPlans: 100 },
    time: 0
  },
  {
    label: 'Gold',
    cost: { hardenedAlloy: 22000, polishingSolution: 220, designPlans: 40 },
    time: 0
  },
  {
    label: 'Gold 1-Star',
    cost: { hardenedAlloy: 23000, polishingSolution: 230, designPlans: 40 },
    time: 0
  },
  {
    label: 'Gold 2-Star',
    cost: { hardenedAlloy: 25000, polishingSolution: 250, designPlans: 45 },
    time: 0
  },
  {
    label: 'Gold 3-Star',
    cost: { hardenedAlloy: 26000, polishingSolution: 260, designPlans: 45 },
    time: 0
  },
  {
    label: 'Gold T1',
    cost: { hardenedAlloy: 28000, polishingSolution: 280, designPlans: 45 },
    time: 0
  },
  {
    label: 'Gold T1 1-Star',
    cost: { hardenedAlloy: 30000, polishingSolution: 300, designPlans: 55 },
    time: 0
  },
  {
    label: 'Gold T1 2-Star',
    cost: { hardenedAlloy: 32000, polishingSolution: 320, designPlans: 55 },
    time: 0
  },
  {
    label: 'Gold T1 3-Star',
    cost: { hardenedAlloy: 35000, polishingSolution: 340, designPlans: 55 },
    time: 0
  },
  {
    label: 'Gold T2',
    cost: { hardenedAlloy: 38000, polishingSolution: 360, designPlans: 55 },
    time: 0
  },
  {
    label: 'Gold T2 1-Star',
    cost: { hardenedAlloy: 43000, polishingSolution: 430, designPlans: 75 },
    time: 0
  },
  {
    label: 'Gold T2 2-Star',
    cost: { hardenedAlloy: 45000, polishingSolution: 460, designPlans: 80 },
    time: 0
  },
  {
    label: 'Gold T2 3-Star',
    cost: { hardenedAlloy: 48000, polishingSolution: 500, designPlans: 85 },
    time: 0
  },
  {
    label: 'Red',
    cost: { hardenedAlloy: 50000, polishingSolution: 530, designPlans: 85, lunarAmber: 10 },
    time: 0
  },
  {
    label: 'Red 1-Star',
    cost: { hardenedAlloy: 52000, polishingSolution: 560, designPlans: 90, lunarAmber: 10 },
    time: 0
  },
  {
    label: 'Red 2-Star',
    cost: { hardenedAlloy: 54000, polishingSolution: 590, designPlans: 95, lunarAmber: 10 },
    time: 0
  },
  {
    label: 'Red 3-Star',
    cost: { hardenedAlloy: 56000, polishingSolution: 620, designPlans: 100, lunarAmber: 10 },
    time: 0
  },
  {
    label: 'Red T1',
    cost: { hardenedAlloy: 59000, polishingSolution: 670, designPlans: 110, lunarAmber: 15 },
    time: 0
  },
  {
    label: 'Red T1 1-Star',
    cost: { hardenedAlloy: 61000, polishingSolution: 700, designPlans: 115, lunarAmber: 15 },
    time: 0
  },
  {
    label: 'Red T1 2-Star',
    cost: { hardenedAlloy: 63000, polishingSolution: 730, designPlans: 120, lunarAmber: 15 },
    time: 0
  },
  {
    label: 'Red T1 3-Star',
    cost: { hardenedAlloy: 65000, polishingSolution: 760, designPlans: 125, lunarAmber: 15 },
    time: 0
  },
  {
    label: 'Red T2',
    cost: { hardenedAlloy: 68000, polishingSolution: 810, designPlans: 135, lunarAmber: 20 },
    time: 0
  },
  {
    label: 'Red T2 1-Star',
    cost: { hardenedAlloy: 70000, polishingSolution: 840, designPlans: 140, lunarAmber: 20 },
    time: 0
  },
  {
    label: 'Red T2 2-Star',
    cost: { hardenedAlloy: 72000, polishingSolution: 870, designPlans: 145, lunarAmber: 20 },
    time: 0
  },
  {
    label: 'Red T2 3-Star',
    cost: { hardenedAlloy: 74000, polishingSolution: 900, designPlans: 150, lunarAmber: 20 },
    time: 0
  },
  {
    label: 'Red T3',
    cost: { hardenedAlloy: 77000, polishingSolution: 950, designPlans: 160, lunarAmber: 25 },
    time: 0
  },
  {
    label: 'Red T3 1-Star',
    cost: { hardenedAlloy: 80000, polishingSolution: 990, designPlans: 165, lunarAmber: 25 },
    time: 0
  },
  {
    label: 'Red T3 2-Star',
    cost: { hardenedAlloy: 83000, polishingSolution: 1030, designPlans: 170, lunarAmber: 25 },
    time: 0
  },
  {
    label: 'Red T3 3-Star',
    cost: { hardenedAlloy: 86000, polishingSolution: 1070, designPlans: 180, lunarAmber: 25 },
    time: 0
  },
  // Red T4 — verified 2026-06-18 across fis-wos + 2 GitHub data repos (cost &
  // stat% agree); worth one in-game spot-check.
  {
    label: 'Red T4',
    cost: { hardenedAlloy: 120000, polishingSolution: 1500, designPlans: 250, lunarAmber: 40 },
    time: 0
  },
  {
    label: 'Red T4 1-Star',
    cost: { hardenedAlloy: 140000, polishingSolution: 1650, designPlans: 275, lunarAmber: 40 },
    time: 0
  },
  {
    label: 'Red T4 2-Star',
    cost: { hardenedAlloy: 160000, polishingSolution: 1800, designPlans: 300, lunarAmber: 40 },
    time: 0
  },
  {
    label: 'Red T4 3-Star',
    cost: { hardenedAlloy: 180000, polishingSolution: 1950, designPlans: 325, lunarAmber: 40 },
    time: 0
  }
];
