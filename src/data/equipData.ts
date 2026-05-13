export enum EquipSlot {
  WEAPON = 'weapon',
  HEAD = 'head',
  BODY = 'body',
  LEGS = 'legs',
  ACCESSORY_1 = 'accessory1',
  ACCESSORY_2 = 'accessory2',
}

export enum EquipRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface EquipData {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: EquipRarity;
  level: number;
  stats: {
    hp?: number;
    mp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    critRate?: number;
    critDamage?: number;
  };
  description: string;
  color: number;
  mechaType?: string;
}

export const EQUIP_DATABASE: EquipData[] = [
  {
    id: 'wpn_tj_starter',
    name: '训练用光剑',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 5 },
    description: '天剑新手训练用光剑',
    color: 0x4488ff,
    mechaType: 'tianjian',
  },
  {
    id: 'wpn_tj_blue',
    name: '蓝色光刃',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { attack: 15, critRate: 3 },
    description: '注入了蓝色能量的光刃，锋利无比',
    color: 0x4488ff,
    mechaType: 'tianjian',
  },
  {
    id: 'wpn_tj_star',
    name: '天狼星之剑',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.RARE,
    level: 20,
    stats: { attack: 30, critRate: 5, critDamage: 15 },
    description: '以天狼星命名的名剑，蕴含星辰之力',
    color: 0x4488ff,
    mechaType: 'tianjian',
  },
  {
    id: 'wpn_tj_legend',
    name: '烈火战魂之刃',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.LEGENDARY,
    level: 40,
    stats: { attack: 60, critRate: 10, critDamage: 30, hp: 200 },
    description: '传说中烈火战魂使用的神兵',
    color: 0xff4444,
    mechaType: 'tianjian',
  },
  {
    id: 'wpn_qp_starter',
    name: '训练用步枪',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 7 },
    description: '枪炮新手训练用步枪',
    color: 0xff4444,
    mechaType: 'qiangpao',
  },
  {
    id: 'wpn_qp_cannon',
    name: '重型离子炮',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { attack: 20, critDamage: 10 },
    description: '高能离子炮，火力凶猛',
    color: 0xff4444,
    mechaType: 'qiangpao',
  },
  {
    id: 'wpn_qp_thunder',
    name: '雷电重炮',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.RARE,
    level: 20,
    stats: { attack: 40, critDamage: 25, speed: -10 },
    description: '蕴含雷电之力的重炮，一击必杀',
    color: 0xff4444,
    mechaType: 'qiangpao',
  },
  {
    id: 'wpn_sy_starter',
    name: '训练用拳套',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 4, speed: 5 },
    description: '闪影新手训练用拳套',
    color: 0x44ff88,
    mechaType: 'shanying',
  },
  {
    id: 'wpn_sy_shadow',
    name: '暗影之拳',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { attack: 12, speed: 10, critRate: 5 },
    description: '暗影能量灌注的格斗拳套',
    color: 0x44ff88,
    mechaType: 'shanying',
  },
  {
    id: 'wpn_lr_starter',
    name: '训练用链刃',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 5, speed: 3 },
    description: '链刃新手训练用武器',
    color: 0xff8800,
    mechaType: 'lianren',
  },
  {
    id: 'wpn_sq_starter',
    name: '训练用圣枪',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 6, defense: 3 },
    description: '圣枪新手训练用武器',
    color: 0xffdd00,
    mechaType: 'shengqiang',
  },
  {
    id: 'wpn_hx_starter',
    name: '训练用冰晶',
    slot: EquipSlot.WEAPON,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { attack: 5, defense: 5 },
    description: '寒星新手训练用冰晶',
    color: 0x88ddff,
    mechaType: 'hanxing',
  },
  {
    id: 'head_starter',
    name: '基础头盔',
    slot: EquipSlot.HEAD,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { defense: 3, hp: 20 },
    description: '标准配备的AI战士头盔',
    color: 0x888888,
  },
  {
    id: 'head_reinforced',
    name: '强化战斗头盔',
    slot: EquipSlot.HEAD,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { defense: 8, hp: 50, critRate: 2 },
    description: '经过强化的战斗头盔，提供额外防护',
    color: 0x44aa88,
  },
  {
    id: 'head_elite',
    name: '精英指挥头盔',
    slot: EquipSlot.HEAD,
    rarity: EquipRarity.RARE,
    level: 20,
    stats: { defense: 15, hp: 100, critRate: 5, attack: 5 },
    description: '精英战士的指挥头盔',
    color: 0x4488ff,
  },
  {
    id: 'body_starter',
    name: '基础机甲',
    slot: EquipSlot.BODY,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { defense: 5, hp: 50 },
    description: '标准配备的AI战士机甲',
    color: 0x888888,
  },
  {
    id: 'body_reinforced',
    name: '强化战斗机甲',
    slot: EquipSlot.BODY,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { defense: 12, hp: 100 },
    description: '经过强化的战斗机甲',
    color: 0x44aa88,
  },
  {
    id: 'body_elite',
    name: '精英战斗机甲',
    slot: EquipSlot.BODY,
    rarity: EquipRarity.RARE,
    level: 20,
    stats: { defense: 25, hp: 200, attack: 10 },
    description: '精英战士的战斗机甲',
    color: 0x4488ff,
  },
  {
    id: 'legs_starter',
    name: '基础腿部装甲',
    slot: EquipSlot.LEGS,
    rarity: EquipRarity.COMMON,
    level: 1,
    stats: { defense: 3, speed: 5 },
    description: '标准配备的腿部装甲',
    color: 0x888888,
  },
  {
    id: 'legs_boost',
    name: '加速推进腿甲',
    slot: EquipSlot.LEGS,
    rarity: EquipRarity.UNCOMMON,
    level: 10,
    stats: { defense: 5, speed: 15 },
    description: '内置推进器的腿部装甲，提升机动性',
    color: 0x44aa88,
  },
  {
    id: 'acc_power_core',
    name: '能量核心',
    slot: EquipSlot.ACCESSORY_1,
    rarity: EquipRarity.UNCOMMON,
    level: 5,
    stats: { attack: 8, hp: 30, mp: 20 },
    description: '增强机甲能量输出的核心装置',
    color: 0xffaa44,
  },
  {
    id: 'acc_shield_gen',
    name: '护盾发生器',
    slot: EquipSlot.ACCESSORY_1,
    rarity: EquipRarity.UNCOMMON,
    level: 5,
    stats: { defense: 10, hp: 50, mp: 15 },
    description: '生成防护力场的装置',
    color: 0x44aaff,
  },
  {
    id: 'acc_crit_chip',
    name: '暴击芯片',
    slot: EquipSlot.ACCESSORY_2,
    rarity: EquipRarity.RARE,
    level: 15,
    stats: { critRate: 8, critDamage: 20 },
    description: '提升暴击概率和暴击伤害的战斗芯片',
    color: 0xff4488,
  },
  {
    id: 'acc_speed_module',
    name: '加速模块',
    slot: EquipSlot.ACCESSORY_2,
    rarity: EquipRarity.RARE,
    level: 15,
    stats: { speed: 20, attack: 5 },
    description: '提升机甲移动速度的加速模块',
    color: 0x44ff88,
  },
];

