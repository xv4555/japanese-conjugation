import { useState } from 'react';
import type { Verb } from '../lib/conjugation';
import {
  loadAnkiDatabase,
  getDecksFromDb,
  getCardsFromDeck,
  detectVerbField,
  extractVerbsFromCards,
  type AnkiDeck,
  type ExtractedVerbMatch,
} from '../lib/anki';

interface Props {
  onImport: (verbs: Verb[]) => void;
}

export function AnkiImport({ onImport }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    extractedVerbs: ExtractedVerbMatch[];
    matchedCount: number;
    unmatchedCount: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setDecks([]);
    setSelectedDeckId(null);
    setPreview(null);

    try {
      const db = await loadAnkiDatabase(file);
      const loadedDecks = getDecksFromDb(db);

      if (loadedDecks.length === 0) {
        setError('No decks found in this Anki database');
        return;
      }

      setDecks(loadedDecks);
      setSelectedDeckId(loadedDecks[0].id);
    } catch (err) {
      setError(`Failed to load Anki database: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeckSelect = async (deckId: number) => {
    setSelectedDeckId(deckId);
    setPreview(null);
    setError(null);
  };

  const handleLoadDeck = async () => {
    if (!selectedDeckId) return;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    try {
      const db = await loadAnkiDatabase(file);
      const cards = getCardsFromDeck(db, selectedDeckId);

      if (cards.length === 0) {
        setError('No cards found in this deck');
        return;
      }

      const fieldIndex = detectVerbField(cards);
      if (fieldIndex === null) {
        setError('Could not detect verb field in deck cards');
        return;
      }

      const extractedVerbs = extractVerbsFromCards(cards, fieldIndex);
      const matchedCount = extractedVerbs.filter(v => v.matched).length;
      const unmatchedCount = extractedVerbs.length - matchedCount;

      setPreview({
        extractedVerbs,
        matchedCount,
        unmatchedCount,
      });
    } catch (err) {
      setError(`Failed to load deck: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!preview) return;

    const verbs = preview.extractedVerbs
      .filter(v => v.matched)
      .map(v => v.matched as Verb);

    if (verbs.length === 0) {
      setError('No verbs could be matched from this deck');
      return;
    }

    onImport(verbs);
    setDecks([]);
    setSelectedDeckId(null);
    setPreview(null);
    (document.querySelector('input[type="file"]') as HTMLInputElement).value = '';
  };

  return (
    <section>
      <h3>Import from Anki deck</h3>

      <div className="anki-import-section">
        <div className="file-input-wrapper">
          <label>
            Select Anki database (collection.anki2):
            <input type="file" accept=".anki2" onChange={handleFileSelect} disabled={isLoading} />
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        {decks.length > 0 && (
          <div className="deck-selection">
            <label>
              Select deck:
              <select value={selectedDeckId || ''} onChange={(e) => handleDeckSelect(parseInt(e.target.value))}>
                <option value="">Choose a deck...</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={handleLoadDeck} disabled={!selectedDeckId || isLoading}>
              {isLoading ? 'Loading...' : 'Load deck'}
            </button>
          </div>
        )}

        {preview && (
          <div className="preview-section">
            <div className="preview-stats">
              <p>
                <strong>Found {preview.extractedVerbs.length} unique verbs</strong>
              </p>
              <p>
                <strong>{preview.matchedCount}</strong> matched to database
              </p>
              {preview.unmatchedCount > 0 && (
                <p>
                  <strong>{preview.unmatchedCount}</strong> not found in database (will be skipped)
                </p>
              )}
            </div>

            {preview.matchedCount > 0 && (
              <button onClick={handleApplyImport} className="apply-btn">
                Apply {preview.matchedCount} verbs
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
