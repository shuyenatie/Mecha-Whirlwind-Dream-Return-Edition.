import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const stageVisualPath = 'src/data/stageVisualData.ts';
const gameScenePath = 'src/scenes/GameScene.ts';
const visualAssetPath = 'src/data/visualAssetData.ts';
const importScriptPath = 'tools/import_reference_assets.ps1';

const requiredStageKeys = [
  'stage_1_1',
  'stage_1_2',
  'stage_1_3',
  'stage_2_1',
  'stage_2_2',
  'stage_2_3',
  'stage_3_1',
  'stage_3_2',
  'stage_4_1',
  'stage_4_2',
  'stage_final',
  'stage_hidden_1',
];

const requiredAssets = [
  'assets/backgrounds/stage_moon_battle.png',
  'assets/backgrounds/stage_sky_artillery.png',
  'assets/backgrounds/stage_base_lab.png',
  'assets/backgrounds/stage_base_hangar.png',
  'assets/backgrounds/stage_station_corridor.png',
  'assets/backgrounds/stage_station_explore.png',
  'assets/backgrounds/stage_command_room.png',
  'assets/backgrounds/stage_void_plaza.png',
  'assets/backgrounds/stage_ground_moon.png',
  'assets/backgrounds/stage_ground_tech.png',
];

if (!existsSync(stageVisualPath)) {
  failures.push(`${stageVisualPath} is missing.`);
} else {
  const source = readFileSync(stageVisualPath, 'utf8');
  for (const stageKey of requiredStageKeys) {
    if (!source.includes(stageKey)) failures.push(`Missing stage visual mapping for ${stageKey}.`);
  }
  if (!source.includes('getStageVisual')) failures.push('stageVisualData.ts should export getStageVisual().');
}

if (existsSync(gameScenePath)) {
  const source = readFileSync(gameScenePath, 'utf8');
  if (!source.includes("from '../data/stageVisualData'")) failures.push('GameScene should import stageVisualData.');
  if (!source.includes('getStageVisual(this.currentStage.id)')) failures.push('GameScene should choose visuals by current stage id.');
  if (/backgroundKey === 'bg_earth'/.test(source)) failures.push('GameScene should not special-case bg_earth for visual selection.');
} else {
  failures.push(`${gameScenePath} is missing.`);
}

if (existsSync(visualAssetPath)) {
  const source = readFileSync(visualAssetPath, 'utf8');
  for (const asset of requiredAssets) {
    if (!source.includes(asset)) failures.push(`visualAssetData is missing ${asset}.`);
  }
} else {
  failures.push(`${visualAssetPath} is missing.`);
}

if (existsSync(importScriptPath)) {
  const source = readFileSync(importScriptPath, 'utf8');
  const patterns = ['*54_82.jpg', '*55_82.jpg', '*71_82.jpg', '*73_82.jpg', '*75_82.jpg', '*77_82.jpg', '*79_82.jpg', '*72_82.jpg'];
  for (const pattern of patterns) {
    if (!source.includes(pattern)) failures.push(`import_reference_assets.ps1 should import source ${pattern}.`);
  }
} else {
  failures.push(`${importScriptPath} is missing.`);
}

for (const asset of requiredAssets) {
  if (!existsSync(join('public', asset))) failures.push(`Missing generated asset public/${asset}.`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Stage visual mapping and generated scene assets are wired correctly.');
