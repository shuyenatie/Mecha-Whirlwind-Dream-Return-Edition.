export enum MechaType {
  TIAN_JIAN = 'tianjian',
  QIANG_PAO = 'qiangpao',
  SHAN_YING = 'shanying',
  LIAN_REN = 'lianren',
  SHENG_QIANG = 'shengqiang',
  HAN_XING = 'hanxing',
}

export enum MechaClass {
  MELEE_BALANCED = 'melee_balanced',
  RANGED_FIREPOWER = 'ranged_firepower',
  MELEE_BURST = 'melee_burst',
  HIGH_SPEED = 'high_speed',
  POWER_CONTROL = 'power_control',
  ICE_CONTROL = 'ice_control',
}

export interface MechaData {
  type: MechaType;
  name: string;
  description: string;
  mechaClass: MechaClass;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    jumpForce: number;
    attackRange: number;
    attackSpeed: number;
  };
  color: number;
  secondaryColor: number;
  advancements: {
    name: string;
    level: number;
    newClass: string;
    awakeningName: string;
  }[];
}

export const MECHA_DATABASE: Record<MechaType, MechaData> = {
  [MechaType.TIAN_JIAN]: {
    type: MechaType.TIAN_JIAN,
    name: '天剑',
    description: '装备刀剑机甲的AI战士，攻防均衡，攻击范围宽阔的近战型机甲。灵感来源于古代东方的侠客。',
    mechaClass: MechaClass.MELEE_BALANCED,
    baseStats: {
      hp: 1000,
      attack: 85,
      defense: 70,
      speed: 280,
      jumpForce: 550,
      attackRange: 80,
      attackSpeed: 1.0,
    },
    color: 0x4488ff,
    secondaryColor: 0xaaccff,
    advancements: [
      { name: 'GAT闪光', level: 15, newClass: '中距离华丽型', awakeningName: '光之主宰' },
      { name: 'GF战神', level: 15, newClass: '中距离X轴力量控场型', awakeningName: '烈火战魂' },
      { name: 'GW通灵', level: 15, newClass: '大范围控场型', awakeningName: '通灵圣光' },
    ],
  },
  [MechaType.QIANG_PAO]: {
    type: MechaType.QIANG_PAO,
    name: '枪炮',
    description: '具备强大火力的远程攻击型机甲，太空战场上的移动堡垒。不擅长近身缠斗，对机动性要求较高。',
    mechaClass: MechaClass.RANGED_FIREPOWER,
    baseStats: {
      hp: 900,
      attack: 95,
      defense: 60,
      speed: 240,
      jumpForce: 480,
      attackRange: 300,
      attackSpeed: 0.7,
    },
    color: 0xff4444,
    secondaryColor: 0xffaa88,
    advancements: [
      { name: 'GAT点睛', level: 15, newClass: '中远距离华丽型', awakeningName: '狙击霸王' },
      { name: 'GF雷电', level: 15, newClass: '远距离力量控场型', awakeningName: '重炮机神' },
      { name: 'GW强袭', level: 15, newClass: '远距离控场召唤型', awakeningName: '神威战灵' },
    ],
  },
  [MechaType.SHAN_YING]: {
    type: MechaType.SHAN_YING,
    name: '闪影',
    description: '外星机器人种族，近身搏杀型机甲，攻击范围不大但爆发力强，单体杀伤力惊人。以攻代守，移动和攻击速度快。',
    mechaClass: MechaClass.MELEE_BURST,
    baseStats: {
      hp: 800,
      attack: 100,
      defense: 50,
      speed: 350,
      jumpForce: 600,
      attackRange: 55,
      attackSpeed: 1.4,
    },
    color: 0x44ff88,
    secondaryColor: 0xaaffcc,
    advancements: [
      { name: 'GAT极速', level: 15, newClass: 'X轴近战型', awakeningName: '极速幻影' },
      { name: 'GF风暴', level: 15, newClass: '中距离范围控场型', awakeningName: '飓风武神' },
      { name: 'GW心眼', level: 15, newClass: '近距离强制抓取型', awakeningName: '神力圣卫' },
    ],
  },
  [MechaType.LIAN_REN]: {
    type: MechaType.LIAN_REN,
    name: '链刃',
    description: '高攻击和速度的中距离控场型机甲，链刃武器可远可近，在团队战斗中发挥重要作用。',
    mechaClass: MechaClass.HIGH_SPEED,
    baseStats: {
      hp: 850,
      attack: 90,
      defense: 55,
      speed: 320,
      jumpForce: 560,
      attackRange: 120,
      attackSpeed: 1.2,
    },
    color: 0xff8800,
    secondaryColor: 0xffcc88,
    advancements: [
      { name: 'GF红莲', level: 15, newClass: '中远距离X轴暴力输出型', awakeningName: '赤练战姬' },
      { name: 'GAT风舞', level: 15, newClass: '中远距离X轴华丽型', awakeningName: '疾风魅影' },
    ],
  },
  [MechaType.SHENG_QIANG]: {
    type: MechaType.SHENG_QIANG,
    name: '圣枪',
    description: '近全屏力量控场型机甲，从链刃分支中独立出来的全新机甲，拥有强大的控场能力。',
    mechaClass: MechaClass.POWER_CONTROL,
    baseStats: {
      hp: 950,
      attack: 92,
      defense: 65,
      speed: 260,
      jumpForce: 520,
      attackRange: 200,
      attackSpeed: 0.8,
    },
    color: 0xffdd00,
    secondaryColor: 0xffffaa,
    advancements: [
      { name: '拂晓圣枪', level: 15, newClass: '近全屏力量控场型', awakeningName: '曙光女神' },
    ],
  },
  [MechaType.HAN_XING]: {
    type: MechaType.HAN_XING,
    name: '寒星',
    description: '拥有操控冰寒能力的机甲，控制力强大，可大范围冰冻敌人，是战场上的控场核心。',
    mechaClass: MechaClass.ICE_CONTROL,
    baseStats: {
      hp: 880,
      attack: 80,
      defense: 75,
      speed: 270,
      jumpForce: 530,
      attackRange: 180,
      attackSpeed: 0.9,
    },
    color: 0x88ddff,
    secondaryColor: 0xccffff,
    advancements: [
      { name: '极地寒星', level: 15, newClass: '冰冻系大范围控场型', awakeningName: '星辰冻结者' },
    ],
  },
};
