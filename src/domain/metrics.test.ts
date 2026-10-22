// @vitest-environment node
import { expect, it } from 'vitest';
import {
  calculateAccuracy,
  calculateConsistency,
  calculateWpm,
  countCorrectCharacters,
  countTypedCharacters,
} from './metrics';
import { createTest, testReducer } from './testReducer';

it.each([
  { speeds: [60, 60, 60], expected: 100 },
  { speeds: [30, 90], expected: 50 },
  { speeds: [40, 80], expected: 66.7 },
  { speeds: [0, 120], expected: 0 },
  { speeds: [0, 0], expected: 0 },
  { speeds: [0, 0, 120], expected: 0 },
])('calculates consistency for $speeds', ({ speeds, expected }) => {
  expect(calculateConsistency(speeds)).toBe(expected);
});

it.each([
  { speeds: [] },
  { speeds: [60] },
  { speeds: [60, NaN] },
  { speeds: [60, Infinity] },
  { speeds: [60, -1] },
])(
  'does not estimate consistency from insufficient or invalid samples $speeds',
  ({ speeds }) => {
    expect(calculateConsistency(speeds)).toBeNull();
  },
);

it.each([
  [3, 4, 75],
  [19, 20, 95],
  [1, 3, 33.3],
  [10, 10, 100],
  [0, 10, 0],
  [-1, 10, 0],
  [12, 10, 100],
])(
  'calculates accuracy for %i correct attempts out of %i',
  (correct, total, expected) => {
    expect(calculateAccuracy(correct, total)).toBe(expected);
  },
);

it.each([
  [0, 0],
  [10, 0],
  [NaN, 10],
  [10, Infinity],
])(
  'returns zero accuracy for empty or invalid attempts (%s, %s)',
  (correct, total) => {
    expect(calculateAccuracy(correct, total)).toBe(0);
  },
);

it('includes incorrect and extra characters in raw typing progress', () => {
  let state = createTest(['кіт'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: 'кот!', at: 0 });
  state = testReducer(state, { type: 'tick', at: 1000 });

  expect(countTypedCharacters(state)).toBe(4);
  expect(calculateWpm(countTypedCharacters(state), state.elapsedMs)).toBe(48);
  expect(calculateWpm(countCorrectCharacters(state), state.elapsedMs)).toBe(24);

  state = testReducer(state, { type: 'input', value: 'кіт', at: 1000 });
  expect(countTypedCharacters(state)).toBe(3);
});

it('counts actual spaces without counting skipped letters or untouched words', () => {
  let state = createTest(['tree', 'house', 'garden'], {
    type: 'time',
    seconds: 30,
  });
  state = testReducer(state, { type: 'input', value: 'tr', at: 0 });
  state = testReducer(state, { type: 'advance', at: 100 });
  state = testReducer(state, { type: 'input', value: 'hose!', at: 200 });

  expect(countTypedCharacters(state)).toBe(8);
});

it('counts normalized Ukrainian input as individual characters', () => {
  let state = createTest(['ї’'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: "і\u0308'", at: 0 });

  expect(countTypedCharacters(state)).toBe(2);
});

it('does not include a final word-mode Space in raw progress', () => {
  const words = Array<string>(10).fill('а');
  let state = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    state = testReducer(state, {
      type: 'input',
      value: index === 9 ? 'а!' : 'а',
      at: index * 100,
    });
    state = testReducer(state, { type: 'advance', at: index * 100 + 50 });
  }

  expect(state.phase).toBe('finished');
  expect(countTypedCharacters(state)).toBe(20);
  expect(countCorrectCharacters(state)).toBe(19);
});

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
