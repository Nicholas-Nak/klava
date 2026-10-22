// @vitest-environment node
import { expect, it } from 'vitest';
import { getTestResult } from './results';
import { createTest, testReducer } from './testReducer';

it('rejects results before the test has finished', () => {
  const idle = createTest(['а'], { type: 'time', seconds: 15 });
  const running = testReducer(idle, { type: 'input', value: 'а', at: 0 });

  expect(() => getTestResult(idle)).toThrow(RangeError);
  expect(() => getTestResult(running)).toThrow(RangeError);
});

it('summarizes a steady completed test without including its partial second in consistency', () => {
  const words = Array<string>(10).fill('а');
  let test = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, {
      type: 'input',
      value: 'а',
      at: index === 0 ? 0 : index * 1000 + 100,
    });
    test = testReducer(test, { type: 'advance', at: index * 1000 + 500 });
  }
  const before = structuredClone(test);
  const result = getTestResult(test);

  expect(result).toMatchObject({
    elapsedMs: 9100,
    wpm: 25,
    rawWpm: 25,
    accuracy: 100,
    consistency: 100,
    errors: 0,
    counts: { correct: 19, incorrect: 0, extra: 0, missed: 0, deleted: 0 },
  });
  expect(result.samples.at(-1)).toMatchObject({
    second: 9.1,
    wpm: 25,
    rawWpm: 25,
  });
  expect(getTestResult(test)).toEqual(result);
  expect(test).toEqual(before);
});

it('preserves corrected errors in accuracy and the timeline', () => {
  let test = createTest(['кіт'], { type: 'time', seconds: 15 });
  for (const [value, at] of [
    ['ко', 0],
    ['к', 100],
    ['кіт', 200],
  ] as const) {
    test = testReducer(test, { type: 'input', value, at });
  }
  test = testReducer(test, { type: 'tick', at: 15000 });
  const result = getTestResult(test);

  expect(result).toMatchObject({
    elapsedMs: 15000,
    wpm: 2,
    rawWpm: 2,
    accuracy: 75,
    consistency: 0,
    errors: 1,
    counts: { correct: 3, incorrect: 1, extra: 0, missed: 0, deleted: 1 },
  });
  expect(result.samples.reduce((sum, sample) => sum + sample.errors, 0)).toBe(
    result.errors,
  );
  expect(result.samples.at(-1)).toMatchObject({
    wpm: result.wpm,
    rawWpm: result.rawWpm,
  });
});

it('includes final skipped letters without counting the final control Space', () => {
  const words = Array<string>(10).fill('кіт');
  let test = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, {
      type: 'input',
      value: index === 9 ? 'ко' : 'кіт',
      at: index * 1000,
    });
    test = testReducer(test, { type: 'advance', at: index * 1000 + 500 });
  }
  const result = getTestResult(test);

  expect(result).toMatchObject({
    elapsedMs: 9500,
    wpm: 47,
    rawWpm: 48,
    accuracy: 94.9,
    errors: 2,
    counts: { correct: 37, incorrect: 1, extra: 0, missed: 1, deleted: 0 },
  });
  expect(result.samples.reduce((sum, sample) => sum + sample.errors, 0)).toBe(
    2,
  );
});

it.each([
  { step: 0, elapsedMs: 0, wpm: 0, samples: 0 },
  { step: 50, elapsedMs: 450, wpm: 507, samples: 1 },
])(
  'handles a completed test lasting $elapsedMs ms',
  ({ step, elapsedMs, wpm, samples }) => {
    const words = Array<string>(10).fill('а');
    let test = createTest(words, { type: 'words', count: 10 });
    for (let index = 0; index < 10; index++) {
      test = testReducer(test, { type: 'input', value: 'а', at: index * step });
      test = testReducer(test, {
        type: 'advance',
        at: index * step + step / 2,
      });
    }
    const result = getTestResult(test);

    expect(result).toMatchObject({
      elapsedMs,
      wpm,
      rawWpm: wpm,
      accuracy: 100,
      consistency: null,
      errors: 0,
    });
    expect(result.samples).toHaveLength(samples);
  },
);

it('leaves an untouched timed-test suffix out of the error count', () => {
  let test = createTest(['кіт', 'пес'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'к', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  const result = getTestResult(test);

  expect(result.accuracy).toBe(100);
  expect(result.errors).toBe(0);
  expect(result.counts.missed).toBe(0);
});
