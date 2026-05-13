import Phaser from 'phaser';
import { MechaType, MECHA_DATABASE, MechaData } from '../data/mechaData';
import { SkillData, getPlayableSkills, SkillType } from '../data/skillData';
import { EquipSlot, EquipData, getEquipById } from '../data/equipData';
import { PlayerSaveData, calculateEquipBonus, createNewSave, getXpForLevel } from '../data/playerData';

interface CombatSceneLike extends Phaser.Scene {
  getPlayerProjectileGroup?: () => Phaser.Physics.Arcade.Group;
  getPlayerHitboxGroup?: () => Phaser.Physics.Arcade.Group;
  registerPlayerHitbox?: (hitbox: Phaser.GameObjects.GameObject) => void;
}

type SkillFailureReason = 'casting' | 'cooldown' | 'mp';
type PlayerHitType = 'basic' | 'skill' | 'ultimate';

interface HitReactionProfile {
  knockbackX: number;
  knockbackY: number;
  hurtTime: number;
  tintDuration?: number;
  comboProtectMs?: number;
  sourceKey?: string;
}

const DEFAULT_COMBAT_Y_TOLERANCE = 46;
const PLAYER_HURT_INVINCIBLE_MS = 900;
const PLAYER_BLOCK_INVINCIBLE_MS = 300;

interface AttackProfile {
  step: number;
  duration: number;
  damageMultiplier: number;
  widthMultiplier: number;
  heightMultiplier: number;
  offsetX: number;
  offsetY: number;
  effectOffsetX: number;
  effectScale: number;
  hitboxLifetime: number;
  hitStopMs: number;
  reaction: HitReactionProfile;
  shakeIntensity: number;
  shakeDuration: number;
  tint: number;
}

interface TianjianAnimationProfile {
  frames: number[];
  frameRate: number;
  loop: boolean;
  bodyOffsetY: number[];
  bodyLean: number[];
  armAngle: number[];
  swordAngle: number[];
  swordReach: number[];
  swordAlpha: number[];
  slashScale: number;
  slashOffsetX: number;
  slashOffsetY: number;
  canEmitRunAfterimage?: boolean;
}

const TIANJIAN_ANIMATION_PROFILES: Record<string, TianjianAnimationProfile> = {
  idle: {
    frames: [0, 1],
    frameRate: 4,
    loop: true,
    bodyOffsetY: [0, -2],
    bodyLean: [-1, 1],
    armAngle: [-8, -3],
    swordAngle: [-18, -13],
    swordReach: [92, 96],
    swordAlpha: [0.24, 0.3],
    slashScale: 0.68,
    slashOffsetX: 36,
    slashOffsetY: -58,
  },
  run: {
    frames: [2, 3, 4, 5],
    frameRate: 12,
    loop: true,
    bodyOffsetY: [0, -5, 1, -3],
    bodyLean: [-7, 2, 7, -2],
    armAngle: [-34, -10, 18, -18],
    swordAngle: [-54, -24, 10, -34],
    swordReach: [100, 92, 105, 96],
    swordAlpha: [0.18, 0.08, 0.22, 0.1],
    slashScale: 0.58,
    slashOffsetX: -34,
    slashOffsetY: -42,
    canEmitRunAfterimage: true,
  },
  jump: {
    frames: [9],
    frameRate: 7,
    loop: false,
    bodyOffsetY: [-5],
    bodyLean: [-8],
    armAngle: [-40],
    swordAngle: [-62],
    swordReach: [112],
    swordAlpha: [0.22],
    slashScale: 0.74,
    slashOffsetX: 42,
    slashOffsetY: -70,
  },
  fall: {
    frames: [10],
    frameRate: 7,
    loop: false,
    bodyOffsetY: [4],
    bodyLean: [8],
    armAngle: [16],
    swordAngle: [34],
    swordReach: [106],
    swordAlpha: [0.2],
    slashScale: 0.7,
    slashOffsetX: 28,
    slashOffsetY: -50,
  },
  basic1: {
    frames: [6, 7, 8],
    frameRate: 15,
    loop: false,
    bodyOffsetY: [0, -3, 1],
    bodyLean: [-10, 7, 14],
    armAngle: [-62, -8, 34],
    swordAngle: [-82, -18, 48],
    swordReach: [118, 148, 134],
    swordAlpha: [0.38, 0.95, 0.42],
    slashScale: 0.95,
    slashOffsetX: 86,
    slashOffsetY: -54,
  },
  basic2: {
    frames: [7, 8, 6],
    frameRate: 16,
    loop: false,
    bodyOffsetY: [-1, -4, 0],
    bodyLean: [12, -5, -16],
    armAngle: [38, -16, -74],
    swordAngle: [58, -28, -104],
    swordReach: [136, 156, 128],
    swordAlpha: [0.42, 0.98, 0.46],
    slashScale: 1.08,
    slashOffsetX: 100,
    slashOffsetY: -44,
  },
  basic3: {
    frames: [6, 8, 7, 8],
    frameRate: 14,
    loop: false,
    bodyOffsetY: [-2, -7, -2, 2],
    bodyLean: [-18, 10, 18, 4],
    armAngle: [-84, -26, 22, 58],
    swordAngle: [-118, -38, 36, 78],
    swordReach: [132, 170, 176, 142],
    swordAlpha: [0.5, 1, 0.86, 0.36],
    slashScale: 1.24,
    slashOffsetX: 116,
    slashOffsetY: -58,
  },
  skillU: {
    frames: [6, 7, 8],
    frameRate: 12,
    loop: false,
    bodyOffsetY: [-2, -6, -2],
    bodyLean: [-14, 4, 16],
    armAngle: [-78, -28, 18],
    swordAngle: [-98, -18, 28],
    swordReach: [140, 188, 172],
    swordAlpha: [0.46, 1, 0.6],
    slashScale: 1.24,
    slashOffsetX: 126,
    slashOffsetY: -62,
  },
  skillI: {
    frames: [7, 8, 7, 6],
    frameRate: 18,
    loop: true,
    bodyOffsetY: [-1, -5, -1, 2],
    bodyLean: [-20, 10, 22, -8],
    armAngle: [-90, -12, 72, 156],
    swordAngle: [-118, -28, 82, 166],
    swordReach: [154, 172, 166, 148],
    swordAlpha: [0.8, 0.96, 0.88, 0.62],
    slashScale: 1.3,
    slashOffsetX: 38,
    slashOffsetY: -58,
  },
  skillO: {
    frames: [6, 7, 8, 7],
    frameRate: 10,
    loop: true,
    bodyOffsetY: [-7, -10, -6, -2],
    bodyLean: [-9, 0, 9, 0],
    armAngle: [-106, -56, -8, 44],
    swordAngle: [-132, -72, -12, 54],
    swordReach: [160, 196, 210, 178],
    swordAlpha: [0.68, 1, 0.92, 0.58],
    slashScale: 1.42,
    slashOffsetX: 128,
    slashOffsetY: -82,
  },
  hurt: {
    frames: [11],
    frameRate: 8,
    loop: false,
    bodyOffsetY: [2],
    bodyLean: [-18],
    armAngle: [26],
    swordAngle: [42],
    swordReach: [86],
    swordAlpha: [0.12],
    slashScale: 0.52,
    slashOffsetX: -22,
    slashOffsetY: -38,
  },
  knockdown: {
    frames: [11, 10],
    frameRate: 7,
    loop: false,
    bodyOffsetY: [12, 18],
    bodyLean: [-44, -62],
    armAngle: [58, 86],
    swordAngle: [76, 104],
    swordReach: [82, 74],
    swordAlpha: [0.18, 0.08],
    slashScale: 0.48,
    slashOffsetX: -30,
    slashOffsetY: -22,
  },
  recover: {
    frames: [10, 9, 0],
    frameRate: 9,
    loop: false,
    bodyOffsetY: [10, 2, 0],
    bodyLean: [-28, -10, 0],
    armAngle: [44, 10, -6],
    swordAngle: [62, 18, -16],
    swordReach: [78, 88, 94],
    swordAlpha: [0.08, 0.16, 0.24],
    slashScale: 0.58,
    slashOffsetX: 20,
    slashOffsetY: -42,
  },
};

export enum PlayerState {
  IDLE = 'idle',
  RUNNING = 'running',
  JUMPING = 'jumping',
  ATTACKING = 'attacking',
  SKILL_CASTING = 'skill_casting',
  HURT = 'hurt',
  KNOCKDOWN = 'knockdown',
  RECOVERING = 'recovering',
  BLOCKING = 'blocking',
  DEAD = 'dead',
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public mechaType!: MechaType;
  public mechaData!: MechaData;
  public state: PlayerState = PlayerState.IDLE;
  public facingRight: boolean = true;

