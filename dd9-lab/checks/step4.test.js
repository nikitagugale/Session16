// Milestone 4: a real failure, reproduced with the smallest input, and a hypothesis that could be proved wrong.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CODE, commitsTouching, editedFixtures, exists, isRepoReady, load, oracle, read, rel, section, shippedSource, withTree, words } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/investigation.md';
let cache;

function parseCalls(text) {
  return [...text.matchAll(/classifyDefect\(\s*([^,()]+?)\s*,\s*['"`]?([A-Za-z]+)['"`]?\s*\)/g)].map(m => {
    const t = m[1].trim();
    const value = /^null$/i.test(t) ? null : /^undefined$/i.test(t) ? undefined : /^nan$/i.test(t) ? NaN : Number(t);
    return { text: m[0], value, part: m[2], ok: /^(null|undefined|nan)$/i.test(t) || (t !== '' && !Number.isNaN(Number(t))) };
  });
}
/** What the shipped code and the correct code say for a call. */
async function judge(calls) {
  return withTree('WORKING', async dir => {
    for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
    writeFileSync(path.join(dir, CODE), shippedSource('classifyDefect.js'));
    const shipped = await load(dir, CODE);
    return calls.map(c => ({ ...c, got: oracle.outcome(shipped.classifyDefect, c.value, c.part).replace(/"/g, ''), want: oracle.outcome(oracle.classifyRef, c.value, c.part).replace(/"/g, '') }));
  });
}
const doc = () => { assert.ok(exists(FILE), `${FILE} is missing. Create it with the headings from the milestone card.`); return read(FILE); };
const answer = (text, label) => new RegExp(`${label}\\W*:?\\**\\s*\`?([A-Za-z]+)`, 'i').exec(text)?.[1]?.toLowerCase() ?? null;

async function reproduction() {
  cache ??= (async () => {
    const text = section(doc(), /reproduc/i) ?? '';
    return { text, calls: await judge(parseCalls(text).filter(c => c.ok)) };
  })();
  return cache;
}

test('docs/investigation.md has a Reproduce section with a call that goes wrong today', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { text, calls } = await reproduction();
  assert.ok(text, 'there is no "## Reproduce" section');
  assert.ok(calls.length >= 2, 'write at least two calls in backticks, like `classifyDefect(25.05, \'shaft\')`: the one that goes wrong, and a neighbour that works');
  assert.ok(calls.some(c => c.got !== c.want), 'none of the calls you wrote gives a wrong answer on the code as shipped. Run your failing test again: which exact input fails?');
});

test('the failing call is as small as it can be: one reading, one part, three decimals at most', async () => {
  const { calls } = await reproduction();
  const failing = calls.find(c => c.got !== c.want);
  assert.ok(failing, 'no call goes wrong yet');
  assert.ok(Object.hasOwn(oracle.PARTS, failing.part), 'the failing call uses a part type that does not exist in the table. Use a real one, so that the reader can run it');
  assert.ok(failing.value === null || failing.value === undefined || Number.isNaN(failing.value) || /^-?\d+(\.\d{1,3})?$/.test(String(failing.value)), 'the failing reading has more than three decimals. Make it smaller: the gauge measures to 0.001');
});

test('a neighbouring call that works is shown, so the reader can see where the bug starts', async () => {
  const { calls } = await reproduction();
  assert.ok(calls.some(c => c.got === c.want), 'add a call next to the failing one that gives the right answer today, for example one thousandth of a millimetre away');
});

test('the Got and Expected lines are what the code and the specification really say', async () => {
  const { text, calls } = await reproduction();
  const failing = calls.find(c => c.got !== c.want);
  assert.ok(failing, 'no call goes wrong yet');
  const got = answer(text, 'Got'), expected = answer(text, 'Expected');
  assert.ok(got && expected, 'add the lines "Got: ..." and "Expected: ..." under the failing call');
  assert.equal(got, failing.got.replace(/^throws.*/, 'throws'), 'the "Got" line is not what the code gives today. Run the call and copy what it prints');
  assert.equal(expected, failing.want.replace(/^throws.*/, 'throws'), 'the "Expected" line is not what the specification says. Which section decides it?');
});

test('the hypothesis names a cause, and says what would prove it wrong', () => {
  const text = section(doc(), /hypothes/i);
  assert.ok(text, 'there is no "## Hypothesis" section');
  assert.ok(words(text) >= 25, `the hypothesis is ${words(text)} words. Say where, what you think happens, and what you expect a log to show (25 words or more)`);
  assert.ok(/classifyDefect|\.js|comparison|function|line \d+/i.test(text), 'name the file, the function or the line you suspect');
  assert.ok(/compar|operator|<=|>=|<|>|boundary|limit|round|float|decimal|precision|epsilon|branch|condition|NaN|null/i.test(text), 'name the cause in words: what does the code do that it should not?');
  assert.ok(/\blog\b|\bprint|console|debug|output|\bshow/i.test(text), 'say what a log line (or a printed value) would show if you are right. Name the value you would print');
  assert.ok(/(if|when)\W+(I\W+am|I'?m|it\W+is|this\W+is|that\W+is|the\W+hypothesis\W+is|my\W+\w+\W+is)\W+(wrong|mistaken|incorrect|false)|wrong if|would be wrong|would (show|mean|tell|prove)[^.]{0,40}\b(wrong|mistaken)|\bdisprov|\brefut|\bfalsif|rule[sd]? out|prove[sd]? (it )?wrong|otherwise|contradict|not the cause|(hypothesis|guess|idea|theory|cause)\W+(is|was|would be)\W+(wrong|false|mistaken|disproved)|if\W+(it|the\W+\w+|upper|lower|reading)\W+(\w+\W+){0,3}(prints?|shows?|logs?|is not|isn't)/i.test(text), 'say what would show that you are WRONG, for example "If I am wrong, the log will show ...". A hypothesis that nothing can contradict is not a hypothesis');
});

test('the note is committed', () => {
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/investigation.md is not committed yet');
});
