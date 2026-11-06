// Milestone 5: log evidence for the hypothesis, written down, with no debugging left in the code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commitsTouching, dirtyWork, editedFixtures, exists, isRepoReady, oracle, read, section, walk, rel } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/investigation.md';
const doc = () => { assert.ok(exists(FILE), `${FILE} is missing. Do milestone 4 first (or run npm run checkpoint -- 4).`); return read(FILE); };

/** The calls written in the Reproduce section. */
function reproCalls(text) {
  return [...(section(text, /reproduc/i) ?? '').matchAll(/classifyDefect\(\s*([^,()]+?)\s*,\s*['"`]?([A-Za-z]+)['"`]?\s*\)/g)].map(m => ({ reading: m[1].trim(), part: m[2] }));
}
const numbersIn = block => [...block.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)].map(m => m[0]);

test('docs/investigation.md has an Evidence section with the real output of a log', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const text = doc();
  const ev = section(text, /evidence/i);
  assert.ok(ev, 'there is no "## Evidence" section');
  assert.ok(/```[\s\S]*?```/.test(ev), 'put the real output of your log in a code block under "## Evidence"');
});

test('the log shows the numbers the code compared, for the call that fails', () => {
  const text = doc();
  const ev = section(text, /evidence/i) ?? '';
  const blocks = [...ev.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m => m[1]);
  assert.ok(blocks.length, 'there is no code block under "## Evidence"');
  const calls = reproCalls(text).filter(c => oracle.PARTS[c.part] && !Number.isNaN(Number(c.reading)));
  assert.ok(calls.length, 'the "## Reproduce" section has no call like `classifyDefect(25.05, "shaft")`');
  const first = blocks[0];
  const nums = numbersIn(first);
  const call = calls.find(c => nums.includes(String(Number(c.reading))));
  assert.ok(call, 'the log does not show the reading from your failing call. Print the value the function received');
  const part = oracle.PARTS[call.part];
  assert.ok(/\b(true|false)\b/.test(first), 'the log does not show the result of the comparison (true or false). Print it, so that the log answers the question');
  const known = [part.nominal, part.tolerance, part.nominal + part.tolerance, part.nominal - part.tolerance, Math.abs(Number(call.reading) - part.nominal)].map(String);
  assert.ok(nums.filter(n => n !== String(Number(call.reading))).some(n => known.includes(n)), 'the log shows no limit or tolerance as the code computed it. Print the number your hypothesis is about, in full');
});

test('the note ends its evidence with a verdict: Confirmed, Rejected or Revised', () => {
  const ev = section(doc(), /evidence/i) ?? '';
  assert.ok(/^\W*(Confirmed|Rejected|Revised)\b/m.test(ev), 'add a sentence that starts with Confirmed, Rejected or Revised. Did the log say what you expected?');
  assert.ok(ev.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length >= 12, 'say, in a sentence or two, what the log showed');
});

test('no debugging is left in the code', () => {
  const left = walk('src').filter(f => f.endsWith('.js') && /\bconsole\.\w+\(/.test(readFileSync(rel(f), 'utf8')));
  assert.deepEqual(left, [], 'these files still have console calls. Take the log out before you commit: debugging output on a shop-floor screen helps nobody');
});

test('the evidence is committed, and nothing is left uncommitted', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/investigation.md is not committed yet');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
});
