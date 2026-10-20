import { useState } from 'react';
import { Passage } from '../components/Passage';
import { generateText } from '../domain/text';
import styles from './App.module.css';

export function App() {
  const [words] = useState(() =>
    generateText(25, { language: 'uk', punctuation: false, numbers: false }),
  );

  return (
    <main className={styles.app}>
      <h1>Klava</h1>
      <p className={styles.description}>
        Тренажер друку українською та англійською.
      </p>
      <section aria-label="Текст для друку">
        <Passage words={words} language="uk" />
      </section>
    </main>
  );
}
