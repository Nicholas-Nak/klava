import { useEffect, useRef } from 'react';
import type { TestResult } from '../domain/results';
import styles from './Results.module.css';

interface ResultsProps {
  result: TestResult;
}

const numberFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

export function Results({ result }: ResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.results} aria-label="Результати тесту">
      <h2 className={styles.heading} ref={headingRef} tabIndex={-1}>
        Тест завершено
      </h2>
      <dl className={styles.metrics}>
        <div className={[styles.metric, styles.primaryMetric].join(' ')}>
          <dt>WPM</dt>
          <dd>
            <output aria-label="WPM" aria-live="off">
              {result.wpm}
            </output>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Raw WPM</dt>
          <dd>
            <output aria-label="Raw WPM" aria-live="off">
              {result.rawWpm}
            </output>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Точність</dt>
          <dd>
            <output aria-label="Точність" aria-live="off">
              {numberFormat.format(result.accuracy)}%
            </output>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Стабільність</dt>
          <dd>
            <output aria-label="Стабільність" aria-live="off">
              {result.consistency === null
                ? '—'
                : `${numberFormat.format(result.consistency)}%`}
            </output>
            {result.consistency === null && (
              <span className={styles.hint}>потрібно 2 с</span>
            )}
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Помилки</dt>
          <dd>
            <output aria-label="Помилки" aria-live="off">
              {result.errors}
            </output>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Тривалість</dt>
          <dd>
            <output aria-label="Тривалість" aria-live="off">
              {numberFormat.format(result.elapsedMs / 1000)} с
            </output>
          </dd>
        </div>
      </dl>
    </section>
  );
}
