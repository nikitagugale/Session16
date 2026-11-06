// Turns the gauge's text ("25.04") into a number of millimetres. See docs/tolerance-spec.md, section 2.

import { ParseError } from './errors.js';

// An optional minus sign, one to four digits, and optionally a point with one to four digits (spec 2.1).
const READING = /^-?\d{1,4}(\.\d{1,4})?$/;

export function parseSensorReading(raw) {
  if (typeof raw !== 'string') {
    throw new ParseError(raw, 'a reading must be text');
  }
  const text = raw.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');
  if (!READING.test(text)) {
    throw new ParseError(raw);
  }
  return Number(text);
}

export { ParseError };
