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

function startLastWord(passage = words) {
  let state = createTest(passage, mode);
  for (let index = 0; index < 9; index++) {
    state = testReducer(state, {
      type: 'input',
      value: passage[index] ?? '',
      at: index * 100,
    });
    state = testReducer(state, { type: 'advance', at: index * 100 + 50 });
  }
  return state;
}

it('ignores word submission before typing', () => {
  const state = createTest(words, mode);
  expect(testReducer(state, { type: 'advance', at: 100 })).toBe(state);
});

it('submits a partial word and starts the next one empty', () => {
  let state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'к',
    at: 100,
  });
  state = testReducer(state, { type: 'advance', at: 500 });

  expect(state.completed).toEqual(['к']);
  expect(state.input).toBe('');
  expect(state.elapsedMs).toBe(400);
  expect(state.phase).toBe('running');
  expect(testReducer(state, { type: 'advance', at: 600 })).toBe(state);
});

it('does not backspace into a submitted word', () => {
  let state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'кіт',
    at: 100,
  });
  state = testReducer(state, { type: 'advance', at: 500 });
  state = testReducer(state, { type: 'input', value: 'п', at: 600 });
  state = testReducer(state, { type: 'input', value: '', at: 700 });

  expect(state.completed).toEqual(['кіт']);
  expect(state.input).toBe('');
});

it('finishes on the final correct character without a trailing space', () => {
  const state = testReducer(startLastWord(), {
    type: 'input',
    value: 'кіт',
    at: 1000,
  });

  expect(state.phase).toBe('finished');
  expect(state.completed).toHaveLength(10);
  expect(state.input).toBe('');
  expect(state.startedAt).toBe(0);
  expect(state.finishedAt).toBe(1000);
  expect(state.elapsedMs).toBe(1000);
});

it('accepts either apostrophe in the final Ukrainian word', () => {
  const passage = [...words.slice(0, 9), 'сім’я'];
  const state = testReducer(startLastWord(passage), {
    type: 'input',
    value: "сім'я",
    at: 1000,
  });

  expect(state.phase).toBe('finished');
  expect(state.completed.at(-1)).toBe("сім'я");
});

it('allows a final word with mistakes to be corrected or submitted', () => {
  const running = testReducer(startLastWord(), {
    type: 'input',
    value: 'кітт',
    at: 1000,
  });
  expect(running.phase).toBe('running');

  const finished = testReducer(running, { type: 'advance', at: 1200 });
  expect(finished.phase).toBe('finished');
  expect(finished.completed.at(-1)).toBe('кітт');
});

it('ignores further input after finishing and can reset', () => {
  const finished = testReducer(startLastWord(), {
    type: 'input',
    value: 'кіт',
    at: 1000,
  });
  expect(testReducer(finished, { type: 'input', value: 'ще', at: 1100 })).toBe(
    finished,
  );
  expect(testReducer(finished, { type: 'advance', at: 1200 })).toBe(finished);

  const reset = testReducer(finished, { type: 'reset', words, mode });
  expect(reset.phase).toBe('idle');
  expect(reset.completed).toEqual([]);
  expect(reset.finishedAt).toBeNull();
});

it('does not end a timed test when the initial word batch is consumed', () => {
  let state = createTest(['кіт'], { type: 'time', seconds: 15 });
  state = testReducer(state, { type: 'input', value: 'кіт', at: 100 });
  state = testReducer(state, { type: 'advance', at: 300 });

  expect(state.phase).toBe('running');
  expect(state.completed).toEqual(['кіт']);
});

it('ignores clock updates until typing starts', () => {
  const state = createTest(words, { type: 'time', seconds: 15 });
  expect(testReducer(state, { type: 'tick', at: 100000 })).toBe(state);
});

it.each([15, 30, 60, 120] as const)(
  'finishes a timed test at exactly %i seconds',
  (seconds) => {
    let state = createTest(words, { type: 'time', seconds });
    state = testReducer(state, { type: 'input', value: 'к', at: 0 });
    state = testReducer(state, { type: 'tick', at: seconds * 1000 - 1 });
    expect(state.phase).toBe('running');

    state = testReducer(state, { type: 'tick', at: seconds * 1000 });
    expect(state.phase).toBe('finished');
    expect(state.elapsedMs).toBe(seconds * 1000);
    expect(state.finishedAt).toBe(seconds * 1000);
    expect(state.input).toBe('к');
  },
);

