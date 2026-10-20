import { useState } from 'react';
import { Passage } from '../components/Passage';
import { generateText } from '../domain/text';
import styles from './App.module.css';

export function App() {
  const [words] = useState(() =>
    generateText(25, { language: 'uk', punctuation: false, numbers: false }),
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Klava</h1>
        <p className={styles.description}>Тренажер друку</p>
      </header>
      <main className={styles.workspace}>
        <section className={styles.textArea} aria-label="Текст для друку">
          <Passage words={words} language="uk" />
        </section>
      </main>
    </div>
  );
}
