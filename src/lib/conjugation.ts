export type VerbClass = 'ichidan' | 'godan' | 'irregular';

export interface Verb {
  id: string;
  kanji: string; // dictionary form as normally written, e.g. "食べる"
  kana: string; // full reading of dictionary form, e.g. "たべる"
  meaning: string;
  class: VerbClass;
  irregularBase?: 'suru' | 'kuru';
  /** overrides for godan verbs with irregular te/ta (e.g. 行く) */
  teTaOverride?: { te: string; ta: string };
  /** overrides for godan verbs with suppletive negatives (e.g. ある) */
  negOverride?: { neg: string; pastNeg: string };
  /** replaces the i-row stem (masu-forms, volitional-polite) for the honorific
   * -aru group (くださる, おっしゃる, etc.), which uses い instead of り */
  iStemOverride?: string;
  /** replaces the whole imperative suffix (e.g. くれる -> くれ, くださる -> ください) */
  imperativeOverride?: string;
}

export type FormId =
  | 'present-plain-neg'
  | 'past-plain-aff'
  | 'past-plain-neg'
  | 'present-polite-aff'
  | 'present-polite-neg'
  | 'past-polite-aff'
  | 'past-polite-neg'
  | 'te'
  | 'potential-plain'
  | 'potential-polite'
  | 'passive'
  | 'causative'
  | 'causative-passive'
  | 'conditional-ba'
  | 'conditional-tara'
  | 'volitional-plain'
  | 'volitional-polite'
  | 'imperative';

export interface FormMeta {
  id: FormId;
  label: string;
  category: string;
}

export const FORMS: FormMeta[] = [
  { id: 'present-plain-neg', label: 'Present Negative (Plain)', category: 'Present / Past — Plain' },
  { id: 'past-plain-aff', label: 'Past Affirmative (Plain)', category: 'Present / Past — Plain' },
  { id: 'past-plain-neg', label: 'Past Negative (Plain)', category: 'Present / Past — Plain' },
  { id: 'present-polite-aff', label: 'Present Affirmative (Polite)', category: 'Present / Past — Polite' },
  { id: 'present-polite-neg', label: 'Present Negative (Polite)', category: 'Present / Past — Polite' },
  { id: 'past-polite-aff', label: 'Past Affirmative (Polite)', category: 'Present / Past — Polite' },
  { id: 'past-polite-neg', label: 'Past Negative (Polite)', category: 'Present / Past — Polite' },
  { id: 'te', label: 'Te-form', category: 'Te-form' },
  { id: 'potential-plain', label: 'Potential (Plain)', category: 'Potential' },
  { id: 'potential-polite', label: 'Potential (Polite)', category: 'Potential' },
  { id: 'passive', label: 'Passive', category: 'Passive' },
  { id: 'causative', label: 'Causative', category: 'Causative' },
  { id: 'causative-passive', label: 'Causative-Passive', category: 'Causative' },
  { id: 'conditional-ba', label: 'Conditional (~ば)', category: 'Conditional' },
  { id: 'conditional-tara', label: 'Conditional (~たら)', category: 'Conditional' },
  { id: 'volitional-plain', label: 'Volitional (Plain)', category: 'Volitional' },
  { id: 'volitional-polite', label: 'Volitional (Polite)', category: 'Volitional' },
  { id: 'imperative', label: 'Imperative', category: 'Imperative' },
];

export const FORM_CATEGORIES = Array.from(new Set(FORMS.map((f) => f.category)));

interface GodanRow {
  u: string;
  a: string;
  i: string;
  e: string;
  o: string;
  te: string;
  ta: string;
}

