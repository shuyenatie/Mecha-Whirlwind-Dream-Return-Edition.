import { readFileSync } from 'node:fs';

const source = readFileSync('src/scenes/GameScene.ts', 'utf8');
const failures = [];

if (/tileSprite\(0,\s*0,\s*GAME_WIDTH,\s*GAME_HEIGHT,\s*'proj_bullet'\)/.test(source)) {
  failures.push('GameScene should not tile proj_bullet across the stage background.');
}

if (/visual_stage_earth_mid/.test(source) || /visual_stage_earth_fore/.test(source)) {
  failures.push('GameScene should not use the placeholder earth mid/fore layers that create visible frame boxes.');
}

if (!/createAtmosphereOverlay\(this\.currentStageVisual\.atmosphere\)/.test(source)) {
  failures.push('GameScene should use createAtmosphereOverlay() for subtle scanlines instead of a tiled projectile texture.');
}

if (/this\.createFloatingPlatforms\(\)/.test(source)) {
  failures.push('GameScene should not generate floating platform steps over the reference stage art.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Stage background composition avoids tiled placeholder artifacts.');
