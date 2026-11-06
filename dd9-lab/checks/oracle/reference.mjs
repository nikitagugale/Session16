// The hidden answer key. Lab fixture, outside the folder learners open.
// It holds the CORRECT behaviour (what docs/tolerance-spec.md says), the situations to try, and slightly wrong versions ("mutants") of the
// code, so that a learner's TESTS can be checked for strength. The code as shipped is kept next to it in ./shipped/.

export const PARTS = {
  shaft:   { nominal: 25.0,  tolerance: 0.05 },
  bore:    { nominal: 40.0,  tolerance: 0.02 },
  bracket: { nominal: 12.7,  tolerance: 0.1 },
  spacer:  { nominal: 6.35,  tolerance: 0.07 },
  sleeve:  { nominal: 19.05, tolerance: 0.03 },
  shim:    { nominal: 1.6,   tolerance: 0.05 },
  washer:  { nominal: 3.2,   tolerance: 0.15 },
};
export const um = x => Math.round(x * 1000);

class UnknownPartError extends Error { constructor(p) { super(`unknown part ${p}`); this.name = 'UnknownPartError'; } }

export function classifyRef(reading, partType) {
  if (!Object.hasOwn(PARTS, partType)) throw new UnknownPartError(partType);
  const part = PARTS[partType];
  if (typeof reading !== 'number' || !Number.isFinite(reading)) return 'recheck';
  if (reading <= 0 || reading > 2 * part.nominal) return 'recheck';
  const r = um(reading);
  const upper = um(part.nominal) + um(part.tolerance);
  const lower = um(part.nominal) - um(part.tolerance);
  if (r >= upper) return 'rework';
  if (r <= lower) return 'scrap';
  return 'pass';
}

const PLAN = [[8, 2], [15, 3], [25, 5], [50, 8], [90, 13], [150, 20], [280, 32], [500, 50], [1200, 80], [Infinity, 125]];
export function sampleRef(lotSize) {
  if (typeof lotSize !== 'number' || !Number.isInteger(lotSize) || lotSize < 2) throw new RangeError(`bad lot size ${lotSize}`);
  for (const [largest, size] of PLAN) if (lotSize <= largest) return size;
}

const VALID = /^[ \t\r\n]*-?\d{1,4}(\.\d{1,4})?[ \t\r\n]*$/;
export function parseRef(raw) {
  if (typeof raw !== 'string' || !VALID.test(raw)) { const e = new Error('bad reading'); e.name = 'ParseError'; throw e; }
  return Number(raw.trim());
}

