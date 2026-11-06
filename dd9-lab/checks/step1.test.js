// Milestone 1: the coverage baseline. Recomputes the team's coverage on the STARTING commit and judges the learner's document against it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { baselineCommit, columnIndex, commitsTouching, coverageIn, editedFixtures, exists, isRepoReady, lineNumbers, read, table, withTree, words } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/baseline.md';
let truth;
async function baseline() {
  truth ??= await withTree(baselineCommit(), async dir => ({ report: await coverageIn(dir, ['existing']), source: readFileSync(path.join(dir, 'src/inspection/classifyDefect.js'), 'utf8').split('\n') }));
  return truth;
}
const num = cell => Number.parseFloat(String(cell).replace(/[^\d.\-]/g, ''));
const rating = cell => (/high|critical|severe|serious/i.test(cell) ? 3 : /med/i.test(cell) ? 2 : /low|cosmetic|minor/i.test(cell) ? 1 : 0);

function tables() {
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the two tables from the milestone card.`);
  const text = read(FILE);
  const numbers = table(text, h => columnIndex(h, /file/i) >= 0 && columnIndex(h, /line/i) >= 0 && columnIndex(h, /branch/i) >= 0);
  const gaps = table(text, h => columnIndex(h, /untested|gap|what/i) >= 0 && columnIndex(h, /line/i) >= 0 && columnIndex(h, /risk/i) >= 0);
  return { text, numbers, gaps };
}
/** A row about the cosmetic label code: it names label.js, or talks about the screen text and not about any verdict. */
const isLabelRow = row => { const s = row.join(' '); return /label/i.test(s) || (/screen|cosmetic/i.test(s) && !/classify|verdict|reading|limit|scrap|rework|recheck|pass|sensor/i.test(s)); };
/** The blocks of lines the team's tests never run in a file, as [first, last] pairs. */
const blocksOf = spec => String(spec).split(/\s+/).filter(Boolean).map(p => p.split('-').map(Number)).map(([a, b]) => [a, b ?? a]);

test('docs/baseline.md exists with a table of coverage numbers and a table of untested gaps', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const t = tables();
  assert.ok(t.numbers, 'there is no table with the columns File, Lines % and Branches %');
  assert.ok(t.gaps, 'there is no table with the columns Untested, Lines and Risk');
});

test('the coverage numbers are what the tool prints for the team\'s tests', async () => {
  const t = tables();
  assert.ok(t.numbers, 'there is no coverage table');
  const { report } = await baseline();
  const f = columnIndex(t.numbers.header, /file/i), l = columnIndex(t.numbers.header, /line/i), b = columnIndex(t.numbers.header, /branch/i);
  const wrong = [];
  for (const name of ['classifyDefect.js', 'parser.js']) {
    const row = t.numbers.rows.find(r => (r[f] ?? '').includes(name.replace('.js', '')));
    const real = report[`src/inspection/${name}`];
    if (!row) { wrong.push(`${name} (no row)`); continue; }
    if (Math.abs(num(row[l]) - real.line) > 0.6 || Math.abs(num(row[b]) - real.branch) > 0.6) wrong.push(name);
  }
  assert.deepEqual(wrong, [], 'these rows do not match what `npm run coverage -- --team` prints (the team\'s tests only, not yours). Run it and copy the numbers');
});

test('every block of classifyDefect.js that the team\'s tests never run has a row, with its real line numbers', async () => {
  const t = tables();
  assert.ok(t.gaps, 'there is no table of untested gaps');
  const { report } = await baseline();
  const lc = columnIndex(t.gaps.header, /line/i);
  const covered = new Set(t.gaps.rows.flatMap(r => lineNumbers(r[lc])));
  const missing = blocksOf(report['src/inspection/classifyDefect.js'].uncovered).filter(([a, b]) => ![...Array(b - a + 1).keys()].some(i => covered.has(a + i)));
  assert.deepEqual(missing.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)), [], 'these untested lines of classifyDefect.js have no row. Run `npm run coverage -- --team` and look at "Never run"');
  const cosmetic = report['src/inspection/label.js'];
  const labelRow = t.gaps.rows.some(r => /label|screen|cosmetic|text/i.test(r.join(' ')) || lineNumbers(r[lc]).some(n => blocksOf(cosmetic.uncovered).some(([a, b]) => n >= a && n <= b)));
  assert.ok(labelRow, 'the cosmetic code in label.js is untested too. Give it a row, so that you can show how little it matters');
});

test('the risk ratings put the dangerous gaps first and the cosmetic one last', async () => {
  const t = tables();
  assert.ok(t.gaps, 'there is no table of untested gaps');
  const { report, source } = await baseline();
  const lc = columnIndex(t.gaps.header, /line/i), rc = columnIndex(t.gaps.header, /risk/i);
  assert.ok(t.gaps.rows.length >= 4, `the table has ${t.gaps.rows.length} rows. Every untested block needs one, and so does label.js`);
  assert.ok(t.gaps.rows.every(r => rating(r[rc]) > 0), 'every row needs a risk of high, medium or low');
  // lines of classifyDefect.js whose untested code decides a verdict: the answers 'rework', 'scrap' and 'recheck'
  const verdict = new Set();
  for (const [a, b] of blocksOf(report['src/inspection/classifyDefect.js'].uncovered)) for (let n = a; n <= b; n++) if (/return '(rework|scrap|recheck)'/.test(source[n - 1] ?? '')) verdict.add(n);
  const low = [];
  for (const row of t.gaps.rows) {
    const lines = lineNumbers(row[lc]);
    if (!isLabelRow(row) && lines.some(n => verdict.has(n)) && rating(row[rc]) < 3) low.push(`"${row[0].slice(0, 40)}"`);
  }
  assert.deepEqual(low, [], 'these rows decide what happens to a part, and the risk is rated too low. What is the cost of a wrong verdict?');
  const labelRows = t.gaps.rows.filter(isLabelRow);
  assert.ok(labelRows.every(r => rating(r[rc]) === 1), 'the screen text in label.js changes what a person reads, not what happens to a part. Is that a high risk?');
  const ratings = t.gaps.rows.map(r => rating(r[rc]));
  assert.ok(ratings.every((x, i) => i === 0 || x <= ratings[i - 1]), 'put the rows in order, highest risk first');
  assert.equal(ratings[0], 3, 'the first row should be the gap that could do the most harm');
});

test('the document says what coverage cannot see', () => {
  const t = tables();
  const line = /^\W*Coverage cannot see\W*:\s*(.+)$/im.exec(t.text)?.[1] ?? '';
  assert.ok(words(line) >= 8, 'add a line that starts with "Coverage cannot see:" and says, in a sentence, one thing the numbers could never show you');
});

test('the baseline is committed, and the code and the team\'s tests are untouched', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/baseline.md is not committed yet');
});
