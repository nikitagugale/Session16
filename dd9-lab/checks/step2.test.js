// Milestone 2: the edge-case list. Every row is judged against the answer key, so whatever a learner writes is checked, not a fixed list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnIndex, commitsTouching, editedFixtures, exists, isRepoReady, oracle, read, table } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/edge-cases.md';
const { PARTS, um, classifyRef } = oracle;

function readingOf(token) {
  const t = token.trim().replace(/^[`'"]|[`'"]$/g, '');
  if (/^null$/i.test(t)) return { value: null, kind: 'none' };
  if (/^undefined$/i.test(t)) return { value: undefined, kind: 'none' };
  if (/^nan$/i.test(t)) return { value: NaN, kind: 'none' };
  if (/^\+?infinity$/i.test(t)) return { value: Infinity, kind: 'impossible' };
  if (/^-infinity$/i.test(t)) return { value: -Infinity, kind: 'impossible' };
  if (/^[`]?['"]/.test(token.trim())) return { value: t, kind: 'text' };
  const n = Number(t.replace(/\s*mm$/i, ''));
  return Number.isNaN(n) || t === '' ? null : { value: n, kind: 'number' };
}
function normalise(expected) {
  const e = expected.toLowerCase().replace(/[^a-z]/g, '');
  if (/^(throw|throws|error|unknownparter|unknownparterror|throwsunknownparterror)/.test(e)) return 'throws';
  if (e.startsWith('recheck') || e === 'remeasure') return 'recheck';
  if (/^(pass|rework|scrap)/.test(e)) return e.match(/^(pass|rework|scrap)/)[1];
  return null;
}

function rows() {
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`);
  const t = table(read(FILE), h => columnIndex(h, /case|what/i) >= 0 && columnIndex(h, /input/i) >= 0 && columnIndex(h, /expected/i) >= 0);
  assert.ok(t, 'there is no table with the columns Case, Input and Expected');
  const [c, i, e] = [columnIndex(t.header, /case|what/i), columnIndex(t.header, /input/i), columnIndex(t.header, /expected/i)];
  return t.rows.filter(r => r[i]).map(r => {
    const input = r[i].replace(/^`|`$/g, '');
    const cut = input.lastIndexOf(',');
    const reading = cut > 0 ? readingOf(input.slice(0, cut)) : null;
    const part = cut > 0 ? input.slice(cut + 1).trim().replace(/^[`'"]|[`'"]$/g, '') : null;
    const expected = normalise(r[e] ?? '');
    const truth = reading && part !== null && part !== '' ? oracle.outcome(classifyRef, reading.value, part).replace(/"/g, '') : null;
    const real = truth === null ? null : truth.startsWith('throws') ? 'throws' : truth;
    const p = PARTS[part];
    const family = !reading || !p && real !== 'throws' ? null : real === 'throws' ? 'unknown' : reading.kind === 'none' ? 'none' : reading.kind === 'text' ? 'text'
      : reading.value <= 0 || reading.value > 2 * p.nominal ? 'impossible'
        : um(reading.value) === um(p.nominal) + um(p.tolerance) ? 'upper' : um(reading.value) === um(p.nominal) - um(p.tolerance) ? 'lower'
          : Math.min(Math.abs(um(reading.value) - um(p.nominal) - um(p.tolerance)), Math.abs(um(reading.value) - um(p.nominal) + um(p.tolerance))) <= 20 ? 'near' : 'other';
    const awkward = ['upper', 'lower'].includes(family) && ['sleeve', 'shim', 'spacer'].includes(part) && (family === 'upper' ? part !== 'spacer' : part === 'spacer');
    return { name: r[c] || input, input, reading, part, expected, real, family, awkward };
  });
}

test('docs/edge-cases.md exists with a table of at least 14 cases', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const r = rows();
  assert.ok(r.length >= 14, `the table has ${r.length} rows. List more cases: think about each way a reading can be wrong`);
});

test('every Input is a reading and a part, and every Expected is one of pass, rework, scrap, recheck or throws', () => {
  const bad = rows().filter(r => r.real === null).map(r => `"${r.name.slice(0, 40)}"`);
  assert.deepEqual(bad.slice(0, 4), [], 'these rows are not in the form `reading, part` (for example `25.05, shaft`)');
  const unknown = rows().filter(r => r.real !== null && r.expected === null).map(r => `"${r.name.slice(0, 40)}"`);
  assert.deepEqual(unknown.slice(0, 4), [], 'these rows do not say pass, rework, scrap, recheck or throws in the Expected column');
});

test('the expected answers are what the specification says', () => {
  const wrong = rows().filter(r => r.real !== null && r.expected !== null && r.expected !== r.real).map(r => `"${r.name.slice(0, 50)}"`);
  assert.deepEqual(wrong, [], 'the answer for these rows is not what docs/tolerance-spec.md says. Find the section that decides each one, and read it again: the code may disagree with it');
});

test('the boundary of a limit is covered: exactly on it, and a step either side', () => {
  const r = rows();
  const has = f => r.filter(x => x.family === f).length;
  assert.ok(has('upper') >= 1 && has('lower') >= 1, 'list a part exactly on its upper limit and a part exactly on its lower limit');
  assert.ok(has('near') >= 2, 'list at least two readings a step either side of a limit (a thousandth of a millimetre or a few)');
});

test('the ways the gauge can send nothing, and impossible readings, are covered', () => {
  const r = rows();
  const none = new Set(r.filter(x => x.family === 'none').map(x => String(x.reading.value)));
  assert.ok(none.size >= 2, 'the gauge can send nothing in more than one way. List at least two (look at the types a value can have)');
  const impossible = new Set(r.filter(x => x.family === 'impossible').map(x => (x.reading.value <= 0 ? (x.reading.value === 0 ? 'zero' : 'negative') : 'huge')));
  assert.ok(impossible.size >= 2, 'list at least two different impossible readings (what can a sensor fault look like?)');
  assert.ok(r.some(x => x.family === 'unknown'), 'list a part type that does not exist');
});

test('a boundary for a part with an awkward size is covered', () => {
  assert.ok(rows().some(x => x.awkward), 'look at the part table: do all the limits come out as clean decimals? Add a boundary for a part where they do not');
});

test('the list is committed, and the code and the specification are untouched', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/edge-cases.md is not committed yet');
});
