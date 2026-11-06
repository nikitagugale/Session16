// Makes "mutants": copies of a source file with ONE small deliberate bug each (a < turned into <=, a + into a -, a 'scrap' into a 'rework').
// A stand-in for a mutation tool such as Stryker. If every test still passes against a mutant, the tests did not notice that bug.
// It reads the code with a very small scanner: comments, strings and regular expressions are never changed.

const SWAP = { '<': '<=', '<=': '<', '>': '>=', '>=': '>', '===': '!==', '!==': '===', '==': '!=', '!=': '==', '&&': '||', '||': '&&', '+': '-', '-': '+', '*': '/', '/': '*' };
const WORDS = { pass: 'scrap', rework: 'scrap', scrap: 'rework', recheck: 'pass' };
const THREE = ['===', '!==', '>>>', '<<=', '>>=', '**='];
const TWO = ['<=', '>=', '==', '!=', '&&', '||', '??', '=>', '++', '--', '+=', '-=', '*=', '/=', '**', '<<', '>>', '%='];

export function generateMutants(source) {
  const out = [];
  let i = 0;
  let prev = ''; // the kind of the last real token: 'value' (ends an expression), 'op' or ''
  const line = at => source.slice(0, at).split('\n').length;
  const add = (start, end, to, kind) => out.push({ start, end, from: source.slice(start, end), to, kind, line: line(start) });
  while (i < source.length) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if (c === '/' && source[i + 1] === '*') { const j = source.indexOf('*/', i + 2); i = j < 0 ? source.length : j + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== c) j += source[j] === '\\' ? 2 : 1;
      const text = source.slice(i + 1, j);
      if (c !== '`' && WORDS[text]) add(i + 1, j, WORDS[text], 'outcome');
      i = j + 1; prev = 'value'; continue;
    }
    if (c === '/' && prev !== 'value') { // a regular expression
      let j = i + 1; let inClass = false;
      while (j < source.length && (source[j] !== '/' || inClass)) { if (source[j] === '[') inClass = true; if (source[j] === ']') inClass = false; j += source[j] === '\\' ? 2 : 1; }
      i = j + 1; while (/[a-z]/i.test(source[i] ?? '')) i++; prev = 'value'; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (/[\w$]/.test(source[j] ?? '')) j++;
      const word = source.slice(i, j);
      if (word === 'true') add(i, j, 'false', 'boolean');
      if (word === 'false') add(i, j, 'true', 'boolean');
      prev = /^(return|typeof|in|of|case|throw|new|delete|void|else)$/.test(word) ? 'op' : 'value';
      i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(source[i + 1] ?? ''))) {
      let j = i; while (/[\w.]/.test(source[j] ?? '')) j++;
      const text = source.slice(i, j);
      if (/^\d+$/.test(text) && text.length <= 4) add(i, j, String(Number(text) + 1), 'number');
      prev = 'value'; i = j; continue;
    }
    const op = THREE.find(t => source.startsWith(t, i)) ?? TWO.find(t => source.startsWith(t, i)) ?? c;
    if (SWAP[op] !== undefined) {
      const binary = prev === 'value';
      if (!['+', '-', '*', '/'].includes(op) || binary) add(i, i + op.length, SWAP[op], 'operator');
    }
    prev = (op === ')' || op === ']') ? 'value' : (/^\s$/.test(op) ? prev : 'op');
    i += op.length;
  }
  return out;
}

export function applyMutant(source, m) {
  return source.slice(0, m.start) + m.to + source.slice(m.end);
}
