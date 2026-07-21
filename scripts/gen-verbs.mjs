import { readFileSync, writeFileSync } from 'node:fs';
import { toRomaji } from 'wanakana';

const raw = JSON.parse(readFileSync(new URL('../top_verbs.json', import.meta.url)));

// editorial exclusions: fundamentally copula/compositional, doesn't fit a
// standard conjugation-paradigm drill (see conversation notes)
const BLOCKLIST_KANA = new Set(['である', 'でもある']);

const iStemHonorifics = new Set(['くださる', 'なさる', 'いらっしゃる', 'おっしゃる', 'ござる']);

function toId(kana, used) {
  let base = toRomaji(kana).replace(/[^a-z]/gi, '').toLowerCase();
  if (!base) base = 'verb';
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}${n}`;
    n++;
  }
  used.add(id);
  return id;
}

const used = new Set();
const verbs = [];

for (const c of raw) {
  if (BLOCKLIST_KANA.has(c.kana)) continue;

  const entry = {
    id: toId(c.kana, used),
    kanji: c.kanji,
    kana: c.kana,
    meaning: c.meaning,
  };

  if (c.class === 'irregular_suru') {
    entry.class = 'irregular';
    entry.irregularBase = 'suru';
  } else if (c.class === 'irregular_kuru') {
    entry.class = 'irregular';
    entry.irregularBase = 'kuru';
  } else if (c.class === 'ichidan') {
    entry.class = 'ichidan';
    if (c.kana === 'くれる') entry.imperativeOverride = ''; // imperative is the bare stem "くれ", no suffix
  } else {
    entry.class = 'godan';
    if (c.verbTags.includes('v5k-s')) {
      entry.teTaOverride = { te: 'って', ta: 'った' };
    }
    if (c.kana === 'ある') {
      entry.negOverride = { neg: 'ない', pastNeg: 'なかった' };
    }
    if (iStemHonorifics.has(c.kana)) {
      entry.iStemOverride = 'い';
      entry.imperativeOverride = 'い';
    }
  }

  verbs.push(entry);
}

function fmtField(key, value) {
  if (typeof value === 'string') return `${key}: ${JSON.stringify(value)}`;
  if (key === 'teTaOverride' || key === 'negOverride') {
    const inner = Object.entries(value)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    return `${key}: { ${inner} }`;
  }
  return `${key}: ${JSON.stringify(value)}`;
}

const fieldOrder = [
  'id',
  'kanji',
  'kana',
  'meaning',
  'class',
  'irregularBase',
  'teTaOverride',
  'negOverride',
  'iStemOverride',
  'imperativeOverride',
];

const lines = verbs.map((v) => {
  const fields = fieldOrder.filter((k) => v[k] !== undefined).map((k) => fmtField(k, v[k]));
  return `  { ${fields.join(', ')} },`;
});

const out = `import type { Verb } from '../lib/conjugation';

// Generated from JMdict (scriptin/jmdict-simplified) + wordfreq usage
// frequency ranking. See scripts/gen-verbs.mjs.
export const VERBS: Verb[] = [
${lines.join('\n')}
];
`;

writeFileSync(new URL('../src/data/verbs.ts', import.meta.url), out);
console.log(`wrote ${verbs.length} verbs`);
