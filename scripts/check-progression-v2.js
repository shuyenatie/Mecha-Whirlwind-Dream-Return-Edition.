import fs from 'node:fs';

const files = {
  packageJson: JSON.parse(fs.readFileSync('package.json', 'utf8')),
  equipData: fs.readFileSync('src/data/equipData.ts', 'utf8'),
  playerData: fs.readFileSync('src/data/playerData.ts', 'utf8'),
  player: fs.readFileSync('src/entities/Player.ts', 'utf8'),
  inventory: fs.readFileSync('src/scenes/InventoryScene.ts', 'utf8'),
  characterPanel: fs.readFileSync('src/scenes/CharacterPanelScene.ts', 'utf8'),
  gameScene: fs.readFileSync('src/scenes/GameScene.ts', 'utf8'),
};

const failures = [];

if (files.packageJson.scripts?.['check:progression-v2'] !== 'node scripts/check-progression-v2.js') {
  failures.push('package.json should expose check:progression-v2.');
}

if (!/mp\?:\s*number/.test(files.equipData)) {
  failures.push('EquipData stats should support MP max bonuses.');
}

if (!/export function formatEquipStats\(/.test(files.equipData)) {
  failures.push('equipData should expose formatEquipStats() for consistent equipment stat text.');
}

if (!/bonus\.maxMp\s*=\s*bonus\.mp/.test(files.playerData)) {
  failures.push('calculateEquipBonus() should translate equipment MP into maxMp bonus.');
}

if (!/private baseMaxMp/.test(files.player) || !/this\.maxMp\s*=\s*Math\.max\(1,\s*this\.baseMaxMp \+ \(equips\.maxMp \|\| 0\)\)/.test(files.player)) {
  failures.push('Player should keep baseMaxMp separate and immediately apply equipment MP bonuses.');
}

if (!/public toSaveData\(/.test(files.player)) {
  failures.push('Player should expose toSaveData() so UI equipment changes and pickups can be saved consistently.');
}

if (!/this\.persistProgression\(\)/.test(files.player)) {
  failures.push('Player equipment and inventory mutations should request progression persistence.');
}

if (!/formatEquipStats\(item\)/.test(files.inventory) || !/替换/.test(files.inventory) || !/已装备/.test(files.inventory)) {
  failures.push('InventoryScene should show stat text, replace/equip state, and an equipped marker.');
}

if (!/formatEquipStats\(equip\)/.test(files.characterPanel) || !/maxMp/.test(files.characterPanel)) {
  failures.push('CharacterPanelScene should display formatted equipment stats and MP max totals.');
}

if (!/RARITY_NAMES/.test(files.gameScene) || !/getEquipDropLabel\(/.test(files.gameScene)) {
  failures.push('GameScene should include rarity name/color feedback for equipment drops.');
}

if (!/this\.player\.addToInventory\(drop\.equipData\)[\s\S]{0,220}this\.savePlayerData\([^)]*\)/.test(files.gameScene)) {
  failures.push('Equipment pickup should write inventory and immediately save progression.');
}

if (!/grantStageEquipmentReward\(/.test(files.gameScene) || !/rewardEquip/.test(files.gameScene)) {
  failures.push('Stage clear should grant and clearly report possible equipment rewards.');
}

if (failures.length > 0) {
  console.error('Progression v2 checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Progression v2 equipment UI, stat recompute, rarity feedback, rewards, and persistence checks passed.');
