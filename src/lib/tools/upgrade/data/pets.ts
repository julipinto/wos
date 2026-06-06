// Pet upgrade data. Source: whiteoutsurvival.wiki per-pet pages. Costs are keyed
// by a pet's MAX-LEVEL TIER (confirmed: pets sharing a max level have identical
// curves — tier 100 matched across 6 pets, tiers 60/70/80 across 2 each). Single
// site, so the calculator marks this preview. Two cost tracks: per-level Pet Food
// and advancement materials at every 10th level (Taming Manual from L10,
// Energizing Potion from L30, Strengthening Serum from L50).
import type { LevelCost, ResourceBag } from '../types';

interface TierData {
  /** food[i] = Pet Food to reach level i+1 (food[0] = level 1 = 0). */
  food: number[];
  /** advancement materials consumed at each milestone level. */
  advancement: Record<number, ResourceBag>;
}

// prettier-ignore
const TIERS: Record<number, TierData> = {
  50: {
    food: [0,150,160,170,180,190,200,210,220,235,250,265,280,295,310,325,340,355,370,390,410,430,450,470,490,510,530,550,570,600,630,660,690,720,750,780,810,840,870,910,950,990,1030,1070,1110,1150,1190,1230,1270,1320],
    advancement: {
      10:{tamingManual:15},20:{tamingManual:30},30:{tamingManual:45,energizingPotion:10},
      40:{tamingManual:60,energizingPotion:20},50:{tamingManual:90,energizingPotion:30,strengtheningSerum:10}
    }
  },
  60: {
    food: [0,200,220,240,260,280,300,320,340,370,400,430,460,490,520,550,580,610,640,680,720,760,800,840,880,920,960,1000,1040,1100,1160,1220,1280,1340,1400,1460,1520,1580,1640,1720,1800,1880,1960,2040,2120,2200,2280,2360,2440,2540,2640,2740,2840,2940,3040,3140,3240,3340,3440,3560],
    advancement: {
      10:{tamingManual:20},20:{tamingManual:40},30:{tamingManual:60,energizingPotion:10},
      40:{tamingManual:90,energizingPotion:20},50:{tamingManual:130,energizingPotion:30,strengtheningSerum:10},
      60:{tamingManual:175,energizingPotion:50,strengtheningSerum:20}
    }
  },
  70: {
    food: [0,300,330,360,390,420,450,480,510,555,600,645,690,735,780,825,870,915,960,1020,1080,1140,1200,1260,1320,1380,1440,1500,1560,1650,1740,1830,1920,2010,2100,2190,2280,2370,2460,2580,2700,2820,2940,3060,3180,3300,3420,3540,3660,3810,3960,4110,4260,4410,4560,4710,4860,5010,5160,5340,5520,5700,5880,6060,6240,6420,6600,6780,6960,7140],
    advancement: {
      10:{tamingManual:25},20:{tamingManual:50},30:{tamingManual:75,energizingPotion:10},
      40:{tamingManual:100,energizingPotion:20},50:{tamingManual:155,energizingPotion:30,strengtheningSerum:10},
      60:{tamingManual:200,energizingPotion:50,strengtheningSerum:20},70:{tamingManual:255,energizingPotion:80,strengtheningSerum:40}
    }
  },
  80: {
    food: [0,400,440,480,520,560,600,640,680,740,800,860,920,980,1040,1100,1160,1220,1280,1360,1440,1520,1600,1680,1760,1840,1920,2000,2080,2200,2320,2440,2560,2680,2800,2920,3040,3160,3280,3440,3600,3760,3920,4080,4240,4400,4560,4720,4880,5080,5280,5480,5680,5880,6080,6280,6480,6680,6880,7120,7360,7600,7840,8080,8320,8560,8800,9040,9280,9520,9760,10000,10240,10480,10720,10960,11200,11440,11680,12000],
    advancement: {
      10:{tamingManual:30},20:{tamingManual:60},30:{tamingManual:95,energizingPotion:10},
      40:{tamingManual:125,energizingPotion:20},50:{tamingManual:190,energizingPotion:30,strengtheningSerum:10},
      60:{tamingManual:250,energizingPotion:50,strengtheningSerum:20},70:{tamingManual:310,energizingPotion:80,strengtheningSerum:40},
      80:{tamingManual:380,energizingPotion:100,strengtheningSerum:60}
    }
  },
  100: {
    food: [0,500,550,600,650,700,750,800,850,925,1000,1075,1150,1225,1300,1375,1450,1525,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600,2750,2900,3050,3200,3350,3500,3650,3800,3950,4100,4300,4500,4700,4900,5100,5300,5500,5700,5900,6100,6350,6600,6850,7100,7350,7600,7850,8100,8350,8600,8900,9200,9500,9800,10100,10400,10700,11000,11300,11600,11900,12200,12500,12800,13100,13400,13700,14000,14300,14600,15000,15400,15800,16200,16600,17000,17400,17800,18200,18600,19000,19400,19800,20200,20600,21000,21400,21800,22200,22600,23100],
    advancement: {
      10:{tamingManual:35},20:{tamingManual:70},30:{tamingManual:110,energizingPotion:15},
      40:{tamingManual:145,energizingPotion:35},50:{tamingManual:220,energizingPotion:50,strengtheningSerum:10},
      60:{tamingManual:290,energizingPotion:65,strengtheningSerum:20},70:{tamingManual:365,energizingPotion:85,strengtheningSerum:40},
      80:{tamingManual:440,energizingPotion:100,strengtheningSerum:60},90:{tamingManual:585,energizingPotion:115,strengtheningSerum:80},
      100:{tamingManual:730,energizingPotion:135,strengtheningSerum:100}
    }
  }
};

export const PETS = [
  { id: 'cave-hyena', name: 'Cave Hyena', max: 50 },
  { id: 'arctic-wolf', name: 'Arctic Wolf', max: 60 },
  { id: 'musk-ox', name: 'Musk Ox', max: 60 },
  { id: 'giant-tapir', name: 'Giant Tapir', max: 70 },
  { id: 'titan-roc', name: 'Titan Roc', max: 70 },
  { id: 'giant-elk', name: 'Giant Elk', max: 80 },
  { id: 'snow-leopard', name: 'Snow Leopard', max: 80 },
  { id: 'cave-lion', name: 'Cave Lion', max: 100 },
  { id: 'snow-ape', name: 'Snow Ape', max: 100 },
  { id: 'mammoth', name: 'Mammoth', max: 100 },
  { id: 'frostscale-chameleon', name: 'Frostscale Chameleon', max: 100 },
  { id: 'saber-tooth-tiger', name: 'Saber-tooth Tiger', max: 100 },
  { id: 'iron-rhino', name: 'Iron Rhino', max: 100 }
] as const;

/**
 * Build a level ladder for a pet tier. Level 1 is the free base; each later
 * level costs its Pet Food, and milestone levels (10, 20, …) also include that
 * milestone's advancement materials (attributed to reaching the milestone).
 */
export function petLadder(max: number): LevelCost[] {
  const tier = TIERS[max];
  if (!tier) return [];
  const levels: LevelCost[] = [{ label: '1', cost: {}, time: 0 }];
  for (let i = 1; i < tier.food.length; i++) {
    const level = i + 1;
    const cost: ResourceBag = { petFood: tier.food[i] };
    const adv = tier.advancement[level];
    if (adv) Object.assign(cost, adv);
    levels.push({ label: String(level), cost, time: 0 });
  }
  return levels;
}
