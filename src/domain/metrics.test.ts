// @vitest-environment node
import { expect, it } from 'vitest';
import { calculateWpm, countCorrectCharacters } from './metrics';
import { createTest, testReducer } from './testReducer';

it.each([
  [250, 30000, 100],
  [250, 60000, 50],
  [5, 60000, 1],
  [2, 1000, 24],
])(
  'calculates WPM from %i characters in %i ms',
  (characters, elapsed, expected) => {
    expect(calculateWpm(characters, elapsed)).toBe(expected);
  },
);

it.each([
  [0, 1000],
  [5, 0],
  [5, -1000],
  [NaN, 1000],
  [5, Infinity],
])(
  'returns zero for invalid or empty progress (%s, %s)',
  (characters, elapsed) => {
    expect(calculateWpm(characters, elapsed)).toBe(0);
  },
);

it('counts correct characters in completed and partially typed words', () => {
  let state = createTest(['сім’я', 'ґанок'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: "сім'я", at: 0 });
  state = testReducer(state, { type: 'advance', at: 1000 });
  state = testReducer(state, { type: 'input', value: 'ґxн', at: 1500 });

  expect(countCorrectCharacters(state)).toBe(8);
});

it('excludes extra characters and accounts for corrections and backspace', () => {
  let state = createTest(['кіт'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: 'кот!', at: 0 });
  expect(countCorrectCharacters(state)).toBe(2);

  state = testReducer(state, { type: 'input', value: 'кіт', at: 1000 });
  expect(countCorrectCharacters(state)).toBe(3);

  state = testReducer(state, { type: 'input', value: '', at: 2000 });
  expect(countCorrectCharacters(state)).toBe(0);
});

it('does not add a phantom trailing space to a finished word-count test', () => {
  const words = Array.from({ length: 10 }, () => 'а');
  let state = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    state = testReducer(state, { type: 'input', value: 'а', at: index * 100 });
    state = testReducer(state, { type: 'advance', at: index * 100 + 50 });
  }

  expect(state.phase).toBe('finished');
  expect(countCorrectCharacters(state)).toBe(19);
});
