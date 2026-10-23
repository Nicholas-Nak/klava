// @vitest-environment node
import { expect, it } from 'vitest';
import { normalizeTarget } from './mistakes';
import { sampleWords } from './text';
import { generateWeakText, sampleWeakWords } from './weakText';
import type { WeakSpot } from './weakSpots';

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
const target: WeakSpot = {
  kind: 'bigrams',
  value: 'ca',
  attempts: 4,
  errors: 3,
};
const dictionary = [
  'cat',
  'car',
  'can',
  'dog',
  'fox',
  'sun',
  'moon',
  'tree',
  'bird',
  'fish',
];

it('favours targeted combinations while retaining ordinary context words', () => {
  const words = sampleWeakWords(dictionary, 500, [target], seeded(123));
  const focused = words.filter((word) => word.includes('ca')).length;
  expect(focused).toBeGreaterThan(325);
  expect(focused).toBeLessThan(475);
  expect(words.every((word) => dictionary.includes(word))).toBe(true);
  expect(words.some((word, i) => word === words[i - 1])).toBe(false);
});

it('falls back to regular sampling without supported targets', () => {
  for (const targets of [[], [{ ...target, value: 'zz' }]]) {
    expect(sampleWeakWords(dictionary, 20, targets, seeded(1))).toEqual(
      sampleWords(dictionary, 20, seeded(1)),
    );
  }
});

it('avoids repeating a targeted word across appended passages', () => {
  const single = { ...target, kind: 'words' as const, value: 'cat' };
  const words = sampleWeakWords(['cat', 'dog'], 10, [single], () => 0, 'Cat,');
  expect(words).toEqual([
    'dog',
    'cat',
    'dog',
    'cat',
    'dog',
    'cat',
    'dog',
    'cat',
    'dog',
    'cat',
  ]);
});

it('treats apostrophe variants and Unicode forms as the same word', () => {
  const words = sampleWeakWords(
    ["п'ять", 'п’ять', 'їжак', 'і\u0308жак'],
    12,
    [{ ...target, value: "п'" }],
    () => 0,
    'П’ять.',
  );
  expect(words.map(normalizeTarget)).toEqual(
    Array.from({ length: 12 }, (_, i) => (i % 2 ? "п'ять" : 'їжак')),
  );
});

it('samples whole-word targets without treating longer words as matches', () => {
  const word = { ...target, kind: 'words' as const, value: 'cat' };
  expect(
    sampleWeakWords(['cat', 'catch', 'dog'], 1, [word], () => 0.1),
  ).toEqual(['cat']);
});

it('does not mutate the dictionary or targets and remains deterministic', () => {
  const targets = [target];
  const before = structuredClone({ dictionary, targets });
  expect(sampleWeakWords(dictionary, 20, targets, seeded(45))).toEqual(
    sampleWeakWords(dictionary, 20, targets, seeded(45)),
  );
  expect({ dictionary, targets }).toEqual(before);
});

it('supports empty output and a single-word dictionary, and rejects invalid input', () => {
  expect(sampleWeakWords([], 0, [target], () => 0)).toEqual([]);
  expect(sampleWeakWords(['cat'], 3, [target], () => 0)).toEqual([
    'cat',
    'cat',
    'cat',
  ]);
  expect(() => sampleWeakWords([], 1, [target])).toThrow(RangeError);
  for (const count of [-1, 1.5, NaN])
    expect(() => sampleWeakWords(dictionary, count, [target])).toThrow(
      RangeError,
    );
  for (const value of [-1, 1, Infinity, NaN])
    expect(() => sampleWeakWords(dictionary, 1, [target], () => value)).toThrow(
      RangeError,
    );
});

it('applies numbers and punctuation to adaptive Ukrainian and English text', () => {
  for (const language of ['uk', 'en'] as const) {
    const words = generateWeakText(
      25,
      { language, punctuation: true, numbers: true },
      [{ ...target, kind: 'letters', value: language === 'uk' ? 'ї' : 'a' }],
      seeded(6),
    );
    expect(words).toHaveLength(25);
    expect(words.join(' ')).toMatch(/\d/);
    expect(words.at(-1)).toMatch(/[.!?]$/);
    expect(words.join(' ')).toMatch(
      language === 'uk' ? /[а-яіїєґ]/i : /[a-z]/i,
    );
  }
});
