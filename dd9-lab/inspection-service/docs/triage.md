# Triage of failing tests

Run: `node --test tests/learner/*.test.js` fails 10 of 20 tests on the shipped code. All 10 are code bugs, because each test
asserts what `docs/tolerance-spec.md` says.

| Test | Fails today? | Verdict | Evidence |
|---|---|---|---|
| a shaft exactly on its upper limit is reworked | yes | code | spec 4.2 and 4.4: a part on the upper limit is outside, but the code's `<= upper` passes it |
| a spacer exactly on its upper limit is reworked | yes | code | spec 4.2 and 4.4: 6.35 + 0.07 is exactly 6.42, so the code's `<= upper` passes a part on the limit |
| a spacer exactly on its lower limit is scrapped | yes | code | spec 4.4: limits are compared at 0.001 mm, but the code compares raw floats (6.35 - 0.07 is 6.279999999999999) |
| a reading that rounds onto the upper limit is reworked | yes | code | spec 4.4: readings are rounded to 0.001 first, and 25.0496 rounds to the limit, but the code never rounds |
| an undefined reading means recheck | yes | code | spec 4.5: `undefined` means recheck, but the code only checks `=== null` |
| a NaN reading means recheck | yes | code | spec 4.5: `NaN` means recheck, but every comparison with `NaN` is false so the code returns `scrap` |
| a zero reading means recheck | yes | code | spec 4.6: zero or less is a sensor fault, but the code returns `scrap` |
| a negative reading means recheck | yes | code | spec 4.6: same, a negative reading is impossible and the code returns `scrap` |
| an infinite reading means recheck | yes | code | spec 4.6: infinite is a sensor fault, but the code returns `rework` |
| a reading over twice the nominal size means recheck | yes | code | spec 4.6: more than twice nominal is impossible, but the code returns `rework` |
