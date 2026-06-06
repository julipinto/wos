/**
 * Building upgrade tables. All figures are as shown in-game (rounded) — that's
 * what every community calculator uses. Each table records its provenance and
 * is only `verified: true` once cross-checked across 2+ independent sources.
 *
 * VERIFIED:
 *   - Furnace 1→FC10 (3 sources: BSD/destructoid/whiteoutdata+wiki for 1–30;
 *     handbook/wiki/deepfriedmind for FC).
 *   - Infantry / Marksman / Lancer Camp 1→FC10 (one shared ladder; BSD vs
 *     whiteoutdata for 1–30, deepfriedmind vs wiki for FC).
 *   - Research Center 1→30 (BSD == whiteoutdata exactly; no FC levels).
 *
 * NOT YET MODELLED (next phases): Embassy, Command Center, Infirmary, War
 * Academy (deepfriedmind has their FC; the BSD 1–30 for Command Center /
 * Infirmary / Storehouse / Barricade looked synthetic and Embassy had a coal
 * typo, so those need a real 1–30 source). Build times for FC levels are not
 * yet reliably sourced, so every FC entry uses time:0.
 *
 * Attribution: numbers are game facts; we transcribed our own structures.
 * Sources consulted include djmzsamantha/whiteout-survival-calculator
 * (BSD-3-Clause), deepfriedmind/wos-tools, whiteoutdata.com and the WOS wiki.
 */

import type { LevelCost, UpgradeTable } from '../types';
import { EXTRA_BUILDINGS } from './buildings-extra';

