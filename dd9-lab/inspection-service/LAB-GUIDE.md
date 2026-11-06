# DD9 Lab Guide: tests that find real bugs, and a fix you can prove

A made-up factory, Halden Precision, measures every part it machines at a gauge station. The module that decides what to do with a
part (pass it, send it back for rework, scrap it, or measure it again) has a few tests and a lot of untested logic. In this lab you
use AI to find out what is untested that matters, write the edge-case tests, find and fix real bugs with a disciplined debugging loop,
and show that your tests would catch the next bug, not just run the lines.

**There are no prompts to paste in this lab.** Each milestone is a ticket: a goal, what you are given, a contract, and success
criteria. You decide how to get there, with Claude Code (writing your own brief), by hand, or both.

**You work by yourself, at your own pace.** The facilitator does not stop the room after each milestone. They check in twice:
after milestone 4 and after milestone 8. Each time they walk through the steps, the tests and the solutions for the milestones
before it. Until then, you have the cards, the checks, the hints and the chat.

---

## How the lab runs

| Block | Milestones | About how long | Then |
|---|---|---|---|
| **A** | 1, 2, 3, 4 | 45 minutes | The facilitator's first summary (steps, tests, solutions for 1 to 4) |
| **B** | 5, 6, 7, 8 | 39 minutes | The facilitator's second summary (steps, tests, solutions for 5 to 8) |
| Homework | 9 | about an hour | Your own time |

- **Each card has a pace** (for example "aim for 10 minutes") and the times when its hints open. They are a guide. A milestone that
  takes you twice as long is fine, and a slow milestone costs you nothing, because syncing is free (see below).
- **Check yourself.** `npm run step -- N` runs the check for milestone N and tells you which success criteria are not met yet. You
  never need to ask anyone whether you are done: the check says so.
- **Hints.** There are three hints per milestone. The clock for a milestone starts the first time you run `npm run start -- N`,
  `npm run step -- N` or `npm run hint -- N`. Each hint opens a few minutes later. If you run `npm run hint -- N` too early, it
  tells you how long to wait. That is a nudge, not a lock: `npm run hint -- N --now` takes it anyway, and notes that it was early.
  **Try first.** Most of the learning is in the first few minutes of being stuck.
- **Sync.** `npm run checkpoint -- N` replaces your work with the reference solution for milestone N, so that the next milestone
  starts from known-good files. It does this with real git commits, one for each step of the reference. **Your own work is kept**:
  your commits, and anything you had not committed, go onto a branch called `my-work-<time>`. You can sync at any time. If you do,
  try to explain the milestone in one sentence in your log.
- **The reveal.** `npm run hint -- N --reveal` shows the reference brief (a good prompt), the approach and the common mistakes. The
  facilitator opens it at the summaries. Read it earlier if you must, and say so in your log.
- **The chat.** Teaching assistants are watching it. "Stuck on 6, my fix passes for the shaft but the check still says the boundary
  is wrong" gets a better answer than "it's broken".
- **The pulse.** At the two summaries you may be asked to run `npm run progress` and paste its last line (it starts with PULSE).
- **Finished early?** Every card has stretch goals. They are worth doing. Or help a neighbour: explaining a fix is the quickest
  way to find out whether you understand it.

**Some tests are meant to fail.** In milestone 3 you will write tests that fail, because they have found real bugs. `npm test`
shows red from then until milestone 6 fixes the code. That is the lab working, not you breaking something.

---

## Your commands

`npm run help` lists everything. The ones you will use all the time:

| Command | What it does |
|---|---|
| `npm run setup` | Makes the starting commit, "Shipped code as delivered". Do it **once, before you change anything**. |
| `npm test` | Runs every test: the lab's own (`tests/baseline`), the team's (`tests/existing`) and yours (`tests/learner`). |
| `npm test -- --grep shaft` | Runs only the tests whose name contains `shaft`. Handy while you investigate one failure. |
| `npm run coverage` | Which lines and branches do the tests run? `-- --team` measures the team's tests only: that is your **baseline**. |
| `npm run mutate -- <file>` | Puts small bugs into a copy of the file, one at a time, and runs your tests. A bug that survives is one your tests missed. |
| `npm run step -- N` | Checks milestone N (1 to 9). |
| `npm run progress` | Checks every milestone and prints one line to paste in the chat. |
| `npm run hint -- N` | The next hint for milestone N (`--now` early, `--again` to re-read, `--reveal` for the reference). |
| `npm run checkpoint -- N` | Replaces your work with the reference solution for milestone N. Your own work is kept on a branch. |
| `git status --short`, `git add -A`, `git commit -m "..."`, `git log --oneline`, `git diff`, `git show <commit>:<file>` | The git you need. Commit after each document or change that is ready. |