/** What a function does for one input, as a short comparable string (a thrown error shows as "throws <name>"). */
export function outcome(fn, ...args) {
  try { const v = fn(...args); return Number.isNaN(v) ? 'NaN' : v === undefined ? 'undefined' : JSON.stringify(v); } catch (e) { return `throws ${e?.name}`; }
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

let classifyCache;
export function classifyCases() {
  if (classifyCache) return classifyCache;
  const out = [];
  const r = rng(9);
  for (const [name, p] of Object.entries(PARTS)) {
    const U = um(p.nominal) + um(p.tolerance);
    const L = um(p.nominal) - um(p.tolerance);
    for (let d = -3; d <= 3; d++) { out.push([(U + d) / 1000, name]); out.push([(L + d) / 1000, name]); }
    for (const x of [p.nominal, p.nominal + p.tolerance / 2, p.nominal - p.tolerance / 2, p.nominal + p.tolerance * 1.5, p.nominal - p.tolerance * 1.5, p.nominal + 0.0004, 2 * p.nominal, 2 * p.nominal + 0.001, 2 * p.nominal - 0.001, 0, 0.001, -0.001, -p.nominal, 1e9, Infinity, -Infinity, NaN, null, undefined, String(p.nominal), '', {}, [], true]) out.push([x, name]);
    for (let i = 0; i < 160; i++) out.push([Math.round(r() * 2.3 * p.nominal * 1000) / 1000, name]);
  }
  for (const name of ['gizmo', '', undefined, null, 'Shaft', 'SHAFT', ' shaft', 42]) for (const x of [25, null, NaN, undefined, 0]) out.push([x, name]);
  return (classifyCache = out);
}
function compareOver(cases, fn, reference) {
  const wrong = [];
  for (const c of cases) {
    const want = outcome(reference, ...c);
    const got = outcome(fn, ...c);
    if (want !== got) wrong.push({ input: c, want, got });
  }
  return { total: cases.length, different: wrong.length, first: wrong };
}
export function compareClassify(fn, reference = classifyRef) {
  return compareOver(classifyCases(), fn, reference);
}

let fineCache;
/** Readings with more decimals than the gauge's resolution (0.001 mm): a little either side of each limit. Spec 4.4 says to round them first.
 *  They are NOT part of the behaviour check of milestone 6. They are only used to judge a claim that a change "cannot matter" (milestone 8). */
export function fineCases() {
  if (fineCache) return fineCache;
  const out = [];
  for (const [name, p] of Object.entries(PARTS)) {
    const U = um(p.nominal) + um(p.tolerance);
    const L = um(p.nominal) - um(p.tolerance);
    for (const d of [-0.6, -0.53, -0.47, -0.3, 0.3, 0.47, 0.53, 0.6]) { out.push([(U + d) / 1000, name]); out.push([(L + d) / 1000, name]); }
  }
  return (fineCache = out);
}
export const compareFine = (fn, reference = classifyRef) => compareOver(fineCases(), fn, reference);
export const showInput = ([x, part]) => `${typeof x === 'string' ? JSON.stringify(x) : Object.is(x, -0) ? '-0' : typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x)}, ${typeof part === 'string' ? `'${part}'` : String(part)}`;

let sampleCache;
export function sampleCases() {
  if (sampleCache) return sampleCache;
  const out = [];
  for (let n = -5; n <= 1300; n++) out.push([n]);
  for (const x of [1.5, 2.5, 8.5, 100.5, 1e9, Infinity, -Infinity, NaN, '10', '', null, undefined, true, [], {}]) out.push([x]);
  return (sampleCache = out);
}
export function compareSample(fn, reference = sampleRef) {
  const cases = sampleCases();
  const wrong = [];
  for (const c of cases) { const want = outcome(reference, ...c); const got = outcome(fn, ...c); if (want !== got) wrong.push({ input: c, want, got }); }
  return { total: cases.length, different: wrong.length, first: wrong };
}

// ---------------------------------------------------------------------------------------------------------------------
// Slightly wrong versions of the code, as source text, to be written over src/inspection/*.js in a scratch copy.

const HEAD = `import { PARTS } from './parts.js';\nimport { UnknownPartError } from './errors.js';\nconst um = x => Math.round(x * 1000);\n`;

/** cfg flags: each one introduces a single mistake. {} is the correct code. */
export function classifySource(cfg = {}) {
  const lines = [HEAD, 'export function classifyDefect(reading, partType) {'];
  const lookup = cfg.unknownRecheck ? "  const part = PARTS[partType];\n  if (!part) { return 'recheck'; }" : "  if (!Object.hasOwn(PARTS, partType)) { throw new UnknownPartError(partType); }\n  const part = PARTS[partType];";
  if (cfg.readingFirst) {
    lines.push("  if (reading === null) { return 'recheck'; }");
  }
  lines.push(lookup);
  if (cfg.coerceStrings) lines.push('  if (typeof reading === \'string\' && reading.trim() !== \'\') { reading = Number(reading); }');
  if (cfg.nanUnhandled) lines.push("  if (reading === null || reading === undefined) { return 'recheck'; }");
  else if (cfg.undefinedUnhandled) lines.push("  if (reading === null || Number.isNaN(reading) || typeof reading === 'string') { return 'recheck'; }");
  else lines.push("  if (typeof reading !== 'number' || !Number.isFinite(reading)) { return 'recheck'; }");
  const zero = cfg.zeroAllowed ? 'reading < 0' : cfg.negativeUnhandled ? 'false' : 'reading <= 0';
  const huge = cfg.hugeUnhandled ? 'false' : cfg.twiceInclusive ? 'reading >= 2 * part.nominal' : 'reading > 2 * part.nominal';
  lines.push(`  if (${zero} || ${huge}) { return 'recheck'; }`);
  const [over, under] = cfg.swapped ? ["'scrap'", "'rework'"] : ["'rework'", "'scrap'"];
  if (cfg.floatUnsafe || cfg.halfFix) {
    lines.push('  const upper = part.nominal + part.tolerance;\n  const lower = part.nominal - part.tolerance;');
    lines.push(`  if (reading >= upper) { return ${over}; }`);
    lines.push(`  if (reading <= lower) { return ${under}; }`);
    lines.push("  return 'pass';");
  } else if (cfg.floatUpper) {
    lines.push('  const upper = part.nominal + part.tolerance;\n  const lower = um(part.nominal) - um(part.tolerance);');
    lines.push(`  if (reading >= upper) { return ${over}; }`);
    lines.push(`  if (um(reading) <= lower) { return ${under}; }`);
    lines.push("  return 'pass';");
  } else if (cfg.floatLower) {
    lines.push('  const upper = um(part.nominal) + um(part.tolerance);\n  const lower = part.nominal - part.tolerance;');
    lines.push(`  if (um(reading) >= upper) { return ${over}; }`);
    lines.push(`  if (reading <= lower) { return ${under}; }`);
    lines.push("  return 'pass';");
  } else {
    lines.push(`  const r = ${cfg.truncated ? 'Math.floor(reading * 1000 + 0.000001)' : 'um(reading)'};\n  const upper = um(part.nominal) + um(part.tolerance);\n  const lower = um(part.nominal) - um(part.tolerance);`);
    lines.push(`  if (r ${cfg.upperInclusive ? '>' : '>='} upper) { return ${over}; }`);
    lines.push(`  if (r ${cfg.lowerInclusive ? '<' : '<='} lower) { return ${under}; }`);
    lines.push("  return 'pass';");
  }
  lines.push('}\n');
  return lines.join('\n');
}

/** [flag, what the mistake is, in words]. The words are shown to a learner whose tests miss it, so they never give the fix away. */
export const CLASSIFY_MUTANTS = [
  ['upperInclusive', 'a part exactly on its upper limit is accepted'],
  ['lowerInclusive', 'a part exactly on its lower limit is accepted'],
  ['floatUpper', 'the upper limit of some parts is computed with rounding error, so a part on it is accepted'],
  ['floatLower', 'the lower limit of some parts is computed with rounding error, so a part on it is accepted'],
  ['nanUnhandled', 'a NaN reading is not treated as "no reading"'],
  ['undefinedUnhandled', 'an undefined reading is not treated as "no reading"'],
  ['negativeUnhandled', 'a negative reading is judged as a part instead of a sensor fault'],
  ['zeroAllowed', 'a reading of exactly zero is judged as a part instead of a sensor fault'],
  ['hugeUnhandled', 'a reading far too big to be real is judged as a part instead of a sensor fault'],
  ['twiceInclusive', 'a reading of exactly twice the nominal size is called a sensor fault'],
  ['unknownRecheck', 'an unknown part type is answered with a verdict instead of an error'],
  ['readingFirst', 'with no reading, an unknown part type is not reported'],
  ['swapped', 'too big and too small are swapped'],
  ['coerceStrings', 'a number written as text is accepted as a reading'],
];
/** Only the tests of milestone 8 (after the mutation check) are expected to notice these. Milestone 6 does not ask for them. */
export const ROUNDING_MUTANTS = [
  ['truncated', 'a reading with more than three decimals is cut off after the third decimal instead of being rounded to the nearest 0.001'],
];

export function sampleSource(cfg = {}) {
  const table = PLAN.map(([largest, size]) => `[${largest === Infinity ? 'Infinity' : largest}, ${size}]`);
  if (cfg.tableTypo) table[5] = '[150, 21]';
  if (cfg.lastBand) table[9] = '[Infinity, 100]';
  const guard = cfg.noGuard ? '' : cfg.zeroOk ? "  if (typeof lotSize !== 'number' || Number.isNaN(lotSize) || !Number.isInteger(lotSize) || lotSize < 0) { throw new RangeError('bad lot size'); }\n"
    : cfg.nanOk ? "  if (typeof lotSize !== 'number' || lotSize < 2) { throw new RangeError('bad lot size'); }\n"
    : cfg.fractionOk ? "  if (typeof lotSize !== 'number' || Number.isNaN(lotSize) || lotSize < 2) { throw new RangeError('bad lot size'); }\n"
    : cfg.stringOk ? "  lotSize = typeof lotSize === 'string' && lotSize.trim() !== '' ? Number(lotSize) : lotSize;\n  if (typeof lotSize !== 'number' || !Number.isInteger(lotSize) || lotSize < 2) { throw new RangeError('bad lot size'); }\n"
    : "  if (typeof lotSize !== 'number' || !Number.isInteger(lotSize) || lotSize < 2) { throw new RangeError('bad lot size'); }\n";
  return `const PLAN = [\n  ${table.join(',\n  ')},\n];\nexport function sampleSize(lotSize) {\n${guard}  for (const [largest, size] of PLAN) {\n    if (lotSize ${cfg.strictBands ? '<' : '<='} largest) { return size; }\n  }\n}\n`;
}
export const SAMPLE_MUTANTS = [
  ['strictBands', 'a lot exactly at the top of a band is sampled as the next band'],
  ['zeroOk', 'a lot of 0 or 1 is not refused'],
  ['nanOk', 'NaN is not refused'],
  ['fractionOk', 'a fraction of a part is not refused'],
  ['stringOk', 'a number written as text is accepted as a lot size'],
  ['tableTypo', 'one band of the table has the wrong sample size'],
];
