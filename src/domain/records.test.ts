// @vitest-environment node
import { expect, it } from 'vitest';
import type { HistoryEntry } from './history';
import type { SessionOptions } from '../types';
import { getPersonalBests } from './records';

function entry(
  id: string,
  wpm: number,
  options: Partial<SessionOptions> = {},
  accuracy = 100,
): HistoryEntry {
  return {
    id,
    completedAt: '2026-10-23T16:00:00Z',
    options: {
      language: 'uk',
      mode: { type: 'time', seconds: 30 },
      practice: 'standard',
      punctuation: false,
      numbers: false,
      ...options,
    },
    result: {
      wpm,
      accuracy,
      rawWpm: wpm,
      consistency: 90,
      elapsedMs: 30000,
      errors: 0,
      counts: { correct: 100, incorrect: 0, extra: 0, missed: 0, deleted: 0 },
    },
    mistakes: { letters: {}, bigrams: {}, words: {} },
  };
}

it('keeps the fastest comparable result regardless of input order', () => {
  const fast = entry('fast', 80);
  const slow = entry('slow', 40);
  expect(getPersonalBests([fast, slow])).toEqual([fast]);
  expect(getPersonalBests([slow, fast])).toEqual([fast]);
});

it('prefers greater accuracy when rounded WPM is equal', () => {
  const precise = entry('precise', 60, {}, 99);
  expect(getPersonalBests([entry('other', 60, {}, 85), precise])).toEqual([
    precise,
  ]);
});

it('separates time limits, word counts and termination modes', () => {
  const entries = [
    entry('time-30', 40),
    entry('time-15', 50, { mode: { type: 'time', seconds: 15 } }),
    entry('words-25', 60, { mode: { type: 'words', count: 25 } }),
    entry('words-50', 70, { mode: { type: 'words', count: 50 } }),
  ];
  expect(getPersonalBests(entries)).toHaveLength(4);
});

it('separates languages, punctuation, numbers and adaptive practice', () => {
  const entries = [
    entry('standard', 50),
    entry('english', 50, { language: 'en' }),
    entry('punctuation', 50, { punctuation: true }),
    entry('numbers', 50, { numbers: true }),
    entry('both', 50, { punctuation: true, numbers: true }),
    entry('adaptive', 50, { practice: 'weak-spots' }),
  ];
  expect(getPersonalBests(entries)).toHaveLength(6);
});

it('handles empty history and zero-speed results without mutating entries', () => {
  expect(getPersonalBests([])).toEqual([]);
  const entries = [entry('zero', 0), entry('fast', 70, { language: 'en' })];
  const before = structuredClone(entries);
  expect(getPersonalBests(entries).map(({ id }) => id)).toEqual([
    'fast',
    'zero',
  ]);
  expect(entries).toEqual(before);
});

it('preserves the earliest achievement when speed and accuracy are tied', () => {
  const first = {
    ...entry('first', 60, {}, 95),
    completedAt: '2026-10-20T12:00:00Z',
  };
  const repeated = {
    ...entry('repeated', 60, {}, 95),
    completedAt: '2026-10-23T12:00:00Z',
  };
  expect(getPersonalBests([repeated, first])).toEqual([first]);
  expect(getPersonalBests([first, repeated])).toEqual([first]);
});
