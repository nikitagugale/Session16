// Added after the mutation check. The survivor "1000 -> 1001" looked equivalent, because scaling a limit and a reading by the same
// ratio seems to change nothing. It does change something for a reading with a fourth decimal, which the gauge text may have
// (spec 2.1), and which the spec says to round to the nearest 0.001 first (spec 4.4). These are the readings that tell the two apart.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';

test('a shim reading of 1.5506 rounds to 1.551, just inside the lower limit, so it passes', () => {
  assert.equal(classifyDefect(1.5506, 'shim'), 'pass');
});

test('a shim reading of 1.6497 rounds to 1.650, on the upper limit, so it is reworked', () => {
  assert.equal(classifyDefect(1.6497, 'shim'), 'rework');
});
