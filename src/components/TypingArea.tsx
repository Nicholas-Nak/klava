import { useId, useRef } from 'react';
import type { TestState } from '../domain/testReducer';
import type { Language } from '../types';
import { Passage } from './Passage';
import styles from './TypingArea.module.css';

interface TypingAreaProps {
  test: TestState;
  language: Language;
  onInput: (value: string) => void;
  onAdvance: () => void;
}

export function TypingArea({
  test,
  language,
  onInput,
  onAdvance,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const instructionsId = useId();

  function handleInput(value: string) {
    if (/\s$/.test(value)) {
      onInput(value.trimEnd());
      onAdvance();
    } else {
      onInput(value);
    }
  }

  return (
    <section
      className={styles.area}
      aria-label="Текст для друку"
      onPointerDown={(event) => {
        event.preventDefault();
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <span id={instructionsId} className={styles.instructions}>
        Набирайте слова. Пробіл — наступне слово. Backspace — виправити поточне.
      </span>
      <input
        ref={inputRef}
        className={styles.input}
        aria-label="Введення тексту"
        aria-describedby={instructionsId}
        value={test.input}
        disabled={test.phase === 'finished'}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onPaste={(event) => event.preventDefault()}
        onChange={(event) => handleInput(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === ' ' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onAdvance();
          }
        }}
      />
      <Passage
        words={test.words}
        language={language}
        completed={test.completed}
        input={test.input}
      />
      {test.phase === 'idle' && (
        <span className={styles.hint} aria-hidden="true">
          Натисніть на текст, щоб почати
        </span>
      )}
    </section>
  );
}
