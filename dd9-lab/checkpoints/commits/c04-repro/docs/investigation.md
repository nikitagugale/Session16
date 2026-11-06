# Investigation: a shaft exactly on its upper limit

## Reproduce

`classifyDefect(25.05, 'shaft')`

- Got: `pass`
- Expected: `rework` (spec 4.2 and 4.4: a part exactly on a limit is outside)

A neighbour that works: `classifyDefect(25.051, 'shaft')` gives `rework`, and `classifyDefect(25.049, 'shaft')` gives `pass`. So the bug starts exactly on the limit and nowhere else.

## Hypothesis

In `src/inspection/classifyDefect.js` the comparison that decides `pass` is `reading <= upper`, so a reading equal to the upper limit is accepted. If I am right, a log of the comparison for 25.05 will print `reading <= upper` as `true` with `upper` equal to 25.05. If it prints `false`, or if `upper` is not 25.05, the hypothesis is wrong.
