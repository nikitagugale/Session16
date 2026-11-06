# My lab log

*Keep this short. Two lines for each milestone is plenty. This is your own evidence of what you did and what you learned: the facilitator
may ask to see it, and the capstone will ask for the same kind of evidence.*

**Your name:**   **Date:** Friday 6 November 2026

---

## Milestone 1 · Baseline the coverage
- **How I did it** (my brief, or by hand): Asked Claude Code to run `npm run coverage -- --team` and write `docs/baseline.md` from the output and the spec.
- **Hints taken** (none / 1 / 2 / 3, and whether early):
- **Synced?** (yes / no):
- **The gap I rated highest, and why:** The `rework`/`scrap` verdicts (lines 23-26): a wrong answer there scraps good parts or keeps bad ones moving.
- **Noticed** (something that looks wrong, that I did not change): The `null` check is narrower than spec 4.5, which also requires `recheck` for `undefined` and `NaN`.

## Milestone 2 · Enumerate the edge cases
- **How I did it:** Claude Code wrote `docs/edge-cases.md` (29 rows) from the spec, not from the code.
- **Hints taken:**
- **A case I would not have thought of without the specification:** 0.0004 on a shaft is `scrap`, not `recheck`: spec 4.6 checks the raw reading before the 0.001 rounding. Also, `null` with an unknown part throws (4.7 beats 4.5).

## Milestone 3 · Generate tests, triage failures
- **Did I give Claude the specification, the code, or both?** Both. The expected answers came from the spec.
- **A test the AI wrote that was wrong, and how I knew:** None of the 20 tests disagreed with the spec. Claude's triage was wrong, though: it blamed floating point for the spacer upper limit, but `6.35 + 0.07` is exactly `6.42`, so the cause was `<=`. I knew because I ran the numbers in node. (Sleeve upper and spacer lower really are float errors.)
- **Hints taken:**

## Milestone 4 · Reproduce and hypothesize
- **My smallest failing input:** `classifyDefect(25.05, 'shaft')` gives `pass`, the spec says `rework`. The neighbour `25.06` works.
- **My hypothesis, in one sentence:** `reading <= upper` on line 20 of `classifyDefect.js` counts the upper limit as a pass, but spec 4.1 says strictly below.
- **Hints taken:**

## Milestone 5 · Instrument and confirm
- **What I logged, and what I expected to see:** `reading`, `upper`, `lower` and `reading <= upper` in `classifyDefect`, for `(25.05, 'shaft')`. I expected `reading` and `upper` to be the same number and the comparison true. I saw `reading=25.05 upper=25.05 lower=24.95 reading<=upper=true`, and the full-precision version showed the same number for both.
- **Was my hypothesis right, partly right, or wrong?** Right for the shaft and the spacer upper limit (`<=`). Partly right overall: for sleeve 19.08, shim 1.65 and spacer 6.28 the cause is floating-point error, so `<` alone would not fix them. I removed the log before committing.
- **Hints taken:**

## Milestone 6 · Fix the cause, red first
- **Did my regression tests fail before the fix? How did I check?** Yes. I wrote `tests/learner/regression.test.js` first and ran it on the shipped code: 8 of 9 failed (the ninth, 0.0004 is `scrap`, guards a rule the old code already got right). After the fix all 39 tests passed.
- **The half-fix, and the part that exposed it:** Changing `<=` to `<` fixes the shaft, bore and spacer upper limit, but the sleeve (19.08), shim (1.65) and spacer lower limit (6.28) still fail. The half-fix fails for them because `19.05 + 0.03` is `19.080000000000002` and `6.35 - 0.07` is `6.279999999999999`, while for the shaft `25 + 0.05` is exactly `25.05`. The real fix compares whole thousandths of a millimetre (spec 4.4).
- **Hints taken:**

## Milestone 7 · Report the coverage delta
- **The one sentence I would say to a delivery lead:** `classifyDefect` went from 70.4% to 100% of lines and 40% to 100% of branches, and the tests now catch a part on a limit being accepted, unmeasured parts being scrapped, and sensor faults being scrapped or reworked. Still open: `parser.js` branches (66.7%), `label.js`, and the fact that tests only check the values we chose.
- **Hints taken:**

## Milestone 8 · Run a mutation spot check
- **A survivor, and what I did about it:** M02 (`1000 -> 1001` in the rounding) survived the first run (18 of 20). Only a big reading near a limit shows it, so I added a bore test at 40.01951 and killed it. M04 (`or -> and` on line 19) is equivalent, because `Number.isFinite` on line 22 already rejects every non-number. I tried 17 odd inputs to break that claim and could not. Final score: 19 of 20.
- **Hints taken:**

## Homework · Milestone 9
- **Time it took:**
- **Anything in the earlier milestones that I would now change?**

---

## In one sentence
What is the difference between a covered line and a tested behaviour, in your own words?
