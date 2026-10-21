// @vitest-environment node
import { expect, it } from 'vitest';
import { charactersMatch, getCharacters } from './characters';

it.each([
  ['ґ', 'ґ'],
  ['є', 'є'],
  ['ї', 'ї'],
  ['і', 'і'],
  ["'", '’'],
  ['’', "'"],
  ['ї', 'і\u0308'],
])('accepts equivalent characters %s and %s', (expected, actual) => {
  expect(charactersMatch(expected, actual)).toBe(true);
});

it.each([
  ['ґ', 'г'],
  ['є', 'е'],
  ['ї', 'і'],
  ['і', 'и'],
  ['і', 'i'],
  ['Ї', 'ї'],
  ['a', 'A'],
  ["'", '`'],
])('distinguishes %s from %s', (expected, actual) => {
  expect(charactersMatch(expected, actual)).toBe(false);
});

it('keeps untyped letters pending', () => {
  expect(getCharacters('кіт')).toEqual([
    { value: 'к', status: 'pending' },
    { value: 'і', status: 'pending' },
    { value: 'т', status: 'pending' },
  ]);
});

it('distinguishes correct, incorrect and extra input', () => {
  expect(getCharacters('кіт', 'кот!')).toEqual([
    { value: 'к', status: 'correct' },
    { value: 'і', status: 'incorrect' },
    { value: 'т', status: 'correct' },
    { value: '!', status: 'extra' },
  ]);
});

it('counts omitted letters as errors only after submitting the word', () => {
  expect(
    getCharacters('кіт', 'к').map((character) => character.status),
  ).toEqual(['correct', 'pending', 'pending']);
  expect(
    getCharacters('кіт', 'к', true).map((character) => character.status),
  ).toEqual(['correct', 'incorrect', 'incorrect']);
});

it('accepts equivalent apostrophes while displaying the expected spelling', () => {
  const characters = getCharacters('сім’я', "сім'я");
  expect(characters.every((character) => character.status === 'correct')).toBe(
    true,
  );
  expect(characters.map((character) => character.value).join('')).toBe('сім’я');
});

it('treats a composed Ukrainian letter as one character', () => {
  expect(getCharacters('ї', 'і\u0308')).toEqual([
    { value: 'ї', status: 'correct' },
  ]);
});

it('checks case, numbers and punctuation', () => {
  expect(
    getCharacters('Ї1.', 'ї1,').map((character) => character.status),
  ).toEqual(['incorrect', 'correct', 'incorrect']);
});
