import { MechaType } from './mechaData';
import { EquipSlot, EquipData, getEquipById } from './equipData';
import { PetData } from './petData';

export interface PlayerSaveData {
  mechaType: MechaType;
  level: number;
  xp: number;
  advancement: number;
  advancementName: string;
  isAwakened: boolean;
  awakeningName: string;
  equips: Record<EquipSlot, EquipData | null>;
  inventory: string[];
  pet: PetData | null;
  petLevel: number;
  gold: number;
  completedStages: string[];
  unlockedSkills: string[];
  skillLevels: Record<string, number>;
  stats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
    critRate: number;
    critDamage: number;
  };
}

const SAVE_KEY = 'mecha_storm_save';

export function createNewSave(mechaType: MechaType): PlayerSaveData {
  return {
    mechaType,
    level: 1,
    xp: 0,
    advancement: 0,
    advancementName: '',
    isAwakened: false,
    awakeningName: '',
    equips: {
      [EquipSlot.WEAPON]: null,
      [EquipSlot.HEAD]: null,
      [EquipSlot.BODY]: null,
      [EquipSlot.LEGS]: null,
      [EquipSlot.ACCESSORY_1]: null,
      [EquipSlot.ACCESSORY_2]: null,
    },
    inventory: [],
    pet: null,
    petLevel: 1,
    gold: 0,
    completedStages: [],
    unlockedSkills: [],
    skillLevels: {},
    stats: {
      hp: 1000,
      maxHp: 1000,
      mp: 100,
      maxMp: 100,
      attack: 80,
      defense: 60,
      speed: 280,
      critRate: 5,
      critDamage: 150,
    },
  };
}

export function saveGame(data: PlayerSaveData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function loadGame(): PlayerSaveData | null {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return null;
    return normalizeSaveData(JSON.parse(json) as Partial<PlayerSaveData>);
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function normalizeSaveData(data: Partial<PlayerSaveData> | null): PlayerSaveData {
  const fallback = createNewSave(data?.mechaType || MechaType.TIAN_JIAN);
  const normalized: PlayerSaveData = {
    ...fallback,
    ...data,
    mechaType: data?.mechaType || fallback.mechaType,
    equips: { ...fallback.equips },
    inventory: [],
    completedStages: Array.isArray(data?.completedStages) ? [...data.completedStages] : [],
    unlockedSkills: Array.isArray(data?.unlockedSkills) ? [...data.unlockedSkills] : [],
    skillLevels: data?.skillLevels ? { ...data.skillLevels } : {},
    stats: {
      ...fallback.stats,
      ...(data?.stats || {}),
    },
  };

  const rawEquips = (data?.equips || {}) as Partial<Record<EquipSlot, EquipData | string | null>>;
  for (const slot of Object.values(EquipSlot)) {
    const rawEquip = rawEquips[slot];
    if (!rawEquip) {
      normalized.equips[slot] = null;
      continue;
    }
    normalized.equips[slot] = typeof rawEquip === 'string'
      ? getEquipById(rawEquip) || null
      : rawEquip;
  }

  const rawInventory = Array.isArray(data?.inventory) ? data.inventory : [];
  normalized.inventory = rawInventory
    .map((item) => typeof item === 'string' ? item : (item as EquipData).id)
    .filter((id): id is string => Boolean(id && getEquipById(id)));

  normalized.gold = data?.gold ?? fallback.gold;
  normalized.level = data?.level ?? fallback.level;
  normalized.xp = data?.xp ?? fallback.xp;
  normalized.petLevel = data?.petLevel ?? fallback.petLevel;

  return normalized;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function calculateEquipBonus(equips: Record<EquipSlot, EquipData | null>): PlayerSaveData['stats'] {
  const bonus: PlayerSaveData['stats'] = {
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    critRate: 0,
    critDamage: 0,
  };

  for (const slot of Object.values(EquipSlot)) {
    const equip = equips[slot];
    if (!equip) continue;

    if (equip.stats.hp) bonus.hp += equip.stats.hp;
    if (equip.stats.mp) bonus.mp += equip.stats.mp;
    if (equip.stats.attack) bonus.attack += equip.stats.attack;
    if (equip.stats.defense) bonus.defense += equip.stats.defense;
    if (equip.stats.speed) bonus.speed += equip.stats.speed;
    if (equip.stats.critRate) bonus.critRate += equip.stats.critRate;
    if (equip.stats.critDamage) bonus.critDamage += equip.stats.critDamage;
  }

  bonus.maxHp = bonus.hp;
  bonus.maxMp = bonus.mp;

  return bonus;
}

export function canAdvance(level: number): boolean {
  return level >= 15;
}

export function canAwaken(level: number): boolean {
  return level >= 50;
}

export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

export function getLevelUpRewards(level: number): { hp: number; mp: number; attack: number; defense: number } {
  const base = { hp: 50, mp: 5, attack: 5, defense: 3 };
  if (level >= 15) {
    base.hp += 20;
    base.attack += 3;
  }
  if (level >= 30) {
    base.hp += 30;
    base.attack += 5;
    base.defense += 2;
  }
  if (level >= 50) {
    base.hp += 50;
    base.attack += 8;
    base.defense += 5;
    base.mp += 5;
  }
  return base;
}