---

## What is yours to change, and what is not

Yours: `tests/learner/`, `docs/` (new files), `src/inspection/classifyDefect.js` (from milestone 6), `src/inspection/sampling.js` (the
homework), and `LAB-LOG.md`.

Not yours: `scripts/` (the lab's runner), `tests/baseline/`, `tests/existing/` (the team's tests: they are the record of what the
team checked), `tests/lib/`, `docs/tolerance-spec.md` (the specification: a spec you edit to fit the code proves nothing),
`src/inspection/parts.js` (the drawings: Quality Engineering owns them), and `package.json`.

## Ground rules

1. **Read the card before you open Claude.** Know what "done" looks like first.
2. **Write your own brief.** The success criteria on the card are your acceptance criteria. A good brief says the context, the
   task, the constraints, how you will know it worked, and how to check (see the template at the end).
3. **Read the spec before you decide a test is wrong.** And read it before you decide the code is wrong. A test the AI wrote is a
   guess about what the code should do; the specification is the answer.
4. **Reproduce first, then guess, then prove.** A hypothesis with no log behind it is a guess with better vocabulary.
5. **A coverage number is a diagnostic, not a goal.** A test that runs a line without checking anything raises the number and
   closes no risk.
6. **Commit after each document or change that is ready.**
7. **Hints are free once they open.** Taking one early is allowed. Taking one without trying first is how you miss the learning.
8. **Every file in this kit is made up.** The factory, the parts, the sizes and the rules are not real.
9. **Commit before you experiment.** Before you let an AI rewrite a file, or try a risky idea, commit what works. Try the idea on a
   branch: `git switch -c try-it`. If it goes wrong, `git switch -` takes you back to the branch you left, with your commit
   intact. To undo one file: `git checkout -- <file>`. To park changes you are not ready to commit: `git stash`, and `git stash pop`
   to bring them back.

## About the checks

There is no API key in this lab: **Claude Code is the AI**. The checks read your documents (the baseline, the edge-case list,
the triage, the investigation, the delta report, the mutation note) and judge what they **say** against hidden facts about the code
and the specification. For code and tests they **run** them: your fix is compared with a hidden answer key on thousands of
readings, and your tests are run against slightly wrong versions of the code, to see whether they notice. Whether your prose is wise
is for the summaries to discuss.

---

## Milestone 1 · Baseline the coverage

**Ticket TEST-901** · aim for **10 minutes** · hints open at **+5, +7, +9**

**Why this matters.** A coverage number tells you which lines no test has ever asked a question of. It does not tell you which of
them matter. Before you write a single test you need the starting number, and a view of which gaps could hurt.

**Your goal.** Measure the team's coverage, list what is untested in `classifyDefect.js`, and rank each gap by the harm it could do
in production.

