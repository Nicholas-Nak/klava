export function charactersMatch(expected: string, actual: string): boolean {
  const normalize = (character: string) =>
    character.normalize('NFC').replaceAll('’', "'");

  return normalize(expected) === normalize(actual);
}
