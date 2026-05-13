import Phaser from 'phaser';

const POST_HIT_RETREAT_MS = 180;

interface CombatSceneLike extends Phaser.Scene {
  getEnemyProjectileGroup?: () => Phaser.Physics.Arcade.Group;
  createEnemyMeleeHitbox?: (
    x: number,
    y: number,
    width: number,
    height: number,
    damage: number,
    activeMs: number,
    owner: Enemy,
    attackId: string,
    recoveryMs?: number
  ) => void;
}

export enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  HURT = 'hurt',
  DEAD = 'dead',
}

export interface EnemyHitReaction {
  knockbackX?: number;
  knockbackY?: number;
  hurtTime?: number;
  tintDuration?: number;
  hitType?: 'basic' | 'skill' | 'ultimate';
  sourceKey?: string;
  comboProtectMs?: number;
  forceHit?: boolean;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyId: string = '';
  public enemyName: string = '';
  public hp: number = 200;
  public maxHp: number = 200;
  public attack: number = 20;
  public defense: number = 10;
  public speed: number = 100;
  public attackRange: number = 60;
  public attackSpeed: number = 1.0;
  public xpReward: number = 30;
  public behavior: string = 'patrol';
  public attackWindupMs: number = 380;
  public attackActiveMs: number = 140;
  public attackWidth: number = 72;
  public attackHeight: number = 52;
  public attackRecoveryMs: number = 320;
  public knockbackResist: number = 0;
  public telegraphColor: number = 0xff6644;

  public state: EnemyState = EnemyState.IDLE;
  public facingRight: boolean = false;

  private patrolOriginX: number = 0;
  private patrolRange: number = 150;
  private patrolDir: number = 1;
  public attackCooldown: number = 0;
  private hurtTimer: number = 0;
  private landingTimer: number = 0;
  private hitInvulnerableUntil: number = 0;
  private recentHitSources: Map<string, number> = new Map();
  private detectionRange: number = 300;
  private target?: Phaser.GameObjects.GameObject;
  private attackInProgress: boolean = false;
  private attackTelegraph?: Phaser.GameObjects.Graphics;
  private lastHitConnected: boolean = false;
  private postAttackRetreatTimer: number = 0;

  private hpBar!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(true);

    (this.body as Phaser.Physics.Arcade.Body).setSize(30, 50);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(8, 12);

