// How many parts to inspect from a lot. The plan is in docs/tolerance-spec.md, section 6.

// [largest lot size in the band, parts to inspect]
const PLAN = [
  [8, 2],
  [15, 3],
  [25, 5],
  [50, 8],
  [90, 13],
  [150, 20],
  [280, 32],
  [500, 50],
  [1200, 80],
  [Infinity, 125],
];

export function sampleSize(lotSize) {
  for (const [largest, size] of PLAN) {
    if (lotSize < largest) {
      return size;
    }
  }
}
