// @vitest-environment node
import { expect, it } from 'vitest';
import { getMistakeProfile } from './mistakes';
import { createTest, testReducer, type TestAction } from './testReducer';

function run(words: string[], actions: TestAction[]) {
  return actions.reduce(
    testReducer,
    createTest(words, { type: 'time', seconds: 15 }),
  );
}

it('has no attempts before typing starts', () => {
  expect(getMistakeProfile(run(['кіт'], []))).toEqual({
    letters: {},
    bigrams: {},
    words: {},
  });
});

it('counts correct letters, adjacent pairs and a word without storing separators', () => {
  const profile = getMistakeProfile(
    run(
      ['кіт'],
      [
        { type: 'input', value: 'кіт', at: 0 },
        { type: 'advance', at: 500 },
      ],
    ),
  );
  expect(profile).toEqual({
    letters: {
      к: { attempts: 1, errors: 0 },
      і: { attempts: 1, errors: 0 },
      т: { attempts: 1, errors: 0 },
    },
    bigrams: { кі: { attempts: 1, errors: 0 }, іт: { attempts: 1, errors: 0 } },
    words: { кіт: { attempts: 1, errors: 0 } },
  });
});

it('retains a corrected mistake and counts the successful retry', () => {
  const test = run(
    ['кіт'],
    [
      { type: 'input', value: 'ко', at: 0 },
      { type: 'input', value: 'к', at: 100 },
      { type: 'input', value: 'кіт', at: 200 },
    ],
  );
  const before = structuredClone(test);
  const profile = getMistakeProfile(test);
  expect(profile.letters.і).toEqual({ attempts: 2, errors: 1 });
  expect(profile.bigrams).toEqual({
    кі: { attempts: 1, errors: 1 },
    іт: { attempts: 1, errors: 1 },
  });
  expect(profile.words.кіт).toEqual({ attempts: 1, errors: 1 });
  expect(test).toEqual(before);
});

it('counts repeated word occurrences and submitted missing characters', () => {
  const profile = getMistakeProfile(
    run(
      ['кіт', 'кіт'],
      [
        { type: 'input', value: 'кіт', at: 0 },
        { type: 'advance', at: 500 },
        { type: 'input', value: 'ко', at: 1000 },
        { type: 'advance', at: 1500 },
      ],
    ),
  );
  expect(profile.letters).toEqual({
    к: { attempts: 2, errors: 0 },
    і: { attempts: 2, errors: 1 },
    т: { attempts: 2, errors: 1 },
  });
  expect(profile.bigrams.іт).toEqual({ attempts: 2, errors: 1 });
  expect(profile.words.кіт).toEqual({ attempts: 2, errors: 1 });
});

it('marks an extra-character word without inventing an expected keyboard key', () => {
  const profile = getMistakeProfile(
    run(['кіт'], [{ type: 'input', value: 'кітx', at: 0 }]),
  );
  expect(profile.letters).not.toHaveProperty('x');
  expect(profile.letters.т).toEqual({ attempts: 1, errors: 0 });
  expect(profile.bigrams.іт).toEqual({ attempts: 1, errors: 0 });
  expect(profile.words.кіт).toEqual({ attempts: 1, errors: 1 });
});

it('does not treat an untouched suffix as a failed attempt when time expires', () => {
  const profile = getMistakeProfile(
    run(
      ['кіт'],
      [
        { type: 'input', value: 'кі', at: 0 },
        { type: 'tick', at: 15000 },
      ],
    ),
  );
  expect(profile.letters).not.toHaveProperty('т');
  expect(profile.bigrams).toEqual({ кі: { attempts: 1, errors: 0 } });
  expect(profile.words.кіт).toEqual({ attempts: 1, errors: 0 });
});

it('canonicalizes apostrophes and case in profile keys without adding a false retry', () => {
  const profile = getMistakeProfile(
    run(
      ['П’ять'],
      [
        { type: 'input', value: "П'я", at: 0 },
        { type: 'input', value: 'П’ять', at: 200 },
      ],
    ),
  );
  expect(profile.letters["'"]).toEqual({ attempts: 1, errors: 0 });
  expect(profile.letters.п).toEqual({ attempts: 1, errors: 0 });
  expect(profile.words["п'ять"]).toEqual({ attempts: 1, errors: 0 });
  expect(profile.bigrams["'я"]).toEqual({ attempts: 1, errors: 0 });
});

it('normalizes composed letters while keeping ґ, є, ї and і distinct', () => {
  const profile = getMistakeProfile(
    run(['ґєїі'], [{ type: 'input', value: 'геіі', at: 0 }]),
  );
  expect(profile.letters).toEqual({
    ґ: { attempts: 1, errors: 1 },
    є: { attempts: 1, errors: 1 },
    ї: { attempts: 1, errors: 1 },
    і: { attempts: 1, errors: 0 },
  });
  const composed = getMistakeProfile(
    run(['ї'], [{ type: 'input', value: 'і\u0308', at: 0 }]),
  );
  expect(composed.letters.ї).toEqual({ attempts: 1, errors: 0 });
});

it('retains punctuation and digit errors but uses only lexical words as word targets', () => {
  const profile = getMistakeProfile(
    run(
      ['Кіт,', '12'],
      [
        { type: 'input', value: 'кіт.', at: 0 },
        { type: 'advance', at: 500 },
        { type: 'input', value: '13', at: 1000 },
      ],
    ),
  );
  expect(profile.letters[',']).toEqual({ attempts: 1, errors: 1 });
  expect(profile.letters['2']).toEqual({ attempts: 1, errors: 1 });
  expect(profile.letters.к).toEqual({ attempts: 1, errors: 1 });
  expect(profile.words).toEqual({ кіт: { attempts: 1, errors: 1 } });
});

it('counts separate occurrences of the same pair inside one word', () => {
  const profile = getMistakeProfile(
    run(['banana'], [{ type: 'input', value: 'banana', at: 0 }]),
  );
  expect(profile.bigrams.an).toEqual({ attempts: 2, errors: 0 });
  expect(profile.bigrams.na).toEqual({ attempts: 2, errors: 0 });
});
