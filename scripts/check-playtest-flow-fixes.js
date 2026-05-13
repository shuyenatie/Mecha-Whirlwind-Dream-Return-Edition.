import fs from 'node:fs';

const files = {
  packageJson: JSON.parse(fs.readFileSync('package.json', 'utf8')),
  characterSelect: fs.readFileSync('src/scenes/CharacterSelectScene.ts', 'utf8'),
  gameScene: fs.readFileSync('src/scenes/GameScene.ts', 'utf8'),
  hubScene: fs.readFileSync('src/scenes/HubScene.ts', 'utf8'),
  playerData: fs.readFileSync('src/data/playerData.ts', 'utf8'),
  stageData: fs.readFileSync('src/data/stageData.ts', 'utf8'),
};

const failures = [];

function expect(ok, message) {
  if (!ok) failures.push(message);
}

function getStageBlock(stageId) {
  const start = files.stageData.indexOf(`id: '${stageId}'`);
  if (start < 0) return '';
  const next = files.stageData.indexOf('\n  {', start + 1);
  return files.stageData.slice(start, next < 0 ? files.stageData.length : next);
}

const stage11 = getStageBlock('stage_1_1');
const stage12 = getStageBlock('stage_1_2');
const stage13 = getStageBlock('stage_1_3');

expect(
  files.packageJson.scripts?.['check:playtest-flow-fixes'] === 'node scripts/check-playtest-flow-fixes.js',
  'package.json should expose check:playtest-flow-fixes.'
);
expect(
  /check:playtest-flow-fixes/.test(files.packageJson.scripts?.['check:playtest-fixes'] || ''),
  'check:playtest-fixes should aggregate the flow-fix check.'
);

expect(/nextStageId:\s*'stage_1_2'/.test(stage11), 'stage_1_1 should continue to stage_1_2.');
expect(/nextStageId:\s*'stage_1_3'/.test(stage12), 'stage_1_2 should continue to stage_1_3.');
expect(/boss:\s*'[^']+'/.test(stage13), 'stage_1_3 should contain a boss encounter.');

expect(
  /createNewSave/.test(files.characterSelect) &&
  /saveGame/.test(files.characterSelect) &&
  /const initialSave = createNewSave\(selectedType\)/.test(files.characterSelect) &&
  /saveData:\s*initialSave/.test(files.characterSelect),
  'Character select should create, save, and pass first-stage saveData for the selected mecha.'
);

expect(
  /private activeSaveData:\s*PlayerSaveData \| null = null/.test(files.gameScene) &&
  /this\.activeSaveData = normalizeSaveData\(/.test(files.gameScene),
  'GameScene should retain the active save supplied by scene entry.'
);
expect(
  /loadedSave\?\.mechaType === this\.player\.mechaType/.test(files.gameScene) &&
  /this\.activeSaveData/.test(files.gameScene),
  'GameScene saves should not merge progress from a different mecha save.'
);
expect(
  /savePlayerData\(\{ collectStageGold: true, markStageComplete: true \}\)/.test(files.gameScene) &&
  /const clearedSave/.test(files.gameScene),
  'Stage clear should persist rewards and completed stage exactly once before navigation.'
);
expect(
  /scene\.restart\(\{[\s\S]*stageId:\s*this\.currentStage\.id[\s\S]*saveData:\s*retrySave/.test(files.gameScene) &&
  /savePlayerData\(\{ markStageCompleted: false \}\)/.test(files.gameScene),
  'Failure retry should keep the current stage and avoid marking it complete.'
);
expect(
  /scene\.restart\(\{[\s\S]*stageId:\s*nextStage\.id[\s\S]*saveData:\s*latestSave/.test(files.gameScene),
  'Next-stage navigation should carry the freshly persisted saveData.'
);
expect(
  /scene\.start\('HubScene', \{ saveData:\s*latestSave \}\)/.test(files.gameScene),
  'Return-to-hub navigation should carry freshly persisted saveData.'
);

expect(
  /import \{ PlayerSaveData[\s\S]*saveGame/.test(files.hubScene) &&
  /private equipInventoryItem\(item: EquipData\): void/.test(files.hubScene) &&
  /saveGame\(this\.saveData\)/.test(files.hubScene),
  'Hub inventory should equip picked-up items and persist the updated save.'
);
expect(
  /calculateEquipBonusTotal\(\)/.test(files.hubScene) &&
  /Object\.values\(this\.saveData\.equips\)/.test(files.hubScene),
  'Hub character panel should calculate equipped stat bonuses from saved equipment.'
);

expect(/inventory:\s*string\[\]/.test(files.playerData), 'PlayerSaveData should keep inventory item ids.');
expect(/completedStages:\s*string\[\]/.test(files.playerData), 'PlayerSaveData should keep completed stage ids.');

if (failures.length > 0) {
  console.error('Playtest flow fix checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Playtest flow fix checks passed.');
