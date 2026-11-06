# Investigation: a part exactly on its upper limit

## Reproduce

- Smallest failing call: `classifyDefect(25.05, 'shaft')`
  - Got: `'pass'`
  - Expected: `'rework'` (spec 4.2 and 4.4: a part exactly on a limit is outside)
- Neighbouring call that works: `classifyDefect(25.06, 'shaft')`
  - Got: `'rework'`, which is also what the spec says. The bug starts at the limit itself, one step before this reading.

## Hypothesis

The cause is the comparison on line 20 of `src/inspection/classifyDefect.js`, `reading > lower && reading <= upper`. The `<=` makes the
upper limit part of the passing range, but spec 4.1 says a pass must be strictly below the upper limit. For a shaft, `upper` is
`25 + 0.05`, which is exactly `25.05` in floating point, so the reading equals `upper`, the check is true, and the function returns `'pass'`.

- **If I am right**, a log of `reading`, `upper` and `reading <= upper` on line 20 shows `25.05 25.05 true` for this call. Changing
  `<=` to `<` alone makes this call return `'rework'`.
- **If I am wrong**, the log shows `upper` slightly different from the reading, for example `25.050000000000001`, which would mean
  floating-point error and not the operator. Or, changing `<=` to `<` leaves the answer as `'pass'`.

## Second input, different part

`classifyDefect(40.02, 'bore')` gives `'pass'` and should be `'rework'`. `40 + 0.02` is exactly `40.02`, so it fails for the same reason: the `<=`.

Two other cases look similar but have a different cause, floating point (spec 4.4):
- Spacer lower limit: `6.35 - 0.07` is `6.279999999999999`, not `6.28`, so `6.28 > lower` is true and the part passes instead of being scrapped.
- Sleeve upper limit: `19.05 + 0.03` is `19.080000000000002`, so `19.08` is below `upper` and passes. Changing `<=` to `<` would not fix this.

## Evidence

Instrumented run of `classifyDefect(25.05, 'shaft')`, with a `console.debug` after `lower` is computed:

```
reading=25.05 upper=25.05 lower=24.95 reading<=upper=true
pass
```

The same call with the numbers printed in full (`toFixed(20)`):

```
reading=25.05000000000000071054 upper=25.05000000000000071054 lower=24.94999999999999928946 reading<=upper=true
shaft -> pass
```

Confirmed: `reading` and `upper` are the same number, and `reading <= upper` is true, so the `<=` on line 20 lets a part on the upper limit pass.

Other parts, same log:

```
sleeve 19.08: reading=19.07999999999999829470 upper=19.08000000000000184741 reading<=upper=true  -> pass
shim 1.65:    reading=1.64999999999999991118  upper=1.65000000000000013323  reading<=upper=true  -> pass
spacer 6.42:  reading=6.41999999999999992895  upper=6.41999999999999992895  reading<=upper=true  -> pass
spacer 6.28:  lower=6.27999999999999936051 reading=6.28000000000000024869 reading>lower, so pass
```

The hypothesis holds only partly for other parts. For the shaft and the spacer upper limit, `reading` equals `upper`, so the `<=` is the cause. For the sleeve and shim, `upper` is a hair above the reading, and for the spacer lower limit `lower` is a hair below it, so floating-point error is the cause there, and changing `<=` to `<` would not fix them. Spec 4.4 asks for rounding to 0.001 as well as a strict comparison.
