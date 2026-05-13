import { existsSync } from 'node:fs';
import { join } from 'node:path';

const assetPaths = [
  'assets/backgrounds/menu.png',
  'assets/backgrounds/character_select.png',
  'assets/backgrounds/stage_earth_layer_sky.png',
  'assets/backgrounds/stage_earth_layer_mid.png',
  'assets/backgrounds/stage_earth_layer_fore.png',
  'assets/backgrounds/stage_earth_ground.png',
  'assets/portraits/mecha/tianjian.png',
  'assets/sprites/mecha/tianjian/spritesheet.png',
  'assets/sprites/mecha/tianjian/animations.json',
  'assets/portraits/mecha/qiangpao.png',
  'assets/portraits/mecha/shanying.png',
  'assets/portraits/mecha/lianren.png',
  'assets/portraits/mecha/shengqiang.png',
  'assets/portraits/mecha/hanxing.png',
  'assets/effects/slash_arc.png',
  'assets/effects/energy_burst.png',
  'assets/effects/speed_trail.png',
  'assets/ui/panel_metal.png',
  'assets/ui/button_blue.png',
  'assets/ui/button_gold.png',
  'assets/ui/card_frame.png',
];

const publicDir = join(process.cwd(), 'public');
const missing = assetPaths.filter((assetPath) => !existsSync(join(publicDir, assetPath)));

if (missing.length > 0) {
  console.error('Missing visual remake assets:');
  for (const assetPath of missing) {
    console.error(`- public/${assetPath}`);
  }
  process.exit(1);
}

console.log(`Visual remake assets OK (${assetPaths.length} files).`);
