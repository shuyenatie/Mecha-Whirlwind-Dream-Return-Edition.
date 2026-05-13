import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const player = read('src/entities/Player.ts');
const enemy = read('src/entities/Enemy.ts');
const scene = read('src/scenes/GameScene.ts');
const data = read('src/data/enemyData.ts');
const packageJson = JSON.parse(read('package.json'));

const failures = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

if (packageJson.scripts?.['check:combat-authenticity'] !== 'node scripts/check-combat-authenticity.js') {
  failures.push('package.json should expose check:combat-authenticity.');
}

requirePattern(scene, /isCombatPlaneOverlap\s*\(/, 'GameScene should gate damage with a combat-plane Y-axis overlap helper.');
requirePattern(scene, /verticalOverlapRatio[\s\S]*combatYTolerance/, 'Y-axis helper should combine body overlap ratio and combatYTolerance.');
requirePattern(scene, /handlePlayerHitboxOverlap[\s\S]*isCombatPlaneOverlap\(hitZone,\s*enemy/, 'Player hitboxes should check Y-axis combat plane before enemy damage.');
requirePattern(scene, /handleEnemyMeleeOverlap[\s\S]*isCombatPlaneOverlap\(hitZone,\s*player/, 'Enemy melee hitboxes should check Y-axis combat plane before player damage.');
requirePattern(player, /hitZone\.setData\('combatYTolerance'/, 'Player melee and skill hitboxes should carry combatYTolerance metadata.');
requirePattern(scene, /hitZone\.setData\('combatYTolerance'/, 'Enemy melee hitboxes should carry combatYTolerance metadata.');

requirePattern(scene, /takeDamage\([\s\S]*didLastHitConnect\(\)/, 'GameScene should only count feedback after Enemy confirms damage was accepted.');
requirePattern(enemy, /lastHitConnected/, 'Enemy should expose whether the last takeDamage call actually applied.');
requirePattern(player, /hitZone\.setData\('hitEnemies',\s*new Set/, 'Player hitboxes should keep per-hitbox hitEnemies sets.');
requirePattern(enemy, /recentHitSources[\s\S]*comboProtectMs/, 'Enemy should keep per-source combo protection to prevent rapid duplicate settlement.');

requirePattern(enemy, /attackRecoveryMs/, 'Enemy data should include a post-hit attack recovery window.');
requirePattern(enemy, /enterPostAttackRecovery\s*\(/, 'Enemy should enter a readable recovery state after active attacks or a player hit.');
requirePattern(enemy, /state === EnemyState\.HURT[\s\S]*attackInProgress/, 'Enemy windup should remain interruptible by hurt reactions.');
requirePattern(scene, /source\?\.enterPostAttackRecovery/, 'Enemy melee hits should force short recovery after connecting with the player.');
requirePattern(data, /attackRecoveryMs\??:/, 'EnemyData should define optional attackRecoveryMs.');

requirePattern(scene, /createBossAttackWarning\s*\(/, 'Boss specials should use a stronger shared warning helper.');
requirePattern(scene, /setData\('isBoss',\s*true\)/, 'Spawned bosses should be marked for boss-only combat reactions.');
requirePattern(scene, /setData\('superArmor',\s*true\)/, 'Spawned bosses should opt into super armor.');
requirePattern(enemy, /superArmor[\s\S]*showDamageNumber[\s\S]*knockbackScale/, 'Boss super armor should preserve damage feedback while reducing hit reaction.');
requirePattern(scene, /createEnemyMeleeHitbox\(centerX,\s*centerY,\s*beamLength,\s*beamHeight,[\s\S]*'void_beam'/.test(scene) ? /void_beam/ : /$a/, 'Boss beam should still damage only through an active hitbox path.');

requirePattern(scene, /public getEnemyMeleeGroup\(\)/, 'Existing enemy melee group path should remain available.');
requirePattern(scene, /public getPlayerHitboxGroup\(\)/, 'Existing player hitbox group path should remain available.');
requirePattern(player, /registerPlayerHitbox\(hitZone\)/, 'Player hitbox registration path should remain intact.');
requirePattern(enemy, /combatScene\.createEnemyMeleeHitbox\?\.\(/, 'Enemy melee attack should still route through GameScene hitbox creation.');

if (failures.length > 0) {
  console.error('Combat authenticity checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Combat authenticity checks passed.');
