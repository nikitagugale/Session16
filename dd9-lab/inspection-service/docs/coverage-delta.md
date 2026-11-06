# Coverage delta

Before: the team's tests on the code as shipped (`docs/baseline.md`). After: all tests on the fixed code (`npm run coverage`).

| File | Lines % before | Lines % after | Branches % before | Branches % after |
|---|---|---|---|---|
| classifyDefect.js | 70.4 | 100.0 | 40.0 | 100.0 |

## Risks closed

- A part exactly on a limit is accepted as good: `regression: a part exactly on its upper limit is reworked, not passed (spec 4.4)`
- A sleeve or shim on its upper limit passes because the computed limit is slightly off, such as 19.080000000000002: `regression: a sleeve on its upper limit is reworked although 19.05 + 0.03 is not exactly 19.08 (half-fix)`
- A good-sized spacer is judged on a wrong lower limit, so a part that must be scrapped passes: `regression: a spacer on its lower limit is scrapped although 6.35 - 0.07 is not exactly 6.28 (half-fix)`
- A new or changed part in the table gets a wrong limit on either side: `regression: every part in the table is outside on each limit and passes one step inside (spec 4.1, 4.4)`
- A reading with a fourth decimal lands on the wrong side of a limit: `regression: readings are rounded to 0.001 before comparing (spec 4.4)`
- A part nobody measured (`undefined`, `NaN`, text) is scrapped: `regression: undefined, NaN and non-numbers mean recheck, not scrap (spec 4.5)`
- A sensor fault (zero, negative, infinite, over twice nominal) is scrapped or sent to rework: `regression: zero, negative, infinite and over-twice-nominal readings mean recheck (spec 4.6)`

## Still not covered

The numbers say nothing about whether the specification itself is right, or whether the gauge text reaches `classifyDefect` as a
number. Branch coverage of `parser.js` is 66.7% and `errors.js` and `label.js` still have lines that never run. `sampleSize` was not
looked at in this work. Each test checks chosen values, so a bug at a value nobody chose can still get through.

## Why branch coverage moved more

Lines 70.4% to 100.0% is a gain of about 30 points, and branches 40.0% to 100.0% is 60. The old code had a few branches per line, such as the two sides
of `&&` and each `if`, and the team's tests took only the pass path through most of them. A line can run while one of its branches never does.

## A risk no coverage number could have shown

Even a test run that covered every line of the old `classifyDefect` could still have missed the sleeve bug. The same lines run for 19.08 and for 19.07, so
coverage looks identical, and only the one value 19.08 shows the floating-point error in `19.05 + 0.03`.
