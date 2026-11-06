// Milestone 3: tests generated from the specification, and the triage of the ones that fail.
// Your tests are run against three versions of classifyDefect: the code as shipped, and the correct code from the answer key.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CODE, columnIndex, commitsTouching, editedFixtures, exists, isRepoReady, oracle, read, rel, runFiles, shippedSource, table, testFiles, testNames, withTree } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/triage.md';
let cache;

/** Runs the learner's classifyDefect tests on the shipped code and on the correct code. */
async function runs() {
  cache ??= await withTree('WORKING', dir => {
    const files = testFiles(dir, ['learner']).filter(f => !/regression/i.test(f)).filter(f => { const t = readFileSync(path.join(dir, f), 'utf8'); return /classifyDefect/.test(t) && !/sampleSize|parseSensorReading/.test(t); });
    for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
    writeFileSync(path.join(dir, CODE), shippedSource('classifyDefect.js'));
    const shipped = runFiles(dir, files);
    writeFileSync(path.join(dir, CODE), oracle.classifySource({}));
    const correct = runFiles(dir, files);
    return { files, shipped, correct, names: testNames(dir).filter(t => files.includes(t.file)) };
  });
  return cache;
}
/** Names of the tests that existed when the triage was last committed. Tests you add later (milestone 8, say) need no row in it. */
let thenCache;
async function namesWhenTriaged() {
  thenCache ??= (async () => {
    const commits = commitsTouching(FILE);
    if (!commits.length) return null;
    return withTree(commits[commits.length - 1], dir => testNames(dir).map(t => norm(t.name)));
  })();
  return thenCache;
}
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

test('there are at least 12 tests in tests/learner, and none is skipped', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { names } = await runs();
  assert.ok(names.length >= 12, `found ${names.length} tests for classifyDefect in tests/learner. You need at least 12: one for each case that matters`);
  assert.deepEqual(names.filter(n => n.todo).map(n => n.name), [], 'these tests are skipped or marked todo. A test that does not run checks nothing');
});

test('every test agrees with the specification (none of them asserts what the buggy code does)', async () => {
  const { correct } = await runs();
  assert.deepEqual(correct.failed, [], 'these tests disagree with docs/tolerance-spec.md. A test the AI wrote from the code can assert the bug. Read the section that decides each one, then fix the test');
});

test('at least three of your tests fail on the code as shipped: those are the bugs you found', async () => {
  const { shipped } = await runs();
  assert.ok(shipped.failed.length >= 3, `only ${shipped.failed.length} of your tests fail on the shipped code. Real bugs are in there: which cases did you not try?`);
});

test('every failing test has a row in docs/triage.md, with the right verdict', async () => {
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`);
  const t = table(read(FILE), h => columnIndex(h, /test/i) >= 0 && columnIndex(h, /verdict|decision/i) >= 0 && columnIndex(h, /evidence|why|spec/i) >= 0);
  assert.ok(t, 'there is no table with the columns Test, Verdict and Evidence');
  const [c, v] = [columnIndex(t.header, /test/i), columnIndex(t.header, /verdict|decision/i)];
  const { shipped } = await runs();
  const then = await namesWhenTriaged();
  const missing = [];
  const wrong = [];
  for (const name of shipped.failed.filter(n => !then || then.includes(norm(n)))) {
    const row = t.rows.find(r => norm(r[c]).includes(norm(name)) || norm(name).includes(norm(r[c])) && norm(r[c]).length > 12);
    if (!row) { missing.push(name); continue; }
    if (!(/code|bug|defect|implementation|source|function/i.test(row[v]) && !/^\W*test\b/i.test(row[v]))) wrong.push(name);
  }
  assert.deepEqual(missing, [], 'these failing tests have no row in the triage');
  assert.deepEqual(wrong, [], 'the verdict for these tests is not what the specification says. Read the section again before you decide that a test is wrong');
});

test('each verdict cites the section of the specification that decides it', async () => {
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`);
  const t = table(read(FILE), h => columnIndex(h, /test/i) >= 0 && columnIndex(h, /verdict|decision/i) >= 0 && columnIndex(h, /evidence|why|spec/i) >= 0);
  assert.ok(t, 'there is no triage table');
  const e = columnIndex(t.header, /evidence|why|spec/i);
  const bare = t.rows.filter(r => !/\b[2-6]\.\d\b|section\s*[2-6]|tolerance-spec/i.test(r[e] ?? '')).map(r => `"${r[0].slice(0, 40)}"`);
  assert.deepEqual(bare, [], 'these rows do not say which section of docs/tolerance-spec.md decides the verdict (for example "spec 4.4")');
});

test('the tests and the triage are committed, and nothing else was changed', async () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching('tests/learner').length >= 1, 'no commit has added tests under tests/learner yet');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/triage.md is not committed yet');
});
