// Turns the gauge's text ("25.04") into a number of millimetres. See docs/tolerance-spec.md, section 2.

import { ParseError } from './errors.js';

export function parseSensorReading(raw) {
  const text = typeof raw === 'string' ? raw.trim() : raw;
  return parseFloat(text);
}

export { ParseError };
