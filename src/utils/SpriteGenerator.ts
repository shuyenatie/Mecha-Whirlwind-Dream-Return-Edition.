import Phaser from 'phaser';

export class SpriteGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll(): void {
    this.generateEnemySprites();
    this.generateBossSprites();
    this.generateEffectSprites();
    this.generateProjectileSprites();
    this.generateUIElements();
    this.generateBackgrounds();
    this.generatePetSprites();
    this.generateNPCSprites();
    this.generateItemSprites();
    this.generateEquipmentSlotIcons();
  }

  generateSingleMecha(key: string): void {
    switch (key) {
      case 'tianjian': this.generateTianJian(); break;
      case 'qiangpao': this.generateQiangPao(); break;
      case 'shanying': this.generateShanYing(); break;
      case 'lianren': this.generateLianRen(); break;
      case 'shengqiang': this.generateShengQiang(); break;
      case 'hanxing': this.generateHanXing(); break;
    }
  }

  private generateMechaSprites(): void {
    this.generateTianJian();
    this.generateQiangPao();
    this.generateShanYing();
    this.generateLianRen();
    this.generateShengQiang();
    this.generateHanXing();
  }

  private drawMechaBase(g: Phaser.GameObjects.Graphics, w: number, h: number, primary: number, secondary: number, accent: number, dark: number, features: {
    helmetStyle: 'round' | 'angular' | 'slim' | 'spiky';
    shoulderType: 'normal' | 'heavy' | 'light' | 'winged';
    chestDetail: 'core' | 'armor' | 'slim' | 'tech';
    legStyle: 'normal' | 'heavy' | 'slim' | 'reverse';
    weaponHint: 'sword' | 'gun' | 'fist' | 'chain' | 'spear' | 'crystal';
  }): void {
    const cx = w / 2;
    const brightAccent = Phaser.Display.Color.IntegerToColor(accent).brighten(30).color;

    g.fillStyle(0x000011, 0.3);
    g.fillCircle(cx, h * 0.55, 10);

    g.fillStyle(dark);
    g.fillRoundedRect(cx - 14, 2, 28, 6, 2);

    g.fillStyle(primary);
    switch (features.helmetStyle) {
      case 'round':
        g.fillRoundedRect(cx - 12, 4, 24, 20, 8);
        g.fillStyle(secondary, 0.3);
        g.fillRoundedRect(cx - 10, 6, 20, 16, 6);
        break;
      case 'angular':
        g.fillRoundedRect(cx - 14, 2, 28, 22, 4);
        g.fillStyle(secondary, 0.3);
        g.fillRoundedRect(cx - 12, 4, 24, 18, 3);
        break;
      case 'slim':
        g.fillRoundedRect(cx - 10, 4, 20, 20, 6);
        g.fillStyle(secondary, 0.3);
        g.fillRoundedRect(cx - 8, 6, 16, 16, 4);
        break;
      case 'spiky':
        g.fillRect(cx - 12, 4, 24, 20);
        g.fillTriangle(cx - 4, 4, cx + 4, 4, cx, -2);
        g.fillStyle(accent);
        g.fillTriangle(cx - 3, 4, cx + 3, 4, cx, -1);
        g.fillStyle(secondary, 0.3);
        g.fillRect(cx - 10, 6, 20, 16);
        break;
    }

    g.fillStyle(accent);
    g.fillRoundedRect(cx - 8, 10, 6, 5, 2);
    g.fillRoundedRect(cx + 2, 10, 6, 5, 2);
    g.fillStyle(brightAccent, 0.4);
    g.fillRoundedRect(cx - 7, 11, 4, 3, 1);
    g.fillRoundedRect(cx + 3, 11, 4, 3, 1);

    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 5, 12, 2);
    g.fillCircle(cx + 5, 12, 2);
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(cx - 5, 12, 1);
    g.fillCircle(cx + 5, 12, 1);

    switch (features.shoulderType) {
      case 'normal':
        g.fillStyle(primary);
        g.fillRoundedRect(cx - 20, 24, 10, 8, 3);
        g.fillRoundedRect(cx + 10, 24, 10, 8, 3);
        g.fillStyle(secondary, 0.4);
        g.fillRoundedRect(cx - 18, 26, 6, 4, 2);
        g.fillRoundedRect(cx + 12, 26, 6, 4, 2);
        break;
      case 'heavy':
        g.fillStyle(primary);
        g.fillRoundedRect(cx - 24, 22, 14, 12, 4);
        g.fillRoundedRect(cx + 10, 22, 14, 12, 4);
        g.fillStyle(secondary, 0.4);
        g.fillRoundedRect(cx - 22, 24, 10, 8, 3);
        g.fillRoundedRect(cx + 12, 24, 10, 8, 3);
        g.fillStyle(accent);
        g.fillRect(cx - 22, 26, 10, 4);
        g.fillRect(cx + 12, 26, 10, 4);
        g.fillStyle(brightAccent, 0.3);
        g.fillRect(cx - 22, 26, 10, 2);
        g.fillRect(cx + 12, 26, 10, 2);
        break;
      case 'light':
        g.fillStyle(primary);
        g.fillRoundedRect(cx - 18, 26, 8, 6, 2);
        g.fillRoundedRect(cx + 10, 26, 8, 6, 2);
        g.fillStyle(accent, 0.5);
        g.fillRoundedRect(cx - 17, 27, 6, 4, 1);
        g.fillRoundedRect(cx + 11, 27, 6, 4, 1);
        break;
      case 'winged':
        g.fillStyle(primary);
        g.fillRoundedRect(cx - 22, 22, 12, 10, 3);
        g.fillRoundedRect(cx + 10, 22, 12, 10, 3);
        g.fillStyle(secondary);
        g.fillTriangle(cx - 22, 22, cx - 28, 18, cx - 22, 28);
        g.fillTriangle(cx + 22, 22, cx + 28, 18, cx + 22, 28);
        g.fillStyle(accent, 0.5);
        g.fillTriangle(cx - 22, 23, cx - 27, 19, cx - 22, 27);
        g.fillTriangle(cx + 22, 23, cx + 27, 19, cx + 22, 27);
        break;
    }

    g.fillStyle(primary);
    g.fillRect(cx - 14, 32, 28, 22);
    g.fillStyle(secondary, 0.2);
    g.fillRect(cx - 12, 34, 24, 18);

    switch (features.chestDetail) {
      case 'core':
        g.fillStyle(accent, 0.2);
        g.fillCircle(cx, 42, 8);
        g.fillStyle(accent);
        g.fillCircle(cx, 42, 5);
        g.fillStyle(brightAccent, 0.5);
        g.fillCircle(cx, 42, 3);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx, 42, 1.5);
        g.fillStyle(accent, 0.15);
        g.fillCircle(cx, 42, 12);
        break;
      case 'armor':
        g.fillStyle(secondary);
        g.fillRect(cx - 10, 34, 20, 18);
        g.fillStyle(accent);
        g.fillRect(cx - 8, 36, 16, 3);
        g.fillRect(cx - 8, 44, 16, 3);
        g.fillStyle(brightAccent, 0.3);
        g.fillRect(cx - 8, 36, 16, 1);
        g.fillRect(cx - 8, 44, 16, 1);
        g.fillStyle(accent, 0.15);
        g.fillCircle(cx, 42, 6);
        break;
      case 'slim':
        g.fillStyle(secondary);
        g.fillRect(cx - 10, 34, 20, 16);
        g.fillStyle(accent, 0.3);
        g.fillRect(cx - 6, 38, 12, 8);
        break;
      case 'tech':
        g.fillStyle(secondary);
        g.fillRect(cx - 12, 34, 24, 18);
        g.fillStyle(accent);
        g.fillRect(cx - 2, 36, 4, 14);
        g.fillRect(cx - 10, 40, 20, 4);
        g.fillStyle(brightAccent, 0.3);
        g.fillRect(cx - 2, 36, 4, 2);
        g.fillRect(cx - 10, 40, 20, 1);
        g.fillStyle(accent, 0.1);
        g.fillCircle(cx, 45, 4);
        break;
    }

    switch (features.weaponHint) {
      case 'sword':
        g.fillStyle(0xccddff);
        g.fillRect(cx + 16, 28, 3, 24);
        g.fillStyle(0xffffff, 0.5);
        g.fillRect(cx + 17, 30, 1, 18);
        g.fillStyle(0xffdd44);
        g.fillRect(cx + 14, 50, 7, 3);
        g.fillStyle(0xffee88);
        g.fillRect(cx + 15, 50, 5, 1);
        g.fillStyle(0x4488ff, 0.2);
        g.fillCircle(cx + 17, 34, 6);
        break;
      case 'gun':
        g.fillStyle(dark);
        g.fillRect(cx + 16, 34, 16, 6);
        g.fillStyle(accent);
        g.fillRect(cx + 30, 33, 4, 8);
        g.fillStyle(brightAccent, 0.4);
        g.fillRect(cx + 30, 34, 4, 3);
        g.fillStyle(0xffaa44, 0.4);
        g.fillCircle(cx + 32, 37, 2);
        break;
      case 'fist':
        g.fillStyle(accent);
        g.fillRoundedRect(cx + 14, 38, 10, 10, 3);
        g.fillStyle(brightAccent, 0.3);
        g.fillRoundedRect(cx + 16, 40, 6, 6, 2);
        g.fillStyle(0xffdd44, 0.3);
        g.fillCircle(cx + 19, 43, 2);
        break;
      case 'chain':
        g.fillStyle(secondary);
        for (let i = 0; i < 4; i++) {
          g.fillRoundedRect(cx + 16 + i * 5, 36 + (i % 2) * 3, 4, 4, 1);
          g.fillStyle(accent, 0.3);
          g.fillRoundedRect(cx + 17 + i * 5, 37 + (i % 2) * 3, 2, 2, 1);
          g.fillStyle(secondary);
        }
        g.fillStyle(accent, 0.3);
        g.fillCircle(cx + 16, 36, 4);
        break;
      case 'spear':
        g.fillStyle(0x886644);
        g.fillRect(cx + 16, 28, 3, 28);
        g.fillStyle(0xffdd44);
        g.fillTriangle(cx + 16, 26, cx + 19, 26, cx + 17.5, 20);
        g.fillStyle(0xffee88);
        g.fillTriangle(cx + 17, 26, cx + 18, 26, cx + 17.5, 22);
        g.fillStyle(0xffdd44, 0.2);
        g.fillCircle(cx + 17, 26, 6);
        break;
      case 'crystal':
        g.fillStyle(accent);
        g.fillTriangle(cx + 16, 36, cx + 24, 42, cx + 16, 48);
        g.fillStyle(brightAccent, 0.4);
        g.fillTriangle(cx + 18, 38, cx + 22, 42, cx + 18, 46);
        g.fillStyle(accent, 0.2);
        g.fillCircle(cx + 20, 42, 8);
        break;
    }

    g.fillStyle(primary);
    switch (features.legStyle) {
      case 'normal':
        g.fillRect(cx - 10, 54, 8, 18);
        g.fillRect(cx + 2, 54, 8, 18);
        g.fillStyle(secondary, 0.3);
        g.fillRect(cx - 9, 56, 6, 4);
        g.fillRect(cx + 3, 56, 6, 4);
        g.fillStyle(dark);
        g.fillRect(cx - 12, 70, 12, 4);
        g.fillRect(cx, 70, 12, 4);
        g.fillStyle(0x222244);
        g.fillRect(cx - 11, 72, 10, 2);
        g.fillRect(cx + 1, 72, 10, 2);
        break;
      case 'heavy':
        g.fillRect(cx - 12, 54, 10, 18);
        g.fillRect(cx + 2, 54, 10, 18);
        g.fillStyle(secondary);
        g.fillRect(cx - 14, 54, 14, 4);
        g.fillRect(cx, 54, 14, 4);
        g.fillStyle(accent, 0.3);
        g.fillRect(cx - 12, 56, 8, 2);
        g.fillRect(cx + 4, 56, 8, 2);
        g.fillStyle(dark);
        g.fillRect(cx - 14, 70, 14, 5);
        g.fillRect(cx, 70, 14, 5);
        g.fillStyle(0x222244);
        g.fillRect(cx - 13, 73, 12, 2);
        g.fillRect(cx + 1, 73, 12, 2);
        break;
      case 'slim':
        g.fillRect(cx - 8, 54, 6, 18);
        g.fillRect(cx + 2, 54, 6, 18);
        g.fillStyle(accent, 0.3);
        g.fillRect(cx - 7, 58, 4, 3);
        g.fillRect(cx + 3, 58, 4, 3);
        g.fillStyle(dark);
        g.fillRect(cx - 10, 70, 10, 3);
        g.fillRect(cx, 70, 10, 3);
        break;
      case 'reverse':
        g.fillRect(cx - 10, 54, 8, 16);
        g.fillRect(cx + 2, 54, 8, 16);
        g.fillStyle(secondary);
        g.fillRect(cx - 12, 66, 12, 4);
        g.fillRect(cx, 66, 12, 4);
        g.fillStyle(accent, 0.3);
        g.fillRect(cx - 11, 68, 10, 2);
        g.fillRect(cx + 1, 68, 10, 2);
        g.fillStyle(dark);
        g.fillRect(cx - 10, 70, 10, 4);
        g.fillRect(cx + 2, 70, 10, 4);
        g.fillStyle(0x222244);
        g.fillRect(cx - 9, 72, 8, 2);
        g.fillRect(cx + 3, 72, 8, 2);
        break;
    }

    g.fillStyle(accent, 0.4);
    g.fillRect(cx - 14, 32, 28, 1);
    g.fillStyle(brightAccent, 0.2);
    g.fillRect(cx - 14, 33, 28, 1);
  }

  private generateTianJian(): void {
    const key = 'mecha_tianjian';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 64;
    const h = 80;

    this.drawMechaBase(g, w, h, 0x4488ff, 0x3366cc, 0xaaccff, 0x224488, {
      helmetStyle: 'angular',
      shoulderType: 'winged',
      chestDetail: 'core',
      legStyle: 'normal',
      weaponHint: 'sword',
    });

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateQiangPao(): void {
    const key = 'mecha_qiangpao';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 72;
    const h = 80;

    this.drawMechaBase(g, w, h, 0xff4444, 0xcc3333, 0xffaa88, 0x882222, {
      helmetStyle: 'round',
      shoulderType: 'heavy',
      chestDetail: 'armor',
      legStyle: 'heavy',
      weaponHint: 'gun',
    });

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateShanYing(): void {
    const key = 'mecha_shanying';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 56;
    const h = 80;

    this.drawMechaBase(g, w, h, 0x44ff88, 0x33cc66, 0xaaffcc, 0x228844, {
      helmetStyle: 'slim',
      shoulderType: 'light',
      chestDetail: 'slim',
      legStyle: 'slim',
      weaponHint: 'fist',
    });

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateLianRen(): void {
    const key = 'mecha_lianren';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 60;
    const h = 80;

    this.drawMechaBase(g, w, h, 0xff8800, 0xcc6600, 0xffcc88, 0x884400, {
      helmetStyle: 'angular',
      shoulderType: 'normal',
      chestDetail: 'tech',
      legStyle: 'reverse',
      weaponHint: 'chain',
    });

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateShengQiang(): void {
    const key = 'mecha_shengqiang';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 68;
    const h = 80;

    this.drawMechaBase(g, w, h, 0xffdd00, 0xccaa00, 0xffffaa, 0x887700, {
      helmetStyle: 'spiky',
      shoulderType: 'winged',
      chestDetail: 'armor',
      legStyle: 'normal',
      weaponHint: 'spear',
    });

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateHanXing(): void {
    const key = 'mecha_hanxing';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    const w = 60;
    const h = 80;

    this.drawMechaBase(g, w, h, 0x88ddff, 0x66bbdd, 0xccffff, 0x4488aa, {
      helmetStyle: 'round',
      shoulderType: 'normal',
      chestDetail: 'tech',
      legStyle: 'reverse',
      weaponHint: 'crystal',
    });

    g.fillStyle(0x88ddff, 0.3);
    g.fillCircle(w / 2, 42, 12);

    g.generateTexture(key, w, h);
    g.destroy();
    this.generateMechaFrames(key, w, h);
  }

  private generateMechaFrames(baseKey: string, w: number, h: number): void {
    const frameData = [
      { key: `${baseKey}_idle`, ox: 0, oy: 0 },
      { key: `${baseKey}_idle2`, ox: 0, oy: -1 },
      { key: `${baseKey}_run1`, ox: 2, oy: -2 },
      { key: `${baseKey}_run2`, ox: -1, oy: 0 },
      { key: `${baseKey}_run3`, ox: 2, oy: -1 },
      { key: `${baseKey}_run4`, ox: -1, oy: -2 },
      { key: `${baseKey}_attack1`, ox: 6, oy: 0 },
      { key: `${baseKey}_attack2`, ox: 8, oy: -2 },
      { key: `${baseKey}_attack3`, ox: 4, oy: 1 },
      { key: `${baseKey}_jump`, ox: 0, oy: -6 },
      { key: `${baseKey}_fall`, ox: 0, oy: 2 },
      { key: `${baseKey}_hurt`, ox: -3, oy: 2 },
      { key: `${baseKey}_skill1`, ox: 0, oy: -3 },
      { key: `${baseKey}_skill2`, ox: 2, oy: -4 },
      { key: `${baseKey}_die`, ox: 0, oy: 4 },
      { key: `${baseKey}_block`, ox: -2, oy: 0 },
    ];

    for (const frame of frameData) {
      if (this.scene.textures.exists(frame.key)) continue;

      const canvas = this.scene.textures.createCanvas(frame.key, w + 12, h + 12);
      if (!canvas) continue;
      const baseTexture = this.scene.textures.get(baseKey);
      if (baseTexture.key !== '__MISSING') {
        const sourceImage = baseTexture.getSourceImage() as HTMLCanvasElement;
        const ctx = canvas.getContext();
        ctx.drawImage(sourceImage, frame.ox + 6, frame.oy + 6);
        canvas.refresh();
      }
    }

    if (!this.scene.textures.exists(`${baseKey}_spritesheet`)) {
      const animFrames = [
        `${baseKey}_idle`, `${baseKey}_idle2`,
        `${baseKey}_run1`, `${baseKey}_run2`, `${baseKey}_run3`, `${baseKey}_run4`,
        `${baseKey}_attack1`, `${baseKey}_attack2`, `${baseKey}_attack3`,
        `${baseKey}_jump`, `${baseKey}_fall`,
        `${baseKey}_hurt`,
        `${baseKey}_skill1`, `${baseKey}_skill2`,
        `${baseKey}_die`,
        `${baseKey}_block`,
      ];

      if (!this.scene.anims.exists(`${baseKey}_idle`)) {
        this.scene.anims.create({
          key: `${baseKey}_idle`,
          frames: [
            { key: animFrames[0] },
            { key: animFrames[1] },
          ],
          frameRate: 4,
          repeat: -1,
        });
      }

      if (!this.scene.anims.exists(`${baseKey}_run`)) {
        this.scene.anims.create({
          key: `${baseKey}_run`,
          frames: [
            { key: animFrames[2] },
            { key: animFrames[3] },
            { key: animFrames[4] },
            { key: animFrames[5] },
          ],
          frameRate: 10,
          repeat: -1,
        });
      }

      if (!this.scene.anims.exists(`${baseKey}_attack`)) {
        this.scene.anims.create({
          key: `${baseKey}_attack`,
          frames: [
            { key: animFrames[6] },
            { key: animFrames[7] },
            { key: animFrames[8] },
          ],
          frameRate: 12,
          repeat: 0,
        });
      }

      if (!this.scene.anims.exists(`${baseKey}_skill`)) {
        this.scene.anims.create({
          key: `${baseKey}_skill`,
          frames: [
            { key: animFrames[12] },
            { key: animFrames[13] },
          ],
          frameRate: 8,
          repeat: 0,
        });
      }
    }
  }

  private generateEnemySprites(): void {
    const enemies = [
      { key: 'enemy_drone', color: 0x8833aa, w: 40, h: 40, type: 'drone' as const },
      { key: 'enemy_soldier', color: 0x6622aa, w: 48, h: 64, type: 'humanoid' as const },
      { key: 'enemy_heavy', color: 0x4411aa, w: 64, h: 72, type: 'heavy' as const },
      { key: 'enemy_sniper', color: 0xaa3388, w: 44, h: 64, type: 'sniper' as const },
      { key: 'enemy_elite', color: 0xff2266, w: 52, h: 72, type: 'elite' as const },
    ];

    for (const e of enemies) {
      if (this.scene.textures.exists(e.key)) continue;

      const g = this.scene.add.graphics();
      const c = Phaser.Display.Color.IntegerToColor(e.color);
      const dark = c.darken(20).color;
      const bright = c.brighten(25).color;

      switch (e.type) {
        case 'drone':
          g.fillStyle(e.color);
          g.fillRoundedRect(4, 8, e.w - 8, e.h - 16, 6);
          g.fillStyle(bright);
          g.fillCircle(e.w / 2 - 6, e.h / 2 - 2, 4);
          g.fillCircle(e.w / 2 + 6, e.h / 2 - 2, 4);
          g.fillStyle(0xff0044);
          g.fillCircle(e.w / 2 - 6, e.h / 2 - 2, 2);
          g.fillCircle(e.w / 2 + 6, e.h / 2 - 2, 2);
          g.fillStyle(dark);
          g.fillRect(2, 4, 8, 4);
          g.fillRect(e.w - 10, 4, 8, 4);
          g.fillStyle(0xff44ff, 0.5);
          g.fillCircle(e.w / 2, e.h - 6, 3);
          break;

        case 'humanoid':
          g.fillStyle(e.color);
          g.fillRoundedRect(e.w * 0.2, 0, e.w * 0.6, e.h * 0.28, 4);
          g.fillStyle(bright);
          g.fillRect(e.w * 0.25, e.h * 0.08, e.w * 0.15, e.h * 0.08);
          g.fillRect(e.w * 0.55, e.h * 0.08, e.w * 0.15, e.h * 0.08);
          g.fillStyle(0xff0044);
          g.fillRect(e.w * 0.28, e.h * 0.1, e.w * 0.08, e.h * 0.04);
          g.fillRect(e.w * 0.58, e.h * 0.1, e.w * 0.08, e.h * 0.04);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.1, e.h * 0.28, e.w * 0.8, e.h * 0.35);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.15, e.h * 0.32, e.w * 0.7, e.h * 0.25);
          g.fillStyle(bright, 0.4);
          g.fillRect(e.w * 0.3, e.h * 0.36, e.w * 0.4, e.h * 0.04);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.15, e.h * 0.63, e.w * 0.25, e.h * 0.3);
          g.fillRect(e.w * 0.6, e.h * 0.63, e.w * 0.25, e.h * 0.3);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.1, e.h * 0.9, e.w * 0.35, e.h * 0.1);
          g.fillRect(e.w * 0.55, e.h * 0.9, e.w * 0.35, e.h * 0.1);
          break;

        case 'heavy':
          g.fillStyle(e.color);
          g.fillRoundedRect(e.w * 0.15, 0, e.w * 0.7, e.h * 0.25, 6);
          g.fillStyle(bright);
          g.fillRect(e.w * 0.2, e.h * 0.06, e.w * 0.2, e.h * 0.1);
          g.fillRect(e.w * 0.55, e.h * 0.06, e.w * 0.2, e.h * 0.1);
          g.fillStyle(0xff2200);
          g.fillRect(e.w * 0.25, e.h * 0.08, e.w * 0.1, e.h * 0.06);
          g.fillRect(e.w * 0.6, e.h * 0.08, e.w * 0.1, e.h * 0.06);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.05, e.h * 0.25, e.w * 0.9, e.h * 0.38);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.08, e.h * 0.28, e.w * 0.84, e.h * 0.32);
          g.fillStyle(bright, 0.3);
          g.fillRect(e.w * 0.15, e.h * 0.35, e.w * 0.7, e.h * 0.05);
          g.fillRect(e.w * 0.15, e.h * 0.48, e.w * 0.7, e.h * 0.05);
          g.fillStyle(e.color);
          g.fillRect(0, e.h * 0.26, e.w * 0.1, e.h * 0.15);
          g.fillRect(e.w * 0.9, e.h * 0.26, e.w * 0.1, e.h * 0.15);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.12, e.h * 0.63, e.w * 0.3, e.h * 0.32);
          g.fillRect(e.w * 0.58, e.h * 0.63, e.w * 0.3, e.h * 0.32);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.08, e.h * 0.92, e.w * 0.38, e.h * 0.08);
          g.fillRect(e.w * 0.54, e.h * 0.92, e.w * 0.38, e.h * 0.08);
          break;

        case 'sniper':
          g.fillStyle(e.color);
          g.fillRoundedRect(e.w * 0.2, 0, e.w * 0.6, e.h * 0.25, 4);
          g.fillStyle(bright);
          g.fillCircle(e.w * 0.35, e.h * 0.1, 4);
          g.fillCircle(e.w * 0.6, e.h * 0.1, 4);
          g.fillStyle(0xff00ff);
          g.fillCircle(e.w * 0.35, e.h * 0.1, 2);
          g.fillCircle(e.w * 0.6, e.h * 0.1, 2);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.12, e.h * 0.25, e.w * 0.76, e.h * 0.33);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.16, e.h * 0.28, e.w * 0.68, e.h * 0.26);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.7, e.h * 0.3, e.w * 0.25, e.h * 0.06);
          g.fillStyle(bright);
          g.fillRect(e.w * 0.9, e.h * 0.28, e.w * 0.08, e.h * 0.1);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.18, e.h * 0.58, e.w * 0.22, e.h * 0.35);
          g.fillRect(e.w * 0.58, e.h * 0.58, e.w * 0.22, e.h * 0.35);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.14, e.h * 0.9, e.w * 0.3, e.h * 0.1);
          g.fillRect(e.w * 0.54, e.h * 0.9, e.w * 0.3, e.h * 0.1);
          break;

        case 'elite':
          g.fillStyle(0x220011);
          g.fillRoundedRect(e.w * 0.12, -2, e.w * 0.76, e.h * 0.27, 4);
          g.fillStyle(e.color);
          g.fillRoundedRect(e.w * 0.15, 0, e.w * 0.7, e.h * 0.25, 4);
          g.fillStyle(0xff4488);
          g.fillRect(e.w * 0.2, e.h * 0.06, e.w * 0.18, e.h * 0.1);
          g.fillRect(e.w * 0.58, e.h * 0.06, e.w * 0.18, e.h * 0.1);
          g.fillStyle(0xffffff, 0.5);
          g.fillCircle(e.w * 0.28, e.h * 0.1, 2);
          g.fillCircle(e.w * 0.66, e.h * 0.1, 2);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.05, e.h * 0.25, e.w * 0.9, e.h * 0.38);
          g.fillStyle(0x440022);
          g.fillRect(e.w * 0.08, e.h * 0.28, e.w * 0.84, e.h * 0.32);
          g.fillStyle(0xff4488, 0.4);
          g.fillRect(e.w * 0.15, e.h * 0.35, e.w * 0.7, e.h * 0.04);
          g.fillRect(e.w * 0.15, e.h * 0.48, e.w * 0.7, e.h * 0.04);
          g.fillStyle(e.color);
          g.fillRect(-2, e.h * 0.26, e.w * 0.12, e.h * 0.18);
          g.fillRect(e.w * 0.9, e.h * 0.26, e.w * 0.12, e.h * 0.18);
          g.fillStyle(bright);
          g.fillRect(0, e.h * 0.28, e.w * 0.08, e.h * 0.06);
          g.fillRect(e.w * 0.92, e.h * 0.28, e.w * 0.08, e.h * 0.06);
          g.fillStyle(e.color);
          g.fillRect(e.w * 0.12, e.h * 0.63, e.w * 0.28, e.h * 0.32);
          g.fillRect(e.w * 0.58, e.h * 0.63, e.w * 0.28, e.h * 0.32);
          g.fillStyle(dark);
          g.fillRect(e.w * 0.08, e.h * 0.92, e.w * 0.36, e.h * 0.08);
          g.fillRect(e.w * 0.54, e.h * 0.92, e.w * 0.36, e.h * 0.08);
          break;
      }

      g.generateTexture(e.key, e.w, e.h);
      g.destroy();
    }
  }

  private generateBossSprites(): void {
    const bosses = [
      { key: 'boss_void_commander', color: 0xff0044, w: 96, h: 120 },
      { key: 'boss_dark_mech', color: 0x440066, w: 112, h: 128 },
      { key: 'boss_black_hole_emperor', color: 0x220044, w: 128, h: 144 },
    ];

    for (const b of bosses) {
      if (this.scene.textures.exists(b.key)) continue;

      const g = this.scene.add.graphics();
      const c = Phaser.Display.Color.IntegerToColor(b.color);
      const dark = c.darken(25).color;
      const bright = c.brighten(30).color;

      g.fillStyle(dark);
      g.fillRoundedRect(b.w * 0.12, -4, b.w * 0.76, b.h * 0.26, 6);
      g.fillStyle(b.color);
      g.fillRoundedRect(b.w * 0.15, 0, b.w * 0.7, b.h * 0.24, 6);

      g.fillStyle(0xff0044);
      g.fillRoundedRect(b.w * 0.2, b.h * 0.05, b.w * 0.18, b.h * 0.1, 3);
      g.fillRoundedRect(b.w * 0.58, b.h * 0.05, b.w * 0.18, b.h * 0.1, 3);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(b.w * 0.28, b.h * 0.08, 3);
      g.fillCircle(b.w * 0.66, b.h * 0.08, 3);

      g.fillStyle(b.color);
      g.fillRect(b.w * 0.03, b.h * 0.24, b.w * 0.94, b.h * 0.38);
      g.fillStyle(dark);
      g.fillRect(b.w * 0.06, b.h * 0.27, b.w * 0.88, b.h * 0.32);

      g.fillStyle(bright, 0.4);
      g.fillRect(b.w * 0.12, b.h * 0.33, b.w * 0.76, b.h * 0.04);
      g.fillRect(b.w * 0.12, b.h * 0.45, b.w * 0.76, b.h * 0.04);

      g.fillStyle(0xff3366, 0.6);
      g.fillCircle(b.w * 0.5, b.h * 0.4, 6);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(b.w * 0.5, b.h * 0.4, 3);

      g.fillStyle(b.color);
      g.fillRect(-4, b.h * 0.26, b.w * 0.1, b.h * 0.2);
      g.fillRect(b.w * 0.9, b.h * 0.26, b.w * 0.1, b.h * 0.2);
      g.fillStyle(bright);
      g.fillRect(-2, b.h * 0.3, b.w * 0.06, b.h * 0.08);
      g.fillRect(b.w * 0.92, b.h * 0.3, b.w * 0.06, b.h * 0.08);

      g.fillStyle(b.color);
      g.fillRect(b.w * 0.12, b.h * 0.62, b.w * 0.28, b.h * 0.34);
      g.fillRect(b.w * 0.58, b.h * 0.62, b.w * 0.28, b.h * 0.34);

      g.fillStyle(dark);
      g.fillRect(b.w * 0.08, b.h * 0.92, b.w * 0.36, b.h * 0.08);
      g.fillRect(b.w * 0.54, b.h * 0.92, b.w * 0.36, b.h * 0.08);

      g.fillStyle(0xff0044, 0.15);
      g.fillCircle(b.w * 0.5, b.h * 0.4, b.w * 0.35);

      g.generateTexture(b.key, b.w, b.h);
      g.destroy();
    }
  }

  private generateEffectSprites(): void {
    const effects = [
      { key: 'fx_slash', color: 0x88ccff, w: 80, h: 40, type: 'slash' },
      { key: 'fx_slash_heavy', color: 0x4488ff, w: 100, h: 50, type: 'slash' },
      { key: 'fx_explosion', color: 0xff8844, w: 64, h: 64, type: 'circle' },
      { key: 'fx_explosion_big', color: 0xff4422, w: 96, h: 96, type: 'circle' },
      { key: 'fx_ice', color: 0x88ddff, w: 64, h: 64, type: 'ice' },
      { key: 'fx_ice_shatter', color: 0xaaeeff, w: 80, h: 80, type: 'ice' },
      { key: 'fx_lightning', color: 0xffff44, w: 48, h: 80, type: 'lightning' },
      { key: 'fx_dark', color: 0x8844aa, w: 64, h: 64, type: 'circle' },
      { key: 'fx_dark_nova', color: 0x6622aa, w: 96, h: 96, type: 'nova' },
      { key: 'fx_heal', color: 0x44ff88, w: 48, h: 48, type: 'heal' },
      { key: 'fx_hit', color: 0xffffff, w: 32, h: 32, type: 'hit' },
      { key: 'fx_block', color: 0x4488ff, w: 40, h: 40, type: 'block' },
      { key: 'fx_levelup', color: 0xffdd44, w: 80, h: 80, type: 'levelup' },
      { key: 'fx_ultimate_flash', color: 0xffffff, w: 128, h: 128, type: 'flash' },
    ];

    for (const fx of effects) {
      if (this.scene.textures.exists(fx.key)) continue;

      const g = this.scene.add.graphics();
      const cx = fx.w / 2;
      const cy = fx.h / 2;
      const bright = Phaser.Display.Color.IntegerToColor(fx.color).brighten(30).color;
      const dark = Phaser.Display.Color.IntegerToColor(fx.color).darken(20).color;

      switch (fx.type) {
        case 'slash':
          g.fillStyle(fx.color, 0.2);
          g.fillEllipse(cx + fx.w * 0.15, cy, fx.w * 0.7, fx.h * 0.7);
          g.fillStyle(fx.color, 0.5);
          g.fillEllipse(cx, cy, fx.w * 0.5, fx.h * 0.5);
          g.fillStyle(bright, 0.7);
          g.fillEllipse(cx - fx.w * 0.1, cy, fx.w * 0.3, fx.h * 0.3);
          g.fillStyle(0xffffff, 0.5);
          g.fillEllipse(cx - fx.w * 0.1, cy - 1, fx.w * 0.2, fx.h * 0.15);
          g.fillStyle(dark, 0.3);
          g.fillRect(cx + fx.w * 0.1, cy - fx.h * 0.4, fx.w * 0.02, fx.h * 0.8);
          g.fillRect(cx + fx.w * 0.2, cy - fx.h * 0.3, fx.w * 0.02, fx.h * 0.6);
          g.fillRect(cx + fx.w * 0.3, cy - fx.h * 0.2, fx.w * 0.02, fx.h * 0.4);
          break;

        case 'ice':
          g.fillStyle(fx.color, 0.15);
          g.fillCircle(cx, cy, fx.w / 2 + 4);
          g.fillStyle(fx.color, 0.3);
          g.fillCircle(cx, cy, fx.w / 2 - 2);
          g.fillStyle(bright, 0.5);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.4);
          g.fillCircle(cx - 4, cy - 4, fx.w / 6);
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = fx.w / 2 - 4;
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 2);
          }
          break;

        case 'lightning':
          g.fillStyle(fx.color, 0.1);
          g.fillCircle(cx, cy, fx.w / 2 + 6);
          g.fillStyle(fx.color, 0.2);
          g.fillCircle(cx, cy, fx.w / 2);
          g.fillStyle(bright, 0.6);
          g.lineStyle(3, bright, 0.8);
          g.beginPath();
          g.moveTo(cx - 4, -2);
          g.lineTo(cx + 2, cy - 8);
          g.lineTo(cx - 3, cy);
          g.lineTo(cx + 4, cy + 8);
          g.lineTo(cx - 2, fx.h + 2);
          g.strokePath();
          g.lineStyle(1, 0xffffff, 0.5);
          g.beginPath();
          g.moveTo(cx - 2, 0);
          g.lineTo(cx, cy - 6);
          g.lineTo(cx - 1, cy);
          g.lineTo(cx + 1, cy + 6);
          g.lineTo(cx, fx.h);
          g.strokePath();
          break;

        case 'nova':
          g.fillStyle(fx.color, 0.08);
          g.fillCircle(cx, cy, fx.w / 2 + 8);
          g.fillStyle(fx.color, 0.15);
          g.fillCircle(cx, cy, fx.w / 2);
          g.fillStyle(fx.color, 0.3);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(bright, 0.5);
          g.fillCircle(cx, cy, fx.w / 5);
          g.fillStyle(0xffffff, 0.4);
          g.fillCircle(cx, cy, fx.w / 8);
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            g.fillStyle(fx.color, 0.2);
            g.fillTriangle(
              cx, cy,
              cx + Math.cos(angle - 0.15) * (fx.w / 2 - 2),
              cy + Math.sin(angle - 0.15) * (fx.w / 2 - 2),
              cx + Math.cos(angle + 0.15) * (fx.w / 2 - 2),
              cy + Math.sin(angle + 0.15) * (fx.w / 2 - 2),
            );
          }
          break;

        case 'heal':
          g.fillStyle(fx.color, 0.12);
          g.fillCircle(cx, cy, fx.w / 2 + 4);
          g.fillStyle(fx.color, 0.3);
          g.fillCircle(cx, cy, fx.w / 2 - 2);
          g.fillStyle(bright, 0.5);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.4);
          g.fillCircle(cx - 3, cy - 3, fx.w / 6);
          g.fillStyle(0xffffff, 0.3);
          g.fillRect(cx - 1, cy - 6, 2, 12);
          g.fillRect(cx - 6, cy - 1, 12, 2);
          break;

        case 'hit':
          g.fillStyle(fx.color, 0.3);
          g.fillCircle(cx, cy, fx.w / 2 + 2);
          g.fillStyle(bright, 0.6);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.8);
          g.fillCircle(cx, cy, fx.w / 5);
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            g.fillStyle(fx.color, 0.4);
            g.fillRect(cx - 1, cy - 1, 1 + Math.cos(angle) * 2, 1 + Math.sin(angle) * 2);
          }
          break;

        case 'block':
          g.fillStyle(fx.color, 0.2);
          g.fillCircle(cx, cy, fx.w / 2 + 3);
          g.fillStyle(fx.color, 0.5);
          g.fillCircle(cx, cy, fx.w / 2 - 1);
          g.fillStyle(bright, 0.4);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.3);
          g.fillRect(cx - fx.w * 0.15, cy - fx.h * 0.1, fx.w * 0.3, fx.h * 0.2);
          g.fillRect(cx - fx.w * 0.1, cy - fx.h * 0.15, fx.w * 0.2, fx.h * 0.3);
          break;

        case 'levelup':
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dist = fx.w / 2 - 4;
            g.fillStyle(fx.color, 0.3);
            g.fillCircle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 3);
            g.fillStyle(bright, 0.5);
            g.fillCircle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1.5);
          }
          g.fillStyle(fx.color, 0.15);
          g.fillCircle(cx, cy, fx.w / 2 - 6);
          g.fillStyle(fx.color, 0.4);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(bright, 0.6);
          g.fillCircle(cx, cy, fx.w / 5);
          g.fillStyle(0xffffff, 0.5);
          g.fillCircle(cx, cy, fx.w / 8);
          break;

        case 'flash':
          g.fillStyle(fx.color, 0.05);
          g.fillCircle(cx, cy, fx.w / 2 + 10);
          g.fillStyle(fx.color, 0.1);
          g.fillCircle(cx, cy, fx.w / 2);
          g.fillStyle(bright, 0.2);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.5);
          g.fillCircle(cx, cy, fx.w / 6);
          g.fillStyle(0xffffff, 0.8);
          g.fillCircle(cx, cy, fx.w / 10);
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const dist = fx.w / 2 - 6;
            g.fillStyle(0xffffff, 0.2);
            g.fillRect(cx + Math.cos(angle) * dist - 1, cy + Math.sin(angle) * dist - 2, 2, 4);
          }
          break;

        default:
          g.fillStyle(fx.color, 0.15);
          g.fillCircle(cx, cy, fx.w / 2 + 4);
          g.fillStyle(fx.color, 0.3);
          g.fillCircle(cx, cy, fx.w / 2);
          g.fillStyle(bright, 0.5);
          g.fillCircle(cx, cy, fx.w / 3);
          g.fillStyle(0xffffff, 0.3);
          g.fillCircle(cx, cy, fx.w / 5);
          break;
      }

      g.generateTexture(fx.key, fx.w, fx.h);
      g.destroy();
    }
  }

  private generateProjectileSprites(): void {
    const projectiles = [
      { key: 'proj_bullet', color: 0xffaa44, w: 16, h: 8, type: 'bullet' },
      { key: 'proj_laser', color: 0xff4444, w: 32, h: 6, type: 'beam' },
      { key: 'proj_missile', color: 0xff6644, w: 20, h: 10, type: 'missile' },
      { key: 'proj_sword_wave', color: 0x88ccff, w: 40, h: 20, type: 'wave' },
      { key: 'proj_ice_shard', color: 0x88ddff, w: 16, h: 16, type: 'shard' },
      { key: 'proj_dark_ball', color: 0x8844aa, w: 20, h: 20, type: 'ball' },
      { key: 'proj_enemy_bullet', color: 0xff44ff, w: 12, h: 12, type: 'ball' },
      { key: 'proj_chain', color: 0xff8800, w: 24, h: 8, type: 'bullet' },
      { key: 'proj_spear_throw', color: 0xffdd00, w: 28, h: 6, type: 'beam' },
      { key: 'proj_ice_wave', color: 0x88ddff, w: 48, h: 24, type: 'wave' },
    ];

    for (const p of projectiles) {
      if (this.scene.textures.exists(p.key)) continue;

      const g = this.scene.add.graphics();
      const cx = p.w / 2;
      const cy = p.h / 2;

      switch (p.type) {
        case 'bullet':
          g.fillStyle(p.color);
          g.fillRoundedRect(0, 0, p.w, p.h, 3);
          g.fillStyle(0xffffff, 0.5);
          g.fillRect(p.w * 0.1, p.h * 0.2, p.w * 0.3, p.h * 0.6);
          break;
        case 'beam':
          g.fillStyle(p.color);
          g.fillRect(0, 0, p.w, p.h);
          g.fillStyle(0xffffff, 0.6);
          g.fillRect(p.w * 0.1, p.h * 0.25, p.w * 0.8, p.h * 0.5);
          break;
        case 'missile':
          g.fillStyle(p.color);
          g.fillRoundedRect(2, 1, p.w - 4, p.h - 2, 3);
          g.fillStyle(0xffcc00);
          g.fillTriangle(0, p.h / 2, 4, p.h * 0.3, 4, p.h * 0.7);
          g.fillStyle(0xffffff, 0.4);
          g.fillRect(p.w * 0.5, p.h * 0.2, p.w * 0.3, p.h * 0.6);
          break;
        case 'wave':
          g.fillStyle(p.color, 0.6);
          g.fillEllipse(cx, cy, p.w, p.h);
          g.fillStyle(0xffffff, 0.3);
          g.fillEllipse(cx, cy, p.w * 0.6, p.h * 0.5);
          break;
        case 'shard':
          g.fillStyle(p.color);
          g.fillTriangle(cx, 0, p.w, p.h, 0, p.h);
          g.fillStyle(0xffffff, 0.4);
          g.fillTriangle(cx, p.h * 0.2, p.w * 0.7, p.h * 0.8, p.w * 0.3, p.h * 0.8);
          break;
        case 'ball':
          g.fillStyle(p.color, 0.7);
          g.fillCircle(cx, cy, p.w / 2);
          g.fillStyle(0xffffff, 0.4);
          g.fillCircle(cx, cy, p.w / 4);
          break;
      }

      g.generateTexture(p.key, p.w, p.h);
      g.destroy();
    }
  }

  private generatePetSprites(): void {
    const pets = [
      { key: 'pet_wali', color: 0x44aaff, w: 28, h: 28 },
      { key: 'pet_xiaohuan', color: 0xff8844, w: 24, h: 24 },
      { key: 'pet_gaga', color: 0x44ff88, w: 26, h: 26 },
      { key: 'pet_miao', color: 0xff44aa, w: 24, h: 24 },
      { key: 'pet_aikesi', color: 0xffdd44, w: 28, h: 28 },
    ];

    for (const pet of pets) {
      if (this.scene.textures.exists(pet.key)) continue;

      const g = this.scene.add.graphics();
      const cx = pet.w / 2;
      const cy = pet.h / 2;
      const c = Phaser.Display.Color.IntegerToColor(pet.color);

      g.fillStyle(pet.color);
      g.fillRoundedRect(4, 4, pet.w - 8, pet.h - 8, 6);

      g.fillStyle(c.brighten(30).color);
      g.fillCircle(cx - 4, cy - 2, 3);
      g.fillCircle(cx + 4, cy - 2, 3);

      g.fillStyle(0x000000);
      g.fillCircle(cx - 4, cy - 2, 1.5);
      g.fillCircle(cx + 4, cy - 2, 1.5);

      g.fillStyle(c.brighten(15).color);
      g.fillRoundedRect(cx - 3, cy + 3, 6, 3, 1);

      g.fillStyle(pet.color, 0.3);
      g.fillCircle(cx, cy, pet.w / 2 + 2);

      g.generateTexture(pet.key, pet.w, pet.h);
      g.destroy();
    }
  }

  private generateNPCSprites(): void {
    const npcs = [
      { key: 'npc_tianlang', color: 0x4488ff, w: 40, h: 64 },
      { key: 'npc_baolong', color: 0xff4444, w: 40, h: 64 },
      { key: 'npc_wuming', color: 0x44ff88, w: 40, h: 64 },
      { key: 'npc_shop', color: 0xffaa44, w: 40, h: 64 },
      { key: 'npc_mission', color: 0xffdd44, w: 40, h: 64 },
    ];

    for (const npc of npcs) {
      if (this.scene.textures.exists(npc.key)) continue;

      const g = this.scene.add.graphics();
      const c = Phaser.Display.Color.IntegerToColor(npc.color);

      g.fillStyle(0x333344);
      g.fillRoundedRect(npc.w * 0.2, 0, npc.w * 0.6, npc.h * 0.25, 4);
      g.fillStyle(npc.color);
      g.fillRoundedRect(npc.w * 0.22, 2, npc.w * 0.56, npc.h * 0.22, 4);
      g.fillStyle(c.brighten(30).color);
      g.fillCircle(npc.w * 0.35, npc.h * 0.1, 3);
      g.fillCircle(npc.w * 0.6, npc.h * 0.1, 3);

      g.fillStyle(npc.color);
      g.fillRect(npc.w * 0.15, npc.h * 0.25, npc.w * 0.7, npc.h * 0.35);
      g.fillStyle(c.darken(15).color);
      g.fillRect(npc.w * 0.2, npc.h * 0.28, npc.w * 0.6, npc.h * 0.28);
      g.fillStyle(c.brighten(20).color, 0.5);
      g.fillRect(npc.w * 0.25, npc.h * 0.35, npc.w * 0.5, npc.h * 0.04);

      g.fillStyle(npc.color);
      g.fillRect(npc.w * 0.2, npc.h * 0.6, npc.w * 0.22, npc.h * 0.32);
      g.fillRect(npc.w * 0.55, npc.h * 0.6, npc.w * 0.22, npc.h * 0.32);
      g.fillStyle(c.darken(20).color);
      g.fillRect(npc.w * 0.16, npc.h * 0.9, npc.w * 0.3, npc.h * 0.1);
      g.fillRect(npc.w * 0.5, npc.h * 0.9, npc.w * 0.3, npc.h * 0.1);

      g.generateTexture(npc.key, npc.w, npc.h);
      g.destroy();
    }
  }

  private generateItemSprites(): void {
    const items = [
      { key: 'item_weapon', color: 0x4488ff, w: 24, h: 24 },
      { key: 'item_armor', color: 0x44ff88, w: 24, h: 24 },
      { key: 'item_accessory', color: 0xffdd44, w: 24, h: 24 },
      { key: 'item_potion_hp', color: 0xff4444, w: 20, h: 20 },
      { key: 'item_potion_mp', color: 0x4488ff, w: 20, h: 20 },
      { key: 'item_material', color: 0xaa88ff, w: 20, h: 20 },
      { key: 'item_chest', color: 0xffaa44, w: 28, h: 24 },
    ];

    for (const item of items) {
      if (this.scene.textures.exists(item.key)) continue;

      const g = this.scene.add.graphics();
      const cx = item.w / 2;
      const cy = item.h / 2;

      if (item.key === 'item_chest') {
        g.fillStyle(item.color);
        g.fillRoundedRect(2, 6, item.w - 4, item.h - 8, 3);
        g.fillStyle(Phaser.Display.Color.IntegerToColor(item.color).brighten(20).color);
        g.fillRect(4, 8, item.w - 8, 4);
        g.fillStyle(0xffdd00);
        g.fillCircle(cx, cy, 3);
      } else if (item.key.startsWith('item_potion')) {
        g.fillStyle(item.color);
        g.fillRoundedRect(4, 2, item.w - 8, item.h - 4, 4);
        g.fillStyle(Phaser.Display.Color.IntegerToColor(item.color).brighten(30).color);
        g.fillCircle(cx, cy + 2, 3);
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(cx - 2, 4, 4, 4);
      } else {
        g.fillStyle(0x222233);
        g.fillRoundedRect(0, 0, item.w, item.h, 4);
        g.fillStyle(item.color);
        g.fillRoundedRect(2, 2, item.w - 4, item.h - 4, 3);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx, cy, 4);
      }

      g.generateTexture(item.key, item.w, item.h);
      g.destroy();
    }
  }

  private generateUIElements(): void {
    this.generateBar('ui_hp_bar', 0x44ff44, 200, 20, true);
    this.generateBar('ui_mp_bar', 0x4488ff, 200, 20, true);
    this.generateBar('ui_hp_bar_bg', 0x331111, 200, 20, false);
    this.generateBar('ui_mp_bar_bg', 0x111133, 200, 20, false);
    this.generateBar('ui_boss_hp', 0xff4444, 400, 16, true);
    this.generateBar('ui_boss_hp_bg', 0x331111, 400, 16, false);
    this.generateBar('ui_exp_bar', 0xffaa44, 200, 8, true);
    this.generateBar('ui_exp_bar_bg', 0x222211, 200, 8, false);

    this.generateButton('ui_btn_primary', 0x4488ff, 160, 48);
    this.generateButton('ui_btn_secondary', 0x334466, 160, 48);
    this.generateButton('ui_btn_skill', 0x335577, 52, 52);

    this.generatePanel('ui_panel', 0x0a0a2a, 300, 400);
    this.generatePanel('ui_panel_small', 0x0a0a2a, 200, 150);
    this.generatePanel('ui_panel_wide', 0x0a0a2a, 500, 300);

    this.generateSkillIcon('ui_skill_slot', 0x223344, 48, 48);
  }

  private generateBar(key: string, color: number, w: number, h: number, bright: boolean): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();

    if (bright) {
      const brightTop = Phaser.Display.Color.IntegerToColor(color).brighten(30).color;
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, w, h, 3);
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(2, 1, w * 0.6, h * 0.45, 2);
      g.fillStyle(brightTop, 0.4);
      g.fillRoundedRect(1, 0, w - 2, h * 0.35, 2);
      g.lineStyle(1, 0xffffff, 0.15);
      g.strokeRoundedRect(0, 0, w, h, 3);
    } else {
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, w, h, 3);
      g.lineStyle(1, 0x000000, 0.3);
      g.strokeRoundedRect(0, 0, w, h, 3);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateButton(key: string, color: number, w: number, h: number): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    const brightColor = Phaser.Display.Color.IntegerToColor(color).brighten(20).color;
    const darkColor = Phaser.Display.Color.IntegerToColor(color).darken(15).color;

    g.fillStyle(darkColor);
    g.fillRoundedRect(0, 2, w, h, 8);
    g.fillStyle(color);
    g.fillRoundedRect(0, 0, w, h - 2, 8);
    g.fillStyle(brightColor, 0.4);
    g.fillRoundedRect(2, 0, w - 4, h * 0.4, 6);
    g.lineStyle(2, 0xffffff, 0.2);
    g.strokeRoundedRect(1, 0, w - 2, h - 2, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generatePanel(key: string, color: number, w: number, h: number): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    const brightColor = Phaser.Display.Color.IntegerToColor(color).brighten(10).color;

    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(2, 2, w, h, 10);
    g.fillStyle(color, 0.95);
    g.fillRoundedRect(0, 0, w, h, 10);
    g.fillStyle(brightColor, 0.15);
    g.fillRoundedRect(2, 2, w - 4, h * 0.3, 8);
    g.lineStyle(2, 0x4488ff, 0.4);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 10);
    g.lineStyle(1, 0x6699ff, 0.15);
    g.strokeRoundedRect(3, 3, w - 6, h - 6, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateSkillIcon(key: string, color: number, w: number, h: number): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    const brightColor = Phaser.Display.Color.IntegerToColor(color).brighten(20).color;

    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(1, 2, w, h, 6);
    g.fillStyle(color);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.fillStyle(brightColor, 0.3);
    g.fillRoundedRect(1, 1, w - 2, h * 0.35, 4);
    g.lineStyle(2, 0x6688aa, 0.6);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 6);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateEquipmentSlotIcons(): void {
    if (!this.scene.textures.exists('equip_weapon')) {
      this.drawWeaponIcon('equip_weapon', 0x4488ff, 'sword');
      this.drawWeaponIcon('equip_weapon_gun', 0xff4444, 'gun');
      this.drawWeaponIcon('equip_weapon_chain', 0xff8800, 'chain');
      this.drawWeaponIcon('equip_weapon_spear', 0xffdd00, 'spear');
      this.drawWeaponIcon('equip_weapon_fist', 0x44ff88, 'fist');
      this.drawWeaponIcon('equip_weapon_crystal', 0x88ddff, 'crystal');

      this.drawArmorIcon('equip_head', 0x44ff88, 'helmet');
      this.drawArmorIcon('equip_body', 0x44aa88, 'chest');
      this.drawArmorIcon('equip_legs', 0x8888ff, 'boots');
      this.drawArmorIcon('equip_accessory1', 0xffdd44, 'ring');
      this.drawArmorIcon('equip_accessory2', 0xff8844, 'amulet');
    }

    this.generateRarityBorder('rarity_common', 0xaaaaaa);
    this.generateRarityBorder('rarity_uncommon', 0x44ff88);
    this.generateRarityBorder('rarity_rare', 0x4488ff);
    this.generateRarityBorder('rarity_epic', 0xaa44ff);
    this.generateRarityBorder('rarity_legendary', 0xffaa44);

    if (!this.scene.textures.exists('icon_gold')) {
      const goldIcon = this.scene.add.graphics();
      goldIcon.fillStyle(0x332200);
      goldIcon.fillCircle(8, 8, 8);
      goldIcon.fillStyle(0xffdd44);
      goldIcon.fillCircle(8, 8, 7);
      goldIcon.fillStyle(0xffcc00);
      goldIcon.fillCircle(8, 8, 5);
      goldIcon.fillStyle(0xffee88);
      goldIcon.fillCircle(6, 6, 2);
      goldIcon.fillStyle(0xffdd44);
      goldIcon.fillRect(5, 6, 6, 4);
      goldIcon.fillStyle(0xffaa00);
      goldIcon.fillRect(5, 6, 6, 2);
      goldIcon.generateTexture('icon_gold', 16, 16);
      goldIcon.destroy();
    }

    if (!this.scene.textures.exists('icon_equip_bg')) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0d0d2a);
      bg.fillRoundedRect(0, 0, 52, 52, 8);
      bg.lineStyle(2, 0x334488, 0.5);
      bg.strokeRoundedRect(1, 1, 50, 50, 8);
      bg.generateTexture('icon_equip_bg', 52, 52);
      bg.destroy();
    }
  }

  private drawWeaponIcon(key: string, color: number, type: string): void {
    const g = this.scene.add.graphics();
    const cx = 24, cy = 24;

    g.fillStyle(0x0d0d2a);
    g.fillRoundedRect(0, 0, 48, 48, 8);
    g.lineStyle(2, color, 0.6);
    g.strokeRoundedRect(1, 1, 46, 46, 8);

    switch (type) {
      case 'sword':
        g.fillStyle(0xccddff);
        g.fillRect(cx - 2, 4, 4, 24);
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(cx - 1, 6, 2, 18);
        g.fillStyle(0xffdd44);
        g.fillRect(cx - 4, 28, 8, 3);
        g.fillRect(cx - 5, 26, 10, 2);
        g.fillStyle(color, 0.3);
        g.fillCircle(cx, 10, 8);
        break;
      case 'gun':
        g.fillStyle(0x444466);
        g.fillRoundedRect(6, 16, 28, 6, 2);
        g.fillStyle(color);
        g.fillRect(30, 15, 8, 8);
        g.fillStyle(0x666688);
        g.fillRoundedRect(8, 14, 16, 10, 2);
        g.fillStyle(0x222233);
        g.fillRect(10, 18, 6, 2);
        g.fillStyle(0xffaa44, 0.5);
        g.fillCircle(36, 19, 3);
        break;
      case 'chain':
        g.fillStyle(0x886644);
        g.fillCircle(cx, 14, 4);
        g.fillCircle(cx - 2, 22, 3);
        g.fillCircle(cx + 2, 30, 4);
        g.fillStyle(0xaa8866);
        g.fillRect(cx - 1, 16, 2, 6);
        g.fillRect(cx - 2, 24, 4, 6);
        g.fillStyle(color);
        g.fillTriangle(cx, 32, cx - 6, 42, cx + 6, 42);
        g.fillStyle(0xffcc44);
        g.fillTriangle(cx, 34, cx - 3, 40, cx + 3, 40);
        break;
      case 'spear':
        g.fillStyle(0x886644);
        g.fillRect(cx - 1, 6, 2, 32);
        g.fillStyle(0xffdd44);
        g.fillTriangle(cx, 2, cx - 6, 10, cx + 6, 10);
        g.fillStyle(0xffee88);
        g.fillTriangle(cx, 4, cx - 3, 9, cx + 3, 9);
        g.fillStyle(0x444466);
        g.fillRect(cx - 3, 36, 6, 4);
        break;
      case 'fist':
        g.fillStyle(color);
        g.fillRoundedRect(8, 12, 32, 28, 8);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(12, 16, 12, 8, 4);
        g.fillRoundedRect(12, 26, 12, 8, 4);
        g.fillStyle(0xffffff, 0.1);
        g.fillRoundedRect(26, 18, 10, 14, 3);
        g.fillStyle(0xffdd44, 0.5);
        g.fillCircle(14, 20, 3);
        g.fillCircle(14, 30, 3);
        break;
      case 'crystal':
        g.fillStyle(0x88ddff, 0.3);
        g.fillCircle(cx, cy, 16);
        g.fillStyle(0x88ddff);
        g.fillTriangle(cx, 6, cx - 8, 30, cx + 8, 30);
        g.fillStyle(0xccffff);
        g.fillTriangle(cx, 10, cx - 5, 28, cx + 5, 28);
        g.fillStyle(0xffffff, 0.6);
        g.fillTriangle(cx, 12, cx - 2, 20, cx + 2, 20);
        break;
    }

    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  private drawArmorIcon(key: string, color: number, type: string): void {
    const g = this.scene.add.graphics();
    const cx = 24, cy = 24;

    g.fillStyle(0x0d0d2a);
    g.fillRoundedRect(0, 0, 48, 48, 8);
    g.lineStyle(2, color, 0.6);
    g.strokeRoundedRect(1, 1, 46, 46, 8);

    switch (type) {
      case 'helmet':
        g.fillStyle(color);
        g.fillRoundedRect(8, 6, 32, 24, 8);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(10, 8, 28, 20, 6);
        g.fillStyle(0xff0044);
        g.fillRect(14, 12, 8, 3);
        g.fillRect(26, 12, 8, 3);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(18, 14, 2);
        g.fillCircle(30, 14, 2);
        g.fillStyle(color);
        g.fillRect(10, 30, 28, 4);
        g.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color);
        g.fillRect(12, 30, 24, 2);
        break;
      case 'chest':
        g.fillStyle(color);
        g.fillRoundedRect(6, 8, 36, 32, 6);
        g.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 0.3);
        g.fillRoundedRect(8, 10, 32, 28, 4);
        g.fillStyle(0xffffff, 0.2);
        g.fillRect(10, 16, 28, 3);
        g.fillRect(10, 26, 28, 3);
        g.fillStyle(0xffdd44, 0.6);
        g.fillCircle(cx, cy + 2, 5);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx, cy + 2, 2);
        break;
      case 'boots':
        g.fillStyle(color);
        g.fillRect(8, 6, 12, 30);
        g.fillRect(28, 6, 12, 30);
        g.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 0.3);
        g.fillRect(10, 8, 8, 26);
        g.fillRect(30, 8, 8, 26);
        g.fillStyle(0xffffff, 0.2);
        g.fillRect(9, 6, 10, 3);
        g.fillRect(29, 6, 10, 3);
        g.fillStyle(0x222244);
        g.fillRect(6, 34, 16, 6);
        g.fillRect(26, 34, 16, 6);
        g.fillStyle(0x444466);
        g.fillRect(8, 34, 12, 4);
        g.fillRect(28, 34, 12, 4);
        break;
      case 'ring':
        g.fillStyle(0x444466);
        g.fillCircle(cx, cy, 14);
        g.fillStyle(color);
        g.fillCircle(cx, cy, 12);
        g.fillStyle(0x222233);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(color, 0.5);
        g.fillCircle(cx, cy, 6);
        g.fillStyle(0xffffff, 0.4);
        g.fillRect(cx + 2, cy - 8, 3, 6);
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(cx + 8, cy - 4, 4);
        break;
      case 'amulet':
        g.fillStyle(0x886644);
        g.fillRect(cx - 1, 4, 2, 10);
        g.fillStyle(0x444466);
        g.fillCircle(cx, cy, 12);
        g.fillStyle(color);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx - 2, cy - 2, 4);
        g.fillStyle(0xffdd44, 0.5);
        g.fillCircle(cx + 2, cy + 2, 3);
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(cx, cy, 6);
        break;
    }

    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  private generateRarityBorder(key: string, color: number): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    g.lineStyle(3, color, 1);
    g.strokeRoundedRect(0, 0, 48, 48, 6);
    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  private generateBackgrounds(): void {
    this.generateSpaceBg('bg_earth', 0x0a1628, 0x1a3050, 0x2244aa, 0x334488, true);
    this.generateSpaceBg('bg_mars', 0x1a0a08, 0x3a1a10, 0xaa4422, 0x664422, true);
    this.generateSpaceBg('bg_space', 0x050510, 0x101030, 0x2244aa, 0x4466aa, false);
    this.generateSpaceBg('bg_void', 0x020008, 0x0a0020, 0x4400aa, 0x6622aa, false);
    this.generateSpaceBg('bg_hub', 0x0a0a2a, 0x1a1a4a, 0x4488ff, 0x3366cc, true);
    this.generateSpaceBg('bg_arena', 0x1a0a0a, 0x2a1a1a, 0xff4444, 0xaa3333, false);
  }

  private generateSpaceBg(key: string, bgColor: number, midColor: number, starColor: number, nebulaColor: number, hasPlanet: boolean): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    const w = 1280;
    const h = 720;

    g.fillStyle(bgColor);
    g.fillRect(0, 0, w, h);

    g.fillStyle(nebulaColor, 0.1);
    g.fillEllipse(w * 0.25, h * 0.2, 600, 350);
    g.fillStyle(nebulaColor, 0.07);
    g.fillEllipse(w * 0.75, h * 0.45, 500, 300);
    g.fillStyle(Phaser.Display.Color.IntegerToColor(nebulaColor).brighten(20).color, 0.04);
    g.fillEllipse(w * 0.5, h * 0.7, 400, 200);

    if (hasPlanet) {
      const px = w * 0.8;
      const py = h * 0.25;
      const pr = 60;

      g.fillStyle(0x000000, 0.15);
      g.fillCircle(px + 3, py + 3, pr + 5);

      g.fillStyle(midColor, 0.4);
      g.fillCircle(px, py, pr);
      g.fillStyle(Phaser.Display.Color.IntegerToColor(midColor).brighten(10).color, 0.3);
      g.fillCircle(px - 5, py - 5, pr - 5);
      g.fillStyle(midColor, 0.2);
      g.beginPath();
      g.arc(px - pr * 0.3, py - pr * 0.4, pr * 0.25, 0, Math.PI * 2, false);
      g.fillPath();
      g.beginPath();
      g.arc(px + pr * 0.1, py + pr * 0.2, pr * 0.15, 0, Math.PI * 2, false);
      g.fillPath();
      g.lineStyle(1, Phaser.Display.Color.IntegerToColor(midColor).brighten(20).color, 0.2);
      g.strokeCircle(px, py, pr + 1);
    }

    g.fillStyle(midColor, 0.3);
    g.fillRect(0, h * 0.6, w, h * 0.4);
    g.fillStyle(Phaser.Display.Color.IntegerToColor(midColor).brighten(10).color, 0.1);
    g.fillRect(0, h * 0.6, w, h * 0.05);

    for (let i = 0; i < 200; i++) {
      const sx = Phaser.Math.Between(0, w);
      const sy = Phaser.Math.Between(0, h * 0.7);
      const size = Phaser.Math.FloatBetween(0.3, 2.5);

      if (size > 1.8) {
        g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.6, 1));
        g.fillCircle(sx, sy, size);
        g.fillStyle(starColor, 0.2);
        g.fillCircle(sx, sy, size * 2);
      } else {
        g.fillStyle(starColor, Phaser.Math.FloatBetween(0.2, 0.7));
        g.fillCircle(sx, sy, size);
      }
    }

    g.fillStyle(midColor, 0.5);
    g.fillRect(0, h - 60, w, 60);
    g.fillStyle(Phaser.Display.Color.IntegerToColor(midColor).brighten(15).color, 0.5);
    g.fillRect(0, h - 62, w, 3);
    g.fillStyle(midColor, 0.3);
    g.fillRect(0, h - 58, w, 2);

    for (let x = 0; x < w; x += 120) {
      const bh = Phaser.Math.Between(20, 45);
      g.fillStyle(midColor, 0.35);
      g.fillRect(x, h - 60 - bh, 50, bh);
      g.fillStyle(Phaser.Display.Color.IntegerToColor(midColor).brighten(10).color, 0.2);
      g.fillRect(x + 2, h - 60 - bh, 46, bh * 0.2);
    }

    for (let i = 0; i < 20; i++) {
      const sx = Phaser.Math.Between(0, w);
      const sy = Phaser.Math.Between(Math.floor(h * 0.65), h - 65);
      g.fillStyle(starColor, Phaser.Math.FloatBetween(0.3, 0.6));
      g.fillCircle(sx, sy, Phaser.Math.FloatBetween(0.5, 1.2));
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }
}
