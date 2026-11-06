// Measures test coverage with Node's own built-in coverage (node --test --experimental-test-coverage) and reads its table.
// A stand-in for Istanbul or c8: same idea (which lines and which branches did the tests run), no packages.
//
//   const report = measureCoverage(root, files)  ->  { 'src/inspection/classifyDefect.js': { line, branch, funcs, uncovered: '16-17 23-26' }, ... }
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export function testFilesIn(root, folders) {
  const out = [];
  const walk = dir => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.test\.[cm]?js$/.test(name)) out.push(p);
    }
  };
  for (const f of folders) walk(path.join(root, 'tests', f));
  return out;
}

export function sourceFiles(root) {
  const dir = path.join(root, 'src', 'inspection');
  return existsSync(dir) ? readdirSync(dir).filter(n => n.endsWith('.js')).sort() : [];
}

/** Runs the given test files with coverage on, and returns the numbers for every file under src/inspection/. */
export function measureCoverage(root, files) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '--experimental-test-coverage', ...files], { cwd: root, encoding: 'utf8', env, timeout: 120000 });
  const text = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  const known = new Set(sourceFiles(root));
  const report = {};
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^ℹ\s?/, '');
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 4) continue;
    const name = cells[0].split(/[\\/]/).pop();
    if (!known.has(name) || cells[1] === '') continue;
    report[`src/inspection/${name}`] = { line: Number(cells[1]), branch: Number(cells[2]), funcs: Number(cells[3]), uncovered: cells[4] ?? '' };
  }
  return { report, testsPassed: r.status === 0, output: text };
}

/** '16-17 23-26' -> [16, 17, 23, 24, 25, 26] */
export function expandLines(spec) {
  const lines = [];
  for (const part of String(spec).split(/\s+/).filter(Boolean)) {
    const [a, b] = part.split('-').map(Number);
    for (let i = a; i <= (b ?? a); i++) lines.push(i);
  }
  return lines;
}
