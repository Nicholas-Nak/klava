// @vitest-environment node
import { expect, it } from 'vitest';
import { createHistoryEntry } from '../domain/history';
import { createTest, testReducer } from '../domain/testReducer';
import { createHistoryStore } from './historyStore';
import { HISTORY_LIMIT, type HistoryStorage } from './historyStorage';

function entry(id: string) {
  let test = createTest(['cat'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'c', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  return createHistoryEntry(
    test,
    {
      language: 'en',
      mode: test.mode,
      practice: 'standard',
      punctuation: false,
      numbers: false,
    },
    id,
    '2026-10-23T16:00:00Z',
  );
}

function memoryStorage(): HistoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

it('saves newest results first and restores them in another store', () => {
  const storage = memoryStorage();
  const store = createHistoryStore(storage);
  store.getState().addEntry(entry('first'));
  store.getState().addEntry(entry('second'));
  expect(store.getState().entries.map(({ id }) => id)).toEqual([
    'second',
    'first',
  ]);
  expect(createHistoryStore(storage).getState().entries).toEqual(
    store.getState().entries,
  );
});

it('keeps the first result when an effect repeats the same test identity', () => {
  const store = createHistoryStore(memoryStorage());
  const first = entry('same');
  store.getState().addEntry(first);
  store.getState().addEntry({ ...first, completedAt: '2026-10-24T12:00:00Z' });
  expect(store.getState().entries).toEqual([first]);
});

it('retains only the most recent results', () => {
  const store = createHistoryStore(memoryStorage());
  for (let i = 0; i < HISTORY_LIMIT + 2; i++)
    store.getState().addEntry(entry(String(i)));
  const saved = store.getState().entries;
  expect(saved).toHaveLength(HISTORY_LIMIT);
  expect(saved[0]?.id).toBe(String(HISTORY_LIMIT + 1));
  expect(saved.at(-1)?.id).toBe('2');
});

it('keeps results in memory when storage is blocked or full', () => {
  for (const storage of [
    undefined,
    {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    },
  ]) {
    const store = createHistoryStore(storage);
    store.getState().addEntry(entry('unsaved'));
    expect(store.getState().entries[0]?.id).toBe('unsaved');
    expect(store.getState().storageAvailable).toBe(false);
  }
});

it('reports recovery when a later storage write succeeds', () => {
  let blocked = true;
  const store = createHistoryStore({
    getItem: () => null,
    setItem: () => {
      if (blocked) throw new Error('quota');
    },
  });
  store.getState().addEntry(entry('first'));
  expect(store.getState().storageAvailable).toBe(false);
  blocked = false;
  store.getState().addEntry(entry('second'));
  expect(store.getState().storageAvailable).toBe(true);
  expect(store.getState().entries).toHaveLength(2);
});

it('preserves a personal record after it leaves recent history and the page reloads', () => {
  const storage = memoryStorage();
  const store = createHistoryStore(storage);
  const best = entry('old-record');
  best.result.wpm = 100;
  store.getState().addEntry(best);
  for (let i = 0; i < HISTORY_LIMIT; i++)
    store.getState().addEntry(entry(String(i)));
  expect(store.getState().entries.some(({ id }) => id === 'old-record')).toBe(
    false,
  );
  expect(store.getState().bests).toEqual([best]);
  expect(createHistoryStore(storage).getState().bests).toEqual([best]);
});

it('does not replace the record date when the same result is repeated', () => {
  const storage = memoryStorage();
  const store = createHistoryStore(storage);
  const first = entry('first');
  const repeated = {
    ...entry('repeated'),
    completedAt: '2026-10-24T16:00:00.000Z',
  };
  store.getState().addEntry(first);
  store.getState().addEntry(repeated);
  expect(store.getState().entries[0]).toEqual(repeated);
  expect(createHistoryStore(storage).getState().bests).toEqual([first]);
});
