import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EquipSlot, EquipData, EquipRarity, EQUIP_DATABASE, RARITY_COLORS, RARITY_NAMES, RARITY_LEVEL, formatEquipStats } from '../data/equipData';
import { MechaType } from '../data/mechaData';

export class InventoryScene extends Phaser.Scene {
  private player!: Player;
  private inventoryGrid!: Phaser.GameObjects.Container;
  private detailPanel!: Phaser.GameObjects.Container;
  private itemSlots: Phaser.GameObjects.Container[] = [];
  private currentPage: number = 0;
  private readonly ITEMS_PER_PAGE: number = 20;
  private pageText!: Phaser.GameObjects.Text;
  private filterType: EquipSlot | 'all' = 'all';

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { player: Player }): void {
    this.player = data.player;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x000000dd);

    const bg = this.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0x0a0a2e, 0.95);
    bg.setStrokeStyle(2, 0x44aa88);
    bg.setInteractive();

    const closeBtn = this.add.text(width - 60, 30, '✕', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('HubScene');
    });

    this.add.text(60, 25, '背包', {
      fontSize: '26px',
      color: '#44aa88',
      fontFamily: 'Arial',
    });

    this.add.text(width - 200, 35, `金币: ${this.player.gold}`, {
      fontSize: '16px',
      color: '#ffdd44',
      fontFamily: 'Arial',
    });

    this.detailPanel = this.add.container(0, 0);
    this.inventoryGrid = this.add.container(60, 90);
    this.itemSlots = [];

    this.createFilterButtons();
    this.renderGrid();
    this.createPageNav();
  }

  private createFilterButtons(): void {
    const { width } = this.scale;
    const filters: { label: string; type: EquipSlot | 'all' }[] = [
      { label: '全部', type: 'all' },
      { label: '武器', type: EquipSlot.WEAPON },
      { label: '头部', type: EquipSlot.HEAD },
      { label: '身体', type: EquipSlot.BODY },
      { label: '腿部', type: EquipSlot.LEGS },
      { label: '饰品', type: EquipSlot.ACCESSORY_1 },
    ];

    const startX = width - 240;
    filters.forEach((f, i) => {
      const btn = this.add.text(startX, 100 + i * 40, `[${f.label}]`, {
        fontSize: '15px',
        color: this.filterType === f.type ? '#44ff88' : '#6688aa',
        fontFamily: 'Arial',
      }).setInteractive();

      btn.on('pointerdown', () => {
        if (this.player.inventory.length === 0 && f.type !== 'all') {
          this.filterType = f.type;
          this.currentPage = 0;
          this.renderGrid();
          this.createFilterButtons();
          return;
        }
        this.filterType = f.type;
        this.currentPage = 0;
        this.renderGrid();
        this.createFilterButtons();
      });

      btn.on('pointerover', () => btn.setColor('#88ffaa'));
      btn.on('pointerout', () => {
        btn.setColor(this.filterType === f.type ? '#44ff88' : '#6688aa');
      });
    });
  }

  private getFilteredItems(): EquipData[] {
    if (this.filterType === 'all') return this.player.inventory;
    return this.player.inventory.filter((item) => item.slot === this.filterType);
  }

  private renderGrid(): void {
    this.inventoryGrid.removeAll(true);
    this.itemSlots = [];
    this.hideDetailPanel();

    const items = this.getFilteredItems();
    const startIdx = this.currentPage * this.ITEMS_PER_PAGE;
    const pageItems = items.slice(startIdx, startIdx + this.ITEMS_PER_PAGE);

    if (pageItems.length === 0) {
      this.inventoryGrid.add(this.add.text(200, 150, '背包空空如也...', {
        fontSize: '18px',
        color: '#666688',
        fontFamily: 'Arial',
      }));
      return;
    }

    const cols = 5;
    const slotSize = 64;
    const gap = 12;
    const itemsPerRow = Math.min(cols, pageItems.length);

    const gridStartX = 0;
    const gridStartY = 0;

    pageItems.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = gridStartX + col * (slotSize + gap);
      const y = gridStartY + row * (slotSize + gap + 20);

      const container = this.add.container(x, y);

      const border = this.add.rectangle(0, 0, slotSize, slotSize, 0x111144, 0.9);
      border.setStrokeStyle(2, item.color || 0x666666);
      container.add(border);

      const icon = this.add.image(0, 0, 'item_weapon').setScale(0.6).setTint(item.color || 0xffffff);
      container.add(icon);

      const nameText = this.add.text(0, slotSize / 2 + 8, item.name.length > 6 ? item.name.slice(0, 6) + '..' : item.name, {
        fontSize: '10px',
        color: '#cccccc',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      container.add(nameText);

      const isEquipped = Object.values(this.player.equipment).some((e) => e?.id === item.id);
      if (isEquipped) {
        const equipLabel = this.add.text(0, -slotSize / 2 + 8, '已装备', {
          fontSize: '9px',
          color: '#44ff88',
          fontFamily: 'Arial',
        }).setOrigin(0.5);
        container.add(equipLabel);
      }

      container.setSize(slotSize, slotSize + 20);
      container.setInteractive();
      container.on('pointerdown', () => {
        this.showItemDetail(item);
      });

      container.on('pointerover', () => {
        border.setStrokeStyle(2, 0x66eeff);
      });

      container.on('pointerout', () => {
        border.setStrokeStyle(2, item.color || 0x666666);
      });

      this.inventoryGrid.add(container);
      this.itemSlots.push(container);
    });
  }

  private showItemDetail(item: EquipData): void {
    this.hideDetailPanel();

    const currentInSlot = this.player.equipment[item.slot];
    const isEquipped = currentInSlot?.id === item.id;

    const { width } = this.scale;
    const panelX = width - 200;
    const panelY = 260;

    const bg = this.add.rectangle(panelX, panelY, 180, 260, 0x111133, 0.95);
    bg.setStrokeStyle(2, item.color || 0x666666);

    const rarityName = RARITY_NAMES[item.rarity as keyof typeof RARITY_NAMES] || '普通';

    const nameText = this.add.text(panelX, panelY - 110, `${rarityName} ${item.name}`, {
      fontSize: '14px',
      color: '#' + (item.color ? item.color.toString(16).padStart(6, '0') : 'aaaaaa'),
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const slotNames: Record<string, string> = {
      [EquipSlot.WEAPON]: '武器',
      [EquipSlot.HEAD]: '头部',
      [EquipSlot.BODY]: '身体',
      [EquipSlot.LEGS]: '腿部',
      [EquipSlot.ACCESSORY_1]: '饰品',
      [EquipSlot.ACCESSORY_2]: '饰品',
    };
    const slotText = this.add.text(panelX, panelY - 85, `部位: ${slotNames[item.slot] || item.slot}`, {
      fontSize: '12px',
      color: '#aaaacc',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const statsStr = formatEquipStats(item);

    const statsText = this.add.text(panelX, panelY - 45, statsStr, {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'Arial',
      lineSpacing: 4,
      align: 'center',
    }).setOrigin(0.5);

    const currentLabel = currentInSlot && !isEquipped ? `当前: ${currentInSlot.name}` : isEquipped ? '已装备' : '当前: 空';
    const currentText = this.add.text(panelX, panelY + 42, currentLabel, {
      fontSize: '11px',
      color: isEquipped ? '#44ff88' : '#aaaacc',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const equipBtn = this.add.text(panelX, panelY + 80, isEquipped ? '[卸下]' : currentInSlot ? '[替换装备]' : '[装备]', {
      fontSize: '16px',
      color: '#44ff88',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    equipBtn.on('pointerdown', () => {
      if (isEquipped) {
        const equipSlot = Object.entries(this.player.equipment).find(
          ([, e]) => e?.id === item.id
        )?.[0] as EquipSlot;
        if (equipSlot) {
          this.player.unequipItem(equipSlot);
        }
      } else {
        this.player.equipItem(item);
      }
      this.renderGrid();
      this.hideDetailPanel();
    });

    const sellBtn = this.add.text(panelX, panelY + 110, '[出售]', {
      fontSize: '14px',
      color: '#ff8844',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    sellBtn.on('pointerdown', () => {
      const sellPrice = (RARITY_LEVEL[item.rarity] + 1) * 50 + item.level * 10;
      this.player.removeFromInventory(item.id);
      const equipSlot = Object.entries(this.player.equipment).find(
        ([, e]) => e?.id === item.id
      )?.[0] as EquipSlot;
      if (equipSlot) {
        this.player.equipment[equipSlot] = null;
      }
      this.player.gold += sellPrice;
      this.renderGrid();
      this.hideDetailPanel();
    });

    if (item.description) {
      const descText = this.add.text(panelX, panelY + 140, item.description, {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'Arial',
        wordWrap: { width: 160 },
        align: 'center',
      }).setOrigin(0.5);
      this.detailPanel.add(descText);
    }

    this.detailPanel.add([bg, nameText, slotText, statsText, currentText, equipBtn, sellBtn]);
  }

  private hideDetailPanel(): void {
    this.detailPanel.removeAll(true);
  }

  private createPageNav(): void {
    const { width, height } = this.scale;
    const items = this.getFilteredItems();
    const totalPages = Math.ceil(items.length / this.ITEMS_PER_PAGE) || 1;

    const prevBtn = this.add.text(width / 2 - 80, height - 60, '< 上一页', {
      fontSize: '14px',
      color: this.currentPage > 0 ? '#88aaff' : '#444466',
      fontFamily: 'Arial',
    }).setInteractive();

    prevBtn.on('pointerdown', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.renderGrid();
      }
    });

    this.pageText = this.add.text(width / 2, height - 60, `${this.currentPage + 1} / ${totalPages}`, {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const nextBtn = this.add.text(width / 2 + 80, height - 60, '下一页 >', {
      fontSize: '14px',
      color: this.currentPage < totalPages - 1 ? '#88aaff' : '#444466',
      fontFamily: 'Arial',
    }).setInteractive();

    nextBtn.on('pointerdown', () => {
      if (this.currentPage < totalPages - 1) {
        this.currentPage++;
        this.renderGrid();
      }
    });

    if (this.currentPage <= 0) prevBtn.setAlpha(0.4);
    if (this.currentPage >= totalPages - 1) nextBtn.setAlpha(0.4);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('I'))) {
      this.scene.stop();
      this.scene.resume('HubScene');
    }
  }
}
