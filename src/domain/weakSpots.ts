import ukrainian from '../data/uk.json';
import english from '../data/en.json';
import type { Language } from '../types';
import type { HistoryEntry } from './history';
import { mergeMistakeProfiles } from './mistakeHistory';
import {
  normalizeTarget,
  type MistakeCount,
  type MistakeProfile,
} from './mistakes';

export interface WeakSpot extends MistakeCount {
  kind: keyof MistakeProfile;
  value: string;
}

export function matchesWeakSpot(word: string, target: WeakSpot): boolean {
  const normalized = normalizeTarget(word);
  return target.kind === 'words'
    ? normalized === target.value
    : normalized.includes(target.value);
}

export function getWeakSpots(
  profile: MistakeProfile,
  dictionary: readonly string[],
): WeakSpot[] {
  const kinds = ['letters', 'bigrams', 'words'] as const;
  return kinds.flatMap((kind) => {
    const counts = new Map<string, MistakeCount>();
    for (const [key, count] of Object.entries(profile[kind])) {
      const value = normalizeTarget(key);
      const previous = counts.get(value);
      counts.set(value, {
        attempts: (previous?.attempts ?? 0) + count.attempts,
        errors: (previous?.errors ?? 0) + count.errors,
      });
    }
    return [...counts]
      .map(([value, count]) => ({ kind, value, ...count }))
      .filter(
        (target) =>
          target.errors > 0 &&
          dictionary.some((word) => matchesWeakSpot(word, target)),
      )
      .sort(
        (a, b) =>
          b.errors / (b.attempts + 3) - a.errors / (a.attempts + 3) ||
          b.errors - a.errors ||
          a.value.localeCompare(b.value),
      )
      .slice(0, 2);
  });
}

export function getPracticeTargets(
  entries: readonly HistoryEntry[],
  language: Language,
): WeakSpot[] {
  const recent = entries
    .filter((entry) => entry.options.language === language)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, 30);
  const profile = mergeMistakeProfiles(recent.map((entry) => entry.mistakes));
  return getWeakSpots(profile, language === 'uk' ? ukrainian : english);
}
