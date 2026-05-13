import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const enemySource = readFileSync(join(root, 'src/entities/Enemy.ts'), 'utf8');
const sceneSource = readFileSync(join(root, 'src/scenes/GameScene.ts'), 'utf8');
const dataSource = readFileSync(join(root, 'src/data/enemyData.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const failures = [];

if (packageJson.scripts?.['check:enemy-ai'] !== 'node scripts/check-enemy-ai.js') {
  failures.push('package.json should expose check:enemy-ai.');
}

for (const field of ['attackWindupMs', 'attackActiveMs', 'attackWidth', 'attackHeight', 'knockbackResist', 'telegraphColor']) {
  if (!new RegExp(`${field}\\??:`).test(dataSource)) {
    failures.push(`EnemyData should define optional ${field}.`);
  }
}

if (!/startTelegraphedMeleeAttack\(/.test(enemySource) || !/spawnAttackTelegraph\(/.test(enemySource)) {
  failures.push('Enemy melee attacks should create a visible telegraph before damage is active.');
}

if (!/createEnemyMeleeHitbox\(/.test(sceneSource) || !/getEnemyMeleeGroup\(/.test(sceneSource)) {
  failures.push('GameScene should expose enemy melee hitbox registration for delayed enemy attacks.');
}

if (/enemy\.state\s*===\s*EnemyState\.ATTACK[\s\S]{0,260}player\.takeDamage\(enemy\.getMeleeDamage\(\)/.test(sceneSource)) {
  failures.push('GameScene should not directly damage the player just because an enemy is in ATTACK state.');
}

if (!/spawnSniperTelegraph\(/.test(enemySource) || !/shootProjectile\(\)[\s\S]*attackActiveMs/.test(enemySource)) {
  failures.push('Sniper attacks should show an aim warning before projectile release.');
}

if (!/knockbackResist/.test(enemySource) || !/Math\.max\(0(?:\.05)?,\s*1\s*-\s*this\.knockbackResist\)/.test(enemySource)) {
  failures.push('Enemy knockback should be reduced by knockbackResist.');
}

if (!/id:\s*'heavy'[\s\S]*knockbackResist:\s*0\.[5-9]/.test(dataSource)) {
  failures.push('Heavy enemies should have high knockbackResist.');
}

if (failures.length > 0) {
  console.error('Enemy AI checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Enemy AI telegraphs, sniper warning, and knockback resistance checks passed.');
