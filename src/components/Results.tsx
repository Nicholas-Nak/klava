import { useEffect, useRef } from 'react';
import type { TestResult } from '../domain/results';
import type { TestOptions } from '../types';
import { SpeedChart } from './SpeedChart';
import styles from './Results.module.css';

interface ResultsProps {
  result: TestResult;
  options: TestOptions;
}

const numberFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

export function Results({ result, options }: ResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.results} aria-label="Результати тесту">
      <h2 className={styles.heading} ref={headingRef} tabIndex={-1}>
        Тест завершено
      </h2>
      <p className={styles.context}>
        {options.language === 'uk' ? 'Українська' : 'English'}
        {' · '}
        {options.mode.type === 'time'
          ? `${options.mode.seconds} с`
          : `${options.mode.count} слів`}
        {options.punctuation && ' · пунктуація'}
        {options.numbers && ' · цифри'}
      </p>
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
      <SpeedChart samples={result.samples} />
      <section className={styles.breakdown} aria-label="Символи та виправлення">
        <h3>Символи та виправлення</h3>
        <dl>
          <div>
            <dt>Помилкові</dt>
            <dd>{result.counts.incorrect}</dd>
          </div>
          <div>
            <dt>Зайві</dt>
            <dd>{result.counts.extra}</dd>
          </div>
          <div>
            <dt>Пропущені</dt>
            <dd>{result.counts.missed}</dd>
          </div>
          <div>
            <dt>Видалені</dt>
            <dd>{result.counts.deleted}</dd>
          </div>
        </dl>
        <p>
          Виправлені помилки теж враховано. Видалені символи показано окремо.
        </p>
      </section>
    </section>
  );
}
