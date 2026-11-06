import initSqlJs, { Database } from 'sql.js';
import { VERBS } from '../data/verbs';
import type { Verb } from './conjugation';

let sqlPromise: Promise<any> | null = null;

function getSqlJs() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs();
  }
  return sqlPromise;
}

export interface AnkiDeck {
  id: number;
  name: string;
}

export interface ExtractedVerbMatch {
  original: string;
  matched: Verb | null;
}

export interface ImportResult {
  deckName: string;
  detectedFieldIndex: number | null;
  extractedVerbs: ExtractedVerbMatch[];
  matchedCount: number;
  unmatchedCount: number;
}

// Load and parse Anki database file
export async function loadAnkiDatabase(file: File): Promise<Database> {
  const SQL = await getSqlJs();
  const arrayBuffer = await file.arrayBuffer();
  const filebuffer = new Uint8Array(arrayBuffer);
  return new SQL.Database(filebuffer);
}

// Get all decks from the database
export function getDecksFromDb(db: Database): AnkiDeck[] {
  try {
    const collections = db.exec('SELECT id, decks FROM col');
    if (collections.length === 0) return [];

    const decksJson = collections[0].values[0][1];
    const decks = JSON.parse(decksJson as string);

    return Object.entries(decks).map(([id, deck]: [string, any]) => ({
      id: parseInt(id),
      name: deck.name,
    }));
  } catch (e) {
    console.error('Failed to get decks:', e);
    return [];
  }
}

// Extract cards from a specific deck
export function getCardsFromDeck(db: Database, deckId: number): any[] {
  try {
    // Get cards in this deck
    const result = db.exec(`
      SELECT c.id, c.nid, n.flds, n.mid FROM cards c
      JOIN notes n ON c.nid = n.id
      WHERE c.did = ? OR c.odid = ?
    `, [deckId, deckId]);

    if (result.length === 0) return [];

    return result[0].values.map((row: any) => ({
      id: row[0],
      nid: row[1],
      flds: row[2],
      mid: row[3],
    }));
  } catch (e) {
    console.error('Failed to get cards:', e);
    return [];
  }
}

// Parse note fields (separated by \x1f)
function parseFields(flds: string): string[] {
  return flds.split('\x1f');
}

// Detect which field contains verbs by sampling
export function detectVerbField(cards: any[]): number | null {
  const verbKanaSet = new Set(VERBS.map(v => v.kana));
  const verbKanjiSet = new Set(VERBS.map(v => v.kanji));

  const sampleSize = Math.min(20, cards.length);
  const fieldScores: { fieldIndex: number; matches: number }[] = [];

  for (let fieldIdx = 0; fieldIdx < 10; fieldIdx++) {
    let matches = 0;
    for (let i = 0; i < sampleSize; i++) {
      const fields = parseFields(cards[i].flds);
      if (fieldIdx >= fields.length) break;
      const field = stripHtml(fields[fieldIdx]).trim();
      if (verbKanaSet.has(field) || verbKanjiSet.has(field)) {
        matches++;
      }
    }
    if (matches > 0) {
      fieldScores.push({ fieldIndex: fieldIdx, matches });
    }
  }

  if (fieldScores.length === 0) return null;

  fieldScores.sort((a, b) => b.matches - a.matches);
  return fieldScores[0].fieldIndex;
}

// Extract verbs from cards using detected field
export function extractVerbsFromCards(cards: any[], fieldIndex: number): ExtractedVerbMatch[] {
  const verbMap = new Map(VERBS.map(v => [v.kana, v]));
  const kanjiMap = new Map(VERBS.map(v => [v.kanji, v]));

  const results: ExtractedVerbMatch[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const fields = parseFields(card.flds);
    if (fieldIndex >= fields.length) continue;

    const raw = stripHtml(fields[fieldIndex]).trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    const matched = verbMap.get(raw) || kanjiMap.get(raw) || null;
    results.push({ original: raw, matched });
  }

  return results;
}

// Main import function
export async function importDeckFromFile(
  file: File,
  deckId: number
): Promise<ImportResult> {
  const db = await loadAnkiDatabase(file);
  const cards = getCardsFromDeck(db, deckId);
  const decks = getDecksFromDb(db);
  const deckName = decks.find(d => d.id === deckId)?.name || 'Unknown Deck';

  const fieldIndex = detectVerbField(cards);

  let extractedVerbs: ExtractedVerbMatch[] = [];
  if (fieldIndex !== null) {
    extractedVerbs = extractVerbsFromCards(cards, fieldIndex);
  }

  const matchedCount = extractedVerbs.filter(v => v.matched).length;
  const unmatchedCount = extractedVerbs.length - matchedCount;

  return {
    deckName,
    detectedFieldIndex: fieldIndex,
    extractedVerbs,
    matchedCount,
    unmatchedCount,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
