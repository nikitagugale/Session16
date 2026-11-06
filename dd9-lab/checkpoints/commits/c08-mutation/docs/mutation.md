# Mutation check for classifyDefect.js

Run with `npm run mutate -- src/inspection/classifyDefect.js` on the fixed code.

Score: 19 of 19 killed

No mutants survive now. The first run killed 17 of 19, with two survivors:

| Mutant | Verdict | Why |
|---|---|---|
| M07 line 22 0 -> 1 | needed a test | the test for "zero or less" became "one or less"; a shim reading 0.5 is a real part, far too small, so scrap and not a sensor fault. Added in `tests/learner/small-readings.test.js` |
| M02 line 12 1000 -> 1001 | needed a test | I first called it equivalent, because scaling a limit and a reading by the same ratio seems to change nothing. It does for readings with three decimals, but the gauge text may have four and the spec says to round first: a shim reading of 1.5506 is a pass, and the 1001 version scraps it. Added in `tests/learner/rounding.test.js` |
