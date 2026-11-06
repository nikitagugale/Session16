// Classifies one measured part: 'pass', 'rework' (too big, can be machined down), 'scrap' (too small)
// or 'recheck' (no usable reading). The rules are in docs/tolerance-spec.md, section 4.
//
//   reading   the measurement in millimetres, as a number (null when the gauge sent nothing)
//   partType  a key of PARTS, for example 'shaft'

import { PARTS } from './parts.js';
import { UnknownPartError } from './errors.js';

export function classifyDefect(reading, partType) {
  const part = PARTS[partType];
  if (!part) {
    throw new UnknownPartError(partType);
  }
  if (reading === null) {
    return 'recheck';
  }
  const upper = part.nominal + part.tolerance;
  const lower = part.nominal - part.tolerance;
  if (reading > lower && reading <= upper) {
    return 'pass';
  }
  if (reading > upper) {
    return 'rework';
  }
  return 'scrap';
}
