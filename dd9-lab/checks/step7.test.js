// Milestone 7: the coverage delta, with the numbers recomputed, and the risks closed tied to tests that exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { baselineCommit, columnIndex, commitsTouching, coverageIn, editedFixtures, exists, isRepoReady, read, section, table, testNames, withTree, words } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/coverage-delta.md';
let cache;
async function measured() {
  cache ??= {
    before: await withTree(baselineCommit(), dir => coverageIn(dir, ['existing'])),
    after: await withTree('WORKING', async dir => ({ report: await coverageIn(dir, ['existing', 'learner']), names: testNames(dir).map(t => t.name) })),
  };
  return cache;
}
const num = cell => Number.parseFloat(String(cell).replace(/[^\d.\-]/g, ''));
const doc = () => { assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`); return read(FILE); };
const deltaTable = text => table(text, h => columnIndex(h, /file/i) >= 0 && columnIndex(h, /line.*before/i) >= 0 && columnIndex(h, /branch.*after/i) >= 0);

test('docs/coverage-delta.md has the before and after table', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const t = deltaTable(doc());
  assert.ok(t, 'there is no table with the columns File, Lines % before, Lines % after, Branches % before and Branches % after');
  assert.ok(t.rows.some(r => /classifyDefect/.test(r[0])), 'the table needs a row for classifyDefect.js');
});

test('the numbers are what the coverage tool prints: before for the team\'s tests, after for all of them', async () => {
  const t = deltaTable(doc());
  assert.ok(t, 'there is no coverage table');
  const row = t.rows.find(r => /classifyDefect/.test(r[0]));
  assert.ok(row, 'the table needs a row for classifyDefect.js');
  const idx = p => columnIndex(t.header, p);
  const { before, after } = await measured();
  const b = before['src/inspection/classifyDefect.js'], a = after.report['src/inspection/classifyDefect.js'];
  const checks = [['Lines % before', row[idx(/line.*before/i)], b.line], ['Lines % after', row[idx(/line.*after/i)], a.line], ['Branches % before', row[idx(/branch.*before/i)], b.branch], ['Branches % after', row[idx(/branch.*after/i)], a.branch]];
  const wrong = checks.filter(([, cell, real]) => !(Math.abs(num(cell) - real) <= 0.6)).map(([name]) => name);
  assert.deepEqual(wrong, [], 'these numbers are not right. "Before" is the baseline from milestone 1 (the team\'s tests on the code as shipped: copy it from docs/baseline.md). "After" is what `npm run coverage` prints now, for all the tests on your fixed code');
});

test('three or more different risks are closed, and each is tied to a test that exists', async () => {
  const text = doc();
  const risks = section(text, /risks? closed/i);
  assert.ok(risks, 'there is no "## Risks closed" section');
  const bullets = risks.split('\n').filter(l => /^\s*[-*]\s+\S/.test(l));
  assert.ok(bullets.length >= 3, `the section has ${bullets.length} bullets. Name at least three risks`);
  const { after } = await measured();
  const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ');
  const tied = bullets.filter(b => after.names.some(n => n.length > 12 && norm(b).includes(norm(n))));
  assert.ok(tied.length >= 3, `only ${tied.length} bullets copy the exact title of a test from tests/learner. Each risk needs the test that guards it, word for word`);
  const families = new Set();
  for (const b of tied) {
    if (/boundar|limit|on its|exactly/i.test(b)) families.add('boundary');
    if (/round|float|decimal|awkward|precision/i.test(b)) families.add('rounding');
    if (/nan|undefined|null|no reading|nothing|dropout/i.test(b)) families.add('no reading');
    if (/negative|zero|impossible|fault|twice|too big|huge/i.test(b)) families.add('impossible');
    if (/unknown|part type|gizmo/i.test(b)) families.add('unknown part');
    if (/text|string/i.test(b)) families.add('text');
  }
  assert.ok(families.size >= 3, `the risks you name are about ${families.size} different thing(s). Name at least three different kinds of risk, in plain words`);
});

test('the report says what is still not covered', () => {
  const left = section(doc(), /still not covered|not covered|open|limits?/i);
  assert.ok(left, 'there is no "## Still not covered" section');
  assert.ok(words(left) >= 15, 'say in at least 15 words what your tests and numbers do not protect');
  assert.ok(/parser|parse|sampl|label|part table|parts\.js|sensor|decimal|integration|other file|rest of/i.test(left), 'name something real that is still open: another function, another file, or something coverage cannot show');
});

test('the report is committed, and the specification and the team\'s tests are untouched', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/coverage-delta.md is not committed yet');
});
