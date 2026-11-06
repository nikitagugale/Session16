# inspection-service: notes for Claude Code

A small Node project (plain JavaScript, ES modules, Node 20+, no dependencies): the shop-floor quality-inspection module of a
made-up factory. Read this first. It is the project's context file.

## What the code does
- `src/inspection/classifyDefect.js`: `classifyDefect(reading, partType)` decides what to do with one measured part. It returns a
  string, or throws.
- `src/inspection/parser.js`: `parseSensorReading(raw)` turns the gauge's text into a number of millimetres.
- `src/inspection/sampling.js`: `sampleSize(lotSize)` says how many parts to inspect from a lot.
- `src/inspection/parts.js`: the table of part types (nominal size and tolerance). `label.js` is cosmetic text for a screen.
- Both functions in the first two files are **pure**: no clock, no network, no files.

## The specification
- `docs/tolerance-spec.md` says what the module is supposed to do. It is the source of truth for expected behaviour. If a test, the
  code and the specification disagree, say so and ask which is right. Do not quietly pick one, and do not change the specification
  to match the code.

## The tools (in `scripts/`, run with `npm run ...`)
- `npm test` runs every test. `tests/baseline` is the lab's own, `tests/existing` is the quality team's, `tests/learner` is the user's.
  `npm test -- --grep shaft` runs the tests whose name contains `shaft`.
- `npm run coverage` shows which lines and branches the tests run (`-- --team` for the team's tests only).
- `npm run mutate -- src/inspection/classifyDefect.js` puts small bugs into a copy of a file and runs the tests (`--list` to see them).
- `npm run step -- N` runs the check for milestone N. You may run it to check work. Do **not** run `npm run hint`,
  `npm run checkpoint` or `npm run setup`: they are the user's tools.
- `tests/lib/property.js` is a tiny property-based testing helper (`forAll`, `gen`). It needs no packages.

## Files and contracts
- Do **not** edit `scripts/`, `tests/baseline/`, `tests/existing/`, `tests/lib/`, `docs/tolerance-spec.md`, `src/inspection/parts.js`
  or `package.json` unless the user says to. They are the lab's fixtures and the record of what the team had.
- New tests go in `tests/learner/`, in files ending in `.test.js`. They use `node:test` and `node:assert/strict`.
- Notes and reports go in `docs/`.
- Keep the names, the files and the exports of the functions above: the tests and the lab's checks import them.

## Working here
- Run `npm test` before you say you are done.
- Commit only when the user asks you to. The user's lab guide tells them to commit after each document or change that is ready, so
  expect to be asked often: make one commit for one thing, with a short message that says what it did.
- There is no server and no database. Never start a process that does not exit.
- Everything in this project is made up. There is no real customer data and no API key.
