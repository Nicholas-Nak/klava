import {
  calculateWpm,
  countCorrectCharacters,
  countTypedCharacters,
} from './metrics';
import { createTest, testReducer, type TestState } from './testReducer';
import { countTypingEvent } from './typingStats';

export interface SpeedSample {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
  typed: number;
}

export function getSpeedSamples(test: TestState): SpeedSample[] {
  if (!Number.isFinite(test.elapsedMs) || test.elapsedMs <= 0) return [];

  const samples: SpeedSample[] = [];
  let replay = createTest(test.words, test.mode);
  let eventIndex = 0;
  const steps = Math.ceil(test.elapsedMs / 1000);
  for (let step = 1; step <= steps; step++) {
    const elapsedMs = Math.min(step * 1000, test.elapsedMs);
    let errors = 0;
    let typed = 0;
    let event = test.events[eventIndex];
    while (event && event.elapsedMs <= elapsedMs) {
      const counts = countTypingEvent(test, event, replay.input);
      errors += counts.incorrect + counts.extra + counts.missed;
      typed += counts.correct + counts.incorrect + counts.extra;
      replay = testReducer(
        replay,
        event.type === 'input'
          ? { type: 'input', value: event.value, at: event.elapsedMs }
          : { type: 'advance', at: event.elapsedMs },
      );
      eventIndex++;
      event = test.events[eventIndex];
    }

    replay = testReducer(replay, { type: 'tick', at: elapsedMs });
    samples.push({
      second: elapsedMs / 1000,
      wpm: calculateWpm(countCorrectCharacters(replay), elapsedMs),
      rawWpm: calculateWpm(countTypedCharacters(replay), elapsedMs),
      errors,
      typed,
    });
  }
  return samples;
}
