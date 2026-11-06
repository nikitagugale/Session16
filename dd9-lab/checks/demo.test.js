// The presenter's demo: property-based tests find a silent bug in parseSensorReading, and the parser is fixed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PARSER, commitsTouching, dirtyWork, exists, isRepoReady, load, oracle, rel, runFiles, shippedSource, testFiles, withTree } from '../../../checks/lib/helpers.mjs';

let cache;
const propertyFiles = dir => testFiles(dir, ['learner']).filter(f => /forAll/.test(readFileSync(path.join(dir, f), 'utf8')) && /parseSensorReading/.test(readFileSync(path.join(dir, f), 'utf8')));
async function runs() {
  cache ??= await withTree('WORKING', async dir => {
    const files = propertyFiles(dir);
    for (const f of ['parts.js', 'errors.js']) writeFileSync(path.join(dir, 'src/inspection', f), readFileSync(rel(`src/inspection/${f}`)));
    const original = readFileSync(path.join(dir, PARSER), 'utf8');
    const mine = runFiles(dir, files);
    writeFileSync(path.join(dir, PARSER), shippedSource('parser.js'));
    const shipped = runFiles(dir, files);
    writeFileSync(path.join(dir, PARSER), original);
    const mod = await load(dir, PARSER);
    const corpus = ['25', '25.04', ' 12.5 ', '-0.5', '0012.5', '1234.5678', '', ' ', '12.5mm', '12.5.3', '12,5', '1e3', '+5', 'Infinity', 'NaN', '1,250', '12.5​', '​12.5', '12.', '.5', '--5', '5-', 'abc', '12 5', '12345', '1.23456', null, undefined, 25, {}, [], true];
    const wrong = corpus.filter(x => oracle.outcome(mod.parseSensorReading, x) !== oracle.outcome(oracle.parseRef, x));
    return { files, mine, shipped, wrong };
  });
  return cache;
}

test('a property-based test for parseSensorReading exists in tests/learner', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { files } = await runs();
  assert.ok(files.length, 'no file in tests/learner uses forAll from tests/lib/property.js to test parseSensorReading');
});

test('the property test fails on the parser as shipped (it found the silent bug) and passes on the fixed parser', async () => {
  const { mine, shipped } = await runs();
  assert.ok(shipped.status !== 0, 'the property test passes on the parser as shipped. It should fail: the parser returns NaN and accepts text after the number');
  assert.equal(mine.status, 0, `the property test fails on the fixed parser: ${mine.failed.slice(0, 2).join(' | ')}`);
});

test('the parser throws a ParseError for a malformed reading and parses a valid one, as the specification says', async () => {
  const { wrong } = await runs();
  assert.deepEqual(wrong.slice(0, 4).map(x => JSON.stringify(x) ?? String(x)), [], 'the parser disagrees with section 2 of the specification for these inputs');
});

test('the fix and the test are committed', () => {
  assert.ok(commitsTouching(PARSER).length >= 1, 'no commit has changed parser.js yet');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
});
