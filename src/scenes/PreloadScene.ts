import Phaser from 'phaser';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { VISUAL_IMAGE_ASSETS } from '../data/visualAssetData';

const MECHA_TYPES = [
  { key: 'tianjian', name: '天剑', frameWidth: 420, frameHeight: 420 },
  { key: 'qiangpao', name: '枪炮', frameWidth: 80, frameHeight: 100 },
  { key: 'shanying', name: '闪影', frameWidth: 80, frameHeight: 100 },
  { key: 'lianren', name: '链刃', frameWidth: 80, frameHeight: 100 },
  { key: 'shengqiang', name: '圣枪', frameWidth: 80, frameHeight: 100 },
  { key: 'hanxing', name: '寒星', frameWidth: 80, frameHeight: 100 },
];

export class PreloadScene extends Phaser.Scene {
  private spriteGen!: SpriteGenerator;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a);
    bg.fillRect(0, 0, width, height);

    this.add.text(cx, cy - 60, '机甲旋风', {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#4488ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 15, 'STORM RANGER', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#88aacc',
    }).setOrigin(0.5);

    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244);
    barBg.fillRoundedRect(cx - 150, cy + 30, 300, 20, 5);

    const bar = this.add.graphics();

    const percentText = this.add.text(cx, cy + 40, '0%', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const loadingText = this.add.text(cx, cy + 70, '正在加载素材...', {
      fontSize: '14px',
      color: '#88aacc',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x4488ff);
      bar.fillRoundedRect(cx - 148, cy + 32, 296 * value, 16, 4);
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('加载完成！');
    });

    let extAssetLoaded = false;
    this.load.on('filecomplete', (key: string) => {
      if (key.startsWith('mecha_') && this.textures.exists(key)) {
        extAssetLoaded = true;
        loadingText.setText('素材加载完成！');
      }
    });

    this.load.on('loaderror', (file: { url: string }) => {
      if (file.url && (file.url.includes('spritesheet.png') || file.url.includes('assets/'))) {
        console.log(`[Loader] Missing asset, using fallback where available: ${file.url}`);
      }
    });

    for (const asset of VISUAL_IMAGE_ASSETS) {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path);
      }
    }

    for (const mecha of MECHA_TYPES) {
      const basePath = `assets/sprites/mecha/${mecha.key}`;
      const textureKey = `mecha_${mecha.key}`;
      const jsonKey = `mecha_${mecha.key}_anim`;

      this.load.spritesheet({
        key: textureKey,
        url: `${basePath}/spritesheet.png`,
        frameConfig: {
          frameWidth: mecha.frameWidth,
          frameHeight: mecha.frameHeight,
          startFrame: 0,
          endFrame: -1,
          margin: 0,
          spacing: 0,
        },
      });

      this.load.json({
        key: jsonKey,
        url: `${basePath}/animations.json`,
      });
    }

    this.spriteGen = new SpriteGenerator(this);
    this.spriteGen.generateAll();
  }

  create(): void {
    for (const mecha of MECHA_TYPES) {
      const textureKey = `mecha_${mecha.key}`;
      const jsonKey = `mecha_${mecha.key}_anim`;
      const animPrefix = textureKey;

      if (!this.textures.exists(textureKey)) {
        this.spriteGen.generateSingleMecha(mecha.key);
      }

      if (this.cache.json.exists(jsonKey)) {
        const animData = this.cache.json.get(jsonKey);
        if (animData && animData.animations) {
          this.registry.set('useExternalAssets', true);
          for (const anim of animData.animations) {
            const animKey = anim.key
              .replace(`mecha_${mecha.key}_ext_`, `${animPrefix}_`)
              .replace(`${textureKey}_ext_`, `${animPrefix}_`);
            if (!this.anims.exists(animKey)) {
              this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(textureKey, {
                  start: anim.startFrame,
                  end: anim.endFrame,
                }),
                frameRate: anim.frameRate || 12,
                repeat: anim.repeat ?? -1,
              });
            }
          }
          continue;
        }
      }

      const frameCount = this.textures.get(textureKey).frameTotal - 1 || 15;

      if (!this.anims.exists(`${animPrefix}_idle`)) {
        this.anims.create({
          key: `${animPrefix}_idle`,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: Math.min(1, frameCount) }),
          frameRate: 5,
          repeat: -1,
        });
      }

      if (!this.anims.exists(`${animPrefix}_run`)) {
        this.anims.create({
          key: `${animPrefix}_run`,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 2, end: Math.min(5, frameCount) }),
          frameRate: 10,
          repeat: -1,
        });
      }

      if (!this.anims.exists(`${animPrefix}_attack`)) {
        this.anims.create({
          key: `${animPrefix}_attack`,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 6, end: Math.min(8, frameCount) }),
          frameRate: 12,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${animPrefix}_skill`)) {
        this.anims.create({
          key: `${animPrefix}_skill`,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: Math.min(13, frameCount) }),
          frameRate: 8,
          repeat: 0,
        });
      }

      if (!this.anims.exists(`${animPrefix}_hurt`)) {
        this.anims.create({
          key: `${animPrefix}_hurt`,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 11, end: Math.min(11, frameCount) }),
          frameRate: 8,
          repeat: 0,
        });
      }
    }

    this.time.delayedCall(500, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
