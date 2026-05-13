import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { MechaType, MECHA_DATABASE } from '../data/mechaData';
import { getPlayableSkills, SkillData, SkillType } from '../data/skillData';

interface SkillSlotState {
  container: Phaser.GameObjects.Container;
  skill?: SkillData;
  cooldownMask?: Phaser.GameObjects.Rectangle;
  cooldownText?: Phaser.GameObjects.Text;
  mpText?: Phaser.GameObjects.Text;
  nameText?: Phaser.GameObjects.Text;
}

const SAFE_FIELD_BOUNDS = {
  left: 340,
  right: GAME_WIDTH - 340,
  top: 128,
  bottom: GAME_HEIGHT - 132,
};

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private bossHpBar!: Phaser.GameObjects.Graphics;

  private hpText!: Phaser.GameObjects.Text;
  private mpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private mechaNameText!: Phaser.GameObjects.Text;
  private stageNameText!: Phaser.GameObjects.Text;
  private bossNameText!: Phaser.GameObjects.Text;

  private skillSlots: SkillSlotState[] = [];
  private mechaType!: MechaType;

  private currentHp: number = 1000;
  private maxHp: number = 1000;
  private currentMp: number = 100;
  private maxMp: number = 100;
  private currentXp: number = 0;
  private xpToNext: number = 100;
  private currentLevel: number = 1;

  private bossHp: number = 0;
  private bossMaxHp: number = 0;
  private bossVisible: boolean = false;
  private objectiveText!: Phaser.GameObjects.Text;
  private pickupFeed: Phaser.GameObjects.Text[] = [];
  private pickupFeedBaseY: number = 142;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: {
    mechaType: MechaType;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    level: number;
    xp: number;
    xpToNext: number;
    mechaName: string;
    stageName: string;
  }): void {
    this.mechaType = data.mechaType;
    this.currentHp = data.hp;
    this.maxHp = data.maxHp;
    this.currentMp = data.mp;
    this.maxMp = data.maxMp;
    this.currentLevel = data.level;
    this.currentXp = data.xp;
    this.xpToNext = data.xpToNext;
    this.bossVisible = false;
  }

  create(): void {
    this.createPlayerStatusPanel();
    this.createSkillBar();
    this.createBossHpBar();
    this.createObjectivePanel();

    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'ESC:暂停  WASD:移动  J/空格:攻击  K:跳  U/I/O:技能  L:防御', {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#445566',
    }).setOrigin(1).setDepth(50);

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.togglePause();
    });
  }

  private createPlayerStatusPanel(): void {
    const panelX = 10;
    const panelY = 10;

    this.createMechanicalHudFrame(panelX, panelY, 302, 86, 40, 0x67eaff, 0.88);
    this.createScanningLines(panelX + 8, panelY + 8, 286, 70, 41, 0.08);

    const mechaData = MECHA_DATABASE[this.mechaType];
    this.mechaNameText = this.add.text(panelX + 10, panelY + 8, mechaData.name, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(mechaData.color).rgba,
      fontStyle: 'bold',
    }).setDepth(41);

    this.levelText = this.add.text(panelX + 80, panelY + 8, `Lv.${this.currentLevel}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffdd44',
      fontStyle: 'bold',
    }).setDepth(41);

    this.add.text(panelX + 10, panelY + 30, 'HP', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#44ff44',
    }).setDepth(41);

    this.hpBar = this.add.graphics();
    this.hpBar.setDepth(42);
    this.drawHpBar(panelX + 30, panelY + 30);

    this.hpText = this.add.text(panelX + 240, panelY + 30, `${this.currentHp}/${this.maxHp}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#44ff44',
    }).setDepth(43);

    this.add.text(panelX + 10, panelY + 48, 'MP', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#4488ff',
    }).setDepth(41);

    this.mpBar = this.add.graphics();
    this.mpBar.setDepth(42);
    this.drawMpBar(panelX + 30, panelY + 48);

    this.mpText = this.add.text(panelX + 240, panelY + 48, `${this.currentMp}/${this.maxMp}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#4488ff',
    }).setDepth(43);

    this.xpBar = this.add.graphics();
    this.xpBar.setDepth(42);
    this.drawXpBar(panelX + 10, panelY + 68);
  }

  private createSkillBar(): void {
    this.createEdgeAnchoredSkillBar();
  }

  private createEdgeAnchoredSkillBar(): void {
    const { skill } = this.layoutForViewport();
    const barX = skill.x;
    const barY = skill.y;

    this.createMechanicalHudFrame(barX - 16, barY - 14, 392, 62, 40, 0x3fe7c8, 0.86);
    this.createScanningLines(barX - 10, barY - 8, 380, 50, 41, 0.075);

    const skills = getPlayableSkills(this.mechaType, this.currentLevel);
    const displaySkills: { name: string; key: string; type: string; skill?: SkillData }[] = [
      { name: '攻击', key: 'J', type: 'basic' },
      { name: '跳跃', key: 'K', type: 'jump' },
      { name: '防御', key: 'L', type: 'block' },
    ];

    const specialSkills = skills.filter(
      (s) => s.type === SkillType.SPECIAL || s.type === SkillType.ULTIMATE
    );

    if (specialSkills.length > 0) displaySkills.push({ name: specialSkills[0].name, key: 'U', type: 'skill', skill: specialSkills[0] });
    if (specialSkills.length > 1) displaySkills.push({ name: specialSkills[1].name, key: 'I', type: 'skill', skill: specialSkills[1] });
    if (specialSkills.length > 2) displaySkills.push({ name: specialSkills[2].name, key: 'O', type: 'skill', skill: specialSkills[2] });

    for (let i = 0; i < displaySkills.length; i++) {
      const slotX = barX + i * 60;
      const skill = displaySkills[i];

      const slot = this.add.container(slotX, barY).setDepth(42);

      const slotBg = this.add.graphics();
      const slotColor = skill.type === 'skill' ? 0x335577 : 0x223344;
      slotBg.fillStyle(0x06101d, 0.92);
      slotBg.fillRect(0, 0, 52, 50);
      slotBg.fillStyle(slotColor, 0.72);
      slotBg.fillRect(4, 4, 44, 42);
      slotBg.lineStyle(1, 0x8af7ff, skill.type === 'skill' ? 0.62 : 0.36);
      slotBg.strokeRect(0.5, 0.5, 51, 49);
      slotBg.lineStyle(1, 0xffffff, 0.18);
      slotBg.lineBetween(5, 5, 47, 5);
      slot.add(slotBg);

      const slotName = skill.type === 'skill' ? skill.name : skill.name.substring(0, 2);
      const skillName = this.add.text(26, 22, slotName, {
        fontSize: skill.type === 'skill' && slotName.length >= 4 ? '9px' : '11px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ffffff',
        fontStyle: skill.type === 'skill' ? 'bold' : 'normal',
      }).setOrigin(0.5);
      slot.add(skillName);

      const keyLabel = this.add.text(26, 40, skill.key, {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#88aacc',
      }).setOrigin(0.5);
      slot.add(keyLabel);

      let cooldownMask: Phaser.GameObjects.Rectangle | undefined;
      let cooldownText: Phaser.GameObjects.Text | undefined;
      let mpText: Phaser.GameObjects.Text | undefined;

      if (skill.type === 'skill' && skill.skill) {
        mpText = this.add.text(26, 3, `${skill.skill.mpCost}MP`, {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#66ccff',
        }).setOrigin(0.5, 0);
        slot.add(mpText);

        cooldownMask = this.add.rectangle(26, 25, 52, 50, 0x000000, 0.62)
          .setOrigin(0.5)
          .setVisible(false);
        slot.add(cooldownMask);

        cooldownText = this.add.text(26, 25, '', {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setVisible(false);
        slot.add(cooldownText);
      }

      this.skillSlots.push({
        container: slot,
        skill: skill.skill,
        cooldownMask,
        cooldownText,
        mpText,
        nameText: skillName,
      });
    }
  }

  private createObjectivePanel(): void {
    const { objective } = this.layoutForViewport();
    this.pickupFeedBaseY = objective.y + 70;

    this.createMechanicalHudFrame(objective.x, objective.y, 266, 52, 48, 0x52dfff, 0.82);
    this.createScanningLines(objective.x + 8, objective.y + 8, 250, 36, 49, 0.08);

    this.add.text(GAME_WIDTH - 272, 82, '任务目标', {
      fontSize: '11px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#6ee7ff',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(49);

    this.objectiveText = this.add.text(GAME_WIDTH - 272, 101, '消灭敌人 0/0', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff',
      stroke: '#001020',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(49);
  }

  private createBossHpBar(): void {
    const barX = GAME_WIDTH / 2 - 200;
    const barY = 76;

    const barBg = this.createMechanicalHudFrame(barX - 12, barY - 10, 424, 42, 40, 0xff455f, 0.86);
    barBg.setVisible(false);
    const hpBack = this.add.graphics().setDepth(41).setVisible(false);
    hpBack.fillStyle(0x21060b, 0.95);
    hpBack.fillRect(barX, barY + 12, 400, 14);
    hpBack.lineStyle(1, 0xff8796, 0.32);
    hpBack.strokeRect(barX, barY + 12, 400, 14);

    this.bossNameText = this.add.text(GAME_WIDTH / 2, barY, '', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setVisible(false);

    this.bossHpBar = this.add.graphics();
    this.bossHpBar.setDepth(42).setVisible(false);

    this.bossHpBar.setData('barX', barX);
    this.bossHpBar.setData('barY', barY + 12);
    this.bossHpBar.setData('bg', barBg);
    this.bossHpBar.setData('hpBack', hpBack);
  }

  private drawHpBar(x: number, y: number): void {
    this.hpBar.clear();
    const ratio = this.currentHp / this.maxHp;
    const color = ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffaa44 : 0xff2222;
    this.drawSegmentedBar(this.hpBar, x, y, 200, 14, ratio, color, 0x111920);
  }

  private drawMpBar(x: number, y: number): void {
    this.mpBar.clear();
    const ratio = this.currentMp / this.maxMp;
    this.drawSegmentedBar(this.mpBar, x, y, 200, 14, ratio, 0x4488ff, 0x101627);
  }

  private drawXpBar(x: number, y: number): void {
    this.xpBar.clear();
    const ratio = this.currentXp / this.xpToNext;
    this.drawSegmentedBar(this.xpBar, x, y, 260, 6, ratio, 0xffaa44, 0x101010, 18);
  }

  private drawBossHpBar(): void {
    if (!this.bossVisible) return;

    const barX = this.bossHpBar.getData('barX');
    const barY = this.bossHpBar.getData('barY');

    this.bossHpBar.clear();
    const ratio = this.bossHp / this.bossMaxHp;
    this.drawSegmentedBar(this.bossHpBar, barX, barY, 400, 14, ratio, 0xff354f, 0x21060b, 24);
  }

  public updateHp(hp: number, maxHp: number): void {
    this.currentHp = hp;
    this.maxHp = maxHp;
    this.drawHpBar(40, 40);
    this.hpText.setText(`${hp}/${maxHp}`);
  }

  public updateMp(mp: number, maxMp: number): void {
    this.currentMp = mp;
    this.maxMp = maxMp;
    this.drawMpBar(40, 58);
    this.mpText.setText(`${mp}/${maxMp}`);
  }

  public updateSkillCooldowns(cooldowns: Map<string, number>, currentMp: number): void {
    for (const slot of this.skillSlots) {
      if (!slot.skill || !slot.cooldownMask || !slot.cooldownText || !slot.mpText) continue;

      const cooldown = cooldowns.get(slot.skill.id) || 0;
      const hasCooldown = cooldown > 0;
      slot.cooldownMask.setVisible(hasCooldown);
      slot.cooldownText.setVisible(hasCooldown);
      slot.cooldownText.setText(hasCooldown ? `${Math.ceil(cooldown / 1000)}` : '');
      slot.mpText.setColor(currentMp >= slot.skill.mpCost ? '#66ccff' : '#ff5566');
      slot.nameText?.setColor(currentMp >= slot.skill.mpCost ? '#ffffff' : '#ffb8bf');
      slot.container.setAlpha(currentMp >= slot.skill.mpCost || hasCooldown ? 1 : 0.62);
    }
  }

  public flashSkillSlot(skillId: string, mode: 'success' | 'fail' = 'success'): void {
    const slot = this.skillSlots.find((s) => s.skill?.id === skillId);
    if (!slot) return;

    const color = mode === 'success' ? 0x66f7ff : 0xff4c68;
    const pulse = this.add.rectangle(26, 25, 56, 54, color, 0.18)
      .setOrigin(0.5)
      .setStrokeStyle(2, color, 0.95);
    slot.container.add(pulse);

    this.tweens.add({
      targets: pulse,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => pulse.destroy(),
    });
  }

  public showSkillFailure(skillId: string | undefined, message: string): void {
    if (skillId) {
      this.flashSkillSlot(skillId, 'fail');
    }
    this.showCenterNotice(message, message.includes('MP') ? '#66ccff' : '#ffdd66');
  }

  public showPickupNotice(message: string, color: string = '#ffdd44'): void {
    const y = this.pickupFeedBaseY + this.pickupFeed.length * 22;
    const text = this.add.text(GAME_WIDTH - 22, y, message, {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(65);

    this.pickupFeed.push(text);
    this.tweens.add({
      targets: text,
      x: text.x - 12,
      alpha: 0,
      delay: 900,
      duration: 520,
      ease: 'Sine.easeIn',
      onComplete: () => {
        Phaser.Utils.Array.Remove(this.pickupFeed, text);
        text.destroy();
        this.reflowPickupFeed();
      },
    });
  }

  public updateObjectiveProgress(killed: number, total: number, completed: boolean = false): void {
    if (!this.objectiveText) return;

    this.objectiveText.setText(completed ? '区域清理完成' : `消灭敌人 ${killed}/${total}`);
    this.objectiveText.setColor(completed ? '#55ff99' : '#ffffff');

    this.tweens.add({
      targets: this.objectiveText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (completed) {
      this.showCenterNotice('区域清理完成', '#55ff99');
    }
  }

  private reflowPickupFeed(): void {
    this.pickupFeed.forEach((text, index) => {
      this.tweens.add({
        targets: text,
        y: this.pickupFeedBaseY + index * 22,
        duration: 120,
      });
    });
  }

  private showCenterNotice(message: string, color: string): void {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, message, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);

    this.tweens.add({
      targets: text,
      y: text.y - 26,
      alpha: 0,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  public updateXp(xp: number, xpToNext: number): void {
    this.currentXp = xp;
    this.xpToNext = xpToNext;
    this.drawXpBar(20, 78);
  }

  public updateLevel(level: number): void {
    this.currentLevel = level;
    this.levelText.setText(`Lv.${level}`);
  }

  public showBossHp(name: string, hp: number, maxHp: number): void {
    this.bossVisible = true;
    this.bossHp = hp;
    this.bossMaxHp = maxHp;
    this.bossNameText.setText(name).setVisible(true);
    this.bossHpBar.setVisible(true);

    const bg = this.bossHpBar.getData('bg') as Phaser.GameObjects.Graphics;
    if (bg) bg.setVisible(true);
    const hpBack = this.bossHpBar.getData('hpBack') as Phaser.GameObjects.Graphics;
    if (hpBack) hpBack.setVisible(true);

    this.drawBossHpBar();
  }

  public updateBossHp(hp: number, maxHp: number): void {
    this.bossHp = hp;
    this.bossMaxHp = maxHp;
    this.drawBossHpBar();
  }

  public hideBossHp(): void {
    this.bossVisible = false;
    this.bossNameText.setVisible(false);
    this.bossHpBar.setVisible(false);
    const bg = this.bossHpBar.getData('bg') as Phaser.GameObjects.Graphics;
    if (bg) bg.setVisible(false);
    const hpBack = this.bossHpBar.getData('hpBack') as Phaser.GameObjects.Graphics;
    if (hpBack) hpBack.setVisible(false);
  }

  private createMechanicalHudFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    accent: number,
    alpha: number = 0.86
  ): Phaser.GameObjects.Graphics {
    const frame = this.add.graphics().setScrollFactor(0).setDepth(depth);
    frame.fillStyle(0x030812, alpha);
    frame.fillRect(x, y, width, height);
    frame.fillStyle(0x102032, alpha * 0.9);
    frame.fillRect(x + 4, y + 4, width - 8, height - 8);
    frame.fillStyle(0xffffff, 0.08);
    frame.fillRect(x + 6, y + 6, width - 12, 2);
    frame.lineStyle(2, accent, 0.55);
    frame.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    frame.lineStyle(1, 0xffffff, 0.16);
    frame.strokeRect(x + 5.5, y + 5.5, width - 11, height - 11);
    frame.fillStyle(accent, 0.5);
    frame.fillRect(x + 8, y + height - 5, 52, 2);
    frame.fillRect(x + width - 60, y + 3, 52, 2);
    return frame;
  }

  private createScanningLines(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    alpha: number
  ): Phaser.GameObjects.Graphics {
    const scan = this.add.graphics().setScrollFactor(0).setDepth(depth);
    scan.lineStyle(1, 0x7fffea, alpha);
    for (let sy = y; sy <= y + height; sy += 4) {
      scan.lineBetween(x, sy, x + width, sy);
    }
    return scan;
  }

  private drawSegmentedBar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    color: number,
    background: number,
    segmentWidth: number = 20
  ): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    const fillWidth = Math.floor(width * clamped);
    graphics.fillStyle(background, 0.94);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(color, 0.95);
    graphics.fillRect(x, y, fillWidth, height);
    graphics.fillStyle(0xffffff, 0.24);
    graphics.fillRect(x, y, fillWidth, Math.max(2, Math.floor(height * 0.28)));
    graphics.lineStyle(1, 0x000000, 0.38);
    for (let sx = x + segmentWidth; sx < x + width; sx += segmentWidth) {
      graphics.lineBetween(sx, y + 1, sx, y + height - 1);
    }
    graphics.lineStyle(1, 0x9eefff, 0.32);
    graphics.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  }

  private layoutForViewport(): {
    skill: { x: number; y: number };
    objective: { x: number; y: number };
  } {
    const skillWidth = 392;
    const skillX = Math.min(SAFE_FIELD_BOUNDS.right + 8, GAME_WIDTH - skillWidth);

    return {
      skill: {
        x: skillX,
        y: GAME_HEIGHT - 78,
      },
      objective: {
        x: GAME_WIDTH - 286,
        y: 74,
      },
    };
  }

  private togglePause(): void {
    const gameScene = this.scene.get('GameScene');
    if (gameScene.scene.isPaused('GameScene')) {
      gameScene.scene.resume('GameScene');
      this.hidePauseMenu();
    } else {
      gameScene.scene.pause('GameScene');
      this.showPauseMenu();
    }
  }

  private pauseOverlay: Phaser.GameObjects.Rectangle | null = null;
  private pauseTexts: Phaser.GameObjects.Text[] = [];

  private showPauseMenu(): void {
    this.pauseOverlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.6
    ).setDepth(80);

    const addPauseText = (text: string, y: number, style: Phaser.Types.GameObjects.Text.TextStyle = {}) => {
      const t = this.add.text(GAME_WIDTH / 2, y, text, {
        fontFamily: 'Microsoft YaHei, sans-serif',
        ...style,
      }).setOrigin(0.5).setDepth(81);
      this.pauseTexts.push(t);
    };

    addPauseText('暂停', GAME_HEIGHT / 2 - 60, { fontSize: '36px', color: '#4488ff', fontStyle: 'bold' });
    addPauseText('按 ESC 继续', GAME_HEIGHT / 2, { fontSize: '18px', color: '#88aacc' });
  }

  private hidePauseMenu(): void {
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.pauseTexts.forEach((t) => t.destroy());
    this.pauseTexts = [];
  }
}
