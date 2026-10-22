import {
  calculateAccuracy,
  calculateConsistency,
  calculateWpm,
  countCorrectCharacters,
  countTypedCharacters,
} from './metrics';
import type { TestState } from './testReducer';
import { getSpeedSamples, type SpeedSample } from './timeline';
import { getAttemptCounts, type AttemptCounts } from './typingStats';

export interface TestResult {
  elapsedMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number | null;
  errors: number;
  counts: AttemptCounts;
  samples: SpeedSample[];
}

export function getTestResult(test: TestState): TestResult {
  if (test.phase !== 'finished') {
    throw new RangeError('Finish the test before calculating its result.');
  }

  const counts = getAttemptCounts(test);
  const errors = counts.incorrect + counts.extra + counts.missed;
  const samples = getSpeedSamples(test);
  const speeds = samples
    .filter((sample) => Number.isInteger(sample.second))
    .map((sample) => calculateWpm(sample.typed, 1000));

  return {
    elapsedMs: test.elapsedMs,
    wpm: calculateWpm(countCorrectCharacters(test), test.elapsedMs),
    rawWpm: calculateWpm(countTypedCharacters(test), test.elapsedMs),
    accuracy: calculateAccuracy(counts.correct, counts.correct + errors),
    consistency: calculateConsistency(speeds),
    errors,
    counts,
    samples,
  };
}
