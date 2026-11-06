# Coverage delta for classifyDefect.js

Before is the team's tests alone (`npm run coverage -- --team`, on the code as shipped). After is all the tests (`npm run coverage`), on the fixed code.

| File | Lines % before | Lines % after | Branches % before | Branches % after |
|---|---|---|---|---|
| classifyDefect.js | 70.4 | 100.0 | 40.0 | 100.0 |

## Risks closed

- A part exactly on a limit being accepted as good: `a shaft exactly on its upper limit is reworked` and `a shaft exactly on its lower limit is scrapped`.
- Rounding error letting parts with awkward sizes through on a limit: `every part exactly on its upper limit is reworked` and `every part exactly on its lower limit is scrapped`.
- A part nobody measured getting a verdict: `a NaN reading asks for a recheck` and `an undefined reading asks for a recheck`.
- A sensor fault being judged as a part: `a negative reading is a sensor fault, so recheck` and `a reading of zero is a sensor fault, so recheck`.

## Still not covered

`parseSensorReading` in `parser.js` has no tests of its own, and it returns NaN or accepts text after the number. `sampleSize` in `sampling.js` is untested. The 100% is for `classifyDefect.js` only, and it does not say the parts table is right.
