// Text for the screen on the shop floor. Cosmetic: nothing else depends on it.

const LABELS = {
  pass: 'OK',
  rework: 'REWORK: too big',
  scrap: 'SCRAP: too small',
  recheck: 'RECHECK: no usable reading',
};

export function labelFor(outcome) {
  if (!(outcome in LABELS)) {
    return 'UNKNOWN';
  }
  return LABELS[outcome];
}

export function summarise(outcomes) {
  const counts = { pass: 0, rework: 0, scrap: 0, recheck: 0 };
  for (const outcome of outcomes) {
    if (outcome in counts) {
      counts[outcome] += 1;
    }
  }
  return counts;
}
