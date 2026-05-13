import fs from 'node:fs';

const files = {
  packageJson: 'package.json',
  stageVisuals: 'src/data/stageVisualData.ts',
  gameScene: 'src/scenes/GameScene.ts',
  uiScene: 'src/scenes/UIScene.ts',
  characterSelect: 'src/scenes/CharacterSelectScene.ts',
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, 'utf8')])
);
const packageJson = JSON.parse(source.packageJson);

const checks = [
  {
    ok: packageJson.scripts?.['check:visual-authenticity'] === 'node scripts/check-visual-authenticity.js',
    message: 'package.json exposes check:visual-authenticity.',
  },
  {
    ok: /layerKeys/.test(source.stageVisuals)
      && /foregroundKey/.test(source.stageVisuals)
      && /visual_stage_earth_sky/.test(source.stageVisuals)
      && /visual_stage_earth_fore/.test(source.stageVisuals),
    message: 'Stage visual data maps layered first-stage backdrops and foreground keys.',
  },
  {
    ok: /createLayeredStageBackdrop\(/.test(source.gameScene)
      && /createMechanicalForeground\(/.test(source.gameScene)
      && /createAirPerspectiveFog\(/.test(source.gameScene),
    message: 'GameScene builds layered stage backdrop, mechanical foreground, and air perspective.',
  },
  {
    ok: /scroll:\s*0\.18/.test(source.gameScene)
      && /scroll:\s*0\.42/.test(source.gameScene)
      && /scroll:\s*0\.72/.test(source.gameScene)
      && /setScrollFactor\(settings\.scroll\)/.test(source.gameScene),
    message: 'Stage layers use distinct parallax scroll factors.',
  },
  {
    ok: /createMechanicalHudFrame\(/.test(source.uiScene)
      && /createScanningLines\(/.test(source.uiScene)
      && /drawSegmentedBar\(/.test(source.uiScene),
    message: 'UIScene uses metal HUD frames, scan lines, and segmented bars.',
  },
  {
    ok: /SAFE_FIELD_BOUNDS/.test(source.uiScene)
      && /createEdgeAnchoredSkillBar\(/.test(source.uiScene)
      && /layoutForViewport\(/.test(source.uiScene),
    message: 'HUD keeps skill bar and objective panel tucked away from the fight lane.',
  },
  {
    ok: /createTianjianShowcase\(/.test(source.characterSelect)
      && /createCleanMechaCardFrame\(/.test(source.characterSelect)
      && /createIntelPanelChrome\(/.test(source.characterSelect),
    message: 'Character select uses Tianjian showcase, clean card edges, and intel-panel chrome.',
  },
  {
    ok: /showFlashPanelNotice\(/.test(source.gameScene)
      && /createFlashPopupFrame\(/.test(source.gameScene)
      && /showBossEntrancePanel\(/.test(source.gameScene),
    message: 'Boss, clear, and pickup notices use Flash-style popup panels.',
  },
  {
    ok: !/strokeRect\([^)]*0xff00ff|debugDraw|DEBUG|debug frame/i.test(source.gameScene + source.uiScene + source.characterSelect),
    message: 'No obvious debug frame drawing remains in visual scenes.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Visual authenticity checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Visual authenticity checks passed (${checks.length}/${checks.length}).`);
