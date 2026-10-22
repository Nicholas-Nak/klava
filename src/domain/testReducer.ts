import type { TestMode } from '../types';
import { charactersMatch } from './characters';

export interface TypingEvent {
  type: 'input';
  elapsedMs: number;
  wordIndex: number;
  value: string;
}

export type TestState = {
  words: readonly string[];
  mode: TestMode;
  input: string;
  completed: readonly string[];
  elapsedMs: number;
  events: readonly TypingEvent[];
} & (
  | { phase: 'idle'; startedAt: null; finishedAt: null }
  | { phase: 'running'; startedAt: number; finishedAt: null }
  | { phase: 'finished'; startedAt: number; finishedAt: number }
);

export type TestAction =
  | { type: 'input'; value: string; at: number }
  | { type: 'advance'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'append'; words: readonly string[] }
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
    events: [],
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
  if (
    'at' in action &&
    state.phase === 'running' &&
    state.mode.type === 'time'
  ) {
    const limitMs = state.mode.seconds * 1000;
    if (action.at >= state.startedAt + limitMs) {
      return {
        ...state,
        phase: 'finished',
        elapsedMs: limitMs,
        finishedAt: state.startedAt + limitMs,
      };
    }
  }

  switch (action.type) {
    case 'reset':
      return createTest(action.words, action.mode);
    case 'append':
      if (
        state.phase !== 'running' ||
        state.mode.type !== 'time' ||
        action.words.length === 0
      )
        return state;
      return { ...state, words: [...state.words, ...action.words] };
    case 'advance':
      return completeWord(state, action.at);
    case 'tick': {
      if (state.phase !== 'running') return state;
      const elapsedMs = Math.max(state.elapsedMs, action.at - state.startedAt);
      return elapsedMs === state.elapsedMs ? state : { ...state, elapsedMs };
    }
    case 'input': {
      if (state.phase === 'finished') return state;
      if (state.words[state.completed.length] === undefined) return state;
      const input = action.value.normalize('NFC');
      if (/\s/.test(input) || input === state.input) return state;
      const elapsedMs =
        state.phase === 'running'
          ? Math.max(state.elapsedMs, action.at - state.startedAt)
          : 0;
      const event: TypingEvent = {
        type: 'input',
        elapsedMs,
        wordIndex: state.completed.length,
        value: input,
      };
      const events = [...state.events, event];
      if (state.phase === 'idle') {
        if (input === '') return state;
        return {
          ...state,
          phase: 'running',
          input,
          startedAt: action.at,
          events,
        };
      }

      const next = {
        ...state,
        input,
        elapsedMs,
        events,
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
