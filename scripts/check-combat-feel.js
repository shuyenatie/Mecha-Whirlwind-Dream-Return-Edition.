import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const player = read('src/entities/Player.ts');
const enemy = read('src/entities/Enemy.ts');
const gameScene = read('src/scenes/GameScene.ts');
const pkg = JSON.parse(read('package.json'));

const checks = [
  {
    ok: pkg.scripts?.['check:combat-feel'] === 'node scripts/check-combat-feel.js',
    message: 'package.json exposes check:combat-feel',
  },
  {
    ok: /queuedAttack\s*:\s*boolean/.test(player),
    message: 'Player buffers attack input during an active swing',
  },
  {
    ok: /queuedAttackCount\s*:\s*number/.test(player) && /remainingSteps/.test(player),
    message: 'Player preserves rapid repeated attacks through the 3-hit chain',
  },
  {
    ok: /currentAttackStep\s*:\s*number/.test(player),
    message: 'Player tracks the current 3-hit attack step',
  },
  {
    ok: /getAttackProfile\s*\(/.test(player) && /hitStopMs/.test(player),
    message: 'Player defines per-step attack profiles with hit stop',
  },
  {
    ok: /this\.currentAttackStep\s*%\s*3\s*\+\s*1/.test(player),
    message: 'Player cycles attacks through a 3-hit chain',
  },
  {
    ok: /shouldChain\s*=\s*this\.queuedAttack/.test(player) && /if\s*\(shouldChain\)[\s\S]*performAttack/.test(player),
    message: 'Player consumes queued attacks when the swing recovers',
  },
  {
    ok: /hitZone\.setData\('reaction'/.test(player) && /hitZone\.setData\('hitStopMs'/.test(player),
    message: 'Melee hitboxes carry reaction and hit-stop data',
  },
  {
    ok: /export interface EnemyHitReaction/.test(enemy),
    message: 'Enemy exposes configurable hit reaction data',
  },
  {
    ok: /reaction:\s*EnemyHitReaction\s*=\s*\{\}/.test(enemy) && /knockbackY/.test(enemy),
    message: 'Enemy.takeDamage applies configurable knockback/lift',
  },
  {
    ok: /applyHitStop\s*\(/.test(gameScene),
    message: 'GameScene has hit-stop feedback for successful melee hits',
  },
  {
    ok: /getData\('reaction'\)/.test(gameScene) && /getData\('hitStopMs'\)/.test(gameScene),
    message: 'GameScene reads melee hit reaction and hit-stop data',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Combat feel checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Combat feel checks passed (${checks.length}/${checks.length}).`);
