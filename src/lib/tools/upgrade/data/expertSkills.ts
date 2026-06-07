// AUTO-GENERATED — Dawn Academy expert SKILL track (Books of Knowledge).
// Source: wostools experts-calculator bundle (bookCosts / learningTimeMinutes),
// VERIFIED: per-expert book totals match the bundle (Cyrille 21,150 …
// Romulus 413,500; all 9 = 1,335,150). Talents (free, no book) are excluded.
// 'time' is LEARNING time in seconds. Regenerate with /tmp/gen_expertskills.mjs.
import type { LevelCost } from '../types';

export interface ExpertSkill {
  id: string;
  expertId: string;
  expertName: string;
  focus: string;
  skill: string;
  ladder: LevelCost[];
}

function ladder(books: number[], mins: number[]): LevelCost[] {
  const out: LevelCost[] = [{ label: 'Lv 0', cost: {}, time: 0 }];
  for (let i = 0; i < books.length; i++)
    out.push({ label: `Lv ${i + 1}`, cost: { bookOfKnowledge: books[i] }, time: mins[i] * 60 });
  return out;
}

export const EXPERT_SKILLS: ExpertSkill[] = [
  {
    id: 'cyrille_entrapment',
    expertId: 'cyrille',
    expertName: 'Cyrille',
    focus: 'Bear Hunt',
    skill: 'Entrapment',
    ladder: ladder(
      [0, 70, 140, 210, 280, 350, 420, 490, 560, 630],
      [0, 60, 120, 180, 240, 300, 360, 420, 480, 540]
    )
  },
  {
    id: 'cyrille_scavenging',
    expertId: 'cyrille',
    expertName: 'Cyrille',
    focus: 'Bear Hunt',
    skill: 'Scavenging',
    ladder: ladder([0, 400, 800, 1600, 3200], [0, 460, 920, 1840, 3680])
  },
  {
    id: 'cyrille_weapon-master',
    expertId: 'cyrille',
    expertName: 'Cyrille',
    focus: 'Bear Hunt',
    skill: 'Weapon Master',
    ladder: ladder([0, 500, 1000, 2000, 4000], [0, 720, 1440, 2880, 5760])
  },
  {
    id: 'cyrille_ursa-s-bane',
    expertId: 'cyrille',
    expertName: 'Cyrille',
    focus: 'Bear Hunt',
    skill: "Ursa's Bane",
    ladder: ladder(
      [0, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      [0, 170, 340, 510, 690, 860, 1030, 1210, 1380, 1550]
    )
  },
  {
    id: 'agnes_efficient-recon',
    expertId: 'agnes',
    expertName: 'Agnes',
    focus: 'City Economy',
    skill: 'Efficient Recon',
    ladder: ladder([0, 500, 1000, 2000, 4000], [0, 720, 1440, 2880, 5760])
  },
  {
    id: 'agnes_optimization',
    expertId: 'agnes',
    expertName: 'Agnes',
    focus: 'City Economy',
    skill: 'Optimization',
    ladder: ladder([0, 400, 800, 1600, 3200], [0, 570, 1150, 2300, 4600])
  },
  {
    id: 'agnes_project-management',
    expertId: 'agnes',
    expertName: 'Agnes',
    focus: 'City Economy',
    skill: 'Project Management',
    ladder: ladder([0, 200, 400, 800, 1600], [0, 230, 460, 920, 1840])
  },
  {
    id: 'agnes_covert-knowledge',
    expertId: 'agnes',
    expertName: 'Agnes',
    focus: 'City Economy',
    skill: 'Covert Knowledge',
    ladder: ladder(
      [0, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      [0, 170, 340, 510, 690, 860, 1030, 1210, 1380, 1550]
    )
  },
  {
    id: 'holger_arena-elite',
    expertId: 'holger',
    expertName: 'Holger',
    focus: 'Arena',
    skill: 'Arena Elite',
    ladder: ladder(
      [0, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400],
      [0, 1380, 2760, 4140, 5530, 6910, 8290, 9670, 11060, 12440]
    )
  },
  {
    id: 'holger_crowd-pleaser',
    expertId: 'holger',
    expertName: 'Holger',
    focus: 'Arena',
    skill: 'Crowd Pleaser',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 510, 1030, 1550, 2070, 2590, 3110, 3620, 4140, 4660]
    )
  },
  {
    id: 'holger_arena-star',
    expertId: 'holger',
    expertName: 'Holger',
    focus: 'Arena',
    skill: 'Arena Star',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 510, 1030, 1550, 2070, 2590, 3110, 3620, 4140, 4660]
    )
  },
  {
    id: 'holger_legacy',
    expertId: 'holger',
    expertName: 'Holger',
    focus: 'Arena',
    skill: 'Legacy',
    ladder: ladder(
      [0, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400],
      [0, 1380, 2760, 4140, 5530, 6910, 8290, 9670, 11060, 12440]
    )
  },
  {
    id: 'romulus_call-of-war',
    expertId: 'romulus',
    expertName: 'Romulus',
    focus: 'PvP / Military',
    skill: 'Call of War',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 510, 1030, 1550, 2070, 2590, 3110, 3620, 4140, 4660]
    )
  },
  {
    id: 'romulus_last-line',
    expertId: 'romulus',
    expertName: 'Romulus',
    focus: 'PvP / Military',
    skill: 'Last Line',
    ladder: ladder(
      [
        0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 8000,
        9000, 9000, 10000, 10000
      ],
      [
        0, 1440, 2880, 4320, 5760, 7200, 8640, 10080, 11520, 12960, 14400, 15840, 17280, 20160,
        23040, 23040, 25920, 25920, 28800, 28800
      ]
    )
  },
  {
    id: 'romulus_spirit-of-aeetis',
    expertId: 'romulus',
    expertName: 'Romulus',
    focus: 'PvP / Military',
    skill: 'Spirit of Aeetis',
    ladder: ladder(
      [
        0, 800, 1500, 2200, 3000, 3800, 4500, 5200, 6000, 6800, 7500, 8200, 9000, 10500, 12000,
        12000, 13500, 13500, 15000, 15000
      ],
      [
        0, 2650, 4960, 7280, 9930, 12580, 14900, 17220, 19870, 22520, 24840, 27150, 29800, 34770,
        39740, 39740, 44710, 44710, 49680, 49680
      ]
    )
  },
  {
    id: 'romulus_one-heart',
    expertId: 'romulus',
    expertName: 'Romulus',
    focus: 'PvP / Military',
    skill: 'One Heart',
    ladder: ladder(
      [
        0, 800, 1500, 2200, 3000, 3800, 4500, 5200, 6000, 6800, 7500, 8200, 9000, 10500, 12000,
        12000, 13500, 13500, 15000, 15000
      ],
      [
        0, 2990, 5610, 8230, 11230, 14220, 16840, 19460, 22460, 25460, 28080, 30700, 33690, 39310,
        44920, 44920, 50540, 50540, 56160, 56160
      ]
    )
  },
  {
    id: 'baldur_blazing-sunrise',
    expertId: 'baldur',
    expertName: 'Baldur',
    focus: 'Alliance Events',
    skill: 'Blazing Sunrise',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 860, 1290, 1720, 2160, 2590, 3020, 3450, 3880]
    )
  },
  {
    id: 'baldur_honored-conquest',
    expertId: 'baldur',
    expertName: 'Baldur',
    focus: 'Alliance Events',
    skill: 'Honored Conquest',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 860, 1290, 1720, 2160, 2590, 3020, 3450, 3880]
    )
  },
  {
    id: 'baldur_bounty-hunter',
    expertId: 'baldur',
    expertName: 'Baldur',
    focus: 'Alliance Events',
    skill: 'Bounty Hunter',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 860, 1290, 1720, 2160, 2590, 3020, 3450, 3880]
    )
  },
  {
    id: 'baldur_dawn-hymn',
    expertId: 'baldur',
    expertName: 'Baldur',
    focus: 'Alliance Events',
    skill: 'Dawn Hymn',
    ladder: ladder(
      [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500],
      [0, 860, 1720, 2590, 3450, 4320, 5180, 6040, 6910, 7770]
    )
  },
  {
    id: 'fabian_salvager',
    expertId: 'fabian',
    expertName: 'Fabian',
    focus: 'Foundry Battle',
    skill: 'Salvager',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 430, 430, 430, 440, 430, 430, 430, 430]
    )
  },
  {
    id: 'fabian_crisis-rescue',
    expertId: 'fabian',
    expertName: 'Fabian',
    focus: 'Foundry Battle',
    skill: 'Crisis Rescue',
    ladder: ladder(
      [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500],
      [0, 551, 1239, 890, 900, 900, 890, 900, 890, 900]
    )
  },
  {
    id: 'fabian_heightened-firepower',
    expertId: 'fabian',
    expertName: 'Fabian',
    focus: 'Foundry Battle',
    skill: 'Heightened Firepower',
    ladder: ladder(
      [
        0, 200, 500, 700, 1000, 1200, 1500, 1700, 2000, 2300, 2500, 2700, 3000, 3500, 4000, 4000,
        4500, 4500, 5100, 5100
      ],
      [
        0, 460, 690, 460, 690, 460, 690, 460, 690, 700, 460, 460, 690, 1150, 1150, 0, 1150, 0, 1390,
        0
      ]
    )
  },
  {
    id: 'fabian_battle-bulwark',
    expertId: 'fabian',
    expertName: 'Fabian',
    focus: 'Foundry Battle',
    skill: 'Battle Bulwark',
    ladder: ladder(
      [
        0, 300, 700, 1000, 1400, 1800, 2100, 2400, 2800, 3200, 3500, 3800, 4200, 4900, 5700, 5700,
        6400, 6400, 7100, 7100
      ],
      [
        0, 770, 1040, 780, 1030, 1040, 780, 780, 1030, 1040, 780, 780, 1030, 1820, 2070, 0, 1810, 0,
        1820, 0
      ]
    )
  },
  {
    id: 'valeria_well-prepared',
    expertId: 'valeria',
    expertName: 'Valeria',
    focus: 'SvS Battle',
    skill: 'Well Prepared',
    ladder: ladder(
      [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500],
      [0, 720, 1440, 2160, 2880, 3600, 4320, 5040, 5760, 6480]
    )
  },
  {
    id: 'valeria_radiant-honor',
    expertId: 'valeria',
    expertName: 'Valeria',
    focus: 'SvS Battle',
    skill: 'Radiant Honor',
    ladder: ladder(
      [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500],
      [0, 1000, 2010, 3020, 4030, 5040, 6040, 7050, 8060, 9070]
    )
  },
  {
    id: 'valeria_battle-concerto',
    expertId: 'valeria',
    expertName: 'Valeria',
    focus: 'SvS Battle',
    skill: 'Battle Concerto',
    ladder: ladder(
      [
        0, 800, 1500, 2200, 3000, 3800, 4500, 5200, 6000, 6800, 7500, 8200, 9000, 10500, 12000,
        12000, 13500, 13500, 15000, 15000
      ],
      [
        0, 1840, 3450, 5060, 6910, 8750, 10360, 11980, 13820, 15660, 17280, 18890, 20730, 24190,
        27640, 27640, 31100, 31100, 34560, 34560
      ]
    )
  },
  {
    id: 'valeria_crushing-force',
    expertId: 'valeria',
    expertName: 'Valeria',
    focus: 'SvS Battle',
    skill: 'Crushing Force',
    ladder: ladder(
      [
        0, 800, 1500, 2200, 3000, 3800, 4500, 5200, 6000, 6800, 7500, 8200, 9000, 10500, 12000,
        12000, 13500, 13500, 15000, 15000
      ],
      [
        0, 2070, 3880, 5700, 7770, 9850, 11660, 13470, 15550, 17620, 19440, 21250, 23320, 27210,
        31100, 31100, 34990, 34990, 38880, 38880
      ]
    )
  },
  {
    id: 'ronne_cartographic-memory',
    expertId: 'ronne',
    expertName: 'Ronne',
    focus: 'Tundra Trade',
    skill: 'Cartographic Memory',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 860, 1290, 1720, 2160, 2590, 3020, 3450, 3880]
    )
  },
  {
    id: 'ronne_treasure-scent',
    expertId: 'ronne',
    expertName: 'Ronne',
    focus: 'Tundra Trade',
    skill: 'Treasure Scent',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 600, 1210, 1810, 2420, 3020, 3620, 4230, 4830, 5440]
    )
  },
  {
    id: 'ronne_giving-back',
    expertId: 'ronne',
    expertName: 'Ronne',
    focus: 'Tundra Trade',
    skill: 'Giving Back',
    ladder: ladder(
      [0, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400],
      [0, 1380, 2760, 4140, 5530, 6910, 8290, 9670, 11060, 12440]
    )
  },
  {
    id: 'ronne_gold-class',
    expertId: 'ronne',
    expertName: 'Ronne',
    focus: 'Tundra Trade',
    skill: 'Gold Class',
    ladder: ladder(
      [0, 1200, 2400, 3600, 4800, 6000, 7200, 8400, 9600, 10800],
      [0, 3110, 6220, 9330, 12440, 15550, 18660, 21770, 24880, 27990]
    )
  },
  {
    id: 'kathy_icefire-hunter',
    expertId: 'kathy',
    expertName: 'Kathy',
    focus: 'Mining',
    skill: 'Icefire Hunter',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 430, 860, 1290, 1720, 2160, 2590, 3020, 3450, 3880]
    )
  },
  {
    id: 'kathy_valorous-cold',
    expertId: 'kathy',
    expertName: 'Kathy',
    focus: 'Mining',
    skill: 'Valorous Cold',
    ladder: ladder(
      [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700],
      [0, 600, 1210, 1810, 2420, 3020, 3620, 4230, 4830, 5440]
    )
  },
  {
    id: 'kathy_winter-treasures',
    expertId: 'kathy',
    expertName: 'Kathy',
    focus: 'Mining',
    skill: 'Winter Treasures',
    ladder: ladder(
      [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
      [0, 2300, 4600, 6910, 9210, 11520, 13820, 16120, 18430, 20730]
    )
  },
  {
    id: 'kathy_efficient-mining',
    expertId: 'kathy',
    expertName: 'Kathy',
    focus: 'Mining',
    skill: 'Efficient Mining',
    ladder: ladder(
      [0, 1200, 2400, 3600, 4800, 6000, 7200, 8400, 9600, 10800],
      [0, 3110, 6220, 9330, 12440, 15550, 18660, 21770, 24880, 27990]
    )
  }
];
