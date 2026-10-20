export type Language = 'uk' | 'en';

export type TestMode =
  | { type: 'time'; seconds: 15 | 30 | 60 | 120 }
  | { type: 'words'; count: 10 | 25 | 50 | 100 };

export interface TextOptions {
  language: Language;
  punctuation: boolean;
  numbers: boolean;
}

export interface TestOptions extends TextOptions {
  mode: TestMode;
}
