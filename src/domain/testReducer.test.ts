// @vitest-environment node
import { expect, it } from 'vitest';
import { createTest, testReducer } from './testReducer';

const mode = { type: 'words', count: 10 } as const;
const words = Array.from({ length: 10 }, () => 'кіт');

it('waits for input without starting the clock', () => {
  const state = createTest(words, mode);

  expect(state.phase).toBe('idle');
  expect(state.startedAt).toBeNull();
  expect(state.elapsedMs).toBe(0);
});

it.each(['', ' ', '\t', 'кі т'])(
  'ignores empty or whitespace input %j',
  (value) => {
    const state = createTest(words, mode);
    expect(testReducer(state, { type: 'input', value, at: 100 })).toBe(state);
  },
);

it('starts on the first character, including at timestamp zero', () => {
  const state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'к',
    at: 0,
  });

  expect(state.phase).toBe('running');
  expect(state.input).toBe('к');
  expect(state.startedAt).toBe(0);
  expect(state.elapsedMs).toBe(0);
});

it('keeps the original start time while editing or clearing a word', () => {
  let state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'кіт',
    at: 100,
  });
  state = testReducer(state, { type: 'input', value: 'кі', at: 350 });
  state = testReducer(state, { type: 'input', value: '', at: 400 });

  expect(state.phase).toBe('running');
  expect(state.input).toBe('');
  expect(state.startedAt).toBe(100);
  expect(state.elapsedMs).toBe(300);
});

it('normalizes composed Ukrainian input before indexing characters', () => {
  const state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'і\u0308',
    at: 100,
  });

  expect(state.input).toBe('ї');
});

it('does not move elapsed time backwards', () => {
  let state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'к',
    at: 1000,
  });
  state = testReducer(state, { type: 'input', value: 'кі', at: 2000 });
  state = testReducer(state, { type: 'input', value: 'кіт', at: 1500 });

  expect(state.elapsedMs).toBe(1000);
});

it('resets input and time when a different passage is selected', () => {
  const running = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'к',
    at: 100,
  });
  const state = testReducer(running, {
    type: 'reset',
    words: ['hello'],
    mode: { type: 'time', seconds: 30 },
  });

  expect(state.phase).toBe('idle');
  expect(state.input).toBe('');
  expect(state.startedAt).toBeNull();
  expect(state.elapsedMs).toBe(0);
  expect(state.words).toEqual(['hello']);
  expect(state.mode).toEqual({ type: 'time', seconds: 30 });
});

it('rejects an empty passage', () => {
  expect(() => createTest([], { type: 'time', seconds: 15 })).toThrow(
    RangeError,
  );
});

it('rejects a passage that does not match the selected word count', () => {
  expect(() => createTest(['кіт'], mode)).toThrow(RangeError);
});
