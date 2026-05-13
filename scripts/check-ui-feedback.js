import fs from 'node:fs';

const player = fs.readFileSync('src/entities/Player.ts', 'utf8');
const uiScene = fs.readFileSync('src/scenes/UIScene.ts', 'utf8');
const gameScene = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const checks = [
  {
    ok: packageJson.scripts?.['check:ui-feedback'] === 'node scripts/check-ui-feedback.js',
    message: 'package.json exposes check:ui-feedback.',
  },
  {
    ok: /public showPickupNotice\(/.test(uiScene) && /pickupFeed/.test(uiScene),
    message: 'UIScene exposes a pickup feed API.',
  },
  {
    ok: /public updateObjectiveProgress\(/.test(uiScene) && /objectiveText/.test(uiScene),
    message: 'UIScene exposes objective progress UI.',
  },
  {
    ok: /public flashSkillSlot\(/.test(uiScene) && /public showSkillFailure\(/.test(uiScene),
    message: 'UIScene exposes skill success/failure feedback.',
  },
  {
    ok: /onSkillCast/.test(player) && /onSkillFailure/.test(player),
    message: 'Player emits skill cast and failure callbacks.',
  },
  {
    ok: /showWorldPickupText\(/.test(gameScene) && /showPickupNotice/.test(gameScene),
    message: 'GameScene shows pickup feedback both in-world and in UI.',
  },
  {
    ok: /updateObjectiveProgress\(/.test(gameScene) && /区域清理完成/.test(gameScene),
    message: 'GameScene keeps kill objective progress updated.',
  },
  {
    ok: /addDropAttractFeedback\(/.test(gameScene) && /killTweensOf\(dropSprite\)/.test(gameScene),
    message: 'Drops pulse while available and pickup cancels idle tweens.',
  },
  {
    ok: /hitType/.test(player) && /hitType/.test(gameScene) && /showDamageNumber\(actualDamage, hitType/.test(enemySource()),
    message: 'Damage numbers can be styled by basic, skill, and ultimate hit types.',
  },
];

function enemySource() {
  return fs.readFileSync('src/entities/Enemy.ts', 'utf8');
}

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('UI feedback checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`UI feedback checks passed (${checks.length}/${checks.length}).`);
