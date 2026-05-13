import fs from 'node:fs';

const player = fs.readFileSync('src/entities/Player.ts', 'utf8');
const uiScene = fs.readFileSync('src/scenes/UIScene.ts', 'utf8');
const skillData = fs.readFileSync('src/data/skillData.ts', 'utf8');
const gameScene = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const checks = [
  {
    ok: packageJson.scripts?.['check:skill-system'] === 'node scripts/check-skill-system.js',
    message: 'package.json exposes check:skill-system.',
  },
  {
    ok: /export function getPlayableSkills\(/.test(skillData) && /learningModeUnlock/.test(skillData),
    message: 'skillData exposes learning-mode playable skills without changing level requirements.',
  },
  {
    ok: /getPlayableSkills\(this\.mechaType, this\.level/.test(player),
    message: 'Player uses playable skills for U/I/O instead of level-gated available skills only.',
  },
  {
    ok: /showSkillNotice\(/.test(player) && /MP不足|MP/.test(player) && /冷却|cooldown/i.test(player),
    message: 'Player gives short feedback for failed skill casts.',
  },
  {
    ok: /createSwordWaveSkill\(/.test(player) && /visual_fx_slash/.test(player),
    message: 'Tianjian U sword wave has a dedicated projectile-style implementation.',
  },
  {
    ok: /createWhirlwindSkill\(/.test(player) && /for\s*\(let i = 0; i < skill\.hitCount/.test(player),
    message: 'Tianjian I whirlwind creates repeated area hitboxes.',
  },
  {
    ok: /createSiriusUltimate\(/.test(player) && /this\.scene\.cameras\.main\.flash/.test(player),
    message: 'Tianjian O ultimate has a dedicated flash/range implementation.',
  },
  {
    ok: /setSkillHitData\(/.test(player) && /hitStopMs/.test(player) && /reaction/.test(player),
    message: 'Skill hitboxes carry reaction and hit-stop data.',
  },
  {
    ok: /finishSkillCast\(/.test(player) && /PlayerState\.IDLE/.test(player),
    message: 'Skill casts use a shared recovery path that returns the player to movement.',
  },
  {
    ok: /getPlayableSkills\(this\.mechaType, this\.currentLevel/.test(uiScene),
    message: 'UIScene displays learning-mode U/I/O skills at level 1.',
  },
  {
    ok: /updateSkillCooldowns\(/.test(uiScene) && /cooldownText/.test(uiScene) && /cooldownMask/.test(uiScene),
    message: 'UIScene has cooldown/MP display state for skill slots.',
  },
  {
    ok: /uiScene\.updateSkillCooldowns/.test(gameScene),
    message: 'GameScene feeds player cooldowns into the skill UI.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Skill system checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Skill system checks passed (${checks.length}/${checks.length}).`);
