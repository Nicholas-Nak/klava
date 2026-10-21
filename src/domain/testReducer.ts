import type { TestMode } from '../types';

export type TestState = {
  words: readonly string[];
  mode: TestMode;
  input: string;
  elapsedMs: number;
} & (
  { phase: 'idle'; startedAt: null } | { phase: 'running'; startedAt: number }
);

export type TestAction =
  | { type: 'input'; value: string; at: number }
  | { type: 'reset'; words: readonly string[]; mode: TestMode };

export function createTest(
  words: readonly string[],
  mode: TestMode,
): TestState {
  if (words.length === 0) {
    throw new RangeError('A typing test needs at least one word.');
  }
  if (mode.type === 'words' && words.length !== mode.count) {
    throw new RangeError('The passage must match the selected word count.');
  }

  return {
    phase: 'idle',
    words: [...words],
    mode,
    input: '',
    elapsedMs: 0,
    startedAt: null,
  };
}

export function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'reset':
      return createTest(action.words, action.mode);
    case 'input': {
      const input = action.value.normalize('NFC');
      if (/\s/.test(input) || input === state.input) return state;
      if (state.phase === 'idle') {
        if (input === '') return state;
        return {
          ...state,
          phase: 'running',
          input,
          startedAt: action.at,
        };
      }

      return {
        ...state,
        input,
        elapsedMs: Math.max(state.elapsedMs, action.at - state.startedAt),
      };
    }
  }
}
