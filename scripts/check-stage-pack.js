import fs from 'node:fs';

const stageData = fs.readFileSync('src/data/stageData.ts', 'utf8');
const gameScene = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const stageOrder = Array.from(stageData.matchAll(/id:\s*'(stage_[^']+)'/g), (match) => match[1]);
const firstThreeOrder = stageOrder.slice(0, 3).join(' -> ');
const firstThreeBlock = stageData.slice(0, stageData.indexOf("id: 'stage_2_1'"));

const checks = [
  {
    ok: packageJson.scripts?.['check:stage-pack'] === 'node scripts/check-stage-pack.js',
    message: 'package.json exposes check:stage-pack.',
  },
  {
    ok: firstThreeOrder === 'stage_1_1 -> stage_1_2 -> stage_1_3',
    message: 'The first playable chain is stage_1_1 -> stage_1_2 -> stage_1_3.',
  },
  {
    ok: /id:\s*'stage_1_3'[\s\S]*?boss:\s*'void_commander'/.test(firstThreeBlock),
    message: 'stage_1_3 is the first Earth boss stage.',
  },
  {
    ok: /if \(this\.currentStage\.boss && !this\.bossSpawned\) \{\s*this\.spawnBoss\(\);/.test(gameScene),
    message: 'Boss stages spawn a boss after the final wave.',
  },
  {
    ok: /this\.createExitPortal\(\);/.test(gameScene) && /private handleExitPortalOverlap\(\)/.test(gameScene),
    message: 'Non-boss stages and defeated boss stages open the exit portal.',
  },
  {
    ok: /const nextStage = STAGE_DATABASE\[currentStageIdx \+ 1\]/.test(gameScene),
    message: 'Clear results can continue to the next stage in database order.',
  },
  {
    ok: /区域清理完成/.test(gameScene) && /前往出口/.test(gameScene) && /出口已开启/.test(gameScene),
    message: 'Exit and objective UI text is readable Chinese.',
  },
  {
    ok: /第\$\{waveNumber\}波 敌人来袭/.test(gameScene) && /BOSS 出现/.test(gameScene),
    message: 'Wave and boss warning text is readable Chinese.',
  },
  {
    ok: /地球基地 - 外围防线/.test(stageData) && /地球基地 - 指挥中心/.test(stageData) && /地球基地 - 地下实验室/.test(stageData),
    message: 'The first three stage names are readable Chinese.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Stage pack checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Stage pack checks passed (${checks.length}/${checks.length}).`);
