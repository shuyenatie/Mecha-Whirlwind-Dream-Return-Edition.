export enum PetRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface PetData {
  id: string;
  name: string;
  rarity: PetRarity;
  description: string;
  color: number;
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
  };
  skill: {
    name: string;
    description: string;
    damageMultiplier: number;
    cooldown: number;
  };
  evolution: {
    level: number;
    name: string;
    color: number;
    statMultiplier: number;
  }[];
}

export const PET_DATABASE: PetData[] = [
  {
    id: 'pet_wali',
    name: '瓦力',
    rarity: PetRarity.COMMON,
    description: '忠诚的AI伙伴，银河联盟的基础辅助型宠物',
    color: 0x44aaff,
    baseStats: { attack: 10, defense: 5, hp: 100 },
    skill: {
      name: '能量弹',
      description: '发射能量弹攻击敌人',
      damageMultiplier: 1.5,
      cooldown: 5000,
    },
    evolution: [
      { level: 10, name: '瓦力MK2', color: 0x66bbff, statMultiplier: 1.5 },
      { level: 25, name: '瓦力MK3', color: 0x88ddff, statMultiplier: 2.5 },
    ],
  },
  {
    id: 'pet_xiaohuan',
    name: '小幻',
    rarity: PetRarity.RARE,
    description: '神秘的幻影生物，能够制造分身迷惑敌人',
    color: 0xff8844,
    baseStats: { attack: 15, defense: 8, hp: 120 },
    skill: {
      name: '幻影分身',
      description: '制造分身攻击敌人，降低敌人防御',
      damageMultiplier: 2.0,
      cooldown: 8000,
    },
    evolution: [
      { level: 15, name: '幻影使', color: 0xffaa66, statMultiplier: 1.8 },
      { level: 30, name: '幻影王', color: 0xffcc88, statMultiplier: 3.0 },
    ],
  },
  {
    id: 'pet_gaga',
    name: '嘎嘎',
    rarity: PetRarity.RARE,
    description: '来自外星的机械鸟，速度极快',
    color: 0x44ff88,
    baseStats: { attack: 12, defense: 6, hp: 90 },
    skill: {
      name: '极速俯冲',
      description: '高速俯冲攻击，造成大量伤害',
      damageMultiplier: 2.5,
      cooldown: 6000,
    },
    evolution: [
      { level: 15, name: '风暴嘎嘎', color: 0x66ffaa, statMultiplier: 1.8 },
      { level: 30, name: '雷霆嘎嘎', color: 0x88ffcc, statMultiplier: 3.0 },
    ],
  },
  {
    id: 'pet_miao',
    name: '喵喵',
    rarity: PetRarity.EPIC,
    description: '可爱的宇宙猫咪，拥有治愈能力',
    color: 0xff44aa,
    baseStats: { attack: 8, defense: 12, hp: 150 },
    skill: {
      name: '治愈之喵',
      description: '为主人恢复大量生命值',
      damageMultiplier: 0,
      cooldown: 10000,
    },
    evolution: [
      { level: 20, name: '圣光喵喵', color: 0xff66cc, statMultiplier: 2.0 },
      { level: 35, name: '天使喵喵', color: 0xff88dd, statMultiplier: 3.5 },
    ],
  },
  {
    id: 'pet_aikesi',
    name: '艾克斯',
    rarity: PetRarity.LEGENDARY,
    description: '传说中的远古AI生命体，拥有毁天灭地的力量',
    color: 0xffdd44,
    baseStats: { attack: 25, defense: 15, hp: 200 },
    skill: {
      name: '终极毁灭',
      description: '释放远古之力，对全屏敌人造成毁灭性伤害',
      damageMultiplier: 5.0,
      cooldown: 20000,
    },
    evolution: [
      { level: 25, name: '觉醒艾克斯', color: 0xffee66, statMultiplier: 2.0 },
      { level: 40, name: '完全体艾克斯', color: 0xffff88, statMultiplier: 4.0 },
    ],
  },
];

export const PET_RARITY_COLORS: Record<PetRarity, number> = {
  [PetRarity.COMMON]: 0xaaaaaa,
  [PetRarity.RARE]: 0x4488ff,
  [PetRarity.EPIC]: 0xaa44ff,
  [PetRarity.LEGENDARY]: 0xffaa44,
};

export const PET_RARITY_NAMES: Record<PetRarity, string> = {
  [PetRarity.COMMON]: '普通',
  [PetRarity.RARE]: '稀有',
  [PetRarity.EPIC]: '史诗',
  [PetRarity.LEGENDARY]: '传说',
};
