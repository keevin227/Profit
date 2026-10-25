// Fails if the published deck mentions anything that would reveal how the engine is built.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('../site/', import.meta.url).pathname;
const FORBIDDEN = [
  /\bOMR\b/, /\brials?\b/i, /\bHiGHS\b/, /chronos/i, /dowhy/i, /causalpy/i, /prisma/i, /postgres/i,
  /mathjs/i, /numpy/i, /typescript/i, /\bzod\b/i, /gapgpt/i, /openrouter/i, /\bgpt-/i, /claude-/i,
  /drydock/i, /maritime/i, /shadow price/i, /dual value/i, /bisection/i, /holt/i, /winters/i,
  /\bCRPS\b/, /\bBrier\b/i, /\bMASE\b/, /scoringrules/i, /webassembly/i, /sha-?256/i, /tickup/i,
  /\bL[0-4]\b/, /valuegram/i, /runProfitEngine/, /brainAnalyst/, /profit-lab/i, /\bpack\b/i, /0\.001/
];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (['.html', '.js', '.css', '.json', '.svg'].includes(extname(p))) files.push(p);
  }
})(ROOT);

let bad = 0;
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const re of FORBIDDEN) if (re.test(line)) { bad++; console.error(`${f.replace(ROOT, 'site/')}:${i + 1}  ${re}  →  ${line.trim().slice(0, 120)}`); }
  });
}
if (bad) { console.error(`\n${bad} disclosure issue(s) found.`); process.exit(1); }
console.log(`Disclosure check passed (${files.length} files).`);