export function getEquipsBySlot(slot: EquipSlot): EquipData[] {
  return EQUIP_DATABASE.filter((e) => e.slot === slot);
}

export function getEquipById(id: string): EquipData | undefined {
  return EQUIP_DATABASE.find((e) => e.id === id);
}

export function getEquipsByLevel(level: number): EquipData[] {
  return EQUIP_DATABASE.filter((e) => e.level <= level);
}

export function getEquipsForMecha(mechaType: string, level: number): EquipData[] {
  return EQUIP_DATABASE.filter(
    (e) => (!e.mechaType || e.mechaType === mechaType) && e.level <= level
  );
}

export const RARITY_LEVEL: Record<EquipRarity, number> = {
  [EquipRarity.COMMON]: 0,
  [EquipRarity.UNCOMMON]: 1,
  [EquipRarity.RARE]: 2,
  [EquipRarity.EPIC]: 3,
  [EquipRarity.LEGENDARY]: 4,
};

export const RARITY_COLORS: Record<EquipRarity, number> = {
  [EquipRarity.COMMON]: 0xaaaaaa,
  [EquipRarity.UNCOMMON]: 0x44ff88,
  [EquipRarity.RARE]: 0x4488ff,
  [EquipRarity.EPIC]: 0xaa44ff,
  [EquipRarity.LEGENDARY]: 0xffaa44,
};

export const RARITY_NAMES: Record<EquipRarity, string> = {
  [EquipRarity.COMMON]: '普通',
  [EquipRarity.UNCOMMON]: '优秀',
  [EquipRarity.RARE]: '稀有',
  [EquipRarity.EPIC]: '史诗',
  [EquipRarity.LEGENDARY]: '传说',
};
export function formatEquipStats(equip: EquipData): string {
  const lines: string[] = [];
  if (equip.stats.attack) lines.push(`ATK +${equip.stats.attack}`);
  if (equip.stats.defense) lines.push(`DEF +${equip.stats.defense}`);
  if (equip.stats.hp) lines.push(`HP +${equip.stats.hp}`);
  if (equip.stats.mp) lines.push(`MP +${equip.stats.mp}`);
  if (equip.stats.speed) lines.push(`SPD ${equip.stats.speed >= 0 ? '+' : ''}${equip.stats.speed}`);
  if (equip.stats.critRate) lines.push(`CRIT +${equip.stats.critRate}%`);
  if (equip.stats.critDamage) lines.push(`CRIT DMG +${equip.stats.critDamage}%`);
  return lines.join('\n') || 'No stat bonus';
}
