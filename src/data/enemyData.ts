export interface EnemyData {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;
  color: number;
  xpReward: number;
  behavior: 'patrol' | 'chase' | 'stationary' | 'sniper';
  attackWindupMs?: number;
  attackActiveMs?: number;
  attackWidth?: number;
  attackHeight?: number;
  attackRecoveryMs?: number;
  knockbackResist?: number;
  telegraphColor?: number;
}

export interface BossData extends EnemyData {
  phase2HpThreshold: number;
  specialAttacks: string[];
}

export const ENEMY_DATABASE: EnemyData[] = [
  {
    id: 'drone',
    name: '黑洞无人机',
    hp: 200,
    attack: 20,
    defense: 10,
    speed: 120,
    attackRange: 150,
    attackSpeed: 1.0,
    color: 0x8833aa,
    xpReward: 30,
    behavior: 'patrol',
    attackWindupMs: 360,
    attackActiveMs: 130,
    attackWidth: 62,
    attackHeight: 46,
    attackRecoveryMs: 300,
    knockbackResist: 0.1,
    telegraphColor: 0xff55aa,
  },
  {
    id: 'soldier',
    name: '黑洞士兵',
    hp: 350,
    attack: 30,
    defense: 20,
    speed: 100,
    attackRange: 60,
    attackSpeed: 0.8,
    color: 0x6622aa,
    xpReward: 50,
    behavior: 'chase',
    attackWindupMs: 430,
    attackActiveMs: 150,
    attackWidth: 76,
    attackHeight: 52,
    attackRecoveryMs: 360,
    knockbackResist: 0.18,
    telegraphColor: 0xff6644,
  },
  {
    id: 'heavy',
    name: '重装卫士',
    hp: 600,
    attack: 40,
    defense: 40,
    speed: 60,
    attackRange: 70,
    attackSpeed: 0.5,
    color: 0x4411aa,
    xpReward: 80,
    behavior: 'chase',
    attackWindupMs: 620,
    attackActiveMs: 190,
    attackWidth: 96,
    attackHeight: 62,
    attackRecoveryMs: 520,
    knockbackResist: 0.65,
    telegraphColor: 0xff8844,
  },
  {
    id: 'sniper',
    name: '黑洞狙击手',
    hp: 180,
    attack: 50,
    defense: 10,
    speed: 80,
    attackRange: 400,
    attackSpeed: 0.6,
    color: 0xaa3388,
    xpReward: 60,
    behavior: 'sniper',
    attackWindupMs: 760,
    attackActiveMs: 180,
    attackWidth: 420,
    attackHeight: 12,
    attackRecoveryMs: 480,
    knockbackResist: 0.05,
    telegraphColor: 0xff2244,
  },
  {
    id: 'elite',
    name: '黑洞精英',
    hp: 800,
    attack: 55,
    defense: 35,
    speed: 150,
    attackRange: 80,
    attackSpeed: 1.2,
    color: 0xff2266,
    xpReward: 120,
    behavior: 'chase',
    attackWindupMs: 320,
    attackActiveMs: 140,
    attackWidth: 90,
    attackHeight: 58,
    attackRecoveryMs: 280,
    knockbackResist: 0.28,
    telegraphColor: 0xff2266,
  },
];

export const BOSS_DATABASE: BossData[] = [
  {
    id: 'void_commander',
    name: '虚空指挥官',
    hp: 5000,
    attack: 60,
    defense: 30,
    speed: 100,
    attackRange: 150,
    attackSpeed: 0.8,
    color: 0xff0044,
    xpReward: 500,
    behavior: 'chase',
    attackWindupMs: 520,
    attackActiveMs: 190,
    attackWidth: 130,
    attackHeight: 72,
    attackRecoveryMs: 540,
    knockbackResist: 0.45,
    telegraphColor: 0xff2255,
    phase2HpThreshold: 0.3,
    specialAttacks: ['void_beam', 'summon_drones', 'dark_nova'],
  },
  {
    id: 'dark_mech',
    name: '暗黑机甲',
    hp: 8000,
    attack: 80,
    defense: 50,
    speed: 80,
    attackRange: 120,
    attackSpeed: 0.6,
    color: 0x220044,
    xpReward: 1000,
    behavior: 'chase',
    attackWindupMs: 560,
    attackActiveMs: 210,
    attackWidth: 125,
    attackHeight: 72,
    attackRecoveryMs: 620,
    knockbackResist: 0.55,
    telegraphColor: 0xaa44ff,
    phase2HpThreshold: 0.5,
    specialAttacks: ['dark_slash', 'gravity_well', 'shadow_army'],
  },
  {
    id: 'black_hole_emperor',
    name: '黑洞帝王',
    hp: 15000,
    attack: 100,
    defense: 60,
    speed: 120,
    attackRange: 200,
    attackSpeed: 0.7,
    color: 0x110022,
    xpReward: 2000,
    behavior: 'chase',
    attackWindupMs: 680,
    attackActiveMs: 240,
    attackWidth: 150,
    attackHeight: 84,
    attackRecoveryMs: 680,
    knockbackResist: 0.6,
    telegraphColor: 0xdd55ff,
    phase2HpThreshold: 0.4,
    specialAttacks: ['black_hole', 'dimension_rift', 'annihilation_beam', 'void_storm'],
  },
];
