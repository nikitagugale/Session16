// Property-based tests for parseSensorReading: claims that must hold for MANY inputs, not just the ones we thought of.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSensorReading } from '../../src/inspection/parser.js';
import { forAll, gen } from '../lib/property.js';

// Characters a flaky gauge cable could send, including ones you cannot see (a zero-width space).
const ALPHABET = '0123456789.-+, e\u200bmmx';
const VALID = /^[ \t\r\n]*-?\d{1,4}(\.\d{1,4})?[ \t\r\n]*$/;

test('property: any text either parses to a finite number or throws a ParseError, never NaN', () => {
  forAll(gen.string(ALPHABET, 9), text => {
    let value;
    try {
      value = parseSensorReading(text);
    } catch (error) {
      assert.equal(error.name, 'ParseError', `threw ${error.name} for ${JSON.stringify(text)}`);
      return;
    }
    assert.ok(Number.isFinite(value), `returned ${value} for ${JSON.stringify(text)}`);
  });
});

test('property: text that is not a valid reading throws a ParseError', () => {
  forAll(gen.string(ALPHABET, 9), text => {
    if (VALID.test(text)) return;
    assert.throws(() => parseSensorReading(text), { name: 'ParseError' }, `no error for ${JSON.stringify(text)}`);
  });
});

test('property: a valid reading parses to the number it spells', () => {
  forAll(gen.string('0123456789.- ', 9), text => {
    if (!VALID.test(text)) return;
    assert.equal(parseSensorReading(text), Number(text.trim()));
  });
});

test('a reading with an invisible zero-width space at the end is refused', () => {
  assert.throws(() => parseSensorReading('12.5\u200b'), { name: 'ParseError' });
});
