import { getCharacters } from './characters';
import type { TestState } from './testReducer';

export function calculateWpm(
  correctCharacters: number,
  elapsedMs: number,
): number {
  if (
    !Number.isFinite(correctCharacters) ||
    !Number.isFinite(elapsedMs) ||
    correctCharacters <= 0 ||
    elapsedMs <= 0
  )
    return 0;

  return Math.round((correctCharacters / 5) * (60000 / elapsedMs));
}

function countWordCharacters(word: string, input: string): number {
  return getCharacters(word, input).filter(
    (character) => character.status === 'correct',
  ).length;
}

export function countCorrectCharacters(test: TestState): number {
  let correct = 0;
  for (const [index, input] of test.completed.entries()) {
    correct += countWordCharacters(test.words[index] ?? '', input);
  }

  const currentWord = test.words[test.completed.length];
  if (currentWord !== undefined) {
    correct += countWordCharacters(currentWord, test.input);
  }

  const spaces =
    test.mode.type === 'words' && test.completed.length === test.mode.count
      ? Math.max(0, test.completed.length - 1)
      : test.completed.length;
  return correct + spaces;
}
