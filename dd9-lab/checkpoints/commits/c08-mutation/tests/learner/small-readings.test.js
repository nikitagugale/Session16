// Added after the mutation check: a survivor showed that no test used a reading between 0 and 1 for a small part.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';

test('a shim reading 0.5 is a real part, far too small, so scrap and not a sensor fault', () => {
  assert.equal(classifyDefect(0.5, 'shim'), 'scrap');
});
