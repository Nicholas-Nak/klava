// @vitest-environment node
import { expect, it } from 'vitest';
import { charactersMatch } from './characters';

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
