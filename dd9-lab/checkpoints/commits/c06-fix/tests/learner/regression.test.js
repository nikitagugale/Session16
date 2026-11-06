// Regression tests: each one is named after a bug that was really in classifyDefect, and each fails on the code as shipped.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';

test('regression: a shaft exactly on its upper limit used to pass', () => {
  assert.equal(classifyDefect(25.05, 'shaft'), 'rework');
});

test('regression: rounding error used to let a sleeve or a shim on its upper limit pass', () => {
  assert.equal(classifyDefect(19.08, 'sleeve'), 'rework');
  assert.equal(classifyDefect(1.65, 'shim'), 'rework');
});

test('regression: rounding error used to let a spacer on its lower limit pass', () => {
  assert.equal(classifyDefect(6.28, 'spacer'), 'scrap');
});

test('regression: a NaN reading used to be scrapped instead of rechecked', () => {
  assert.equal(classifyDefect(NaN, 'shaft'), 'recheck');
});