it('uses the deadline when a clock update arrives late', () => {
  let state = createTest(words, { type: 'time', seconds: 15 });
  state = testReducer(state, { type: 'input', value: 'к', at: 1000 });
  state = testReducer(state, { type: 'tick', at: 30000 });

  expect(state.phase).toBe('finished');
  expect(state.finishedAt).toBe(16000);
  expect(state.elapsedMs).toBe(15000);
});

it('rejects characters arriving at or after the deadline', () => {
  let state = createTest(words, { type: 'time', seconds: 15 });
  state = testReducer(state, { type: 'input', value: 'к', at: 100 });
  state = testReducer(state, { type: 'input', value: 'кі', at: 15100 });

  expect(state.phase).toBe('finished');
  expect(state.input).toBe('к');
  expect(state.elapsedMs).toBe(15000);
});

it('does not submit a word when its space arrives too late', () => {
  let state = createTest(words, { type: 'time', seconds: 15 });
  state = testReducer(state, { type: 'input', value: 'кіт', at: 100 });
  state = testReducer(state, { type: 'advance', at: 15100 });

  expect(state.phase).toBe('finished');
  expect(state.completed).toEqual([]);
  expect(state.input).toBe('кіт');
});

it('updates elapsed time while the current word is empty', () => {
  let state = testReducer(createTest(words, mode), {
    type: 'input',
    value: 'к',
    at: 100,
  });
  state = testReducer(state, { type: 'input', value: '', at: 200 });
  state = testReducer(state, { type: 'tick', at: 5000 });

  expect(state.phase).toBe('running');
  expect(state.elapsedMs).toBe(4900);
});

it('keeps the result frozen after finishing and stops clock updates on reset', () => {
  let state = createTest(words, { type: 'time', seconds: 15 });
  state = testReducer(state, { type: 'input', value: 'к', at: 100 });
  state = testReducer(state, { type: 'tick', at: 15100 });
  expect(testReducer(state, { type: 'tick', at: 20000 })).toBe(state);

  state = testReducer(state, { type: 'reset', words, mode });
  expect(testReducer(state, { type: 'tick', at: 21000 })).toBe(state);
});

it('adds words to a timed test without resetting its progress or clock', () => {
  let state = createTest(['кіт'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: 'кіт', at: 100 });
  state = testReducer(state, { type: 'advance', at: 500 });
  state = testReducer(state, { type: 'append', words: ['пес', 'дім'] });
  state = testReducer(state, { type: 'input', value: 'п', at: 1000 });

  expect(state.words).toEqual(['кіт', 'пес', 'дім']);
  expect(state.completed).toEqual(['кіт']);
  expect(state.input).toBe('п');
  expect(state.phase).toBe('running');
  expect(state.startedAt).toBe(100);
  expect(state.elapsedMs).toBe(900);
});

it('does not append words to fixed-length, idle or finished tests', () => {
  const append = { type: 'append', words: ['пес'] } as const;
  const idle = createTest(words, mode);
  expect(testReducer(idle, append)).toBe(idle);

  const running = testReducer(idle, { type: 'input', value: 'к', at: 0 });
  expect(testReducer(running, append)).toBe(running);

  let finished = createTest(['кіт'], { type: 'time', seconds: 15 });
  finished = testReducer(finished, { type: 'input', value: 'к', at: 0 });
  finished = testReducer(finished, { type: 'tick', at: 15000 });
  expect(testReducer(finished, append)).toBe(finished);
});

it('waits for a new batch instead of scoring input against a missing word', () => {
  let state = createTest(['кіт'], { type: 'time', seconds: 30 });
  state = testReducer(state, { type: 'input', value: 'кіт', at: 0 });
  state = testReducer(state, { type: 'advance', at: 500 });
  expect(
    testReducer(state, { type: 'input', value: 'невідомо', at: 1000 }),
  ).toBe(state);

  state = testReducer(state, { type: 'append', words: ['пес'] });
  state = testReducer(state, { type: 'input', value: 'п', at: 1500 });
  expect(state.input).toBe('п');
  expect(state.startedAt).toBe(0);
});
