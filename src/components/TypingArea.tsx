import { useId, useRef, useState, type RefObject } from 'react';
import type { TestState } from '../domain/testReducer';
import type { Language } from '../types';
import { Passage } from './Passage';
import styles from './TypingArea.module.css';

interface TypingAreaProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  test: TestState;
  language: Language;
  focused: boolean;
  onFocusChange: (focused: boolean) => void;
  onInput: (value: string) => void;
  onAdvance: () => void;
}

export function TypingArea({
  inputRef,
  test,
  language,
  focused,
  onFocusChange,
  onInput,
  onAdvance,
}: TypingAreaProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const fieldRef = inputRef ?? localInputRef;
  const composingRef = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
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
        fieldRef.current?.focus({ preventScroll: true });
      }}
    >
      <span id={instructionsId} className={styles.instructions}>
        Набирайте слова. Пробіл — наступне слово. Backspace — виправити поточне.
      </span>
      <input
        ref={fieldRef}
        className={styles.input}
        aria-label="Введення тексту"
        aria-describedby={instructionsId}
        lang={language}
        value={draft ?? test.input}
        disabled={test.phase === 'finished'}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onFocus={() => onFocusChange(true)}
        onBlur={() => {
          composingRef.current = false;
          setDraft(null);
          onFocusChange(false);
        }}
        onCompositionStart={(event) => {
          composingRef.current = true;
          setDraft(event.currentTarget.value);
        }}
        onCompositionEnd={(event) => {
          if (!composingRef.current) return;
          composingRef.current = false;
          setDraft(null);
          handleInput(event.currentTarget.value);
        }}
        onPaste={(event) => event.preventDefault()}
        onSelect={(event) => {
          if (composingRef.current) return;
          const input = event.currentTarget;
          const end = input.value.length;
          if (input.selectionStart !== end || input.selectionEnd !== end) {
            input.setSelectionRange(end, end);
          }
        }}
        onChange={(event) => {
          if (composingRef.current) setDraft(event.currentTarget.value);
          else handleInput(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (
            event.key === ' ' &&
            !composingRef.current &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            onAdvance();
          }
        }}
      />
      <Passage
        words={test.words}
        language={language}
        completed={test.completed}
        input={draft ?? test.input}
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
