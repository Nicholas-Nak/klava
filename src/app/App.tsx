import { useState } from 'react';
import { ModeControls } from '../components/ModeControls';
import { Passage } from '../components/Passage';
import { TextControls } from '../components/TextControls';
import { generateText } from '../domain/text';
import type { TextOptions, WordCount } from '../types';
import styles from './App.module.css';

const initialOptions: TextOptions = {
  language: 'uk',
  punctuation: false,
  numbers: false,
};

export function App() {
  const [options, setOptions] = useState(initialOptions);
  const [count, setCount] = useState<WordCount>(25);
  const [words, setWords] = useState(() => generateText(25, initialOptions));

  function refreshText() {
    setWords(generateText(count, options));
  }

  function updateOptions(nextOptions: TextOptions) {
    setOptions(nextOptions);
    setWords(generateText(count, nextOptions));
  }

  function updateCount(nextCount: WordCount) {
    setCount(nextCount);
    setWords(generateText(nextCount, options));
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Klava</h1>
        <p className={styles.description}>Тренажер друку</p>
      </header>
      <main className={styles.workspace}>
        <div className={styles.toolbar}>
          <ModeControls count={count} onCountChange={updateCount} />
          <TextControls options={options} onChange={updateOptions} />
        </div>
        <section className={styles.textArea} aria-label="Текст для друку">
          <Passage words={words} language={options.language} />
        </section>
        <div className={styles.actions}>
          <button
            className={styles.refreshButton}
            type="button"
            onClick={refreshText}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 11a8 8 0 1 0-2.4 6M20 4v7h-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Інший текст
          </button>
        </div>
      </main>
    </div>
  );
}
