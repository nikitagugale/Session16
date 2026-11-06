# Edge cases for classifyDefect(reading, partType)

Made from the signature and `docs/tolerance-spec.md` (section 4). The expected answer is the one the specification gives.

| Case | Input | Expected | Why it matters |
|---|---|---|---|
| exactly on the upper limit | 25.05, shaft | rework | 4.4: a part on a limit is outside; the code uses `<=` |
| exactly on the lower limit | 24.95, shaft | scrap | the other side of 4.4 |
| just inside the upper limit | 25.049, shaft | pass | the step before the boundary must still pass |
| just inside the lower limit | 24.951, shaft | pass | the same on the other side |
| just over the upper limit | 25.051, shaft | rework | the step after the boundary |
| just under the lower limit | 24.949, shaft | scrap | the same on the other side |
| upper limit of a part with an awkward size | 19.08, sleeve | rework | 19.05 + 0.03 is not exactly 19.08 in floating point |
| upper limit of another awkward part | 1.65, shim | rework | 1.6 + 0.05 comes out as 1.6500000000000001 |
| lower limit of an awkward part | 6.28, spacer | scrap | 6.35 - 0.07 comes out as 6.279999999999999 |
| no reading | null, bore | recheck | the gauge dropped out (4.5) |
| not a number | NaN, bore | recheck | a broken calculation upstream (4.5) |
| missing value | undefined, bore | recheck | the field was never set (4.5) |
| zero | 0, bracket | recheck | a sensor fault, not a part of size zero (4.6) |
| negative | -2.5, bracket | recheck | impossible size (4.6) |
| far too big | 50.001, shaft | recheck | more than twice the nominal size (4.6) |
| exactly twice the nominal size | 50, shaft | rework | possible, so classified under 4.2 (4.6) |
| infinite | Infinity, shaft | recheck | a sensor overflow (4.6) |
| a number written as text | '25.04', shaft | recheck | the function takes numbers; text is not a reading (4.5) |
| a part type that does not exist | 25, gizmo | throws | a data error (4.7) |
| unknown part and no reading | null, gizmo | throws | the part type is checked first (4.7) |
