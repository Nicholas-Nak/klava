import { Fragment, useLayoutEffect, useRef } from 'react';
import type { Language } from '../types';
import { Word } from './Word';
import styles from './Passage.module.css';

interface PassageProps {
  words: readonly string[];
  language: Language;
  completed?: readonly string[];
  input?: string;
  active?: boolean;
  idle?: boolean;
}

export function Passage({
  words,
  language,
  completed = [],
  input = '',
  active = false,
  idle = true,
}: PassageProps) {
  const passageRef = useRef<HTMLParagraphElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const passage = passageRef.current;
    const caret = caretRef.current;
    if (!passage || !caret) return;
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      const anchor = active
        ? passage.querySelector<HTMLElement>('[data-caret-anchor]')
        : null;
      if (!anchor) {
        caret.style.visibility = 'hidden';
        return;
      }
      const bounds = passage.getBoundingClientRect();
      const target = anchor.getBoundingClientRect();
      const edge =
        anchor.dataset.caretAnchor === 'after' ? target.right : target.left;
      const x = Math.max(0, Math.min(edge - bounds.left, bounds.width - 2));
      caret.style.height = `${target.height}px`;
      caret.style.transform = `translate(${x}px, ${target.top - bounds.top}px)`;
      caret.style.visibility = 'visible';
    };

    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(passage);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [words, completed, input, active]);

  return (
    <p className={styles.passage} lang={language} ref={passageRef}>
      <span className={styles.accessibleText}>{words.join(' ')}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={index}>
            <Word
              text={word}
              input={
                completed[index] ?? (index === completed.length ? input : '')
              }
              submitted={index < completed.length}
              cursor={
                active && index === completed.length
                  ? Array.from(input).length
                  : null
              }
            />
            {index < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
      <span
        ref={caretRef}
        className={[styles.caret, idle ? styles.idleCaret : ''].join(' ')}
        aria-hidden="true"
      />
    </p>
  );
}
