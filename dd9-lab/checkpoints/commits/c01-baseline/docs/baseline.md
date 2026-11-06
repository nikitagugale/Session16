# Coverage baseline: what the quality team's tests run today

Measured with `npm run coverage -- --team` (only the tests in `tests/existing`), before any change.

| File | Lines % | Branches % |
|---|---|---|
| classifyDefect.js | 70.4 | 40.0 |
| parser.js | 100.0 | 66.7 |

70% of the lines of `classifyDefect.js` run, but only 40% of its branches. Every line of `parser.js` runs, and the parser is still unchecked: running a line is not the same as checking it.

| Untested | Lines | If this is wrong in production | Risk |
|---|---|---|---|
| The `'rework'` and `'scrap'` answers for a part outside its tolerance | 23-26 | A bad part is passed on to a customer, or a good part is scrapped, and nobody finds out | high |
| The `'recheck'` answer when the gauge sent nothing (`null`) | 16-17 | A part nobody measured gets a verdict, or the line stops | high |
| The error for a part type that is not in the table | 13-14 | A wrong part code is answered with a verdict, or fails in an unplanned way | medium |
| The screen text for each answer, and the counting helper in `label.js` | 12-13 18-25 | The words on the shop-floor screen are wrong; the verdicts themselves are not affected | low |

Coverage cannot see: the checks the code does not have at all, such as a branch for a NaN or a negative reading, because a missing branch is not a branch that is left uncovered.
