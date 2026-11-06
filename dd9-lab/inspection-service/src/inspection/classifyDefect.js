// Classifies one measured part: 'pass', 'rework' (too big, can be machined down), 'scrap' (too small)
// or 'recheck' (no usable reading). The rules are in docs/tolerance-spec.md, section 4.
//
//   reading   the measurement in millimetres, as a number (null when the gauge sent nothing)
//   partType  a key of PARTS, for example 'shaft'

import { PARTS } from './parts.js';
import { UnknownPartError } from './errors.js';

// Sizes are compared in whole thousandths of a millimetre (spec 4.4), so that 25 + 0.05 and 6.35 - 0.07
// are exact integers and never "almost" the limit.
const thousandths = (mm) => Math.round(mm * 1000);

export function classifyDefect(reading, partType) {
  const part = PARTS[partType];
  if (!part) {
    throw new UnknownPartError(partType);              // 4.7: before the reading is looked at
  }
  if (typeof reading !== 'number' || Number.isNaN(reading)) {
    return 'recheck';                                  // 4.5: no usable reading
  }
  if (!Number.isFinite(reading) || reading <= 0 || reading > 2 * part.nominal) {
    return 'recheck';                                  // 4.6: judged on the raw reading, before rounding
  }
  const size = thousandths(reading);
  const upper = thousandths(part.nominal) + thousandths(part.tolerance);
  const lower = thousandths(part.nominal) - thousandths(part.tolerance);
  if (size >= upper) {
    return 'rework';                                   // 4.2 and 4.4
  }
  if (size <= lower) {
    return 'scrap';                                    // 4.3 and 4.4
  }
  return 'pass';                                       // 4.1
}
