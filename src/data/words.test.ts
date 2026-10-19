// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ukrainian from './uk.json';
import english from './en.json';

describe.each([
  {
    language: 'Ukrainian',
    words: ukrainian,
    pattern: /^[а-щьюяєіїґ]+(?:[’'][а-щьюяєіїґ]+)*$/,
  },
  { language: 'English', words: english, pattern: /^[a-z]+$/ },
])('$language words', ({ words, pattern }) => {
  it('contains roughly a thousand words', () => {
    expect(words.length).toBeGreaterThanOrEqual(900);
    expect(words.length).toBeLessThanOrEqual(1200);
  });

  it('has no duplicates, including alternate apostrophes', () => {
    const normalized = words.map((word) =>
      word.normalize('NFC').replaceAll('’', "'"),
    );

    expect(new Set(normalized).size).toBe(words.length);
  });

  it('contains only lowercase words in its alphabet', () => {
    for (const word of words) {
      expect(word).toBe(word.normalize('NFC'));
      expect(word).toMatch(pattern);
    }
  });
});

it('includes the Ukrainian letters ґ, є, ї and і', () => {
  const letters = new Set(ukrainian.join(''));

  for (const letter of 'ґєії') {
    expect(letters.has(letter)).toBe(true);
  }
});
