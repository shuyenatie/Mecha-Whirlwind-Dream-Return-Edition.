import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const playerSource = readFileSync(join(process.cwd(), 'src/entities/Player.ts'), 'utf8');
const enemySource = readFileSync(join(process.cwd(), 'src/entities/Enemy.ts'), 'utf8');

const checks = [
  {
    label: 'Player melee hit zones are registered with GameScene player hitbox group',
    passed: /registerPlayerHitbox\(hitZone\)/.test(playerSource)
      && /getPlayerHitboxGroup\?\.\(\)\.add\(hitbox\)/.test(playerSource),
  },
  {
    label: 'Player projectiles are registered with GameScene player projectile group',
    passed: /registerPlayerProjectile\((bullet|proj)\)/.test(playerSource)
      && /getPlayerProjectileGroup\?\.\(\)\.add\(projectile\)/.test(playerSource),
  },
  {
    label: 'Enemy projectiles are registered with GameScene enemy projectile group',
    passed: /registerEnemyProjectile\(bullet\)/.test(enemySource)
      && /getEnemyProjectileGroup\?\.\(\)\.add\(projectile\)/.test(enemySource),
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  console.error('Combat registration checks failed:');
  for (const check of failed) {
    console.error(`- ${check.label}`);
  }
  process.exit(1);
}

console.log(`Combat registration OK (${checks.length} checks).`);
