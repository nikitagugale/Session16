// `npm run help`: every command in this kit, in one screen. The participant handbook explains each of them in depth.
const sections = [
  ['Work with the code', [
    ['npm test', 'Runs every test: the lab\'s own (tests/baseline), the team\'s (tests/existing) and yours (tests/learner).'],
    ['npm test -- --grep shaft', 'Runs only the tests whose name contains the text. Use it to run one test while you investigate.'],
    ['npm run coverage', 'Which lines and branches do the tests run? Add --team for the team\'s tests only (the baseline), or a file name to look at one file.'],
    ['npm run mutate -- <file>', 'Puts small bugs into a copy of the file, one at a time, and runs your tests. A mutant that survives is a bug your tests missed. Add --list to see them first.'],
  ]],
  ['The lab', [
    ['npm run setup', 'Makes the starting commit, "Shipped code as delivered". Do it once, before you change anything.'],
    ['npm run start -- N', 'Starts the clock for milestone N and shows when its hints open. (The first step or hint command starts it for you.)'],
    ['npm run step -- N', 'Checks milestone N (1 to 9). It tells you which success criteria are not met yet.'],
    ['npm run progress', 'Checks every milestone and prints one line to paste in the chat. Takes a few seconds to a minute.'],
    ['npm run hint -- N', 'The next hint for milestone N. Three hints, then --reveal for the reference solution. --now takes one early.'],
    ['npm run checkpoint -- N', 'Replaces your work with the reference solution for milestone N, as real commits. Your own work is kept on a branch called my-work-<time>.'],
    ['npm run doctor', 'Checks Node, git and the kit layout.'],
    ['npm run help', 'This screen.'],
  ]],
  ['Git, which the lab uses all the time', [
    ['git status --short', 'What you have changed and not committed yet.'],
    ['git add -A && git commit -m "..."', 'Save one small step. Commit after each document or change that is ready.'],
    ['git log --oneline', 'The steps so far, newest first. The bottom one is the starting commit.'],
    ['git diff', 'What changed since the last commit. Read it before you commit.'],
    ['git show <commit>:<file>', 'A file as it was at an earlier commit. Milestone 6 uses this to see the old code.'],
  ]],
];

console.log('DD9 lab commands\n');
for (const [title, rows] of sections) {
  console.log(title.toUpperCase());
  for (const [cmd, what] of rows) console.log(`  ${cmd}\n      ${what}`);
  console.log('');
}
console.log('Your guide is LAB-GUIDE.md. Your evidence log is LAB-LOG.md. If a command is a mystery, the handbook has a page on it.');
