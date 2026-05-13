import fs from 'node:fs';

const player = fs.readFileSync('src/entities/Player.ts', 'utf8');
const enemy = fs.readFileSync('src/entities/Enemy.ts', 'utf8');
const gameScene = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const checks = [
  {
    ok: /check:playtest-combat-fixes/.test(packageJson.scripts?.['check:playtest-fixes'] || ''),
    message: 'package.json aggregates the combat playtest checks.',
  },
  {
    ok: /getTianjianBasicYTolerance\s*\(/.test(player)
      && /attackStep[\s\S]{0,260}combatYTolerance/.test(player),
    message: 'Tianjian basic attacks use per-step Y tolerance tied to visual slash size.',
  },
  {
    ok: /getSkillCombatYTolerance\s*\(/.test(player)
      && /tj_special_1[\s\S]{0,120}64/.test(player)
      && /tj_special_2[\s\S]{0,120}74/.test(player)
      && /tj_ultimate[\s\S]{0,120}92/.test(player),
    message: 'Tianjian U/I/O have explicit, bounded Y-axis hit tolerance.',
  },
  {
    ok: /PLAYER_HURT_INVINCIBLE_MS\s*=\s*(?:8[5-9]\d|9\d\d|1\d{3})/.test(player)
      && /PLAYER_BLOCK_INVINCIBLE_MS\s*=\s*300/.test(player),
    message: 'Player has a named short protection window after taking a real hit.',
  },
  {
    ok: /postAttackRetreatTimer/.test(enemy)
      && /enterPostAttackRecovery\s*\([^)]*retreatDir/.test(enemy)
      && /setVelocityX\(retreatDir \* this\.speed/.test(enemy),
    message: 'Enemy enters post-hit recovery with a short retreat after connecting.',
  },
  {
    ok: /HIT_CONFIRMED_RECOVERY_BONUS_MS/.test(gameScene)
      && /retreatDir/.test(gameScene)
      && /enterPostAttackRecovery\([^)]*\+ HIT_CONFIRMED_RECOVERY_BONUS_MS/.test(gameScene),
    message: 'GameScene adds confirmed-hit recovery so close enemies cannot chain bite the player.',
  },
  {
    ok: /settleHitDrift\s*\(/.test(enemy)
      && /body\.setVelocityX\(0\)/.test(enemy)
      && /landingTimer/.test(enemy),
    message: 'Enemy hurt/landing recovery settles drift instead of leaving floaty positions.',
  },
  {
    ok: /recoverFromHurtToMovement[\s\S]{0,420}setVelocityX\(0\)/.test(player)
      && /recoverFromKnockdownToMovement[\s\S]{0,420}setVelocityX\(0\)/.test(player),
    message: 'Player hurt and knockdown recovery settle velocity before returning movement control.',
  },
  {
    ok: /BOSS_VOID_BEAM_WARNING_MS\s*=\s*760/.test(gameScene)
      && /BOSS_VOID_BEAM_ACTIVE_MS\s*=\s*260/.test(gameScene)
      && /setData\('warningOnly',\s*true\)/.test(gameScene)
      && /setData\('activeWindowMs'/.test(gameScene),
    message: 'Boss void beam has a clear warning-only phase and a separate active damage window.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Playtest combat fix checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Playtest combat fix checks passed (${checks.length}/${checks.length}).`);
