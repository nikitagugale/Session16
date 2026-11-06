import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';
import { PARTS } from '../../src/inspection/parts.js';

// Limits as the spec means them: whole thousandths of a millimetre, so no floating-point noise.
const thousandths = (mm) => Math.round(mm * 1000);
const mm = (t) => t / 1000;

test('regression: a part exactly on its upper limit is reworked, not passed (spec 4.4)', () => {
  assert.equal(classifyDefect(25.05, 'shaft'), 'rework');
  assert.equal(classifyDefect(40.02, 'bore'), 'rework');
});

test('regression: a sleeve on its upper limit is reworked although 19.05 + 0.03 is not exactly 19.08 (half-fix)', () => {
  assert.equal(classifyDefect(19.08, 'sleeve'), 'rework');
});

test('regression: a shim on its upper limit is reworked although 1.6 + 0.05 is not exactly 1.65 (half-fix)', () => {
  assert.equal(classifyDefect(1.65, 'shim'), 'rework');
});

test('regression: a spacer on its lower limit is scrapped although 6.35 - 0.07 is not exactly 6.28 (half-fix)', () => {
  assert.equal(classifyDefect(6.28, 'spacer'), 'scrap');
});

test('regression: every part in the table is outside on each limit and passes one step inside (spec 4.1, 4.4)', () => {
  for (const [name, { nominal, tolerance }] of Object.entries(PARTS)) {
    const upper = thousandths(nominal) + thousandths(tolerance);
    const lower = thousandths(nominal) - thousandths(tolerance);
    assert.equal(classifyDefect(mm(upper), name), 'rework', `${name} on upper limit`);
    assert.equal(classifyDefect(mm(upper + 1), name), 'rework', `${name} above upper limit`);
    assert.equal(classifyDefect(mm(upper - 1), name), 'pass', `${name} inside upper limit`);
    assert.equal(classifyDefect(mm(lower), name), 'scrap', `${name} on lower limit`);
    assert.equal(classifyDefect(mm(lower - 1), name), 'scrap', `${name} below lower limit`);
    assert.equal(classifyDefect(mm(lower + 1), name), 'pass', `${name} inside lower limit`);
  }
});

test('regression: readings are rounded to 0.001 before comparing (spec 4.4)', () => {
  assert.equal(classifyDefect(25.0496, 'shaft'), 'rework');
  assert.equal(classifyDefect(25.0494, 'shaft'), 'pass');
  assert.equal(classifyDefect(24.9504, 'shaft'), 'scrap');
  assert.equal(classifyDefect(24.9506, 'shaft'), 'pass');
});

test('regression: undefined, NaN and non-numbers mean recheck, not scrap (spec 4.5)', () => {
  for (const bad of [undefined, NaN, '25.00', {}, true]) {
    assert.equal(classifyDefect(bad, 'shaft'), 'recheck');
  }
});

test('regression: zero, negative, infinite and over-twice-nominal readings mean recheck (spec 4.6)', () => {
  for (const bad of [0, -1, -Infinity, Infinity, 50.01]) {
    assert.equal(classifyDefect(bad, 'shaft'), 'recheck');
  }
  assert.equal(classifyDefect(50, 'shaft'), 'rework');
  assert.equal(classifyDefect(3.2, 'shim'), 'rework');
});

test('regression: a reading that is positive before rounding is not a sensor fault (spec 4.6)', () => {
  assert.equal(classifyDefect(0.0004, 'shaft'), 'scrap');
});

test('regression: rounding is to exactly 0.001, on a large part too (spec 4.4)', () => {
  // 40.01951 is nearer 40.020 (the bore limit) than 40.019, so it is on the limit and reworked.
  assert.equal(classifyDefect(40.01951, 'bore'), 'rework');
  assert.equal(classifyDefect(39.98049, 'bore'), 'scrap');
  assert.equal(classifyDefect(40.01949, 'bore'), 'pass');
  assert.equal(classifyDefect(39.98051, 'bore'), 'pass');
});
