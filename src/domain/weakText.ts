import ukrainian from '../data/uk.json';
import english from '../data/en.json';
import type { TextOptions } from '../types';
import { normalizeTarget } from './mistakes';
import { addNumbers, addPunctuation, sampleWords } from './text';
import { matchesWeakSpot, type WeakSpot } from './weakSpots';

export function sampleWeakWords(
  dictionary: readonly string[],
  count: number,
  targets: readonly WeakSpot[],
  random = Math.random,
  previousWord?: string,
): string[] {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError('Word count must be a non-negative integer.');
  const pool = [
    ...new Map(
      dictionary.map((word) => [normalizeTarget(word), word]),
    ).values(),
  ];
  let previous = normalizeTarget(previousWord?.replace(/[,.!?]$/, '') ?? '');
  const groups = targets
    .map((target) => pool.filter((word) => matchesWeakSpot(word, target)))
    .filter((group) => group.length > 0);
  if (!groups.length || !pool.length)
    return sampleWords(
      pool,
      count,
      random,
      pool.find((word) => normalizeTarget(word) === previous),
    );
  function draw() {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new RangeError('Random values must be in the range [0, 1).');
    return value;
  }
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const candidates =
      draw() < 0.7 ? groups[Math.floor(draw() * groups.length)]! : pool;
    let available = candidates.filter(
      (word) => normalizeTarget(word) !== previous,
    );
    if (!available.length)
      available = pool.filter((word) => normalizeTarget(word) !== previous);
    if (!available.length) available = pool;
    const word = available[Math.floor(draw() * available.length)]!;
    selected.push(word);
    previous = normalizeTarget(word);
  }
  return selected;
}

export function generateWeakText(
  count: number,
  options: TextOptions,
  targets: readonly WeakSpot[],
  random = Math.random,
  previousWord?: string,
): string[] {
  let words = sampleWeakWords(
    options.language === 'uk' ? ukrainian : english,
    count,
    targets,
    random,
    previousWord,
  );
  if (options.numbers) words = addNumbers(words, random);
  if (options.punctuation) words = addPunctuation(words, random);
  return words;
}
