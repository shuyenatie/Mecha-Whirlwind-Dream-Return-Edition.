import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectDir = process.cwd();
const sheetPath = join(projectDir, 'public/assets/sprites/mecha/tianjian/spritesheet.png');
const animPath = join(projectDir, 'public/assets/sprites/mecha/tianjian/animations.json');
const sourcePoseSheetPath = join(projectDir, 'public/assets/sprites/mecha/tianjian/generated_pose_sheet_source.png');
const preloadSource = readFileSync(join(projectDir, 'src/scenes/PreloadScene.ts'), 'utf8');
const playerSource = readFileSync(join(projectDir, 'src/entities/Player.ts'), 'utf8');
const builderSource = readFileSync(join(projectDir, 'tools/build_tianjian_animation.ps1'), 'utf8');
const importSource = readFileSync(join(projectDir, 'tools/import_ai_tianjian_frames.ps1'), 'utf8');

function readPngSize(path) {
  const buffer = readFileSync(path);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${path} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const failures = [];
if (!existsSync(sheetPath)) {
  failures.push('missing public/assets/sprites/mecha/tianjian/spritesheet.png');
} else {
  const { width, height } = readPngSize(sheetPath);
  if (width !== 2520 || height !== 840) {
    failures.push(`tianjian spritesheet should be 2520x840 padded against frame clipping, got ${width}x${height}`);
  }

}

if (!existsSync(animPath)) {
  failures.push('missing public/assets/sprites/mecha/tianjian/animations.json');
} else {
  const animData = JSON.parse(readFileSync(animPath, 'utf8').replace(/^\uFEFF/, ''));
  const keys = new Set((animData.animations || []).map((anim) => anim.key));
  for (const key of ['mecha_tianjian_idle', 'mecha_tianjian_run', 'mecha_tianjian_attack', 'mecha_tianjian_jump', 'mecha_tianjian_hurt']) {
    if (!keys.has(key)) failures.push(`missing animation ${key}`);
  }
}

if (!existsSync(sourcePoseSheetPath)) {
  failures.push('missing generated pose sheet source copy');
}

if (!/frameWidth:\s*mecha\.frameWidth/.test(preloadSource) || !/frameHeight:\s*mecha\.frameHeight/.test(preloadSource)) {
  failures.push('PreloadScene must load per-mecha frame sizes');
}

if (!/\{ key: 'tianjian', name: '[^']+', frameWidth: 420, frameHeight: 420 \}/.test(preloadSource)) {
  failures.push('PreloadScene should load Tianjian with 420x420 padded frames');
}

if (!/setScale\(0\.62\)/.test(playerSource) || /setTexture\('portrait_tianjian'\)/.test(playerSource)) {
  failures.push('Player should use the tianjian spritesheet at playable scale, not the portrait texture');
}

if (!/Draw-LayeredAttackFrame/.test(builderSource) || !/New-WeaponMaskPath/.test(builderSource)) {
  failures.push('Fallback Tianjian builder should support layered sword-arm frames');
}

if (!/Remove-Magenta/.test(importSource) || !/despillR/.test(importSource)) {
  failures.push('Generated Tianjian importer should remove magenta background and despill edges');
}

if (!/\$frameW = 420/.test(importSource) || !/\$frameH = 420/.test(importSource)) {
  failures.push('Generated Tianjian importer should output 420x420 frames to avoid clipping weapon poses');
}

if (failures.length > 0) {
  console.error('Tianjian animation checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tianjian animation OK.');