const FURNACE: UpgradeTable = {
  id: 'furnace',
  name: 'Furnace',
  meta: {
    source:
      'Cross-checked 3 independent sources: djmzsamantha/whiteout-survival-calculator (BSD), destructoid.com, whiteoutdata.com/wiki',
    verified: true,
    verifiedAt: '2026-06-05',
    notes:
      'Resources verified end-to-end: levels 1–30 (3 sources) and FC1–FC10 incl. in-tier sub-steps (3 sources: handbook=main levels, wiki=sub-steps, deepfriedmind=both; meat/wood/coal/iron agree across all). Figures are as shown in-game (rounded). Caveat: FC build times not yet sourced — FC entries use time:0, so the build-time total covers 1→30 only.'
  },
  levels: [
    { label: '1', cost: {}, time: 0 },
    { label: '2', cost: { wood: 180 }, time: 6 },
    { label: '3', cost: { wood: 805 }, time: 60 },
    { label: '4', cost: { wood: 1800, coal: 360 }, time: 180 },
    { label: '5', cost: { wood: 7600, coal: 1500 }, time: 600 },
    { label: '6', cost: { wood: 19000, coal: 3800, iron: 960 }, time: 1800 },
    { label: '7', cost: { wood: 69000, coal: 13000, iron: 3400 }, time: 3600 },
    { label: '8', cost: { wood: 120000, coal: 25000, iron: 6300 }, time: 9000 },
    { label: '9', cost: { wood: 260000, coal: 52000, iron: 13000 }, time: 16200 },
    { label: '10', cost: { wood: 460000, coal: 92000, iron: 23000 }, time: 21600 },
    { label: '11', cost: { meat: 1300000, wood: 1300000, coal: 260000, iron: 65000 }, time: 27000 },
    { label: '12', cost: { meat: 1600000, wood: 1600000, coal: 330000, iron: 84000 }, time: 32400 },
    {
      label: '13',
      cost: { meat: 2300000, wood: 2300000, coal: 470000, iron: 110000 },
      time: 39600
    },
    {
      label: '14',
      cost: { meat: 3100000, wood: 3100000, coal: 640000, iron: 150000 },
      time: 50400
    },
    {
      label: '15',
      cost: { meat: 4600000, wood: 4600000, coal: 930000, iron: 230000 },
      time: 64800
    },
    {
      label: '16',
      cost: { meat: 5900000, wood: 5900000, coal: 1100000, iron: 290000 },
      time: 109680
    },
    {
      label: '17',
      cost: { meat: 9300000, wood: 9300000, coal: 1800000, iron: 460000 },
      time: 131040
    },
    {
      label: '18',
      cost: { meat: 12000000, wood: 12000000, coal: 2500000, iron: 620000 },
      time: 158340
    },
    {
      label: '19',
      cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 780000 },
      time: 239400
    },
    {
      label: '20',
      cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000 },
      time: 295080
    },
    {
      label: '21',
      cost: { meat: 27000000, wood: 27000000, coal: 5400000, iron: 1300000 },
      time: 383940
    },
    {
      label: '22',
      cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000 },
      time: 576000
    },
    {
      label: '23',
      cost: { meat: 44000000, wood: 44000000, coal: 8900000, iron: 2200000 },
      time: 811200
    },
    {
      label: '24',
      cost: { meat: 60000000, wood: 60000000, coal: 12000000, iron: 3000000 },
      time: 1129980
    },
    {
      label: '25',
      cost: { meat: 81000000, wood: 81000000, coal: 16000000, iron: 4000000 },
      time: 1592520
    },
    {
      label: '26',
      cost: { meat: 100000000, wood: 100000000, coal: 21000000, iron: 5200000 },
      time: 1825560
    },
    {
      label: '27',
      cost: { meat: 140000000, wood: 140000000, coal: 24000000, iron: 7400000 },
      time: 2192580
    },
    {
      label: '28',
      cost: { meat: 190000000, wood: 190000000, coal: 39000000, iron: 9900000 },
      time: 2511720
    },
    {
      label: '29',
      cost: { meat: 240000000, wood: 240000000, coal: 49000000, iron: 12000000 },
      time: 2893320
    },
    {
      label: '30',
      cost: { meat: 300000000, wood: 300000000, coal: 60000000, iron: 15000000 },
      time: 3472020
    },
    // --- Fire Crystal levels (FC1 → FC10, with the 4 in-tier sub-steps) ---
    // Resource costs cross-checked across 3 sources: the per-tier main levels
    // (FCn) match whiteoutsurvivalhandbook, the in-tier sub-steps (FCn-1..4)
    // match the wiki, and both match deepfriedmind/wos-tools' structured data;
    // meat/wood/coal/iron agree across all three. Build times for FC are NOT
    // yet reliably sourced, so they're 0 for now (resource totals are exact).
    {
      label: 'FC1',
      cost: { meat: 67000000, wood: 67000000, coal: 13000000, iron: 3300000, fireCrystal: 132 },
      time: 0
    },
    {
      label: 'FC1-1',
      cost: { meat: 72000000, wood: 72000000, coal: 14000000, iron: 3600000, fireCrystal: 158 },
      time: 0
    },
    {
      label: 'FC1-2',
      cost: { meat: 72000000, wood: 72000000, coal: 14000000, iron: 3600000, fireCrystal: 158 },
      time: 0
    },
    {
      label: 'FC1-3',
      cost: { meat: 72000000, wood: 72000000, coal: 14000000, iron: 3600000, fireCrystal: 158 },
      time: 0
    },
    {
      label: 'FC1-4',
      cost: { meat: 72000000, wood: 72000000, coal: 14000000, iron: 3600000, fireCrystal: 158 },
      time: 0
    },
    {
      label: 'FC2',
      cost: { meat: 72000000, wood: 72000000, coal: 14000000, iron: 3600000, fireCrystal: 158 },
      time: 0
    },
    {
      label: 'FC2-1',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000, fireCrystal: 238 },
      time: 0
    },
    {
      label: 'FC2-2',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000, fireCrystal: 238 },
      time: 0
    },
    {
      label: 'FC2-3',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000, fireCrystal: 238 },
      time: 0
    },
    {
      label: 'FC2-4',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000, fireCrystal: 238 },
      time: 0
    },
    {
      label: 'FC3',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000, fireCrystal: 238 },
      time: 0
    },
    {
      label: 'FC3-1',
      cost: { meat: 82000000, wood: 82000000, coal: 16000000, iron: 4100000, fireCrystal: 280 },
      time: 0
    },
    {
      label: 'FC3-2',
      cost: { meat: 82000000, wood: 82000000, coal: 16000000, iron: 4100000, fireCrystal: 280 },
      time: 0
    },
    {
      label: 'FC3-3',
      cost: { meat: 82000000, wood: 82000000, coal: 16000000, iron: 4100000, fireCrystal: 280 },
      time: 0
    },
    {
      label: 'FC3-4',
      cost: { meat: 82000000, wood: 82000000, coal: 16000000, iron: 4100000, fireCrystal: 280 },
      time: 0
    },
    {
      label: 'FC4',
      cost: { meat: 82000000, wood: 82000000, coal: 16000000, iron: 4100000, fireCrystal: 280 },
      time: 0
    },
    {
      label: 'FC4-1',
      cost: { meat: 84000000, wood: 84000000, coal: 16000000, iron: 4200000, fireCrystal: 335 },
      time: 0
    },
    {
      label: 'FC4-2',
      cost: { meat: 84000000, wood: 84000000, coal: 16000000, iron: 4200000, fireCrystal: 335 },
      time: 0
    },
    {
      label: 'FC4-3',
      cost: { meat: 84000000, wood: 84000000, coal: 16000000, iron: 4200000, fireCrystal: 335 },
      time: 0
    },
    {
      label: 'FC4-4',
      cost: { meat: 84000000, wood: 84000000, coal: 16000000, iron: 4200000, fireCrystal: 335 },
      time: 0
    },
    {
      label: 'FC5',
      cost: { meat: 84000000, wood: 84000000, coal: 16000000, iron: 4200000, fireCrystal: 335 },
      time: 0
    },
    {
      label: 'FC5-1',
      cost: {
        meat: 96000000,
        wood: 96000000,
        coal: 19000000,
        iron: 4800000,
        fireCrystal: 200,
        refinedFireCrystal: 10
      },
      time: 0
    },
    {
      label: 'FC5-2',
      cost: {
        meat: 96000000,
        wood: 96000000,
        coal: 19000000,
        iron: 4800000,
        fireCrystal: 200,
        refinedFireCrystal: 10
      },
      time: 0
    },
    {
      label: 'FC5-3',
      cost: {
        meat: 96000000,
        wood: 96000000,
        coal: 19000000,
        iron: 4800000,
        fireCrystal: 200,
        refinedFireCrystal: 10
      },
      time: 0
    },
    {
      label: 'FC5-4',
      cost: {
        meat: 96000000,
        wood: 96000000,
        coal: 19000000,
        iron: 4800000,
        fireCrystal: 200,
        refinedFireCrystal: 10
      },
      time: 0
    },
    {
      label: 'FC6',
      cost: {
        meat: 96000000,
        wood: 96000000,
        coal: 19000000,
        iron: 4800000,
        fireCrystal: 100,
        refinedFireCrystal: 20
      },
      time: 0
    },
    {
      label: 'FC6-1',
      cost: {
        meat: 100000000,
        wood: 100000000,
        coal: 21000000,
        iron: 5400000,
        fireCrystal: 240,
        refinedFireCrystal: 15
      },
      time: 0
    },
    {
      label: 'FC6-2',
      cost: {
        meat: 100000000,
        wood: 100000000,
        coal: 21000000,
        iron: 5400000,
        fireCrystal: 240,
        refinedFireCrystal: 15
      },
      time: 0
    },
    {
      label: 'FC6-3',
      cost: {
        meat: 100000000,
        wood: 100000000,
        coal: 21000000,
        iron: 5400000,
        fireCrystal: 240,
        refinedFireCrystal: 15
      },
      time: 0
    },
    {
      label: 'FC6-4',
      cost: {
        meat: 100000000,
        wood: 100000000,
        coal: 21000000,
        iron: 5400000,
        fireCrystal: 240,
        refinedFireCrystal: 15
      },
      time: 0
    },
    {
      label: 'FC7',
      cost: {
        meat: 100000000,
        wood: 100000000,
        coal: 21000000,
        iron: 5400000,
        fireCrystal: 120,
        refinedFireCrystal: 30
      },
      time: 0
    },
    {
      label: 'FC7-1',
      cost: {
        meat: 130000000,
        wood: 130000000,
        coal: 26000000,
        iron: 6600000,
        fireCrystal: 240,
        refinedFireCrystal: 20
      },
      time: 0
    },
    {
      label: 'FC7-2',
      cost: {
        meat: 130000000,
        wood: 130000000,
        coal: 26000000,
        iron: 6600000,
        fireCrystal: 240,
        refinedFireCrystal: 20
      },
      time: 0
    },
    {
      label: 'FC7-3',
      cost: {
        meat: 130000000,
        wood: 130000000,
        coal: 26000000,
        iron: 6600000,
        fireCrystal: 240,
        refinedFireCrystal: 20
      },
      time: 0
    },
    {
      label: 'FC7-4',
      cost: {
        meat: 130000000,
        wood: 130000000,
        coal: 26000000,
        iron: 6600000,
        fireCrystal: 240,
        refinedFireCrystal: 20
      },
      time: 0
    },
    {
      label: 'FC8',
      cost: {
        meat: 130000000,
        wood: 130000000,
        coal: 26000000,
        iron: 6600000,
        fireCrystal: 120,
        refinedFireCrystal: 40
      },
      time: 0
    },
    {
      label: 'FC8-1',
      cost: {
        meat: 140000000,
        wood: 140000000,
        coal: 29000000,
        iron: 7200000,
        fireCrystal: 280,
        refinedFireCrystal: 30
      },
      time: 0
    },
    {
      label: 'FC8-2',
      cost: {
        meat: 140000000,
        wood: 140000000,
        coal: 29000000,
        iron: 7200000,
        fireCrystal: 280,
        refinedFireCrystal: 30
      },
      time: 0
    },
    {
      label: 'FC8-3',
      cost: {
        meat: 140000000,
        wood: 140000000,
        coal: 29000000,
        iron: 7200000,
        fireCrystal: 280,
        refinedFireCrystal: 30
      },
      time: 0
    },
    {
      label: 'FC8-4',
      cost: {
        meat: 140000000,
        wood: 140000000,
        coal: 29000000,
        iron: 7200000,
        fireCrystal: 280,
        refinedFireCrystal: 30
      },
      time: 0
    },
    {
      label: 'FC9',
      cost: {
        meat: 140000000,
        wood: 140000000,
        coal: 29000000,
        iron: 7200000,
        fireCrystal: 140,
        refinedFireCrystal: 60
      },
      time: 0
    },
    {
      label: 'FC9-1',
      cost: {
        meat: 160000000,
        wood: 160000000,
        coal: 33000000,
        iron: 8400000,
        fireCrystal: 350,
        refinedFireCrystal: 70
      },
      time: 0
    },
    {
      label: 'FC9-2',
      cost: {
        meat: 160000000,
        wood: 160000000,
        coal: 33000000,
        iron: 8400000,
        fireCrystal: 350,
        refinedFireCrystal: 70
      },
      time: 0
    },
    {
      label: 'FC9-3',
      cost: {
        meat: 160000000,
        wood: 160000000,
        coal: 33000000,
        iron: 8400000,
        fireCrystal: 350,
        refinedFireCrystal: 70
      },
      time: 0
    },
    {
      label: 'FC9-4',
      cost: {
        meat: 160000000,
        wood: 160000000,
        coal: 33000000,
        iron: 8400000,
        fireCrystal: 350,
        refinedFireCrystal: 70
      },
      time: 0
    },
    {
      label: 'FC10',
      cost: {
        meat: 160000000,
        wood: 160000000,
        coal: 33000000,
        iron: 8400000,
        fireCrystal: 175,
        refinedFireCrystal: 140
      },
      time: 0
    }
  ]
};

