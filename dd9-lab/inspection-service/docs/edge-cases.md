# Edge cases for `classifyDefect(reading, partType)`

Expected answers come from `docs/tolerance-spec.md` (section 4), not from what the code does today.
Limits: shaft 24.95 / 25.05, spacer 6.28 / 6.42, sleeve 19.02 / 19.08, bracket 12.6 / 12.8, shim 1.55 / 1.65.

| Case | Input | Expected | Why it matters |
|---|---|---|---|
| exactly on the upper limit | 25.05, shaft | rework | Spec 4.4: a part on a limit is outside, so a `<=` in the wrong place would pass a part that is too big. |
| one step above the upper limit | 25.06, shaft | rework | Clearly too big, and the part can be machined down (4.2). |
| one step below the upper limit | 25.04, shaft | pass | The largest reading that still passes (4.1). |
| exactly on the lower limit | 24.95, shaft | scrap | Spec 4.4 applies to the lower limit as well, so this is the opposite side of the same trap. |
| one step below the lower limit | 24.94, shaft | scrap | Too small and cannot be fixed (4.3). |
| one step above the lower limit | 24.96, shaft | pass | The smallest reading that still passes. |
| dead on nominal | 25, shaft | pass | The ordinary good part, which anchors the other cases. |
| awkward size, exactly on the upper limit | 6.42, spacer | rework | 6.35 + 0.07 is not exactly 6.42 in floating point, so a raw comparison can pass this part. |
| awkward size, exactly on the lower limit | 6.28, spacer | scrap | 6.35 - 0.07 has the same floating-point error, which can pass a part that must be scrapped. |
| awkward size, just inside the upper limit | 6.419, spacer | pass | Shows that rounding to 0.001 does not push good parts out. |
| awkward size, exactly on the upper limit | 19.08, sleeve | rework | A second awkward part (19.05 + 0.03), so one lucky decimal cannot hide a floating-point bug. |
| awkward size, exactly on the lower limit | 12.6, bracket | scrap | 12.7 - 0.1 may not be exactly 12.6 either. |
| rounds up onto the limit | 25.0496, shaft | rework | Spec 4.4 rounds to 0.001 first, so 25.0496 becomes 25.050, which is on the limit. |
| rounds down inside the limit | 25.0494, shaft | pass | This rounds to 25.049, which is inside, so a `rework` here means rounding is missing. |
| rounds down to zero, still a valid reading | 0.0004, shaft | scrap | Spec 4.6 checks the raw reading before rounding, so this is above zero and is not a sensor fault. It is then rounded and found too small. |
| gauge sent nothing: null | null, shaft | recheck | Spec 4.5: nobody should pass or scrap an unmeasured part. |
| gauge sent nothing: undefined | undefined, shaft | recheck | A missing field arrives as `undefined`, not `null`. |
| gauge sent not-a-number | NaN, shaft | recheck | Every comparison with `NaN` is false, so unguarded code would fall through to `scrap`. |
| reading is not a number | "25.00", shaft | recheck | A string that looks like a number is still not a measurement (4.5). |
| zero reading | 0, shaft | recheck | Spec 4.6: a sensor fault, not a verdict. Without the check this becomes `scrap`. |
| negative reading | -1, shaft | recheck | The parser lets a negative through (2.3) and the classifier must reject it (4.6). |
| negative infinity | -Infinity, shaft | recheck | Infinite readings are a sensor fault, and without the check this becomes `scrap`. |
| positive infinity | Infinity, shaft | recheck | Without the check this becomes `rework`, which sends a faulty reading on to be machined. |
| just over twice nominal | 50.01, shaft | recheck | Spec 4.6: more than twice the nominal size is impossible. |
| exactly twice nominal | 50, shaft | rework | Spec 4.6 says exactly twice is possible and is classified under 4.2. |
| exactly twice nominal, small part | 3.2, shim | rework | The twice-nominal boundary also holds for a part with a small nominal. |
| part type does not exist | 25, gasket | throws | Spec 4.7: a wrong part code is a data error (`UnknownPartError`). |
| part type in the wrong case | 25, Shaft | throws | The table keys are exact, so a near-match is still unknown. |
| unknown part and no reading | null, gasket | throws | Spec 4.7 checks the part before the reading, so 4.7 beats 4.5 and the error is not hidden behind `recheck`. |

## Where two sections both apply

- **4.5 / 4.6 against 4.2 / 4.3.** `Infinity` is greater than the upper limit (4.2: rework), but 4.6 says infinite readings are a
  sensor fault. **4.6 wins**, giving `recheck`. The same goes for 50.01 on a shaft.
- **4.5 against 4.7.** `null` with an unknown part type is both "no reading" (recheck) and "unknown part" (throws). **4.7 wins**,
  because it is checked before the reading.
- **4.6 against 4.4.** 0.0004 is zero after rounding, but 4.6 looks at the raw reading, so it is not impossible. It is `scrap`.
