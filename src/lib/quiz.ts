import type { FormId, Verb, VerbClass } from './conjugation';
import { FORMS } from './conjugation';
import { VERBS } from '../data/verbs';

export interface Question {
  verb: Verb;
  formId: FormId;
}

export function availableFormIds(categories: Set<string>): FormId[] {
  return FORMS.filter((f) => categories.has(f.category)).map((f) => f.id);
}

export function availableVerbs(classes: Set<VerbClass>, verbLimit?: number | null): Verb[] {
  const pool = verbLimit ? VERBS.slice(0, verbLimit) : VERBS;
  return pool.filter((v) => classes.has(v.class));
}

export function pickQuestion(
  classes: Set<VerbClass>,
  categories: Set<string>,
  verbLimit?: number | null,
  avoid?: Question | null
): Question | null {
  const verbs = availableVerbs(classes, verbLimit);
  const formIds = availableFormIds(categories);
  if (verbs.length === 0 || formIds.length === 0) return null;

  let next: Question;
  let attempts = 0;
  do {
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const formId = formIds[Math.floor(Math.random() * formIds.length)];
    next = { verb, formId };
    attempts++;
  } while (
    avoid &&
    next.verb.id === avoid.verb.id &&
    next.formId === avoid.formId &&
    attempts < 20 &&
    verbs.length * formIds.length > 1
  );

  return next;
}
