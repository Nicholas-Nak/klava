// @vitest-environment node
import { expect, it } from 'vitest';
import { createTest, testReducer } from './testReducer';
import { getSpeedSamples } from './timeline';

it('waits for elapsed time before producing graph samples', () => {
  const idle = createTest(['а'], { type: 'time', seconds: 15 });
  const started = testReducer(idle, { type: 'input', value: 'а', at: 0 });

  expect(getSpeedSamples(idle)).toEqual([]);
  expect(getSpeedSamples(started)).toEqual([]);
});

it('includes quiet seconds without inventing more typed characters', () => {
  let test = createTest(['а'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'а', at: 0 });
  test = testReducer(test, { type: 'tick', at: 2000 });

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 12, rawWpm: 12, errors: 0, typed: 1 },
    { second: 2, wpm: 6, rawWpm: 6, errors: 0, typed: 0 },
  ]);
});

it('preserves the timing of corrected errors and updates retained progress', () => {
  let test = createTest(['кіт'], { type: 'time', seconds: 30 });
  for (const [value, at] of [
    ['к', 0],
    ['ко', 200],
    ['к', 800],
    ['кіт', 1200],
  ] as const) {
    test = testReducer(test, { type: 'input', value, at });
  }
  test = testReducer(test, { type: 'tick', at: 2000 });

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 12, rawWpm: 12, errors: 1, typed: 2 },
    { second: 2, wpm: 18, rawWpm: 18, errors: 0, typed: 2 },
  ]);
});

it('places skipped-letter errors in the second when Space was accepted', () => {
  let test = createTest(['кіт', 'пес'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'к', at: 0 });
  test = testReducer(test, { type: 'advance', at: 1000 });
  test = testReducer(test, { type: 'tick', at: 2000 });

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 24, rawWpm: 24, errors: 2, typed: 2 },
    { second: 2, wpm: 12, rawWpm: 12, errors: 0, typed: 0 },
  ]);
});

it('keeps the real endpoint when a word-count test finishes under a second', () => {
  const words = Array<string>(10).fill('а');
  let test = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, { type: 'input', value: 'а', at: index * 50 });
    test = testReducer(test, { type: 'advance', at: index * 50 + 25 });
  }

  expect(test.phase).toBe('finished');
  expect(getSpeedSamples(test)).toEqual([
    { second: 0.45, wpm: 507, rawWpm: 507, errors: 0, typed: 19 },
  ]);
});

it('includes the last partial second without adding a future sample', () => {
  let test = createTest(['hello'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'hello', at: 0 });
  test = testReducer(test, { type: 'tick', at: 2500 });

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 60, rawWpm: 60, errors: 0, typed: 5 },
    { second: 2, wpm: 30, rawWpm: 30, errors: 0, typed: 0 },
    { second: 2.5, wpm: 24, rawWpm: 24, errors: 0, typed: 0 },
  ]);
});

it('stops at the time limit even when a late input event finishes the test', () => {
  let test = createTest(['apple'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'a', at: 0 });
  test = testReducer(test, { type: 'input', value: 'ab', at: 15001 });
  const samples = getSpeedSamples(test);

  expect(test.phase).toBe('finished');
  expect(samples).toHaveLength(15);
  expect(samples.at(-1)).toEqual({
    second: 15,
    wpm: 1,
    rawWpm: 1,
    errors: 0,
    typed: 0,
  });
  expect(samples.reduce((total, sample) => total + sample.typed, 0)).toBe(1);
});

it('replays extended timed passages without mutating the original test', () => {
  let test = createTest(['а'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'а', at: 0 });
  test = testReducer(test, { type: 'advance', at: 100 });
  test = testReducer(test, { type: 'append', words: ['б'] });
  test = testReducer(test, { type: 'input', value: 'б', at: 1100 });
  test = testReducer(test, { type: 'tick', at: 2000 });
  const before = structuredClone(test);

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 24, rawWpm: 24, errors: 0, typed: 2 },
    { second: 2, wpm: 18, rawWpm: 18, errors: 0, typed: 1 },
  ]);
  expect(test).toEqual(before);
});

it('keeps raw speed and mistake markers when every typed character is wrong', () => {
  let test = createTest(['a'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'x!', at: 0 });
  test = testReducer(test, { type: 'tick', at: 1000 });

  expect(getSpeedSamples(test)).toEqual([
    { second: 1, wpm: 0, rawWpm: 24, errors: 2, typed: 2 },
  ]);
});
