import Phaser from 'phaser';

export type AssetMode = 'procedural' | 'external';

export class AssetManager {
  private scene: Phaser.Scene;
  private mode: AssetMode = 'procedural';
  private basePath: string = 'assets';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setMode(mode: AssetMode): void {
    this.mode = mode;
  }

  setBasePath(path: string): void {
    this.basePath = path;
  }

  getMode(): AssetMode {
    return this.mode;
  }

  loadMechaSprites(mechaKey: string): void {
    if (this.mode === 'external') {
      this.loadExternalMecha(mechaKey);
    }
  }

  private loadExternalMecha(mechaKey: string): void {
    const path = `${this.basePath}/sprites/mecha/${mechaKey}`;

    if (!this.scene.textures.exists(`mecha_${mechaKey}`)) {
      this.scene.load.spritesheet({
        key: `mecha_${mechaKey}`,
        url: `${path}/spritesheet.png`,
        frameConfig: {
          frameWidth: 80,
          frameHeight: 100,
          startFrame: 0,
          endFrame: -1,
          margin: 0,
          spacing: 0,
        },
      });

      this.scene.load.json({
        key: `mecha_${mechaKey}_anim`,
        url: `${path}/animations.json`,
      });
    }
  }

  loadBackground(key: string): void {
    if (this.mode === 'external') {
      this.scene.load.image({
        key: `bg_${key}`,
        url: `${this.basePath}/backgrounds/${key}.png`,
      });
    }
  }

  loadAudio(key: string, type: 'bgm' | 'sfx'): void {
    const subdir = type === 'bgm' ? 'bgm' : 'sfx';
    this.scene.load.audio(key, [
      `${this.basePath}/audio/${subdir}/${key}.mp3`,
      `${this.basePath}/audio/${subdir}/${key}.ogg`,
    ]);
  }

  loadEnemySprites(enemyKey: string): void {
    if (this.mode === 'external') {
      this.scene.load.spritesheet({
        key: `enemy_${enemyKey}`,
        url: `${this.basePath}/sprites/enemies/${enemyKey}/spritesheet.png`,
        frameConfig: {
          frameWidth: 60,
          frameHeight: 80,
          startFrame: 0,
          endFrame: -1,
        },
      });
    }
  }

  loadBossSprites(bossKey: string): void {
    if (this.mode === 'external') {
      this.scene.load.spritesheet({
        key: `boss_${bossKey}`,
        url: `${this.basePath}/sprites/bosses/${bossKey}/spritesheet.png`,
        frameConfig: {
          frameWidth: 120,
          frameHeight: 150,
          startFrame: 0,
          endFrame: -1,
        },
      });
    }
  }

  loadPetSprites(petKey: string): void {
    if (this.mode === 'external') {
      this.scene.load.spritesheet({
        key: `pet_${petKey}`,
        url: `${this.basePath}/sprites/pets/${petKey}/spritesheet.png`,
        frameConfig: {
          frameWidth: 32,
          frameHeight: 32,
          startFrame: 0,
          endFrame: -1,
        },
      });
    }
  }

  loadNPCSprites(npcKey: string): void {
    if (this.mode === 'external') {
      this.scene.load.spritesheet({
        key: `npc_${npcKey}`,
        url: `${this.basePath}/sprites/npcs/${npcKey}/spritesheet.png`,
        frameConfig: {
          frameWidth: 50,
          frameHeight: 80,
          startFrame: 0,
          endFrame: -1,
        },
      });
    }
  }

  loadAllAudio(): void {
    const bgmList = [
      'main_menu',
      'hub',
      'earth_stage',
      'mars_stage',
      'space_stage',
      'void_stage',
      'boss_battle',
      'arena',
    ];

    const sfxList = [
      'slash',
      'shoot',
      'explosion',
      'ice',
      'lightning',
      'hit',
      'block',
      'levelup',
      'skill_cast',
      'dash',
      'jump',
      'death',
      'item_pickup',
      'menu_click',
      'menu_hover',
    ];

    for (const bgm of bgmList) {
      this.loadAudio(`bgm_${bgm}`, 'bgm');
    }

    for (const sfx of sfxList) {
      this.loadAudio(`sfx_${sfx}`, 'sfx');
    }
  }

  createExternalAnimations(mechaKey: string): void {
    const animData = this.scene.cache.json.get(`mecha_${mechaKey}_anim`);
    if (!animData) return;

    for (const anim of animData.animations) {
      if (!this.scene.anims.exists(anim.key)) {
        this.scene.anims.create({
          key: anim.key,
          frames: this.scene.anims.generateFrameNumbers(`mecha_${mechaKey}`, {
            start: anim.startFrame,
            end: anim.endFrame,
          }),
          frameRate: anim.frameRate || 12,
          repeat: anim.repeat ?? -1,
        });
      }
    }
  }

  hasExternalAssets(): boolean {
    return this.mode === 'external';
  }
}

export const assetManager = new AssetManager(null as any);
