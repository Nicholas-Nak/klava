// @vitest-environment node
import { expect, it } from 'vitest';
import { createHistoryEntry } from '../domain/history';
import { createTest, testReducer } from '../domain/testReducer';
import {
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  loadHistory,
  parseHistory,
  saveHistory,
  type HistoryStorage,
} from './historyStorage';

function entry(id = 'test-1') {
  let test = createTest(['кіт'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'ко', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  return createHistoryEntry(
    test,
    {
      language: 'uk',
      numbers: false,
      punctuation: false,
      mode: test.mode,
      practice: 'standard',
    },
    id,
    '2026-10-23T16:00:00.000Z',
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

it('round-trips a completed result and mistake profile', () => {
  const storage = memoryStorage();
  const saved = entry();
  expect(saveHistory(storage, [saved])).toBe(true);
  expect(loadHistory(storage)).toEqual({
    entries: [saved],
    bests: [saved],
    storageAvailable: true,
  });
  expect(storage.getItem(HISTORY_STORAGE_KEY)).toBeTruthy();
});

it('ignores invalid records while keeping valid neighbours', () => {
  const valid = entry();
  const invalid = [
    null,
    { ...entry('bad-speed'), result: { ...valid.result, wpm: Infinity } },
    {
      ...entry('bad-mode'),
      options: { ...valid.options, mode: { type: 'time', seconds: 99 } },
    },
    {
      ...entry('bad-language'),
      options: { ...valid.options, language: 'unknown' },
    },
    {
      ...entry('bad-counts'),
      result: {
        ...valid.result,
        counts: { ...valid.result.counts, deleted: -1 },
      },
    },
    {
      ...entry('bad-profile'),
      mistakes: {
        ...valid.mistakes,
        letters: { і: { attempts: 1, errors: 2 } },
      },
    },
    { ...entry('bad-date'), completedAt: 'invalid' },
  ];
  expect(parseHistory({ version: 1, entries: [...invalid, valid] })).toEqual([
    valid,
  ]);
});

it('rejects unsupported versions and malformed containers', () => {
  for (const value of [
    null,
    [],
    {},
    { version: 2, entries: [entry()] },
    { version: 1, entries: 'invalid' },
  ]) {
    expect(parseHistory(value)).toEqual([]);
  }
});

it('bounds percentages and requires integer attempt counts', () => {
  const valid = entry();
  const records = [
    { ...valid, result: { ...valid.result, accuracy: 101 } },
    { ...valid, result: { ...valid.result, consistency: -1 } },
    {
      ...valid,
      mistakes: {
        ...valid.mistakes,
        letters: { і: { attempts: 1.5, errors: 0 } },
      },
    },
  ];
  expect(parseHistory({ version: 1, entries: records })).toEqual([]);
  expect(
    parseHistory({
      version: 1,
      entries: [{ ...valid, result: { ...valid.result, consistency: null } }],
    }),
  ).toHaveLength(1);
});

it('keeps the first occurrence of an identity and caps restored history', () => {
  const records = Array.from({ length: HISTORY_LIMIT + 3 }, (_, index) =>
    entry(String(index)),
  );
  const restored = parseHistory({
    version: 1,
    entries: [records[0], ...records],
  });
  expect(restored).toHaveLength(HISTORY_LIMIT);
  expect(new Set(restored.map((record) => record.id)).size).toBe(HISTORY_LIMIT);
  expect(restored.at(-1)?.id).toBe(String(HISTORY_LIMIT - 1));
});

it('copies supported data and discards unexpected transcripts and samples', () => {
  const valid = entry();
  const source = {
    ...valid,
    input: 'not retained',
    events: ['not retained'],
    result: { ...valid.result, samples: [1, 2, 3] },
  };
  const restored = parseHistory({ version: 1, entries: [source] })[0];
  expect(restored).toEqual(valid);
  expect(restored?.options).not.toBe(valid.options);
  expect(restored?.mistakes.letters.і).not.toBe(valid.mistakes.letters.і);
  expect(restored).not.toHaveProperty('input');
  expect(restored?.result).not.toHaveProperty('samples');
});

it('recovers from malformed JSON without treating readable storage as blocked', () => {
  const storage = memoryStorage();
  storage.setItem(HISTORY_STORAGE_KEY, '{');
  expect(loadHistory(storage)).toEqual({
    entries: [],
    bests: [],
    storageAvailable: true,
  });
});

it('handles unavailable storage and quota failures without throwing', () => {
  expect(loadHistory(undefined)).toEqual({
    entries: [],
    bests: [],
    storageAvailable: false,
  });
  expect(saveHistory(undefined, [entry()])).toBe(false);
  const blocked: HistoryStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('quota');
    },
  };
  expect(loadHistory(blocked)).toEqual({
    entries: [],
    bests: [],
    storageAvailable: false,
  });
  expect(saveHistory(blocked, [entry()])).toBe(false);
});

it('caps written history as well as restored history', () => {
  const storage = memoryStorage();
  const records = Array.from({ length: HISTORY_LIMIT + 3 }, (_, index) =>
    entry(String(index)),
  );
  saveHistory(storage, records);
  expect(loadHistory(storage).entries).toHaveLength(HISTORY_LIMIT);
});

it('recovers records from older storage without a separate bests field', () => {
  const storage = memoryStorage();
  const saved = entry();
  storage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify({ version: 1, entries: [saved] }),
  );
  expect(loadHistory(storage).bests).toEqual([saved]);
});

it('ignores malformed record snapshots without losing recent history', () => {
  const storage = memoryStorage();
  const saved = entry();
  storage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      entries: [saved],
      bests: [null, { id: 'invalid' }],
    }),
  );
  expect(loadHistory(storage).entries).toEqual([saved]);
  expect(loadHistory(storage).bests).toEqual([saved]);
});
