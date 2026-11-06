// `npm run mutate -- <file>`: do your tests notice small bugs?
//   npm run mutate -- src/inspection/classifyDefect.js          the team's tests and yours (tests/existing and tests/learner)
//   npm run mutate -- src/inspection/classifyDefect.js --list    only list the mutants, do not run anything
//   npm run mutate -- src/inspection/classifyDefect.js --json    the result as JSON
// For each mutant (one small deliberate bug in a copy of the file) it runs the tests. A mutant is KILLED when a test fails and
// SURVIVED when every test still passes: your tests did not notice. A stand-in for a mutation tool such as Stryker.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMutant, generateMutants } from './lib/mutants.mjs';
import { testFilesIn } from './lib/coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const list = args.includes('--list');
const json = args.includes('--json');
const target = args.find(a => !a.startsWith('-'));
if (!target) { console.error('Usage: npm run mutate -- src/inspection/classifyDefect.js [--list] [--json]'); process.exit(2); }
const abs = path.resolve(root, target);
if (!existsSync(abs)) { console.error(`${target} does not exist.`); process.exit(2); }
const rel = path.relative(root, abs).split(path.sep).join('/');
const source = readFileSync(abs, 'utf8');
const mutants = generateMutants(source).filter(m => applyMutant(source, m) !== source);

if (list) {
  for (const [i, m] of mutants.entries()) console.log(`M${String(i + 1).padStart(2, '0')}  line ${String(m.line).padStart(3)}  ${m.from} -> ${m.to}`);
  console.log(`\n${mutants.length} mutants in ${rel}`);
  process.exit(0);
}

const files = testFilesIn(root, ['existing', 'learner']);
if (!files.length) { console.error('No test files found.'); process.exit(1); }
const scratch = mkdtempSync(path.join(os.tmpdir(), 'mutate-'));
try {
  cpSync(path.join(root, 'src'), path.join(scratch, 'src'), { recursive: true });
  cpSync(path.join(root, 'tests'), path.join(scratch, 'tests'), { recursive: true });
  writeFileSync(path.join(scratch, 'package.json'), '{"type":"module"}');
  const scratchFiles = files.map(f => path.join(scratch, path.relative(root, f)));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const run = () => spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...scratchFiles], { cwd: scratch, encoding: 'utf8', env, timeout: 20000 });

  const base = run();
  if (base.status !== 0) {
    console.error('Your tests do not all pass on the real file, so mutation testing cannot tell you anything yet.');
    console.error('Run npm test, fix what fails, and try again.');
    process.exit(1);
  }
  const results = [];
  for (const [i, m] of mutants.entries()) {
    writeFileSync(path.join(scratch, rel), applyMutant(source, m));
    const r = run();
    const killed = r.status !== 0;
    const by = killed ? (/^\s*✖ (.+?) \(\d/m.exec(r.stdout ?? '')?.[1] ?? 'a test that failed to run') : '';
    results.push({ id: `M${String(i + 1).padStart(2, '0')}`, line: m.line, from: m.from, to: m.to, killed, by });
  }
  const killed = results.filter(r => r.killed).length;
  if (json) {
    console.log(JSON.stringify({ file: rel, total: results.length, killed, survived: results.length - killed, score: results.length ? Math.round((1000 * killed) / results.length) / 10 : 100, mutants: results }, null, 2));
  } else {
    console.log(`Mutation testing ${rel} with ${files.length} test file(s)\n`);
    for (const r of results) {
      console.log(`${r.killed ? 'KILLED  ' : 'SURVIVED'}  ${r.id}  line ${String(r.line).padStart(3)}  ${r.from} -> ${r.to}${r.killed ? `   (caught by: ${r.by.slice(0, 70)})` : ''}`);
    }
    console.log(`\n${results.length} mutants: ${killed} killed, ${results.length - killed} survived. Score ${results.length ? ((100 * killed) / results.length).toFixed(1) : '100.0'}%`);
    if (killed < results.length) console.log('A SURVIVED mutant is a small bug your tests did not notice. For each one: is it a bug no test checks, or a change that cannot matter?');
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
