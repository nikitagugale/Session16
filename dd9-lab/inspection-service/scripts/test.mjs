// `npm test`: runs every test in tests/baseline (the lab's own), tests/existing (the team's) and tests/learner (yours).
//   npm test                          everything
//   npm test -- inspection          only test files whose path contains "inspection"
//   npm test -- --grep "shaft"     only tests whose name matches
// Why a wrapper: from Node 22, `node --test <folder>` fails with MODULE_NOT_FOUND, so the files are listed explicitly.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collect(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? collect(p) : /\.test\.[cm]?js$/.test(name) ? [p] : [];
  });
}

const args = process.argv.slice(2);
const flags = [];
const explicit = [];
const patterns = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--grep' || args[i] === '-g') flags.push(`--test-name-pattern=${args[++i]}`);
  else if (args[i].startsWith('--grep=')) flags.push(`--test-name-pattern=${args[i].slice(7)}`);
  else if (args[i].startsWith('-')) flags.push(args[i]);
  else if (existsSync(path.resolve(args[i])) && statSync(path.resolve(args[i])).isFile()) explicit.push(path.resolve(args[i]));
  else patterns.push(args[i].toLowerCase());
}

const all = ['baseline', 'existing', 'learner'].flatMap(d => collect(path.join(root, 'tests', d)));
let targets = explicit.length ? explicit : all;
if (patterns.length) {
  const rel = f => path.relative(root, f).split(path.sep).join('/').toLowerCase();
  targets = all.filter(f => patterns.some(p => rel(f).includes(p)));
  if (!targets.length) {
    console.error(`No test file path contains ${patterns.map(p => `"${p}"`).join(' or ')}. Running tests whose name matches instead.`);
    flags.push(`--test-name-pattern=${patterns.join('|')}`);
    targets = all;
  }
}
if (!targets.length) {
  console.error('No test files found.');
  process.exit(1);
}
// Node 20 prints TAP when its output is not a terminal, and Node 22+ prints "spec". Pin one format everywhere.
if (!flags.some(f => f.startsWith('--test-reporter'))) flags.push('--test-reporter=spec');
// A test run started from inside another test run (a check, for example) inherits NODE_TEST_CONTEXT and prints no summary.
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const r = spawnSync(process.execPath, ['--test', ...flags, ...targets], { cwd: root, stdio: 'inherit', env });
process.exit(r.status ?? 1);
