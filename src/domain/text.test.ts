// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { addNumbers, addPunctuation, sampleWords } from './text';

describe('sampleWords', () => {
  it('returns the requested number of words without changing the source', () => {
    const words = Object.freeze(['ліс', 'море', 'дім']);
    const result = sampleWords(words, 50);

    expect(result).toHaveLength(50);
    expect(result.every((word) => words.includes(word))).toBe(true);
    expect(words).toEqual(['ліс', 'море', 'дім']);
  });

  it('does not repeat a word immediately, even at the random range boundaries', () => {
    expect(sampleWords(['one', 'two'], 5, () => 0)).toEqual([
      'one',
      'two',
      'one',
      'two',
      'one',
    ]);
    expect(sampleWords(['one', 'two'], 4, () => 0.9999)).toEqual([
      'two',
      'one',
      'two',
      'one',
    ]);
  });

  it('ignores duplicate entries in a source list', () => {
    expect(sampleWords(['one', 'one', 'two'], 4, () => 0)).toEqual([
      'one',
      'two',
      'one',
      'two',
    ]);
  });

  it('can select either side of the previous word in a larger list', () => {
    expect(sampleWords(['one', 'two', 'three'], 4, () => 0.5)).toEqual([
      'two',
      'three',
      'two',
      'three',
    ]);
  });

  it('can reuse a single available word', () => {
    expect(sampleWords(['дім'], 3)).toEqual(['дім', 'дім', 'дім']);
  });

  it('allows zero words from an empty list', () => {
    expect(sampleWords([], 0)).toEqual([]);
  });

  it('rejects an empty list when words are requested', () => {
    expect(() => sampleWords([], 1)).toThrow(RangeError);
  });

  it.each([-1, 1.5, NaN, Infinity])('rejects an invalid count: %s', (count) => {
    expect(() => sampleWords(['one'], count)).toThrow(RangeError);
  });

  it.each([-0.1, 1, NaN])('rejects an invalid random value: %s', (value) => {
    expect(() => sampleWords(['one', 'two'], 1, () => value)).toThrow(
      RangeError,
    );
  });
});

describe('addPunctuation', () => {
  it('starts a new sentence with a capital and closes the last sentence', () => {
    const words = Object.freeze(['one', 'two', 'three', 'four', 'five', 'six']);

    expect(addPunctuation(words, () => 0)).toEqual([
      'One',
      'two,',
      'three,',
      'four',
      'five.',
      'Six.',
    ]);
    expect(words).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
  });

  it('preserves Ukrainian letters and internal apostrophes', () => {
    expect(
      addPunctuation(['ґанок', 'сім’я', "ім'я", 'їжак', 'єнот'], () => 0.5),
    ).toEqual(['Ґанок', 'сім’я', "ім'я", 'їжак', 'єнот.']);
  });

  it.each([
    ['.', 0.5],
    ['?', 0.9],
    ['!', 0.99],
  ] as const)('supports %s at the end of a sentence', (mark, value) => {
    expect(addPunctuation(['hello'], () => value)).toEqual([`Hello${mark}`]);
  });

  it('keeps the word count and word order', () => {
    const words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
    const result = addPunctuation(words, () => 0.5);

    expect(result).toHaveLength(words.length);
    expect(
      result.map((word) => word.replace(/[,.?!]/g, '').toLowerCase()),
    ).toEqual(words);
  });

  it('returns an empty list for empty text', () => {
    expect(addPunctuation([])).toEqual([]);
  });
});

describe('addNumbers', () => {
  it('adds a number even to short text without changing its length', () => {
    const words = Object.freeze(['one', 'two', 'three']);
    const result = addNumbers(words, () => 0.5);

    expect(result).toEqual(['one', '550', 'three']);
    expect(words).toEqual(['one', 'two', 'three']);
  });

  it('leaves most words intact in longer text', () => {
    const words = Array.from({ length: 25 }, () => 'word');
    const result = addNumbers(words, () => 0);

    expect(result).toHaveLength(25);
    expect(result.filter((word) => /^\d+$/.test(word))).toHaveLength(4);
    expect(result.filter((word) => word === 'word')).toHaveLength(21);
  });

  it.each([
    [0, '0'],
    [0.25, '32'],
    [0.5, '550'],
    [0.9999, '9999'],
  ] as const)(
    'generates integers without leading zeroes for %s',
    (value, number) => {
      expect(addNumbers(['word'], () => value)).toEqual([number]);
    },
  );

  it('can replace the last word in a block', () => {
    const words = [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
    ];

    expect(addNumbers(words, () => 0.9999)).toEqual([
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      '9999',
    ]);
  });

  it('returns an empty list for empty text', () => {
    expect(addNumbers([])).toEqual([]);
  });
});
