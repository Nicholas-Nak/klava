import { getCharacters } from './characters';
import type { TestState } from './testReducer';

export function calculateAccuracy(
  correctAttempts: number,
  totalAttempts: number,
): number {
  if (
    !Number.isFinite(correctAttempts) ||
    !Number.isFinite(totalAttempts) ||
    totalAttempts <= 0
  )
    return 0;

  const correct = Math.min(totalAttempts, Math.max(0, correctAttempts));
  return Math.round((correct / totalAttempts) * 1000) / 10;
}

export function calculateWpm(characters: number, elapsedMs: number): number {
  if (
    !Number.isFinite(characters) ||
    !Number.isFinite(elapsedMs) ||
    characters <= 0 ||
    elapsedMs <= 0
  )
    return 0;

  return Math.round((characters / 5) * (60000 / elapsedMs));
}

function countSpaces(test: TestState): number {
  return test.mode.type === 'words' && test.completed.length === test.mode.count
    ? Math.max(0, test.completed.length - 1)
    : test.completed.length;
}

export function countTypedCharacters(test: TestState): number {
  let typed = Array.from(test.input.normalize('NFC')).length;
  for (const input of test.completed) {
    typed += Array.from(input.normalize('NFC')).length;
  }
  return typed + countSpaces(test);
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

  return correct + countSpaces(test);
}
