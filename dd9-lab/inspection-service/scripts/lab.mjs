// Lab helper. Plain Node, no shell syntax: runs the same on Linux, macOS and Windows.
//
//   npm run setup                   make the starting commit ("Shipped code as delivered"), so that git shows only what you change
//   npm run doctor                  check Node, git and the kit layout
//   npm run start -- N              start the clock for milestone N and see when its hints open
//   npm run step -- N               check your work for milestone N (1 to 9)
//   npm run checkpoint -- N         replace your work with the reference solution for milestone N (1 to 9)
//
// `step` copies the hidden check in, runs it, and removes it again, so `npm test` never changes under you.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MILESTONES, titleOf } from './milestones.mjs';
import { app, markStarted } from './lab-state.mjs';

const kit = path.resolve(app, '..');
const checksDir = path.join(kit, 'checks');
const checkpointsDir = path.join(kit, 'checkpoints');
const [, , command, arg, ...rest] = process.argv;
const quiet = rest.includes('--quiet');

const STEPS = {
  ...Object.fromEntries(MILESTONES.map(m => [m.n, m.check])),
  demo: 'presenter: property-based tests find a silent bug in the parser, and the parser is fixed',
};

const say = (...a) => console.log(...a);
const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

// Node prints a stack trace and an object dump for every failed assertion. Learners need the sentence, not the trace.
// It also names the check file and, for equality assertions, prints "actual !== expected". The check file is the answer key,
// so its path is never shown. For the milestones that compare your documents with a list, the expected values are not shown either.
function tidy(text, { hideValues = false } = {}) {
  const out = [];
  let skipping = false;
  for (const line of text.split('\n')) {
    if (skipping) { if (/^\s*\}\s*$/.test(line)) skipping = false; continue; }
    if (/^\s+generatedMessage:/.test(line)) { skipping = true; continue; }
    if (/^test at .*\.test\.js:\d+:\d+\s*$/.test(line)) continue;
    if (hideValues && /^\s+\S.* !== .+$/.test(line)) continue;
    if (/^\s+at .+:\d+:\d+\)?\s*$/.test(line) || /^\s+at .*\(node:/.test(line) || /^\s+at async /.test(line)) continue;
    out.push(line.replace(/^(\s*AssertionError.*) \{\s*$/, '$1'));
  }
  return out.join('\n');
}

function nodeTest(files, options) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: app, encoding: 'utf8', env });
  process.stdout.write(tidy(r.stdout ?? '', options));
  process.stderr.write(tidy(r.stderr ?? '', options));
  return r.status ?? 1;
}

// ---------------------------------------------------------------------------------------------------------------------
// git

const git = (...a) => spawnSync('git', ['-C', app, ...a], { encoding: 'utf8' });
const gitAs = (...a) => git('-c', 'user.name=lab', '-c', 'user.email=lab@local', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...a);
const hasGit = () => spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
const baselineFile = path.join(app, '.lab', 'baseline-commit');
const sha256 = buf => createHash('sha256').update(buf).digest('hex');

function setup() {
  if (!hasGit()) fail('git was not found. This lab needs git (the checks look at your commits). Install it, then run this again.');
  if (existsSync(path.join(app, '.git'))) {
    if (existsSync(baselineFile)) {
      say(`Already set up. The starting commit is ${readFileSync(baselineFile, 'utf8').trim().slice(0, 10)}.`);
      say('git log --oneline shows it. Nothing was changed.');
      return;
    }
    fail('This folder is already a git repository, but not one made by this lab. Move the repository away, or re-extract the kit zip, then run this again.');
  }
  // The starting commit must hold the shipped code and the documents exactly as delivered, or every later comparison is meaningless.
  const pristine = JSON.parse(readFileSync(path.join(app, 'scripts', 'lib', 'pristine.json'), 'utf8'));
  const changed = Object.entries(pristine).filter(([rel, hash]) => !existsSync(path.join(app, rel)) || sha256(readFileSync(path.join(app, rel))) !== hash).map(([rel]) => rel);
  if (changed.length) fail(`These files are not the code and documents as delivered:\n  ${changed.join('\n  ')}\nThe starting commit must hold the originals. Re-extract the kit zip into a fresh folder, then run npm run setup.`);

  git('-c', 'init.defaultBranch=main', 'init', '-q');
  // Your own commits need a name and an email. If git has none on this machine, give THIS repository one, so that "git commit" works.
  if (!git('config', '--get', 'user.email').stdout.trim()) {
    git('config', 'user.email', 'learner@lab.local');
    git('config', 'user.name', 'Lab learner');
    say('git had no name or email on this machine, so this repository now uses "Lab learner <learner@lab.local>" for your commits.');
  }
  git('add', '-A');
  const c = gitAs('commit', '-q', '-m', 'Shipped code as delivered');
  if (c.status !== 0) fail(`The starting commit failed:\n${c.stderr}`);
  const hash = git('rev-parse', 'HEAD').stdout.trim();
  mkdirSync(path.dirname(baselineFile), { recursive: true });
  writeFileSync(baselineFile, `${hash}\n`);
  say(`Done. The starting commit is ${hash.slice(0, 10)}: "Shipped code as delivered".`);
  say('Everything you change from now on shows up in git status and git diff. Commit after each document or change that is ready.');
}