  public hp: number = 1000;
  public maxHp: number = 1000;
  public mp: number = 100;
  public maxMp: number = 100;
  public level: number = 1;
  public xp: number = 0;
  public xpToNext: number = 100;
  public attack: number = 85;
  public defense: number = 70;

  public speed: number = 280;
  private jumpForce: number = 550;
  private attackRange: number = 80;
  private attackSpeed: number = 1.0;

  private comboCount: number = 0;
  private comboTimer: number = 0;
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;
  private currentAttackStep: number = 0;
  private queuedAttack: boolean = false;
  private queuedAttackCount: number = 0;
  private attackFinishEvent?: Phaser.Time.TimerEvent;
  private skillCastEvent?: Phaser.Time.TimerEvent;
  private hurtRecoverEvent?: Phaser.Time.TimerEvent;
  private knockdownRecoverEvent?: Phaser.Time.TimerEvent;
  private skillCastTimer: number = 0;
  private currentSkillSlotIndex: number = -1;
  private skillCooldowns: Map<string, number> = new Map();
  private invincibleTimer: number = 0;
  private mpRegenTimer: number = 0;

  private inputBuffer: string[] = [];
  private inputBufferTimer: number = 0;
  private readonly INPUT_BUFFER_TIME: number = 600;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private blockKey!: Phaser.Input.Keyboard.Key;
  private skillKeys!: Phaser.Input.Keyboard.Key[];

  private hitbox!: Phaser.GameObjects.Zone;
  private attackEffects: Phaser.GameObjects.GameObject[] = [];
  private damageNumbers: Phaser.GameObjects.Text[] = [];
  private tianjianBodyLayer?: Phaser.GameObjects.Sprite;
  private tianjianArmLayer?: Phaser.GameObjects.Graphics;
  private tianjianSwordLayer?: Phaser.GameObjects.Graphics;
  private currentTianjianProfileKey: string = '';
  private tianjianProfileTime: number = 0;
  private tianjianRunAfterimageTimer: number = 0;

  public equipment: Record<EquipSlot, EquipData | null>;
  public inventory: EquipData[] = [];
  public gold: number = 0;
  public baseCritRate: number = 5;
  public baseCritDamage: number = 150;
  private baseMaxHp: number = 1000;
  private baseMaxMp: number = 100;
  private baseAttack: number = 80;
  private baseDefense: number = 60;
  private baseSpeed: number = 280;

