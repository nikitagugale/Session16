# Mutation spot check: `classifyDefect.js`

Command: `npm run mutate -- src/inspection/classifyDefect.js`

Score: 19 of 20 killed

| Mutant | Verdict | Why |
|---|---|---|
| M04 line 19 (or -> and) | equivalent | Line 19 (the `typeof` check or `Number.isNaN`) is made redundant by line 22, which starts with `!Number.isFinite(reading)`. `Number.isFinite` does not convert its argument, so it is false for every non-number and for `NaN`, and line 22 returns `recheck` for all of them. I tried `undefined`, `null`, `NaN`, `'25'`, `''`, `{}`, `[]`, `true`, `5n`, a symbol, a function, `new Number(25)`, `0`, `-0`, `25`, `Infinity` and `-Infinity` on both versions and the final answer was the same every time. Line 19 stays because it states spec 4.5 on its own. |

## Killed by a new test

- **M02 line 12 `1000 -> 1001`** survived at first. Rounding to 1/1001 mm instead of 1/1000 mm only shows on a large reading close to a limit, so the
  shaft tests could not see it. The new test `regression: rounding is to exactly 0.001, on a large part too (spec 4.4)` uses
  40.01951 on a bore and kills it.

Team's tests alone were not run for this note.