/** Troop camps (Infantry / Marksman / Lancer) share an identical cost ladder. */
const CAMP_LEVELS: LevelCost[] = [
  { label: '1', cost: {}, time: 0 },
  { label: '2', cost: { wood: 140 }, time: 9 },
  { label: '3', cost: { wood: 645 }, time: 45 },
  { label: '4', cost: { wood: 1400, coal: 285 }, time: 135 },
  { label: '5', cost: { wood: 6000, coal: 1200 }, time: 270 },
  { label: '6', cost: { wood: 15000, coal: 3000, iron: 765 }, time: 540 },
  { label: '7', cost: { wood: 55000, coal: 11000, iron: 2700 }, time: 1080 },
  { label: '8', cost: { wood: 100000, coal: 20000, iron: 5000 }, time: 1620 },
  { label: '9', cost: { wood: 200000, coal: 41000, iron: 10000 }, time: 2430 },
  { label: '10', cost: { wood: 360000, coal: 73000, iron: 18000 }, time: 3240 },
  { label: '11', cost: { meat: 460000, wood: 460000, coal: 92000, iron: 23000 }, time: 4050 },
  { label: '12', cost: { meat: 580000, wood: 580000, coal: 110000, iron: 29000 }, time: 4860 },
  { label: '13', cost: { meat: 830000, wood: 830000, coal: 160000, iron: 41000 }, time: 5940 },
  { label: '14', cost: { meat: 1100000, wood: 1100000, coal: 220000, iron: 55000 }, time: 7560 },
  { label: '15', cost: { meat: 1600000, wood: 1600000, coal: 320000, iron: 81000 }, time: 9720 },
  { label: '16', cost: { meat: 2000000, wood: 2000000, coal: 410000, iron: 100000 }, time: 16440 },
  { label: '17', cost: { meat: 3200000, wood: 3200000, coal: 650000, iron: 160000 }, time: 19740 },
  { label: '18', cost: { meat: 4300000, wood: 4300000, coal: 870000, iron: 210000 }, time: 23700 },
  { label: '19', cost: { meat: 5400000, wood: 5400000, coal: 1000000, iron: 270000 }, time: 35550 },
  { label: '20', cost: { meat: 7500000, wood: 7500000, coal: 1500000, iron: 370000 }, time: 44430 },
  { label: '21', cost: { meat: 9500000, wood: 9500000, coal: 1900000, iron: 470000 }, time: 57750 },
  {
    label: '22',
    cost: { meat: 12000000, wood: 12000000, coal: 2500000, iron: 630000 },
    time: 86640
  },
  {
    label: '23',
    cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 780000 },
    time: 120120
  },
  {
    label: '24',
    cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000 },
    time: 169860
  },
  {
    label: '25',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000 },
    time: 240180
  },
  {
    label: '26',
    cost: { meat: 36000000, wood: 36000000, coal: 7300000, iron: 1800000 },
    time: 271020
  },
  {
    label: '27',
    cost: { meat: 52000000, wood: 52000000, coal: 10000000, iron: 2600000 },
    time: 328140
  },
  {
    label: '28',
    cost: { meat: 69000000, wood: 69000000, coal: 13000000, iron: 3400000 },
    time: 374940
  },
  {
    label: '29',
    cost: { meat: 86000000, wood: 86000000, coal: 17000000, iron: 4300000 },
    time: 432180
  },
  {
    label: '30',
    cost: { meat: 100000000, wood: 100000000, coal: 21000000, iron: 5800000 },
    time: 518400
  },
  {
    label: '30-1',
    cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 59 },
    time: 0
  },
  {
    label: '30-2',
    cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 59 },
    time: 0
  },
  {
    label: '30-3',
    cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 59 },
    time: 0
  },
  {
    label: '30-4',
    cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 59 },
    time: 0
  },
  {
    label: 'FC1',
    cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 59 },
    time: 0
  },
  {
    label: 'FC1-1',
    cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 71 },
    time: 0
  },
  {
    label: 'FC1-2',
    cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 71 },
    time: 0
  },
  {
    label: 'FC1-3',
    cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 71 },
    time: 0
  },
  {
    label: 'FC1-4',
    cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 71 },
    time: 0
  },
  {
    label: 'FC2',
    cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 71 },
    time: 0
  },
  {
    label: 'FC2-1',
    cost: { meat: 27000000, wood: 27000000, coal: 5500000, iron: 1300000, fireCrystal: 107 },
    time: 0
  },
  {
    label: 'FC2-2',
    cost: { meat: 27000000, wood: 27000000, coal: 5500000, iron: 1300000, fireCrystal: 107 },
    time: 0
  },
  {
    label: 'FC2-3',
    cost: { meat: 27000000, wood: 27000000, coal: 5500000, iron: 1300000, fireCrystal: 107 },
    time: 0
  },
  {
    label: 'FC2-4',
    cost: { meat: 27000000, wood: 27000000, coal: 5500000, iron: 1300000, fireCrystal: 107 },
    time: 0
  },
  {
    label: 'FC3',
    cost: { meat: 27000000, wood: 27000000, coal: 5500000, iron: 1300000, fireCrystal: 107 },
    time: 0
  },
  {
    label: 'FC3-1',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000, fireCrystal: 126 },
    time: 0
  },
  {
    label: 'FC3-2',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000, fireCrystal: 126 },
    time: 0
  },
  {
    label: 'FC3-3',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000, fireCrystal: 126 },
    time: 0
  },
  {
    label: 'FC3-4',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000, fireCrystal: 126 },
    time: 0
  },
  {
    label: 'FC4',
    cost: { meat: 28000000, wood: 28000000, coal: 5700000, iron: 1400000, fireCrystal: 126 },
    time: 0
  },
  {
    label: 'FC4-1',
    cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000, fireCrystal: 150 },
    time: 0
  },
  {
    label: 'FC4-2',
    cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000, fireCrystal: 150 },
    time: 0
  },
  {
    label: 'FC4-3',
    cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000, fireCrystal: 150 },
    time: 0
  },
  {
    label: 'FC4-4',
    cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000, fireCrystal: 150 },
    time: 0
  },
  {
    label: 'FC5',
    cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000, fireCrystal: 150 },
    time: 0
  },
  {
    label: 'FC5-1',
    cost: {
      meat: 33000000,
      wood: 33000000,
      coal: 6700000,
      iron: 1600000,
      fireCrystal: 90,
      refinedFireCrystal: 4
    },
    time: 0
  },
  {
    label: 'FC5-2',
    cost: {
      meat: 33000000,
      wood: 33000000,
      coal: 6700000,
      iron: 1600000,
      fireCrystal: 90,
      refinedFireCrystal: 4
    },
    time: 0
  },
  {
    label: 'FC5-3',
    cost: {
      meat: 33000000,
      wood: 33000000,
      coal: 6700000,
      iron: 1600000,
      fireCrystal: 90,
      refinedFireCrystal: 4
    },
    time: 0
  },
  {
    label: 'FC5-4',
    cost: {
      meat: 33000000,
      wood: 33000000,
      coal: 6700000,
      iron: 1600000,
      fireCrystal: 90,
      refinedFireCrystal: 4
    },
    time: 0
  },
  {
    label: 'FC6',
    cost: {
      meat: 33000000,
      wood: 33000000,
      coal: 6700000,
      iron: 1600000,
      fireCrystal: 45,
      refinedFireCrystal: 9
    },
    time: 0
  },
  {
    label: 'FC6-1',
    cost: {
      meat: 38000000,
      wood: 38000000,
      coal: 7600000,
      iron: 1900000,
      fireCrystal: 108,
      refinedFireCrystal: 6
    },
    time: 0
  },
  {
    label: 'FC6-2',
    cost: {
      meat: 38000000,
      wood: 38000000,
      coal: 7600000,
      iron: 1900000,
      fireCrystal: 108,
      refinedFireCrystal: 6
    },
    time: 0
  },
  {
    label: 'FC6-3',
    cost: {
      meat: 38000000,
      wood: 38000000,
      coal: 7600000,
      iron: 1900000,
      fireCrystal: 108,
      refinedFireCrystal: 6
    },
    time: 0
  },
  {
    label: 'FC6-4',
    cost: {
      meat: 38000000,
      wood: 38000000,
      coal: 7600000,
      iron: 1900000,
      fireCrystal: 108,
      refinedFireCrystal: 6
    },
    time: 0
  },
  {
    label: 'FC7',
    cost: {
      meat: 38000000,
      wood: 38000000,
      coal: 7600000,
      iron: 1900000,
      fireCrystal: 54,
      refinedFireCrystal: 13
    },
    time: 0
  },
  {
    label: 'FC7-1',
    cost: {
      meat: 46000000,
      wood: 46000000,
      coal: 9300000,
      iron: 2300000,
      fireCrystal: 108,
      refinedFireCrystal: 9
    },
    time: 0
  },
  {
    label: 'FC7-2',
    cost: {
      meat: 46000000,
      wood: 46000000,
      coal: 9300000,
      iron: 2300000,
      fireCrystal: 108,
      refinedFireCrystal: 9
    },
    time: 0
  },
  {
    label: 'FC7-3',
    cost: {
      meat: 46000000,
      wood: 46000000,
      coal: 9300000,
      iron: 2300000,
      fireCrystal: 108,
      refinedFireCrystal: 9
    },
    time: 0
  },
  {
    label: 'FC7-4',
    cost: {
      meat: 46000000,
      wood: 46000000,
      coal: 9300000,
      iron: 2300000,
      fireCrystal: 108,
      refinedFireCrystal: 9
    },
    time: 0
  },
  {
    label: 'FC8',
    cost: {
      meat: 46000000,
      wood: 46000000,
      coal: 9300000,
      iron: 2300000,
      fireCrystal: 54,
      refinedFireCrystal: 19
    },
    time: 0
  },
  {
    label: 'FC8-1',
    cost: {
      meat: 50000000,
      wood: 50000000,
      coal: 10000000,
      iron: 2500000,
      fireCrystal: 126,
      refinedFireCrystal: 13
    },
    time: 0
  },
  {
    label: 'FC8-2',
    cost: {
      meat: 50000000,
      wood: 50000000,
      coal: 10000000,
      iron: 2500000,
      fireCrystal: 126,
      refinedFireCrystal: 13
    },
    time: 0
  },
  {
    label: 'FC8-3',
    cost: {
      meat: 50000000,
      wood: 50000000,
      coal: 10000000,
      iron: 2500000,
      fireCrystal: 126,
      refinedFireCrystal: 13
    },
    time: 0
  },
  {
    label: 'FC8-4',
    cost: {
      meat: 50000000,
      wood: 50000000,
      coal: 10000000,
      iron: 2500000,
      fireCrystal: 126,
      refinedFireCrystal: 13
    },
    time: 0
  },
  {
    label: 'FC9',
    cost: {
      meat: 50000000,
      wood: 50000000,
      coal: 10000000,
      iron: 2500000,
      fireCrystal: 63,
      refinedFireCrystal: 27
    },
    time: 0
  },
  {
    label: 'FC9-1',
    cost: {
      meat: 59000000,
      wood: 59000000,
      coal: 11000000,
      iron: 2900000,
      fireCrystal: 157,
      refinedFireCrystal: 31
    },
    time: 0
  },
  {
    label: 'FC9-2',
    cost: {
      meat: 59000000,
      wood: 59000000,
      coal: 11000000,
      iron: 2900000,
      fireCrystal: 157,
      refinedFireCrystal: 31
    },
    time: 0
  },
  {
    label: 'FC9-3',
    cost: {
      meat: 59000000,
      wood: 59000000,
      coal: 11000000,
      iron: 2900000,
      fireCrystal: 157,
      refinedFireCrystal: 31
    },
    time: 0
  },
  {
    label: 'FC9-4',
    cost: {
      meat: 59000000,
      wood: 59000000,
      coal: 11000000,
      iron: 2900000,
      fireCrystal: 157,
      refinedFireCrystal: 31
    },
    time: 0
  },
  {
    label: 'FC10',
    cost: {
      meat: 59000000,
      wood: 59000000,
      coal: 11000000,
      iron: 2900000,
      fireCrystal: 78,
      refinedFireCrystal: 63
    },
    time: 0
  }
];

