import { Fragment } from 'react';
import type { Language } from '../types';
import { Word } from './Word';
import styles from './Passage.module.css';

interface PassageProps {
  words: readonly string[];
  language: Language;
}

export function Passage({ words, language }: PassageProps) {
  return (
    <p className={styles.passage} lang={language}>
      <span className={styles.accessibleText}>{words.join(' ')}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={index}>
            <Word text={word} />
            {index < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </p>
  );
}
