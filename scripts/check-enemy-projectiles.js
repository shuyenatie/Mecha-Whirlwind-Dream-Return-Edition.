import fs from 'node:fs';

const source = fs.readFileSync('src/entities/Enemy.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const failures = [];

if (packageJson.scripts?.['check:enemy-projectiles'] !== 'node scripts/check-enemy-projectiles.js') {
  failures.push('package.json should expose check:enemy-projectiles.');
}

if (/this\.attackRange\s*>\s*100/.test(source)) {
  failures.push('Generic attackRange should not make normal patrol enemies shoot projectiles.');
}

if (!/this\.behavior\s*===\s*'sniper'[\s\S]*this\.shootProjectile\(\)/.test(source)) {
  failures.push('Enemy projectiles should be limited to explicit sniper behavior.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Enemy projectile behavior is limited to explicit ranged enemies.');
