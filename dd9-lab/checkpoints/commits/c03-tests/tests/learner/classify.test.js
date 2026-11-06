// Edge-case tests for classifyDefect, written from docs/tolerance-spec.md (not from the code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';
import { PARTS } from '../../src/inspection/parts.js';

// Limits as whole micrometres, so that the test itself does not suffer from rounding.
const um = x => Math.round(x * 1000);
const upperOf = p => (um(p.nominal) + um(p.tolerance)) / 1000;
const lowerOf = p => (um(p.nominal) - um(p.tolerance)) / 1000;

test('a shaft exactly on its upper limit is reworked', () => {
  assert.equal(classifyDefect(25.05, 'shaft'), 'rework');
});

test('a shaft exactly on its lower limit is scrapped', () => {
  assert.equal(classifyDefect(24.95, 'shaft'), 'scrap');
});

test('a shaft just inside its upper limit passes', () => {
  assert.equal(classifyDefect(25.049, 'shaft'), 'pass');
});

test('a shaft just inside its lower limit passes', () => {
  assert.equal(classifyDefect(24.951, 'shaft'), 'pass');
});

test('a shaft just over its upper limit is reworked', () => {
  assert.equal(classifyDefect(25.051, 'shaft'), 'rework');
});

test('a shaft just under its lower limit is scrapped', () => {
  assert.equal(classifyDefect(24.949, 'shaft'), 'scrap');
});

test('every part exactly on its upper limit is reworked', () => {
  for (const [name, p] of Object.entries(PARTS)) {
    assert.equal(classifyDefect(upperOf(p), name), 'rework', `${name} at ${upperOf(p)}`);
  }
});

test('every part exactly on its lower limit is scrapped', () => {
  for (const [name, p] of Object.entries(PARTS)) {
    assert.equal(classifyDefect(lowerOf(p), name), 'scrap', `${name} at ${lowerOf(p)}`);
  }
});

test('every part a hair inside both limits passes', () => {
  for (const [name, p] of Object.entries(PARTS)) {
    assert.equal(classifyDefect(upperOf(p) - 0.001, name), 'pass', `${name} just under the upper limit`);
    assert.equal(classifyDefect(lowerOf(p) + 0.001, name), 'pass', `${name} just over the lower limit`);
  }
});

test('no reading from the gauge (null) asks for a recheck', () => {
  assert.equal(classifyDefect(null, 'bore'), 'recheck');
});

test('a NaN reading asks for a recheck', () => {
  assert.equal(classifyDefect(NaN, 'bore'), 'recheck');
});

test('an undefined reading asks for a recheck', () => {
  assert.equal(classifyDefect(undefined, 'bore'), 'recheck');
});

test('a negative reading is a sensor fault, so recheck', () => {
  assert.equal(classifyDefect(-2.5, 'bracket'), 'recheck');
});

test('a reading of zero is a sensor fault, so recheck', () => {
  assert.equal(classifyDefect(0, 'bracket'), 'recheck');
});

test('a reading of more than twice the nominal size is a sensor fault, so recheck', () => {
  assert.equal(classifyDefect(50.001, 'shaft'), 'recheck');
});

test('a reading of exactly twice the nominal size is reworked, not a fault', () => {
  assert.equal(classifyDefect(50, 'shaft'), 'rework');
});

test('a number written as text is not a reading, so recheck', () => {
  assert.equal(classifyDefect('25.04', 'shaft'), 'recheck');
});

test('an unknown part type throws UnknownPartError', () => {
  assert.throws(() => classifyDefect(25, 'gizmo'), { name: 'UnknownPartError' });
});

test('an unknown part type is reported even when there is no reading', () => {
  assert.throws(() => classifyDefect(null, 'gizmo'), { name: 'UnknownPartError' });
});
