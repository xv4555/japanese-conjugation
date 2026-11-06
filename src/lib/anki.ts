import { VERBS } from '../data/verbs';
import type { Verb } from './conjugation';
import type { AnkiCard } from './ankiconnect';

export interface ExtractedVerbMatch {
  original: string;
  matched: Verb | null;
}

// Detect which field contains verbs by sampling cards
export function detectVerbField(cards: AnkiCard[]): { fieldName: string; index: number } | null {
  const verbKanaSet = new Set(VERBS.map(v => v.kana));
  const verbKanjiSet = new Set(VERBS.map(v => v.kanji));

  if (cards.length === 0) return null;

  // Sample first card to get field names
  const firstCard = cards[0];
  const fieldNames = Object.keys(firstCard.fields);

  const sampleSize = Math.min(20, cards.length);
  const fieldScores: { fieldName: string; index: number; matches: number }[] = [];

  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i];
    let matches = 0;

    for (let j = 0; j < sampleSize; j++) {
      const card = cards[j];
      const field = stripHtml(card.fields[fieldName] || '').trim();
      if (verbKanaSet.has(field) || verbKanjiSet.has(field)) {
        matches++;
      }
    }

    if (matches > 0) {
      fieldScores.push({ fieldName, index: i, matches });
    }
  }

  if (fieldScores.length === 0) return null;

  // Return the field with the most matches
  fieldScores.sort((a, b) => b.matches - a.matches);
  const best = fieldScores[0];

  return {
    fieldName: best.fieldName,
    index: best.index,
  };
}

// Extract verbs from cards using the detected field
export function extractVerbsFromCards(
  cards: AnkiCard[],
  fieldName: string
): ExtractedVerbMatch[] {
  const verbMap = new Map(VERBS.map(v => [v.kana, v]));
  const kanjiMap = new Map(VERBS.map(v => [v.kanji, v]));

  const results: ExtractedVerbMatch[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const raw = stripHtml(card.fields[fieldName] || '').trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    const matched = verbMap.get(raw) || kanjiMap.get(raw) || null;
    results.push({ original: raw, matched });
  }

  return results;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
