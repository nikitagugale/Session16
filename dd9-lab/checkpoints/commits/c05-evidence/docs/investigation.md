# Investigation: a shaft exactly on its upper limit

## Reproduce

`classifyDefect(25.05, 'shaft')`

- Got: `pass`
- Expected: `rework` (spec 4.2 and 4.4: a part exactly on a limit is outside)

A neighbour that works: `classifyDefect(25.051, 'shaft')` gives `rework`, and `classifyDefect(25.049, 'shaft')` gives `pass`. So the bug starts exactly on the limit and nowhere else.

## Hypothesis

In `src/inspection/classifyDefect.js` the comparison that decides `pass` is `reading <= upper`, so a reading equal to the upper limit is accepted. If I am right, a log of the comparison for 25.05 will print `reading <= upper` as `true` with `upper` equal to 25.05. If it prints `false`, or if `upper` is not 25.05, the hypothesis is wrong.

## Evidence

I added one `console.debug` line before the `pass` test, printing the reading, both limits and the result of the comparison, and ran the reproduction:

```text
[classifyDefect] reading=25.05 upper=25.05 lower=24.95 reading<=upper=true
```

Confirmed for the shaft: `upper` is exactly 25.05 and `reading <= upper` is `true`. I then ran the same log for the shim, reading 1.65:

```text
[classifyDefect] reading=1.65 upper=1.6500000000000001 lower=1.55 reading<=upper=true
```

Revised: changing `<=` to `<` fixes the shaft, but for the shim `upper` is 1.6500000000000001, so `1.65 < upper` is still `true`. There is a second cause: the limit is computed with floating-point error. I removed the logging again.
