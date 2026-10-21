import { useId, useRef } from 'react';
import type { TestState } from '../domain/testReducer';
import type { Language } from '../types';
import { Passage } from './Passage';
import styles from './TypingArea.module.css';

interface TypingAreaProps {
  test: TestState;
  language: Language;
  focused: boolean;
  onFocusChange: (focused: boolean) => void;
  onInput: (value: string) => void;
  onAdvance: () => void;
}

export function TypingArea({
  test,
  language,
  focused,
  onFocusChange,
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
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onPaste={(event) => event.preventDefault()}
        onSelect={(event) => {
          const input = event.currentTarget;
          const end = input.value.length;
          if (input.selectionStart !== end || input.selectionEnd !== end) {
            input.setSelectionRange(end, end);
          }
        }}
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
        active={focused && test.phase !== 'finished'}
        idle={test.phase === 'idle'}
      />
      {test.phase !== 'finished' && (test.phase === 'idle' || !focused) && (
        <span className={styles.hint} aria-hidden="true">
          {test.phase === 'running'
            ? 'Натисніть на текст, щоб продовжити'
            : focused
              ? 'Почніть друкувати'
              : 'Натисніть на текст, щоб почати'}
        </span>
      )}
    </section>
  );
}
