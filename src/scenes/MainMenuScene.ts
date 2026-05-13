import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { hasSave, loadGame } from '../data/playerData';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.createBackdrop();
    this.createTitleBlock(cx, cy);

    let btnY = cy + 72;
    if (hasSave()) {
      const saveData = loadGame();
      if (saveData) {
        this.createButton(cx, btnY, `继续游戏  Lv.${saveData.level}`, 'visual_ui_button_hot', () => {
          this.transitionTo('HubScene', { saveData });
        });
        btnY += 64;
      }
    }

    this.createButton(cx, btnY, '新游戏', 'visual_ui_button', () => {
      this.transitionTo('CharacterSelectScene');
    });
    this.createButton(cx, btnY + 64, '关于游戏', 'visual_ui_button', () => {
      this.showAboutDialog();
    });

    this.add.text(cx, GAME_HEIGHT - 30, 'v1.0.0 | 致敬经典 · 银河联盟永不熄灭', {
      fontSize: '12px',
      color: '#5f86ad',
      fontFamily: 'Microsoft YaHei, sans-serif',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createBackdrop(): void {
    if (this.textures.exists('visual_menu_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'visual_menu_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x030714, 0x071633, 0x101a3a, 0x050510, 1);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.34);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    vignette.lineStyle(2, 0x58d8ff, 0.18);
    vignette.strokeRect(18, 18, GAME_WIDTH - 36, GAME_HEIGHT - 36);

    this.add.particles(GAME_WIDTH * 0.28, GAME_HEIGHT * 0.58, 'proj_bullet', {
      speed: { min: 16, max: 52 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 },
      lifespan: 2600,
      frequency: 180,
      alpha: { start: 0.55, end: 0 },
      blendMode: 'ADD',
    }).setDepth(2);
  }

  private createTitleBlock(cx: number, cy: number): void {
    const titleGlow = this.add.text(cx, cy - 154, '机甲旋风', {
      fontSize: '82px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#8ff3ff',
      fontStyle: 'bold',
      stroke: '#08204a',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(5);

    const title = this.add.text(cx, cy - 158, '机甲旋风', {
      fontSize: '78px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#f5fbff',
      fontStyle: 'bold',
      stroke: '#2468e8',
      strokeThickness: 5,
      shadow: {
        color: '#53dfff',
        blur: 14,
        fill: true,
      },
    }).setOrigin(0.5).setDepth(6);

    this.add.text(cx, cy - 84, 'STORM RANGER', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Microsoft YaHei, sans-serif',
      color: '#9bdcff',
      letterSpacing: 8,
      stroke: '#07101d',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(cx, cy - 50, '银河联盟 · 机甲出击', {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffc766',
      stroke: '#07101d',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.tweens.add({
      targets: [title, titleGlow],
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    textureKey: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(10);
    const baseTexture = this.textures.exists(textureKey) ? textureKey : undefined;

    if (baseTexture) {
      container.add(this.add.image(0, 0, baseTexture).setDisplaySize(274, 58));
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(0x1e63ce, 0.9);
      bg.fillRoundedRect(-137, -29, 274, 58, 12);
      bg.lineStyle(2, 0x8af0ff, 0.7);
      bg.strokeRoundedRect(-137, -29, 274, 58, 12);
      container.add(bg);
    }

    const label = this.add.text(0, -1, text, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#07101d',
      strokeThickness: 4,
    }).setOrigin(0.5);
    container.add(label);

    const hitArea = this.add.rectangle(0, 0, 274, 58, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 });
      label.setColor('#fff2a6');
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      label.setColor('#ffffff');
    });
    hitArea.on('pointerdown', callback);

    return container;
  }

  private transitionTo(sceneKey: string, data?: object): void {
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.time.delayedCall(450, () => {
      this.scene.start(sceneKey, data);
    });
  }

  private showAboutDialog(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setInteractive()
      .setDepth(100);

    const panel = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'visual_ui_panel')
      .setDisplaySize(560, 390)
      .setDepth(101);

    const lines = [
      { text: '关于机甲旋风', y: -145, size: '26px', color: '#8ff3ff', bold: true },
      { text: '2059年，AI战士与机甲武装成为银河防线的核心。', y: -88, size: '15px', color: '#c8e9ff' },
      { text: '你将加入银河联盟，在黑洞帝国的攻势中夺回前线。', y: -60, size: '15px', color: '#c8e9ff' },
      { text: '操作说明', y: -12, size: '19px', color: '#ffd36c', bold: true },
      { text: '方向键/WASD：移动    J/空格：攻击/交互    K：跳跃', y: 24, size: '14px', color: '#9bc3df' },
      { text: 'U/I/O：技能快捷键    L：防御    ESC：暂停/返回', y: 50, size: '14px', color: '#9bc3df' },
      { text: '六大职业：天剑 · 枪炮 · 闪影 · 链刃 · 圣枪 · 寒星', y: 94, size: '14px', color: '#ffd36c' },
      { text: '致敬经典 · 银河联盟永不熄灭', y: 126, size: '14px', color: '#6f91ad' },
    ];

    const texts = lines.map((line) => this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + line.y, line.text, {
      fontSize: line.size,
      color: line.color,
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontStyle: line.bold ? 'bold' : 'normal',
      stroke: '#04101d',
      strokeThickness: line.bold ? 3 : 2,
    }).setOrigin(0.5).setDepth(102));

    const closeBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 166, '关闭', 'visual_ui_button', () => closeAll());
    closeBtn.setDepth(103).setScale(0.72);

    const closeAll = () => {
      overlay.destroy();
      panel.destroy();
      texts.forEach((t) => t.destroy());
      closeBtn.destroy();
    };

    overlay.on('pointerdown', closeAll);
  }
}