    this.createHpBar();
  }

  private createHpBar(): void {
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setDepth(15);

    this.nameText = this.scene.add.text(0, 0, this.enemyName, {
      fontSize: '10px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ff6644',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
  }

  public initFromData(data: {
    id: string;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    attackRange: number;
    attackSpeed: number;
    xpReward: number;
    behavior: string;
    attackWindupMs?: number;
    attackActiveMs?: number;
    attackWidth?: number;
    attackHeight?: number;
    attackRecoveryMs?: number;
    knockbackResist?: number;
    telegraphColor?: number;
  }): void {
    this.enemyId = data.id;
    this.enemyName = data.name;
    this.maxHp = data.hp;
    this.hp = data.hp;
    this.attack = data.attack;
    this.defense = data.defense;
    this.speed = data.speed;
    this.attackRange = data.attackRange;
    this.attackSpeed = data.attackSpeed;
    this.xpReward = data.xpReward;
    this.behavior = data.behavior;
    this.attackWindupMs = data.attackWindupMs ?? this.attackWindupMs;
    this.attackActiveMs = data.attackActiveMs ?? this.attackActiveMs;
    this.attackWidth = data.attackWidth ?? this.attackWidth;
    this.attackHeight = data.attackHeight ?? this.attackHeight;
    this.attackRecoveryMs = data.attackRecoveryMs ?? this.attackRecoveryMs;
    this.knockbackResist = data.knockbackResist ?? this.knockbackResist;
    this.telegraphColor = data.telegraphColor ?? this.telegraphColor;
    this.patrolOriginX = this.x;

    this.nameText.setText(this.enemyName);
  }

  public setTarget(target: Phaser.GameObjects.GameObject): void {
    this.target = target;
  }

  update(delta: number): void {
    if (this.state === EnemyState.DEAD) return;

    this.updateTimers(delta);
    this.updateAI();
    this.updateHpBar();
  }

  private updateTimers(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.postAttackRetreatTimer > 0) {
      this.postAttackRetreatTimer -= delta;
      if (this.postAttackRetreatTimer <= 0) {
        this.settleHitDrift();
      }
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0 && this.state === EnemyState.HURT) {
        this.settleHitDrift();
        this.state = EnemyState.IDLE;
      }
    }

    if (this.landingTimer > 0) {
      this.landingTimer -= delta;
      if (this.landingTimer <= 0) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body.onFloor()) {
          this.settleHitDrift();
          body.setVelocityY(0);
        }
      }
    }

    const now = this.scene.time.now;
    this.recentHitSources.forEach((expiresAt, sourceKey) => {
      if (expiresAt <= now) {
        this.recentHitSources.delete(sourceKey);
      }
    });
  }

  private updateAI(): void {
    if (this.state === EnemyState.HURT && this.attackInProgress) {
      this.interruptAttack();
      return;
    }
    if (this.postAttackRetreatTimer > 0) return;
    if (!this.target || this.state === EnemyState.HURT) return;

    const player = this.target as Phaser.Physics.Arcade.Sprite;
    const dist = Math.abs(player.x - this.x) + Math.max(0, Math.abs(player.y - this.y) - 48) * 1.35;
    const dirToPlayer = player.x > this.x ? 1 : -1;

    this.facingRight = dirToPlayer > 0;
    this.setFlipX(!this.facingRight);

    switch (this.behavior) {
      case 'patrol':
        this.aiPatrol(dist, dirToPlayer);
        break;
      case 'chase':
        this.aiChase(dist, dirToPlayer);
        break;
      case 'sniper':
        this.aiSniper(dist, dirToPlayer);
        break;
      case 'stationary':
        this.aiStationary(dist, dirToPlayer);
        break;
    }
  }

  private aiPatrol(dist: number, dirToPlayer: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (dist < this.detectionRange) {
      this.state = EnemyState.CHASE;
      this.aiChase(dist, dirToPlayer);
    } else {
      this.state = EnemyState.PATROL;
      body.setVelocityX(this.patrolDir * this.speed * 0.5);

      if (Math.abs(this.x - this.patrolOriginX) > this.patrolRange) {
        this.patrolDir *= -1;
      }

      this.facingRight = this.patrolDir > 0;
      this.setFlipX(!this.facingRight);
    }
  }

  private aiChase(dist: number, dirToPlayer: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (dist < this.attackRange) {
      this.state = EnemyState.ATTACK;
      body.setVelocityX(0);
      this.performAttack();
    } else if (dist < this.detectionRange * 1.5) {
      this.state = EnemyState.CHASE;
      body.setVelocityX(dirToPlayer * this.speed);
    } else {
      this.state = EnemyState.IDLE;
      body.setVelocityX(0);
    }
  }

  private aiSniper(dist: number, dirToPlayer: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (dist < 100) {
      body.setVelocityX(-dirToPlayer * this.speed);
      this.state = EnemyState.CHASE;
    } else if (dist < this.attackRange) {
      body.setVelocityX(0);
      this.state = EnemyState.ATTACK;
      this.performAttack();
    } else if (dist < this.detectionRange) {
      body.setVelocityX(0);
      this.state = EnemyState.ATTACK;
      this.performAttack();
    } else {
      this.state = EnemyState.IDLE;
      body.setVelocityX(0);
    }
  }

  private aiStationary(dist: number, dirToPlayer: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    if (dist < this.attackRange) {
      this.state = EnemyState.ATTACK;
      this.performAttack();
    } else {
      this.state = EnemyState.IDLE;
    }
  }

  private performAttack(): void {
    if (this.attackCooldown > 0 || this.attackInProgress) return;

    this.attackCooldown = 1000 / this.attackSpeed;
    this.attackInProgress = true;

    if (this.behavior === 'sniper') {
      this.spawnSniperTelegraph();
      this.scene.time.delayedCall(this.attackWindupMs, () => {
        if (this.active && this.attackInProgress && this.state !== EnemyState.DEAD && this.state !== EnemyState.HURT) {
          this.shootProjectile();
        }
        this.attackInProgress = false;
      });
      return;
    }

    this.startTelegraphedMeleeAttack();
  }

  private startTelegraphedMeleeAttack(): void {
    this.spawnAttackTelegraph();

    this.scene.time.delayedCall(this.attackWindupMs, () => {
      if (!this.active || !this.attackInProgress || this.state === EnemyState.DEAD || this.state === EnemyState.HURT) {
        this.attackInProgress = false;
        this.attackTelegraph?.destroy();
        this.attackTelegraph = undefined;
        return;
      }

      this.attackTelegraph?.destroy();
      this.attackTelegraph = undefined;

      const hitboxX = this.x + (this.facingRight ? this.attackWidth * 0.5 : -this.attackWidth * 0.5);
      const combatScene = this.scene as CombatSceneLike;
      combatScene.createEnemyMeleeHitbox?.(
        hitboxX,
        this.y - 4,
        this.attackWidth,
        this.attackHeight,
        this.attack,
        this.attackActiveMs,
        this,
        `${this.enemyId}_melee`,
        this.attackRecoveryMs
      );

      this.scene.time.delayedCall(this.attackActiveMs, () => {
        this.enterPostAttackRecovery(this.attackRecoveryMs);
      });
    });
  }

  private spawnAttackTelegraph(): void {
    this.attackTelegraph?.destroy();
    this.attackTelegraph = this.scene.add.graphics();
    this.attackTelegraph.setDepth(6);

    const drawTelegraph = () => {
      if (!this.attackTelegraph || !this.active) return;
      const x = this.x + (this.facingRight ? 14 : -14);
      const rectX = x + (this.facingRight ? 0 : -this.attackWidth);
      const rectY = this.y - this.attackHeight * 0.62;
      this.attackTelegraph.clear();
      this.attackTelegraph.fillStyle(this.telegraphColor, 0.18);
      this.attackTelegraph.fillRect(rectX, rectY, this.attackWidth, this.attackHeight);
      this.attackTelegraph.lineStyle(2, this.telegraphColor, 0.85);
      this.attackTelegraph.strokeRect(rectX, rectY, this.attackWidth, this.attackHeight);
    };

    drawTelegraph();
    this.scene.tweens.add({
      targets: this.attackTelegraph,
      alpha: 0.35,
      duration: Math.max(80, this.attackWindupMs / 4),
      yoyo: true,
      repeat: Math.max(1, Math.floor(this.attackWindupMs / 120)),
      onUpdate: drawTelegraph,
    });
  }

  private spawnSniperTelegraph(): void {
    this.attackTelegraph?.destroy();
    this.attackTelegraph = this.scene.add.graphics();
    this.attackTelegraph.setDepth(7);

    const drawAimLine = () => {
      if (!this.attackTelegraph || !this.active) return;
      const length = this.attackRange;
      const startX = this.x + (this.facingRight ? 18 : -18);
      const endX = startX + (this.facingRight ? length : -length);
      const y = this.y - 6;
      this.attackTelegraph.clear();
      this.attackTelegraph.lineStyle(2, this.telegraphColor, 0.92);
      this.attackTelegraph.lineBetween(startX, y, endX, y);
      this.attackTelegraph.fillStyle(this.telegraphColor, 0.22);
      this.attackTelegraph.fillCircle(endX, y, 8);
    };

    drawAimLine();
    this.scene.tweens.add({
      targets: this.attackTelegraph,
      alpha: 0.2,
      duration: 90,
      yoyo: true,
      repeat: Math.max(3, Math.floor(this.attackWindupMs / 90)),
      onUpdate: drawAimLine,
      onComplete: () => {
        this.attackTelegraph?.destroy();
        this.attackTelegraph = undefined;
      },
    });
  }

  private shootProjectile(): void {
    const bullet = this.scene.physics.add.sprite(
      this.x + (this.facingRight ? 20 : -20),
      this.y - 5,
      'proj_enemy_bullet'
    );
    bullet.setDepth(8);
    bullet.setVelocityX(this.facingRight ? 300 : -300);
    bullet.setData('damage', this.attack);
    bullet.setData('owner', 'enemy');
    bullet.setScale(1.2);
    this.registerEnemyProjectile(bullet);

    this.scene.tweens.add({
      targets: bullet,
      alpha: 0,
      duration: Math.max(1200, this.attackActiveMs * 8),
      onComplete: () => {
        if (bullet.active) bullet.destroy();
      },
    });
  }

  public takeDamage(damage: number, knockbackDir: number = 0, reaction: EnemyHitReaction = {}): boolean {
    this.lastHitConnected = false;
    const now = this.scene.time.now;
    const hitType = reaction.hitType ?? 'basic';
    const sourceKey = reaction.sourceKey;
    const comboProtectMs = reaction.comboProtectMs ?? (hitType === 'ultimate' ? 42 : hitType === 'skill' ? 58 : 90);
    const superArmor = this.getData('superArmor') === true;

    if (sourceKey && (this.recentHitSources.get(sourceKey) || 0) > now) {
      return false;
    }

    if (!reaction.forceHit && this.hitInvulnerableUntil > now && hitType !== 'ultimate') {
      return false;
    }

    if (sourceKey) {
      this.recentHitSources.set(sourceKey, now + comboProtectMs);
    }
    this.hitInvulnerableUntil = now + Math.min(comboProtectMs, hitType === 'basic' ? 90 : 48);

    const actualDamage = Math.max(1, damage - Math.floor(this.defense * 0.3));
    this.hp = Math.max(0, this.hp - actualDamage);
    this.lastHitConnected = true;

    this.showDamageNumber(actualDamage, hitType);

    if (!superArmor) {
      this.interruptAttack();
      this.state = EnemyState.HURT;
      this.hurtTimer = reaction.hurtTime ?? 200;
      this.landingTimer = Math.max(this.landingTimer, Math.min(260, this.hurtTimer + 80));
    } else {
      this.hurtTimer = 0;
      this.landingTimer = Math.max(this.landingTimer, 80);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const baseKnockbackScale = Math.max(0.05, 1 - this.knockbackResist);
    const knockbackScale = superArmor ? Math.max(0.02, baseKnockbackScale - 0.35) : baseKnockbackScale;
    body.setVelocityX(knockbackDir * (reaction.knockbackX ?? 150) * knockbackScale);
    body.setVelocityY(-(reaction.knockbackY ?? 100) * knockbackScale * (superArmor ? 0.35 : 1));

    this.setTint(0xff4444);
    this.scene.time.delayedCall(reaction.tintDuration ?? 100, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private interruptAttack(): void {
    if (!this.attackInProgress) return;

    this.attackInProgress = false;
    this.attackTelegraph?.destroy();
    this.attackTelegraph = undefined;
    this.attackCooldown = Math.max(this.attackCooldown, 260);
  }

  public enterPostAttackRecovery(recoveryMs: number = this.attackRecoveryMs, retreatDir: number = 0): void {
    if (this.state === EnemyState.DEAD || this.state === EnemyState.HURT) return;

    this.attackInProgress = false;
    this.attackTelegraph?.destroy();
    this.attackTelegraph = undefined;
    this.attackCooldown = Math.max(this.attackCooldown, recoveryMs);
    this.postAttackRetreatTimer = Math.max(this.postAttackRetreatTimer, retreatDir === 0 ? 0 : POST_HIT_RETREAT_MS);
    if (this.state === EnemyState.ATTACK) {
      this.state = EnemyState.IDLE;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(retreatDir * this.speed * 0.55);
  }

  private settleHitDrift(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }

  public didLastHitConnect(): boolean {
    return this.lastHitConnected;
  }

  private showDamageNumber(damage: number, hitType: EnemyHitReaction['hitType'] = 'basic'): void {
    const style = {
      basic: { color: '#ffdd44', fontSize: '16px', y: -40, rise: 40, scale: 1 },
      skill: { color: '#66e7ff', fontSize: '19px', y: -46, rise: 48, scale: 1.08 },
      ultimate: { color: '#ffffff', fontSize: '24px', y: -54, rise: 60, scale: 1.22 },
    }[hitType || 'basic'];
    const offsetX = Phaser.Math.Between(-18, 18);

    const text = this.scene.add.text(this.x + offsetX, this.y + style.y, `${damage}`, {
      fontSize: style.fontSize,
      fontFamily: 'Arial',
      color: style.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: hitType === 'ultimate' ? 5 : 3,
    }).setOrigin(0.5).setDepth(50).setScale(style.scale);

    this.scene.tweens.add({
      targets: text,
      y: text.y - style.rise,
      alpha: 0,
      duration: hitType === 'ultimate' ? 780 : 620,
      onComplete: () => text.destroy(),
    });
  }

  private die(): void {
    this.state = EnemyState.DEAD;
    this.attackTelegraph?.destroy();
    this.attackTelegraph = undefined;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    const explosion = this.scene.add.sprite(this.x, this.y, 'fx_explosion');
    explosion.setDepth(15);
    explosion.setScale(1.5);

    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 500,
      onComplete: () => explosion.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.3,
      duration: 400,
      onComplete: () => {
        this.hpBar.destroy();
        this.nameText.destroy();
        this.destroy();
      },
    });
  }

  private updateHpBar(): void {
    if (!this.active) return;

    this.hpBar.clear();
    this.hpBar.setPosition(this.x - 25, this.y - 45);

    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(0, 0, 50, 5);

    const hpRatio = this.hp / this.maxHp;
    const hpColor = hpRatio > 0.5 ? 0xff4444 : hpRatio > 0.25 ? 0xff8844 : 0xff2222;
    this.hpBar.fillStyle(hpColor);
    this.hpBar.fillRect(0, 0, 50 * hpRatio, 5);

    this.nameText.setPosition(this.x, this.y - 52);
  }

  public getMeleeDamage(): number {
    return this.attack;
  }

  public isDead(): boolean {
    return this.state === EnemyState.DEAD;
  }

  public removeWithoutReward(): void {
    this.attackTelegraph?.destroy();
    this.attackTelegraph = undefined;
    this.hpBar?.destroy();
    this.nameText?.destroy();
    this.destroy();
  }

  private registerEnemyProjectile(projectile: Phaser.GameObjects.GameObject): void {
    const combatScene = this.scene as CombatSceneLike;
    combatScene.getEnemyProjectileGroup?.().add(projectile);
  }
}
