import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const player = read('src/entities/Player.ts');
const enemy = read('src/entities/Enemy.ts');
const gameScene = read('src/scenes/GameScene.ts');
const skillData = read('src/data/skillData.ts');
const pkg = JSON.parse(read('package.json'));

const checks = [
  {
    ok: pkg.scripts?.['check:combat-feel-v2'] === 'node scripts/check-combat-feel-v2.js',
    message: 'package.json exposes check:combat-feel-v2.',
  },
  {
    ok: /recoverFromAttackToMovement\s*\(/.test(player) && /handleMovement\(\)/.test(player),
    message: 'Player attack recovery explicitly returns control to movement.',
  },
  {
    ok: /step:\s*3[\s\S]{0,360}knockbackX:\s*(?:2[8-9]\d|[3-9]\d{2})[\s\S]{0,120}knockbackY:\s*(?:2[4-9]\d|[3-9]\d{2})/.test(player),
    message: 'Tianjian third combo hit has stronger knockback and lift.',
  },
  {
    ok: /hitInvulnerableUntil/.test(enemy) && /recentHitSources/.test(enemy) && /comboProtectMs/.test(enemy),
    message: 'Enemy has short hit invulnerability and per-source combo protection.',
  },
  {
    ok: /interruptAttack\s*\(/.test(enemy) && /attackInProgress/.test(enemy) && /attackTelegraph\?\.destroy/.test(enemy),
    message: 'Enemy windup attacks can be interrupted by hit reactions.',
  },
  {
    ok: /landingTimer/.test(enemy) && /setVelocityY\(\s*0\s*\)/.test(enemy),
    message: 'Enemy hit reaction has an explicit landing recovery path.',
  },
  {
    ok: /buildSkillReaction\s*\(/.test(player) && /sourceKey/.test(player) && /comboProtectMs/.test(player),
    message: 'Tianjian U/I/O use shared skill reaction metadata.',
  },
  {
    ok: /hitZone\.setData\('sourceKey'/.test(player) && /hitZone\.setData\('comboProtectMs'/.test(player),
    message: 'Skill and melee hitboxes carry source keys and protection windows.',
  },
  {
    ok: /createHitEffect\(.*hitType/.test(gameScene) && /impactOffsetY/.test(gameScene),
    message: 'GameScene creates stronger hit feedback offset away from character centers.',
  },
  {
    ok: /sourceKey/.test(gameScene) && /comboProtectMs/.test(gameScene) && /enemy\.takeDamage\(damage,\s*dir,\s*\{[\s\S]*sourceKey/.test(gameScene),
    message: 'GameScene passes source/protection metadata into unified enemy hit reaction.',
  },
  {
    ok: /id:\s*'tj_special_1'[\s\S]*hitCount:\s*2/.test(skillData)
      && /id:\s*'tj_special_2'[\s\S]*hitCount:\s*5/.test(skillData)
      && /id:\s*'tj_ultimate'[\s\S]*hitCount:\s*10/.test(skillData),
    message: 'Tianjian U/I/O skill hit counts remain unlocked and unchanged.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Combat feel v2 checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Combat feel v2 checks passed (${checks.length}/${checks.length}).`);
