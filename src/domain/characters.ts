export function charactersMatch(expected: string, actual: string): boolean {
  const normalize = (character: string) =>
    character.normalize('NFC').replaceAll('’', "'");

  return normalize(expected) === normalize(actual);
}

export type CharacterStatus = 'pending' | 'correct' | 'incorrect' | 'extra';

export interface Character {
  value: string;
  status: CharacterStatus;
}

export interface InputEdit {
  index: number;
  removed: number;
  inserted: readonly string[];
}

export function getInputEdit(previous: string, next: string): InputEdit {
  const before = Array.from(previous.normalize('NFC'));
  const after = Array.from(next.normalize('NFC'));
  let index = 0;
  while (
    index < before.length &&
    index < after.length &&
    charactersMatch(before[index] ?? '', after[index] ?? '')
  ) {
    index++;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > index &&
    afterEnd > index &&
    charactersMatch(before[beforeEnd - 1] ?? '', after[afterEnd - 1] ?? '')
  ) {
    beforeEnd--;
    afterEnd--;
  }

  return {
    index,
    removed: beforeEnd - index,
    inserted: after.slice(index, afterEnd),
  };
}

export function getCharacters(
  word: string,
  input = '',
  submitted = false,
): Character[] {
  const expected = Array.from(word.normalize('NFC'));
  const actual = Array.from(input.normalize('NFC'));

  return Array.from(
    { length: Math.max(expected.length, actual.length) },
    (_, index) => {
      const value = expected[index] ?? actual[index] ?? '';
      const typed = actual[index];
      let status: CharacterStatus;
      if (expected[index] === undefined) status = 'extra';
      else if (typed === undefined)
        status = submitted ? 'incorrect' : 'pending';
      else status = charactersMatch(value, typed) ? 'correct' : 'incorrect';

      return { value, status };
    },
  );
}
