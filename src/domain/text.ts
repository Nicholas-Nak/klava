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

export function addPunctuation(
  words: readonly string[],
  random = Math.random,
): string[] {
  let remaining = 0;

  return words.map((word, index) => {
    const startsSentence = remaining === 0;
    if (startsSentence) remaining = 5 + Math.floor(random() * 6);

    let result = startsSentence
      ? word.charAt(0).toUpperCase() + word.slice(1)
      : word;
    remaining--;

    if (remaining === 0 || index === words.length - 1) {
      remaining = 0;
      const mark = random();
      return result + (mark < 0.8 ? '.' : mark < 0.95 ? '?' : '!');
    }

    if (!startsSentence && remaining > 1 && random() < 0.12) result += ',';
    return result;
  });
}

export function addNumbers(
  words: readonly string[],
  random = Math.random,
): string[] {
  const result = [...words];
  const spacing = 8;

  for (let start = 0; start < result.length; start += spacing) {
    const blockLength = Math.min(spacing, result.length - start);
    const index = start + Math.floor(random() * blockLength);
    const digits = 1 + Math.floor(random() * 4);
    const min = digits === 1 ? 0 : 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    result[index] = String(min + Math.floor(random() * (max - min + 1)));
  }

  return result;
}
