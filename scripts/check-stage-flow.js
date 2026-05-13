import fs from 'node:fs';

const gameScene = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const checks = [
  {
    ok: packageJson.scripts?.['check:stage-flow'] === 'node scripts/check-stage-flow.js',
    message: 'package.json exposes check:stage-flow.',
  },
  {
    ok: /interface StageWave/.test(gameScene) && /buildStageWaves\(/.test(gameScene),
    message: 'GameScene defines and builds stage waves from stage enemy data.',
  },
  {
    ok: /spawnCurrentWave\(/.test(gameScene) && /scheduleNextWave\(/.test(gameScene),
    message: 'GameScene can spawn the current wave and schedule the next wave.',
  },
  {
    ok: /private enemyGroup!/.test(gameScene) && /this\.enemyGroup\.add\(enemy\)/.test(gameScene),
    message: 'Enemies are registered in a physics group so later waves are hittable.',
  },
  {
    ok: /createExitPortal\(/.test(gameScene) && /handleExitPortalOverlap\(/.test(gameScene),
    message: 'Final clear creates an exit portal instead of immediately opening results.',
  },
  {
    ok: /showWaveBanner\(/.test(gameScene) && /第\$\{waveNumber\}波/.test(gameScene),
    message: 'Wave transitions show an in-game banner.',
  },
  {
    ok: /updateWaveObjective\(/.test(gameScene) && /敌人/.test(gameScene) && /出口/.test(gameScene),
    message: 'Objective text covers wave combat and exit prompts.',
  },
  {
    ok: !/createEnemies\(\);\s*\n\s*this\.setupCollisions/.test(gameScene),
    message: 'GameScene no longer spawns every enemy before collision setup.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Stage flow checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Stage flow checks passed (${checks.length}/${checks.length}).`);
