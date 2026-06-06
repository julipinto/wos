// AUTO-GENERATED chief charm ladder. Source: deepfriedmind/wos-tools, cross-checked
// vs zenpaiang + whiteoutsurvival.app + whiteoutdata.com (levels 1-16 agree).
// Regenerate with /tmp/gen_gearcharm.mjs.
import type { LevelCost } from '../types';

/** 6 gear pieces x 3 charm slots each = 18 charm slots, all sharing this ladder. */
export const CHARM_PIECES = [
  { id: 'hat', name: 'Winter Hat' },
  { id: 'coat', name: "Valor's Embrace" },
  { id: 'ring', name: 'Ring of Resilience' },
  { id: 'watch', name: 'Durable Watch' },
  { id: 'pants', name: 'Explorer Pants' },
  { id: 'cudgel', name: 'Cudgel' }
] as const;

export const CHARM_SLOTS_PER_PIECE = 3;

/** Cost to upgrade INTO each level from the previous. '0' = unleveled base. */
export const CHARM_LADDER: LevelCost[] = [
  { label: '0', cost: {}, time: 0 },
  { label: '1', cost: { charmDesign: 5, charmGuide: 5 }, time: 0 },
  { label: '2', cost: { charmDesign: 15, charmGuide: 40 }, time: 0 },
  { label: '3', cost: { charmDesign: 40, charmGuide: 60 }, time: 0 },
  { label: '4', cost: { charmDesign: 100, charmGuide: 80 }, time: 0 },
  { label: '5', cost: { charmDesign: 200, charmGuide: 100 }, time: 0 },
  { label: '6', cost: { charmDesign: 300, charmGuide: 120 }, time: 0 },
  { label: '7', cost: { charmDesign: 400, charmGuide: 140 }, time: 0 },
  { label: '8', cost: { charmDesign: 400, charmGuide: 200 }, time: 0 },
  { label: '9', cost: { charmDesign: 400, charmGuide: 300 }, time: 0 },
  { label: '10', cost: { charmDesign: 420, charmGuide: 420 }, time: 0 },
  { label: '11', cost: { charmDesign: 420, charmGuide: 560 }, time: 0 },
  { label: '12', cost: { charmDesign: 450, charmGuide: 580, charmSecret: 15 }, time: 0 },
  { label: '13', cost: { charmDesign: 450, charmGuide: 580, charmSecret: 30 }, time: 0 },
  { label: '14', cost: { charmDesign: 500, charmGuide: 600, charmSecret: 45 }, time: 0 },
  { label: '15', cost: { charmDesign: 500, charmGuide: 600, charmSecret: 70 }, time: 0 },
  { label: '16', cost: { charmDesign: 550, charmGuide: 650, charmSecret: 100 }, time: 0 }
];
