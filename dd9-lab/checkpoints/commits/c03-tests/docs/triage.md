# Triage: the tests that fail on the code as shipped

I wrote the tests from `docs/tolerance-spec.md`. Nine of them fail today, and I read the specification for each one before deciding.
(One test Claude proposed, "a shaft exactly on its upper limit passes", agreed with the code and disagreed with section 4.4, so I corrected it.)

| Test | Fails today? | Verdict | Evidence |
|---|---|---|---|
| a shaft exactly on its upper limit is reworked | yes | code | spec 4.2 and 4.4: at or above the upper limit is rework; the code accepts a part on the limit |
| every part exactly on its upper limit is reworked | yes | code | spec 4.4 says this holds for every part, whatever its decimals; the sleeve and the shim fail too |
| every part exactly on its lower limit is scrapped | yes | code | spec 4.3 and 4.4; the spacer on its lower limit is accepted |
| a NaN reading asks for a recheck | yes | code | spec 4.5: NaN is "no reading"; the code scraps it |
| an undefined reading asks for a recheck | yes | code | spec 4.5 |
| a negative reading is a sensor fault, so recheck | yes | code | spec 4.6: zero or less is a sensor fault |
| a reading of zero is a sensor fault, so recheck | yes | code | spec 4.6 |
| a reading of more than twice the nominal size is a sensor fault, so recheck | yes | code | spec 4.6: more than twice the nominal size |
| a number written as text is not a reading, so recheck | yes | code | spec 4.5: anything that is not a number |
