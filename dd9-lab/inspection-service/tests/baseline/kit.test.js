// The lab's own sanity tests: the documents and the helpers are what the cards say they are. Lab fixture: please do not edit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PARTS } from '../../src/inspection/parts.js';
import { forAll, gen } from '../lib/property.js';

const read = f => readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');

test('kit: the specification has six numbered sections', () => {
  const sections = [...read('docs/tolerance-spec.md').matchAll(/^## (\d+)\. /gm)].map(m => Number(m[1]));
  assert.deepEqual(sections, [1, 2, 3, 4, 5, 6]);
});

test('kit: the part table has seven parts, each with a nominal size and a tolerance', () => {
  assert.equal(Object.keys(PARTS).length, 7);
  for (const part of Object.values(PARTS)) assert.ok(part.nominal > 0 && part.tolerance > 0);
});

test('kit: the property helper makes the same inputs every run', () => {
  const seen = [];
  forAll(gen.int(0, 1000), n => { seen.push(n); }, { runs: 5 });
  const again = [];
  forAll(gen.int(0, 1000), n => { again.push(n); }, { runs: 5 });
  assert.deepEqual(seen, again);
});

test('kit: the property helper reports a failing input and makes it smaller', () => {
  assert.throws(
    () => forAll(gen.string('ab-', 8), s => { if (s.includes('-')) throw new Error('has a dash'); }),
    /Smallest failing input: "-"/,
  );
});
