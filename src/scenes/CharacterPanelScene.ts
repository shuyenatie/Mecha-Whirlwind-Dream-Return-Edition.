import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { MechaType } from '../data/mechaData';
import { EquipSlot, EquipRarity, RARITY_NAMES, formatEquipStats } from '../data/equipData';
import { LEARNING_MODE_SKILL_NOTICE } from '../data/skillData';

const MECHA_DISPLAY_NAMES: Record<string, string> = {
  [MechaType.TIAN_JIAN]: '天剑',
  [MechaType.QIANG_PAO]: '枪炮',
  [MechaType.SHAN_YING]: '闪影',
  [MechaType.LIAN_REN]: '连刃',
  [MechaType.SHENG_QIANG]: '圣枪',
  [MechaType.HAN_XING]: '寒星',
};

export class CharacterPanelScene extends Phaser.Scene {
  private player!: Player;
  private container!: Phaser.GameObjects.Container;
  private detailPanel!: Phaser.GameObjects.Container;
  private equipSlotGraphics: Map<EquipSlot, Phaser.GameObjects.Rectangle> = new Map();
  private equipSlotIcons: Map<EquipSlot, Phaser.GameObjects.Image> = new Map();
  private equipSlotLabels: Map<EquipSlot, Phaser.GameObjects.Text> = new Map();
  private statValueTexts: Phaser.GameObjects.Text[] = [];
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CharacterPanelScene' });
  }

  init(data: { player: Player }): void {
    this.player = data.player;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x000000dd);

    const bg = this.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0x0a0a2e, 0.95);
    bg.setStrokeStyle(2, 0x4488ff);
    bg.setInteractive();

    const closeBtn = this.add.text(width - 60, 30, 'X', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('HubScene');
    });

    this.add.text(60, 25, '角色属性', {
      fontSize: '26px',
      color: '#4488ff',
      fontFamily: 'Arial',
    });

    this.container = this.add.container(0, 0);
    this.detailPanel = this.add.container(0, 0);

    this.createEquipSlots();
    this.createStatDisplay();
    this.createInfoBar();
    this.player.onEquipmentChange = () => {
      this.refreshAllSlots();
      this.refreshAllStats();
    };
    if (this.player.mechaType === MechaType.TIAN_JIAN) {
      this.add.text(420, 585, LEARNING_MODE_SKILL_NOTICE, {
        fontSize: '13px', color: '#44ffcc', fontFamily: 'Arial',
      });
    }
  }

  private createEquipSlots(): void {
    const startX = 90;
    const startY = 110;
    const slotSize = 64;
    const gap = 16;

    const slotBg = this.add.rectangle(210, startY + 200, 240, 440, 0x111144, 0.8);
    slotBg.setStrokeStyle(1, 0x3355aa);

    this.add.text(startX, startY - 10, '装备', {
      fontSize: '18px',
      color: '#88aaff',
      fontFamily: 'Arial',
    });

    const slotNames: { slot: EquipSlot; label: string }[] = [
      { slot: EquipSlot.WEAPON, label: '武器' },
      { slot: EquipSlot.HEAD, label: '头部' },
      { slot: EquipSlot.BODY, label: '身体' },
      { slot: EquipSlot.LEGS, label: '腿部' },
      { slot: EquipSlot.ACCESSORY_1, label: '饰品1' },
      { slot: EquipSlot.ACCESSORY_2, label: '饰品2' },
    ];

    const col1X = startX + 10;
    const col2X = startX + 130;

    slotNames.forEach((item, i) => {
      const row = i % 3;
      const col = Math.floor(i / 3);
      const x = col === 0 ? col1X : col2X;
      const y = startY + 30 + row * (slotSize + gap);

      this.add.text(x, y + 22, item.label, {
        fontSize: '13px',
        color: '#6688bb',
        fontFamily: 'Arial',
      }).setOrigin(0, 0.5);

      const border = this.add.rectangle(x + 50, y + 24, slotSize, slotSize, 0x1a1a3a);
      border.setStrokeStyle(2, 0x3355aa);
      this.equipSlotGraphics.set(item.slot, border);

      border.setInteractive();
      border.on('pointerdown', () => this.showEquipTooltip(item.slot));
      border.on('pointerover', () => border.setStrokeStyle(2, 0x66aaff));
      border.on('pointerout', () => {
        border.setStrokeStyle(2, this.player.equipment[item.slot]?.color || 0x3355aa);
        this.hideDetailPanel();
      });

      this.updateEquipSlot(item.slot);
    });
  }

  private updateEquipSlot(slot: EquipSlot): void {
    const existingIcon = this.equipSlotIcons.get(slot);
    if (existingIcon) { existingIcon.destroy(); this.equipSlotIcons.delete(slot); }
    const existingLabel = this.equipSlotLabels.get(slot);
    if (existingLabel) { existingLabel.destroy(); this.equipSlotLabels.delete(slot); }

    const equip = this.player.equipment[slot];
    const border = this.equipSlotGraphics.get(slot);
    if (!border) return;

    if (equip) {
      border.setStrokeStyle(2, equip.color || 0x3355aa);
      const icon = this.add.image(border.x, border.y, 'item_weapon').setScale(0.7).setTint(equip.color || 0xffffff);
      this.equipSlotIcons.set(slot, icon);
      const nameLabel = this.add.text(border.x, border.y + 36, equip.name.length > 6 ? equip.name.slice(0, 6) + '..' : equip.name, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.equipSlotLabels.set(slot, nameLabel);
    } else {
      border.setStrokeStyle(2, 0x3355aa);
    }
  }

  private refreshAllSlots(): void {
    for (const slot of Object.values(EquipSlot)) {
      this.updateEquipSlot(slot);
    }
  }

  private showEquipTooltip(slot: EquipSlot): void {
    this.hideDetailPanel();
    const equip = this.player.equipment[slot];
    if (!equip) return;

    const border = this.equipSlotGraphics.get(slot);
    if (!border) return;

    const rarityName = RARITY_NAMES[equip.rarity as EquipRarity] || '普通';
    const tooltipX = border.x + 100;
    const tooltipY = border.y;

    const tooltipBg = this.add.rectangle(tooltipX, tooltipY, 200, 160, 0x111133, 0.95);
    tooltipBg.setStrokeStyle(1, equip.color || 0x666666);

    const textColor = '#' + (equip.color ? equip.color.toString(16).padStart(6, '0') : 'aaaaaa');

    const nameText = this.add.text(tooltipX, tooltipY - 65, `${rarityName} ${equip.name}`, {
      fontSize: '13px', color: textColor, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const statsStr = formatEquipStats(equip);

    const statsText = this.add.text(tooltipX, tooltipY + 5, statsStr, {
      fontSize: '12px', color: '#cccccc', fontFamily: 'Arial', lineSpacing: 4,
    }).setOrigin(0.5);

    const unequipBtn = this.add.text(tooltipX, tooltipY + 60, '[卸下]', {
      fontSize: '13px', color: '#ff8844', fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    unequipBtn.on('pointerdown', () => {
      this.player.unequipItem(slot);
      this.refreshAllSlots();
      this.refreshAllStats();
      this.hideDetailPanel();
    });

    this.detailPanel.add([tooltipBg, nameText, statsText, unequipBtn]);
  }

  private hideDetailPanel(): void {
    this.detailPanel.removeAll(true);
  }

  private createStatDisplay(): void {
    const startX = 420;
    const startY = 110;

    const statBg = this.add.rectangle(startX + 310, startY + 180, 620, 420, 0x111144, 0.8);
    statBg.setStrokeStyle(1, 0x3355aa);

    this.add.text(startX, startY - 10, '属性', {
      fontSize: '18px', color: '#88aaff', fontFamily: 'Arial',
    });

    this.statValueTexts = [];
    this.createStatRow(startX, startY, '等级', `Lv.${this.player.level}`, null);
    this.createStatRow(startX, startY + 33, '机甲类型', MECHA_DISPLAY_NAMES[this.player.mechaType as string] || this.player.mechaType, null);
    this.createSeparator(startX, startY + 66);
    this.createStatRow(startX, startY + 99, '生命值 (HP)', '', 'hp');
    this.createStatRow(startX, startY + 132, '能量值 (MP)', '', 'mp');
    this.createStatRow(startX, startY + 165, '攻击力 (ATK)', '', 'atk');
    this.createStatRow(startX, startY + 198, '防御力 (DEF)', '', 'def');
    this.createStatRow(startX, startY + 231, '速度 (SPD)', '', 'spd');
    this.createSeparator(startX, startY + 264);
    this.createStatRow(startX, startY + 297, '暴击率', '', 'critRate');
    this.createStatRow(startX, startY + 330, '暴击伤害', '', 'critDmg');

    this.updateStatValues();
  }

  private createStatRow(x: number, y: number, label: string, value: string, type: string | null): void {
    this.add.text(x, y, label, {
      fontSize: '15px', color: '#8899bb', fontFamily: 'Arial',
    });

    if (type === null) {
      this.add.text(x + 330 - 40, y, value, {
        fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(1, 0);
    } else {
      const valText = this.add.text(x + 330 - 40, y, '', {
        fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(1, 0);
      valText.setData('statType', type);
      this.statValueTexts.push(valText);
    }
  }

  private createSeparator(x: number, y: number): void {
    this.add.text(x, y, '──────────────────', {
      fontSize: '12px', color: '#335577', fontFamily: 'Arial',
    });
  }

  private updateStatValues(): void {
    for (const t of this.statValueTexts) {
      const st = t.getData('statType') as string;
      const equips = this.player.getEquippedStats();
      const base = this.player.getBaseStats();

      let val = '';
      switch (st) {
        case 'hp':
          val = `${this.player.hp} / ${this.player.getTotalMaxHp()}`;
          break;
        case 'mp':
          val = `${this.player.mp} / ${this.player.maxMp} (${base.maxMp} + ${equips.maxMp || 0})`;
          break;
        case 'atk':
          val = `${base.attack} + ${equips.attack || 0} = ${this.player.getTotalAttack()}`;
          break;
        case 'def':
          val = `${base.defense} + ${equips.defense || 0} = ${this.player.getTotalDefense()}`;
          break;
        case 'spd':
          val = `${base.speed} + ${equips.speed || 0} = ${this.player.getTotalSpeed()}`;
          break;
        case 'critRate':
          val = `${this.player.getTotalCritRate()}% (基础 ${this.player.baseCritRate}%)`;
          break;
        case 'critDmg':
          val = `${this.player.getTotalCritDamage()}% (基础 ${this.player.baseCritDamage}%)`;
          break;
      }
      t.setText(val);
    }
  }

  private refreshAllStats(): void {
    this.updateStatValues();
    this.goldText.setText(`金币: ${this.player.gold}`);
  }

  private createInfoBar(): void {
    const barY = 560;

    this.goldText = this.add.text(60, barY, `金币: ${this.player.gold}`, {
      fontSize: '16px', color: '#ffdd44', fontFamily: 'Arial',
    });

    this.add.text(400, barY, `机甲: ${MECHA_DISPLAY_NAMES[this.player.mechaType as string] || this.player.mechaType} | Lv.${this.player.level}`, {
      fontSize: '16px', color: '#88aaff', fontFamily: 'Arial',
    });

    this.add.text(750, barY, '按 C 关闭', {
      fontSize: '14px', color: '#666688', fontFamily: 'Arial',
    });
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('C'))) {
      this.scene.stop();
      this.scene.resume('HubScene');
    }
    this.refreshAllStats();
  }
}
