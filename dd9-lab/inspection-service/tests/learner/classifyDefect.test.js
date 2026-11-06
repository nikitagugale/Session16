import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';
import { UnknownPartError } from '../../src/inspection/errors.js';

// Expected answers come from docs/tolerance-spec.md section 4.

test('a shaft just inside its upper limit passes', () => {
  assert.equal(classifyDefect(25.04, 'shaft'), 'pass');
});
test('a shaft just inside its lower limit passes', () => {
  assert.equal(classifyDefect(24.96, 'shaft'), 'pass');
});
test('a shaft exactly on its upper limit is reworked', () => {
  assert.equal(classifyDefect(25.05, 'shaft'), 'rework');
});
test('a shaft exactly on its lower limit is scrapped', () => {
  assert.equal(classifyDefect(24.95, 'shaft'), 'scrap');
});
test('a shaft above its upper limit is reworked', () => {
  assert.equal(classifyDefect(25.06, 'shaft'), 'rework');
});
test('a shaft below its lower limit is scrapped', () => {
  assert.equal(classifyDefect(24.94, 'shaft'), 'scrap');
});
test('a spacer exactly on its upper limit is reworked', () => {
  assert.equal(classifyDefect(6.42, 'spacer'), 'rework');
});
test('a spacer exactly on its lower limit is scrapped', () => {
  assert.equal(classifyDefect(6.28, 'spacer'), 'scrap');
});
test('a reading that rounds onto the upper limit is reworked', () => {
  assert.equal(classifyDefect(25.0496, 'shaft'), 'rework');
});
test('a reading that rounds to just inside the limit passes', () => {
  assert.equal(classifyDefect(25.0494, 'shaft'), 'pass');
});
test('a null reading means recheck', () => {
  assert.equal(classifyDefect(null, 'shaft'), 'recheck');
});
test('an undefined reading means recheck', () => {
  assert.equal(classifyDefect(undefined, 'shaft'), 'recheck');
});
test('a NaN reading means recheck', () => {
  assert.equal(classifyDefect(NaN, 'shaft'), 'recheck');
});
test('a zero reading means recheck', () => {
  assert.equal(classifyDefect(0, 'shaft'), 'recheck');
});
test('a negative reading means recheck', () => {
  assert.equal(classifyDefect(-1, 'shaft'), 'recheck');
});
test('an infinite reading means recheck', () => {
  assert.equal(classifyDefect(Infinity, 'shaft'), 'recheck');
});
test('a reading over twice the nominal size means recheck', () => {
  assert.equal(classifyDefect(50.01, 'shaft'), 'recheck');
});
test('a reading of exactly twice the nominal size is reworked', () => {
  assert.equal(classifyDefect(50, 'shaft'), 'rework');
});
test('an unknown part type throws UnknownPartError', () => {
  assert.throws(() => classifyDefect(25, 'gasket'), UnknownPartError);
});
test('an unknown part type throws even when there is no reading', () => {
  assert.throws(() => classifyDefect(null, 'gasket'), UnknownPartError);
});