function campTable(id: string, name: string): UpgradeTable {
  return {
    id,
    name,
    meta: {
      source:
        'Cross-checked: BSD gameData (1–30) vs whiteoutdata.com (1–30) + deepfriedmind/wos-tools & wiki (FC). The 3 camps share one cost table (confirmed in both structured datasets).',
      verified: true,
      verifiedAt: '2026-06-06',
      notes:
        'Resources verified. Levels 1–30 match BSD & whiteoutdata except L23 iron (780k) and L30 iron (5.8M), where the live whiteoutdata value is used. 30-1..30-4 are the level-30 sub-steps before FC1. FC build times not sourced (time:0).'
    },
    levels: CAMP_LEVELS
  };
}

const INFANTRY_CAMP = campTable('infantryCamp', 'Infantry Camp');
const MARKSMAN_CAMP = campTable('marksmanCamp', 'Marksman Camp');
const LANCER_CAMP = campTable('lancerCamp', 'Lancer Camp');

/** Research Center — no Fire Crystal levels (FC research lives in the War Academy). */
const RESEARCH_CENTER: UpgradeTable = {
  id: 'researchCenter',
  name: 'Research Center',
  meta: {
    source: 'Cross-checked: BSD gameData vs whiteoutdata.com (identical, 0 diffs)',
    verified: true,
    verifiedAt: '2026-06-06',
    notes:
      'Levels 1–30. No FC levels. BSD L25 build-time typo (151380) corrected to 240180 to match the shared schedule.'
  },
  levels: [
    { label: '1', cost: {}, time: 0 },
    { label: '2', cost: { wood: 160 }, time: 9 },
    { label: '3', cost: { wood: 725 }, time: 45 },
    { label: '4', cost: { wood: 1600, coal: 320 }, time: 135 },
    { label: '5', cost: { wood: 6800, coal: 1300 }, time: 270 },
    { label: '6', cost: { wood: 17000, coal: 3400, iron: 860 }, time: 540 },
    { label: '7', cost: { wood: 62000, coal: 12000, iron: 3100 }, time: 1080 },
    { label: '8', cost: { wood: 110000, coal: 22000, iron: 5600 }, time: 1620 },
    { label: '9', cost: { wood: 230000, coal: 47000, iron: 11000 }, time: 2430 },
    { label: '10', cost: { wood: 410000, coal: 82000, iron: 20000 }, time: 3240 },
    { label: '11', cost: { meat: 520000, wood: 520000, coal: 100000, iron: 26000 }, time: 4050 },
    { label: '12', cost: { meat: 670000, wood: 670000, coal: 130000, iron: 33000 }, time: 4860 },
    { label: '13', cost: { meat: 950000, wood: 950000, coal: 190000, iron: 47000 }, time: 5940 },
    { label: '14', cost: { meat: 1200000, wood: 1200000, coal: 250000, iron: 63000 }, time: 7560 },
    { label: '15', cost: { meat: 1800000, wood: 1800000, coal: 370000, iron: 93000 }, time: 9720 },
    {
      label: '16',
      cost: { meat: 2300000, wood: 2300000, coal: 470000, iron: 110000 },
      time: 16440
    },
    {
      label: '17',
      cost: { meat: 3700000, wood: 3700000, coal: 740000, iron: 180000 },
      time: 19740
    },
    {
      label: '18',
      cost: { meat: 5000000, wood: 5000000, coal: 1000000, iron: 250000 },
      time: 23700
    },
    {
      label: '19',
      cost: { meat: 6200000, wood: 6200000, coal: 1200000, iron: 310000 },
      time: 35550
    },
    {
      label: '20',
      cost: { meat: 8600000, wood: 8600000, coal: 1700000, iron: 430000 },
      time: 44430
    },
    {
      label: '21',
      cost: { meat: 10000000, wood: 10000000, coal: 2100000, iron: 540000 },
      time: 57750
    },
    {
      label: '22',
      cost: { meat: 14000000, wood: 14000000, coal: 2800000, iron: 720000 },
      time: 86640
    },
    {
      label: '23',
      cost: { meat: 17000000, wood: 17000000, coal: 3500000, iron: 890000 },
      time: 120120
    },
    {
      label: '24',
      cost: { meat: 24000000, wood: 24000000, coal: 4800000, iron: 1200000 },
      time: 169860
    },
    {
      label: '25',
      cost: { meat: 32000000, wood: 32000000, coal: 6500000, iron: 1600000 },
      time: 240180
    },
    {
      label: '26',
      cost: { meat: 42000000, wood: 42000000, coal: 8400000, iron: 2100000 },
      time: 271020
    },
    {
      label: '27',
      cost: { meat: 59000000, wood: 59000000, coal: 11000000, iron: 2900000 },
      time: 328140
    },
    {
      label: '28',
      cost: { meat: 79000000, wood: 79000000, coal: 15000000, iron: 3900000 },
      time: 374940
    },
    {
      label: '29',
      cost: { meat: 98000000, wood: 98000000, coal: 19000000, iron: 4900000 },
      time: 432180
    },
    {
      label: '30',
      cost: { meat: 120000000, wood: 120000000, coal: 24000000, iron: 6000000 },
      time: 520800
    }
  ]
};

export const BUILDINGS: UpgradeTable[] = [
  FURNACE,
  INFANTRY_CAMP,
  MARKSMAN_CAMP,
  LANCER_CAMP,
  RESEARCH_CENTER,
  ...EXTRA_BUILDINGS
];

export function buildingById(id: string): UpgradeTable | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
