// The quality team's own tests, written before this lab. They are the record of what the team checked by hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDefect } from '../../src/inspection/classifyDefect.js';
import { parseSensorReading } from '../../src/inspection/parser.js';
import { labelFor } from '../../src/inspection/label.js';

test('a shaft at its nominal size passes', () => {
  assert.equal(classifyDefect(25.0, 'shaft'), 'pass');
});

test('a bore a little under its nominal size passes', () => {
  assert.equal(classifyDefect(39.99, 'bore'), 'pass');
});

test('a washer in the middle of its tolerance passes', () => {
  assert.equal(classifyDefect(3.25, 'washer'), 'pass');
});

test('a plain reading parses', () => {
  assert.equal(parseSensorReading('25.04'), 25.04);
});

test('spaces around a reading are ignored', () => {
  assert.equal(parseSensorReading('  12.5  '), 12.5);
});

test('the screen label for a pass', () => {
  assert.equal(labelFor('pass'), 'OK');
});
