import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const stageData = readFileSync(join(root, 'src/data/stageData.ts'), 'utf8');
const gameScene = readFileSync(join(root, 'src/scenes/GameScene.ts'), 'utf8');
const hubScene = readFileSync(join(root, 'src/scenes/HubScene.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const failures = [];

function expect(ok, message) {
  if (!ok) failures.push(message);
}

function getStageBlock(stageId) {
  const start = stageData.indexOf(`id: '${stageId}'`);
  if (start < 0) return '';
  const next = stageData.indexOf('\n  {', start + 1);
  return stageData.slice(start, next < 0 ? stageData.length : next);
}

const stageOrder = Array.from(stageData.matchAll(/id:\s*'(stage_[^']+)'/g), (match) => match[1]);
const firstThreeOrder = stageOrder.slice(0, 3).join(' -> ');
const stage11 = getStageBlock('stage_1_1');
const stage12 = getStageBlock('stage_1_2');
const stage13 = getStageBlock('stage_1_3');

expect(
  packageJson.scripts?.['check:stage-loop-v2'] === 'node scripts/check-stage-loop-v2.js',
  'package.json should expose check:stage-loop-v2.'
);
expect(firstThreeOrder === 'stage_1_1 -> stage_1_2 -> stage_1_3', 'Stage chain should begin stage_1_1 -> stage_1_2 -> stage_1_3.');
expect(/nextStageId:\s*'stage_1_2'/.test(stage11), 'stage_1_1 should explicitly continue to stage_1_2.');
expect(/nextStageId:\s*'stage_1_3'/.test(stage12), 'stage_1_2 should explicitly continue to stage_1_3.');
expect(/boss:\s*'[^']+'/.test(stage13), 'stage_1_3 should be a boss stage.');

expect(/interface GameSceneInitData[\s\S]*saveData\?:\s*PlayerSaveData/.test(gameScene), 'GameScene should accept saveData in scene init data.');
expect(/private getNextStage\(\): StageData \| undefined/.test(gameScene), 'GameScene should resolve the next stage through a helper.');
expect(/this\.currentStage\.nextStageId/.test(gameScene), 'GameScene next-stage flow should use StageData.nextStageId.');
expect(/savePlayerData\(\{ markStageCompleted: true \}\)/.test(gameScene), 'Stage clear should save with markStageCompleted: true.');
expect(/savePlayerData\(\{ markStageCompleted: false \}\)/.test(gameScene), 'Failure/hub exits should save without marking the stage complete.');
expect(/scene\.restart\(\{[\s\S]*saveData:/.test(gameScene), 'Retry/next-stage restart should pass saveData.');
expect(/scene\.start\('HubScene', \{ saveData:/.test(gameScene), 'GameScene should return to HubScene with saveData.');
expect(/createExitPortal\(\)/.test(gameScene) && /handleExitPortalOverlap\(\)/.test(gameScene), 'Exit portal should gate clear completion.');
expect(/if \(isBoss\)[\s\S]*this\.checkStageProgress\(\)/.test(gameScene), 'Boss death should continue through stage progress and open the exit.');

expect(/private isStageUnlocked\([^)]*stage/.test(hubScene), 'HubScene should centralize stage unlock checks.');
expect(/candidate\.nextStageId === stage\.id/.test(hubScene), 'HubScene unlock checks should follow nextStageId wiring.');
expect(/this\.scene\.start\('GameScene', \{[\s\S]*saveData: this\.saveData/.test(hubScene), 'Hub stage entry should pass saveData into GameScene.');
expect(/const lockedHitArea/.test(hubScene), 'Locked Hub stages should be visible and provide a blocked interaction.');

if (failures.length > 0) {
  console.error('Stage loop v2 checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Stage loop v2 checks passed.');
