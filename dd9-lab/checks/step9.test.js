// Milestone 9 (homework): sampleSize, done the same way. The code is compared with the answer key; the tests are run against slightly wrong versions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SAMPLING, commitsTouching, dirtyWork, describeSample, editedFixtures, exists, isRepoReady, oracle, rel, runFiles, sampleBehaviour, shippedSource, testNames, withTree } from '../../../checks/lib/helpers.mjs';

const TESTS = 'tests/learner/sampling.test.js';
let cache;
async function runs() {
  cache ??= await withTree('WORKING', dir => {
    const files = exists(TESTS) ? [TESTS] : [];
    for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
    const original = readFileSync(path.join(dir, SAMPLING), 'utf8');
    const mine = runFiles(dir, files);
    writeFileSync(path.join(dir, SAMPLING), shippedSource('sampling.js'));
    const shipped = runFiles(dir, files);
    const missed = [];
    for (const [flag, why] of oracle.SAMPLE_MUTANTS) {
      writeFileSync(path.join(dir, SAMPLING), oracle.sampleSource({ [flag]: true }));
      if (runFiles(dir, files).status === 0) missed.push(why);
    }
    writeFileSync(path.join(dir, SAMPLING), original);
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const m = spawnSync(process.execPath, ['scripts/mutate.mjs', SAMPLING, '--json'], { cwd: dir, encoding: 'utf8', env, timeout: 240000, killSignal: 'SIGKILL' });
    let mutation = null;
    try { mutation = JSON.parse(m.stdout); } catch { mutation = null; }
    return { mine, shipped, missed, mutation, names: testNames(dir).filter(t => t.file === TESTS), mutateOut: `${m.stdout ?? ''}${m.stderr ?? ''}`.trim().split('\n').slice(-2).join(' ') };
  });
  return cache;
}

test('sampleSize follows section 6 of the specification', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const r = await withTree('WORKING', dir => sampleBehaviour(dir));
  assert.equal(r.different, 0, `in ${r.different} of ${r.total} situations sampleSize does not do what docs/tolerance-spec.md says:\n${describeSample(r)}`);
});

test('there are at least six tests, and two of them are regression tests named after a bug', async () => {
  assert.ok(exists(TESTS), `${TESTS} is missing. Put your sampleSize tests there.`);
  const { names } = await runs();
  assert.ok(names.length >= 6, `found ${names.length} tests in ${TESTS}. You need at least six`);
  assert.ok(names.filter(n => /regression/i.test(n.name)).length >= 2, 'name at least two tests "regression: ..." after the bug they guard');
});

test('the tests pass on your code, and the regression tests fail on the code as shipped', async () => {
  const { mine, shipped, names } = await runs();
  assert.equal(mine.status, 0, `your sampleSize tests do not pass: ${mine.failed.slice(0, 2).join(' | ')}`);
  const failing = shipped.failed.filter(f => names.some(n => n.name === f && /regression/i.test(n.name)));
  assert.ok(failing.length >= 2, `only ${failing.length} of your tests named "regression: ..." fail on the code as shipped. A regression test that was never red proves nothing: write it first, and watch it fail on sampling.js as delivered`);
});

test('your tests notice at least 5 of 6 slightly wrong versions of sampleSize', async () => {
  const { missed } = await runs();
  assert.ok(missed.length <= 1, `your tests did NOT notice these mistakes: ${missed.join('; ')}. Write a test that would fail for each`);
});

test('the mutation check kills at least 85% of the mutants of sampling.js', async () => {
  const { mutation, mutateOut } = await runs();
  assert.ok(mutation, `npm run mutate could not run on sampling.js: ${mutateOut}`);
  assert.ok(mutation.score >= 85, `your tests kill ${mutation.killed} of ${mutation.total} mutants of sampling.js. Which band edges and table values does no test check?`);
});

test('everything is committed, and the earlier work is untouched', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
  assert.ok(commitsTouching(SAMPLING).length >= 1, 'no commit has changed sampling.js yet');
});
