import { readFileSync } from 'node:fs';

const player = readFileSync('src/entities/Player.ts', 'utf8');
const skillData = readFileSync('src/data/skillData.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const failures = [];

function expect(ok, message) {
  if (!ok) failures.push(message);
}

expect(
  pkg.scripts?.['check:animation-authenticity'] === 'node scripts/check-animation-authenticity.js',
  'package.json should expose check:animation-authenticity.'
);

expect(
  /TianjianAnimationProfile/.test(player) && /TIANJIAN_ANIMATION_PROFILES/.test(player),
  'Player should define Tianjian animation profiles instead of relying on one generic animation.'
);

for (const key of [
  'idle',
  'run',
  'jump',
  'fall',
  'basic1',
  'basic2',
  'basic3',
  'skillU',
  'skillI',
  'skillO',
  'hurt',
  'knockdown',
  'recover',
]) {
  expect(new RegExp(`${key}:\\s*\\{`).test(player), `Missing Tianjian animation profile: ${key}.`);
}

expect(
  /currentTianjianProfileKey/.test(player) && /applyTianjianAnimationProfile\s*\(/.test(player),
  'Player should drive Tianjian pose changes from explicit profile keys.'
);

expect(
  /createTianjianRigLayers\s*\(/.test(player)
    && /tianjianBodyLayer/.test(player)
    && /tianjianArmLayer/.test(player)
    && /tianjianSwordLayer/.test(player),
  'Tianjian should have body, arm, and sword layers for procedural fallback animation.'
);

expect(
  /updateTianjianRigLayers\s*\(/.test(player)
    && /armAngle/.test(player)
    && /swordAngle/.test(player)
    && /bodyOffsetY/.test(player),
  'Tianjian rig layers should change body/arm/sword pose over frames.'
);

expect(
  /createTianjianSlashLayer\s*\(/.test(player)
    && /createTianjianRunAfterimage\s*\(/.test(player)
    && /setDepth\(this\.depth \+/.test(player),
  'Slash layers and run afterimages should be independent world objects with their own depth.'
);

expect(
  /setCrop\(/.test(player) === false && /mask/.test(player) === false,
  'Animation authenticity should not rely on texture crop or masks that reintroduce rectangular clipping.'
);

expect(
  /finishSkillCast\(\)[\s\S]{0,360}recoverFromSkillToMovement\s*\(/.test(player),
  'Skill completion should explicitly recover back to movement.'
);

expect(
  /recoverFromHurtToMovement\s*\(/.test(player) && /recoverFromKnockdownToMovement\s*\(/.test(player),
  'Hurt and knockdown should have explicit movement recovery paths.'
);

expect(
  /id:\s*'tj_special_1'[\s\S]{0,520}animationKey:\s*'tj_sword_wave'/.test(skillData)
    && /id:\s*'tj_special_2'[\s\S]{0,520}animationKey:\s*'tj_whirlwind'/.test(skillData)
    && /id:\s*'tj_ultimate'[\s\S]{0,520}animationKey:\s*'tj_ultimate'/.test(skillData),
  'Tianjian U/I/O skill animation keys should remain mapped.'
);

if (failures.length > 0) {
  console.error('Animation authenticity checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Animation authenticity checks passed.');
