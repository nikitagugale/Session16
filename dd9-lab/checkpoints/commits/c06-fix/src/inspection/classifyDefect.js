// Classifies one measured part: 'pass', 'rework' (too big, can be machined down), 'scrap' (too small)
// or 'recheck' (no usable reading). The rules are in docs/tolerance-spec.md, section 4.
//
//   reading   the measurement in millimetres, as a number (null when the gauge sent nothing)
//   partType  a key of PARTS, for example 'shaft'

import { PARTS } from './parts.js';
import { UnknownPartError } from './errors.js';

// Sizes are compared as whole micrometres (0.001 mm, the gauge's resolution), because 25 + 0.05 is not always the
// same number as 25.05 once a computer has added it (spec 4.4).
const micrometres = millimetres => Math.round(millimetres * 1000);

export function classifyDefect(reading, partType) {
  if (!Object.hasOwn(PARTS, partType)) {
    throw new UnknownPartError(partType);
  }
  const part = PARTS[partType];
  if (typeof reading !== 'number' || !Number.isFinite(reading)) {
    return 'recheck';
  }
  if (reading <= 0 || reading > 2 * part.nominal) {
    return 'recheck';
  }
  const size = micrometres(reading);
  const upper = micrometres(part.nominal) + micrometres(part.tolerance);
  const lower = micrometres(part.nominal) - micrometres(part.tolerance);
  if (size >= upper) {
    return 'rework';
  }
  if (size <= lower) {
    return 'scrap';
  }
  return 'pass';
}
