import type { SessionOptions } from '../types';
import { getMistakeProfile, type MistakeProfile } from './mistakes';
import { getTestResult, type TestResult } from './results';
import type { TestState } from './testReducer';

export interface HistoryEntry {
  id: string;
  completedAt: string;
  options: SessionOptions;
  result: Omit<TestResult, 'samples'>;
  mistakes: MistakeProfile;
}

export function createHistoryEntry(
  test: TestState,
  options: SessionOptions,
  id: string,
  completedAt: string,
): HistoryEntry {
  if (!id) throw new RangeError('A history entry needs an identity.');
  const result = getTestResult(test);
  return {
    id,
    completedAt: new Date(completedAt).toISOString(),
    options: { ...options, mode: { ...test.mode } },
    result: {
      elapsedMs: result.elapsedMs,
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      errors: result.errors,
      counts: result.counts,
    },
    mistakes: getMistakeProfile(test),
  };
}
