// @vitest-environment node
import { expect, it } from 'vitest';
import type { MistakeProfile } from './mistakes';
import { mergeMistakeProfiles } from './mistakeHistory';

it('combines error counts and successful attempts in all categories', () => {
  const profiles: MistakeProfile[] = [
    {
      letters: { ї: { attempts: 3, errors: 2 } },
      bigrams: { їж: { attempts: 2, errors: 1 } },
      words: { їжак: { attempts: 2, errors: 1 } },
    },
    {
      letters: { ї: { attempts: 4, errors: 0 }, є: { attempts: 2, errors: 1 } },
      bigrams: { їж: { attempts: 1, errors: 0 } },
      words: { їжак: { attempts: 1, errors: 0 } },
    },
  ];
  const before = structuredClone(profiles);
  expect(mergeMistakeProfiles(profiles)).toEqual({
    letters: { ї: { attempts: 7, errors: 2 }, є: { attempts: 2, errors: 1 } },
    bigrams: { їж: { attempts: 3, errors: 1 } },
    words: { їжак: { attempts: 3, errors: 1 } },
  });
  expect(profiles).toEqual(before);
});

it('keeps Ukrainian letters and Latin characters distinct', () => {
  const profile: MistakeProfile = {
    letters: {
      ґ: { attempts: 2, errors: 1 },
      г: { attempts: 3, errors: 2 },
      і: { attempts: 1, errors: 0 },
      i: { attempts: 1, errors: 1 },
    },
    bigrams: {},
    words: {},
  };
  expect(Object.keys(mergeMistakeProfiles([profile]).letters)).toHaveLength(4);
  expect(mergeMistakeProfiles([])).toEqual({
    letters: {},
    bigrams: {},
    words: {},
  });
});

it('handles words that coincide with object property names', () => {
  const profile: MistakeProfile = {
    letters: {},
    bigrams: {},
    words: JSON.parse(
      '{"constructor":{"attempts":2,"errors":1},"__proto__":{"attempts":1,"errors":0}}',
    ) as MistakeProfile['words'],
  };
  const merged = mergeMistakeProfiles([profile, profile]);
  expect(merged.words.constructor).toEqual({ attempts: 4, errors: 2 });
  expect(Object.getPrototypeOf(merged.words)).toBe(Object.prototype);
});
