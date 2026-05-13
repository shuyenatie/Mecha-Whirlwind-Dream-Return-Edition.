import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const FFDEC_PATH = process.env.FFDEC_PATH || 'ffdec';
const SWF_INPUT = process.env.SWF_INPUT || '';
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets');

const SPRITE_DIRS = [
  'sprites/mecha/tianjian',
  'sprites/mecha/qiangpao',
  'sprites/mecha/shanying',
  'sprites/mecha/lianren',
  'sprites/mecha/shengqiang',
  'sprites/mecha/hanxing',
  'sprites/enemies',
  'sprites/bosses',
  'sprites/pets',
  'sprites/npcs',
  'effects',
  'ui',
  'backgrounds',
  'audio/bgm',
  'audio/sfx',
];

function ensureDirs(): void {
  for (const dir of SPRITE_DIRS) {
    const fullPath = path.join(OUTPUT_DIR, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  }
  console.log('Created asset directories');
}

function extractSwf(swfPath: string): void {
  if (!fs.existsSync(swfPath)) {
    console.error(`SWF file not found: ${swfPath}`);
    console.log('Please place the SWF file and set SWF_INPUT environment variable');
    return;
  }

  const tmpDir = path.join(OUTPUT_DIR, '_raw');
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`Extracting SWF: ${swfPath}`);

  try {
    execSync(
      `${FFDEC_PATH} -export script "${tmpDir}" "${swfPath}"`,
      { stdio: 'inherit', timeout: 300000 }
    );

    execSync(
      `${FFDEC_PATH} -export image "${tmpDir}/images" "${swfPath}"`,
      { stdio: 'inherit', timeout: 300000 }
    );

    execSync(
      `${FFDEC_PATH} -export sound "${tmpDir}/sounds" "${swfPath}"`,
      { stdio: 'inherit', timeout: 300000 }
    );

    execSync(
      `${FFDEC_PATH} -export sprite "${tmpDir}/sprites" "${swfPath}"`,
      { stdio: 'inherit', timeout: 300000 }
    );

    console.log('Extraction complete!');
    organizeAssets(tmpDir);
  } catch (e) {
    console.error('Extraction failed. Make sure JPEXS FFDec is installed and in PATH.');
    console.error('Download from: https://github.com/jindrapetrik/jpexs-decompiler/releases');
    console.error('Or set FFDEC_PATH to the full path of ffdec.bat/ffdec.sh');
  }
}

function organizeAssets(rawDir: string): void {
  console.log('Organizing extracted assets...');

  if (!fs.existsSync(rawDir)) {
    console.log('No raw assets to organize');
    return;
  }

  const imagesDir = path.join(rawDir, 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir, { recursive: true }) as string[];
    for (const file of files) {
      const src = path.join(imagesDir, file);
      if (!fs.statSync(src).isFile()) continue;

      const lowerName = file.toLowerCase();

      if (lowerName.includes('tianjian') || lowerName.includes('tian_jian') || lowerName.includes('sword')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/tianjian'));
      } else if (lowerName.includes('qiangpao') || lowerName.includes('qiang_pao') || lowerName.includes('gun') || lowerName.includes('cannon')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/qiangpao'));
      } else if (lowerName.includes('shanying') || lowerName.includes('shan_ying') || lowerName.includes('shadow') || lowerName.includes('flash')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/shanying'));
      } else if (lowerName.includes('lianren') || lowerName.includes('lian_ren') || lowerName.includes('chain')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/lianren'));
      } else if (lowerName.includes('shengqiang') || lowerName.includes('sheng_qiang') || lowerName.includes('holy') || lowerName.includes('spear')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/shengqiang'));
      } else if (lowerName.includes('hanxing') || lowerName.includes('han_xing') || lowerName.includes('ice') || lowerName.includes('frost')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/mecha/hanxing'));
      } else if (lowerName.includes('boss') || lowerName.includes('king') || lowerName.includes('emperor')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/bosses'));
      } else if (lowerName.includes('enemy') || lowerName.includes('monster') || lowerName.includes('mob')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/enemies'));
      } else if (lowerName.includes('bg') || lowerName.includes('background') || lowerName.includes('scene')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'backgrounds'));
      } else if (lowerName.includes('ui') || lowerName.includes('button') || lowerName.includes('panel')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'ui'));
      } else if (lowerName.includes('effect') || lowerName.includes('fx') || lowerName.includes('skill')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'effects'));
      } else if (lowerName.includes('pet') || lowerName.includes('companion')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/pets'));
      } else if (lowerName.includes('npc') || lowerName.includes('shop') || lowerName.includes('merchant')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'sprites/npcs'));
      }
    }
  }

  const soundsDir = path.join(rawDir, 'sounds');
  if (fs.existsSync(soundsDir)) {
    const files = fs.readdirSync(soundsDir, { recursive: true }) as string[];
    for (const file of files) {
      const src = path.join(soundsDir, file);
      if (!fs.statSync(src).isFile()) continue;

      const lowerName = file.toLowerCase();
      if (lowerName.includes('bgm') || lowerName.includes('music') || lowerName.includes('theme')) {
        copyToDir(src, path.join(OUTPUT_DIR, 'audio/bgm'));
      } else {
        copyToDir(src, path.join(OUTPUT_DIR, 'audio/sfx'));
      }
    }
  }

  console.log('Asset organization complete!');
}

function copyToDir(src: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, path.basename(src));
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

const command = process.argv[2];

if (!command || command === 'setup') {
  ensureDirs();
  console.log('\nAsset directory structure created at: ' + OUTPUT_DIR);
  console.log('\nNext steps:');
  console.log('1. Install JPEXS FFDec: https://github.com/jindrapetrik/jpexs-decompiler/releases');
  console.log('2. Get the SWF file for 机甲旋风');
  console.log('3. Run: npx ts-node scripts/extract-assets.ts extract <path-to-swf>');
} else if (command === 'extract') {
  const swfPath = process.argv[3] || SWF_INPUT;
  if (!swfPath) {
    console.error('Usage: npx ts-node scripts/extract-assets.ts extract <path-to-swf>');
    process.exit(1);
  }
  ensureDirs();
  extractSwf(swfPath);
} else if (command === 'organize') {
  const rawDir = process.argv[3] || path.join(OUTPUT_DIR, '_raw');
  organizeAssets(rawDir);
}
