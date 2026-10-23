import { getPersonalBests } from '../domain/records';
import type { HistoryEntry } from '../domain/history';
import type { MistakeCount, MistakeProfile } from '../domain/mistakes';
import type { SessionOptions, TestMode } from '../types';

export const HISTORY_LIMIT = 200;
export const HISTORY_STORAGE_KEY = 'klava-history';
export type HistoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

type Fields = Record<string, unknown>;
function isObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isSafeInteger(value);
}
function isPercentage(value: unknown): value is number {
  return isNumber(value) && value <= 100;
}
function isMode(value: unknown): value is TestMode {
  if (!isObject(value)) return false;
  return value.type === 'time'
    ? typeof value.seconds === 'number' &&
        [15, 30, 60, 120].includes(value.seconds)
    : value.type === 'words' &&
        typeof value.count === 'number' &&
        [10, 25, 50, 100].includes(value.count);
}
function isOptions(value: unknown): value is SessionOptions {
  return (
    isObject(value) &&
    (value.language === 'uk' || value.language === 'en') &&
    typeof value.punctuation === 'boolean' &&
    typeof value.numbers === 'boolean' &&
    (value.practice === 'standard' || value.practice === 'weak-spots') &&
    isMode(value.mode)
  );
}
function isCount(value: unknown): value is MistakeCount {
  return (
    isObject(value) &&
    isInteger(value.attempts) &&
    isInteger(value.errors) &&
    value.errors <= value.attempts
  );
}
function isProfile(value: unknown): value is MistakeProfile {
  return (
    isObject(value) &&
    ['letters', 'bigrams', 'words'].every((category) => {
      const counts = value[category];
      return (
        isObject(counts) &&
        Object.entries(counts).every(
          ([key, count]) =>
            key.length > 0 && key.length <= 80 && isCount(count),
        )
      );
    })
  );
}
function isEntry(value: unknown): value is HistoryEntry {
  if (
    !isObject(value) ||
    typeof value.id !== 'string' ||
    !value.id ||
    value.id.length > 100 ||
    typeof value.completedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.completedAt)) ||
    !isOptions(value.options) ||
    !isProfile(value.mistakes) ||
    !isObject(value.result)
  )
    return false;
  const result = value.result;
  const counts = result.counts;
  return (
    ['elapsedMs', 'wpm', 'rawWpm', 'errors'].every((key) =>
      isNumber(result[key]),
    ) &&
    isPercentage(result.accuracy) &&
    (result.consistency === null || isPercentage(result.consistency)) &&
    isObject(counts) &&
    ['correct', 'incorrect', 'extra', 'missed', 'deleted'].every((key) =>
      isInteger(counts[key]),
    )
  );
}
function copyProfile(profile: MistakeProfile): MistakeProfile {
  const copy = (counts: Record<string, MistakeCount>) =>
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { attempts: count.attempts, errors: count.errors },
      ]),
    );
  return {
    letters: copy(profile.letters),
    bigrams: copy(profile.bigrams),
    words: copy(profile.words),
  };
}

export function parseHistory(value: unknown): HistoryEntry[] {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.entries))
    return [];
  const seen = new Set<string>();
  return value.entries
    .filter(isEntry)
    .filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, HISTORY_LIMIT)
    .map((entry) => ({
      id: entry.id,
      completedAt: new Date(entry.completedAt).toISOString(),
      options: {
        language: entry.options.language,
        punctuation: entry.options.punctuation,
        numbers: entry.options.numbers,
        practice: entry.options.practice,
        mode:
          entry.options.mode.type === 'time'
            ? { type: 'time', seconds: entry.options.mode.seconds }
            : { type: 'words', count: entry.options.mode.count },
      },
      result: {
        elapsedMs: entry.result.elapsedMs,
        wpm: entry.result.wpm,
        rawWpm: entry.result.rawWpm,
        accuracy: entry.result.accuracy,
        consistency: entry.result.consistency,
        errors: entry.result.errors,
        counts: {
          correct: entry.result.counts.correct,
          incorrect: entry.result.counts.incorrect,
          extra: entry.result.counts.extra,
          missed: entry.result.counts.missed,
          deleted: entry.result.counts.deleted,
        },
      },
      mistakes: copyProfile(entry.mistakes),
    }));
}

export function loadHistory(storage: HistoryStorage | undefined) {
  if (!storage) return { entries: [], bests: [], storageAvailable: false };
  let raw: string | null;
  try {
    raw = storage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return { entries: [], bests: [], storageAvailable: false };
  }
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    const entries = parseHistory(value);
    const savedBests =
      isObject(value) && value.version === 1
        ? parseHistory({ version: 1, entries: value.bests })
        : [];
    return {
      entries,
      bests: getPersonalBests([...savedBests, ...entries]),
      storageAvailable: true,
    };
  } catch {
    return { entries: [], bests: [], storageAvailable: true };
  }
}

export function saveHistory(
  storage: HistoryStorage | undefined,
  entries: readonly HistoryEntry[],
  bests = getPersonalBests(entries),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        entries: entries.slice(0, HISTORY_LIMIT),
        bests,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
