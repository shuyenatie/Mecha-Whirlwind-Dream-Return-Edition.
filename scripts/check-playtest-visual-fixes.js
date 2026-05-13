import fs from 'node:fs';

const files = {
  packageJson: 'package.json',
  gameScene: 'src/scenes/GameScene.ts',
  uiScene: 'src/scenes/UIScene.ts',
  characterSelect: 'src/scenes/CharacterSelectScene.ts',
  stageVisuals: 'src/data/stageVisualData.ts',
  player: 'src/entities/Player.ts',
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, 'utf8')])
);
const packageJson = JSON.parse(source.packageJson);

const checks = [
  {
    ok: packageJson.scripts?.['check:playtest-visual-fixes'] === 'node scripts/check-playtest-visual-fixes.js',
    message: 'package.json exposes check:playtest-visual-fixes.',
  },
  {
    ok: /check:playtest-fixes/.test(source.packageJson) && /check:playtest-visual-fixes/.test(packageJson.scripts?.['check:playtest-fixes'] || ''),
    message: 'check:playtest-fixes aggregates the visual playtest checks.',
  },
  {
    ok: /const VISUAL_DEPTHS/.test(source.gameScene)
      && /effect:\s*22/.test(source.gameScene)
      && /feedback:\s*72/.test(source.gameScene)
      && /warning:\s*19/.test(source.gameScene),
    message: 'GameScene centralizes visual depths so effects and feedback render above actors without blocking play.',
  },
  {
    ok: /createWorldSpaceFlashEffect\(/.test(source.gameScene)
      && /visual_fx_burst/.test(source.gameScene)
      && /Phaser\.BlendModes\.ADD/.test(source.gameScene),
    message: 'Hit flashes use independent additive world-space objects.',
  },
  {
    ok: /setDepth\(VISUAL_DEPTHS\.drop\)/.test(source.gameScene)
      && /setDepth\(VISUAL_DEPTHS\.feedback\)/.test(source.gameScene)
      && /setDepth\(VISUAL_DEPTHS\.warning\)/.test(source.gameScene),
    message: 'Drops, pickup labels, and boss warnings use the dedicated visual depth bands.',
  },
  {
    ok: /createForegroundEdgeAtmosphere\(/.test(source.gameScene)
      && /createForegroundScanlineSweep\(/.test(source.gameScene)
      && /foregroundKey/.test(source.stageVisuals),
    message: 'First-stage scene adds foreground mechanical edges, scanlines, and air perspective without new assets.',
  },
  {
    ok: /const SAFE_FIELD_BOUNDS/.test(source.uiScene)
      && /createEdgeAnchoredSkillBar\(/.test(source.uiScene)
      && /layoutForViewport\(/.test(source.uiScene)
      && /pickupFeedBaseY/.test(source.uiScene),
    message: 'HUD positions are edge-anchored and keep the fight lane clear on desktop and mobile.',
  },
  {
    ok: /createCleanPortraitMask\(/.test(source.characterSelect)
      && /createAngledPanelEdge\(/.test(source.characterSelect)
      && /previewPortrait\.setMask/.test(source.characterSelect),
    message: 'Character select masks the large portrait and uses crisp mechanical panel edges.',
  },
  {
    ok: /createWorldSpaceAfterimage\(/.test(source.player)
      && /visual_fx_trail/.test(source.player)
      && /setBlendMode\(Phaser\.BlendModes\.ADD\)/.test(source.player),
    message: 'Tianjian run afterimages are softened with separate world-space trail objects.',
  },
  {
    ok: !/strokeRect\([^)]*0xff00ff|debugDraw|debug frame|fillRect\(0,\s*0,\s*this\.currentStage\.width,\s*GAME_HEIGHT\)/i.test(
      source.gameScene + source.uiScene + source.characterSelect
    ),
    message: 'Playtest visual scenes avoid obvious debug boxes and full-screen flat color fills.',
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error('Playtest visual checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Playtest visual checks passed (${checks.length}/${checks.length}).`);
