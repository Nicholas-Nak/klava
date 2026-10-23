export type Language = 'uk' | 'en';
export type WordCount = 10 | 25 | 50 | 100;
export type TimeLimit = 15 | 30 | 60 | 120;

export type TestMode =
  { type: 'time'; seconds: TimeLimit } | { type: 'words'; count: WordCount };

export interface TextOptions {
  language: Language;
  punctuation: boolean;
  numbers: boolean;
}

export interface TestOptions extends TextOptions {
  mode: TestMode;
}

export type PracticeMode = 'standard' | 'weak-spots';

export interface SessionOptions extends TestOptions {
  practice: PracticeMode;
}
