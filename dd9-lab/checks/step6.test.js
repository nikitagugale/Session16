// Milestone 6: the cause fixed for every part, and regression tests that were red before the fix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CODE, classifyBehaviour, survivors, commitsTouching, describeClassify, dirtyWork, editedFixtures, exists, isRepoReady, oracle, rel, runFiles, shippedSource, testFiles, testNames, withTree } from '../../../checks/lib/helpers.mjs';

const REGRESSION = 'tests/learner/regression.test.js';
let cache;
/** Your regression tests, run on three versions of classifyDefect: as shipped, with only the obvious comparison fixed, and yours. */
async function runs() {
  cache ??= await withTree('WORKING', dir => {
    const mine = runFiles(dir, [REGRESSION].filter(f => exists(f)));
    for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
    const original = readFileSync(path.join(dir, CODE), 'utf8');
    writeFileSync(path.join(dir, CODE), shippedSource('classifyDefect.js'));
    const shipped = runFiles(dir, [REGRESSION].filter(f => exists(f)));
    writeFileSync(path.join(dir, CODE), oracle.classifySource({ halfFix: true }));
    const half = runFiles(dir, [REGRESSION].filter(f => exists(f)));
    writeFileSync(path.join(dir, CODE), original);
    const all = runFiles(dir, testFiles(dir, ['baseline', 'existing', 'learner']));
    return { mine, shipped, half, all, names: testNames(dir).filter(t => t.file === REGRESSION) };
  });
  return cache;
}

test('classifyDefect follows the specification for every part and every kind of reading', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const r = await withTree('WORKING', dir => classifyBehaviour(dir));
  assert.equal(r.different, 0, `in ${r.different} of ${r.total} situations the code does not do what docs/tolerance-spec.md says:\n${describeClassify(r)}\n  Fix the cause, for every part. Do not special-case a value`);
});

test('there are at least three regression tests, named after the bugs they guard', async () => {
  assert.ok(exists(REGRESSION), `${REGRESSION} is missing. Put your regression tests there.`);
  const { names } = await runs();
  assert.ok(names.length >= 3, `found ${names.length} tests in ${REGRESSION}. You need at least three, one for each bug you fixed`);
  assert.deepEqual(names.filter(n => n.todo).map(n => n.name), [], 'these regression tests are skipped');
});

test('the regression tests fail on the code as shipped, and pass on yours', async () => {
  const { mine, shipped } = await runs();
  assert.equal(mine.status, 0, `your regression tests do not pass on your code: ${mine.failed.slice(0, 2).join(' | ')}`);
  assert.ok(shipped.failed.length >= 3, `only ${shipped.failed.length} of your regression tests fail on the code as shipped. A regression test that was never red proves nothing: write it first, and watch it fail`);
});

test('at least one regression test would catch a fix that only changed the obvious comparison', async () => {
  const { half } = await runs();
  assert.ok(half.failed.length >= 1, 'every regression test passes on a fix that only changes the comparison operator. Is there a part for which that is not enough? Look at the limits of every part');
});

test('your tests notice at least 11 of 14 slightly wrong versions of classifyDefect', async () => {
  const missed = await survivors(CODE, oracle.CLASSIFY_MUTANTS, oracle.classifySource);
  assert.ok(missed.length <= 3, `your tests did NOT notice these mistakes: ${missed.join('; ')}. A test has to fail when the code is wrong. Write one that would fail for each`);
});

test('npm test is green, and everything is committed', async () => {
  const { all } = await runs();
  assert.equal(all.status, 0, `npm test fails: ${all.failed.slice(0, 2).join(' | ')}`);
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
  assert.ok(commitsTouching('src/inspection/classifyDefect.js').length >= 1, 'no commit has changed classifyDefect.js yet');
});
