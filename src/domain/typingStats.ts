import { charactersMatch, getInputEdit } from './characters';
import type { TestState, TypingEvent } from './testReducer';

export interface AttemptCounts {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  deleted: number;
}

function emptyCounts(): AttemptCounts {
  return { correct: 0, incorrect: 0, extra: 0, missed: 0, deleted: 0 };
}

export function countTypingEvent(
  test: TestState,
  event: TypingEvent,
  previousInput: string,
): AttemptCounts {
  const counts = emptyCounts();
  const word = Array.from((test.words[event.wordIndex] ?? '').normalize('NFC'));
  if (event.type === 'submit') {
    counts.missed = Math.max(
      0,
      word.length - Array.from(event.value.normalize('NFC')).length,
    );
    if (test.mode.type === 'time' || event.wordIndex < test.mode.count - 1) {
      counts.correct = 1;
    }
    return counts;
  }

  const edit = getInputEdit(previousInput, event.value);
  counts.deleted = edit.removed;
  for (const [offset, actual] of edit.inserted.entries()) {
    const expected = word[edit.index + offset];
    if (expected === undefined) counts.extra++;
    else if (charactersMatch(expected, actual)) counts.correct++;
    else counts.incorrect++;
  }
  return counts;
}

export function getAttemptCounts(test: TestState): AttemptCounts {
  const total = emptyCounts();
  let input = '';
  for (const event of test.events) {
    const counts = countTypingEvent(test, event, input);
    total.correct += counts.correct;
    total.incorrect += counts.incorrect;
    total.extra += counts.extra;
    total.missed += counts.missed;
    total.deleted += counts.deleted;
    input = event.type === 'submit' ? '' : event.value;
  }
  return total;
}
