export function sampleWords(
  words: readonly string[],
  count: number,
  random = Math.random,
): string[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Word count must be a non-negative integer.');
  }

  const pool = [...new Set(words)];
  if (count > 0 && pool.length === 0) {
    throw new RangeError('Cannot sample an empty word list.');
  }

  const selected: string[] = [];
  let previousIndex = -1;

  for (let i = 0; i < count; i++) {
    const skipPrevious = previousIndex >= 0 && pool.length > 1;
    const available = pool.length - (skipPrevious ? 1 : 0);
    let index = Math.floor(random() * available);
    if (skipPrevious && index >= previousIndex) index++;

    const word = pool[index];
    if (word === undefined) {
      throw new RangeError('Random values must be in the range [0, 1).');
    }

    selected.push(word);
    previousIndex = index;
  }

  return selected;
}
