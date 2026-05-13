import fs from 'node:fs';

const source = fs.readFileSync('src/scenes/GameScene.ts', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const failures = [];

if (packageJson.scripts?.['check:drops'] !== 'node scripts/check-drop-behavior.js') {
  failures.push('package.json should expose check:drops.');
}

const dropMethods = source.match(/private (?:createDrop|spawnEquipDrop)\([\s\S]*?(?=\n  private |\n  public |\n})/g) || [];
const dropSource = dropMethods.join('\n');

if (/setAllowGravity\(false\)[\s\S]{0,120}setVelocityY\(-/.test(dropSource)) {
  failures.push('Drops should not combine disabled gravity with upward velocity.');
}

if (/this\.physics\.add\.sprite\(x, y, `drop_\$\{type\}_\$\{value\}_\$\{Date\.now\(\)\}`/.test(source)) {
  failures.push('Basic drops should reuse one generated texture key instead of calling Date.now() twice.');
}

if (/this\.physics\.add\.sprite\(x, y, `drop_equip_\$\{equip\.id\}_\$\{Date\.now\(\)\}`/.test(source)) {
  failures.push('Equipment drops should reuse one generated texture key instead of calling Date.now() twice.');
}

if (!/settleDropSprite\s*\(/.test(source)) {
  failures.push('Drops should use a shared settleDropSprite() helper for bounce and cleanup timing.');
}

if (!/private dropGroup!:\s*Phaser\.Physics\.Arcade\.Group/.test(source)) {
  failures.push('GameScene should keep new drops in a dropGroup for pickup overlaps.');
}

if (/this\.drops\.map\(d => d\.sprite\)/.test(source)) {
  failures.push('Drop pickup should not bind to this.drops.map() while the array is still empty.');
}

if (!/this\.physics\.add\.overlap\(this\.player,\s*this\.dropGroup/.test(source)) {
  failures.push('Player pickup overlap should target dropGroup.');
}

if (!/this\.dropGroup\.add\(sprite\)/.test(source)) {
  failures.push('Newly spawned drops should be added to dropGroup.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Drop behavior is grounded and uses stable generated texture keys.');
