// @vitest-environment node
import { expect, it } from 'vitest';
import { countTypedCharacters } from './metrics';
import { createTest, testReducer } from './testReducer';
import { getAttemptCounts } from './typingStats';

it.each([
  ['ко', 'к', 'кіт'],
  ['кот', 'кіт'],
])('preserves corrected mistakes in the sequence %j', (...values) => {
  let test = createTest(['кіт'], { type: 'time', seconds: 30 });
  for (const [index, value] of values.entries()) {
    test = testReducer(test, { type: 'input', value, at: index * 100 });
  }

  expect(getAttemptCounts(test)).toEqual({
    correct: 3,
    incorrect: 1,
    extra: 0,
    missed: 0,
    deleted: 1,
  });
});

it('keeps extra-character mistakes after those characters are deleted', () => {
  let test = createTest(['кіт'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'кіт!', at: 0 });
  test = testReducer(test, { type: 'input', value: 'кіт', at: 100 });

  expect(getAttemptCounts(test)).toEqual({
    correct: 3,
    incorrect: 0,
    extra: 1,
    missed: 0,
    deleted: 1,
  });
});

it('counts skipped letters on submission and leaves an unfinished suffix alone', () => {
  let test = createTest(['кіт', 'пес'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'к', at: 0 });
  expect(getAttemptCounts(test).missed).toBe(0);
  test = testReducer(test, { type: 'advance', at: 100 });
  test = testReducer(test, { type: 'input', value: 'п', at: 200 });
  test = testReducer(test, { type: 'tick', at: 15000 });

  expect(getAttemptCounts(test)).toEqual({
    correct: 3,
    incorrect: 0,
    extra: 0,
    missed: 2,
    deleted: 0,
  });
});

it.each([
  ['ї', 'і\u0308', 'ї'],
  ['сім’я', "сім'я", 'сім’я'],
  ['ґєії', 'ґєії', 'ґєії'],
  ['A1!', 'A1!', 'A1!'],
])('counts equivalent input for %s once', (word, first, second) => {
  let test = createTest([word], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: first, at: 0 });
  test = testReducer(test, { type: 'input', value: second, at: 100 });

  expect(getAttemptCounts(test)).toEqual({
    correct: Array.from(word).length,
    incorrect: 0,
    extra: 0,
    missed: 0,
    deleted: 0,
  });
});

it('keeps distinct Ukrainian letters distinct in error statistics', () => {
  let test = createTest(['ґєії'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'геиі', at: 0 });

  expect(getAttemptCounts(test)).toEqual({
    correct: 0,
    incorrect: 4,
    extra: 0,
    missed: 0,
    deleted: 0,
  });
});

it.each(['а', 'а!'])(
  'counts final submission %s without an invented space',
  (last) => {
    const words = Array<string>(10).fill('а');
    let test = createTest(words, { type: 'words', count: 10 });
    for (let index = 0; index < 10; index++) {
      test = testReducer(test, {
        type: 'input',
        value: index === 9 ? last : 'а',
        at: index * 100,
      });
      test = testReducer(test, { type: 'advance', at: index * 100 + 50 });
    }

    expect(getAttemptCounts(test)).toEqual({
      correct: 19,
      incorrect: 0,
      extra: last === 'а!' ? 1 : 0,
      missed: 0,
      deleted: 0,
    });
  },
);

it('starts with no attempts before typing', () => {
  const test = createTest(['hello'], { type: 'time', seconds: 30 });

  expect(getAttemptCounts(test)).toEqual({
    correct: 0,
    incorrect: 0,
    extra: 0,
    missed: 0,
    deleted: 0,
  });
});

it('balances insertions and deletions across submitted words and apostrophe changes', () => {
  let test = createTest(['кіт', 'сім’я'], { type: 'time', seconds: 30 });
  let at = 0;
  const sequences = [
    ['к', 'ко', 'кот', 'ко', 'к', 'кіт!', 'кі'],
    ['с', 'сі', 'сім', "сім'я", 'сім’я', 'сім’', 'сім’я'],
  ];
  for (const values of sequences) {
    for (const value of values) {
      test = testReducer(test, { type: 'input', value, at });
      at += 100;
      const counts = getAttemptCounts(test);
      expect(
        counts.correct + counts.incorrect + counts.extra - counts.deleted,
      ).toBe(countTypedCharacters(test));
    }
    test = testReducer(test, { type: 'advance', at });
    at += 100;
    const counts = getAttemptCounts(test);
    expect(
      counts.correct + counts.incorrect + counts.extra - counts.deleted,
    ).toBe(countTypedCharacters(test));
  }
});
