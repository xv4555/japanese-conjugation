// AnkiConnect API client
// AnkiConnect is an Anki add-on that provides a local REST API
// Install from: https://github.com/FooBarQux/AnkiConnect

const ANKICONNECT_URL = 'http://localhost:8765';

interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: Record<string, unknown>;
}

interface AnkiConnectResponse<T> {
  result: T;
  error: string | null;
}

async function invoke<T>(action: string, params?: Record<string, unknown>): Promise<T> {
  const request: AnkiConnectRequest = {
    action,
    version: 6,
    params: params || {},
  };

  try {
    const response = await fetch(ANKICONNECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnkiConnectResponse<T> = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[AnkiConnect] ${action} failed:`, errMsg);
    throw new Error(errMsg);
  }
}

export async function checkAnkiConnect(): Promise<boolean> {
  try {
    const version = await invoke<number>('version');
    console.log('[AnkiConnect] Connected! Version:', version);
    return version >= 6;
  } catch (err) {
    console.error('[AnkiConnect] Connection failed:', err);
    return false;
  }
}

export async function getDeckNames(): Promise<string[]> {
  return invoke<string[]>('deckNames');
}

export interface AnkiCard {
  id: number;
  fields: Record<string, string>;
  noteId: number;
}

export async function getCardsInDeck(deckName: string): Promise<AnkiCard[]> {
  const cardIds = await invoke<number[]>('findCards', { query: `deck:"${deckName}"` });

  if (cardIds.length === 0) {
    return [];
  }

  const cardInfo = await invoke<Array<{
    cardId: number;
    noteId: number;
    fields: Record<string, { value: string }>;
  }>>('cardsInfo', { cards: cardIds });

  return cardInfo.map(card => ({
    id: card.cardId,
    noteId: card.noteId,
    fields: Object.fromEntries(
      Object.entries(card.fields).map(([key, field]) => [key, field.value])
    ),
  }));
}
