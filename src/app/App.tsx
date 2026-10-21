import { useReducer, useState } from 'react';
import { ModeControls } from '../components/ModeControls';
import { TextControls } from '../components/TextControls';
import { TypingArea } from '../components/TypingArea';
import { generateText } from '../domain/text';
import { createTest, testReducer } from '../domain/testReducer';
import type { TestMode, TextOptions, TimeLimit, WordCount } from '../types';
import styles from './App.module.css';

const initialOptions: TextOptions = {
  language: 'uk',
  punctuation: false,
  numbers: false,
};

export function App() {
  const [options, setOptions] = useState(initialOptions);
  const [count, setCount] = useState<WordCount>(25);
  const [mode, setMode] = useState<TestMode['type']>('words');
  const [seconds, setSeconds] = useState<TimeLimit>(30);
  const [test, dispatch] = useReducer(testReducer, undefined, () =>
    createTest(generateText(25, initialOptions), { type: 'words', count: 25 }),
  );
  const selectedMode: TestMode =
    mode === 'words' ? { type: 'words', count } : { type: 'time', seconds };

  function resetTest(nextMode = selectedMode, nextOptions = options) {
    const length = nextMode.type === 'words' ? nextMode.count : 100;
    dispatch({
      type: 'reset',
      words: generateText(length, nextOptions),
      mode: nextMode,
    });
  }

  function updateOptions(nextOptions: TextOptions) {
    setOptions(nextOptions);
    resetTest(selectedMode, nextOptions);
  }

  function updateCount(nextCount: WordCount) {
    setCount(nextCount);
    resetTest({ type: 'words', count: nextCount });
  }

  function updateMode(nextMode: TestMode['type']) {
    setMode(nextMode);
    resetTest(
      nextMode === 'words'
        ? { type: 'words', count }
        : { type: 'time', seconds },
    );
  }

  function updateSeconds(nextSeconds: TimeLimit) {
    setSeconds(nextSeconds);
    resetTest({ type: 'time', seconds: nextSeconds });
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Klava</h1>
        <p className={styles.description}>Тренажер друку</p>
      </header>
      <main className={styles.workspace}>
        <div className={styles.toolbar}>
          <ModeControls
            mode={mode}
            count={count}
            seconds={seconds}
            onModeChange={updateMode}
            onCountChange={updateCount}
            onSecondsChange={updateSeconds}
          />
          <TextControls options={options} onChange={updateOptions} />
        </div>
        <TypingArea
          test={test}
          language={options.language}
          onInput={(value) =>
            dispatch({ type: 'input', value, at: performance.now() })
          }
          onAdvance={() => dispatch({ type: 'advance', at: performance.now() })}
        />
        <div className={styles.actions}>
          <button
            className={styles.refreshButton}
            type="button"
            onClick={() => resetTest()}
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
