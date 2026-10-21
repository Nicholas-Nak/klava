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
  const viewportRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLParagraphElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const currentWord = Math.min(completed.length, words.length - 1);
  const cursorInput = completed[currentWord] ?? input;
  const cursor = Array.from(cursorInput.normalize('NFC')).length;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const passage = passageRef.current;
    const caret = caretRef.current;
    if (!viewport || !passage || !caret) return;
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      const anchor = passage.querySelector<HTMLElement>('[data-caret-anchor]');
      if (!anchor) {
        caret.style.visibility = 'hidden';
        passage.style.transform = 'translateY(0px)';
        return;
      }
      const bounds = passage.getBoundingClientRect();
      const target = anchor.getBoundingClientRect();
      const lineHeight = Number.parseFloat(
        window.getComputedStyle(passage).lineHeight,
      );
      const viewportHeight = viewport.getBoundingClientRect().height;
      let offset = 0;
      if (lineHeight > 0 && viewportHeight > 0) {
        const line = Math.floor(
          (target.top - bounds.top + target.height / 2) / lineHeight,
        );
        offset = Math.min(
          Math.max(0, (line - 1) * lineHeight),
          Math.max(0, bounds.height - viewportHeight),
        );
      }
      passage.style.transition =
        completed.length === 0 && input === '' ? 'none' : '';
      passage.style.transform = `translateY(${-offset}px)`;
      const edge =
        anchor.dataset.caretAnchor === 'after' ? target.right : target.left;
      const x = Math.max(0, Math.min(edge - bounds.left, bounds.width - 2));
      caret.style.height = `${target.height}px`;
      caret.style.transform = `translate(${x}px, ${target.top - bounds.top}px)`;
      caret.style.visibility = active ? 'visible' : 'hidden';
    };

    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(passage);
    observer?.observe(viewport);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [words, completed, input, active]);

  return (
    <div className={styles.viewport} ref={viewportRef}>
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
                cursor={index === currentWord ? cursor : null}
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
    </div>
  );
}
