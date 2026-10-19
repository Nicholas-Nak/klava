import { describe, expect, it } from 'vitest';
import ukrainian from './uk.json';

describe('Ukrainian words', () => {
  it('contains roughly a thousand words', () => {
    expect(ukrainian.length).toBeGreaterThanOrEqual(900);
    expect(ukrainian.length).toBeLessThanOrEqual(1200);
  });

  it('has no duplicates, including alternate apostrophes', () => {
    const normalized = ukrainian.map((word) =>
      word.normalize('NFC').replaceAll('’', "'"),
    );

    expect(new Set(normalized).size).toBe(ukrainian.length);
  });

  it('contains lowercase Ukrainian words with internal apostrophes only', () => {
    for (const word of ukrainian) {
      expect(word).toBe(word.normalize('NFC'));
      expect(word).toMatch(/^[а-щьюяєіїґ]+(?:[’'][а-щьюяєіїґ]+)*$/);
    }
  });

  it('includes the Ukrainian letters ґ, є, ї and і', () => {
    const letters = new Set(ukrainian.join(''));

    for (const letter of 'ґєії') {
      expect(letters.has(letter)).toBe(true);
    }
  });
});
