# Baseline coverage (team's tests only)

Measured with `npm run coverage -- --team`.

| File | Lines % | Branches % |
|---|---|---|
| classifyDefect.js | 70.4 | 40.0 |
| parser.js | 100.0 | 66.7 |

| Untested | Lines | If this is wrong in production | Risk |
|---|---|---|---|
| classifyDefect: the too-big (`rework`) and too-small (`scrap`) verdicts | 23-26 | A fixable part is scrapped, or a part that cannot be fixed is sent to rework, so money is wasted or a bad part keeps moving. | high |
| classifyDefect: no reading (`null`) returns `recheck` | 16-17 | An unmeasured part is passed or scrapped, because nobody measured it (spec 4.5). | high |
| classifyDefect: unknown part type throws `UnknownPartError` | 13-14 | A wrong part code is hidden behind a verdict instead of surfacing as a data error (spec 4.7). | medium |
| label.js: the `UNKNOWN` label and the `summarise` counting loop | 12-13, 18-25 | The shop-floor screen shows the wrong text or count. Nothing else depends on it. | low |

Coverage cannot see: the branches that are missing from the code altogether (for example the spec's 0.001 mm rounding, `NaN` and impossible readings, and a part exactly on a limit), because a tool can only report lines that exist.

Note: the `null` check (lines 16-17) is narrower than spec 4.5, which also requires `recheck` for `undefined`, `NaN` and non-numbers. That gap is in the code, not in the coverage report.
