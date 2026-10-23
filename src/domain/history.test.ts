// @vitest-environment node
import { expect, it } from 'vitest';
import { createHistoryEntry } from './history';
import { createTest, testReducer } from './testReducer';
import type { SessionOptions } from '../types';

const options: SessionOptions = {
  language: 'uk',
  punctuation: false,
  numbers: false,
  mode: { type: 'time', seconds: 15 },
  practice: 'standard',
};
const completedAt = '2026-10-23T16:00:00.000Z';

function finishTest() {
  let test = createTest(['кіт'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'ко', at: 0 });
  test = testReducer(test, { type: 'input', value: 'к', at: 100 });
  test = testReducer(test, { type: 'input', value: 'кіт', at: 200 });
  return testReducer(test, { type: 'tick', at: 15000 });
}

it('stores a completed summary and mistake counts without an input transcript or chart samples', () => {
  const entry = createHistoryEntry(
    finishTest(),
    options,
    'test-1',
    completedAt,
  );
  expect(entry.id).toBe('test-1');
  expect(entry.completedAt).toBe(completedAt);
  expect(entry.options).toEqual(options);
  expect(entry.result).toEqual({
    elapsedMs: 15000,
    wpm: 2,
    rawWpm: 2,
    accuracy: 75,
    consistency: 0,
    errors: 1,
    counts: { correct: 3, incorrect: 1, extra: 0, missed: 0, deleted: 1 },
  });
  expect(entry.result).not.toHaveProperty('samples');
  expect(entry).not.toHaveProperty('events');
  expect(entry).not.toHaveProperty('input');
  expect(entry.mistakes.letters.і).toEqual({ attempts: 2, errors: 1 });
});

it('uses the actual completed mode and snapshots selected options', () => {
  const selected: SessionOptions = {
    ...options,
    mode: { type: 'words', count: 25 },
    practice: 'weak-spots',
  };
  const entry = createHistoryEntry(
    finishTest(),
    selected,
    'test-2',
    completedAt,
  );
  selected.language = 'en';
  selected.numbers = true;
  expect(entry.options).toEqual({ ...options, practice: 'weak-spots' });
});

it('normalizes a supplied completion timestamp to UTC without reading the clock', () => {
  const test = finishTest();
  const before = structuredClone(test);
  const entry = createHistoryEntry(
    test,
    options,
    'test-3',
    '2026-10-23T19:15:00+03:00',
  );
  expect(entry.completedAt).toBe('2026-10-23T16:15:00.000Z');
  expect(
    createHistoryEntry(test, options, 'test-3', '2026-10-23T19:15:00+03:00'),
  ).toEqual(entry);
  expect(test).toEqual(before);
});

it('rejects incomplete tests', () => {
  const test = createTest(['кіт'], { type: 'time', seconds: 15 });
  expect(() =>
    createHistoryEntry(test, options, 'test-4', completedAt),
  ).toThrow(RangeError);
});

it('rejects a missing identity or invalid completion time', () => {
  const test = finishTest();
  expect(() => createHistoryEntry(test, options, '', completedAt)).toThrow(
    RangeError,
  );
  expect(() => createHistoryEntry(test, options, 'test-5', 'invalid')).toThrow(
    RangeError,
  );
});
