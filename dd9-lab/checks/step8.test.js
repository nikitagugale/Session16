// Milestone 8: a mutation spot check. The learner's tests are run against small bugs put into THEIR fixed code, and the note is compared with a fresh run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CODE, columnIndex, commitsTouching, dirtyWork, editedFixtures, exists, isRepoReady, load, oracle, read, table, withTree } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/mutation.md';
let cache;
async function fresh() {
  cache ??= await withTree('WORKING', async dir => {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(process.execPath, ['scripts/mutate.mjs', CODE, '--json'], { cwd: dir, encoding: 'utf8', env, timeout: 240000, killSignal: 'SIGKILL' });
    let data;
    try { data = JSON.parse(r.stdout); } catch { data = null; }
    const source = readFileSync(path.join(dir, CODE), 'utf8');
    const lines = source.split('\n');
    // for each survivor: is there ANY situation where the mutant and your code give different answers? (then it is not equivalent)
    const apart = {};
    if (data) {
      const { generateMutants, applyMutant } = await load(dir, 'scripts/lib/mutants.mjs');
      const all = generateMutants(source).filter(m => applyMutant(source, m) !== source);
      const mine = (await load(dir, CODE)).classifyDefect;
      for (const x of data.mutants.filter(y => !y.killed)) {
        const m = all[Number(x.id.slice(1)) - 1];
        if (!m) continue;
        writeFileSync(path.join(dir, `src/inspection/mutant-${x.id}.js`), applyMutant(source, m));
        const fn = (await load(dir, `src/inspection/mutant-${x.id}.js`)).classifyDefect;
        apart[x.id] = oracle.compareClassify(fn, mine).different > 0 || oracle.compareFine(fn, mine).different > 0;
      }
    }
    return { data, error: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-3).join(' '), lines, apart };
  });
  return cache;
}
const doc = () => { assert.ok(exists(FILE), `${FILE} is missing. Create it from the milestone card.`); return read(FILE); };

test('the mutation check can run: your tests all pass on your code', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { data, error } = await fresh();
  assert.ok(data, `npm run mutate could not run on your code: ${error}`);
  assert.ok(data.total >= 8, `only ${data.total} mutants were made. Is classifyDefect.js still the function that decides the verdict?`);
});

test('the score in docs/mutation.md matches a fresh run', async () => {
  const { data } = await fresh();
  const m = /Score\W*:?\s*(\d+)\s*(?:of|\/)\s*(\d+)/i.exec(doc());
  assert.ok(m, 'add a line "Score: K of N killed" with the numbers `npm run mutate -- src/inspection/classifyDefect.js` prints');
  assert.deepEqual([Number(m[1]), Number(m[2])], [data.killed, data.total], 'the score in your note is not what a fresh run gives. Run `npm run mutate -- src/inspection/classifyDefect.js` again, and copy the numbers');
});

test('your tests kill at least 90% of the mutants', async () => {
  const { data } = await fresh();
  assert.ok(data.score >= 90, `your tests kill ${data.killed} of ${data.total} mutants. Each survivor is a small bug no test noticed: write the input that would make it behave differently`);
});

test('no mutant that changes a comparison with a limit survives', async () => {
  const { data, lines } = await fresh();
  const bad = data.mutants.filter(x => !x.killed && ['<', '<=', '>', '>='].includes(x.from) && /upper|lower|limit|toler|nominal|size/i.test(lines[x.line - 1] ?? ''));
  assert.deepEqual(bad.map(x => `${x.id} line ${x.line}: ${x.from} -> ${x.to}`), [], 'these mutants change a comparison with a limit and no test noticed. A boundary is exactly where tests must look');
});

test('every survivor that is left is in the note, with a verdict and a reason', async () => {
  const { data } = await fresh();
  const left = data.mutants.filter(x => !x.killed);
  const text = doc();
  if (!left.length) { assert.ok(/no (mutants? )?surviv|none (of them )?surviv|all (the )?mutants (were )?killed|every mutant (was )?killed/i.test(text), 'every mutant is killed. Say so in the note'); return; }
  const t = table(text, h => columnIndex(h, /mutant/i) >= 0 && columnIndex(h, /verdict/i) >= 0);
  assert.ok(t, 'there is no table with the columns Mutant, Verdict and Why');
  const [mc, vc, wc] = [columnIndex(t.header, /mutant/i), columnIndex(t.header, /verdict/i), columnIndex(t.header, /why|reason/i)];
  const missing = left.filter(x => !t.rows.some(r => new RegExp(`\\b${x.id}\\b`, 'i').test(r[mc]) || (r[mc].includes(`line ${x.line}`) && r[mc].includes(x.from)))).map(x => x.id);
  assert.deepEqual(missing, [], 'these survivors have no row in your table (write the id, like M07)');
  const vague = t.rows.filter(r => !/equivalent|cannot matter|no effect|needs? a test|missing test/i.test(r[vc]) || String(r[wc] ?? '').split(/\s+/).filter(Boolean).length < 6).map(r => r[mc]);
  assert.deepEqual(vague, [], 'each row needs a Verdict (equivalent, or needs a test) and a reason of a few words');
});

test('a survivor you call "equivalent" really is equivalent: no input tells it from your code', async () => {
  const { data, apart } = await fresh();
  const left = data.mutants.filter(x => !x.killed && apart[x.id]);
  if (!left.length) return;
  const t = table(doc(), h => columnIndex(h, /mutant/i) >= 0 && columnIndex(h, /verdict/i) >= 0);
  if (!t) return; // the test above reports a missing table
  const [mc, vc] = [columnIndex(t.header, /mutant/i), columnIndex(t.header, /verdict/i)];
  const claimed = left.filter(x => {
    const row = t.rows.find(r => new RegExp(`\\b${x.id}\\b`, 'i').test(r[mc]) || (r[mc].includes(`line ${x.line}`) && r[mc].includes(x.from)));
    return row && /equivalent|cannot matter|no effect/i.test(row[vc]) && !/not equivalent|needs? a test|missing test/i.test(row[vc]);
  });
  assert.deepEqual(claimed.map(x => `${x.id} line ${x.line}: ${x.from} -> ${x.to}`), [], 'these survivors are marked "equivalent", but the answer key found a situation where the mutant and your code give different answers. "Equivalent" means NO input tells them apart. Find the input and add the test, or change the verdict to "needs a test"');
});

test('the note and the new tests are committed', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/mutation.md is not committed yet');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
});
