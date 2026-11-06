// A very small property-based testing helper, so that the lab needs no packages. It is a stand-in for a library such as fast-check.
// A "property" is a claim that must hold for MANY inputs. forAll makes the inputs (the same ones every run), checks the claim for each,
// and when one breaks it, tries to shrink that input to a shorter one that still breaks, so the failure is easy to read.
//
//   import { forAll, gen } from '../lib/property.js';
//   forAll(gen.string('0123456789.- ​'), s => { ...assert something about s... });

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const gen = {
  /** A whole number from min to max, both included. */
  int: (min, max) => r => min + Math.floor(r() * (max - min + 1)),
  /** One of the given values. */
  oneOf: (...values) => r => values[Math.floor(r() * values.length)],
  /** A string of 0 to maxLength characters, each taken from `alphabet`. */
  string: (alphabet, maxLength = 8) => r => {
    const chars = [...alphabet];
    const n = Math.floor(r() * (maxLength + 1));
    return Array.from({ length: n }, () => chars[Math.floor(r() * chars.length)]).join('');
  },
};

function shrink(value, fails) {
  if (typeof value !== 'string') return value;
  let best = value;
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < best.length; i++) {
      const smaller = best.slice(0, i) + best.slice(i + 1);
      if (fails(smaller)) { best = smaller; progress = true; break; }
    }
  }
  return best;
}

/** Runs `property(input)` for `runs` inputs. Throws the first failure, with the (shrunk) input in the message. */
export function forAll(generate, property, { runs = 500, seed = 1 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < runs; i++) {
    const input = generate(r);
    try {
      property(input);
    } catch (error) {
      const fails = candidate => { try { property(candidate); return false; } catch { return true; } };
      const small = shrink(input, fails);
      let detail = '';
      try { property(small); } catch (e) { detail = e.message.split('\n')[0]; }
      const shown = typeof small === 'string' ? JSON.stringify(small) : String(small);
      throw new Error(`property failed after ${i + 1} input(s). Smallest failing input: ${shown}${detail ? `. ${detail}` : ''}`);
    }
  }
}
