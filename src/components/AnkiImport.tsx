import { useState, useEffect } from 'react';
import type { Verb } from '../lib/conjugation';
import {
  checkAnkiConnect,
  getDeckNames,
  getCardsInDeck,
} from '../lib/ankiconnect';
import {
  detectVerbField,
  extractVerbsFromCards,
  type ExtractedVerbMatch,
} from '../lib/anki';

interface Props {
  onImport: (verbs: Verb[]) => void;
}

export function AnkiImport({ onImport }: Props) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    extractedVerbs: ExtractedVerbMatch[];
    matchedCount: number;
    unmatchedCount: number;
  } | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const available = await checkAnkiConnect();
        setIsAvailable(available);

        if (available) {
          const deckNames = await getDeckNames();
          setDecks(deckNames.filter(name => !name.startsWith('_')));
          if (deckNames.length > 0) {
            setSelectedDeck(deckNames[0]);
          }
          setError(null);
        } else {
          setError('AnkiConnect not found. Make sure Anki is running with the AnkiConnect add-on installed.');
        }
      } catch (err) {
        setError(`Failed to connect to AnkiConnect: ${err instanceof Error ? err.message : String(err)}`);
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  const handleLoadDeck = async () => {
    if (!selectedDeck) return;

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const cards = await getCardsInDeck(selectedDeck);

      if (cards.length === 0) {
        setError('No cards found in this deck');
        return;
      }

      const fieldInfo = detectVerbField(cards);
      if (!fieldInfo) {
        setError('Could not detect verb field in deck cards');
        return;
      }

      const extractedVerbs = extractVerbsFromCards(cards, fieldInfo.fieldName);
      const matchedCount = extractedVerbs.filter(v => v.matched).length;
      const unmatchedCount = extractedVerbs.length - matchedCount;

      setPreview({
        extractedVerbs,
        matchedCount,
        unmatchedCount,
      });
    } catch (err) {
      setError(`Failed to load deck: ${err instanceof Error ? err.message : String(err)}`);
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
    setSelectedDeck(null);
    setPreview(null);
    setError(null);
  };

  if (isChecking) {
    return (
      <section>
        <h3>Import from Anki</h3>
        <div className="anki-import-section">
          <p className="loading-text">Checking for AnkiConnect...</p>
        </div>
      </section>
    );
  }

  if (!isAvailable) {
    return (
      <section>
        <h3>Import from Anki</h3>
        <div className="anki-import-section">
          <div className="error-message">
            AnkiConnect is not running. To use this feature:
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Install the AnkiConnect add-on in Anki</li>
              <li>Restart Anki</li>
              <li>Refresh this page</li>
            </ol>
            <a href="https://github.com/FooBarQux/AnkiConnect" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              AnkiConnect on GitHub →
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3>Import from Anki</h3>

      <div className="anki-import-section">
        {decks.length === 0 ? (
          <div className="error-message">No decks found in Anki</div>
        ) : (
          <>
            <div className="deck-selection">
              <label>
                Select deck:
                <select value={selectedDeck || ''} onChange={(e) => setSelectedDeck(e.target.value)}>
                  <option value="">Choose a deck...</option>
                  {decks.map((deck) => (
                    <option key={deck} value={deck}>
                      {deck}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={handleLoadDeck} disabled={!selectedDeck || isLoading}>
                {isLoading ? 'Loading...' : 'Load deck'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                      <strong>{preview.unmatchedCount}</strong> not found (will be skipped)
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
          </>
        )}
      </div>
    </section>
  );
}
