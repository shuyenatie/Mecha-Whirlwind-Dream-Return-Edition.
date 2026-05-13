import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { MechaType, MECHA_DATABASE } from '../data/mechaData';
import { Player } from '../entities/Player';
import { Enemy, type EnemyHitReaction } from '../entities/Enemy';
import { STAGE_DATABASE, StageData } from '../data/stageData';
import { ENEMY_DATABASE, BOSS_DATABASE, BossData } from '../data/enemyData';
import { EQUIP_DATABASE, EquipData, RARITY_COLORS, RARITY_LEVEL, RARITY_NAMES } from '../data/equipData';
import { PlayerSaveData, createNewSave, loadGame, normalizeSaveData, saveGame } from '../data/playerData';
import { getStageVisual, StageVisualData } from '../data/stageVisualData';

interface DropItem {
  sprite: Phaser.GameObjects.Sprite;
  type: 'gold' | 'hp' | 'mp' | 'equip';
  value: number;
  equipData?: EquipData;
}

interface StageWave {
  enemies: { id: string; count: number }[];
}

interface CombatUiScene extends Phaser.Scene {
  updateObjectiveProgress?: (killed: number, total: number, completed?: boolean) => void;
  showPickupNotice?: (message: string, color?: string) => void;
  flashSkillSlot?: (skillId: string, mode?: 'success' | 'fail') => void;
  showSkillFailure?: (skillId: string | undefined, message: string) => void;
}

interface GameSceneInitData {
  mechaType: MechaType;
  stageId: string;
  saveData?: PlayerSaveData;
}

const HIT_CONFIRMED_RECOVERY_BONUS_MS = 180;
const BOSS_VOID_BEAM_WARNING_MS = 760;
const BOSS_VOID_BEAM_ACTIVE_MS = 260;
const VISUAL_DEPTHS = {
  ground: 2,
  foreground: 3,
  drop: 12,
  warning: 19,
  effect: 22,
  feedback: 72,
  fixedNotice: 90,
};

export class GameScene extends Phaser.Scene {
  public player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private currentStage!: StageData;
  private currentStageVisual!: StageVisualData;
  private stageCleared: boolean = false;
  private bossSpawned: boolean = false;
  private enemiesKilled: number = 0;
  private totalEnemies: number = 0;
  private stageStartTime: number = 0;
  private damageDealt: number = 0;
  private maxCombo: number = 0;

  private bg!: Phaser.GameObjects.Image;
  private groundGraphics!: Phaser.GameObjects.Graphics;

  private stageText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboTimer: number = 0;
  private enemyCountText!: Phaser.GameObjects.Text;

  private drops: DropItem[] = [];
  private gold: number = 0;
  private goldText!: Phaser.GameObjects.Text;

  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;
  private hitStopTimer?: Phaser.Time.TimerEvent;

  private enemyMeleeGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private playerProjectileGroup!: Phaser.Physics.Arcade.Group;
  private enemyProjectileGroup!: Phaser.Physics.Arcade.Group;
  private playerHitboxGroup!: Phaser.Physics.Arcade.Group;
  private dropGroup!: Phaser.Physics.Arcade.Group;

