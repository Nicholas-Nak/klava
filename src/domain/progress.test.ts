// @vitest-environment node
import { expect, it } from 'vitest';
import type { HistoryEntry } from './history';
import { getDailyProgress } from './progress';

function entry(completedAt: string, wpm: number): HistoryEntry {
  return {
    id: completedAt,
    completedAt,
    options: {
      language: 'uk',
      mode: { type: 'time', seconds: 30 },
      practice: 'standard',
      punctuation: false,
      numbers: false,
    },
    result: {
      wpm,
      rawWpm: wpm,
      accuracy: 100,
      consistency: 90,
      elapsedMs: 30000,
      errors: 0,
      counts: { correct: 100, incorrect: 0, extra: 0, missed: 0, deleted: 0 },
    },
    mistakes: { letters: {}, bigrams: {}, words: {} },
  };
}

it('averages completed tests and retains the daily best', () => {
  const days = getDailyProgress(
    [
      entry('2026-10-23T10:00:00Z', 40),
      entry('2026-10-23T12:00:00Z', 61),
      entry('2026-10-23T14:00:00Z', 60),
    ],
    'UTC',
  );
  expect(days).toEqual([
    {
      day: '2026-10-23',
      timestamp: Date.UTC(2026, 9, 23),
      averageWpm: 53.7,
      bestWpm: 61,
      tests: 3,
    },
  ]);
});

it('uses the supplied local timezone at midnight', () => {
  const entries = [entry('2026-10-23T21:30:00Z', 50)];
  expect(getDailyProgress(entries, 'Europe/Kyiv')[0]?.day).toBe('2026-10-24');
  expect(getDailyProgress(entries, 'UTC')[0]?.day).toBe('2026-10-23');
  expect(
    getDailyProgress([entry('2026-10-23T02:30:00Z', 50)], 'America/New_York')[0]
      ?.day,
  ).toBe('2026-10-22');
});

it('groups both occurrences of an hour during the daylight-saving transition', () => {
  const days = getDailyProgress(
    [entry('2026-10-25T00:30:00Z', 40), entry('2026-10-25T01:30:00Z', 60)],
    'Europe/Kyiv',
  );
  expect(days).toHaveLength(1);
  expect(days[0]).toMatchObject({
    day: '2026-10-25',
    tests: 2,
    averageWpm: 50,
  });
});

it('sorts days and preserves calendar gaps without inventing zero-speed tests', () => {
  const entries = [
    entry('2026-10-24T12:00:00Z', 70),
    entry('2026-10-21T12:00:00Z', 0),
  ];
  const before = structuredClone(entries);
  const days = getDailyProgress(entries, 'UTC');
  expect(days.map(({ day }) => day)).toEqual(['2026-10-21', '2026-10-24']);
  expect(days[1]!.timestamp - days[0]!.timestamp).toBe(3 * 86400000);
  expect(days[0]?.averageWpm).toBe(0);
  expect(entries).toEqual(before);
  expect(getDailyProgress([], 'UTC')).toEqual([]);
});
