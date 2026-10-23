import type { HistoryEntry } from './history';

export interface DailyProgress {
  day: string;
  timestamp: number;
  averageWpm: number;
  bestWpm: number;
  tests: number;
}

export function getDailyProgress(
  entries: readonly HistoryEntry[],
  timeZone: string,
): DailyProgress[] {
  const dateFormat = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const days = new Map<
    string,
    { total: number; best: number; tests: number }
  >();
  for (const entry of entries) {
    const parts = Object.fromEntries(
      dateFormat
        .formatToParts(new Date(entry.completedAt))
        .map(({ type, value }) => [type, value]),
    );
    const day = `${parts.year}-${parts.month}-${parts.day}`;
    const previous = days.get(day);
    days.set(day, {
      total: (previous?.total ?? 0) + entry.result.wpm,
      best: Math.max(previous?.best ?? 0, entry.result.wpm),
      tests: (previous?.tests ?? 0) + 1,
    });
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, stats]) => ({
      day,
      timestamp: Date.parse(`${day}T00:00:00Z`),
      averageWpm: Math.round((stats.total / stats.tests) * 10) / 10,
      bestWpm: stats.best,
      tests: stats.tests,
    }));
}
