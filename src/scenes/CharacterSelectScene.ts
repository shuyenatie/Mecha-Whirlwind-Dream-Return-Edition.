import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { MechaType, MECHA_DATABASE, MechaData } from '../data/mechaData';
import { MECHA_PORTRAIT_ASSETS } from '../data/visualAssetData';
import { createNewSave, saveGame } from '../data/playerData';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private mechaTypes: MechaType[] = [
    MechaType.TIAN_JIAN,
    MechaType.QIANG_PAO,
    MechaType.SHAN_YING,
    MechaType.LIAN_REN,
    MechaType.SHENG_QIANG,
    MechaType.HAN_XING,
  ];
  private mechaCards: Phaser.GameObjects.Container[] = [];
  private previewPortrait!: Phaser.GameObjects.Image;
  private previewSprite!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private classText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private advText!: Phaser.GameObjects.Text;
  private statBars: { bar: Phaser.GameObjects.Graphics; statKey: keyof MechaData['baseStats']; maxValue: number }[] = [];

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    this.createBackdrop();
    this.createHeader();
    this.createMechaCards();
    this.createDetailPanel();
    this.createSelectButton();
    this.updateSelection();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBackdrop(): void {
    if (this.textures.exists('visual_character_select_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'visual_character_select_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x071024, 0x111a36, 0x1b2845, 0x050510, 1);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    const shade = this.add.graphics();
    shade.fillStyle(0x000000, 0.18);
    shade.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    shade.lineStyle(1, 0x72e8ff, 0.18);
    for (let x = 0; x < GAME_WIDTH; x += 96) {
      shade.lineBetween(x, GAME_HEIGHT, x + 240, 468);
    }
  }

  private createHeader(): void {
    this.add.text(GAME_WIDTH / 2, 32, '选择你的机甲', {
      fontSize: '34px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#f5fbff',
      fontStyle: 'bold',
      stroke: '#145fd8',
      strokeThickness: 5,
      shadow: { color: '#60eaff', blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(5);

    this.add.text(GAME_WIDTH / 2, 66, '银河联盟 · 六大AI战士', {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd36c',
      stroke: '#06101d',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5);
  }

  private createMechaCards(): void {
    const cols = 2;
    const cardW = 214;
    const cardH = 132;
    const gapX = 18;
    const gapY = 16;
    const startX = 128;
    const startY = 136;

    for (let i = 0; i < this.mechaTypes.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const mechaData = MECHA_DATABASE[this.mechaTypes[i]];
      this.mechaCards.push(this.createMechaCard(x, y, mechaData, i));
    }
  }

  private createMechaCard(x: number, y: number, mechaData: MechaData, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(10);

    const frame = this.createCleanMechaCardFrame(mechaData.color, false);
    const glow = this.createCleanMechaCardFrame(mechaData.color, true);
    glow.setAlpha(0.55);
    container.add(frame);
    container.add(glow);

    const sprite = this.add.image(-66, 2, this.getMechaSpriteKey(mechaData.type)).setScale(1.2);
    sprite.setTint(mechaData.color);
    container.add(sprite);

    const name = this.add.text(-8, -28, mechaData.name, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#07101d',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
    container.add(name);

    const className = this.add.text(-8, 2, this.getMechaClassName(mechaData.mechaClass), {
      fontSize: '12px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(mechaData.color).rgba,
    }).setOrigin(0, 0.5);
    container.add(className);

    const hint = this.add.text(-8, 30, '点击查看机体参数', {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#7f9bb6',
    }).setOrigin(0, 0.5);
    container.add(hint);

    const hitArea = this.add.rectangle(0, 0, 214, 132, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', () => {
      this.selectedIndex = index;
      this.updateSelection();
    });
    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.035, scaleY: 1.035, duration: 100 });
    });
    hitArea.on('pointerout', () => {
      if (this.selectedIndex !== index) {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      }
    });

    container.setData('glow', glow);
    container.setData('mechaData', mechaData);
    return container;
  }

  private createDetailPanel(): void {
    this.createIntelPanelChrome(386, 214, 810, 430, 8);
    this.createTianjianShowcase(626, 390);
    const portraitMask = this.createCleanPortraitMask(626, 390, 264, 330);

    this.previewPortrait = this.add.image(626, 390, 'portrait_tianjian')
      .setDisplaySize(264, 330)
      .setDepth(9);
    this.previewPortrait.setMask(portraitMask);

    this.previewSprite = this.add.image(490, 560, 'mecha_tianjian').setScale(2.3).setDepth(11);

    this.nameText = this.add.text(802, 254, '', {
      fontSize: '34px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#07101d',
      strokeThickness: 5,
    }).setDepth(10);

    this.classText = this.add.text(806, 300, '', {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd36c',
      stroke: '#07101d',
      strokeThickness: 2,
    }).setDepth(10);

    this.descText = this.add.text(806, 334, '', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#c9e7ff',
      wordWrap: { width: 350 },
      lineSpacing: 5,
    }).setDepth(10);

    this.advText = this.add.text(806, 460, '', {
      fontSize: '12px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd36c',
      wordWrap: { width: 350 },
      lineSpacing: 4,
    }).setDepth(10);

    const statNames = ['生命', '攻击', '防御', '速度', '范围', '攻速'];
    const statKeys: (keyof MechaData['baseStats'])[] = ['hp', 'attack', 'defense', 'speed', 'attackRange', 'attackSpeed'];
    const statMaxValues = [1500, 120, 80, 400, 400, 2];

    for (let i = 0; i < statNames.length; i++) {
      const sy = 552 + i * 22;
      this.add.text(806, sy, statNames[i], {
        fontSize: '12px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#8db1cf',
      }).setDepth(10);

      const barBg = this.add.graphics().setDepth(10);
      barBg.fillStyle(0x10192b, 0.88);
      barBg.fillRoundedRect(856, sy + 3, 170, 10, 3);

      const bar = this.add.graphics().setDepth(11);
      this.statBars.push({ bar, statKey: statKeys[i], maxValue: statMaxValues[i] });
    }
  }

  private createSelectButton(): void {
    const btn = this.add.container(1040, 648).setDepth(20);
    btn.add(this.add.image(0, 0, 'visual_ui_button_hot').setDisplaySize(224, 58));
    btn.add(this.add.text(0, -1, '出击！', {
      fontSize: '23px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#07101d',
      strokeThickness: 4,
    }).setOrigin(0.5));

    const hitArea = this.add.rectangle(0, 0, 224, 58, 0x000000, 0).setInteractive({ useHandCursor: true });
    btn.add(hitArea);
    hitArea.on('pointerover', () => this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 100 }));
    hitArea.on('pointerout', () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 }));
    hitArea.on('pointerdown', () => {
      const selectedType = this.mechaTypes[this.selectedIndex];
      const initialSave = createNewSave(selectedType);
      saveGame(initialSave);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GameScene', { mechaType: selectedType, stageId: 'stage_1_1', saveData: initialSave });
      });
    });
  }

  private updateSelection(): void {
    const mechaData = MECHA_DATABASE[this.mechaTypes[this.selectedIndex]];

    for (let i = 0; i < this.mechaCards.length; i++) {
      const card = this.mechaCards[i];
      const glow = card.getData('glow') as Phaser.GameObjects.Graphics;
      const cardData = card.getData('mechaData') as MechaData;
      const selected = i === this.selectedIndex;

      glow.clear();
      this.drawCleanMechaCardFrame(glow, cardData.color, selected);
      glow.setAlpha(selected ? 1 : 0.45);
      this.tweens.add({
        targets: card,
        scaleX: selected ? 1.06 : 1,
        scaleY: selected ? 1.06 : 1,
        duration: 180,
        ease: selected ? 'Back.easeOut' : 'Sine.easeOut',
      });
    }

    const portrait = MECHA_PORTRAIT_ASSETS[mechaData.type];
    this.previewPortrait.setTexture(this.textures.exists(portrait.key) ? portrait.key : this.getMechaSpriteKey(mechaData.type));
    this.previewSprite.setTexture(this.getMechaSpriteKey(mechaData.type));
    this.previewSprite.setTint(mechaData.color);
    this.nameText.setText(mechaData.name);
    this.nameText.setColor(Phaser.Display.Color.IntegerToColor(mechaData.color).rgba);
    this.classText.setText(this.getMechaClassName(mechaData.mechaClass));
    this.descText.setText(mechaData.description);
    this.advText.setText('转职路线：' + mechaData.advancements.map((a) => `${a.name} → ${a.awakeningName}`).join(' / '));

    for (let i = 0; i < this.statBars.length; i++) {
      const statBar = this.statBars[i];
      const value = mechaData.baseStats[statBar.statKey];
      const ratio = Math.min(value / statBar.maxValue, 1);
      statBar.bar.clear();
      statBar.bar.fillStyle(mechaData.color, 0.95);
      statBar.bar.fillRoundedRect(856, 552 + i * 22 + 3, 170 * ratio, 10, 3);
      statBar.bar.fillStyle(0xffffff, 0.28);
      statBar.bar.fillRoundedRect(856, 552 + i * 22 + 3, 170 * ratio, 3, 2);
    }
  }

  private createCleanMechaCardFrame(color: number, selected: boolean): Phaser.GameObjects.Graphics {
    const frame = this.add.graphics();
    this.drawCleanMechaCardFrame(frame, color, selected);
    return frame;
  }

  private drawCleanMechaCardFrame(frame: Phaser.GameObjects.Graphics, color: number, selected: boolean): void {
    const accentAlpha = selected ? 0.95 : 0.52;
    frame.fillStyle(0x050b16, selected ? 0.94 : 0.84);
    frame.fillRect(-107, -66, 214, 132);
    frame.fillStyle(0x102033, selected ? 0.82 : 0.7);
    frame.fillRect(-101, -60, 202, 120);
    frame.fillStyle(color, selected ? 0.16 : 0.08);
    frame.fillRect(-95, -54, 190, 108);
    frame.lineStyle(selected ? 3 : 1, color, accentAlpha);
    frame.strokeRect(-106.5, -65.5, 213, 131);
    frame.lineStyle(1, 0xffffff, selected ? 0.26 : 0.12);
    frame.strokeRect(-99.5, -58.5, 199, 117);
    frame.fillStyle(color, selected ? 0.9 : 0.45);
    frame.fillRect(-98, -58, 42, 2);
    frame.fillRect(56, 56, 42, 2);
  }

  private createIntelPanelChrome(x: number, y: number, width: number, height: number, depth: number): void {
    const chrome = this.add.graphics().setDepth(depth);
    chrome.fillStyle(0x020711, 0.94);
    chrome.fillRect(x, y, width, height);
    chrome.fillStyle(0x0d1f34, 0.88);
    chrome.fillRect(x + 8, y + 8, width - 16, height - 16);
    chrome.lineStyle(2, 0x73e9ff, 0.46);
    chrome.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    chrome.lineStyle(1, 0xffffff, 0.16);
    chrome.strokeRect(x + 11.5, y + 11.5, width - 23, height - 23);
    chrome.fillStyle(0x73e9ff, 0.45);
    chrome.fillRect(x + 18, y + 18, 118, 2);
    chrome.fillRect(x + width - 136, y + height - 20, 118, 2);
    this.createAngledPanelEdge(x, y, width, height, depth + 2, 0x73e9ff);

    const scan = this.add.graphics().setDepth(depth + 1);
    scan.lineStyle(1, 0x9af7ff, 0.055);
    for (let sy = y + 18; sy < y + height - 18; sy += 5) {
      scan.lineBetween(x + 18, sy, x + width - 18, sy);
    }
  }

  private createTianjianShowcase(x: number, y: number): void {
    const podium = this.add.graphics().setDepth(8);
    podium.fillStyle(0x06101c, 0.78);
    podium.fillRect(x - 150, y - 184, 300, 368);
    podium.fillStyle(0x12263d, 0.72);
    podium.fillRect(x - 138, y - 172, 276, 344);
    podium.lineStyle(2, 0x8ff3ff, 0.44);
    podium.strokeRect(x - 150.5, y - 184.5, 300, 368);
    podium.lineStyle(1, 0xffffff, 0.18);
    podium.strokeRect(x - 138.5, y - 172.5, 276, 344);
    podium.fillStyle(0x8ff3ff, 0.18);
    podium.fillRect(x - 138, y + 128, 276, 38);
    this.createAngledPanelEdge(x - 150, y - 184, 300, 368, 10, 0x8ff3ff);
  }

  private createCleanPortraitMask(
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.Display.Masks.GeometryMask {
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(x - width / 2 + 10, y - height / 2 + 10, width - 20, height - 20);
    maskShape.setVisible(false);
    return maskShape.createGeometryMask();
  }

  private createAngledPanelEdge(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    accent: number
  ): void {
    const edge = this.add.graphics().setDepth(depth);
    edge.lineStyle(2, accent, 0.72);
    edge.lineBetween(x + 8, y, x + 54, y);
    edge.lineBetween(x, y + 8, x, y + 54);
    edge.lineBetween(x + width - 54, y + height, x + width - 8, y + height);
    edge.lineBetween(x + width, y + height - 54, x + width, y + height - 8);
    edge.lineStyle(1, 0xffffff, 0.22);
    edge.lineBetween(x + 18, y + 9, x + 74, y + 9);
    edge.lineBetween(x + width - 74, y + height - 9, x + width - 18, y + height - 9);
  }

  private getMechaSpriteKey(type: MechaType): string {
    const map: Record<MechaType, string> = {
      [MechaType.TIAN_JIAN]: 'mecha_tianjian',
      [MechaType.QIANG_PAO]: 'mecha_qiangpao',
      [MechaType.SHAN_YING]: 'mecha_shanying',
      [MechaType.LIAN_REN]: 'mecha_lianren',
      [MechaType.SHENG_QIANG]: 'mecha_shengqiang',
      [MechaType.HAN_XING]: 'mecha_hanxing',
    };
    return map[type];
  }

  private getMechaClassName(mechaClass: string): string {
    const map: Record<string, string> = {
      melee_balanced: '中距离控场型',
      ranged_firepower: '远距离战斗型',
      melee_burst: '近距离格斗型',
      high_speed: '高速攻击型',
      power_control: '力量控场型',
      ice_control: '冰冻控场型',
    };
    return map[mechaClass] || mechaClass;
  }
}
