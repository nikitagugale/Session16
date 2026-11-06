// Shared helpers for the lab's checks. They read YOUR work and never change it: anything that writes runs in a scratch folder.
// This file is outside the folder you open on purpose: it holds the answers to some of the milestones.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as oracle from '../oracle/reference.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const KIT = path.resolve(here, '..', '..');
export const APP = path.join(KIT, 'inspection-service');
export const CODE = 'src/inspection/classifyDefect.js';
export const SAMPLING = 'src/inspection/sampling.js';
export const PARSER = 'src/inspection/parser.js';
export const rel = p => path.join(APP, p);
export const sha256 = buf => createHash('sha256').update(buf).digest('hex');
export const readJson = file => JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
export const pristine = readJson(path.join(KIT, 'checks', 'pristine.json'));
export { oracle };
export const shippedSource = name => readFileSync(path.join(KIT, 'checks', 'oracle', 'shipped', name), 'utf8');

// ---------------------------------------------------------------------------------------------------------------------
// files

export const exists = file => existsSync(rel(file));
export const read = file => readFileSync(rel(file), 'utf8');
export function walk(dir, root = APP) {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap(e => {
    const r = path.join(dir, e.name);
    return e.isDirectory() ? (e.name === 'node_modules' || e.name === '.git' || e.name === 'steps' ? [] : walk(r, root)) : [r.split(path.sep).join('/')];
  });
}
export const load = (rootDir, relPath) => import(`${pathToFileURL(path.join(rootDir, relPath)).href}?t=${Date.now()}${Math.random()}`);

// ---------------------------------------------------------------------------------------------------------------------
// git

export function git(args, cwd = APP) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}
export function baselineCommit() {
  const f = rel('.lab/baseline-commit');
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : null;
}
export const isRepoReady = () => existsSync(rel('.git')) && !!baselineCommit();
export function commitsTouching(pathspec) {
  const r = git(['rev-list', '--reverse', `${baselineCommit()}..HEAD`, '--', pathspec]);
  return r.status === 0 && r.stdout ? r.stdout.split('\n') : [];
}
/** Uncommitted changes to the documents, code or tests (the clock in .lab/ does not count). */
export function dirtyWork() {
  return git(['status', '--porcelain', '--', 'docs', 'src', 'tests', 'scripts', 'package.json', ':(exclude)tests/steps']).stdout.split('\n').filter(Boolean);
}
/** The files of the lab itself (scripts, the team's tests, the specification, the part table) that differ from what the kit shipped. */
export function editedFixtures() {
  return Object.entries(pristine)
    .filter(([f]) => /^(scripts|tests\/(existing|baseline|lib))\//.test(f) || f === 'docs/tolerance-spec.md' || f === 'src/inspection/parts.js' || f === 'src/inspection/errors.js')
    .filter(([f, h]) => !existsSync(rel(f)) || sha256(readFileSync(rel(f))) !== h).map(([f]) => f);
}

/** A copy of the working tree (including uncommitted changes), or a checkout of a commit, in a scratch folder. */
export async function withTree(commit, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'dd9-tree-'));
  try {
    if (commit === 'WORKING') {
      cpSync(APP, dir, { recursive: true, filter: p => !/[\\/](node_modules|\.git|\.lab|\.checkpoint-backup)([\\/]|$)/.test(p) && !p.endsWith(`${path.sep}tests${path.sep}steps`) });
    } else {
      git(['worktree', 'prune']);
      const r = git(['worktree', 'add', '--detach', '--force', dir, commit]);
      if (r.status !== 0) throw new Error(`could not check out ${commit}: ${r.out}`);
    }
    return await fn(dir);
  } finally {
    if (commit !== 'WORKING') git(['worktree', 'remove', '--force', dir]);
    rmSync(dir, { recursive: true, force: true });
    git(['worktree', 'prune']);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// running tests

export function testFiles(dir, folders = ['existing', 'learner']) {
  return folders.flatMap(f => walk(`tests/${f}`, dir)).filter(x => /\.test\.[cm]?js$/.test(x));
}
/** Runs some test files (relative paths) inside a tree. */
export function runFiles(dir, files) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  if (!files.length) return { status: 0, out: '', pass: 0, fail: 0, failed: [], passed: [] };
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: dir, encoding: 'utf8', env, timeout: 120000, killSignal: 'SIGKILL' });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const names = re => out.split('\n').filter(l => re.test(l)).map(l => l.replace(/^\s*[✔✖]\s*/, '').replace(/\s*\([\d.]+ms\)\s*$/, '').trim()).filter(n => !/\.test\.[cm]?js$/.test(n) && !/[\\/]tests[\\/]/.test(n));
  return { status: r.status, out, pass: Number(/^ℹ pass (\d+)/m.exec(out)?.[1] ?? 0), fail: Number(/^ℹ fail (\d+)/m.exec(out)?.[1] ?? 0), failed: [...new Set(names(/^\s*✖/))].filter(n => n !== 'failing tests:'), passed: [...new Set(names(/^\s*✔/))] };
}
export const runLearner = dir => runFiles(dir, testFiles(dir, ['learner']));
export const runSuite = dir => runFiles(dir, testFiles(dir));

