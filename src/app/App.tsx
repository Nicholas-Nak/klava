import { useEffect, useReducer, useRef, useState } from 'react';
import { ModeControls } from '../components/ModeControls';
import { TextControls } from '../components/TextControls';
import { TestStatus } from '../components/TestStatus';
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
  const [focused, setFocused] = useState(false);
  const [test, dispatch] = useReducer(testReducer, undefined, () =>
    createTest(generateText(25, initialOptions), { type: 'words', count: 25 }),
  );
  const selectedMode: TestMode =
    mode === 'words' ? { type: 'words', count } : { type: 'time', seconds };
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusMode = test.phase === 'running' && focused;

  useEffect(() => {
    if (test.phase === 'finished') {
      resultHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [test.phase]);

  useEffect(() => {
    if (test.phase !== 'running') return;
    const interval = window.setInterval(() => {
      dispatch({ type: 'tick', at: performance.now() });
    }, 100);
    return () => window.clearInterval(interval);
  }, [test.phase, test.startedAt]);

  useEffect(() => {
    if (
      test.phase !== 'running' ||
      test.mode.type !== 'time' ||
      test.words.length - test.completed.length >= 20
    )
      return;
    dispatch({
      type: 'append',
      words: generateText(100, options, Math.random, test.words.at(-1)),
    });
  }, [test.phase, test.mode.type, test.words, test.completed.length, options]);

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
      <header
        className={[styles.header, focusMode ? styles.hidden : ''].join(' ')}
        aria-hidden={focusMode}
        inert={focusMode}
      >
        <h1 className={styles.brand}>Klava</h1>
        <p className={styles.description}>Тренажер друку</p>
      </header>
      <main className={styles.workspace}>
        <div
          className={[styles.toolbar, focusMode ? styles.hidden : ''].join(' ')}
          aria-hidden={focusMode}
          inert={focusMode}
        >
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
        {test.phase === 'finished' && (
          <h2
            className={styles.finishedTitle}
            ref={resultHeadingRef}
            tabIndex={-1}
          >
            Тест завершено
          </h2>
        )}
        <TestStatus test={test} />
        <TypingArea
          test={test}
          language={options.language}
          focused={focused}
          onFocusChange={setFocused}
          onInput={(value) =>
            dispatch({ type: 'input', value, at: performance.now() })
          }
          onAdvance={() => dispatch({ type: 'advance', at: performance.now() })}
        />
        <div
          className={[
            styles.actions,
            focusMode ? styles.quietActions : '',
          ].join(' ')}
        >
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
            {test.phase === 'finished' ? 'Ще раз' : 'Інший текст'}
          </button>
        </div>
      </main>
    </div>
  );
}
