import type { HistoryEntry } from './history';
import type { SessionOptions } from '../types';

function recordKey(options: SessionOptions): string {
  const limit =
    options.mode.type === 'time' ? options.mode.seconds : options.mode.count;
  return [
    options.language,
    options.mode.type,
    limit,
    options.practice,
    options.punctuation,
    options.numbers,
  ].join(':');
}

export function getPersonalBests(
  entries: readonly HistoryEntry[],
): HistoryEntry[] {
  const bests = new Map<string, HistoryEntry>();
  for (const entry of entries) {
    const key = recordKey(entry.options);
    const best = bests.get(key);
    if (
      !best ||
      entry.result.wpm > best.result.wpm ||
      (entry.result.wpm === best.result.wpm &&
        entry.result.accuracy > best.result.accuracy)
    )
      bests.set(key, entry);
  }
  return [...bests.values()].sort((a, b) => b.result.wpm - a.result.wpm);
}
