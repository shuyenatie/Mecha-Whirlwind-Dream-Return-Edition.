import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { MechaType, MECHA_DATABASE } from '../data/mechaData';
import { STAGE_DATABASE, StageData } from '../data/stageData';
import { PlayerSaveData, hasSave, loadGame, createNewSave, normalizeSaveData, saveGame } from '../data/playerData';
import { EquipSlot, EquipData, EQUIP_DATABASE, RARITY_NAMES, RARITY_LEVEL } from '../data/equipData';

interface NPCData {
  key: string;
  name: string;
  x: number;
  y: number;
  dialog: string[];
  action: string;
}

export class HubScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Sprite;
  private saveData!: PlayerSaveData;
  private npcs: NPCData[] = [];
  private npcSprites: Phaser.GameObjects.Sprite[] = [];
  private dialogBox: Phaser.GameObjects.Container | null = null;
  private currentDialogIndex: number = 0;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private nearNpc: NPCData | null = null;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'HubScene' });
  }

  init(data: { mechaType?: MechaType; saveData?: PlayerSaveData }): void {
    if (data.saveData) {
      this.saveData = normalizeSaveData(data.saveData);
    } else if (data.mechaType) {
      const loadedSave = loadGame();
      this.saveData = loadedSave?.mechaType === data.mechaType
        ? normalizeSaveData(loadedSave)
        : createNewSave(data.mechaType);
    } else if (hasSave()) {
      this.saveData = normalizeSaveData(loadGame());
    } else {
      this.saveData = createNewSave(MechaType.TIAN_JIAN);
    }
  }

  create(): void {
    this.createBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createNPCs();
    this.createUI();
    this.setupInput();
    this.setupCollisions();
  }

  private createBackground(): void {
    if (this.textures.exists('bg_hub')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_hub').setScrollFactor(0);
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(0x0a0a2a);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.fillStyle(0x1a1a4a, 0.3);
      bg.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
      for (let i = 0; i < 60; i++) {
        bg.fillStyle(0x4488ff, Phaser.Math.FloatBetween(0.1, 0.5));
        bg.fillCircle(
          Phaser.Math.Between(0, GAME_WIDTH),
          Phaser.Math.Between(0, GAME_HEIGHT * 0.6),
          Phaser.Math.FloatBetween(0.5, 2)
        );
      }
    }

    this.add.text(GAME_WIDTH / 2, 30, '银河联盟基地', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#4488ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    const groundGfx = this.add.graphics();
    groundGfx.fillStyle(0x334466);
    groundGfx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    groundGfx.fillStyle(0x4466aa, 0.5);
    groundGfx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 3);
    groundGfx.setDepth(1);

    const ground = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH, 40, 0x000000, 0);
    this.platforms.add(ground);

    const platPositions = [
      { x: 200, y: GAME_HEIGHT - 200, w: 200 },
      { x: 500, y: GAME_HEIGHT - 250, w: 150 },
      { x: 800, y: GAME_HEIGHT - 200, w: 200 },
      { x: 1050, y: GAME_HEIGHT - 250, w: 150 },
    ];

    for (const pos of platPositions) {
      const platGfx = this.add.graphics();
      platGfx.fillStyle(0x334466, 0.8);
      platGfx.fillRoundedRect(pos.x, pos.y, pos.w, 16, 4);
      platGfx.fillStyle(0x4466aa, 0.5);
      platGfx.fillRoundedRect(pos.x + 2, pos.y, pos.w - 4, 4, 2);
      platGfx.setDepth(1);

      const plat = this.add.rectangle(pos.x + pos.w / 2, pos.y + 8, pos.w, 16, 0x000000, 0);
      this.platforms.add(plat);
    }
  }

  private createPlayer(): void {
    const mechaData = MECHA_DATABASE[this.saveData.mechaType];
    const spriteKey = `mecha_${this.saveData.mechaType}`;

    this.playerSprite = this.physics.add.sprite(200, GAME_HEIGHT - 100, spriteKey);
    this.playerSprite.setDepth(10);
    (this.playerSprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.playerSprite.setScale(1.2);

    this.physics.add.collider(this.playerSprite, this.platforms);

    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 50);
  }

  private createNPCs(): void {
    this.npcs = [
      {
        key: 'npc_tianlang',
        name: '天狼',
        x: 350,
        y: GAME_HEIGHT - 80,
        dialog: [
          '欢迎回来，战士！银河联盟需要你的力量。',
          '黑洞帝国的威胁日益增大，我们必须做好准备。',
          '去任务中心看看有什么任务吧！',
        ],
        action: 'missions',
      },
      {
        key: 'npc_shop',
        name: '军需官',
        x: 600,
        y: GAME_HEIGHT - 80,
        dialog: [
          '需要装备吗？我这里有最好的机甲装备！',
          '用战斗获得的金币来购买吧。',
        ],
        action: 'shop',
      },
      {
        key: 'npc_mission',
        name: '任务官',
        x: 850,
        y: GAME_HEIGHT - 80,
        dialog: [
          '有新的任务等着你！',
          '选择你要前往的战场吧。',
        ],
        action: 'stage_select',
      },
      {
        key: 'npc_baolong',
        name: '暴龙',
        x: 1100,
        y: GAME_HEIGHT - 80,
        dialog: [
          '想切磋一下吗？来竞技场吧！',
          '我会让你见识真正的力量！',
        ],
        action: 'arena',
      },
    ];

    for (const npc of this.npcs) {
      const spriteKey = npc.key;
      const sprite = this.physics.add.sprite(npc.x, npc.y, spriteKey);
      sprite.setDepth(5);
      sprite.setScale(1.2);
      this.physics.add.collider(sprite, this.platforms);

      const nameBg = this.add.graphics();
      nameBg.fillStyle(0x0a0a2a, 0.7);
      nameBg.fillRoundedRect(npc.x - 30, npc.y - 70, 60, 18, 4);
      nameBg.setDepth(15);

      this.add.text(npc.x, npc.y - 62, npc.name, {
        fontSize: '11px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ffdd44',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(16);

      this.npcSprites.push(sprite);
    }
  }

  private createUI(): void {
    const mechaData = MECHA_DATABASE[this.saveData.mechaType];

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2a, 0.85);
    panel.fillRoundedRect(10, 60, 250, 100, 8);
    panel.lineStyle(1, 0x4488ff, 0.3);
    panel.strokeRoundedRect(10, 60, 250, 100, 8);
    panel.setScrollFactor(0).setDepth(40);

    this.add.text(20, 68, `${mechaData.name} Lv.${this.saveData.level}`, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(mechaData.color).rgba,
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(41);

    if (this.saveData.advancementName) {
      this.add.text(20, 88, `转职: ${this.saveData.advancementName}`, {
        fontSize: '11px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ffaa44',
      }).setScrollFactor(0).setDepth(41);
    }

    if (this.saveData.isAwakened) {
      this.add.text(20, 102, `觉醒: ${this.saveData.awakeningName}`, {
        fontSize: '11px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ff44ff',
      }).setScrollFactor(0).setDepth(41);
    }

    this.add.text(20, 120, `金币: ${this.saveData.gold}`, {
      fontSize: '12px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffdd44',
    }).setScrollFactor(0).setDepth(41);

    this.add.text(20, 138, `已通关: ${this.saveData.completedStages.length}关`, {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#88aacc',
    }).setScrollFactor(0).setDepth(41);

    const charBtn = this.add.text(GAME_WIDTH - 180, 68, '[角色 C]', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#88aaff',
    }).setScrollFactor(0).setDepth(41).setInteractive();

    charBtn.on('pointerdown', () => {
      this.openCharacterPanel();
    });
    charBtn.on('pointerover', () => charBtn.setColor('#aaccff'));
    charBtn.on('pointerout', () => charBtn.setColor('#88aaff'));

    const invBtn = this.add.text(GAME_WIDTH - 180, 92, '[背包 I]', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#44aa88',
    }).setScrollFactor(0).setDepth(41).setInteractive();

    invBtn.on('pointerdown', () => {
      this.openInventory();
    });
    invBtn.on('pointerover', () => invBtn.setColor('#66ddaa'));
    invBtn.on('pointerout', () => invBtn.setColor('#44aa88'));

    const equipCount = Object.values(this.saveData.equips).filter((e) => e !== null).length;
    this.add.text(GAME_WIDTH - 180, 116, `已装备: ${equipCount}/6`, {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#6688aa',
    }).setScrollFactor(0).setDepth(41);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, '方向键移动  |  靠近NPC按 J/空格 交互  |  ESC 返回主菜单', {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#445566',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.interactKey.on('down', () => this.interact());
    spaceKey.on('down', () => this.interact());
    escKey.on('down', () => {
      if (this.dialogBox) {
        this.closeDialog();
      } else {
        this.scene.start('MainMenuScene');
      }
    });

    this.input.keyboard.addKey('C').on('down', () => this.openCharacterPanel());
    this.input.keyboard.addKey('I').on('down', () => this.openInventory());
  }

  private setupCollisions(): void {
    // NPC proximity detection handled in update
  }

  update(): void {
    if (!this.input.keyboard) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = {
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    };

    if (this.dialogBox) return;

    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    let moveX = 0;

    if (cursors.left.isDown || wasd.A.isDown) {
      moveX = -1;
    } else if (cursors.right.isDown || wasd.D.isDown) {
      moveX = 1;
    }

    body.setVelocityX(moveX * 250);
    this.playerSprite.setFlipX(moveX < 0);

    if ((cursors.up.isDown || wasd.W.isDown) && body.onFloor()) {
      body.setVelocityY(-500);
    }

    this.checkNpcProximity();
  }

  private checkNpcProximity(): void {
    this.nearNpc = null;

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const sprite = this.npcSprites[i];
      if (!sprite.active) continue;

      const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, sprite.x, sprite.y);
      if (dist < 80) {
        this.nearNpc = npc;
        break;
      }
    }
  }

  private interact(): void {
    if (this.dialogBox) {
      this.advanceDialog();
      return;
    }

    if (!this.nearNpc) return;

    this.currentDialogIndex = 0;
    this.showDialog(this.nearNpc.name, this.nearNpc.dialog[this.currentDialogIndex]);
  }

  private showDialog(name: string, text: string): void {
    if (this.dialogBox) this.closeDialog();

    this.dialogBox = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 120);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a2a, 0.95);
    bg.fillRoundedRect(-350, -50, 700, 100, 10);
    bg.lineStyle(2, 0x4488ff, 0.5);
    bg.strokeRoundedRect(-350, -50, 700, 100, 10);
    this.dialogBox.add(bg);

    const nameText = this.add.text(-330, -40, name, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffdd44',
      fontStyle: 'bold',
    });
    this.dialogBox.add(nameText);

    const contentText = this.add.text(-330, -15, text, {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      wordWrap: { width: 640 },
    });
    this.dialogBox.add(contentText);

    const hint = this.add.text(320, 35, 'J/空格 继续', {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#667788',
    }).setOrigin(1);
    this.dialogBox.add(hint);

    this.dialogBox.setDepth(100);
    this.dialogBox.setData('contentText', contentText);
  }

  private advanceDialog(): void {
    if (!this.nearNpc || !this.dialogBox) return;

    this.currentDialogIndex++;

    if (this.currentDialogIndex >= this.nearNpc.dialog.length) {
      this.closeDialog();
      this.executeNpcAction(this.nearNpc.action);
      return;
    }

    const contentText = this.dialogBox.getData('contentText') as Phaser.GameObjects.Text;
    contentText.setText(this.nearNpc.dialog[this.currentDialogIndex]);
  }

  private closeDialog(): void {
    if (this.dialogBox) {
      this.dialogBox.destroy();
      this.dialogBox = null;
    }
  }

  private executeNpcAction(action: string): void {
    switch (action) {
      case 'stage_select':
      case 'missions':
        this.showStageSelect();
        break;
      case 'shop':
        this.showShopDialog();
        break;
      case 'arena':
        this.showArenaDialog();
        break;
    }
  }

  private showStageSelect(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(90);

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2a, 0.95);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 300, 50, 600, 550, 10);
    panel.lineStyle(2, 0x4488ff, 0.5);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 300, 50, 600, 550, 10);
    panel.setDepth(91);

    const title = this.add.text(GAME_WIDTH / 2, 80, '选择关卡', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#4488ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(92);

    const stageElements: Phaser.GameObjects.GameObject[] = [];
    const rowHeight = 38;
    const rowTop = 112;

    const closeStageSelect = () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      stageElements.forEach((element) => element.destroy());
      closeBtn.destroy();
    };

    for (let i = 0; i < STAGE_DATABASE.length; i++) {
      const stage = STAGE_DATABASE[i];
      const isCompleted = this.saveData.completedStages.includes(stage.id);
      const isLocked = !this.isStageUnlocked(stage);

      const y = rowTop + i * rowHeight;
      const color = isLocked ? '#444444' : isCompleted ? '#44ff88' : '#ffffff';
      const bgColor = isLocked ? 0x111122 : isCompleted ? 0x0a2a1a : 0x0a0a3a;

      const stageBg = this.add.graphics();
      stageBg.fillStyle(bgColor, 0.8);
      stageBg.fillRoundedRect(GAME_WIDTH / 2 - 260, y, 520, 34, 6);
      stageBg.lineStyle(1, isLocked ? 0x222233 : 0x4488ff, 0.3);
      stageBg.strokeRoundedRect(GAME_WIDTH / 2 - 260, y, 520, 34, 6);
      stageBg.setDepth(91);

      const stageName = this.add.text(GAME_WIDTH / 2 - 240, y + 5, stage.name, {
        fontSize: '13px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color,
        fontStyle: 'bold',
      }).setDepth(92);

      const stageDesc = this.add.text(GAME_WIDTH / 2 - 240, y + 21, `${stage.description.substring(0, 32)}...  Lv.${stage.level}`, {
        fontSize: '10px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: isLocked ? '#333333' : '#88aacc',
      }).setDepth(92);

      const statusText = isLocked ? '未解锁' : isCompleted ? '已通关' : '可挑战';
      const status = this.add.text(GAME_WIDTH / 2 + 230, y + 10, statusText, {
        fontSize: '11px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: isLocked ? '#444444' : isCompleted ? '#44ff88' : '#ffaa44',
      }).setOrigin(1).setDepth(92);

      stageElements.push(stageBg, stageName, stageDesc, status);

      if (!isLocked) {
        const hitArea = this.add.rectangle(GAME_WIDTH / 2, y + 17, 520, 34, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true }).setDepth(93);
        stageElements.push(hitArea);

        hitArea.on('pointerdown', () => {
          closeStageSelect();

          this.scene.start('GameScene', {
            mechaType: this.saveData.mechaType,
            stageId: stage.id,
            saveData: this.saveData,
          });
        });
      } else {
        const lockedHitArea = this.add.rectangle(GAME_WIDTH / 2, y + 17, 520, 34, 0x000000, 0);
        lockedHitArea.setInteractive({ useHandCursor: true }).setDepth(93);
        lockedHitArea.on('pointerdown', () => this.showLockedStageNotice(stage.name));
        stageElements.push(lockedHitArea);
      }
    }

    const closeBtn = this.add.text(GAME_WIDTH / 2, 570, '[ 关闭 ]', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff6644',
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', closeStageSelect);
  }

  private isStageUnlocked(stage: StageData): boolean {
    if (stage.id === STAGE_DATABASE[0]?.id) return true;
    if (this.saveData.completedStages.includes(stage.id)) return true;
    return STAGE_DATABASE.some((candidate) => (
      candidate.nextStageId === stage.id && this.saveData.completedStages.includes(candidate.id)
    ));
  }

  private showLockedStageNotice(stageName: string): void {
    const notice = this.add.text(GAME_WIDTH / 2, 535, `${stageName} 未解锁`, {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff6644',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: notice,
      y: notice.y - 24,
      alpha: 0,
      duration: 900,
      onComplete: () => notice.destroy(),
    });
  }

  private openCharacterPanel(): void {
    if (this.dialogBox) return;

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(90).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2e, 0.95);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 350, 40, 700, 540, 10);
    panel.lineStyle(2, 0x4488ff, 0.5);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 350, 40, 700, 540, 10);
    panel.setDepth(91);

    this.add.text(GAME_WIDTH / 2, 65, '角色属性', {
      fontSize: '24px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#4488ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(92);

    const mechaData = MECHA_DATABASE[this.saveData.mechaType];
    const mechaColor = mechaData.color;

    this.add.text(80, 90, `基础属性 (${mechaData.name} Lv.${this.saveData.level})`, {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#88aaff',
    }).setDepth(92);

    const stats = this.saveData.stats;
    const equipBonus = this.calculateEquipBonusTotal();
    const rows = [
      { label: '生命值', base: stats.maxHp, bonus: equipBonus.maxHp, total: stats.maxHp + (equipBonus.maxHp || 0) },
      { label: '攻击力', base: stats.attack, bonus: equipBonus.attack, total: stats.attack + (equipBonus.attack || 0) },
      { label: '防御力', base: stats.defense, bonus: equipBonus.defense, total: stats.defense + (equipBonus.defense || 0) },
      { label: '速度', base: stats.speed, bonus: equipBonus.speed, total: stats.speed + (equipBonus.speed || 0) },
      { label: '暴击率', base: stats.critRate, bonus: equipBonus.critRate, total: stats.critRate + (equipBonus.critRate || 0) },
      { label: '暴击伤害', base: stats.critDamage, bonus: equipBonus.critDamage, total: stats.critDamage + (equipBonus.critDamage || 0) },
    ];

    const slotNames: Record<string, string> = {
      [EquipSlot.WEAPON]: '武器', [EquipSlot.HEAD]: '头部', [EquipSlot.BODY]: '身体',
      [EquipSlot.LEGS]: '腿部', [EquipSlot.ACCESSORY_1]: '饰品1', [EquipSlot.ACCESSORY_2]: '饰品2',
    };

    let y = 120;
    this.add.text(80, y, '装备', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#88aaff',
    }).setDepth(92);
    y += 25;

    const slotEntries = Object.entries(this.saveData.equips) as [EquipSlot, EquipData | null][];
    let slotCol = 0;
    let slotY = y;
    for (const [slot, equip] of slotEntries) {
      const sx = 100 + slotCol * 200;
      const sy = slotY + Math.floor(slotCol / 2) * 25;

      const slotLabel = slotNames[slot] || slot;
      const equipName = equip ? `${equip.name}` : '空';
      const color = equip ? '#44ff88' : '#666688';
      this.add.text(sx, sy, `${slotLabel}: ${equipName}`, {
        fontSize: '13px', fontFamily: 'Microsoft YaHei, sans-serif', color,
      }).setDepth(92);
      slotCol++;

      if (slotCol === 2) slotCol = 0;
    }

    y += 70;
    this.add.text(80, y, '属性详情', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#88aaff',
    }).setDepth(92);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ry = y + 25 + i * 28;
      this.add.text(100, ry, r.label, {
        fontSize: '14px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#aaaacc',
      }).setDepth(92);

      const bonusStr = r.bonus ? `(+${r.bonus})` : '';
      this.add.text(450, ry, `${r.base} ${bonusStr} = ${r.total}`, {
        fontSize: '14px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ffffff',
      }).setDepth(92);
    }

    const allElements = [overlay, panel];
    const eqCount = Object.values(this.saveData.equips).filter((e) => e !== null).length;
    this.add.text(80, y + 28 * rows.length + 10, `金币: ${this.saveData.gold}  |  装备: ${eqCount}/6  |  已通关: ${this.saveData.completedStages.length}关`, {
      fontSize: '13px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ffdd44',
    }).setDepth(92);

    const closeBtn = this.add.text(GAME_WIDTH / 2, 550, '[ 关闭 ]', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ff6644',
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      allElements.forEach((e) => e.destroy());
      closeBtn.destroy();
    });
  }

  private calculateEquipBonusTotal(): { attack: number; defense: number; speed: number; maxHp: number; critRate: number; critDamage: number } {
    const bonus = { attack: 0, defense: 0, speed: 0, maxHp: 0, critRate: 0, critDamage: 0 };
    for (const equip of Object.values(this.saveData.equips)) {
      if (!equip) continue;
      if (equip.stats.attack) bonus.attack += equip.stats.attack;
      if (equip.stats.defense) bonus.defense += equip.stats.defense;
      if (equip.stats.speed) bonus.speed += equip.stats.speed;
      if (equip.stats.hp) bonus.maxHp += equip.stats.hp;
      if (equip.stats.critRate) bonus.critRate += equip.stats.critRate;
      if (equip.stats.critDamage) bonus.critDamage += equip.stats.critDamage;
    }
    return bonus;
  }

  private openInventory(): void {
    if (this.dialogBox) return;

    const invItems = this.saveData.inventory || [];
    const invEquipData = invItems
      .map((id) => EQUIP_DATABASE.find((e) => e.id === id))
      .filter((e): e is EquipData => e !== undefined);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(90).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2e, 0.95);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 300, 40, 600, 540, 10);
    panel.lineStyle(2, 0x44aa88, 0.5);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 300, 40, 600, 540, 10);
    panel.setDepth(91);

    this.add.text(GAME_WIDTH / 2, 65, `背包 (${invEquipData.length}件)`, {
      fontSize: '22px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#44aa88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(92);

    this.add.text(GAME_WIDTH - 80, 70, `金币: ${this.saveData.gold}`, {
      fontSize: '14px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ffdd44',
    }).setDepth(92);

    if (invEquipData.length === 0) {
      this.add.text(GAME_WIDTH / 2, 300, '背包空空如也...\n去商店购买或在战斗中获取装备吧！', {
        fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#666688', align: 'center',
      }).setOrigin(0.5).setDepth(92);
    } else {
      const cols = 4;
      for (let i = 0; i < invEquipData.length; i++) {
        const item = invEquipData[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const ix = GAME_WIDTH / 2 - 250 + col * 130;
        const iy = 100 + row * 60;

        const isEquipped = Object.values(this.saveData.equips).some((e) => e?.id === item.id);
        const color = isEquipped ? '#44ff88' : '#cccccc';

        this.add.text(ix, iy, `${item.name}`, {
          fontSize: '12px', fontFamily: 'Microsoft YaHei, sans-serif', color,
        }).setDepth(92);

        let attrStr = '';
        if (item.stats.attack) attrStr += `ATK+${item.stats.attack} `;
        if (item.stats.defense) attrStr += `DEF+${item.stats.defense} `;
        if (item.stats.hp) attrStr += `HP+${item.stats.hp}`;
        this.add.text(ix, iy + 18, attrStr, {
          fontSize: '10px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#888888',
        }).setDepth(92);

        if (!isEquipped) {
          const equipBtn = this.add.text(ix + 70, iy + 36, '[EQUIP]', {
            fontSize: '11px', fontFamily: 'Arial', color: '#44ff88',
          }).setDepth(92).setInteractive({ useHandCursor: true });

          equipBtn.on('pointerdown', () => {
            this.equipInventoryItem(item);
            equipBtn.setText('[EQUIPPED]');
            equipBtn.removeInteractive();
          });
        }

        if (isEquipped) {
          this.add.text(ix + 100, iy, '[已装备]', {
            fontSize: '10px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#44ff88',
          }).setDepth(92);
        }
      }
    }

    const closeBtn = this.add.text(GAME_WIDTH / 2, 550, '[ 关闭 ]', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ff6644',
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      closeBtn.destroy();
    });
  }

  private equipInventoryItem(item: EquipData): void {
    const inventory = [...(this.saveData.inventory || [])];
    const inventoryIndex = inventory.indexOf(item.id);
    if (inventoryIndex < 0) return;

    const currentEquip = this.saveData.equips[item.slot];
    this.saveData.equips[item.slot] = item;
    inventory.splice(inventoryIndex, 1);
    if (currentEquip) {
      inventory.push(currentEquip.id);
    }

    this.saveData.inventory = inventory;
    this.saveData = normalizeSaveData(this.saveData);
    saveGame(this.saveData);
  }

  private showShopDialog(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(90).setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2a, 0.95);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 350, 40, 700, 540, 10);
    panel.lineStyle(2, 0xffaa44, 0.5);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 350, 40, 700, 540, 10);
    panel.setDepth(91);

    this.add.text(GAME_WIDTH / 2, 65, '军需商店', {
      fontSize: '24px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ffaa44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(92);

    const goldDisplay = this.add.text(GAME_WIDTH - 80, 70, `金币: ${this.saveData.gold}`, {
      fontSize: '14px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ffdd44',
    }).setDepth(92);

    const shopItems = EQUIP_DATABASE.filter((item) => item.level <= this.saveData.level + 3 && item.level >= this.saveData.level - 2)
      .slice(0, 20);

    const slotOrder: Record<string, number> = {
      [EquipSlot.WEAPON]: 0, [EquipSlot.HEAD]: 1, [EquipSlot.BODY]: 2,
      [EquipSlot.LEGS]: 3, [EquipSlot.ACCESSORY_1]: 4, [EquipSlot.ACCESSORY_2]: 5,
    };

    shopItems.sort((a, b) => {
      const sa = slotOrder[a.slot] ?? 9;
      const sb = slotOrder[b.slot] ?? 9;
      if (sa !== sb) return sa - sb;
      return RARITY_LEVEL[b.rarity] - RARITY_LEVEL[a.rarity];
    });

    const cols = 3;
    for (let i = 0; i < shopItems.length; i++) {
      const item = shopItems[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = GAME_WIDTH / 2 - 300 + col * 220;
      const sy = 100 + row * 95;

      const isOwned = (this.saveData.inventory || []).includes(item.id) ||
        Object.values(this.saveData.equips).some((e) => e?.id === item.id);

      const price = (RARITY_LEVEL[item.rarity] + 1) * 80 + item.level * 20;
      const canBuy = !isOwned && this.saveData.gold >= price;

      const itemBg = this.add.graphics();
      itemBg.fillStyle(isOwned ? 0x1a1a2a : 0x111144, 0.9);
      itemBg.fillRoundedRect(sx, sy, 200, 85, 6);
      itemBg.lineStyle(1, isOwned ? 0x444444 : item.color || 0x666666, 0.5);
      itemBg.strokeRoundedRect(sx, sy, 200, 85, 6);
      itemBg.setDepth(92);

      const rarityOrder = ['普通', '精良', '稀有', '史诗', '传说'];
      this.add.text(sx + 10, sy + 5, `${rarityOrder[RARITY_LEVEL[item.rarity]] || ''} ${item.name}`, {
        fontSize: '13px', fontFamily: 'Microsoft YaHei, sans-serif', color: isOwned ? '#666666' : '#ffffff',
      }).setDepth(92);

      let attrStr = `Lv.${item.level} `;
      if (item.stats.attack) attrStr += `ATK+${item.stats.attack} `;
      if (item.stats.defense) attrStr += `DEF+${item.stats.defense} `;
      if (item.stats.hp) attrStr += `HP+${item.stats.hp}`;
      this.add.text(sx + 10, sy + 28, attrStr, {
        fontSize: '11px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#aaaacc',
      }).setDepth(92);

      if (isOwned) {
        this.add.text(sx + 10, sy + 55, '[已拥有]', {
          fontSize: '12px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#44ff88',
        }).setDepth(92);
      } else {
        this.add.text(sx + 10, sy + 52, `价格: ${price}G`, {
          fontSize: '12px', fontFamily: 'Microsoft YaHei, sans-serif', color: canBuy ? '#ffdd44' : '#ff4444',
        }).setDepth(92);

        if (canBuy) {
          const buyBtn = this.add.text(sx + 130, sy + 55, '[购买]', {
            fontSize: '13px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#44ff88',
          }).setDepth(92).setInteractive({ useHandCursor: true });

          buyBtn.on('pointerdown', () => {
            this.saveData.gold -= price;
            if (!this.saveData.inventory) this.saveData.inventory = [];
            this.saveData.inventory.push(item.id);
            this.saveData = normalizeSaveData(this.saveData);
            saveGame(this.saveData);
            goldDisplay.setText(`金币: ${this.saveData.gold}`);
            buyBtn.setText('[已购]');
            buyBtn.removeInteractive();
            overlay.destroy();
            panel.destroy();
            goldDisplay.destroy();
            closeBtn.destroy();
            this.showShopDialog();
          });

          buyBtn.on('pointerover', () => buyBtn.setColor('#88ffaa'));
          buyBtn.on('pointerout', () => buyBtn.setColor('#44ff88'));
        } else if (!isOwned) {
          this.add.text(sx + 130, sy + 55, '[金币不足]', {
            fontSize: '12px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ff4444',
          }).setDepth(92);
        }
      }
    }

    const closeBtn = this.add.text(GAME_WIDTH / 2, 555, '[ 关闭 ]', {
      fontSize: '16px', fontFamily: 'Microsoft YaHei, sans-serif', color: '#ff6644',
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      goldDisplay.destroy();
      closeBtn.destroy();
    });
  }

  private showArenaDialog(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(90);

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a2a, 0.95);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 200, 150, 400, 300, 10);
    panel.lineStyle(2, 0xff4444, 0.5);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 200, 150, 400, 300, 10);
    panel.setDepth(91);

    const title = this.add.text(GAME_WIDTH / 2, 190, '竞技场', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(92);

    this.add.text(GAME_WIDTH / 2, 260, '竞技场功能开发中...\n即将开放PVP对战！', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#88aacc',
      align: 'center',
    }).setOrigin(0.5).setDepth(92);

    const closeBtn = this.add.text(GAME_WIDTH / 2, 410, '[ 关闭 ]', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff6644',
    }).setOrigin(0.5).setDepth(92).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      closeBtn.destroy();
    });
  }
}
