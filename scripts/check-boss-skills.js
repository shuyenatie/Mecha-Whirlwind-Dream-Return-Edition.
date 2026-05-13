import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sceneSource = readFileSync(join(root, 'src/scenes/GameScene.ts'), 'utf8');
const dataSource = readFileSync(join(root, 'src/data/enemyData.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const failures = [];

if (packageJson.scripts?.['check:boss-skills'] !== 'node scripts/check-boss-skills.js') {
  failures.push('package.json should expose check:boss-skills.');
}

if (!/specialAttacks:\s*\[[^\]]*'void_beam'[^\]]*'summon_drones'/.test(dataSource)) {
  failures.push('Boss data should include void_beam and summon_drones.');
}

for (const symbol of ['updateBossSkills', 'tryCastBossSpecial', 'castVoidBeam', 'castSummonDrones']) {
  if (!new RegExp(`${symbol}\\(`).test(sceneSource)) {
    failures.push(`GameScene should implement ${symbol}.`);
  }
}

if (!/createEnemyMeleeHitbox\([^)]*void_beam/.test(sceneSource) || !/lineStyle\([^)]*0xff2255/.test(sceneSource)) {
  failures.push('void_beam should telegraph a visible beam and apply area damage through enemy hitboxes.');
}

if (!/spawnEnemy\('drone'/.test(sceneSource) || !/summonedByBoss/.test(sceneSource)) {
  failures.push('summon_drones should spawn drone enemies flagged as boss summons.');
}

if (!/if \(isBoss\)[\s\S]*this\.checkStageProgress\(\)/.test(sceneSource)) {
  failures.push('Boss death should continue through the existing stage progress and exit portal flow.');
}

if (failures.length > 0) {
  console.error('Boss skill checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Boss void_beam, summon_drones, and stage clear flow checks passed.');
