# DD9 Lab Kit: AI-Assisted Testing & Debugging
**PwC Full-Stack AI track · Fri 6 Nov 2026 · 08:00–11:00 IST**

A made-up factory's shop-floor inspection module decides whether each machined part passes, needs rework, is scrap, or must be
measured again. It ships with a few tests and a lot of untested logic. Over eight milestones you baseline the coverage, list the edge
cases from the specification, generate tests with Claude Code and triage the failures, reproduce and instrument a real bug, fix the
cause (not the symptom), report what the new tests protect, and check that your tests would notice the next bug.

**This is a milestone lab, not a follow-along.** There are no prompts to paste. Each milestone is a ticket with a goal, an interface
contract and success criteria, in `LAB-GUIDE.md`. You decide how to get there, and you work at your own pace. The facilitator checks
in twice, after milestone 4 and after milestone 8, to walk through the steps, the tests and the solutions.

## Setup: at the start of the session (about a minute)

Needs **Node 20 or newer** and **git**. **There is nothing to install from the internet**: the project has no dependencies, so there is
no `npm ci`. Save `dd9-lab-kit.zip` in your home folder, then run this in a terminal on the lab VM:

```bash
cd ~
unzip -q dd9-lab-kit.zip     # or: python3 -m zipfile -e dd9-lab-kit.zip .
cd dd9-lab/inspection-service
npm test                     # should end with: pass 10
npm run setup                # makes the starting commit: "Shipped code as delivered"
npm run doctor               # should end with: Ready.
```

When `npm test` is green, open **only the `inspection-service` folder** in VS Code (File, Open Folder), then open `LAB-GUIDE.md`. Do
not open `dd9-lab` itself. The folders next to `inspection-service` (`hints/`, `checks/`, `checkpoints/`) hold the answers, and Claude
Code reads everything in the folder you open.

Run `npm run setup` **before you change anything**: the starting commit must hold the code and the documents as delivered. (It
refuses if they have been changed.)

If `npm test` does not show `pass 10`, paste the last line of the error into the chat and carry on listening. It gets fixed at the
first break.

**Claude Code is the AI.** There is no API key, no database, no server. Every file in the project is made up: the factory, the parts,
the sizes and the rules.

## What is in the folder you open (`inspection-service/`)

| Path | What it is |
|---|---|
| `LAB-GUIDE.md` | **Your guide:** the nine milestone cards, the commands, the ground rules |
| `LAB-LOG.md` | **Your evidence log.** Two lines for each milestone |
| `docs/tolerance-spec.md` | **The specification:** what the module is supposed to do. The source of truth. Not yours to edit |
| `src/inspection/classifyDefect.js` | **The shipped code:** `classifyDefect(reading, partType)` |
| `src/inspection/parser.js`, `sampling.js` | The gauge-text parser, and the sampling plan (the homework) |
| `src/inspection/parts.js`, `label.js`, `errors.js` | The part table, screen labels, and the two errors |
| `tests/existing/` | The quality team's tests. They record what the team checked. Not yours to edit |
| `tests/learner/` | **Your tests** |
| `tests/lib/property.js` | A tiny property-based testing helper (no packages) |
| `scripts/` | The lab's own runner (`step`, `hint`, `progress`, `checkpoint`, `coverage`, `mutate`). Not yours to edit |
| `CLAUDE.md` | The project's context file. Claude Code reads it automatically |

## Next to it (do not open these in VS Code)

| Folder | What it is |
|---|---|
| `checks/` | The hidden checks for each milestone, and the answer key they compare with |
| `checkpoints/` | The reference solution after each milestone (`npm run checkpoint -- N`) |
| `hints/` | Three hints for each milestone, and the reference briefs |
