import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { HubScene } from './scenes/HubScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { CharacterPanelScene } from './scenes/CharacterPanelScene';
import { InventoryScene } from './scenes/InventoryScene';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MainMenuScene, CharacterSelectScene, HubScene, GameScene, UIScene, CharacterPanelScene, InventoryScene],
  pixelArt: false,
  roundPixels: false,
};

const game = new Phaser.Game(config);

declare global {
  interface Window {
    __MECHA_STORM_GAME__?: Phaser.Game;
  }
}

window.__MECHA_STORM_GAME__ = game;

export { game, GAME_WIDTH, GAME_HEIGHT };