**You are given.** `npm run coverage -- --team` (the team's tests only), the code in `src/inspection/`, the specification, and Claude Code.

**Interface contract.** Create `docs/baseline.md` with two tables:

```
| File | Lines % | Branches % |
|---|---|---|
| classifyDefect.js | 00.0 | 00.0 |
```

```
| Untested | Lines | If this is wrong in production | Risk |
|---|---|---|---|
| (what the code does there) | 16-17 | (what goes wrong, in a sentence) | high / medium / low |
```

- The first table has a row for `classifyDefect.js` and one for `parser.js`, with the numbers `npm run coverage -- --team` prints.
- The second table has one row for **each block of lines the team's tests never run** in `classifyDefect.js`, and one for the
  cosmetic code in `label.js`. `Lines` copies the line numbers from the coverage output. Put the rows in order: highest risk first.
- Add one line that starts with `Coverage cannot see:` and says one thing the numbers could never show you about this module.
- Commit it.

**Success criteria.**
- **Must:** ☐ both tables exist ☐ the coverage numbers are what the tool prints for the team's tests ☐ every untested block of `classifyDefect.js` has a row with its real line numbers ☐ the risk ratings put the dangerous gaps first and the cosmetic one last ☐ the `Coverage cannot see:` line is there ☐ it is committed ☐ `npm run step -- 1` passes
- **Stretch:** ☐ ask Claude to rank the gaps, then check its top two against the specification. Did it rate anything too low? ☐ the code also has a **missing** branch that no coverage tool can list. Which one did you notice first?

**Where to start.**
- What does each untested block do, in words? What would a wrong answer from it cost the factory?
- Is a wrong "scrap" the same kind of mistake as a wrong "pass"?
- What is the difference between a line being run and a branch being run?

**Verify yourself.** `npm run step -- 1`

---

## Milestone 2 · Enumerate the edge cases

**Ticket TEST-902** · aim for **12 minutes** · hints open at **+6, +9, +11**

**Why this matters.** If you ask an AI to write tests straight away, it writes tests for the cases it, and you, already thought of.
Listing the edge cases first, and checking the list against the specification, is where the bugs start to show.

**Your goal.** List the edge cases for `classifyDefect(reading, partType)`, made from its signature and the tolerance specification,
each with the answer the specification gives. **No tests yet.**

**You are given.** `src/inspection/classifyDefect.js`, `docs/tolerance-spec.md`, and Claude Code.

**Interface contract.** Create `docs/edge-cases.md` with a table:

```
| Case | Input | Expected | Why it matters |
|---|---|---|---|
| exactly on the upper limit | 25.05, shaft | rework | (a sentence) |
```

- At least **14** rows. `Input` is the reading and the part, as `reading, part`. `Expected` is one of `pass`, `rework`, `scrap`,
  `recheck`, or `throws` (for the error).
- Cover these families: **boundary** (exactly on each limit, and a step either side), **no reading** (the ways the gauge can send
  nothing), **impossible reading** (zero, negative, far too big), and a **part type that does not exist**.
- Include at least one boundary for a part with an **awkward size** (look at the part table: do all the limits come out as clean
  decimals?).
- `Expected` comes from **the specification**, not from what the code does today. If the code and the spec disagree, the spec wins.
- Commit it.

**Success criteria.**
- **Must:** ☐ the table exists with 14 rows or more ☐ each family above is covered ☐ the expected answers are what the specification says ☐ at least one awkward-size boundary is in the list ☐ it is committed ☐ `npm run step -- 2` passes
- **Stretch:** ☐ add a column for the **family** of each case ☐ find a case where two sections of the specification both apply, and say which one wins

**Where to start.**
- Which values does a gauge actually produce when something goes wrong? Which ones can a person never see on the screen?
- What does the specification say about a part exactly on a limit? Is that what you would have guessed?
- For each case: if the code got it wrong, would anyone notice?

**Verify yourself.** `npm run step -- 2`

---

## Milestone 3 · Generate tests, triage the failures

**Ticket TEST-903** · aim for **14 minutes** · hints open at **+7, +10, +13**

**Why this matters.** AI-generated tests help only when they come from the specification. A test written from the code asserts
what the code does, bugs included. And when a generated test fails, the lazy answer ("the test must be wrong") is as dangerous as
the lazy answer "the code must be wrong". You check the spec.

**Your goal.** Turn your edge-case list into tests, run them, and judge every failure.

**You are given.** `docs/edge-cases.md`, the specification, the code, `node:test`, and Claude Code.

**Interface contract.**
- Tests go in `tests/learner/`, in files ending in `.test.js`. Use `node:test` and `node:assert/strict`, like the team's tests. At
  least **12** tests. Name each test so that it says the case in words (for example `a shaft exactly on its upper limit is reworked`).
- Write them from **the specification**. They must all agree with it. A test that disagrees with the spec is a wrong test: fix it
  or delete it.
- At least **three** of your tests **fail on the code as shipped**. Those are the bugs you found. Leave them failing and commit them.
- Create `docs/triage.md` with a table:

```
| Test | Fails today? | Verdict | Evidence |
|---|---|---|---|
| a shaft exactly on its upper limit is reworked | yes | code | spec 4.2 and 4.4 say rework |
```

  There is one row for **each test that fails today**. `Verdict` is `code` (the code is wrong) or `test` (the test is wrong).
  `Evidence` names the section of `docs/tolerance-spec.md` that decides it.
- Commit it.

**Success criteria.**
- **Must:** ☐ 12 or more tests, all agreeing with the specification ☐ three or more fail on the shipped code ☐ every failing test has a row in the triage with the right verdict ☐ each verdict cites a section of the specification ☐ it is committed ☐ `npm run step -- 3` passes
- **Stretch:** ☐ ask Claude for tests **without** giving it the specification. Which of its tests encode a bug? ☐ write a property-based test for `parseSensorReading` with `tests/lib/property.js`

**Where to start.**
- If you gave Claude only the code, what would its tests say about a part exactly on a limit?
- A test passes today. Does that mean it is right?
- How would you tell, in one minute, whether a failing test is a code bug or a test bug?

**Verify yourself.** `npm run step -- 3`

---

## Milestone 4 · Reproduce and hypothesize

**Ticket TEST-904** · aim for **8 minutes** · hints open at **+4, +6, +7**

**Why this matters.** Skip the reproduction and you fix the bug you imagined, not the one that is there. A hypothesis only helps
if something could prove it wrong.

**Your goal.** Pick one real failure from milestone 3. Reproduce it with the smallest input, and write a hypothesis you could test.

**You are given.** Your failing tests, the code, and Claude Code.

**Interface contract.** Create `docs/investigation.md`, with these headings:

- `## Reproduce`: the smallest call that goes wrong, written as `classifyDefect(25.05, 'shaft')` (a reading and a part type in
  backticks), the answer the code gives (`Got: ...`) and the answer the specification gives (`Expected: ...`). Then **one
  neighbouring call that works**, so the reader can see where the bug starts.
- `## Hypothesis`: a specific cause, in at least **25 words**. Name the file and the line or the comparison. Then say what you would
  expect to see in a log if you are **right**, and what would show that you are **wrong**.
- Commit it. The code does not change in this milestone.

**Success criteria.**
- **Must:** ☐ the failing call really does give the wrong answer today ☐ the neighbouring call really does give the right one ☐ the hypothesis names the code and a cause ☐ it says what would prove it wrong ☐ it is committed ☐ `npm run step -- 4` passes
- **Stretch:** ☐ find a second input, for a **different part**, that you think fails for the same reason. Does it? ☐ ask Claude for three competing hypotheses, and say which one a log could separate from the others

**Where to start.**
- Which of your failing tests has the smallest input? Can you make it smaller?
- What do the cases that fail have in common, and what do the cases that pass have in common?
- What single number, printed at one place in the function, would tell you whether you are right?

**Verify yourself.** `npm run step -- 4`

---

## Milestone 5 · Instrument and confirm

**Ticket TEST-905** · aim for **8 minutes** · hints open at **+4, +6, +7**

**Why this matters.** A log line is the cheapest experiment there is. It turns "I think" into "I saw". And debugging output left in
the code is how a shop-floor screen ends up printing numbers nobody asked for.

**Your goal.** Add a targeted log, run your reproduction, and write down what the log showed. Then take the log out.

**You are given.** Your investigation note, the code, and Claude Code.

**Interface contract.**
- Add **one** `console.debug` line (or a few) in `classifyDefect` that prints the values your hypothesis is about.
- In `docs/investigation.md` add `## Evidence`: the **real output** of your instrumented run for the failing call, in a code block,
  and then one sentence that starts with `Confirmed`, `Rejected` or `Revised`. A log with the numbers printed in full is evidence.
  A sentence with no log is not.
- **Remove the logging** before you commit. No `console.` call may remain in `src/`.
- Commit the note.

**Success criteria.**
- **Must:** ☐ the evidence block is real output for your failing call, with the numbers the code computed ☐ the verdict sentence is there ☐ no debugging is left in `src/` ☐ it is committed ☐ `npm run step -- 5` passes
- **Stretch:** ☐ run the same log for a **different part** (try the sleeve, the shim and the spacer). Does your hypothesis still hold? ☐ print the numbers with `toFixed(20)`. What do you see?

**Where to start.**
- Which values does your hypothesis make a claim about? Print those, and nothing else.
- Does your log show exactly the number the code compared, or the number you typed in the test?
- What did you expect to see? Is that what you saw?

**Verify yourself.** `npm run step -- 5`

---

## Milestone 6 · Fix the cause, red first

**Ticket TEST-906** · aim for **14 minutes** · hints open at **+7, +10, +12**

**Why this matters.** A fix with no failing test first is not proven, it is a change that happens to make today's symptom go away.
And a fix for one value, or one part, is a patch around the cause, not the cause.

**Your goal.** Fix the cause in `classifyDefect` so that it follows the specification for every part, and prove it with regression tests
that fail on the old code and pass on the new.

**You are given.** The specification, your evidence, your tests, and Claude Code.

**Interface contract.**
- Change `src/inspection/classifyDefect.js` only (and new files in `src/inspection/` if you wish). `classifyDefect(reading, partType)`
  keeps its name and its arguments. `parts.js` is not yours to change.
- It must do what **sections 4.1 to 4.7** of the specification say, for **every** part in the table, and for every reading,
  including one with a fourth decimal (4.4 says how to compare).
- Put your regression tests in `tests/learner/regression.test.js`: at least **three**, each one named after the bug it guards (start the name with `regression:`, as the next milestones expect).
  They must **fail on the code as shipped** and **pass on yours**. Write them first and watch them fail.
- At least one regression test must be for a part that **still fails after a quick fix of the obvious comparison**.
- `npm test` is green, and everything is committed.

**Success criteria.**
- **Must:** ☐ the code follows the specification for every part and every kind of reading ☐ the regression tests fail on the shipped code and pass on yours ☐ one of them catches the half-fix ☐ `npm test` is green ☐ it is committed ☐ `npm run step -- 6` passes
- **Stretch:** ☐ do you know why the half-fix fails for one part and not for another? Say it in one sentence in your log ☐ make the bug impossible to come back: could a test loop over the whole part table?

**Where to start.**
- You fixed the comparison and your shaft test goes green. What would make you suspicious that you are done?
- What does the specification say about comparing sizes? Is a computed `25 + 0.05` always the number `25.05`?
- Which tests would still be red if you had special-cased one value?

**Verify yourself.** `npm test`, then `npm run step -- 6`

---

## Milestone 7 · Report the coverage delta

**Ticket TEST-907** · aim for **8 minutes** · hints open at **+4, +6, +7**

**Why this matters.** "Coverage went up" convinces nobody. "These tests now catch boundary misclassification" answers the risk
question. A credible report names the risk each gain closed, and says what is still open.

**Your goal.** Report the before and after numbers, and tie them to the specific risks your tests now guard.

**You are given.** `npm run coverage`, your tests, and Claude Code.

**Interface contract.** Create `docs/coverage-delta.md`:

```
| File | Lines % before | Lines % after | Branches % before | Branches % after |
|---|---|---|---|---|
| classifyDefect.js | 00.0 | 00.0 | 00.0 | 00.0 |
```

- **Before** is the baseline from milestone 1: the team's tests on the code **as it was shipped**. Copy the numbers from your
  `docs/baseline.md`. (`npm run coverage -- --team` on your fixed code prints different numbers, because the code has changed.)
  **After** is all the tests on your fixed code (`npm run coverage`).
- A section `## Risks closed`: at least **three** bullets. Each bullet names a **risk** in plain words (for example "a part exactly on
  a limit is accepted") and **copies the exact title of one of your tests** that guards it.
- A section `## Still not covered`: at least 15 words on what your tests and numbers do **not** protect.
- Commit it.

**Success criteria.**
- **Must:** ☐ the table has the real numbers ☐ three or more different risks, each tied to a test that exists ☐ the honest limit is there ☐ it is committed ☐ `npm run step -- 7` passes
- **Stretch:** ☐ explain why branch coverage moved more than line coverage, or less ☐ find a risk your tests cover that **no coverage number** could have shown

**Where to start.**
- If someone asked "so what is safer now?", which sentence would you give them?
- Which of your tests would fail if only one limit of one part came back wrong?
- What is still wrong or untested in this module after your fix?

**Verify yourself.** `npm run step -- 7`

---

## Milestone 8 · Run a mutation spot check

**Ticket TEST-908** · aim for **8 minutes** · hints open at **+4, +6, +7**

**Why this matters.** Coverage shows that a line ran. It does not show that a test would notice if the line were wrong. A mutation
check puts small bugs into the code and asks whether any test fails. A bug that survives is a test that only visits the line.

**Your goal.** Run `npm run mutate` on your fixed `classifyDefect.js`, and deal with every mutant that survives.

**You are given.** `npm run mutate -- src/inspection/classifyDefect.js` (add `--list` to see the mutants first), your tests, and Claude Code.

**Interface contract.**
- Run it on your current code. For each **survivor**, either add a test that kills it, or explain why it cannot matter (an
  "equivalent" change).
- Create `docs/mutation.md`: a line `Score: K of N killed` that matches a fresh run, and a table `| Mutant | Verdict | Why |` with one
  row for **each survivor that is left** (for example `M07 line 24 <= -> <`), with `Verdict` of `equivalent` or `needs a test`.
  If none survive, say so in a sentence.
- "Equivalent" means **no input at all** tells the mutant from your code. The check tests that claim: a wrong "equivalent" is red.
- Your tests must kill at least **90%** of the mutants, and every mutant that changes a **limit comparison**.
- Commit your new tests and the note.

**Success criteria.**
- **Must:** ☐ the score in the note matches a fresh run ☐ at least 90% killed ☐ no limit comparison survives ☐ every remaining survivor is explained ☐ it is committed ☐ `npm run step -- 8` passes
- **Stretch:** ☐ one survivor looks as if it cannot matter. Try hard to break that claim before you accept it ☐ run the mutation check on the **team's tests only** (move yours aside). What is the score?

**Where to start.**
- Run `--list` first. Which mutants would a wrong boundary look like?
- For a survivor: write down the input that would make the mutant behave differently from the real code. Does your test use it?
- Is an "equivalent" mutant really equivalent, or have you not found its input yet? What can the gauge send that you have not tried?

**Verify yourself.** `npm run step -- 8`

---

## Homework · Milestone 9 · A second function

**Ticket TEST-909** · about an hour, in your own time · hints open at **+10, +20, +30**

**Why this matters.** One function is an anecdote. Two, done the same way, are a method. This is also where you find out whether your
habits work without the facilitator in the room.

**Your goal.** Do the whole loop on the module's second under-tested function, `sampleSize(lotSize)` in `src/inspection/sampling.js`.

**You are given.** Section 6 of the specification, `sampling.js`, everything from the lab, and Claude Code.

**Interface contract.**
- Enumerate its edge cases from the specification (a short list in `docs/sampling-cases.md` is enough), write tests in
  `tests/learner/sampling.test.js` (at least **6**), and fix the code in `sampling.js` to follow section 6.
- Put at least **two regression tests** in the same file, each with a name that starts with `regression:` and says the bug it guards
  (the check finds them by that word). They must **fail on the code as shipped** and pass on yours. Your tests must notice at least **5 of 6** slightly wrong versions of the function.
- `npm test` is green, and `npm run mutate -- src/inspection/sampling.js` kills at least 85%.
- Commit it as its own commit.

**Success criteria.**
- **Must:** ☐ `sampleSize` follows the specification ☐ the regression tests fail on the shipped code ☐ the tests notice the wrong versions ☐ the mutation score is 85% or better ☐ `npm run step -- 9` passes ☐ `npm run progress` still shows milestones 1 to 8 as done
- **Stretch:** ☐ do the same for `parseSensorReading` with a property-based test (`tests/lib/property.js`) ☐ report the coverage delta for `sampling.js`, with the risk it closed

**Where to start.**
- What did you learn in milestones 2 and 3 that applies directly here?
- How many band edges does the plan have? Do you have a test on each side of every one?
- What should happen for a lot of zero parts, and who decides?

**Verify yourself.** `npm run step -- 9`

---

## Appendix · How to brief an AI coding assistant

This is a template, not a prompt for any milestone. A good brief makes the result checkable.

| Part | Say |
|---|---|
| **Context** | What exists, and what it is for. "This is a Node project; the spec is `docs/tolerance-spec.md`; the code is `src/inspection/classifyDefect.js`." |
| **Task** | One thing to do, in one sentence. |
| **Constraints** | What it must not touch or change. "Write tests from the specification, not from the code. Do not edit `src/`. Do not edit `tests/existing`." |
| **Acceptance** | The observable results that mean "done": file names, test names, what a run prints. |
| **Verify** | The commands that prove it. "Run `npm test` and tell me which tests fail." |

Three habits make a big difference when an AI helps you test: give it **the specification, not only the code**; ask it to **list the
cases before it writes any test**; and **read every failing test against the spec** before you decide who is wrong.
