// @vitest-environment node
import { expect, it } from 'vitest';
import { createHistoryEntry } from './history';
import { createTest, testReducer } from './testReducer';
import type { MistakeProfile } from './mistakes';
import { getPracticeTargets, getWeakSpots } from './weakSpots';
import type { Language } from '../types';

const empty: MistakeProfile = { letters: {}, bigrams: {}, words: {} };

it('ranks repeated difficulties with a small-sample penalty and limits each category', () => {
  const profile: MistakeProfile = {
    letters: {
      a: { attempts: 100, errors: 0 },
      b: { attempts: 3, errors: 3 },
      c: { attempts: 1, errors: 1 },
      d: { attempts: 8, errors: 2 },
    },
    bigrams: {},
    words: {},
  };
  expect(
    getWeakSpots(profile, ['bad', 'cab', 'dot']).map(({ value }) => value),
  ).toEqual(['b', 'c']);
});

it('retains letter, bigram and whole-word targets supported by the dictionary', () => {
  const profile: MistakeProfile = {
    letters: { ї: { attempts: 3, errors: 2 } },
    bigrams: { їж: { attempts: 2, errors: 1 } },
    words: {
      їжак: { attempts: 2, errors: 1 },
      missing: { attempts: 10, errors: 10 },
    },
  };
  const before = structuredClone(profile);
  expect(
    getWeakSpots(profile, ['їжак', 'сова']).map(({ kind, value }) => [
      kind,
      value,
    ]),
  ).toEqual([
    ['letters', 'ї'],
    ['bigrams', 'їж'],
    ['words', 'їжак'],
  ]);
  expect(profile).toEqual(before);
});

it('combines equivalent apostrophes and Unicode forms without merging distinct letters', () => {
  const profile: MistakeProfile = {
    letters: {
      ї: { attempts: 2, errors: 1 },
      'і\u0308': { attempts: 1, errors: 1 },
      і: { attempts: 1, errors: 1 },
    },
    bigrams: { 'п’': { attempts: 2, errors: 1 } },
    words: { 'П’ЯТЬ': { attempts: 2, errors: 1 } },
  };
  const targets = getWeakSpots(profile, ["п'ять", 'їжак', 'ліс']);
  expect(targets.find(({ value }) => value === 'ї')).toMatchObject({
    attempts: 3,
    errors: 2,
  });
  expect(targets.some(({ value }) => value === 'і')).toBe(true);
  expect(targets.some(({ value }) => value === "п'")).toBe(true);
  expect(targets.some(({ value }) => value === "п'ять")).toBe(true);
});

it('reduces priority after successful attempts and falls back without usable mistakes', () => {
  const profile: MistakeProfile = {
    ...empty,
    letters: { a: { attempts: 50, errors: 2 }, b: { attempts: 3, errors: 2 } },
  };
  expect(getWeakSpots(profile, ['ab'])[0]?.value).toBe('b');
  expect(getWeakSpots(empty, ['ab'])).toEqual([]);
  expect(
    getWeakSpots({ ...empty, letters: { '7': { attempts: 2, errors: 1 } } }, [
      'ab',
    ]),
  ).toEqual([]);
  expect(getWeakSpots(profile, [])).toEqual([]);
});

function entry(
  language: Language,
  mistakes: MistakeProfile,
  completedAt = '2026-10-23T16:00:00Z',
) {
  let test = createTest(['a'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'a', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  return {
    ...createHistoryEntry(
      test,
      {
        language,
        mode: test.mode,
        practice: 'standard',
        punctuation: false,
        numbers: false,
      },
      completedAt,
      completedAt,
    ),
    mistakes,
  };
}

it('learns from the latest 30 tests of the selected language only', () => {
  const old = entry(
    'uk',
    { ...empty, letters: { ї: { attempts: 2, errors: 2 } } },
    '2026-10-20T16:00:00Z',
  );
  const english = entry('en', {
    ...empty,
    letters: { a: { attempts: 2, errors: 2 } },
  });
  const recent = Array.from({ length: 30 }, () => entry('uk', empty));
  const entries = [old, english, ...recent];
  const before = structuredClone(entries);
  expect(getPracticeTargets(entries, 'uk')).toEqual([]);
  expect(
    getPracticeTargets(entries, 'en').some(({ value }) => value === 'a'),
  ).toBe(true);
  expect(entries).toEqual(before);
});
