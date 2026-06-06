// AUTO-GENERATED building tables (embassy, command center, infirmary, storehouse,
// war academy). Resources cross-validated; see each table's meta for sources.
// Regenerate with /tmp/gen_extra.mjs. Do not hand-edit.
import type { UpgradeTable } from '../types';

export const EXTRA_BUILDINGS: UpgradeTable[] = [
  {
    id: 'embassy',
    name: 'Embassy',
    meta: {
      source: 'whiteoutdata.com (1-30) + deepfriedmind/wos-tools & WOS wiki (FC)',
      verified: true,
      verifiedAt: '2026-06-06',
      notes:
        'Resources verified across sources. 1-30 from whiteoutdata (corrects BSD synthetic/typo values); FC1-FC10 from deepfriedmind, confirmed by the wiki. FC build times not sourced (time:0).'
    },
    levels: [
      { label: '1', cost: {}, time: 0 },
      { label: '2', cost: { wood: 90 }, time: 10 },
      { label: '3', cost: { wood: 400 }, time: 60 },
      { label: '4', cost: { wood: 900, coal: 180 }, time: 120 },
      { label: '5', cost: { wood: 3800, coal: 760 }, time: 400 },
      { label: '6', cost: { wood: 9600, coal: 1900, iron: 480 }, time: 800 },
      { label: '7', cost: { wood: 34000, coal: 6900, iron: 1700 }, time: 1500 },
      { label: '8', cost: { wood: 63000, coal: 12000, iron: 3100 }, time: 2700 },
      { label: '9', cost: { wood: 130000, coal: 26000, iron: 6500 }, time: 7200 },
      { label: '10', cost: { wood: 230000, coal: 46000, iron: 11000 }, time: 14250 },
      { label: '11', cost: { meat: 260000, wood: 260000, coal: 52000, iron: 13000 }, time: 17820 },
      { label: '12', cost: { meat: 330000, wood: 330000, coal: 67000, iron: 16000 }, time: 21360 },
      { label: '13', cost: { meat: 470000, wood: 470000, coal: 95000, iron: 23000 }, time: 26130 },
      { label: '14', cost: { meat: 630000, wood: 630000, coal: 120000, iron: 31000 }, time: 33240 },
      { label: '15', cost: { meat: 930000, wood: 930000, coal: 180000, iron: 46000 }, time: 42750 },
      {
        label: '16',
        cost: { meat: 1100000, wood: 1100000, coal: 230000, iron: 59000 },
        time: 71000
      },
      {
        label: '17',
        cost: { meat: 1800000, wood: 1800000, coal: 370000, iron: 93000 },
        time: 86880
      },
      {
        label: '18',
        cost: { meat: 2500000, wood: 2500000, coal: 500000, iron: 120000 },
        time: 104280
      },
      {
        label: '19',
        cost: { meat: 3100000, wood: 3100000, coal: 620000, iron: 150000 },
        time: 156420
      },
      {
        label: '20',
        cost: { meat: 4300000, wood: 4300000, coal: 860000, iron: 210000 },
        time: 195540
      },
      {
        label: '21',
        cost: { meat: 5400000, wood: 5400000, coal: 1000000, iron: 270000 },
        time: 254160
      },
      {
        label: '22',
        cost: { meat: 7200000, wood: 7200000, coal: 1400000, iron: 360000 },
        time: 381300
      },
      {
        label: '23',
        cost: { meat: 8900000, wood: 8900000, coal: 1700000, iron: 440000 },
        time: 533820
      },
      {
        label: '24',
        cost: { meat: 12000000, wood: 12000000, coal: 2400000, iron: 600000 },
        time: 747360
      },
      {
        label: '25',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 810000 },
        time: 1046280
      },
      {
        label: '26',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000 },
        time: 1203240
      },
      {
        label: '27',
        cost: { meat: 29000000, wood: 29000000, coal: 5900000, iron: 1400000 },
        time: 1443900
      },
      {
        label: '28',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000 },
        time: 1660500
      },
      {
        label: '29',
        cost: { meat: 49000000, wood: 49000000, coal: 9800000, iron: 2400000 },
        time: 1909560
      },
      {
        label: '30',
        cost: { meat: 60000000, wood: 60000000, coal: 12000000, iron: 3000000 },
        time: 2291520
      },
      {
        label: '30-1',
        cost: { meat: 13000000, wood: 13000000, coal: 2700000, iron: 670000, fireCrystal: 33 },
        time: 0
      },
      {
        label: '30-2',
        cost: { meat: 13000000, wood: 13000000, coal: 2700000, iron: 670000, fireCrystal: 33 },
        time: 0
      },
      {
        label: '30-3',
        cost: { meat: 13000000, wood: 13000000, coal: 2700000, iron: 670000, fireCrystal: 33 },
        time: 0
      },
      {
        label: '30-4',
        cost: { meat: 13000000, wood: 13000000, coal: 2700000, iron: 670000, fireCrystal: 33 },
        time: 0
      },
      {
        label: 'FC1',
        cost: { meat: 13000000, wood: 13000000, coal: 2700000, iron: 670000, fireCrystal: 33 },
        time: 0
      },
      {
        label: 'FC1-1',
        cost: { meat: 14000000, wood: 14000000, coal: 2900000, iron: 720000, fireCrystal: 39 },
        time: 0
      },
      {
        label: 'FC1-2',
        cost: { meat: 14000000, wood: 14000000, coal: 2900000, iron: 720000, fireCrystal: 39 },
        time: 0
      },
      {
        label: 'FC1-3',
        cost: { meat: 14000000, wood: 14000000, coal: 2900000, iron: 720000, fireCrystal: 39 },
        time: 0
      },
      {
        label: 'FC1-4',
        cost: { meat: 14000000, wood: 14000000, coal: 2900000, iron: 720000, fireCrystal: 39 },
        time: 0
      },
      {
        label: 'FC2',
        cost: { meat: 14000000, wood: 14000000, coal: 2900000, iron: 1000000, fireCrystal: 39 },
        time: 0
      },
      {
        label: 'FC2-1',
        cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 790000, fireCrystal: 59 },
        time: 0
      },
      {
        label: 'FC2-2',
        cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 790000, fireCrystal: 59 },
        time: 0
      },
      {
        label: 'FC2-3',
        cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 790000, fireCrystal: 59 },
        time: 0
      },
      {
        label: 'FC2-4',
        cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 790000, fireCrystal: 59 },
        time: 0
      },
      {
        label: 'FC3',
        cost: { meat: 15000000, wood: 15000000, coal: 3100000, iron: 790000, fireCrystal: 59 },
        time: 0
      },
      {
        label: 'FC3-1',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 820000, fireCrystal: 70 },
        time: 0
      },
      {
        label: 'FC3-2',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 820000, fireCrystal: 70 },
        time: 0
      },
      {
        label: 'FC3-3',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 820000, fireCrystal: 70 },
        time: 0
      },
      {
        label: 'FC3-4',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 820000, fireCrystal: 70 },
        time: 0
      },
      {
        label: 'FC4',
        cost: { meat: 16000000, wood: 16000000, coal: 3200000, iron: 820000, fireCrystal: 70 },
        time: 0
      },
      {
        label: 'FC4-1',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 83 },
        time: 0
      },
      {
        label: 'FC4-2',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 83 },
        time: 0
      },
      {
        label: 'FC4-3',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 83 },
        time: 0
      },
      {
        label: 'FC4-4',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 83 },
        time: 0
      },
      {
        label: 'FC5',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 83 },
        time: 0
      },
      {
        label: 'FC5-1',
        cost: {
          meat: 19000000,
          wood: 19000000,
          coal: 3800000,
          iron: 960000,
          fireCrystal: 50,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-2',
        cost: {
          meat: 19000000,
          wood: 19000000,
          coal: 3800000,
          iron: 960000,
          fireCrystal: 50,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-3',
        cost: {
          meat: 19000000,
          wood: 19000000,
          coal: 3800000,
          iron: 960000,
          fireCrystal: 50,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-4',
        cost: {
          meat: 19000000,
          wood: 19000000,
          coal: 3800000,
          iron: 960000,
          fireCrystal: 50,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC6',
        cost: {
          meat: 19000000,
          wood: 19000000,
          coal: 3800000,
          iron: 960000,
          fireCrystal: 25,
          refinedFireCrystal: 5
        },
        time: 0
      },
      {
        label: 'FC6-1',
        cost: {
          meat: 21000000,
          wood: 21000000,
          coal: 4300000,
          iron: 1000000,
          fireCrystal: 60,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-2',
        cost: {
          meat: 21000000,
          wood: 21000000,
          coal: 4300000,
          iron: 1000000,
          fireCrystal: 60,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-3',
        cost: {
          meat: 21000000,
          wood: 21000000,
          coal: 4300000,
          iron: 1000000,
          fireCrystal: 60,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-4',
        cost: {
          meat: 21000000,
          wood: 21000000,
          coal: 4300000,
          iron: 1000000,
          fireCrystal: 60,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC7',
        cost: {
          meat: 21000000,
          wood: 21000000,
          coal: 4300000,
          iron: 1000000,
          fireCrystal: 30,
          refinedFireCrystal: 7
        },
        time: 0
      },
      {
        label: 'FC7-1',
        cost: {
          meat: 26000000,
          wood: 26000000,
          coal: 5300000,
          iron: 1300000,
          fireCrystal: 60,
          refinedFireCrystal: 5
        },
        time: 0
      },
      {
        label: 'FC7-2',
        cost: {
          meat: 26000000,
          wood: 26000000,
          coal: 5300000,
          iron: 1300000,
          fireCrystal: 60,
          refinedFireCrystal: 5
        },
        time: 0
      },
      {
        label: 'FC7-3',
        cost: {
          meat: 26000000,
          wood: 26000000,
          coal: 5300000,
          iron: 1300000,
          fireCrystal: 60,
          refinedFireCrystal: 5
        },
        time: 0
      },
      {
        label: 'FC7-4',
        cost: {
          meat: 26000000,
          wood: 26000000,
          coal: 5300000,
          iron: 1300000,
          fireCrystal: 60,
          refinedFireCrystal: 5
        },
        time: 0
      },
      {
        label: 'FC8',
        cost: {
          meat: 26000000,
          wood: 26000000,
          coal: 5300000,
          iron: 1300000,
          fireCrystal: 30,
          refinedFireCrystal: 10
        },
        time: 0
      },
      {
        label: 'FC8-1',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 70,
          refinedFireCrystal: 7
        },
        time: 0
      },
      {
        label: 'FC8-2',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 70,
          refinedFireCrystal: 7
        },
        time: 0
      },
      {
        label: 'FC8-3',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 70,
          refinedFireCrystal: 7
        },
        time: 0
      },
      {
        label: 'FC8-4',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 70,
          refinedFireCrystal: 7
        },
        time: 0
      },
      {
        label: 'FC9',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 35,
          refinedFireCrystal: 15
        },
        time: 0
      },
      {
        label: 'FC9-1',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6700000,
          iron: 1600000,
          fireCrystal: 87,
          refinedFireCrystal: 17
        },
        time: 0
      },
      {
        label: 'FC9-2',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6700000,
          iron: 1600000,
          fireCrystal: 87,
          refinedFireCrystal: 17
        },
        time: 0
      },
      {
        label: 'FC9-3',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6700000,
          iron: 1600000,
          fireCrystal: 87,
          refinedFireCrystal: 17
        },
        time: 0
      },
      {
        label: 'FC9-4',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6700000,
          iron: 1600000,
          fireCrystal: 87,
          refinedFireCrystal: 17
        },
        time: 0
      },
      {
        label: 'FC10',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6700000,
          iron: 1600000,
          fireCrystal: 43,
          refinedFireCrystal: 35
        },
        time: 0
      }
    ]
  },
  {
    id: 'commandCenter',
    name: 'Command Center',
    meta: {
      source: 'whiteoutdata.com (1-30) + deepfriedmind/wos-tools & WOS wiki (FC)',
      verified: true,
      verifiedAt: '2026-06-06',
      notes:
        'Resources verified across sources. 1-30 from whiteoutdata (corrects BSD synthetic/typo values); FC1-FC10 from deepfriedmind, confirmed by the wiki. FC build times not sourced (time:0).'
    },
    levels: [
      { label: '1', cost: {}, time: 0 },
      { label: '2', cost: { wood: 125 }, time: 8 },
      { label: '3', cost: { wood: 565 }, time: 35 },
      { label: '4', cost: { wood: 1200, coal: 250 }, time: 105 },
      { label: '5', cost: { wood: 5300, coal: 1000 }, time: 215 },
      { label: '6', cost: { wood: 13000, coal: 2600, iron: 670 }, time: 430 },
      { label: '7', cost: { wood: 48000, coal: 9600, iron: 2400 }, time: 840 },
      { label: '8', cost: { wood: 88000, coal: 17000, iron: 4400 }, time: 1290 },
      { label: '9', cost: { wood: 180000, coal: 36000, iron: 9100 }, time: 1920 },
      { label: '10', cost: { wood: 320000, coal: 64000, iron: 16000 }, time: 2580 },
      { label: '11', cost: { meat: 390000, wood: 390000, coal: 79000, iron: 19000 }, time: 3240 },
      { label: '12', cost: { meat: 500000, wood: 500000, coal: 100000, iron: 25000 }, time: 3870 },
      { label: '13', cost: { meat: 710000, wood: 710000, coal: 140000, iron: 35000 }, time: 4740 },
      { label: '14', cost: { meat: 940000, wood: 940000, coal: 180000, iron: 47000 }, time: 6030 },
      {
        label: '15',
        cost: { meat: 1300000, wood: 1300000, coal: 270000, iron: 69000 },
        time: 7770
      },
      {
        label: '16',
        cost: { meat: 1700000, wood: 1700000, coal: 350000, iron: 89000 },
        time: 13140
      },
      {
        label: '17',
        cost: { meat: 2700000, wood: 2700000, coal: 550000, iron: 130000 },
        time: 15780
      },
      {
        label: '18',
        cost: { meat: 3700000, wood: 3700000, coal: 750000, iron: 180000 },
        time: 18960
      },
      {
        label: '19',
        cost: { meat: 4700000, wood: 4700000, coal: 940000, iron: 230000 },
        time: 28440
      },
      {
        label: '20',
        cost: { meat: 6400000, wood: 6400000, coal: 1200000, iron: 320000 },
        time: 35520
      },
      {
        label: '21',
        cost: { meat: 8100000, wood: 8100000, coal: 1600000, iron: 400000 },
        time: 46200
      },
      {
        label: '22',
        cost: { meat: 10000000, wood: 10000000, coal: 2100000, iron: 540000 },
        time: 69330
      },
      {
        label: '23',
        cost: { meat: 13000000, wood: 13000000, coal: 2600000, iron: 670000 },
        time: 97020
      },
      {
        label: '24',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000 },
        time: 135840
      },
      {
        label: '25',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000 },
        time: 190200
      },
      {
        label: '26',
        cost: { meat: 31000000, wood: 31000000, coal: 6300000, iron: 1500000 },
        time: 218760
      },
      {
        label: '27',
        cost: { meat: 44000000, wood: 44000000, coal: 8900000, iron: 2200000 },
        time: 262500
      },
      {
        label: '28',
        cost: { meat: 59000000, wood: 59000000, coal: 11000000, iron: 2900000 },
        time: 301860
      },
      {
        label: '29',
        cost: { meat: 73000000, wood: 73000000, coal: 14000000, iron: 3600000 },
        time: 347160
      },
      {
        label: '30',
        cost: { meat: 90000000, wood: 90000000, coal: 18000000, iron: 4500000 },
        time: 416640
      },
      {
        label: '30-1',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-2',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-3',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-4',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000, fireCrystal: 26 },
        time: 0
      },
      {
        label: 'FC1',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000, fireCrystal: 26 },
        time: 0
      },
      {
        label: 'FC1-1',
        cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-2',
        cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-3',
        cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-4',
        cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC2',
        cost: { meat: 21000000, wood: 21000000, coal: 4300000, iron: 1000000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC2-1',
        cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-2',
        cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-3',
        cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-4',
        cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC3',
        cost: { meat: 23000000, wood: 23000000, coal: 4700000, iron: 1100000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC3-1',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-2',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-3',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-4',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC4',
        cost: { meat: 24000000, wood: 24000000, coal: 4900000, iron: 1200000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC4-1',
        cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-2',
        cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-3',
        cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-4',
        cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC5',
        cost: { meat: 25000000, wood: 25000000, coal: 5000000, iron: 1200000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC5-1',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-2',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-3',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-4',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC6',
        cost: {
          meat: 29000000,
          wood: 29000000,
          coal: 5800000,
          iron: 1400000,
          fireCrystal: 20,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC6-1',
        cost: {
          meat: 32000000,
          wood: 32000000,
          coal: 6500000,
          iron: 1500000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-2',
        cost: {
          meat: 32000000,
          wood: 32000000,
          coal: 6500000,
          iron: 1500000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-3',
        cost: {
          meat: 32000000,
          wood: 32000000,
          coal: 6500000,
          iron: 1500000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-4',
        cost: {
          meat: 32000000,
          wood: 32000000,
          coal: 6500000,
          iron: 1500000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC7',
        cost: {
          meat: 32000000,
          wood: 32000000,
          coal: 6500000,
          iron: 1500000,
          fireCrystal: 24,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC7-1',
        cost: {
          meat: 39000000,
          wood: 39000000,
          coal: 7900000,
          iron: 1900000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-2',
        cost: {
          meat: 39000000,
          wood: 39000000,
          coal: 7900000,
          iron: 1900000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-3',
        cost: {
          meat: 39000000,
          wood: 39000000,
          coal: 7900000,
          iron: 1900000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-4',
        cost: {
          meat: 39000000,
          wood: 39000000,
          coal: 7900000,
          iron: 1900000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC8',
        cost: {
          meat: 39000000,
          wood: 39000000,
          coal: 7900000,
          iron: 1900000,
          fireCrystal: 24,
          refinedFireCrystal: 8
        },
        time: 0
      },
      {
        label: 'FC8-1',
        cost: {
          meat: 43000000,
          wood: 43000000,
          coal: 8700000,
          iron: 2100000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-2',
        cost: {
          meat: 43000000,
          wood: 43000000,
          coal: 8700000,
          iron: 2100000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-3',
        cost: {
          meat: 43000000,
          wood: 43000000,
          coal: 8700000,
          iron: 2100000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-4',
        cost: {
          meat: 43000000,
          wood: 43000000,
          coal: 8700000,
          iron: 2100000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC9',
        cost: {
          meat: 43000000,
          wood: 43000000,
          coal: 8700000,
          iron: 2100000,
          fireCrystal: 28,
          refinedFireCrystal: 12
        },
        time: 0
      },
      {
        label: 'FC9-1',
        cost: {
          meat: 50000000,
          wood: 50000000,
          coal: 10000000,
          iron: 2500000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-2',
        cost: {
          meat: 50000000,
          wood: 50000000,
          coal: 10000000,
          iron: 2500000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-3',
        cost: {
          meat: 50000000,
          wood: 50000000,
          coal: 10000000,
          iron: 2500000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-4',
        cost: {
          meat: 50000000,
          wood: 50000000,
          coal: 10000000,
          iron: 2500000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC10',
        cost: {
          meat: 50000000,
          wood: 50000000,
          coal: 10000000,
          iron: 2500000,
          fireCrystal: 35,
          refinedFireCrystal: 28
        },
        time: 0
      }
    ]
  },
  {
    id: 'infirmary',
    name: 'Infirmary',
    meta: {
      source: 'whiteoutdata.com (1-30) + deepfriedmind/wos-tools & WOS wiki (FC)',
      verified: true,
      verifiedAt: '2026-06-06',
      notes:
        'Resources verified across sources. 1-30 from whiteoutdata (corrects BSD synthetic/typo values); FC1-FC10 from deepfriedmind, confirmed by the wiki. FC build times not sourced (time:0).'
    },
    levels: [
      { label: '1', cost: {}, time: 0 },
      { label: '2', cost: { wood: 100 }, time: 9 },
      { label: '3', cost: { wood: 460 }, time: 40 },
      { label: '4', cost: { wood: 1000, coal: 205 }, time: 125 },
      { label: '5', cost: { wood: 4300, coal: 865 }, time: 250 },
      { label: '6', cost: { wood: 10000, coal: 2100, iron: 545 }, time: 500 },
      { label: '7', cost: { wood: 39000, coal: 7800, iron: 1900 }, time: 990 },
      { label: '8', cost: { wood: 72000, coal: 14000, iron: 3600 }, time: 1500 },
      { label: '9', cost: { wood: 140000, coal: 29000, iron: 7400 }, time: 2250 },
      { label: '10', cost: { wood: 260000, coal: 52000, iron: 13000 }, time: 3000 },
      { label: '11', cost: { meat: 320000, wood: 320000, coal: 65000, iron: 16000 }, time: 3780 },
      { label: '12', cost: { meat: 420000, wood: 420000, coal: 84000, iron: 21000 }, time: 4530 },
      { label: '13', cost: { meat: 590000, wood: 590000, coal: 110000, iron: 29000 }, time: 5520 },
      { label: '14', cost: { meat: 780000, wood: 780000, coal: 150000, iron: 39000 }, time: 7050 },
      {
        label: '15',
        cost: { meat: 1100000, wood: 1100000, coal: 230000, iron: 58000 },
        time: 9060
      },
      {
        label: '16',
        cost: { meat: 1400000, wood: 1400000, coal: 290000, iron: 74000 },
        time: 15360
      },
      {
        label: '17',
        cost: { meat: 2300000, wood: 2300000, coal: 460000, iron: 100000 },
        time: 18420
      },
      {
        label: '18',
        cost: { meat: 3100000, wood: 3100000, coal: 620000, iron: 150000 },
        time: 22110
      },
      {
        label: '19',
        cost: { meat: 3900000, wood: 3900000, coal: 780000, iron: 190000 },
        time: 33180
      },
      {
        label: '20',
        cost: { meat: 5300000, wood: 5300000, coal: 1000000, iron: 260000 },
        time: 41460
      },
      {
        label: '21',
        cost: { meat: 6800000, wood: 6800000, coal: 1300000, iron: 340000 },
        time: 53910
      },
      {
        label: '22',
        cost: { meat: 9000000, wood: 9000000, coal: 1800000, iron: 450000 },
        time: 80880
      },
      {
        label: '23',
        cost: { meat: 11000000, wood: 11000000, coal: 2200000, iron: 560000 },
        time: 113220
      },
      {
        label: '24',
        cost: { meat: 15000000, wood: 15000000, coal: 3000000, iron: 750000 },
        time: 158520
      },
      {
        label: '25',
        cost: { meat: 20000000, wood: 20000000, coal: 4000000, iron: 1000000 },
        time: 221940
      },
      {
        label: '26',
        cost: { meat: 26000000, wood: 26000000, coal: 5200000, iron: 1300000 },
        time: 255240
      },
      {
        label: '27',
        cost: { meat: 37000000, wood: 37000000, coal: 7400000, iron: 1800000 },
        time: 306240
      },
      {
        label: '28',
        cost: { meat: 49000000, wood: 49000000, coal: 9900000, iron: 2400000 },
        time: 352200
      },
      {
        label: '29',
        cost: { meat: 61000000, wood: 61000000, coal: 12000000, iron: 3000000 },
        time: 405060
      },
      {
        label: '30',
        cost: { meat: 75000000, wood: 75000000, coal: 15000000, iron: 3700000 },
        time: 486060
      },
      {
        label: '30-1',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-2',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-3',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 26 },
        time: 0
      },
      {
        label: '30-4',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 26 },
        time: 0
      },
      {
        label: 'FC1',
        cost: { meat: 16000000, wood: 16000000, coal: 3300000, iron: 840000, fireCrystal: 26 },
        time: 0
      },
      {
        label: 'FC1-1',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-2',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-3',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC1-4',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC2',
        cost: { meat: 18000000, wood: 18000000, coal: 3600000, iron: 900000, fireCrystal: 31 },
        time: 0
      },
      {
        label: 'FC2-1',
        cost: { meat: 19000000, wood: 19000000, coal: 3900000, iron: 990000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-2',
        cost: { meat: 19000000, wood: 19000000, coal: 3900000, iron: 990000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-3',
        cost: { meat: 19000000, wood: 19000000, coal: 3900000, iron: 990000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC2-4',
        cost: { meat: 19000000, wood: 19000000, coal: 3900000, iron: 990000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC3',
        cost: { meat: 19000000, wood: 19000000, coal: 3900000, iron: 990000, fireCrystal: 47 },
        time: 0
      },
      {
        label: 'FC3-1',
        cost: { meat: 20000000, wood: 20000000, coal: 4100000, iron: 1000000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-2',
        cost: { meat: 20000000, wood: 20000000, coal: 4100000, iron: 1000000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-3',
        cost: { meat: 20000000, wood: 20000000, coal: 4100000, iron: 1000000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC3-4',
        cost: { meat: 20000000, wood: 20000000, coal: 4100000, iron: 1000000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC4',
        cost: { meat: 20000000, wood: 20000000, coal: 4100000, iron: 1000000, fireCrystal: 56 },
        time: 0
      },
      {
        label: 'FC4-1',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-2',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-3',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC4-4',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC5',
        cost: { meat: 21000000, wood: 21000000, coal: 4200000, iron: 1000000, fireCrystal: 67 },
        time: 0
      },
      {
        label: 'FC5-1',
        cost: {
          meat: 24000000,
          wood: 24000000,
          coal: 4800000,
          iron: 1200000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-2',
        cost: {
          meat: 24000000,
          wood: 24000000,
          coal: 4800000,
          iron: 1200000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-3',
        cost: {
          meat: 24000000,
          wood: 24000000,
          coal: 4800000,
          iron: 1200000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC5-4',
        cost: {
          meat: 24000000,
          wood: 24000000,
          coal: 4800000,
          iron: 1200000,
          fireCrystal: 40,
          refinedFireCrystal: 2
        },
        time: 0
      },
      {
        label: 'FC6',
        cost: {
          meat: 24000000,
          wood: 24000000,
          coal: 4800000,
          iron: 1200000,
          fireCrystal: 20,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC6-1',
        cost: {
          meat: 27000000,
          wood: 27000000,
          coal: 5400000,
          iron: 1300000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-2',
        cost: {
          meat: 27000000,
          wood: 27000000,
          coal: 5400000,
          iron: 1300000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-3',
        cost: {
          meat: 27000000,
          wood: 27000000,
          coal: 5400000,
          iron: 1300000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC6-4',
        cost: {
          meat: 27000000,
          wood: 27000000,
          coal: 5400000,
          iron: 1300000,
          fireCrystal: 48,
          refinedFireCrystal: 3
        },
        time: 0
      },
      {
        label: 'FC7',
        cost: {
          meat: 27000000,
          wood: 27000000,
          coal: 5400000,
          iron: 1300000,
          fireCrystal: 24,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC7-1',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6600000,
          iron: 1600000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-2',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6600000,
          iron: 1600000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-3',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6600000,
          iron: 1600000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC7-4',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6600000,
          iron: 1600000,
          fireCrystal: 48,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC8',
        cost: {
          meat: 33000000,
          wood: 33000000,
          coal: 6600000,
          iron: 1600000,
          fireCrystal: 24,
          refinedFireCrystal: 8
        },
        time: 0
      },
      {
        label: 'FC8-1',
        cost: {
          meat: 36000000,
          wood: 36000000,
          coal: 7200000,
          iron: 1800000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-2',
        cost: {
          meat: 36000000,
          wood: 36000000,
          coal: 7200000,
          iron: 1800000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-3',
        cost: {
          meat: 36000000,
          wood: 36000000,
          coal: 7200000,
          iron: 1800000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC8-4',
        cost: {
          meat: 36000000,
          wood: 36000000,
          coal: 7200000,
          iron: 1800000,
          fireCrystal: 56,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC9',
        cost: {
          meat: 36000000,
          wood: 36000000,
          coal: 7200000,
          iron: 1800000,
          fireCrystal: 28,
          refinedFireCrystal: 12
        },
        time: 0
      },
      {
        label: 'FC9-1',
        cost: {
          meat: 42000000,
          wood: 42000000,
          coal: 8400000,
          iron: 2100000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-2',
        cost: {
          meat: 42000000,
          wood: 42000000,
          coal: 8400000,
          iron: 2100000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-3',
        cost: {
          meat: 42000000,
          wood: 42000000,
          coal: 8400000,
          iron: 2100000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC9-4',
        cost: {
          meat: 42000000,
          wood: 42000000,
          coal: 8400000,
          iron: 2100000,
          fireCrystal: 70,
          refinedFireCrystal: 14
        },
        time: 0
      },
      {
        label: 'FC10',
        cost: {
          meat: 42000000,
          wood: 42000000,
          coal: 8400000,
          iron: 2100000,
          fireCrystal: 35,
          refinedFireCrystal: 28
        },
        time: 0
      }
    ]
  },
  {
    id: 'storehouse',
    name: 'Storehouse',
    meta: {
      source: 'whiteoutdata.com (1-30)',
      verified: true,
      verifiedAt: '2026-06-06',
      notes: 'Resources verified. Levels 1-30 only (no FC).'
    },
    levels: [
      { label: '1', cost: {}, time: 0 },
      { label: '2', cost: { wood: 90 }, time: 9 },
      { label: '3', cost: { wood: 400 }, time: 45 },
      { label: '4', cost: { wood: 900, coal: 180 }, time: 135 },
      { label: '5', cost: { wood: 3800, coal: 760 }, time: 270 },
      { label: '6', cost: { wood: 9600, coal: 1900, iron: 480 }, time: 540 },
      { label: '7', cost: { wood: 34000, coal: 6900, iron: 1700 }, time: 1080 },
      { label: '8', cost: { wood: 63000, coal: 12000, iron: 3100 }, time: 1620 },
      { label: '9', cost: { wood: 130000, coal: 26000, iron: 6500 }, time: 2430 },
      { label: '10', cost: { wood: 230000, coal: 46000, iron: 11000 }, time: 3240 },
      { label: '11', cost: { meat: 290000, wood: 290000, coal: 57000, iron: 14000 }, time: 4050 },
      { label: '12', cost: { meat: 370000, wood: 370000, coal: 74000, iron: 18000 }, time: 4860 },
      { label: '13', cost: { meat: 520000, wood: 520000, coal: 100000, iron: 26000 }, time: 5940 },
      { label: '14', cost: { meat: 690000, wood: 690000, coal: 130000, iron: 34000 }, time: 7560 },
      {
        label: '15',
        cost: { meat: 1000000, wood: 1000000, coal: 200000, iron: 51000 },
        time: 9720
      },
      {
        label: '16',
        cost: { meat: 1300000, wood: 1300000, coal: 260000, iron: 65000 },
        time: 16440
      },
      {
        label: '17',
        cost: { meat: 2000000, wood: 2000000, coal: 400000, iron: 100000 },
        time: 19740
      },
      {
        label: '18',
        cost: { meat: 2700000, wood: 2700000, coal: 550000, iron: 130000 },
        time: 23700
      },
      {
        label: '19',
        cost: { meat: 3400000, wood: 3400000, coal: 690000, iron: 170000 },
        time: 35550
      },
      {
        label: '20',
        cost: { meat: 4700000, wood: 4700000, coal: 940000, iron: 230000 },
        time: 44430
      },
      {
        label: '21',
        cost: { meat: 6000000, wood: 6000000, coal: 1200000, iron: 300000 },
        time: 57750
      },
      {
        label: '22',
        cost: { meat: 7900000, wood: 7900000, coal: 1500000, iron: 390000 },
        time: 86640
      },
      {
        label: '23',
        cost: { meat: 9800000, wood: 9800000, coal: 1900000, iron: 490000 },
        time: 121320
      },
      {
        label: '24',
        cost: { meat: 13000000, wood: 13000000, coal: 2600000, iron: 660000 },
        time: 169860
      },
      {
        label: '25',
        cost: { meat: 17000000, wood: 17000000, coal: 3500000, iron: 890000 },
        time: 237780
      },
      {
        label: '26',
        cost: { meat: 23000000, wood: 23000000, coal: 4600000, iron: 1100000 },
        time: 273420
      },
      {
        label: '27',
        cost: { meat: 32000000, wood: 32000000, coal: 6500000, iron: 1600000 },
        time: 328140
      },
      {
        label: '28',
        cost: { meat: 43000000, wood: 43000000, coal: 8700000, iron: 2100000 },
        time: 377340
      },
      {
        label: '29',
        cost: { meat: 54000000, wood: 54000000, coal: 10000000, iron: 2700000 },
        time: 433980
      },
      {
        label: '30',
        cost: { meat: 66000000, wood: 66000000, coal: 13000000, iron: 3300000 },
        time: 520800
      }
    ]
  },
  {
    id: 'warAcademy',
    name: 'War Academy',
    meta: {
      source: 'deepfriedmind/wos-tools + WOS wiki (FC)',
      verified: true,
      verifiedAt: '2026-06-06',
      notes:
        'Fire Crystal building (FC1-FC10), confirmed by the wiki. No standard 1-30 levels. FC build times not sourced (time:0).'
    },
    levels: [
      { label: 'FC1', cost: {}, time: 0 },
      {
        label: 'FC1-1',
        cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000, fireCrystal: 71 },
        time: 0
      },
      {
        label: 'FC1-2',
        cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000, fireCrystal: 71 },
        time: 0
      },
      {
        label: 'FC1-3',
        cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000, fireCrystal: 71 },
        time: 0
      },
      {
        label: 'FC1-4',
        cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000, fireCrystal: 71 },
        time: 0
      },
      {
        label: 'FC2',
        cost: { meat: 36000000, wood: 36000000, coal: 7200000, iron: 1800000, fireCrystal: 71 },
        time: 0
      },
      {
        label: 'FC2-1',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000, fireCrystal: 107 },
        time: 0
      },
      {
        label: 'FC2-2',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000, fireCrystal: 107 },
        time: 0
      },
      {
        label: 'FC2-3',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000, fireCrystal: 107 },
        time: 0
      },
      {
        label: 'FC2-4',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000, fireCrystal: 107 },
        time: 0
      },
      {
        label: 'FC3',
        cost: { meat: 39000000, wood: 39000000, coal: 7900000, iron: 1900000, fireCrystal: 107 },
        time: 0
      },
      {
        label: 'FC3-1',
        cost: { meat: 41000000, wood: 41000000, coal: 8200000, iron: 2000000, fireCrystal: 126 },
        time: 0
      },
      {
        label: 'FC3-2',
        cost: { meat: 41000000, wood: 41000000, coal: 8200000, iron: 2000000, fireCrystal: 126 },
        time: 0
      },
      {
        label: 'FC3-3',
        cost: { meat: 41000000, wood: 41000000, coal: 8200000, iron: 2000000, fireCrystal: 126 },
        time: 0
      },
      {
        label: 'FC3-4',
        cost: { meat: 41000000, wood: 41000000, coal: 8200000, iron: 2000000, fireCrystal: 126 },
        time: 0
      },
      {
        label: 'FC4',
        cost: { meat: 41000000, wood: 41000000, coal: 8200000, iron: 2000000, fireCrystal: 126 },
        time: 0
      },
      {
        label: 'FC4-1',
        cost: { meat: 42000000, wood: 42000000, coal: 8200000, iron: 2100000, fireCrystal: 150 },
        time: 0
      },
      {
        label: 'FC4-2',
        cost: { meat: 42000000, wood: 42000000, coal: 8200000, iron: 2100000, fireCrystal: 150 },
        time: 0
      },
      {
        label: 'FC4-3',
        cost: { meat: 42000000, wood: 42000000, coal: 8200000, iron: 2100000, fireCrystal: 150 },
        time: 0
      },
      {
        label: 'FC4-4',
        cost: { meat: 42000000, wood: 42000000, coal: 8200000, iron: 2100000, fireCrystal: 150 },
        time: 0
      },
      {
        label: 'FC5',
        cost: { meat: 42000000, wood: 42000000, coal: 8200000, iron: 2100000, fireCrystal: 150 },
        time: 0
      },
      {
        label: 'FC5-1',
        cost: {
          meat: 48000000,
          wood: 48000000,
          coal: 9600000,
          iron: 2400000,
          fireCrystal: 90,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC5-2',
        cost: {
          meat: 48000000,
          wood: 48000000,
          coal: 9600000,
          iron: 2400000,
          fireCrystal: 90,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC5-3',
        cost: {
          meat: 48000000,
          wood: 48000000,
          coal: 9600000,
          iron: 2400000,
          fireCrystal: 90,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC5-4',
        cost: {
          meat: 48000000,
          wood: 48000000,
          coal: 9600000,
          iron: 2400000,
          fireCrystal: 90,
          refinedFireCrystal: 4
        },
        time: 0
      },
      {
        label: 'FC6',
        cost: {
          meat: 48000000,
          wood: 48000000,
          coal: 9600000,
          iron: 2400000,
          fireCrystal: 45,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC6-1',
        cost: {
          meat: 54000000,
          wood: 54000000,
          coal: 10000000,
          iron: 2700000,
          fireCrystal: 108,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC6-2',
        cost: {
          meat: 54000000,
          wood: 54000000,
          coal: 10000000,
          iron: 2700000,
          fireCrystal: 108,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC6-3',
        cost: {
          meat: 54000000,
          wood: 54000000,
          coal: 10000000,
          iron: 2700000,
          fireCrystal: 108,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC6-4',
        cost: {
          meat: 54000000,
          wood: 54000000,
          coal: 10000000,
          iron: 2700000,
          fireCrystal: 108,
          refinedFireCrystal: 6
        },
        time: 0
      },
      {
        label: 'FC7',
        cost: {
          meat: 54000000,
          wood: 54000000,
          coal: 10000000,
          iron: 2700000,
          fireCrystal: 54,
          refinedFireCrystal: 13
        },
        time: 0
      },
      {
        label: 'FC7-1',
        cost: {
          meat: 66000000,
          wood: 66000000,
          coal: 13000000,
          iron: 3300000,
          fireCrystal: 108,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC7-2',
        cost: {
          meat: 66000000,
          wood: 66000000,
          coal: 13000000,
          iron: 3300000,
          fireCrystal: 108,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC7-3',
        cost: {
          meat: 66000000,
          wood: 66000000,
          coal: 13000000,
          iron: 3300000,
          fireCrystal: 108,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC7-4',
        cost: {
          meat: 66000000,
          wood: 66000000,
          coal: 13000000,
          iron: 3300000,
          fireCrystal: 108,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC8',
        cost: {
          meat: 66000000,
          wood: 66000000,
          coal: 13000000,
          iron: 3300000,
          fireCrystal: 108,
          refinedFireCrystal: 9
        },
        time: 0
      },
      {
        label: 'FC8-1',
        cost: {
          meat: 72000000,
          wood: 72000000,
          coal: 14000000,
          iron: 3600000,
          fireCrystal: 126,
          refinedFireCrystal: 13
        },
        time: 0
      },
      {
        label: 'FC8-2',
        cost: {
          meat: 72000000,
          wood: 72000000,
          coal: 14000000,
          iron: 3600000,
          fireCrystal: 126,
          refinedFireCrystal: 13
        },
        time: 0
      },
      {
        label: 'FC8-3',
        cost: {
          meat: 72000000,
          wood: 72000000,
          coal: 14000000,
          iron: 3600000,
          fireCrystal: 126,
          refinedFireCrystal: 13
        },
        time: 0
      },
      {
        label: 'FC8-4',
        cost: {
          meat: 72000000,
          wood: 72000000,
          coal: 14000000,
          iron: 3600000,
          fireCrystal: 126,
          refinedFireCrystal: 13
        },
        time: 0
      },
      {
        label: 'FC9',
        cost: {
          meat: 72000000,
          wood: 72000000,
          coal: 14000000,
          iron: 3600000,
          fireCrystal: 63,
          refinedFireCrystal: 27
        },
        time: 0
      },
      {
        label: 'FC9-1',
        cost: {
          meat: 84000000,
          wood: 84000000,
          coal: 16000000,
          iron: 7200000,
          fireCrystal: 157,
          refinedFireCrystal: 31
        },
        time: 0
      },
      {
        label: 'FC9-2',
        cost: {
          meat: 84000000,
          wood: 84000000,
          coal: 16000000,
          iron: 7200000,
          fireCrystal: 157,
          refinedFireCrystal: 31
        },
        time: 0
      },
      {
        label: 'FC9-3',
        cost: {
          meat: 84000000,
          wood: 84000000,
          coal: 16000000,
          iron: 7200000,
          fireCrystal: 157,
          refinedFireCrystal: 31
        },
        time: 0
      },
      {
        label: 'FC9-4',
        cost: {
          meat: 84000000,
          wood: 84000000,
          coal: 16000000,
          iron: 7200000,
          fireCrystal: 157,
          refinedFireCrystal: 31
        },
        time: 0
      },
      {
        label: 'FC10',
        cost: {
          meat: 84000000,
          wood: 84000000,
          coal: 16000000,
          iron: 7200000,
          fireCrystal: 78,
          refinedFireCrystal: 61
        },
        time: 0
      }
    ]
  }
];
