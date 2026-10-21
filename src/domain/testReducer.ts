import type { TestMode } from '../types';
import { charactersMatch } from './characters';

export type TestState = {
  words: readonly string[];
  mode: TestMode;
  input: string;
  completed: readonly string[];
  elapsedMs: number;
} & (
  | { phase: 'idle'; startedAt: null; finishedAt: null }
  | { phase: 'running'; startedAt: number; finishedAt: null }
  | { phase: 'finished'; startedAt: number; finishedAt: number }
);

export type TestAction =
  | { type: 'input'; value: string; at: number }
  | { type: 'advance'; at: number }
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
    completed: [],
    elapsedMs: 0,
    startedAt: null,
    finishedAt: null,
  };
}

function completeWord(state: TestState, at: number): TestState {
  if (state.phase !== 'running' || state.input === '') return state;

  const completed = [...state.completed, state.input];
  const elapsedMs = Math.max(state.elapsedMs, at - state.startedAt);
  if (state.mode.type === 'words' && completed.length === state.mode.count) {
    return {
      ...state,
      phase: 'finished',
      completed,
      input: '',
      elapsedMs,
      finishedAt: state.startedAt + elapsedMs,
    };
  }

  return { ...state, completed, input: '', elapsedMs };
}

export function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'reset':
      return createTest(action.words, action.mode);
    case 'advance':
      return completeWord(state, action.at);
    case 'input': {
      if (state.phase === 'finished') return state;
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

      const next = {
        ...state,
        input,
        elapsedMs: Math.max(state.elapsedMs, action.at - state.startedAt),
      };
      if (
        next.mode.type === 'words' &&
        next.completed.length === next.mode.count - 1 &&
        charactersMatch(next.words[next.completed.length] ?? '', input)
      ) {
        return completeWord(next, action.at);
      }
      return next;
    }
  }
}
