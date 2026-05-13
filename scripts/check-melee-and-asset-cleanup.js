import { existsSync, readFileSync } from 'node:fs';

const playerSource = readFileSync('src/entities/Player.ts', 'utf8');
const gameSceneSource = readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const failures = [];

if (!playerSource.includes('private createMeleeHitbox(')) {
  failures.push('Player should create melee hitboxes through createMeleeHitbox().');
}

if (!playerSource.includes('private getMeleeHitboxSize(')) {
  failures.push('Player should define mecha-aware melee hitbox dimensions.');
}

if (!/setAllowGravity\(false\)/.test(playerSource) || !/setImmovable\(true\)/.test(playerSource)) {
  failures.push('Melee hitboxes should use a stable dynamic Arcade body.');
}

if (!/hitEnemies/.test(playerSource) || !/hitEnemies/.test(gameSceneSource)) {
  failures.push('Melee hitboxes should track hitEnemies to prevent repeated damage during the active window.');
}

if (!/registerPlayerHitbox\?: \(hitbox: Phaser\.GameObjects\.GameObject\) => void;/.test(playerSource)) {
  failures.push('Player should call a scene-level registerPlayerHitbox(hitbox) hook for dynamic melee hitboxes.');
}

if (!/public registerPlayerHitbox\(hitbox: Phaser\.GameObjects\.GameObject\): void/.test(gameSceneSource)) {
  failures.push('GameScene should expose registerPlayerHitbox(hitbox) to attach per-hitbox overlap callbacks.');
}

if (!/this\.physics\.add\.overlap\(hitbox, this\.enemies/.test(gameSceneSource)) {
  failures.push('GameScene registerPlayerHitbox() should attach an immediate overlap for each dynamic melee hitbox.');
}

if (!existsSync('tools/clean_tianjian_assets.ps1')) {
  failures.push('tools/clean_tianjian_assets.ps1 should exist for portrait/spritesheet edge cleanup.');
}

if (!packageJson.scripts?.['clean:tianjian-assets']) {
  failures.push('package.json should expose clean:tianjian-assets.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Melee range and Tianjian asset cleanup are wired correctly.');