  private bossRef: Enemy | null = null;
  private bossSpecialCooldown: number = 0;
  private bossSpecialIndex: number = 0;
  private stageWaves: StageWave[] = [];
  private currentWaveIndex: number = 0;
  private waveEnemiesKilled: number = 0;
  private waveEnemyTarget: number = 0;
  private waveTransitionPending: boolean = false;
  private exitPortal?: Phaser.GameObjects.Container;
  private exitPortalZone?: Phaser.GameObjects.Zone;
  private gameOverShown: boolean = false;
  private activeSaveData: PlayerSaveData | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneInitData): void {
    this.stageCleared = false;
    this.bossSpawned = false;
    this.enemiesKilled = 0;
    this.totalEnemies = 0;
    this.enemies = [];
    this.drops = [];
    this.gold = 0;
    this.damageDealt = 0;
    this.maxCombo = 0;
    this.bossRef = null;
    this.bossSpecialCooldown = 0;
    this.bossSpecialIndex = 0;
    this.stageWaves = [];
    this.currentWaveIndex = 0;
    this.waveEnemiesKilled = 0;
    this.waveEnemyTarget = 0;
    this.waveTransitionPending = false;
    this.exitPortal = undefined;
    this.exitPortalZone = undefined;
    this.gameOverShown = false;
  }

  create(data: GameSceneInitData): void {
    const mechaType = data.mechaType || MechaType.TIAN_JIAN;
    const stageId = data.stageId || 'stage_1_1';

    this.currentStage = STAGE_DATABASE.find((s) => s.id === stageId) || STAGE_DATABASE[0];
    this.currentStageVisual = getStageVisual(this.currentStage.id);
    this.stageStartTime = this.time.now;

    this.enemyMeleeGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.playerProjectileGroup = this.physics.add.group();
    this.enemyProjectileGroup = this.physics.add.group();
    this.playerHitboxGroup = this.physics.add.group();
    this.dropGroup = this.physics.add.group();

    this.createBackground();
    this.createPlatforms();
    this.createPlayer(mechaType, data.saveData);
    this.stageWaves = this.buildStageWaves();
    this.totalEnemies = this.countWaveEnemies(this.stageWaves) + (this.currentStage.boss ? 1 : 0);
    this.setupCollisions();
    this.createStageUI();

    this.scene.launch('UIScene', {
      mechaType,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      mp: this.player.mp,
      maxMp: this.player.maxMp,
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      mechaName: this.player.mechaData.name,
      stageName: this.currentStage.name,
    });

    this.setupPlayerCallbacks();
    this.time.delayedCall(0, () => {
      this.updateWaveObjective();
      this.spawnCurrentWave();
    });

    this.cameras.main.setBounds(0, 0, this.currentStage.width, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.05);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.physics.world.setBounds(0, 0, this.currentStage.width, GAME_HEIGHT);
  }

  private createBackground(): void {
    if (this.currentStageVisual.layerKeys?.length) {
      this.createLayeredStageBackdrop(this.currentStageVisual.layerKeys);
    } else if (this.textures.exists(this.currentStageVisual.backgroundKey)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.currentStageVisual.backgroundKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setScrollFactor(0)
        .setDepth(-30);
    } else {
      const bgKey = this.currentStage.backgroundKey;
      if (this.textures.exists(bgKey)) {
        this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey);
        this.bg.setScrollFactor(0);
      } else {
        const fallback = this.add.graphics();
        fallback.fillStyle(this.currentStage.bgColor);
        fallback.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        fallback.fillStyle(0x061424, 0.32);
        fallback.fillRect(0, Math.floor(GAME_HEIGHT * 0.52), GAME_WIDTH, Math.floor(GAME_HEIGHT * 0.48));
        fallback.setDepth(-30);
      }
    }

    this.createAirPerspectiveFog(this.currentStageVisual.atmosphere);
    this.createAtmosphereOverlay(this.currentStageVisual.atmosphere);
    this.createForegroundEdgeAtmosphere();
    this.createForegroundScanlineSweep();
  }

  private createLayeredStageBackdrop(layerKeys: string[]): void {
    const layerSettings = [
      { scroll: 0.18, depth: -42, alpha: 0.92, y: 0 },
      { scroll: 0.42, depth: -34, alpha: 0.94, y: 8 },
      { scroll: 0.72, depth: -24, alpha: 0.9, y: 18 },
    ];

    layerKeys.forEach((key, index) => {
      if (!this.textures.exists(key)) return;

      const settings = layerSettings[Math.min(index, layerSettings.length - 1)];
      this.add.tileSprite(0, settings.y, this.currentStage.width, GAME_HEIGHT, key)
        .setOrigin(0)
        .setScrollFactor(settings.scroll)
        .setDepth(settings.depth)
        .setAlpha(settings.alpha);
    });
  }

  private createAirPerspectiveFog(atmosphere: StageVisualData['atmosphere']): void {
    const fog = this.add.graphics();
    fog.setScrollFactor(0.06);
    fog.setDepth(-18);

    const color = atmosphere === 'void' ? 0x5b2c87 : atmosphere === 'tech' ? 0x4cc8ff : 0x8fbfd8;
    fog.fillStyle(color, atmosphere === 'void' ? 0.12 : 0.1);
    fog.fillRect(0, 86, this.currentStage.width, 210);
    fog.fillStyle(0xffffff, 0.035);
    fog.fillRect(0, 250, this.currentStage.width, 96);

    if (this.textures.exists(this.currentStageVisual.backgroundKey)) {
      const haze = this.add.tileSprite(0, 0, this.currentStage.width, GAME_HEIGHT, this.currentStageVisual.backgroundKey)
        .setOrigin(0)
        .setScrollFactor(0.22)
        .setDepth(-19)
        .setAlpha(0.08);
      haze.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private createAtmosphereOverlay(atmosphere: StageVisualData['atmosphere']): void {
    const overlay = this.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(-5);
    const tint = atmosphere === 'void' ? 0x120018 : atmosphere === 'tech' ? 0x021421 : 0x020816;
    const alpha = atmosphere === 'void' ? 0.26 : atmosphere === 'tech' ? 0.16 : 0.18;
    overlay.fillStyle(tint, alpha);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.lineStyle(1, atmosphere === 'void' ? 0xc476ff : 0x8adfff, 0.08);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      overlay.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  private createForegroundEdgeAtmosphere(): void {
    const edge = this.add.graphics();
    edge.setScrollFactor(0);
    edge.setDepth(VISUAL_DEPTHS.foreground);

    edge.fillStyle(0x020711, 0.28);
    edge.fillRect(0, 0, GAME_WIDTH, 18);
    edge.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);
    edge.fillStyle(0x071524, 0.22);
    edge.fillRect(0, 0, 18, GAME_HEIGHT);
    edge.fillRect(GAME_WIDTH - 18, 0, 18, GAME_HEIGHT);

    edge.lineStyle(1, 0x78eaff, 0.16);
    for (let x = 28; x < GAME_WIDTH; x += 164) {
      edge.lineBetween(x, 4, x + 72, 4);
      edge.lineBetween(x + 18, GAME_HEIGHT - 7, x + 110, GAME_HEIGHT - 7);
    }

    edge.lineStyle(2, 0xffffff, 0.05);
    edge.lineBetween(24, 42, 122, 18);
    edge.lineBetween(GAME_WIDTH - 24, 42, GAME_WIDTH - 122, 18);
  }

  private createForegroundScanlineSweep(): void {
    const scan = this.add.graphics();
    scan.setScrollFactor(0);
    scan.setDepth(VISUAL_DEPTHS.foreground + 1);
    scan.lineStyle(1, 0x9af7ff, 0.045);
    for (let y = 40; y < GAME_HEIGHT - 84; y += 7) {
      scan.lineBetween(20, y, GAME_WIDTH - 20, y);
    }
    scan.fillStyle(0xffffff, 0.035);
    scan.fillRect(0, 128, GAME_WIDTH, 18);

    this.tweens.add({
      targets: scan,
      alpha: 0.42,
      y: 34,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    const groundY = GAME_HEIGHT - 40;
    const color = this.currentStage.platformColor;

    if (this.textures.exists(this.currentStageVisual.groundKey)) {
      this.add.tileSprite(0, groundY - 18, this.currentStage.width, 96, this.currentStageVisual.groundKey)
        .setOrigin(0)
        .setDepth(VISUAL_DEPTHS.ground);
    } else {
      this.groundGraphics = this.add.graphics();
      this.groundGraphics.fillStyle(color);
      this.groundGraphics.fillRect(0, groundY, this.currentStage.width, 40);
      this.groundGraphics.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(15).color);
      this.groundGraphics.fillRect(0, groundY, this.currentStage.width, 4);
      for (let x = 0; x < this.currentStage.width; x += 60) {
        this.groundGraphics.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(10).color);
        this.groundGraphics.fillRect(x + 5, groundY + 8, 50, 2);
      }
    }

    this.createMechanicalForeground(groundY);

    const ground = this.add.rectangle(
      this.currentStage.width / 2,
      groundY + 20,
      this.currentStage.width,
      40,
      0x000000,
      0
    );
    this.platforms.add(ground);

  }

  private createMechanicalForeground(groundY: number): void {
    const metal = this.add.graphics();
    metal.setDepth(VISUAL_DEPTHS.foreground);

    metal.fillStyle(0x07101a, 0.88);
    metal.fillRect(0, groundY - 8, this.currentStage.width, 48);
    metal.fillStyle(0x12384d, 0.9);
    metal.fillRect(0, groundY - 18, this.currentStage.width, 10);
    metal.fillStyle(0x7feaff, 0.22);
    metal.fillRect(0, groundY - 17, this.currentStage.width, 2);

    for (let x = 0; x < this.currentStage.width; x += 150) {
      metal.fillStyle(0x1a2e3a, 0.95);
      metal.fillRect(x + 10, groundY - 2, 92, 18);
      metal.fillStyle(0x020711, 0.72);
      metal.fillRect(x + 104, groundY - 2, 18, 18);
      metal.lineStyle(1, 0x8af0ff, 0.18);
      metal.lineBetween(x + 10, groundY - 2, x + 102, groundY - 2);
    }

    if (this.currentStageVisual.foregroundKey && this.textures.exists(this.currentStageVisual.foregroundKey)) {
      this.add.tileSprite(0, GAME_HEIGHT - 118, this.currentStage.width, 118, this.currentStageVisual.foregroundKey)
        .setOrigin(0)
        .setScrollFactor(0.88)
        .setDepth(VISUAL_DEPTHS.foreground - 1)
        .setAlpha(0.22);
    }
  }

  private createFloatingPlatforms(): void {
    const positions: { x: number; y: number; w: number }[] = [];
    const count = Math.floor(this.currentStage.width / 400);

    for (let i = 0; i < count; i++) {
      positions.push({
        x: 200 + i * 400 + Phaser.Math.Between(-50, 50),
        y: GAME_HEIGHT - 180 - Phaser.Math.Between(0, 120),
        w: Phaser.Math.Between(100, 180),
      });
    }

    for (const pos of positions) {
      if (this.textures.exists(this.currentStageVisual.groundKey)) {
        this.add.tileSprite(pos.x, pos.y - 18, pos.w, 48, this.currentStageVisual.groundKey)
          .setOrigin(0)
          .setDepth(VISUAL_DEPTHS.ground);
      } else {
        const platGfx = this.add.graphics();
        platGfx.fillStyle(this.currentStage.platformColor, 0.8);
        platGfx.fillRoundedRect(0, 0, pos.w, 16, 4);
        platGfx.fillStyle(
          Phaser.Display.Color.IntegerToColor(this.currentStage.platformColor).brighten(20).color,
          0.6
        );
        platGfx.fillRoundedRect(2, 0, pos.w - 4, 4, 2);
        platGfx.setPosition(pos.x, pos.y);
        platGfx.setDepth(VISUAL_DEPTHS.ground);
      }

      const plat = this.add.rectangle(pos.x + pos.w / 2, pos.y + 8, pos.w, 16, 0x000000, 0);
      this.platforms.add(plat);
    }
  }

  private createPlayer(mechaType: MechaType, saveData?: PlayerSaveData): void {
    this.player = new Player(this, 200, GAME_HEIGHT - 120, mechaType);
    const currentSave = this.resolveActiveSaveData(mechaType, saveData);
    if (currentSave.mechaType === mechaType) {
      this.player.applySaveData(currentSave);
    }
    this.physics.add.collider(this.player, this.platforms);
  }

  private resolveActiveSaveData(mechaType: MechaType, saveData?: PlayerSaveData): PlayerSaveData {
    const loadedSave = loadGame();
    const baseSave = saveData
      || (loadedSave?.mechaType === mechaType ? loadedSave : null)
      || (this.activeSaveData?.mechaType === mechaType ? this.activeSaveData : null)
      || createNewSave(mechaType);
    this.activeSaveData = normalizeSaveData(baseSave);
    return this.activeSaveData;
  }

  private buildStageWaves(): StageWave[] {
    const expanded: string[] = [];
    for (const enemyGroup of this.currentStage.enemies) {
      for (let i = 0; i < enemyGroup.count; i++) {
        expanded.push(enemyGroup.id);
      }
    }

    if (expanded.length === 0) return [];

    const waveCount = Math.min(3, Math.max(1, Math.ceil(expanded.length / 4)));
    const waves: StageWave[] = [];

    for (let waveIndex = 0; waveIndex < waveCount; waveIndex++) {
      const start = Math.floor((expanded.length / waveCount) * waveIndex);
      const end = Math.floor((expanded.length / waveCount) * (waveIndex + 1));
      const waveMap = new Map<string, number>();
      for (const enemyId of expanded.slice(start, end)) {
        waveMap.set(enemyId, (waveMap.get(enemyId) || 0) + 1);
      }
      waves.push({
        enemies: Array.from(waveMap.entries()).map(([id, count]) => ({ id, count })),
      });
    }

    return waves;
  }

  private countWaveEnemies(waves: StageWave[]): number {
    return waves.reduce((sum, wave) => sum + wave.enemies.reduce((waveSum, enemy) => waveSum + enemy.count, 0), 0);
  }

  private spawnCurrentWave(): void {
    if (this.stageCleared || this.waveTransitionPending) return;

    const wave = this.stageWaves[this.currentWaveIndex];
    if (!wave) {
      if (this.currentStage.boss && !this.bossSpawned) {
        this.spawnBoss();
      } else {
        this.createExitPortal();
      }
      return;
    }

    this.waveEnemiesKilled = 0;
    this.waveEnemyTarget = wave.enemies.reduce((sum, enemy) => sum + enemy.count, 0);
    const waveNumber = this.currentWaveIndex + 1;
    this.showWaveBanner(waveNumber);
    this.updateWaveObjective();

    let spawnOffset = 0;
    const groundY = GAME_HEIGHT - 80;

    for (const enemyGroup of wave.enemies) {
      for (let i = 0; i < enemyGroup.count; i++) {
        const spawnX = Phaser.Math.Clamp(
          this.player.x + 460 + spawnOffset * 155 + Phaser.Math.Between(-30, 40),
          520,
          this.currentStage.width - 260
        );
        this.spawnEnemy(enemyGroup.id, spawnX, groundY);
        spawnOffset++;
      }
    }
  }

  private spawnEnemy(enemyId: string, x: number, y: number): Enemy | null {
    const enemyInfo = ENEMY_DATABASE.find((e) => e.id === enemyId);
    if (!enemyInfo) return null;

    const textureKey = `enemy_${enemyId}`;
    const enemy = new Enemy(this, x, y, textureKey);
    enemy.initFromData(enemyInfo);
    enemy.setTarget(this.player);
    this.physics.add.collider(enemy, this.platforms);
    this.enemyGroup.add(enemy);
    this.enemies.push(enemy);
    return enemy;
  }

  private setupCollisions(): void {
    this.physics.add.overlap(this.player, this.enemyMeleeGroup, (obj1, obj2) => {
      this.handleEnemyMeleeOverlap(obj1 as Player, obj2 as Phaser.GameObjects.Zone);
    });

    this.physics.add.overlap(this.playerProjectileGroup, this.enemyGroup, (obj1, obj2) => {
      const bullet = obj1 as Phaser.GameObjects.Sprite;
      const enemy = obj2 as Enemy;

      if (bullet.getData('owner') === 'player' && bullet.active && !enemy.isDead()) {
        if (!this.isCombatPlaneOverlap(bullet, enemy)) return;

        const damage = bullet.getData('damage') || 0;
        const hitType = bullet.getData('hitType') || 'basic';
        const sourceKey = bullet.getData('sourceKey') || `projectile-${bullet.name || bullet.texture.key}-${this.time.now}`;
        const comboProtectMs = bullet.getData('comboProtectMs') || (hitType === 'ultimate' ? 42 : 70);
        const dir = enemy.x > this.player.x ? 1 : -1;
        const killed = enemy.takeDamage(damage, dir, { hitType, sourceKey, comboProtectMs });

        if (!enemy.didLastHitConnect()) {
          bullet.destroy();
          return;
        }

        this.damageDealt += damage;
        this.createHitEffect(bullet.x, bullet.y, hitType);
        bullet.destroy();

        if (killed) {
          this.onEnemyKilled(enemy);
        }
      }
    });

    this.physics.add.overlap(this.enemyProjectileGroup, this.player, (obj1, obj2) => {
      const bullet = obj1 as Phaser.GameObjects.Sprite;
      const player = obj2 as Player;

      if (bullet.getData('owner') === 'enemy' && bullet.active) {
        const damage = bullet.getData('damage') || 10;
        const dir = player.x > bullet.x ? 1 : -1;
        player.takeDamage(damage, dir);
        this.screenShake(4, 150);
        bullet.destroy();
      }
    });

    this.physics.add.overlap(this.playerHitboxGroup, this.enemyGroup, (obj1, obj2) => {
      const hitZone = obj1 as Phaser.GameObjects.Zone;
      const enemy = obj2 as Enemy;

      this.handlePlayerHitboxOverlap(hitZone, enemy);
    });

    this.physics.add.overlap(this.player, this.dropGroup, (obj1, obj2) => {
      this.handleDropPickup(obj1 as Player, obj2 as Phaser.GameObjects.Sprite);
    });
  }

  private handleDropPickup(player: Player, dropSprite: Phaser.GameObjects.Sprite): void {
    const dropIdx = this.drops.findIndex(d => d.sprite === dropSprite);
    if (dropIdx < 0 || !dropSprite.active) return;

    const drop = this.drops[dropIdx];
    const pickup = this.getDropPickupFeedback(drop);
    switch (drop.type) {
      case 'gold':
        this.gold += drop.value;
        this.goldText.setText(`${this.gold}`);
        break;
      case 'hp':
        player.heal(drop.value);
        break;
      case 'mp':
        player.restoreMp(drop.value);
        break;
      case 'equip':
        if (drop.equipData) {
          this.player.addToInventory(drop.equipData);
          this.savePlayerData({ collectStageGold: false, markStageComplete: false });
          this.showEquipPickupText(drop.equipData);
        }
        break;
    }

    this.tweens.killTweensOf(dropSprite);
    this.showWorldPickupText(dropSprite.x, dropSprite.y - 18, pickup.label, pickup.color);
    this.getUIScene().showPickupNotice?.(pickup.label, pickup.color);
    this.dropGroup.remove(dropSprite);
    this.tweens.add({
      targets: dropSprite,
      y: dropSprite.y - 30,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => {
        this.drops.splice(dropIdx, 1);
        dropSprite.destroy();
      },
    });
  }

  private onEnemyKilled(enemy: Enemy): void {
    this.enemiesKilled++;
    this.waveEnemiesKilled++;
    this.player.gainXp(enemy.xpReward);
    const isBoss = this.bossRef === enemy;
    this.spawnDrops(enemy.x, enemy.y, enemy.xpReward, isBoss);
    this.screenShake(5, 150);
    this.updateWaveObjective();

    if (isBoss) {
      this.bossRef = null;
      this.clearBossSummons();
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.hideBossHp) uiScene.hideBossHp();
    }

    this.checkStageProgress();
  }

  private handleEnemyMeleeOverlap(player: Player, hitZone: Phaser.GameObjects.Zone): void {
    if (hitZone.getData('owner') !== 'enemy' || !hitZone.active || hitZone.getData('hitPlayer')) return;
    if (!this.isCombatPlaneOverlap(hitZone, player)) return;

    const source = hitZone.getData('source') as Enemy | undefined;
    if (source?.isDead()) return;

    hitZone.setData('hitPlayer', true);
    const damage = hitZone.getData('damage') || 10;
    const dir = player.x > hitZone.x ? 1 : -1;
    const accepted = player.takeDamage(damage, dir);
    const baseRecoveryMs = hitZone.getData('recoveryMs') || source?.attackRecoveryMs || 0;
    const retreatDir = -dir;
    if (!accepted) {
      source?.enterPostAttackRecovery(baseRecoveryMs, retreatDir);
      return;
    }

    source?.enterPostAttackRecovery(baseRecoveryMs + HIT_CONFIRMED_RECOVERY_BONUS_MS, retreatDir);

    this.createHitEffect(player.x, player.y - 20);
    this.screenShake(hitZone.getData('shakeIntensity') || 3, hitZone.getData('shakeDuration') || 100);
  }

  private clearBossSummons(): void {
    for (const enemy of this.enemies) {
      if (!enemy.getData('summonedByBoss') || !enemy.active || enemy.isDead()) continue;
      this.enemyGroup.remove(enemy);
      enemy.removeWithoutReward();
    }
    this.enemies = this.enemies.filter((enemy) => enemy.active);
  }

  private getUIScene(): CombatUiScene {
    return this.scene.get('UIScene') as CombatUiScene;
  }

  private updateObjectiveProgress(completed: boolean = false): void {
    const uiScene = this.getUIScene();
    uiScene.updateObjectiveProgress?.(this.enemiesKilled, this.totalEnemies, completed);
    if (completed) {
      uiScene.showPickupNotice?.('区域清理完成', '#55ff99');
    }
  }

  private updateWaveObjective(): void {
    const uiScene = this.getUIScene();
    if (this.exitPortal) {
      uiScene.updateObjectiveProgress?.(this.totalEnemies, this.totalEnemies, true);
      uiScene.showPickupNotice?.('前往出口', '#66e7ff');
      this.enemyCountText?.setText('出口已开启');
      return;
    }

    const target = Math.max(1, this.waveEnemyTarget);
    const killed = Math.min(this.waveEnemiesKilled, target);
    uiScene.updateObjectiveProgress?.(killed, target, false);
    this.enemyCountText?.setText(`敌人: ${Math.max(0, target - killed)}`);
  }

  private getDropPickupFeedback(drop: DropItem): { label: string; color: string } {
    switch (drop.type) {
      case 'gold':
        return { label: `金币 +${drop.value}`, color: '#ffdd44' };
      case 'hp':
        return { label: `HP +${drop.value}`, color: '#55ff77' };
      case 'mp':
        return { label: `MP +${drop.value}`, color: '#66ccff' };
      case 'equip':
        return drop.equipData ? this.getEquipDropLabel(drop.equipData) : { label: '获得装备', color: '#b985ff' };
    }
  }

  private getEquipDropLabel(equip: EquipData): { label: string; color: string } {
    const rarityName = RARITY_NAMES[equip.rarity] || '装备';
    const color = '#' + (RARITY_COLORS[equip.rarity] || equip.color || 0xb985ff).toString(16).padStart(6, '0');
    return { label: `${rarityName}装备 ${equip.name}`, color };
  }

  private showWorldPickupText(x: number, y: number, label: string, color: string): void {
    const popup = this.createFlashPopupFrame(
      x - 82,
      y - 18,
      164,
      34,
      VISUAL_DEPTHS.feedback - 1,
      Phaser.Display.Color.HexStringToColor(color).color,
      false
    );
    const text = this.add.text(x, y, label, {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(VISUAL_DEPTHS.feedback);

    this.tweens.add({
      targets: [popup, text],
      y: '-=42',
      alpha: 0,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => {
        popup.destroy();
        text.destroy();
      },
    });
  }

  private addDropAttractFeedback(sprite: Phaser.GameObjects.Sprite, color: number, baseScale: number): void {
    sprite.setTint(color);
    this.tweens.add({
      targets: sprite,
      scaleX: baseScale * 1.16,
      scaleY: baseScale * 1.16,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnDrops(x: number, y: number, xpReward: number, isBoss: boolean = false): void {
    const goldAmount = Math.floor(xpReward * 0.5) + Phaser.Math.Between(1, 10);
    this.createDrop(x + Phaser.Math.Between(-20, 20), y - 20, 'gold', goldAmount);

    if (isBoss || Phaser.Math.Between(1, 100) <= 20) {
      this.createDrop(x + Phaser.Math.Between(-30, 30), y - 20, 'hp', isBoss ? 200 : 50);
    }

    if (isBoss || Phaser.Math.Between(1, 100) <= 15) {
      this.createDrop(x + Phaser.Math.Between(-30, 30), y - 20, 'mp', isBoss ? 100 : 20);
    }

    if (isBoss) {
      this.spawnEquipDrop(x, y - 30);
    } else if (Phaser.Math.Between(1, 100) <= 8) {
      this.spawnEquipDrop(x, y - 20);
    }
  }

  private spawnEquipDrop(x: number, y: number): void {
    const playerLevel = this.player.level;
    const candidateEquips = EQUIP_DATABASE.filter(
      (e) => e.level <= playerLevel + 2 && e.level >= Math.max(1, playerLevel - 2)
    );
    if (candidateEquips.length === 0) return;

    const equip = Phaser.Utils.Array.GetRandom(candidateEquips);

    const g = this.add.graphics();
    g.fillStyle(RARITY_COLORS[equip.rarity] || 0x9944ff);
    g.fillRoundedRect(0, 0, 20, 20, 4);
    g.lineStyle(2, equip.color || 0xffffff);
    g.strokeRoundedRect(0, 0, 20, 20, 4);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(6, 4, 2, 12);
    g.fillRect(4, 8, 12, 2);
    const textureKey = `drop_equip_${equip.id}_${Date.now()}`;
    g.generateTexture(textureKey, 20, 20);
    g.destroy();

    const sprite = this.physics.add.sprite(x, y - 18, textureKey);
    sprite.setDepth(VISUAL_DEPTHS.drop);
    sprite.setScale(1.5);
    this.addDropAttractFeedback(sprite, equip.color || 0xffffff, 1.5);
    this.settleDropSprite(sprite, y + 10, 5000);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(20, 20);

    this.tweens.add({
      targets: sprite,
      alpha: 0.6,
      duration: 400,
      yoyo: true,
      repeat: 3,
      delay: 5000,
      onComplete: () => {
        if (sprite.active) {
          const idx = this.drops.findIndex(d => d.sprite === sprite);
          if (idx >= 0) this.drops.splice(idx, 1);
          sprite.destroy();
        }
      },
    });

    this.dropGroup.add(sprite);
    this.drops.push({ sprite, type: 'equip', value: 0, equipData: equip });
  }

  private createDrop(x: number, y: number, type: 'gold' | 'hp' | 'mp', value: number): void {
    const colorMap = { gold: 0xffdd44, hp: 0x44ff44, mp: 0x4488ff };
    const sizeMap = { gold: 8, hp: 10, mp: 10 };

    const g = this.add.graphics();
    g.fillStyle(colorMap[type]);
    g.fillCircle(sizeMap[type], sizeMap[type], sizeMap[type]);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(sizeMap[type] - 2, sizeMap[type] - 2, sizeMap[type] / 2);
    const textureKey = `drop_${type}_${value}_${Date.now()}`;
    g.generateTexture(textureKey, sizeMap[type] * 2, sizeMap[type] * 2);
    g.destroy();

    const sprite = this.physics.add.sprite(x, y - 14, textureKey);
    sprite.setDepth(VISUAL_DEPTHS.drop);
    sprite.setScale(1.2);
    this.addDropAttractFeedback(sprite, colorMap[type], 1.2);
    this.settleDropSprite(sprite, y + 10, 3000);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(sizeMap[type] * 2, sizeMap[type] * 2);

    this.tweens.add({
      targets: sprite,
      alpha: 0.6,
      duration: 400,
      yoyo: true,
      repeat: 3,
      delay: 3000,
      onComplete: () => {
        if (sprite.active) {
          const idx = this.drops.findIndex(d => d.sprite === sprite);
          if (idx >= 0) this.drops.splice(idx, 1);
          sprite.destroy();
        }
      },
    });

    this.dropGroup.add(sprite);
    this.drops.push({ sprite, type, value });
  }

  private settleDropSprite(sprite: Phaser.Physics.Arcade.Sprite, settleY: number, cleanupDelay: number): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.setImmovable(true);

    this.tweens.add({
      targets: sprite,
      y: settleY,
      duration: 520,
      ease: 'Bounce.easeOut',
      onUpdate: () => {
        body.updateFromGameObject();
      },
      onComplete: () => {
        body.setVelocity(0, 0);
        body.updateFromGameObject();
      },
    });

    sprite.setData('cleanupDelay', cleanupDelay);
  }

  private createHitEffect(x: number, y: number, hitType: EnemyHitReaction['hitType'] = 'basic'): void {
    const effect = this.createWorldSpaceFlashEffect(x, y, hitType);

    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: hitType === 'ultimate' ? 2.7 : hitType === 'skill' ? 2.25 : 1.85,
      scaleY: hitType === 'ultimate' ? 2.7 : hitType === 'skill' ? 2.25 : 1.85,
      duration: hitType === 'ultimate' ? 260 : hitType === 'skill' ? 210 : 150,
      onComplete: () => effect.destroy(),
    });
  }

  private createWorldSpaceFlashEffect(
    x: number,
    y: number,
    hitType: EnemyHitReaction['hitType'] = 'basic'
  ): Phaser.GameObjects.Sprite {
    const effectKey = this.textures.exists('visual_fx_burst') ? 'visual_fx_burst' : 'fx_hit';
    const impactOffsetY = hitType === 'ultimate' ? -28 : hitType === 'skill' ? -18 : -10;
    const effect = this.add.sprite(x, y + impactOffsetY, effectKey);
    const scale = hitType === 'ultimate' ? 0.52 : hitType === 'skill' ? 0.38 : 0.28;
    effect.setDepth(VISUAL_DEPTHS.effect);
    effect.setScale(effectKey === 'visual_fx_burst' ? scale : scale * 4);
    effect.setBlendMode(Phaser.BlendModes.ADD);
    effect.setTint(hitType === 'ultimate' ? 0xffffff : hitType === 'skill' ? 0x66e7ff : 0xffdd44);
    return effect;
  }

  private screenShake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  public getEnemyMeleeGroup(): Phaser.Physics.Arcade.Group {
    return this.enemyMeleeGroup;
  }

  public createEnemyMeleeHitbox(
    x: number,
    y: number,
    width: number,
    height: number,
    damage: number,
    activeMs: number,
    owner: Enemy,
    attackId: string,
    recoveryMs: number = owner.attackRecoveryMs
  ): void {
    const hitZone = this.add.zone(x, y, width, height);
    this.physics.add.existing(hitZone);
    hitZone.setData('owner', 'enemy');
    hitZone.setData('source', owner);
    hitZone.setData('attackId', attackId);
    hitZone.setData('damage', damage);
    hitZone.setData('shakeIntensity', attackId === 'void_beam' ? 7 : 3);
    hitZone.setData('shakeDuration', attackId === 'void_beam' ? 220 : 100);
    hitZone.setData('recoveryMs', recoveryMs);
    hitZone.setData('activeWindowMs', activeMs);
    hitZone.setData('combatYTolerance', attackId === 'void_beam' ? 58 : Math.max(36, Math.floor(height * 0.48)));
    (hitZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (hitZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    this.enemyMeleeGroup.add(hitZone);
    this.physics.add.overlap(this.player, hitZone, (obj1, obj2) => {
      this.handleEnemyMeleeOverlap(obj1 as Player, obj2 as Phaser.GameObjects.Zone);
    });

    this.time.delayedCall(activeMs, () => {
      this.enemyMeleeGroup.remove(hitZone, true, true);
    });
  }

  private getCombatBounds(target: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle {
    const body = (target as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    }
    return (target as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
  }

  private isCombatPlaneOverlap(hitZone: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject): boolean {
    const hitBounds = this.getCombatBounds(hitZone);
    const targetBounds = this.getCombatBounds(target);
    const overlapTop = Math.max(hitBounds.top, targetBounds.top);
    const overlapBottom = Math.min(hitBounds.bottom, targetBounds.bottom);
    const verticalOverlap = Math.max(0, overlapBottom - overlapTop);
    const verticalOverlapRatio = verticalOverlap / Math.max(1, Math.min(hitBounds.height, targetBounds.height));
    const combatYTolerance = hitZone.getData('combatYTolerance') ?? 34;
    const centerYDelta = Math.abs(hitBounds.centerY - targetBounds.centerY);
    const footYDelta = Math.abs(hitBounds.bottom - targetBounds.bottom);

    return verticalOverlapRatio >= 0.22 || centerYDelta <= combatYTolerance || footYDelta <= combatYTolerance;
  }

  private applyHitStop(duration: number): void {
    if (duration <= 0 || this.physics.world.isPaused) return;

    this.physics.world.pause();
    this.tweens.pauseAll();
    this.hitStopTimer?.remove(false);
    this.hitStopTimer = this.time.delayedCall(duration, () => {
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.hitStopTimer = undefined;
    });
  }

  private setupPlayerCallbacks(): void {
    this.player.onLevelUp = (level: number) => {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.updateLevel) uiScene.updateLevel(level);
      this.screenShake(8, 300);
    };

    this.player.onHpChange = (hp: number, maxHp: number) => {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.updateHp) uiScene.updateHp(hp, maxHp);
    };

    this.player.onMpChange = (mp: number, maxMp: number) => {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.updateMp) uiScene.updateMp(mp, maxMp);
    };

    this.player.onXpChange = (xp: number, xpToNext: number) => {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.updateXp) uiScene.updateXp(xp, xpToNext);
    };

    this.player.onProgressionChange = () => {
      this.savePlayerData({ collectStageGold: false, markStageComplete: false });
    };

    this.player.onComboChange = (combo: number) => {
      if (combo > this.maxCombo) this.maxCombo = combo;

      if (combo > 1) {
        const comboColors = ['#ffdd44', '#ff8844', '#ff4444', '#ff44ff', '#44ffff'];
        const colorIdx = Math.min(Math.floor(combo / 5), comboColors.length - 1);

        this.comboText.setText(`${combo} COMBO!`);
        this.comboText.setColor(comboColors[colorIdx]);
        this.comboText.setAlpha(1);
        this.comboText.setScale(1 + Math.min(combo * 0.08, 0.8));
        this.comboTimer = 2000;

        this.tweens.add({
          targets: this.comboText,
          scaleX: 1 + Math.min(combo * 0.03, 0.4),
          scaleY: 1 + Math.min(combo * 0.03, 0.4),
          duration: 200,
          ease: 'Back.easeOut',
        });

        if (combo >= 10) {
          this.screenShake(2, 80);
        }
      }
    };

    this.player.onSkillCast = (skill) => {
      this.getUIScene().flashSkillSlot?.(skill.id, 'success');
    };

    this.player.onSkillFailure = (skill, _slotIndex, reason) => {
      const message = reason === 'mp' ? 'MP不足' : reason === 'cooldown' ? '技能冷却中' : '技能释放中';
      this.getUIScene().showSkillFailure?.(skill?.id, message);
    };
  }

  private createStageUI(): void {
    if (this.textures.exists('visual_ui_panel')) {
      this.add.image(GAME_WIDTH / 2, 33, 'visual_ui_panel')
        .setDisplaySize(430, 48)
        .setScrollFactor(0)
        .setDepth(49)
        .setAlpha(0.86);
    }

    this.stageText = this.add.text(GAME_WIDTH / 2, 30, this.currentStage.name, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#88aacc',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.comboText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffdd44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setAlpha(0);

    this.enemyCountText = this.add.text(GAME_WIDTH - 20, 30, '', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff6644',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1).setScrollFactor(0).setDepth(50);

    this.goldText = this.add.text(GAME_WIDTH - 20, 55, '0', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1).setScrollFactor(0).setDepth(50);

    this.add.text(GAME_WIDTH - 55, 55, 'G', {
      fontSize: '14px',
      fontFamily: 'Arial Black',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1).setScrollFactor(0).setDepth(50);
  }

  private createFlashPopupFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    accent: number,
    fixedToCamera: boolean
  ): Phaser.GameObjects.Graphics {
    const frame = this.add.graphics().setDepth(depth);
    if (fixedToCamera) frame.setScrollFactor(0);
    frame.fillStyle(0x030711, 0.88);
    frame.fillRect(x, y, width, height);
    frame.fillStyle(0x0d1f33, 0.82);
    frame.fillRect(x + 5, y + 5, width - 10, height - 10);
    frame.fillStyle(accent, 0.14);
    frame.fillRect(x + 10, y + 10, width - 20, height - 20);
    frame.lineStyle(2, accent, 0.72);
    frame.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    frame.lineStyle(1, 0xffffff, 0.18);
    frame.strokeRect(x + 7.5, y + 7.5, width - 15, height - 15);
    frame.fillStyle(accent, 0.66);
    frame.fillRect(x + 14, y + 6, 64, 2);
    frame.fillRect(x + width - 78, y + height - 8, 64, 2);
    frame.lineStyle(1, 0x92f9ff, 0.08);
    for (let sy = y + 14; sy < y + height - 10; sy += 5) {
      frame.lineBetween(x + 12, sy, x + width - 12, sy);
    }
    return frame;
  }

  private showFlashPanelNotice(message: string, color: string, y: number, duration: number): void {
    const accent = Phaser.Display.Color.HexStringToColor(color).color;
    const frame = this.createFlashPopupFrame(GAME_WIDTH / 2 - 232, y - 28, 464, 58, VISUAL_DEPTHS.fixedNotice, accent, true).setAlpha(0);
    const text = this.add.text(GAME_WIDTH / 2, y, message, {
      fontSize: message.length > 22 ? '18px' : '28px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(VISUAL_DEPTHS.fixedNotice + 1).setAlpha(0);

    this.tweens.add({
      targets: [frame, text],
      alpha: 1,
      y: '+=14',
      duration: 180,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: duration,
      onComplete: () => {
        frame.destroy();
        text.destroy();
      },
    });
  }

  private showBossEntrancePanel(bossData: BossData): void {
    const y = 154;
    const frame = this.createFlashPopupFrame(GAME_WIDTH / 2 - 250, y - 42, 500, 86, 100, 0xff455f, true);
    const title = this.add.text(GAME_WIDTH / 2, y - 12, 'BOSS 出现', {
      fontSize: '34px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff4c64',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    const name = this.add.text(GAME_WIDTH / 2, y + 22, bossData.name, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd66e',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.tweens.add({
      targets: [frame, title, name],
      alpha: 0,
      delay: 1700,
      duration: 600,
      ease: 'Sine.easeIn',
      onComplete: () => {
        frame.destroy();
        title.destroy();
        name.destroy();
      },
    });
  }

  private checkStageProgress(): void {
    const aliveEnemies = this.enemies.filter((e) => e.active && !e.isDead());

    if (aliveEnemies.length > 0 || this.waveTransitionPending || this.exitPortal) {
      return;
    }

    if (this.currentWaveIndex < this.stageWaves.length - 1) {
      this.scheduleNextWave();
      return;
    }

    if (this.currentStage.boss && !this.bossSpawned) {
      this.spawnBoss();
      return;
    }

    this.createExitPortal();
  }

  private scheduleNextWave(): void {
    this.waveTransitionPending = true;
    this.getUIScene().showPickupNotice?.('下一波敌人接近', '#ffdd66');
    this.time.delayedCall(1200, () => {
      this.currentWaveIndex++;
      this.waveTransitionPending = false;
      this.spawnCurrentWave();
    });
  }

  private showWaveBanner(waveNumber: number): void {
    this.showFlashPanelNotice(`第${waveNumber}波 敌人来袭`, '#66e7ff', GAME_HEIGHT / 2 - 154, 980);
  }

  private spawnBoss(): void {
    this.bossSpawned = true;

    const bossData = BOSS_DATABASE.find((b) => b.id === this.currentStage.boss);
    if (!bossData) {
      this.createExitPortal();
      return;
    }

    this.cameras.main.flash(500, 255, 0, 0);
    this.screenShake(10, 500);

    this.showBossEntrancePanel(bossData);

    const textureKey = `boss_${bossData.id}`;
    const boss = new Enemy(this, this.currentStage.width - 200, GAME_HEIGHT - 120, textureKey);
    boss.initFromData(bossData);
    boss.setScale(1.5);
    boss.setData('isBoss', true);
    boss.setData('superArmor', true);
    boss.setTarget(this.player);
    this.physics.add.collider(boss, this.platforms);
    this.enemyGroup.add(boss);
    this.enemies.push(boss);
    this.bossRef = boss;
    this.bossSpecialCooldown = 1600;
    this.bossSpecialIndex = 0;
    this.waveEnemiesKilled = 0;
    this.waveEnemyTarget = 1;
    this.updateWaveObjective();

    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene.showBossHp) {
      uiScene.showBossHp(bossData.name, bossData.hp, bossData.hp);
    }
  }

  private updateBossSkills(delta: number): void {
    if (!this.bossRef || !this.bossRef.active || this.bossRef.isDead() || this.stageCleared) return;

    this.bossSpecialCooldown -= delta;
    if (this.bossSpecialCooldown > 0) return;

    this.tryCastBossSpecial();
  }

  private tryCastBossSpecial(): void {
    const boss = this.bossRef;
    if (!boss) return;

    const bossData = BOSS_DATABASE.find((b) => b.id === boss.enemyId);
    const specialAttacks = bossData?.specialAttacks ?? [];
    if (specialAttacks.length === 0) {
      this.bossSpecialCooldown = 2500;
      return;
    }

    const skillId = specialAttacks[this.bossSpecialIndex % specialAttacks.length];
    this.bossSpecialIndex++;

    if (skillId === 'void_beam') {
      this.castVoidBeam(boss);
      this.bossSpecialCooldown = 4400;
    } else if (skillId === 'summon_drones') {
      this.castSummonDrones(boss);
      this.bossSpecialCooldown = 5200;
    } else {
      this.bossSpecialCooldown = 1800;
    }
  }

  private castVoidBeam(boss: Enemy): void {
    const direction = this.player.x >= boss.x ? 1 : -1;
    const beamLength = 560;
    const beamHeight = 82;
    const startX = boss.x + direction * 42;
    const centerX = startX + direction * beamLength * 0.5;
    const centerY = boss.y - 18;

    const telegraph = this.createBossAttackWarning(
      direction > 0 ? startX : startX - beamLength,
      centerY - beamHeight / 2,
      beamLength,
      beamHeight,
      0xff2255
    );

    this.time.delayedCall(BOSS_VOID_BEAM_WARNING_MS, () => {
      if (!boss.active || boss.isDead()) {
        telegraph.destroy();
        return;
      }

      const beamDamage = Math.floor(boss.attack * 1.35);
      this.createEnemyMeleeHitbox(centerX, centerY, beamLength, beamHeight, beamDamage, BOSS_VOID_BEAM_ACTIVE_MS, boss, 'void_beam', 620);
      const beam = this.add.rectangle(centerX, centerY, beamLength, beamHeight * 0.72, 0xff2255, 0.45)
        .setDepth(17)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: beam,
        alpha: 0,
        scaleY: 1.35,
        duration: BOSS_VOID_BEAM_ACTIVE_MS,
        onComplete: () => beam.destroy(),
      });
      telegraph.destroy();
      this.screenShake(7, 220);
    });
  }

  private createBossAttackWarning(x: number, y: number, width: number, height: number, color: number): Phaser.GameObjects.Graphics {
    const warning = this.add.graphics().setDepth(VISUAL_DEPTHS.warning);
    warning.setData('warningOnly', true);
    warning.fillStyle(color, 0.18);
    warning.fillRect(x, y, width, height);
    warning.lineStyle(5, color === 0xff2255 ? 0xff2255 : color, 0.9);
    warning.strokeRect(x, y, width, height);
    warning.lineStyle(1, 0xffffff, 0.72);
    warning.strokeRect(x + 5, y + 5, Math.max(0, width - 10), Math.max(0, height - 10));
    warning.lineStyle(1, 0xffffff, 0.42);
    for (let stripeX = x + 18; stripeX < x + width; stripeX += 42) {
      warning.lineBetween(stripeX, y, Math.min(stripeX + 28, x + width), y + height);
    }

    this.tweens.add({
      targets: warning,
      alpha: 0.18,
      duration: 90,
      yoyo: true,
      repeat: 7,
    });

    return warning;
  }

  private castSummonDrones(boss: Enemy): void {
    const existingSummons = this.enemies.filter((enemy) => enemy.active && !enemy.isDead() && enemy.getData('summonedByBoss')).length;
    const summonCount = Math.max(0, Math.min(2, 3 - existingSummons));

    for (let i = 0; i < summonCount; i++) {
      const offset = i === 0 ? -120 : 120;
      const x = Phaser.Math.Clamp(boss.x + offset, 180, this.currentStage.width - 180);
      const drone = this.spawnEnemy('drone', x, GAME_HEIGHT - 80);
      drone?.setData('summonedByBoss', true);
      drone?.setTint(0xff66aa);
    }

    const pulse = this.add.circle(boss.x, boss.y - 20, 26, 0xff66aa, 0.22).setDepth(VISUAL_DEPTHS.effect);
    this.tweens.add({
      targets: pulse,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 420,
      onComplete: () => pulse.destroy(),
    });
  }

  private createExitPortal(): void {
    if (this.exitPortal || this.stageCleared) return;

    this.updateObjectiveProgress(true);
    const portalX = Math.min(this.currentStage.width - 180, Math.max(this.player.x + 360, 720));
    const portalY = GAME_HEIGHT - 118;

    const portal = this.add.container(portalX, portalY).setDepth(18);
    const glow = this.add.ellipse(0, 0, 82, 132, 0x28e8ff, 0.22);
    const core = this.add.ellipse(0, 0, 48, 102, 0xffffff, 0.16);
    const ring = this.add.graphics();
    ring.lineStyle(3, 0x66e7ff, 0.85);
    ring.strokeEllipse(0, 0, 82, 132);
    ring.lineStyle(1, 0xffffff, 0.55);
    ring.strokeEllipse(0, 0, 54, 104);
    const label = this.add.text(0, 86, '出口', {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#66e7ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    portal.add([glow, core, ring, label]);

    this.exitPortal = portal;
    this.exitPortalZone = this.add.zone(portalX, portalY, 96, 150);
    this.physics.add.existing(this.exitPortalZone, true);
    this.physics.add.overlap(this.player, this.exitPortalZone, () => this.handleExitPortalOverlap());

    this.tweens.add({
      targets: [glow, core],
      scaleX: 1.18,
      scaleY: 1.08,
      alpha: 0.34,
      yoyo: true,
      repeat: -1,
      duration: 760,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: portal,
      y: portalY - 8,
      yoyo: true,
      repeat: -1,
      duration: 980,
      ease: 'Sine.easeInOut',
    });
  }
  private handleExitPortalOverlap(): void {
    if (this.stageCleared) return;
    this.exitPortalZone?.destroy();
    this.exitPortalZone = undefined;
    this.stageClear();
  }

  private stageClear(): void {
    if (this.stageCleared) return;
    this.stageCleared = true;

    const elapsed = this.time.now - this.stageStartTime;
    const timeSeconds = Math.floor(elapsed / 1000);

    const rating = this.calculateRating(timeSeconds);

    this.cameras.main.flash(500, 255, 255, 200);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(99);
    this.createFlashPopupFrame(GAME_WIDTH / 2 - 310, GAME_HEIGHT / 2 - 152, 620, 322, 100, 0xffdd44, true);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '关卡通过！', {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffdd44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    const ratingColors: Record<string, string> = { S: '#ffdd44', A: '#44ff88', B: '#4488ff', C: '#aaaaaa' };
    const ratingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `评级: ${rating}`, {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: ratingColors[rating] || '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.tweens.add({
      targets: ratingText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
      `用时: ${timeSeconds}s  |  击杀: ${this.enemiesKilled}  |  最高连击: ${this.maxCombo}  |  总伤害: ${this.damageDealt}`,
      {
        fontSize: '14px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#88aacc',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    const stageGold = this.gold;
    const rewardEquip = this.grantStageEquipmentReward(rating);
    const rewardEquipLabel = rewardEquip ? `${RARITY_NAMES[rewardEquip.rarity] || '装备'} ${rewardEquip.name}` : '无装备掉落';
    const rewardText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20,
      `经验 +${this.currentStage.xpReward}  金币 +${this.gold}  装备: ${rewardEquipLabel}`,
      {
        fontSize: '18px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ffdd44',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.player.gainXp(this.currentStage.xpReward);
    const clearedSave = this.savePlayerData({ collectStageGold: true, markStageComplete: true });
    this.showRewardToast(this.currentStage.xpReward, stageGold, rewardEquip);

    const nextStage = this.getNextStage();

    if (nextStage) {
      const nextBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, '[ 进入下一关 ]', {
        fontSize: '22px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#4488ff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

      nextBtn.on('pointerdown', () => {
        const latestSave = clearedSave || normalizeSaveData(loadGame() || createNewSave(this.player.mechaType));
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.stop('UIScene');
          this.scene.restart({
            mechaType: latestSave.mechaType,
            stageId: nextStage.id,
            saveData: latestSave,
          });
        });
      });
    } else {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, '恭喜通关！银河联盟胜利！', {
        fontSize: '22px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#44ff88',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    const hubBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, '[ 返回基地 ]', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffaa44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

    hubBtn.on('pointerdown', () => {
      const latestSave = this.savePlayerData({ markStageCompleted: true })
        || normalizeSaveData(loadGame() || createNewSave(this.player.mechaType));
      this.scene.stop('UIScene');
      this.scene.start('HubScene', { saveData: latestSave });
    });

    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 145, '[ 返回主菜单 ]', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#667788',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('MainMenuScene');
    });
  }

  private getNextStage(): StageData | undefined {
    const currentStageIdx = STAGE_DATABASE.findIndex((stage) => stage.id === this.currentStage.id);
    const nextStage = STAGE_DATABASE[currentStageIdx + 1];
    if (!this.currentStage.nextStageId) return nextStage;
    return STAGE_DATABASE.find((stage) => stage.id === this.currentStage.nextStageId) || nextStage;
  }

  private calculateRating(timeSeconds: number): string {
    let score = 100;

    if (this.player.hp < this.player.maxHp * 0.3) score -= 30;
    else if (this.player.hp < this.player.maxHp * 0.6) score -= 15;

    if (timeSeconds > 120) score -= 20;
    else if (timeSeconds > 90) score -= 10;

    if (this.maxCombo >= 20) score += 15;
    else if (this.maxCombo >= 10) score += 10;
    else if (this.maxCombo >= 5) score += 5;

    if (score >= 90) return 'S';
    if (score >= 70) return 'A';
    if (score >= 50) return 'B';
    return 'C';
  }

  private grantStageEquipmentReward(rating: string): EquipData | null {
    const rewardChance = rating === 'S' ? 60 : rating === 'A' ? 45 : rating === 'B' ? 30 : 20;
    if (Phaser.Math.Between(1, 100) > rewardChance) return null;

    const candidateEquips = EQUIP_DATABASE.filter(
      (e) => (!e.mechaType || e.mechaType === this.player.mechaType) && e.level <= this.player.level + 3
    );
    if (candidateEquips.length === 0) return null;

    const sorted = [...candidateEquips].sort((a, b) => RARITY_LEVEL[b.rarity] - RARITY_LEVEL[a.rarity]);
    const rewardEquip = Phaser.Utils.Array.GetRandom(sorted.slice(0, Math.min(sorted.length, 12)));
    this.player.addToInventory(rewardEquip);
    this.getUIScene().showPickupNotice?.(this.getEquipDropLabel(rewardEquip).label, this.getEquipDropLabel(rewardEquip).color);
    return rewardEquip;
  }

  private gameOver(): void {
    if (this.gameOverShown) return;
    this.gameOverShown = true;

    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.7
    ).setScrollFactor(0).setDepth(100);
    this.createFlashPopupFrame(GAME_WIDTH / 2 - 260, GAME_HEIGHT / 2 - 92, 520, 234, 101, 0xff455f, true);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '战斗失败', {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
      `击杀: ${this.enemiesKilled}  最高连击: ${this.maxCombo}  总伤害: ${this.damageDealt}`,
      {
        fontSize: '14px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#88aacc',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const retryBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '[ 重新挑战 ]', {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#4488ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      const retrySave = this.savePlayerData({ markStageCompleted: false })
        || normalizeSaveData(loadGame() || createNewSave(this.player.mechaType));
      this.scene.stop('UIScene');
      this.scene.restart({
        mechaType: retrySave.mechaType,
        stageId: this.currentStage.id,
        saveData: retrySave,
      });
    });

    const hubBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 85, '[ 返回基地 ]', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffaa44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    hubBtn.on('pointerdown', () => {
      const latestSave = this.savePlayerData({ markStageCompleted: false })
        || normalizeSaveData(loadGame() || createNewSave(this.player.mechaType));
      this.scene.stop('UIScene');
      this.scene.start('HubScene', { saveData: latestSave });
    });

    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, '[ 返回主菜单 ]', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#667788',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('MainMenuScene');
    });
  }
  update(time: number, delta: number): void {
    if (!this.player) return;

    this.player.update(delta);
    this.player.updateSkillCooldowns(delta);

    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene.updateSkillCooldowns) {
      uiScene.updateSkillCooldowns(this.player.getSkillCooldowns(), this.player.mp);
    }

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(delta);
      }
    }

    this.enemies = this.enemies.filter((e) => e.active);

    const aliveCount = this.enemies.filter(e => !e.isDead()).length;
    if (this.exitPortal) {
      this.enemyCountText.setText('出口已开启');
    } else {
      this.enemyCountText.setText(`敌人: ${aliveCount}`);
    }

    this.updateScreenShake(delta);

    if (this.bossRef && this.bossRef.active && !this.bossRef.isDead()) {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene.updateBossHp) {
        uiScene.updateBossHp(this.bossRef.hp, this.bossRef.maxHp);
      }
    }

    this.updateBossSkills(delta);

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboText.setAlpha(0);
      }
    }

    if (this.player.isDead() && !this.stageCleared) {
      this.time.delayedCall(1500, () => {
        if (!this.stageCleared) this.gameOver();
      });
    }
  }
  private updateScreenShake(delta: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;

      const offsetX = Phaser.Math.FloatBetween(-this.shakeIntensity, this.shakeIntensity);
      const offsetY = Phaser.Math.FloatBetween(-this.shakeIntensity, this.shakeIntensity);
      this.cameras.main.setScroll(
        this.cameras.main.scrollX + offsetX,
        this.cameras.main.scrollY + offsetY
      );
    }
  }

  public getPlayerProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.playerProjectileGroup;
  }

  public getEnemyProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.enemyProjectileGroup;
  }

  public getPlayerHitboxGroup(): Phaser.Physics.Arcade.Group {
    return this.playerHitboxGroup;
  }

  public registerPlayerHitbox(hitbox: Phaser.GameObjects.GameObject): void {
    this.playerHitboxGroup.add(hitbox);
    this.physics.add.overlap(hitbox, this.enemyGroup, (obj1, obj2) => {
      this.handlePlayerHitboxOverlap(obj1 as Phaser.GameObjects.Zone, obj2 as Enemy);
    });
  }

  private handlePlayerHitboxOverlap(hitZone: Phaser.GameObjects.Zone, enemy: Enemy): void {
    if (hitZone.getData('owner') !== 'player' || !hitZone.active || enemy.isDead()) return;
    if (!this.isCombatPlaneOverlap(hitZone, enemy)) return;

    const hitEnemies = hitZone.getData('hitEnemies') as Set<Enemy> | undefined;
    if (hitEnemies?.has(enemy)) return;
    hitEnemies?.add(enemy);

    const damage = hitZone.getData('damage') || 0;
    const reaction = hitZone.getData('reaction') as EnemyHitReaction | undefined;
    const hitStopMs = hitZone.getData('hitStopMs') || 0;
    const shakeIntensity = hitZone.getData('shakeIntensity') || 0;
    const shakeDuration = hitZone.getData('shakeDuration') || 0;
    const hitType = hitZone.getData('hitType') || 'basic';
    const sourceKey = hitZone.getData('sourceKey') || `${hitType}-${hitZone.name || 'hitbox'}-${this.time.now}`;
    const comboProtectMs = hitZone.getData('comboProtectMs') || (hitType === 'ultimate' ? 42 : hitType === 'skill' ? 58 : 90);
    const dir = enemy.x > this.player.x ? 1 : -1;
    const killed = enemy.takeDamage(damage, dir, { ...(reaction || {}), hitType, sourceKey, comboProtectMs });

    if (!enemy.didLastHitConnect()) return;

    this.damageDealt += damage;
    this.createHitEffect(hitZone.x, hitZone.y, hitType);
    this.applyHitStop(hitStopMs);
    if (shakeIntensity > 0 && shakeDuration > 0) {
      this.screenShake(shakeIntensity, shakeDuration);
    }

    if (killed) {
      this.onEnemyKilled(enemy);
    }
  }

  private showEquipPickupText(equip: EquipData): void {
    const rarityName = RARITY_NAMES[equip.rarity] || '装备';
    const color = '#' + (RARITY_COLORS[equip.rarity] || equip.color || 0xffffff).toString(16).padStart(6, '0');
    const accent = Phaser.Display.Color.HexStringToColor(color).color;
    const popup = this.createFlashPopupFrame(this.player.x - 132, this.player.y - 82, 264, 38, 99, accent, false);

    const text = this.add.text(
      this.player.x,
      this.player.y - 60,
      `获得 ${rarityName}: ${equip.name}`,
      { fontSize: '14px', color, fontFamily: 'Arial', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: [popup, text],
      y: '-=40',
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        popup.destroy();
        text.destroy();
      },
    });
  }
  private addStageGoldToPlayer(): void {
    if (this.player) {
      this.player.gold += this.gold;
      this.gold = 0;
    }
  }

  private showRewardToast(xpReward: number, goldReward: number, rewardEquip: EquipData | null): void {
    const equipText = rewardEquip ? ` / 装备 ${RARITY_NAMES[rewardEquip.rarity] || ''} ${rewardEquip.name}` : ' / 装备 无';
    this.showFlashPanelNotice(`奖励入库: XP +${xpReward} / 金币 +${goldReward}${equipText}`, '#55ff99', GAME_HEIGHT / 2 + 50, 1500);
  }

  private savePlayerData(
    options: { collectStageGold?: boolean; markStageComplete?: boolean; markStageCompleted?: boolean } = {}
  ): PlayerSaveData | null {
    if (!this.player) return null;
    const collectStageGold = options.collectStageGold ?? false;
    const markStageComplete = options.markStageComplete ?? options.markStageCompleted ?? this.stageCleared;
    if (collectStageGold) {
      this.addStageGoldToPlayer();
    }

    const mechaData = MECHA_DATABASE[this.player.mechaType as MechaType];
    if (!mechaData) return null;
    const loadedSave = loadGame();
    const previousSave = normalizeSaveData(
      loadedSave?.mechaType === this.player.mechaType
        ? loadedSave
        : this.activeSaveData?.mechaType === this.player.mechaType
          ? this.activeSaveData
          : createNewSave(this.player.mechaType as MechaType)
    );
    const completedStages = markStageComplete
      ? Array.from(new Set([
        ...previousSave.completedStages,
        this.currentStage.id,
      ]))
      : [...previousSave.completedStages];

    const data: PlayerSaveData = {
      ...this.player.toSaveData(previousSave),
      completedStages: completedStages,
    };

    saveGame(data);
    this.activeSaveData = data;
    return data;
  }
}