// ---------------------------------------------------------------------------------------------------------------------

function doctor() {
  let bad = 0;
  const ok = m => say(`  ok    ${m}`);
  const no = (m, fix) => { bad += 1; say(`  FAIL  ${m}\n        -> ${fix}`); };

  const [maj] = process.versions.node.split('.').map(Number);
  maj >= 20 ? ok(`Node ${process.versions.node}`) : no(`Node ${process.versions.node} is too old`, 'install Node 20 or newer');
  existsSync(path.join(app, 'src', 'inspection', 'classifyDefect.js')) ? ok('the shipped code, src/inspection/classifyDefect.js, is there') : no('src/inspection/classifyDefect.js is missing', 're-extract the kit zip');
  existsSync(path.join(app, 'docs', 'tolerance-spec.md')) ? ok('the specification, docs/tolerance-spec.md, is there') : no('docs/tolerance-spec.md is missing', 're-extract the kit zip');
  existsSync(checksDir) && existsSync(checkpointsDir) && existsSync(path.join(kit, 'hints')) ? ok('checks/, checkpoints/ and hints/ found next to this folder') : no('checks/, checkpoints/ or hints/ not found next to inspection-service/', 're-extract the kit zip and keep the folders together');
  const g = spawnSync('git', ['--version'], { encoding: 'utf8' });
  g.status === 0 ? ok(g.stdout.trim()) : no('git was not found', 'install git: the checks look at your commits');
  if (g.status === 0) {
    existsSync(baselineFile) ? ok(`the starting commit exists (${readFileSync(baselineFile, 'utf8').trim().slice(0, 10)})`) : say('  todo  no starting commit yet: run `npm run setup`');
    if (existsSync(path.join(app, '.git')) && !git('config', '--get', 'user.email').stdout.trim()) {
      no('git has no name or email, so git commit will fail', 'run: git config user.email "you@example.com" and git config user.name "Your Name" (in this folder)');
    }
  }
  say(bad ? `\n${bad} problem(s) above. Fix them, then run \`npm run doctor\` again.` : existsSync(baselineFile) ? '\nReady. Open LAB-GUIDE.md and start milestone 1.' : '\nReady. Next: npm run setup, then npm test, then open LAB-GUIDE.md');
  process.exit(bad ? 1 : 0);
}

function start(n) {
  const m = MILESTONES.find(x => String(x.n) === String(n));
  if (!m) fail(`Unknown milestone "${n}". Use a number from 1 to 9.`);
  const at = markStarted(m.n);
  const minutes = (Date.now() - new Date(at).getTime()) / 60000;
  say(`Milestone ${m.n} · ${m.title}`);
  say(minutes < 0.2 ? 'The clock for this milestone just started.' : `The clock for this milestone started ${Math.round(minutes)} minute${Math.round(minutes) === 1 ? '' : 's'} ago.`);
  say(`Aim to finish in about ${m.targetMinutes} minutes. Hints open after ${m.hintMinutes.join(', ')} minutes (a nudge, not a lock: npm run hint -- ${m.n}).`);
  say('Open LAB-GUIDE.md at the card for this milestone, and read it before you type anything.');
}

