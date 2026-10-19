// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sampleWords } from './text';

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