  public onLevelUp?: (level: number) => void;
  public onHpChange?: (hp: number, maxHp: number) => void;
  public onMpChange?: (mp: number, maxMp: number) => void;
  public onXpChange?: (xp: number, xpToNext: number) => void;
  public onComboChange?: (combo: number) => void;
  public onEquipmentChange?: () => void;
  public onProgressionChange?: () => void;
  public onSkillCast?: (skill: SkillData, slotIndex: number) => void;
  public onSkillFailure?: (skill: SkillData | undefined, slotIndex: number, reason: SkillFailureReason) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, mechaType: MechaType) {
    super(scene, x, y, Player.getSpriteKey(mechaType));

    this.mechaType = mechaType;
    this.mechaData = MECHA_DATABASE[mechaType];

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.equipment = {
      [EquipSlot.WEAPON]: null,
      [EquipSlot.HEAD]: null,
      [EquipSlot.BODY]: null,
      [EquipSlot.LEGS]: null,
      [EquipSlot.ACCESSORY_1]: null,
      [EquipSlot.ACCESSORY_2]: null,
    };

    this.initStats();
    this.initInput();
    this.initHitbox();
    this.applyVisualProfile();

    this.setDepth(10);
    this.createTianjianRigLayers();
    this.setCollideWorldBounds(true);

    this.configureBody();
  }

  private static getSpriteKey(type: MechaType): string {
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

  private initStats(): void {
    const stats = this.mechaData.baseStats;
    this.baseMaxHp = stats.hp;
    this.baseMaxMp = 100;
    this.baseAttack = stats.attack;
    this.baseDefense = stats.defense;
    this.baseSpeed = stats.speed;
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.maxMp = this.baseMaxMp;
    this.mp = this.maxMp;
    this.attack = this.baseAttack;
    this.defense = this.baseDefense;
    this.speed = this.baseSpeed;
    this.jumpForce = stats.jumpForce;
    this.attackRange = stats.attackRange;
    this.attackSpeed = stats.attackSpeed;
  }

  private initInput(): void {
    if (!this.scene.input.keyboard) return;

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.attackKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.jumpKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.blockKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    this.skillKeys = [
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
    ];

    const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => {
      this.addInput('A');
      this.performAttack();
    });

    this.attackKey.on('down', () => {
      this.addInput('A');
      this.performAttack();
    });

    this.jumpKey.on('down', () => {
      this.performJump();
    });

    for (let i = 0; i < this.skillKeys.length; i++) {
      this.skillKeys[i].on('down', () => {
        const skillKeys = ['U', 'I', 'O'];
        this.addInput(skillKeys[i]);
        this.performSkill(i);
      });
    }
  }

  private addInput(input: string): void {
    this.inputBuffer.push(input);
    this.inputBufferTimer = this.INPUT_BUFFER_TIME;

    if (this.inputBuffer.length > 6) {
      this.inputBuffer.shift();
    }

    this.checkComboInput();
  }

  private checkComboInput(): void {
    const buffer = this.inputBuffer.join('');

    const comboSkills: Record<string, { skillIndex: number; name: string }> = {
      'AAU': { skillIndex: 0, name: '强化技1' },
      'AAI': { skillIndex: 1, name: '强化技2' },
      'AAO': { skillIndex: 2, name: '终极强化' },
      'AU': { skillIndex: 0, name: '快速技1' },
      'AI': { skillIndex: 1, name: '快速技2' },
    };

    for (const [pattern, skill] of Object.entries(comboSkills)) {
      if (buffer.endsWith(pattern)) {
        this.inputBuffer = [];
        break;
      }
    }
  }

  private initHitbox(): void {
    this.hitbox = this.scene.add.zone(this.x, this.y, this.attackRange, 60);
    this.scene.physics.add.existing(this.hitbox, true);
    this.hitbox.setVisible(false);
  }

  private applyVisualProfile(): void {
    if (this.mechaType === MechaType.TIAN_JIAN && this.scene.textures.exists('mecha_tianjian')) {
      this.setScale(0.62);
      this.setOrigin(0.5, 0.93);
    }
  }

  private configureBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.mechaType === MechaType.TIAN_JIAN && this.texture.key === 'mecha_tianjian') {
      body.setSize(126, 270);
      body.setOffset(147, 138);
      return;
    }

    body.setSize(
      this.mechaType === MechaType.QIANG_PAO ? 50 : 36,
      60
    );
    body.setOffset(
      this.mechaType === MechaType.QIANG_PAO ? 11 : 14,
      18
    );
  }

  update(delta: number): void {
    if (this.state === PlayerState.DEAD) return;

    this.updateTimers(delta);
    this.handleMovement();
    this.updateHitbox();
    this.updateAnimations(delta);
    this.regenMp(delta);

    if (this.inputBufferTimer > 0) {
      this.inputBufferTimer -= delta;
      if (this.inputBufferTimer <= 0) {
        this.inputBuffer = [];
      }
    }
  }

  private updateTimers(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.currentAttackStep = 0;
        this.queuedAttack = false;
        this.queuedAttackCount = 0;
        this.onComboChange?.(0);
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer > 0) {
        this.setAlpha(Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3);
      } else {
        this.setAlpha(1);
      }
    }

    if (this.state === PlayerState.ATTACKING && this.attackCooldown <= 0) {
      this.finishAttack();
    }

    if (this.state === PlayerState.SKILL_CASTING && this.skillCastTimer > 0) {
      this.skillCastTimer -= delta;
      if (this.skillCastTimer <= 0) {
        this.finishSkillCast();
      }
    }
  }

  private handleMovement(): void {
    if (
      this.state === PlayerState.ATTACKING
      || this.state === PlayerState.SKILL_CASTING
      || this.state === PlayerState.HURT
      || this.state === PlayerState.KNOCKDOWN
      || this.state === PlayerState.RECOVERING
    ) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    let moveX = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      moveX = -1;
      this.facingRight = false;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      moveX = 1;
      this.facingRight = true;
    }

    body.setVelocityX(moveX * this.speed);
    this.setFlipX(!this.facingRight);

    if (this.blockKey.isDown) {
      this.state = PlayerState.BLOCKING;
      body.setVelocityX(0);
    } else if (body.onFloor()) {
      if (moveX !== 0) {
        this.state = PlayerState.RUNNING;
      } else {
        this.state = PlayerState.IDLE;
      }
    } else {
      this.state = PlayerState.JUMPING;
    }
  }

  private performJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (
      body.onFloor()
      && this.state !== PlayerState.ATTACKING
      && this.state !== PlayerState.SKILL_CASTING
      && this.state !== PlayerState.HURT
      && this.state !== PlayerState.KNOCKDOWN
      && this.state !== PlayerState.RECOVERING
    ) {
      body.setVelocityY(-this.jumpForce);
      this.state = PlayerState.JUMPING;
    }
  }

  private performAttack(): void {
    if (
      this.state === PlayerState.SKILL_CASTING
      || this.state === PlayerState.HURT
      || this.state === PlayerState.KNOCKDOWN
      || this.state === PlayerState.RECOVERING
      || this.state === PlayerState.DEAD
    ) return;

    if (this.state === PlayerState.ATTACKING || this.attackCooldown > 0) {
      if (this.comboTimer > 0 || this.currentAttackStep > 0) {
        const remainingSteps = Math.max(0, 3 - Math.max(this.currentAttackStep, 1));
        this.queuedAttackCount = Math.min(this.queuedAttackCount + 1, remainingSteps);
        this.queuedAttack = this.queuedAttackCount > 0;
      }
      return;
    }

    this.currentAttackStep = this.comboTimer > 0 ? this.currentAttackStep % 3 + 1 : 1;
    const profile = this.getAttackProfile(this.currentAttackStep);
    const duration = profile.duration / this.attackSpeed;

    this.isAttacking = true;
    this.state = PlayerState.ATTACKING;
    this.attackCooldown = duration;
    this.lastAnimKey = '';

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    this.comboCount++;
    this.comboTimer = 850;
    this.onComboChange?.(this.comboCount);

    const damage = this.calculateAttackDamage(profile);
    this.createAttackEffect(damage, profile);
    this.createTianjianSlashLayer(`basic${this.currentAttackStep}`);

    this.attackFinishEvent?.remove(false);
    this.attackFinishEvent = this.scene.time.delayedCall(duration, () => {
      this.finishAttack();
    });
  }

  private finishAttack(): void {
    this.attackFinishEvent?.remove(false);
    this.attackFinishEvent = undefined;

    const shouldChain = this.queuedAttackCount > 0 && this.currentAttackStep < 3 && this.comboTimer > 0 && this.state !== PlayerState.HURT && this.state !== PlayerState.DEAD;
    if (shouldChain) {
      this.queuedAttackCount = Math.max(0, this.queuedAttackCount - 1);
    } else {
      this.queuedAttackCount = 0;
    }
    this.queuedAttack = this.queuedAttackCount > 0;

    this.recoverFromAttackToMovement();
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.lastAnimKey = '';

    if (shouldChain) {
      this.scene.time.delayedCall(28, () => {
        this.performAttack();
      });
    }
  }

  private recoverFromAttackToMovement(): void {
    if (this.state !== PlayerState.ATTACKING) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.state = body.onFloor() ? PlayerState.IDLE : PlayerState.JUMPING;
    this.handleMovement();
  }

  private performSkill(slotIndex: number): void {
    if (this.state === PlayerState.SKILL_CASTING) {
      this.onSkillFailure?.(undefined, slotIndex, 'casting');
      this.showSkillNotice('技能释放中');
      return;
    }
    if (
      this.state === PlayerState.HURT
      || this.state === PlayerState.KNOCKDOWN
      || this.state === PlayerState.RECOVERING
      || this.state === PlayerState.DEAD
    ) return;

    const skills = getPlayableSkills(this.mechaType, this.level);
    const specialSkills = skills.filter((s) => s.type === SkillType.SPECIAL || s.type === SkillType.ULTIMATE);
    const skill = specialSkills[slotIndex];
    if (!skill) return;

    const cooldownRemaining = this.skillCooldowns.get(skill.id) || 0;
    if (cooldownRemaining > 0) {
      this.onSkillFailure?.(skill, slotIndex, 'cooldown');
      this.showSkillNotice('冷却中');
      return;
    }
    if (this.mp < skill.mpCost) {
      this.onSkillFailure?.(skill, slotIndex, 'mp');
      this.showSkillNotice('MP不足');
      return;
    }

    this.mp -= skill.mpCost;
    this.onMpChange?.(this.mp, this.maxMp);

    this.skillCooldowns.set(skill.id, skill.cooldown);
    this.state = PlayerState.SKILL_CASTING;
    this.isAttacking = true;
    this.currentSkillSlotIndex = slotIndex;
    this.attackFinishEvent?.remove(false);
    this.attackCooldown = 0;
    this.queuedAttack = false;
    this.queuedAttackCount = 0;
    this.lastAnimKey = '';

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    const damage = this.calculateSkillDamage(skill);
    this.createSkillEffect(skill, damage);
    this.createTianjianSlashLayer(this.getTianjianSkillProfileKey(slotIndex));
    this.onSkillCast?.(skill, slotIndex);

    const castTime = skill.type === SkillType.ULTIMATE ? 1500 : 600;
    this.skillCastTimer = castTime;
    this.skillCastEvent?.remove(false);
    this.skillCastEvent = this.scene.time.delayedCall(castTime, () => {
      this.finishSkillCast();
    });
  }

  private finishSkillCast(): void {
    this.skillCastEvent?.remove(false);
    this.skillCastEvent = undefined;
    this.skillCastTimer = 0;
    this.currentSkillSlotIndex = -1;
    this.recoverFromSkillToMovement();
    this.isAttacking = false;
    this.lastAnimKey = '';
  }

  private recoverFromSkillToMovement(): void {
    if (this.state !== PlayerState.SKILL_CASTING) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.state = body.onFloor() ? PlayerState.IDLE : PlayerState.JUMPING;
    this.handleMovement();
  }

  private showSkillNotice(message: string): void {
    const notice = this.scene.add.text(this.x, this.y - 110, message, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: message.includes('MP') ? '#4488ff' : '#ffdd44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(70);

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 30,
      alpha: 0,
      duration: 650,
      onComplete: () => notice.destroy(),
    });
  }

  private calculateAttackDamage(profile?: AttackProfile): number {
    const totalAtk = this.getTotalAttack();
    const comboBonus = 1 + Math.min(this.comboCount, 12) * 0.03;
    const profileBonus = profile?.damageMultiplier ?? 1;
    const critRate = this.getTotalCritRate();
    if (Phaser.Math.Between(1, 100) <= critRate) {
      return Math.floor(totalAtk * comboBonus * profileBonus * (this.getTotalCritDamage() / 100));
    }
    return Math.floor(totalAtk * comboBonus * profileBonus);
  }

  private calculateSkillDamage(skill: SkillData): number {
    return Math.floor(this.getTotalAttack() * skill.damageMultiplier);
  }

  private createAttackEffect(damage: number, profile: AttackProfile = this.getAttackProfile(1)): void {
    const meleeHitbox = this.getMeleeHitboxSize(profile);
    const offsetX = this.facingRight ? meleeHitbox.effectOffsetX : -meleeHitbox.effectOffsetX;
    const effectKey = this.mechaType === MechaType.QIANG_PAO ? 'proj_bullet' : 'fx_slash';

    if (this.mechaType === MechaType.QIANG_PAO) {
      const bullet = this.scene.physics.add.sprite(
        this.x + offsetX,
        this.y - 10,
        effectKey
      );
      bullet.setDepth(9);
      bullet.setVelocityX(this.facingRight ? 500 : -500);
      bullet.setData('damage', damage);
      bullet.setData('owner', 'player');
      bullet.setData('hitType', 'basic');
      bullet.setData('sourceKey', `basic-projectile-${this.scene.time.now}`);
      bullet.setData('comboProtectMs', 90);
      bullet.setData('combatYTolerance', 28);
      this.registerPlayerProjectile(bullet);
      this.attackEffects.push(bullet);

      this.scene.time.delayedCall(1500, () => {
        if (bullet.active) bullet.destroy();
      });
    } else {
      const effect = this.scene.add.sprite(this.x + offsetX, this.y - 5, effectKey);
      effect.setDepth(9);
      effect.setScale(profile.effectScale);
      effect.setFlipX(!this.facingRight);
      effect.setAlpha(0.8);
      effect.setTint(profile.tint);

      this.scene.tweens.add({
        targets: effect,
        alpha: 0,
        scaleX: profile.effectScale + 0.42,
        scaleY: profile.effectScale + 0.42,
        duration: profile.hitboxLifetime,
        onComplete: () => effect.destroy(),
      });

      this.createMeleeHitbox(damage, profile);
    }
  }

  private getAttackProfile(step: number): AttackProfile {
    const normalizedStep = Phaser.Math.Clamp(step, 1, 3);
    const tianjianProfiles: AttackProfile[] = [
      {
        step: 1,
        duration: 230,
        damageMultiplier: 1,
        widthMultiplier: 1,
        heightMultiplier: 0.95,
        offsetX: 88,
        offsetY: -38,
        effectOffsetX: 92,
        effectScale: 1.14,
        hitboxLifetime: 165,
        hitStopMs: 46,
        reaction: { knockbackX: 150, knockbackY: 92, hurtTime: 180, comboProtectMs: 90 },
        shakeIntensity: 1,
        shakeDuration: 55,
        tint: 0x8defff,
      },
      {
        step: 2,
        duration: 255,
        damageMultiplier: 1.12,
        widthMultiplier: 1.15,
        heightMultiplier: 1.03,
        offsetX: 98,
        offsetY: -34,
        effectOffsetX: 104,
        effectScale: 1.26,
        hitboxLifetime: 180,
        hitStopMs: 58,
        reaction: { knockbackX: 185, knockbackY: 125, hurtTime: 210, comboProtectMs: 95 },
        shakeIntensity: 2,
        shakeDuration: 70,
        tint: 0x66d7ff,
      },
      {
        step: 3,
        duration: 310,
        damageMultiplier: 1.36,
        widthMultiplier: 1.34,
        heightMultiplier: 1.18,
        offsetX: 114,
        offsetY: -42,
        effectOffsetX: 122,
        effectScale: 1.44,
        hitboxLifetime: 210,
        hitStopMs: 78,
        reaction: { knockbackX: 305, knockbackY: 265, hurtTime: 300, comboProtectMs: 130, tintDuration: 130 },
        shakeIntensity: 4,
        shakeDuration: 95,
        tint: 0xd7fbff,
      },
    ];

    if (this.mechaType === MechaType.TIAN_JIAN) {
      return tianjianProfiles[normalizedStep - 1];
    }

    return {
      ...tianjianProfiles[normalizedStep - 1],
      widthMultiplier: 0.78 + normalizedStep * 0.1,
      heightMultiplier: 0.82 + normalizedStep * 0.08,
      offsetX: 56 + normalizedStep * 10,
      offsetY: -16,
      effectOffsetX: 50 + normalizedStep * 9,
    };
  }

  private getMeleeHitboxSize(profile: AttackProfile = this.getAttackProfile(this.currentAttackStep || 1)): { width: number; height: number; offsetX: number; offsetY: number; effectOffsetX: number } {
    if (this.mechaType === MechaType.TIAN_JIAN && this.texture.key === 'mecha_tianjian') {
      return {
        width: Math.round(Math.max(170, this.attackRange * 2.1) * profile.widthMultiplier),
        height: Math.round(132 * profile.heightMultiplier),
        offsetX: profile.offsetX,
        offsetY: profile.offsetY,
        effectOffsetX: profile.effectOffsetX,
      };
    }

    const width = Math.max(110, this.attackRange + 42);
    return {
      width: Math.round(width * profile.widthMultiplier),
      height: Math.round(82 * profile.heightMultiplier),
      offsetX: profile.offsetX,
      offsetY: profile.offsetY,
      effectOffsetX: profile.effectOffsetX,
    };
  }

  private createMeleeHitbox(damage: number, profile: AttackProfile = this.getAttackProfile(1)): void {
    const hitboxSize = this.getMeleeHitboxSize(profile);
    const hitZone = this.scene.add.zone(
      this.x + (this.facingRight ? hitboxSize.offsetX : -hitboxSize.offsetX),
      this.y + hitboxSize.offsetY,
      hitboxSize.width,
      hitboxSize.height
    );
    this.scene.physics.add.existing(hitZone);

    const body = hitZone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(hitboxSize.width, hitboxSize.height);
    body.setVelocity(0, 0);

    hitZone.setData('damage', damage);
    hitZone.setData('owner', 'player');
    hitZone.setData('hitType', 'basic');
    hitZone.setData('attackStep', profile.step);
    hitZone.setData('combatYTolerance', this.getTianjianBasicYTolerance(profile.step, hitboxSize.height));
    hitZone.setData('sourceKey', `basic-${profile.step}-${this.scene.time.now}`);
    hitZone.setData('comboProtectMs', profile.reaction.comboProtectMs ?? 90);
    hitZone.setData('reaction', profile.reaction);
    hitZone.setData('hitStopMs', profile.hitStopMs);
    hitZone.setData('shakeIntensity', profile.shakeIntensity);
    hitZone.setData('shakeDuration', profile.shakeDuration);
    hitZone.setData('hitEnemies', new Set<Phaser.GameObjects.GameObject>());
    this.registerPlayerHitbox(hitZone);
    this.attackEffects.push(hitZone);

    this.scene.time.delayedCall(profile.hitboxLifetime, () => {
      if (hitZone.active) hitZone.destroy();
    });
  }

  private createSkillEffect(skill: SkillData, damage: number): void {
    if (this.mechaType === MechaType.TIAN_JIAN) {
      if (skill.id === 'tj_special_1') {
        this.createSwordWaveSkill(skill, damage);
        return;
      }
      if (skill.id === 'tj_special_2') {
        this.createWhirlwindSkill(skill, damage);
        return;
      }
      if (skill.id === 'tj_ultimate') {
        this.createSiriusUltimate(skill, damage);
        return;
      }
    }

    const offsetX = this.facingRight ? 50 : -50;

    if (skill.isProjectile) {
      const projKey = this.getProjectileKey(skill);
      for (let i = 0; i < Math.min(skill.hitCount, 3); i++) {
        this.scene.time.delayedCall(i * 150, () => {
          const proj = this.scene.physics.add.sprite(
            this.x + offsetX,
            this.y - 10 + (i - 1) * 15,
            projKey
          );
          proj.setDepth(9);
          proj.setVelocityX(this.facingRight ? 450 : -450);
          proj.setScale(1.5);
          proj.setData('damage', Math.floor(damage / skill.hitCount));
          proj.setData('owner', 'player');
          proj.setData('hitType', skill.type === SkillType.ULTIMATE ? 'ultimate' : 'skill');
          proj.setData('sourceKey', `${skill.id}-projectile-${this.scene.time.now}-${i}`);
          proj.setData('comboProtectMs', skill.type === SkillType.ULTIMATE ? 42 : 65);
          proj.setData('combatYTolerance', 34);
          this.registerPlayerProjectile(proj);
          this.attackEffects.push(proj);

          this.scene.time.delayedCall(2000, () => {
            if (proj.active) proj.destroy();
          });
        });
      }
    } else {
      const effectKey = this.getEffectKey(skill);
      const range = skill.range;

      if (skill.type === SkillType.ULTIMATE) {
        this.createUltimateEffect(skill, damage, effectKey);
      } else {
        const effect = this.scene.add.sprite(this.x + offsetX, this.y, effectKey);
        effect.setDepth(9);
        effect.setScale(range / 40);
        effect.setFlipX(!this.facingRight);
        effect.setAlpha(0.7);

        this.scene.tweens.add({
          targets: effect,
          alpha: 0,
          scaleX: range / 30,
          scaleY: range / 30,
          duration: 400,
          onComplete: () => effect.destroy(),
        });

        const hitZone = this.scene.add.zone(this.x + offsetX, this.y, range, range * 0.8);
        this.scene.physics.add.existing(hitZone, true);
        this.setSkillHitData(hitZone, damage, {
          knockbackX: 175,
          knockbackY: 120,
          hurtTime: 220,
        }, 48, 2, 70);
        this.registerPlayerHitbox(hitZone);
        this.attackEffects.push(hitZone);

        this.scene.time.delayedCall(200, () => {
          if (hitZone.active) hitZone.destroy();
        });
      }
    }
  }

  private createUltimateEffect(skill: SkillData, damage: number, effectKey: string): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.worldView.centerX,
      this.scene.cameras.main.worldView.centerY,
      1280, 720,
      0xffffff,
      0.5
    );
    flash.setDepth(100);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    const range = skill.range;
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const px = this.x + (this.facingRight ? 1 : -1) * (i * range * 0.2);
        const effect = this.scene.add.sprite(px, this.y, effectKey);
        effect.setDepth(9);
        effect.setScale(2);
        effect.setAlpha(0.8);

        this.scene.tweens.add({
          targets: effect,
          alpha: 0,
          scaleX: 3,
          scaleY: 3,
          duration: 500,
          onComplete: () => effect.destroy(),
        });

        const hitZone = this.scene.add.zone(px, this.y, range * 0.5, range * 0.4);
        this.scene.physics.add.existing(hitZone, true);
        this.setSkillHitData(hitZone, Math.floor(damage / 5), {
          knockbackX: 230,
          knockbackY: 180,
          hurtTime: 260,
        }, 64, 4, 100, 'ultimate');
        this.registerPlayerHitbox(hitZone);
        this.attackEffects.push(hitZone);

        this.scene.time.delayedCall(300, () => {
          if (hitZone.active) hitZone.destroy();
        });
      });
    }
  }

  private createSwordWaveSkill(skill: SkillData, damage: number): void {
    const dir = this.facingRight ? 1 : -1;
    const startX = this.x + dir * 82;
    const startY = this.y - 38;
    const effectKey = this.scene.textures.exists('visual_fx_slash') ? 'visual_fx_slash' : 'fx_slash';

    const wave = this.scene.add.sprite(startX, startY, effectKey);
    wave.setDepth(12);
    wave.setScale(0.95, 0.55);
    wave.setFlipX(!this.facingRight);
    wave.setBlendMode(Phaser.BlendModes.ADD);
    wave.setTint(0x8defff);

    const hitZone = this.scene.add.zone(startX, startY, 190, 92);
    this.scene.physics.add.existing(hitZone);
    const body = hitZone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(dir * 520);
    body.setSize(190, 92);
    const feel = this.buildSkillReaction(skill, 0);
    this.setSkillHitData(
      hitZone,
      Math.floor(damage / Math.max(1, skill.hitCount)),
      feel.reaction,
      feel.hitStopMs,
      feel.shakeIntensity,
      feel.shakeDuration,
      feel.hitType,
      feel.sourceKey,
      feel.comboProtectMs
    );
    this.registerPlayerHitbox(hitZone);
    this.attackEffects.push(hitZone);

    this.scene.tweens.add({
      targets: wave,
      x: startX + dir * skill.range,
      alpha: 0,
      scaleX: 1.35,
      duration: 520,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        hitZone.setPosition(wave.x, wave.y);
        (hitZone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
      onComplete: () => {
        wave.destroy();
        if (hitZone.active) hitZone.destroy();
      },
    });
  }

  private createWhirlwindSkill(skill: SkillData, damage: number): void {
    const effectKey = this.scene.textures.exists('visual_fx_trail') ? 'visual_fx_trail' : 'fx_slash';
    const perHitDamage = Math.floor(damage / skill.hitCount);

    for (let i = 0; i < skill.hitCount; i++) {
      this.scene.time.delayedCall(i * 95, () => {
        if (!this.active || this.state === PlayerState.DEAD) return;

        const angle = i * 42;
        const effect = this.scene.add.sprite(this.x, this.y - 34, effectKey);
        effect.setDepth(12);
        effect.setScale(1.25 + i * 0.08, 0.58);
        effect.setAngle(angle);
        effect.setAlpha(0.78);
        effect.setBlendMode(Phaser.BlendModes.ADD);
        effect.setTint(0x66d7ff);

        this.scene.tweens.add({
          targets: effect,
          angle: angle + 160,
          alpha: 0,
          scaleX: 1.8,
          duration: 190,
          onComplete: () => effect.destroy(),
        });

        const hitZone = this.scene.add.zone(this.x, this.y - 34, skill.range * 2, 140);
        this.scene.physics.add.existing(hitZone);
        const body = hitZone.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setSize(skill.range * 2, 140);
        const feel = this.buildSkillReaction(skill, i);
        this.setSkillHitData(
          hitZone,
          perHitDamage,
          feel.reaction,
          feel.hitStopMs,
          feel.shakeIntensity,
          feel.shakeDuration,
          feel.hitType,
          feel.sourceKey,
          feel.comboProtectMs
        );
        this.registerPlayerHitbox(hitZone);
        this.attackEffects.push(hitZone);

        this.scene.time.delayedCall(120, () => {
          if (hitZone.active) hitZone.destroy();
        });
      });
    }
  }

  private createSiriusUltimate(skill: SkillData, damage: number): void {
    this.scene.cameras.main.flash(180, 150, 230, 255);
    const centerX = this.x + (this.facingRight ? 110 : -110);
    const centerY = this.y - 58;
    const effectKey = this.scene.textures.exists('visual_fx_burst') ? 'visual_fx_burst' : 'fx_explosion';
    const perHitDamage = Math.floor(damage / Math.max(1, skill.hitCount));

    for (let i = 0; i < skill.hitCount; i++) {
      this.scene.time.delayedCall(i * 90, () => {
        if (!this.active || this.state === PlayerState.DEAD) return;

        const offset = (i % 5 - 2) * 56;
        const px = centerX + (this.facingRight ? offset : -offset);
        const py = centerY + (i % 2) * 28;
        const effect = this.scene.add.sprite(px, py, effectKey);
        effect.setDepth(13);
        effect.setScale(0.42 + i * 0.035);
        effect.setAlpha(0.86);
        effect.setBlendMode(Phaser.BlendModes.ADD);
        effect.setTint(i % 2 === 0 ? 0xd7fbff : 0x8defff);

        this.scene.tweens.add({
          targets: effect,
          alpha: 0,
          scaleX: 1.35,
          scaleY: 1.35,
          duration: 280,
          onComplete: () => effect.destroy(),
        });

        const hitZone = this.scene.add.zone(px, py + 18, skill.range * 0.9, 170);
        this.scene.physics.add.existing(hitZone);
        const body = hitZone.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setSize(skill.range * 0.9, 170);
        const feel = this.buildSkillReaction(skill, i);
        this.setSkillHitData(
          hitZone,
          perHitDamage,
          feel.reaction,
          feel.hitStopMs,
          feel.shakeIntensity,
          feel.shakeDuration,
          feel.hitType,
          feel.sourceKey,
          feel.comboProtectMs
        );
        this.registerPlayerHitbox(hitZone);
        this.attackEffects.push(hitZone);

        this.scene.time.delayedCall(150, () => {
          if (hitZone.active) hitZone.destroy();
        });
      });
    }
  }

  private setSkillHitData(
    hitZone: Phaser.GameObjects.Zone,
    damage: number,
    reaction: HitReactionProfile,
    hitStopMs: number,
    shakeIntensity: number,
    shakeDuration: number,
    hitType: PlayerHitType = 'skill',
    sourceKey: string = `${hitType}-${this.scene.time.now}`,
    comboProtectMs: number = reaction.comboProtectMs ?? 60
  ): void {
    hitZone.setData('damage', damage);
    hitZone.setData('owner', 'player');
    hitZone.setData('hitType', hitType);
    hitZone.setData('sourceKey', sourceKey);
    hitZone.setData('comboProtectMs', comboProtectMs);
    hitZone.setData('reaction', { ...reaction, sourceKey, comboProtectMs });
    hitZone.setData('hitStopMs', hitStopMs);
    hitZone.setData('shakeIntensity', shakeIntensity);
    hitZone.setData('shakeDuration', shakeDuration);
    hitZone.setData('combatYTolerance', this.getSkillCombatYTolerance(hitType, sourceKey));
    hitZone.setData('hitEnemies', new Set<Phaser.GameObjects.GameObject>());
  }

  private getTianjianBasicYTolerance(attackStep: number, hitboxHeight: number): number {
    if (this.mechaType !== MechaType.TIAN_JIAN) {
      return Math.max(DEFAULT_COMBAT_Y_TOLERANCE, Math.floor(hitboxHeight * 0.38));
    }

    const visualStepTolerance: Record<number, number> = {
      1: 58,
      2: 64,
      3: 72,
    };
    return Math.max(visualStepTolerance[attackStep] ?? DEFAULT_COMBAT_Y_TOLERANCE, Math.floor(hitboxHeight * 0.44));
  }

  private getSkillCombatYTolerance(hitType: PlayerHitType, sourceKey: string): number {
    if (sourceKey.startsWith('tj_special_1')) return 64;
    if (sourceKey.startsWith('tj_special_2')) return 74;
    if (sourceKey.startsWith('tj_ultimate')) return 92;
    if (hitType === 'ultimate') return 72;
    return DEFAULT_COMBAT_Y_TOLERANCE;
  }

  private buildSkillReaction(skill: SkillData, hitIndex: number): {
    reaction: HitReactionProfile;
    hitStopMs: number;
    shakeIntensity: number;
    shakeDuration: number;
    hitType: PlayerHitType;
    sourceKey: string;
    comboProtectMs: number;
  } {
    const hitType: PlayerHitType = skill.type === SkillType.ULTIMATE ? 'ultimate' : 'skill';
    const sourceKey = `${skill.id}-${this.scene.time.now}-${hitIndex}`;

    if (skill.id === 'tj_special_1') {
      return {
        reaction: { knockbackX: 205, knockbackY: 125, hurtTime: 220, tintDuration: 120 },
        hitStopMs: 54,
        shakeIntensity: 3,
        shakeDuration: 80,
        hitType,
        sourceKey,
        comboProtectMs: 70,
      };
    }

    if (skill.id === 'tj_special_2') {
      return {
        reaction: { knockbackX: 125, knockbackY: 165, hurtTime: 205, tintDuration: 95 },
        hitStopMs: 38,
        shakeIntensity: 2,
        shakeDuration: 58,
        hitType,
        sourceKey,
        comboProtectMs: 52,
      };
    }

    if (skill.id === 'tj_ultimate') {
      return {
        reaction: { knockbackX: 320, knockbackY: 285, hurtTime: 330, tintDuration: 150 },
        hitStopMs: 66,
        shakeIntensity: 6,
        shakeDuration: 140,
        hitType,
        sourceKey,
        comboProtectMs: 42,
      };
    }

    return {
      reaction: { knockbackX: 175, knockbackY: 120, hurtTime: 220 },
      hitStopMs: 48,
      shakeIntensity: 2,
      shakeDuration: 70,
      hitType,
      sourceKey,
      comboProtectMs: 65,
    };
  }

  private getProjectileKey(skill: SkillData): string {
    if (skill.mechaType === MechaType.QIANG_PAO) {
      return skill.type === SkillType.ULTIMATE ? 'proj_missile' : 'proj_laser';
    }
    if (skill.mechaType === MechaType.SHAN_YING) {
      return 'proj_dark_ball';
    }
    return 'proj_sword_wave';
  }

  private getEffectKey(skill: SkillData): string {
    switch (skill.element) {
      case 'fire': return 'fx_explosion';
      case 'ice': return 'fx_ice';
      case 'lightning': return 'fx_lightning';
      case 'dark': return 'fx_dark';
      case 'light': return 'fx_slash';
      default: return 'fx_slash';
    }
  }

  private registerPlayerProjectile(projectile: Phaser.GameObjects.GameObject): void {
    const combatScene = this.scene as CombatSceneLike;
    combatScene.getPlayerProjectileGroup?.().add(projectile);
  }

  private registerPlayerHitbox(hitbox: Phaser.GameObjects.GameObject): void {
    const combatScene = this.scene as CombatSceneLike;
    if (combatScene.registerPlayerHitbox) {
      combatScene.registerPlayerHitbox(hitbox);
      return;
    }
    combatScene.getPlayerHitboxGroup?.().add(hitbox);
  }

  private updateHitbox(): void {
    const offsetX = this.facingRight ? this.attackRange * 0.6 : -this.attackRange * 0.6;
    this.hitbox.setPosition(this.x + offsetX, this.y);
  }

  private createTianjianRigLayers(): void {
    if (this.mechaType !== MechaType.TIAN_JIAN || !this.scene.textures.exists('mecha_tianjian')) return;

    this.tianjianBodyLayer = this.scene.add.sprite(this.x, this.y, 'mecha_tianjian');
    this.tianjianBodyLayer
      .setOrigin(0.5, 0.93)
      .setScale(0.62)
      .setDepth(this.depth);

    this.tianjianArmLayer = this.scene.add.graphics();
    this.tianjianArmLayer.setDepth(this.depth + 1);

    this.tianjianSwordLayer = this.scene.add.graphics();
    this.tianjianSwordLayer.setDepth(this.depth + 2);

    this.setVisible(false);
  }

  private applyTianjianAnimationProfile(profileKey: string, delta: number): void {
    if (this.mechaType !== MechaType.TIAN_JIAN || !this.tianjianBodyLayer) return;

    if (this.currentTianjianProfileKey !== profileKey) {
      this.currentTianjianProfileKey = profileKey;
      this.tianjianProfileTime = 0;
    } else {
      this.tianjianProfileTime += delta;
    }

    const profile = TIANJIAN_ANIMATION_PROFILES[profileKey] ?? TIANJIAN_ANIMATION_PROFILES.idle;
    this.updateTianjianRigLayers(profile);

    if (profile.canEmitRunAfterimage) {
      this.tianjianRunAfterimageTimer -= delta;
      if (this.tianjianRunAfterimageTimer <= 0 && Math.abs((this.body as Phaser.Physics.Arcade.Body).velocity.x) > 20) {
        this.tianjianRunAfterimageTimer = 86;
        this.createTianjianRunAfterimage(profile);
      }
    } else {
      this.tianjianRunAfterimageTimer = 0;
    }
  }

  private updateTianjianRigLayers(profile: TianjianAnimationProfile): void {
    if (!this.tianjianBodyLayer || !this.tianjianArmLayer || !this.tianjianSwordLayer) return;

    const frameIndex = this.getTianjianProfileFrameIndex(profile);
    const frame = profile.frames[frameIndex] ?? profile.frames[0] ?? 0;
    const bodyOffsetY = profile.bodyOffsetY[frameIndex] ?? profile.bodyOffsetY[0] ?? 0;
    const bodyLean = profile.bodyLean[frameIndex] ?? profile.bodyLean[0] ?? 0;
    const armAngle = profile.armAngle[frameIndex] ?? profile.armAngle[0] ?? 0;
    const swordAngle = profile.swordAngle[frameIndex] ?? profile.swordAngle[0] ?? 0;
    const swordReach = profile.swordReach[frameIndex] ?? profile.swordReach[0] ?? 96;
    const swordAlpha = profile.swordAlpha[frameIndex] ?? profile.swordAlpha[0] ?? 0.2;
    const dir = this.facingRight ? 1 : -1;

    this.tianjianBodyLayer
      .setPosition(this.x, this.y + bodyOffsetY)
      .setFrame(frame)
      .setFlipX(!this.facingRight)
      .setAngle(bodyLean * dir)
      .setAlpha(this.alpha)
      .setDepth(this.depth);

    const shoulderX = this.x + dir * 18;
    const shoulderY = this.y - 118 + bodyOffsetY;
    const armLength = 48;
    const armRad = Phaser.Math.DegToRad(armAngle);
    const handX = shoulderX + Math.cos(armRad) * armLength * dir;
    const handY = shoulderY + Math.sin(armRad) * armLength;
    const swordRad = Phaser.Math.DegToRad(swordAngle);
    const swordX = handX + Math.cos(swordRad) * swordReach * dir;
    const swordY = handY + Math.sin(swordRad) * swordReach;

    this.tianjianArmLayer.clear();
    this.tianjianArmLayer.lineStyle(11, 0x1e4f69, 0.92 * this.alpha);
    this.tianjianArmLayer.lineBetween(shoulderX, shoulderY, handX, handY);
    this.tianjianArmLayer.fillStyle(0xd9f8ff, 0.95 * this.alpha);
    this.tianjianArmLayer.fillCircle(handX, handY, 7);
    this.tianjianArmLayer.setDepth(this.depth + 1);

    this.tianjianSwordLayer.clear();
    this.tianjianSwordLayer.lineStyle(5, 0xe7fbff, 0.98 * this.alpha);
    this.tianjianSwordLayer.lineBetween(handX, handY, swordX, swordY);
    this.tianjianSwordLayer.lineStyle(17, 0x80eaff, swordAlpha * this.alpha);
    this.tianjianSwordLayer.lineBetween(handX, handY, swordX, swordY);
    this.tianjianSwordLayer.fillStyle(0xffffff, 0.65 * this.alpha);
    this.tianjianSwordLayer.fillCircle(swordX, swordY, 4);
    this.tianjianSwordLayer.setDepth(this.depth + 2);
  }

  private getTianjianProfileFrameIndex(profile: TianjianAnimationProfile): number {
    if (profile.frames.length <= 1) return 0;

    const rawIndex = Math.floor((this.tianjianProfileTime / 1000) * profile.frameRate);
    if (profile.loop) {
      return rawIndex % profile.frames.length;
    }
    return Phaser.Math.Clamp(rawIndex, 0, profile.frames.length - 1);
  }

  private getTianjianProfileKey(body: Phaser.Physics.Arcade.Body): string {
    if (this.state === PlayerState.ATTACKING) {
      return `basic${Phaser.Math.Clamp(this.currentAttackStep || 1, 1, 3)}`;
    }
    if (this.state === PlayerState.SKILL_CASTING) {
      return this.getTianjianSkillProfileKey(this.currentSkillSlotIndex);
    }
    if (this.state === PlayerState.HURT) return 'hurt';
    if (this.state === PlayerState.KNOCKDOWN) return 'knockdown';
    if (this.state === PlayerState.RECOVERING) return 'recover';
    if (this.state === PlayerState.JUMPING) return body.velocity.y < 0 ? 'jump' : 'fall';
    if (this.state === PlayerState.RUNNING) return 'run';
    return 'idle';
  }

  private getTianjianSkillProfileKey(slotIndex: number): string {
    if (slotIndex === 1) return 'skillI';
    if (slotIndex === 2) return 'skillO';
    return 'skillU';
  }

  private createTianjianSlashLayer(profileKey: string): void {
    if (this.mechaType !== MechaType.TIAN_JIAN) return;

    const profile = TIANJIAN_ANIMATION_PROFILES[profileKey] ?? TIANJIAN_ANIMATION_PROFILES.basic1;
    const dir = this.facingRight ? 1 : -1;
    const slash = this.scene.add.graphics();
    slash.setDepth(this.depth + 3);
    slash.setPosition(
      this.x + dir * profile.slashOffsetX,
      this.y + profile.slashOffsetY
    );
    slash.setScale(dir * profile.slashScale, profile.slashScale);
    slash.lineStyle(18, 0x80eaff, 0.54);
    slash.beginPath();
    slash.arc(0, 0, 52, Phaser.Math.DegToRad(-62), Phaser.Math.DegToRad(58), false);
    slash.strokePath();
    slash.lineStyle(6, 0xffffff, 0.82);
    slash.beginPath();
    slash.arc(0, 0, 64, Phaser.Math.DegToRad(-52), Phaser.Math.DegToRad(48), false);
    slash.strokePath();
    slash.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: dir * (profile.slashScale + 0.42),
      scaleY: profile.slashScale + 0.34,
      duration: 190,
      ease: 'Sine.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  private createTianjianRunAfterimage(profile: TianjianAnimationProfile): void {
    if (!this.tianjianBodyLayer) return;

    const frameIndex = this.getTianjianProfileFrameIndex(profile);
    const frame = profile.frames[frameIndex] ?? profile.frames[0] ?? 2;
    this.createWorldSpaceAfterimage(frame, profile.bodyOffsetY[frameIndex] ?? 0);
  }

  private createWorldSpaceAfterimage(frame: number, bodyOffsetY: number): void {
    const dir = this.facingRight ? 1 : -1;
    const trailKey = this.scene.textures.exists('visual_fx_trail') ? 'visual_fx_trail' : 'fx_hit';
    const trail = this.scene.add.image(this.x - dir * 34, this.y - 72 + bodyOffsetY, trailKey);
    trail
      .setDepth(this.depth - 2)
      .setScale(dir * 0.5, 0.3)
      .setAlpha(0.18)
      .setTint(0x8defff)
      .setBlendMode(Phaser.BlendModes.ADD);

    const afterimage = this.scene.add.sprite(this.x, this.y + bodyOffsetY, 'mecha_tianjian');
    afterimage
      .setOrigin(0.5, 0.93)
      .setFrame(frame)
      .setScale(0.62)
      .setFlipX(!this.facingRight)
      .setAlpha(0.16)
      .setTint(0x8defff)
      .setDepth(this.depth - 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: [afterimage, trail],
      x: `+=${this.facingRight ? -28 : 28}`,
      alpha: 0,
      duration: 210,
      ease: 'Sine.easeOut',
      onComplete: () => {
        afterimage.destroy();
        trail.destroy();
      },
    });
  }

  private updateAnimations(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.mechaType === MechaType.TIAN_JIAN && this.tianjianBodyLayer) {
      this.applyTianjianAnimationProfile(this.getTianjianProfileKey(body), delta);
      return;
    }

    switch (this.state) {
      case PlayerState.IDLE:
        this.playAnim(`${this.getAnimPrefix()}_idle`);
        break;
      case PlayerState.RUNNING:
        this.playAnim(`${this.getAnimPrefix()}_run`);
        break;
      case PlayerState.JUMPING:
        if (this.scene.anims.exists(`${this.getAnimPrefix()}_jump`)) {
          this.playAnim(`${this.getAnimPrefix()}_jump`);
        } else if (body.velocity.y < 0) {
          this.setDirectFrame(9);
        } else {
          this.setDirectFrame(10);
        }
        break;
      case PlayerState.ATTACKING:
        this.playAnim(`${this.getAnimPrefix()}_attack`);
        break;
      case PlayerState.SKILL_CASTING:
        this.playAnim(`${this.getAnimPrefix()}_skill`);
        break;
      case PlayerState.HURT:
        if (this.scene.anims.exists(`${this.getAnimPrefix()}_hurt`)) {
          this.playAnim(`${this.getAnimPrefix()}_hurt`);
        } else {
          this.setDirectFrame(11);
        }
        break;
      case PlayerState.KNOCKDOWN:
        this.setDirectFrame(10);
        break;
      case PlayerState.RECOVERING:
        this.setDirectFrame(9);
        break;
      case PlayerState.BLOCKING:
        this.setDirectFrame(15);
        break;
      case PlayerState.DEAD:
        this.setDirectFrame(14);
        break;
    }
  }

  private lastAnimKey: string = '';

  private playAnim(key: string): void {
    if (key === this.lastAnimKey) return;
    this.lastAnimKey = key;
    if (this.scene && this.scene.anims && this.scene.anims.exists(key)) {
      this.play(key);
    }
  }

  private setDirectFrame(frame: number): void {
    this.lastAnimKey = '';
    this.setFrame(frame);
  }

  private getAnimPrefix(): string {
    return `mecha_${this.mechaType}`;
  }

  private regenMp(delta: number): void {
    this.mpRegenTimer += delta;
    if (this.mpRegenTimer >= 500) {
      this.mpRegenTimer = 0;
      this.mp = Math.min(this.maxMp, this.mp + 2);
      this.onMpChange?.(this.mp, this.maxMp);
    }
  }

  public takeDamage(damage: number, knockbackDir: number = 0): boolean {
    if (this.invincibleTimer > 0 || this.state === PlayerState.DEAD) return false;

    let actualDamage = damage;

    if (this.state === PlayerState.BLOCKING) {
      actualDamage = Math.floor(damage * 0.2);
      this.createBlockEffect();
    } else {
      actualDamage = Math.max(1, damage - Math.floor(this.getTotalDefense() * 0.3));
    }

    this.hp = Math.max(0, this.hp - actualDamage);
    this.onHpChange?.(this.hp, this.maxHp);
    this.showDamageNumber(actualDamage, true);

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    if (this.state !== PlayerState.BLOCKING) {
      this.invincibleTimer = PLAYER_HURT_INVINCIBLE_MS;
      this.attackFinishEvent?.remove(false);
      this.skillCastEvent?.remove(false);
      this.hurtRecoverEvent?.remove(false);
      this.knockdownRecoverEvent?.remove(false);
      this.attackFinishEvent = undefined;
      this.skillCastEvent = undefined;
      this.isAttacking = false;
      this.attackCooldown = 0;
      this.skillCastTimer = 0;
      this.currentSkillSlotIndex = -1;
      this.queuedAttack = false;
      this.queuedAttackCount = 0;
      this.lastAnimKey = '';

      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(knockbackDir * 200);
      body.setVelocityY(-200);

      const shouldKnockdown = actualDamage >= Math.max(80, this.maxHp * 0.12) || Math.abs(knockbackDir) > 0;
      if (shouldKnockdown) {
        this.state = PlayerState.KNOCKDOWN;
        this.knockdownRecoverEvent = this.scene.time.delayedCall(360, () => {
          this.recoverFromKnockdownToMovement();
        });
      } else {
        this.state = PlayerState.HURT;
        this.hurtRecoverEvent = this.scene.time.delayedCall(220, () => {
          this.recoverFromHurtToMovement();
        });
      }
    } else {
      this.invincibleTimer = PLAYER_BLOCK_INVINCIBLE_MS;
    }

    return true;
  }

  private recoverFromHurtToMovement(): void {
    this.hurtRecoverEvent?.remove(false);
    this.hurtRecoverEvent = undefined;
    if (this.state !== PlayerState.HURT) return;

    this.state = PlayerState.RECOVERING;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.scene.time.delayedCall(120, () => {
      if (this.state !== PlayerState.RECOVERING) return;
      this.state = body.onFloor() ? PlayerState.IDLE : PlayerState.JUMPING;
      this.handleMovement();
    });
  }

  private recoverFromKnockdownToMovement(): void {
    this.knockdownRecoverEvent?.remove(false);
    this.knockdownRecoverEvent = undefined;
    if (this.state !== PlayerState.KNOCKDOWN) return;

    this.state = PlayerState.RECOVERING;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.scene.time.delayedCall(180, () => {
      if (this.state !== PlayerState.RECOVERING) return;
      this.state = body.onFloor() ? PlayerState.IDLE : PlayerState.JUMPING;
      this.handleMovement();
    });
  }

  private createBlockEffect(): void {
    const effect = this.scene.add.sprite(this.x, this.y - 10, 'fx_hit');
    effect.setDepth(15);
    effect.setScale(1.5);
    effect.setTint(0x4488ff);

    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => effect.destroy(),
    });
  }

  private showDamageNumber(damage: number, isPlayer: boolean): void {
    const text = this.scene.add.text(this.x, this.y - 50, `-${damage}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: isPlayer ? '#ff4444' : '#ffaa44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: text,
      y: this.y - 90,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private die(): void {
    this.state = PlayerState.DEAD;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      y: this.y - 20,
      duration: 1000,
      ease: 'Power2',
      yoyo: true,
    });
  }

  public gainXp(amount: number): void {
    this.xp += amount;
    this.onXpChange?.(this.xp, this.xpToNext);

    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.level++;
    this.xpToNext = Math.floor(this.xpToNext * 1.3);

    this.baseMaxHp += 50;
    this.baseMaxMp += 5;
    this.baseAttack += 5;
    this.baseDefense += 3;
    this.applyTotalStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this.onLevelUp?.(this.level);
    this.onHpChange?.(this.hp, this.maxHp);
    this.onMpChange?.(this.mp, this.maxMp);
    this.onXpChange?.(this.xp, this.xpToNext);

    const levelUpText = this.scene.add.text(this.x, this.y - 80, `LEVEL UP! Lv.${this.level}`, {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffdd44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: levelUpText,
      y: this.y - 130,
      alpha: 0,
      duration: 1500,
      onComplete: () => levelUpText.destroy(),
    });

    const healEffect = this.scene.add.sprite(this.x, this.y, 'fx_heal');
    healEffect.setDepth(15);
    healEffect.setScale(2);

    this.scene.tweens.add({
      targets: healEffect,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 800,
      onComplete: () => healEffect.destroy(),
    });
  }

  public getAttackEffects(): Phaser.GameObjects.GameObject[] {
    return this.attackEffects;
  }

  public clearAttackEffect(effect: Phaser.GameObjects.GameObject): void {
    const idx = this.attackEffects.indexOf(effect);
    if (idx >= 0) {
      this.attackEffects.splice(idx, 1);
    }
  }

  public isBlocking(): boolean {
    return this.state === PlayerState.BLOCKING;
  }

  public getSkillCooldowns(): Map<string, number> {
    return this.skillCooldowns;
  }

  public updateSkillCooldowns(delta: number): void {
    this.skillCooldowns.forEach((value, key) => {
      const newCooldown = value - delta;
      if (newCooldown <= 0) {
        this.skillCooldowns.delete(key);
      } else {
        this.skillCooldowns.set(key, newCooldown);
      }
    });
  }

  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.onHpChange?.(this.hp, this.maxHp);
  }

  public restoreMp(amount: number): void {
    this.mp = Math.min(this.maxMp, this.mp + amount);
    this.onMpChange?.(this.mp, this.maxMp);
  }

  public isDead(): boolean {
    return this.state === PlayerState.DEAD;
  }

  public getComboCount(): number {
    return this.comboCount;
  }

  public getEquippedStats(): ReturnType<typeof calculateEquipBonus> {
    return calculateEquipBonus(this.equipment);
  }

  public getTotalAttack(): number {
    return this.attack;
  }

  public getTotalDefense(): number {
    return this.defense;
  }

  public getTotalSpeed(): number {
    return this.speed;
  }

  public getTotalCritRate(): number {
    return this.baseCritRate + (this.getEquippedStats().critRate || 0);
  }

  public getTotalCritDamage(): number {
    return this.baseCritDamage + (this.getEquippedStats().critDamage || 0);
  }

  public getTotalMaxHp(): number {
    return this.maxHp;
  }

  public getBaseStats(): { attack: number; defense: number; speed: number; maxHp: number; maxMp: number } {
    return {
      attack: this.baseAttack,
      defense: this.baseDefense,
      speed: this.baseSpeed,
      maxHp: this.baseMaxHp,
      maxMp: this.baseMaxMp,
    };
  }

  private applyTotalStats(): void {
    const previousMaxHp = this.maxHp;
    const previousMaxMp = this.maxMp;
    const equips = this.getEquippedStats();

    this.maxHp = Math.max(1, this.baseMaxHp + (equips.maxHp || 0));
    this.maxMp = Math.max(1, this.baseMaxMp + (equips.maxMp || 0));
    this.attack = Math.max(1, this.baseAttack + (equips.attack || 0));
    this.defense = Math.max(0, this.baseDefense + (equips.defense || 0));
    this.speed = Math.max(80, this.baseSpeed + (equips.speed || 0));

    if (previousMaxHp > 0 && this.maxHp !== previousMaxHp) {
      const hpDelta = this.maxHp - previousMaxHp;
      this.hp = Phaser.Math.Clamp(this.hp + Math.max(0, hpDelta), 1, this.maxHp);
      this.onHpChange?.(this.hp, this.maxHp);
    } else {
      this.hp = Phaser.Math.Clamp(this.hp, 1, this.maxHp);
    }

    if (previousMaxMp > 0 && this.maxMp !== previousMaxMp) {
      const mpDelta = this.maxMp - previousMaxMp;
      this.mp = Phaser.Math.Clamp(this.mp + Math.max(0, mpDelta), 0, this.maxMp);
      this.onMpChange?.(this.mp, this.maxMp);
    } else {
      this.mp = Phaser.Math.Clamp(this.mp, 0, this.maxMp);
    }
  }

  public applySaveData(saveData: PlayerSaveData): void {
    this.level = saveData.level;
    this.xp = saveData.xp;
    this.xpToNext = getXpForLevel(this.level);
    this.baseMaxHp = saveData.stats.maxHp;
    this.baseAttack = saveData.stats.attack;
    this.baseDefense = saveData.stats.defense;
    this.baseSpeed = saveData.stats.speed;
    this.baseMaxMp = saveData.stats.maxMp;
    this.maxMp = this.baseMaxMp;
    this.mp = Phaser.Math.Clamp(saveData.stats.mp, 0, this.maxMp);
    this.baseCritRate = saveData.stats.critRate;
    this.baseCritDamage = saveData.stats.critDamage;
    this.gold = saveData.gold;
    this.equipment = { ...saveData.equips };
    this.inventory = saveData.inventory
      .map((id) => getEquipById(id))
      .filter((item): item is EquipData => item !== undefined);
    this.maxHp = this.baseMaxHp;
    this.hp = Phaser.Math.Clamp(saveData.stats.hp, 1, this.maxHp);
    this.applyTotalStats();
    this.onMpChange?.(this.mp, this.maxMp);
    this.onXpChange?.(this.xp, this.xpToNext);
    this.onEquipmentChange?.();
  }

  public toSaveData(previousSave?: PlayerSaveData): PlayerSaveData {
    const baseStats = this.getBaseStats();
    const data = previousSave ? { ...previousSave } : createNewSave(this.mechaType);

    return {
      ...data,
      mechaType: this.mechaType,
      level: this.level,
      xp: this.xp,
      equips: this.equipment,
      inventory: this.inventory.map((e) => e.id),
      gold: this.gold,
      stats: {
        hp: this.hp,
        maxHp: baseStats.maxHp,
        mp: this.mp,
        maxMp: baseStats.maxMp,
        attack: baseStats.attack,
        defense: baseStats.defense,
        speed: baseStats.speed,
        critRate: this.baseCritRate,
        critDamage: this.baseCritDamage,
      },
    };
  }

  private persistProgression(): void {
    this.onProgressionChange?.();
  }

  public equipItem(item: EquipData): boolean {
    const slot = item.slot;
    const current = this.equipment[slot];
    this.equipment[slot] = item;

    const invIdx = this.inventory.findIndex((i) => i.id === item.id);
    if (invIdx >= 0) {
      this.inventory.splice(invIdx, 1);
    }

    if (current) {
      this.inventory.push(current);
    }

    this.applyTotalStats();
    this.onEquipmentChange?.();
    this.persistProgression();
    return true;
  }

  public unequipItem(slot: EquipSlot): EquipData | null {
    const current = this.equipment[slot];
    if (!current) return null;

    this.equipment[slot] = null;
    this.inventory.push(current);
    this.applyTotalStats();
    this.onEquipmentChange?.();
    this.persistProgression();
    return current;
  }

  public addToInventory(item: EquipData): void {
    this.inventory.push(item);
    this.persistProgression();
  }

  public removeFromInventory(itemId: string): boolean {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx < 0) return false;
    this.inventory.splice(idx, 1);
    this.persistProgression();
    return true;
  }
}