function step(n) {
  if (!STEPS[n]) fail(`Unknown milestone "${n}". Use a number from 1 to 9.`);
  const numbered = /^\d+$/.test(n);
  if (numbered) markStarted(n);
  say(`\n${numbered ? `MILESTONE ${n}` : `STEP ${n}`}: ${numbered ? titleOf(n) : STEPS[n]}\n`);

  const file = n === 'demo' ? 'demo.test.js' : `step${n}.test.js`;
  const src = path.join(checksDir, file);
  if (!existsSync(src)) fail(`Missing ${src}. Is checks/ next to inspection-service/?`);
  const destDir = path.join(app, 'tests', 'steps');
  const dest = path.join(destDir, file);
  mkdirSync(destDir, { recursive: true });
  cpSync(src, dest);
  let status;
  try { status = nodeTest([dest], { hideValues: ['1', '2', '3'].includes(n) }); }
  finally { rmSync(dest, { force: true }); try { rmdirSync(destDir); } catch { /* not empty */ } }

  if (status === 0) {
    say(`\nSTEP ${n} PASSED`);
    if (numbered && !quiet) {
      const last = n === '4' ? '\nThat is the end of the first block. Write your log, then use any spare time on the stretch goals while the others finish.'
        : n === '8' ? '\nThat is the end of the second block. Write your log, then use any spare time on the stretch goals while the others finish.'
        : n === '9' ? '\nThat is the homework done.' : '';
      say(`Milestone ${n} is done. Write two lines in LAB-LOG.md, commit, then go on to the next milestone.${last}`);
    }
  } else {
    say(`\nSTEP ${n} not passing yet. Read the first failure above: it says which success criterion is not met.`);
    if (numbered && !quiet) say(`Stuck? npm run hint -- ${n} gives you the next hint when it opens. To catch up, npm run checkpoint -- ${n} gives you the reference.`);
  }
  process.exit(status);
}

// ---------------------------------------------------------------------------------------------------------------------
// A checkpoint is the reference solution as it stands after milestone N. It is REPLAYED as git commits on top of the starting
// commit, one commit for each step of the reference, so that the history is real after a sync too.
// Your own work is kept: your commits (and anything uncommitted) go onto a branch called my-work-<time>.

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listFiles(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]);
}

function checkpoint(name) {
  const manifest = JSON.parse(readFileSync(path.join(checkpointsDir, 'manifest.json'), 'utf8'));
  const steps = manifest.steps[name];
  if (!steps) fail(`No checkpoint "${name}". Use a number from 1 to 9 (demo and demo-done are for the presenter).`);
  if (!hasGit() || !existsSync(baselineFile) || !existsSync(path.join(app, '.git'))) {
    fail('There is no starting commit yet. Run  npm run setup  first (it takes a second), then run this again.');
  }
  const baseline = readFileSync(baselineFile, 'utf8').trim();

  // 1. keep what the learner has
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const branch = `my-work-${stamp}`;
  git('add', '-A');
  const pending = git('diff', '--cached', '--quiet').status !== 0;
  if (pending) gitAs('commit', '-q', '-m', `My work before checkpoint ${name}`);
  const head = git('rev-parse', 'HEAD').stdout.trim();
  const keeps = head !== baseline;
  if (keeps) git('branch', branch, head);

  // 2. go back to the starting commit, then replay the reference
  const reset = git('reset', '--hard', '-q', baseline);
  if (reset.status !== 0) fail(`Could not go back to the starting commit:\n${reset.stderr}`);
  git('clean', '-fdq', '--', 'spec', 'docs', 'tests/spec', 'tools', 'src');
  const now = new Date().toISOString();
  for (const id of steps) {
    const dir = path.join(checkpointsDir, 'commits', id);
    for (const rel of listFiles(dir)) {
      const to = path.join(app, rel);
      mkdirSync(path.dirname(to), { recursive: true });
      const text = readFileSync(path.join(dir, rel), 'utf8').split('{{BASELINE_COMMIT}}').join(baseline).split('{{NOW}}').join(now);
      writeFileSync(to, text);
    }
    git('add', '-A');
    const c = gitAs('commit', '-q', '-m', manifest.commits[id]);
    if (c.status !== 0) fail(`A reference commit failed (${id}):\n${c.stdout}${c.stderr}`);
  }

  say(`Your code now matches the reference solution for milestone ${name}, in ${steps.length} commit${steps.length === 1 ? '' : 's'} on top of the starting commit.`);
  if (keeps) say(`Your own work was kept on the branch ${branch}  (git log ${branch} --oneline shows it).`);
  say('Run `npm test` to confirm, then carry on with the next milestone.');
}

switch (command) {
  case 'setup': setup(); break;
  case 'doctor': doctor(); break;
  case 'start': start(String(arg)); break;
  case 'step': step(String(arg)); break;
  case 'checkpoint': checkpoint(String(arg)); break;
  default: fail('Usage: node scripts/lab.mjs <setup | doctor | start N | step N | checkpoint N>');
}
