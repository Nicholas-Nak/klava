export type Language = 'uk' | 'en';

export type TestMode =
  | { type: 'time'; seconds: 15 | 30 | 60 | 120 }
  | { type: 'words'; count: 10 | 25 | 50 | 100 };

export interface TestOptions {
  language: Language;
  mode: TestMode;
  punctuation: boolean;
  numbers: boolean;
}