const GODAN_TABLE: Record<string, GodanRow> = {
  う: { u: 'う', a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' },
  く: { u: 'く', a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  ぐ: { u: 'ぐ', a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  す: { u: 'す', a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  つ: { u: 'つ', a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', ta: 'った' },
  ぬ: { u: 'ぬ', a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  ぶ: { u: 'ぶ', a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  む: { u: 'む', a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  る: { u: 'る', a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
};

const ICHIDAN_SUFFIX: Record<FormId, string> = {
  'present-plain-neg': 'ない',
  'past-plain-aff': 'た',
  'past-plain-neg': 'なかった',
  'present-polite-aff': 'ます',
  'present-polite-neg': 'ません',
  'past-polite-aff': 'ました',
  'past-polite-neg': 'ませんでした',
  te: 'て',
  'potential-plain': 'られる',
  'potential-polite': 'られます',
  passive: 'られる',
  causative: 'させる',
  'causative-passive': 'させられる',
  'conditional-ba': 'れば',
  'conditional-tara': 'たら',
  'volitional-plain': 'よう',
  'volitional-polite': 'ましょう',
  imperative: 'ろ',
};

const SURU_SUFFIX: Record<FormId, string> = {
  'present-plain-neg': 'しない',
  'past-plain-aff': 'した',
  'past-plain-neg': 'しなかった',
  'present-polite-aff': 'します',
  'present-polite-neg': 'しません',
  'past-polite-aff': 'しました',
  'past-polite-neg': 'しませんでした',
  te: 'して',
  'potential-plain': 'できる',
  'potential-polite': 'できます',
  passive: 'される',
  causative: 'させる',
  'causative-passive': 'させられる',
  'conditional-ba': 'すれば',
  'conditional-tara': 'したら',
  'volitional-plain': 'しよう',
  'volitional-polite': 'しましょう',
  imperative: 'しろ',
};

const KURU_FORMS: Record<FormId, { kanji: string; kana: string }> = {
  'present-plain-neg': { kanji: '来ない', kana: 'こない' },
  'past-plain-aff': { kanji: '来た', kana: 'きた' },
  'past-plain-neg': { kanji: '来なかった', kana: 'こなかった' },
  'present-polite-aff': { kanji: '来ます', kana: 'きます' },
  'present-polite-neg': { kanji: '来ません', kana: 'きません' },
  'past-polite-aff': { kanji: '来ました', kana: 'きました' },
  'past-polite-neg': { kanji: '来ませんでした', kana: 'きませんでした' },
  te: { kanji: '来て', kana: 'きて' },
  'potential-plain': { kanji: '来られる', kana: 'こられる' },
  'potential-polite': { kanji: '来られます', kana: 'こられます' },
  passive: { kanji: '来られる', kana: 'こられる' },
  causative: { kanji: '来させる', kana: 'こさせる' },
  'causative-passive': { kanji: '来させられる', kana: 'こさせられる' },
  'conditional-ba': { kanji: '来れば', kana: 'くれば' },
  'conditional-tara': { kanji: '来たら', kana: 'きたら' },
  'volitional-plain': { kanji: '来よう', kana: 'こよう' },
  'volitional-polite': { kanji: '来ましょう', kana: 'きましょう' },
  imperative: { kanji: '来い', kana: 'こい' },
};

export interface Conjugated {
  kanji: string;
  kana: string;
}

function conjugateGodan(verb: Verb, formId: FormId): Conjugated {
  if (verb.negOverride && formId === 'present-plain-neg') {
    return { kanji: verb.negOverride.neg, kana: verb.negOverride.neg };
  }
  if (verb.negOverride && formId === 'past-plain-neg') {
    return { kanji: verb.negOverride.pastNeg, kana: verb.negOverride.pastNeg };
  }

  const ending = verb.kana.slice(-1);
  const row = GODAN_TABLE[ending];
  if (!row) throw new Error(`Unknown godan ending "${ending}" for ${verb.kana}`);

  const kanjiStem = verb.kanji.slice(0, -1);
  const kanaStem = verb.kana.slice(0, -1);

  let te = row.te;
  let ta = row.ta;
  if (verb.teTaOverride) {
    te = verb.teTaOverride.te;
    ta = verb.teTaOverride.ta;
  }
  const iStem = verb.iStemOverride ?? row.i;

  let suffix: string;
  switch (formId) {
    case 'present-plain-neg':
      suffix = row.a + 'ない';
      break;
    case 'past-plain-aff':
      suffix = ta;
      break;
    case 'past-plain-neg':
      suffix = row.a + 'なかった';
      break;
    case 'present-polite-aff':
      suffix = iStem + 'ます';
      break;
    case 'present-polite-neg':
      suffix = iStem + 'ません';
      break;
    case 'past-polite-aff':
      suffix = iStem + 'ました';
      break;
    case 'past-polite-neg':
      suffix = iStem + 'ませんでした';
      break;
    case 'te':
      suffix = te;
      break;
    case 'potential-plain':
      suffix = row.e + 'る';
      break;
    case 'potential-polite':
      suffix = row.e + 'ます';
      break;
    case 'passive':
      suffix = row.a + 'れる';
      break;
    case 'causative':
      suffix = row.a + 'せる';
      break;
    case 'causative-passive':
      suffix = row.a + 'せられる';
      break;
    case 'conditional-ba':
      suffix = row.e + 'ば';
      break;
    case 'conditional-tara':
      suffix = ta + 'ら';
      break;
    case 'volitional-plain':
      suffix = row.o + 'う';
      break;
    case 'volitional-polite':
      suffix = iStem + 'ましょう';
      break;
    case 'imperative':
      suffix = verb.imperativeOverride ?? row.e;
      break;
  }

  return { kanji: kanjiStem + suffix, kana: kanaStem + suffix };
}

function conjugateIchidan(verb: Verb, formId: FormId): Conjugated {
  const kanjiStem = verb.kanji.slice(0, -1);
  const kanaStem = verb.kana.slice(0, -1);
  const suffix = formId === 'imperative' && verb.imperativeOverride !== undefined ? verb.imperativeOverride : ICHIDAN_SUFFIX[formId];
  return { kanji: kanjiStem + suffix, kana: kanaStem + suffix };
}

function conjugateSuru(verb: Verb, formId: FormId): Conjugated {
  const kanjiStem = verb.kanji.slice(0, -2);
  const kanaStem = verb.kana.slice(0, -2);
  const suffix = SURU_SUFFIX[formId];
  return { kanji: kanjiStem + suffix, kana: kanaStem + suffix };
}

function conjugateKuru(formId: FormId): Conjugated {
  return KURU_FORMS[formId];
}

export function conjugate(verb: Verb, formId: FormId): Conjugated {
  if (verb.class === 'ichidan') return conjugateIchidan(verb, formId);
  if (verb.class === 'godan') return conjugateGodan(verb, formId);
  if (verb.irregularBase === 'kuru') return conjugateKuru(formId);
  if (verb.irregularBase === 'suru') return conjugateSuru(verb, formId);
  throw new Error(`Cannot conjugate verb ${verb.id}`);
}
