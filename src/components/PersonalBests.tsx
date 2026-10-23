import type { HistoryEntry } from '../domain/history';
import styles from './PersonalBests.module.css';

const numberFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' });

export function PersonalBests({
  entries,
}: {
  entries: readonly HistoryEntry[];
}) {
  if (!entries.length) return null;
  return (
    <details className={styles.records}>
      <summary>
        Особисті рекорди <span>{entries.length}</span>
      </summary>
      <p className={styles.note}>
        Найвища швидкість для кожного набору параметрів. За однакової швидкості
        — вища точність.
      </p>
      <dl className={styles.list}>
        {entries.map(({ id, completedAt, options, result }) => (
          <div className={styles.record} key={id}>
            <dt>
              <span>
                {options.mode.type === 'time'
                  ? `${options.mode.seconds} с`
                  : `${options.mode.count} слів`}
              </span>
              <small>
                {options.practice === 'weak-spots'
                  ? 'Слабкі місця'
                  : 'Звичайне'}
                {options.punctuation && ' · пунктуація'}
                {options.numbers && ' · цифри'}
              </small>
              <time dateTime={completedAt}>
                {dateFormat.format(new Date(completedAt))}
              </time>
            </dt>
            <dd>
              <strong>
                {result.wpm} <small>WPM</small>
              </strong>
              <span>{numberFormat.format(result.accuracy)}% точності</span>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
