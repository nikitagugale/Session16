// The milestones, in one place: the lab runner, `npm run hint`, `npm run progress` and `npm run help` all read this.
// `hintMinutes` are the times (minutes after you start the milestone) when each hint opens. They are a nudge, not a lock.
// `targetMinutes` is the pace to aim for. Milestones 1 to 4 are one block of work, and 5 to 8 are another.
export const MILESTONES = [
  { n: 1, title: 'Baseline the coverage', check: 'the coverage numbers recomputed, the untested branches listed, and each ranked by the risk it hides', hintMinutes: [5, 7, 9], targetMinutes: 10, block: 'A' },
  { n: 2, title: 'Enumerate the edge cases', check: 'a list of edge cases for classifyDefect, made from its signature and the tolerance spec, each with the answer the spec gives', hintMinutes: [6, 9, 11], targetMinutes: 12, block: 'A' },
  { n: 3, title: 'Generate tests, triage failures', check: 'edge-case tests that run, and every failing one judged: a bug in the code, or a wrong test', hintMinutes: [7, 10, 13], targetMinutes: 14, block: 'A' },
  { n: 4, title: 'Reproduce and hypothesize', check: 'one real failure reproduced with the smallest input, and a hypothesis that a log could prove wrong', hintMinutes: [4, 6, 7], targetMinutes: 8, block: 'A' },
  { n: 5, title: 'Instrument and confirm', check: 'a targeted log that confirms or kills the hypothesis, the evidence written down, and no debugging left in the code', hintMinutes: [4, 6, 7], targetMinutes: 8, block: 'B' },
  { n: 6, title: 'Fix the cause, red first', check: 'the cause fixed for every part type, and a regression test that fails on the old code and passes on the new', hintMinutes: [7, 10, 12], targetMinutes: 14, block: 'B' },
  { n: 7, title: 'Report the coverage delta', check: 'before and after numbers, and the specific risks the new tests now guard', hintMinutes: [4, 6, 7], targetMinutes: 8, block: 'B' },
  { n: 8, title: 'Run a mutation spot check', check: 'bugs injected into the code, the number your tests catch, and every survivor explained', hintMinutes: [4, 6, 7], targetMinutes: 8, block: 'B' },
  { n: 9, title: 'Homework: a second function', check: 'sampleSize enumerated, tested, its bug fixed with a regression test, and the delta reported', hintMinutes: [10, 20, 30], targetMinutes: 60, block: 'homework' },
];

export const titleOf = n => MILESTONES.find(m => m.n === Number(n))?.title ?? `Milestone ${n}`;