/** Names of the tests in a folder, found by reading the files. */
export function testNames(dir, folder = 'tests/learner') {
  const out = [];
  for (const f of walk(folder, dir).filter(x => /\.test\.[cm]?js$/.test(x))) {
    const text = readFileSync(path.join(dir, f), 'utf8');
    for (const m of text.matchAll(/\b(test|it)(\.todo|\.skip)?\s*\(\s*(['"`])((?:\\.|(?!\3).)*)\3/g)) out.push({ file: f, name: m[4], todo: !!m[2] });
  }
  return out;
}

/** In a scratch copy of YOUR work, put `text` into `file` (and the pristine part table and errors), then run the tests of the given folders. */
export function testsWith(dir, file, text, folders = ['existing', 'learner']) {
  writeFileSync(path.join(dir, file), text);
  for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
  return runFiles(dir, testFiles(dir, folders));
}

/** Which of the slightly wrong versions of `file` do YOUR tests fail on? Returns the ones that were NOT noticed. */
export async function survivors(file, variants, sourceOf, folders = ['existing', 'learner']) {
  return withTree('WORKING', dir => variants.filter(([flag]) => {
    const r = testsWith(dir, file, sourceOf({ [flag]: true }), folders);
    return r.status === 0;
  }).map(([, why]) => why));
}

// ---------------------------------------------------------------------------------------------------------------------
// the behaviour of YOUR functions, compared with the answer key

export async function classifyBehaviour(dir) {
  const mod = await load(dir, CODE);
  return oracle.compareClassify(mod.classifyDefect);
}
export async function sampleBehaviour(dir) {
  const mod = await load(dir, SAMPLING);
  return oracle.compareSample(mod.sampleSize);
}
export const describeClassify = r => r.first.slice(0, 2).map(f => `  classifyDefect(${oracle.showInput(f.input)})\n    should give ${f.want}, your code gives ${f.got}`).join('\n');
export const describeSample = r => r.first.slice(0, 2).map(f => `  sampleSize(${String(f.input[0])})\n    should give ${f.want}, your code gives ${f.got}`).join('\n');

// ---------------------------------------------------------------------------------------------------------------------
// coverage, measured the way the learner's tool measures it

export async function coverageIn(dir, folders) {
  const { measureCoverage } = await load(dir, 'scripts/lib/coverage.mjs');
  const { testFilesIn } = await load(dir, 'scripts/lib/coverage.mjs');
  return measureCoverage(dir, testFilesIn(dir, folders)).report;
}

// ---------------------------------------------------------------------------------------------------------------------
// markdown

export const words = text => String(text).split(/\s+/).filter(w => /[A-Za-z]/.test(w)).length;
export const cellsOf = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.replace(/[*_`]/g, '').trim());
export const columnIndex = (header, pattern) => header.findIndex(h => pattern.test(h));
export function table(markdown, isHeader) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes('|') || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) continue;
    const header = cellsOf(lines[i]);
    if (!isHeader(header)) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length && lines[j].includes('|'); j++) rows.push(cellsOf(lines[j]));
    return { header, rows };
  }
  return null;
}
export function section(markdown, pattern) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const start = lines.findIndex(l => /^#{1,6}\s/.test(l) && pattern.test(l));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) { const m = /^(#{1,6})\s/.exec(lines[i]); if (m && m[1].length <= level) { end = i; break; } }
  return lines.slice(start + 1, end).join('\n').trim();
}
/** '16-17 23-26' or '12-13, 18-25' -> [16, 17, 23, ...] */
export function lineNumbers(cell) {
  const out = [];
  for (const m of String(cell).matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?/g)) for (let i = Number(m[1]); i <= Number(m[2] ?? m[1]); i++) out.push(i);
  return out;
}
