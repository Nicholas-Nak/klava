import { charactersMatch, getInputEdit } from './characters';
import type { TestState } from './testReducer';

export interface MistakeCount {
  attempts: number;
  errors: number;
}

export interface MistakeProfile {
  letters: Record<string, MistakeCount>;
  bigrams: Record<string, MistakeCount>;
  words: Record<string, MistakeCount>;
}

export function normalizeTarget(value: string): string {
  return value.normalize('NFC').replaceAll('’', "'").toLowerCase();
}

function countAttempt(
  counts: Record<string, MistakeCount>,
  key: string,
  error: boolean,
) {
  const previous = Object.hasOwn(counts, key) ? counts[key] : undefined;
  counts[key] = {
    attempts: (previous?.attempts ?? 0) + 1,
    errors: (previous?.errors ?? 0) + Number(error),
  };
}

interface WordAttempts {
  expected: string[];
  input: string;
  touched: Set<number>;
  mistakes: Set<number>;
  hasError: boolean;
}

export function getMistakeProfile(test: TestState): MistakeProfile {
  const profile: MistakeProfile = { letters: {}, bigrams: {}, words: {} };
  const words = new Map<number, WordAttempts>();

  for (const event of test.events) {
    let word = words.get(event.wordIndex);
    if (!word) {
      word = {
        expected: Array.from(
          (test.words[event.wordIndex] ?? '').normalize('NFC'),
        ),
        input: '',
        touched: new Set(),
        mistakes: new Set(),
        hasError: false,
      };
      words.set(event.wordIndex, word);
    }

    const record = (index: number, error: boolean) => {
      const expected = word.expected[index];
      if (expected === undefined) {
        word.hasError = true;
        return;
      }
      word.touched.add(index);
      if (error) {
        word.mistakes.add(index);
        word.hasError = true;
      }
      const key = normalizeTarget(expected);
      if (/^[\p{L}\p{N}'.,!?;:\-=]$/u.test(key)) {
        countAttempt(profile.letters, key, error);
      }
    };

    if (event.type === 'input') {
      const edit = getInputEdit(word.input, event.value);
      edit.inserted.forEach((actual, offset) => {
        const index = edit.index + offset;
        record(index, !charactersMatch(word.expected[index] ?? '', actual));
      });
      word.input = event.value;
    } else {
      for (
        let index = Array.from(event.value).length;
        index < word.expected.length;
        index++
      ) {
        record(index, true);
      }
      word.input = '';
    }
  }

  for (const word of words.values()) {
    for (let index = 0; index < word.expected.length - 1; index++) {
      if (!word.touched.has(index) || !word.touched.has(index + 1)) continue;
      const pair = normalizeTarget(
        word.expected.slice(index, index + 2).join(''),
      );
      if (/^[\p{L}'][\p{L}']$/u.test(pair)) {
        countAttempt(
          profile.bigrams,
          pair,
          word.mistakes.has(index) || word.mistakes.has(index + 1),
        );
      }
    }
    const key = normalizeTarget(word.expected.join('')).replace(
      /^[^\p{L}]+|[^\p{L}]+$/gu,
      '',
    );
    if (/^[\p{L}]+(?:'[\p{L}]+)*$/u.test(key)) {
      countAttempt(profile.words, key, word.hasError);
    }
  }
  return profile;
}
