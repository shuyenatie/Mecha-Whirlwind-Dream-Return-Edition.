import fs from 'node:fs';

const files = {
  packageJson: JSON.parse(fs.readFileSync('package.json', 'utf8')),
  playerData: fs.readFileSync('src/data/playerData.ts', 'utf8'),
  equipData: fs.readFileSync('src/data/equipData.ts', 'utf8'),
  skillData: fs.readFileSync('src/data/skillData.ts', 'utf8'),
  player: fs.readFileSync('src/entities/Player.ts', 'utf8'),
  characterPanel: fs.readFileSync('src/scenes/CharacterPanelScene.ts', 'utf8'),
  inventory: fs.readFileSync('src/scenes/InventoryScene.ts', 'utf8'),
  gameScene: fs.readFileSync('src/scenes/GameScene.ts', 'utf8'),
};

const failures = [];

if (files.packageJson.scripts?.['check:progression'] !== 'node scripts/check-progression.js') {
  failures.push('package.json should expose check:progression.');
}

if (!/export function normalizeSaveData\(/.test(files.playerData)) {
  failures.push('playerData should normalize older saves and equipment/inventory fields.');
}

if (!/export function getEquipById\(/.test(files.equipData)) {
  failures.push('equipData should expose getEquipById() for save hydration.');
}

if (!/export const LEARNING_MODE_SKILL_NOTICE/.test(files.skillData)) {
  failures.push('skillData should expose a learning-edition skill notice without changing level fields.');
}

if (!/public applySaveData\(/.test(files.player)) {
  failures.push('Player should be hydratable from PlayerSaveData.');
}

if (!/private applyTotalStats\(/.test(files.player)) {
  failures.push('Player should immediately apply equipment bonuses to live maxHp/attack/defense/speed/crit stats.');
}

if (/this\.player\.inventory\.push\(current\)/.test(files.inventory)) {
  failures.push('InventoryScene should not push the replaced item after Player.equipItem() already returns it to inventory.');
}

if (!/this\.refreshAllSlots\(\)/.test(files.characterPanel)) {
  failures.push('CharacterPanelScene should refresh all equipment slots after equip changes.');
}

if (!/LEARNING_MODE_SKILL_NOTICE/.test(files.characterPanel)) {
  failures.push('CharacterPanelScene should display the learning-edition skill notice.');
}

if (!/loadGame\(\)/.test(files.gameScene) || !/normalizeSaveData\(/.test(files.gameScene)) {
  failures.push('GameScene should load and normalize saved progression before combat.');
}

if (!/completedStages:\s*completedStages/.test(files.gameScene)) {
  failures.push('GameScene should preserve completed stages while saving stage completion.');
}

if (!/showRewardToast\(/.test(files.gameScene)) {
  failures.push('GameScene should provide clearer reward feedback when XP and gold enter player data.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Progression equipment loop, save merge, rewards, and learning-mode marker are wired.');
