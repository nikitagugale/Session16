// `npm run coverage`: which lines and branches do the tests run?
//   npm run coverage                       everything: the team's tests and yours
//   npm run coverage -- --team             only the team's tests in tests/existing (the BASELINE: what the module had before the lab)
//   npm run coverage -- classifyDefect     only the files whose name contains that text
//   npm run coverage -- --json             the same numbers as JSON
// Built on Node's own coverage report. "Uncovered lines" are lines no test ran. A branch is one side of an if.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureCoverage, testFilesIn } from './lib/coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const team = args.includes('--team');
const json = args.includes('--json');
const filters = args.filter(a => !a.startsWith('-')).map(a => a.toLowerCase());

const files = testFilesIn(root, team ? ['existing'] : ['existing', 'learner']);
if (!files.length) { console.error('No test files found.'); process.exit(1); }
const { report, testsPassed, output } = measureCoverage(root, files);
const rows = Object.entries(report).filter(([f]) => !filters.length || filters.some(x => f.toLowerCase().includes(x)));
if (!rows.length) { console.error('No coverage numbers found. The tests may not have run:\n' + output.split('\n').slice(-15).join('\n')); process.exit(1); }

if (json) {
  console.log(JSON.stringify({ tests: team ? 'team' : 'all', passed: testsPassed, files: Object.fromEntries(rows) }, null, 2));
  process.exit(0);
}
console.log(`Coverage by ${team ? "the team's tests only (tests/existing)" : 'all tests (tests/existing and tests/learner)'}${testsPassed ? '' : '   (some tests FAILED; numbers are for the tests that ran)'}`);
console.log('');
console.log('File'.padEnd(34) + 'Lines %'.padStart(9) + 'Branches %'.padStart(12) + '  Never run (line numbers)');
for (const [file, c] of rows) {
  console.log(file.padEnd(34) + c.line.toFixed(1).padStart(9) + c.branch.toFixed(1).padStart(12) + '  ' + (c.uncovered || '-'));
}
console.log('');
console.log('Made with: node --experimental-test-coverage on Node ' + process.version);
