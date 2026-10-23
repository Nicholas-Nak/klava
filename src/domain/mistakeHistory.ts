import type { MistakeCount, MistakeProfile } from './mistakes';

export function mergeMistakeProfiles(
  profiles: readonly MistakeProfile[],
): MistakeProfile {
  function merge(category: keyof MistakeProfile): Record<string, MistakeCount> {
    const counts = new Map<string, MistakeCount>();
    for (const profile of profiles) {
      for (const [key, count] of Object.entries(profile[category])) {
        const previous = counts.get(key);
        counts.set(key, {
          attempts: (previous?.attempts ?? 0) + count.attempts,
          errors: (previous?.errors ?? 0) + count.errors,
        });
      }
    }
    return Object.fromEntries(counts);
  }
  return {
    letters: merge('letters'),
    bigrams: merge('bigrams'),
    words: merge('words'),
  };
}
