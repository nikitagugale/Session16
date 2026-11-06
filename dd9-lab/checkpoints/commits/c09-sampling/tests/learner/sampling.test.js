// Tests for sampleSize, written from docs/tolerance-spec.md section 6.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleSize } from '../../src/inspection/sampling.js';

const BANDS = [[2, 8, 2], [9, 15, 3], [16, 25, 5], [26, 50, 8], [51, 90, 13], [91, 150, 20], [151, 280, 32], [281, 500, 50], [501, 1200, 80], [1201, 5000, 125]];

test('every band starts and ends with the sample size of the plan', () => {
  for (const [first, last, size] of BANDS) {
    assert.equal(sampleSize(first), size, `lot of ${first}`);
    assert.equal(sampleSize(last), size, `lot of ${last}`);
  }
});

test('a lot of 8 is the top of the first band, so 2 parts', () => {
  assert.equal(sampleSize(8), 2);
});

test('a lot of 9 starts the second band, so 3 parts', () => {
  assert.equal(sampleSize(9), 3);
});

test('a lot of 1200 is the top of its band, so 80 parts', () => {
  assert.equal(sampleSize(1200), 80);
});

test('a lot of 1201 gets the largest sample, 125 parts', () => {
  assert.equal(sampleSize(1201), 125);
});

test('a lot of zero or one part is refused with a RangeError', () => {
  assert.throws(() => sampleSize(0), { name: 'RangeError' });
  assert.throws(() => sampleSize(1), { name: 'RangeError' });
});

test('a negative lot is refused with a RangeError', () => {
  assert.throws(() => sampleSize(-10), { name: 'RangeError' });
});

test('a fraction of a part is refused with a RangeError', () => {
  assert.throws(() => sampleSize(10.5), { name: 'RangeError' });
});

test('NaN is refused with a RangeError', () => {
  assert.throws(() => sampleSize(NaN), { name: 'RangeError' });
});

test('a lot size written as text is refused with a RangeError', () => {
  assert.throws(() => sampleSize('10'), { name: 'RangeError' });
});

test('regression: a lot at the top of a band used to be sampled as the next band', () => {
  assert.equal(sampleSize(50), 8);
  assert.equal(sampleSize(150), 20);
});

test('regression: NaN used to give undefined instead of an error', () => {
  assert.throws(() => sampleSize(NaN), RangeError);
});
