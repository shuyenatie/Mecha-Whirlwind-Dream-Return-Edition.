import { readFileSync } from 'node:fs';

const source = readFileSync('src/entities/Player.ts', 'utf8');

const failures = [];

if (!source.includes('private finishAttack(): void')) {
  failures.push('Player should centralize attack cleanup in finishAttack().');
}

const updateTimersMatch = source.match(/private updateTimers\(delta: number\): void \{[\s\S]*?\n  \}/);
if (!updateTimersMatch || !/this\.finishAttack\(\);/.test(updateTimersMatch[0])) {
  failures.push('Cooldown expiry in updateTimers should call finishAttack() so ATTACKING cannot lock movement.');
}

const performAttackMatch = source.match(/private performAttack\(\): void \{[\s\S]*?\n  \}/);
if (!performAttackMatch || !/this\.finishAttack\(\);/.test(performAttackMatch[0])) {
  failures.push('The delayed attack timer should use finishAttack() for the same cleanup path.');
}

if (!/this\.lastAnimKey = '';/.test(source.match(/private finishAttack\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? '')) {
  failures.push('finishAttack() should clear lastAnimKey so idle/run animations can resume cleanly.');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Player attack release cleanup is wired correctly.');
