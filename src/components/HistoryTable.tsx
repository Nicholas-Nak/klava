import type { HistoryEntry } from '../domain/history';
import styles from './HistoryTable.module.css';

const dateFormat = new Intl.DateTimeFormat('uk-UA', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const numberFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 1,
});

export function HistoryTable({
  entries,
}: {
  entries: readonly HistoryEntry[];
}) {
  if (!entries.length) {
    return (
      <p className={styles.empty}>
        Тут з’являться результати завершених тестів.
      </p>
    );
  }
  return (
    <div
      className={styles.scroll}
      role="region"
      aria-label="Результати в історії"
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption>Завершені тести</caption>
        <thead>
          <tr>
            <th scope="col">Дата</th>
            <th scope="col">Тренування</th>
            <th scope="col">WPM</th>
            <th scope="col">Raw WPM</th>
            <th scope="col">Точність</th>
            <th scope="col">Стабільність</th>
            <th scope="col">Помилки</th>
            <th scope="col">Час</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ id, completedAt, options, result }) => (
            <tr key={id}>
              <th scope="row">
                <time dateTime={completedAt}>
                  {dateFormat.format(new Date(completedAt))}
                </time>
              </th>
              <td className={styles.context}>
                <span>
                  {options.language === 'uk' ? 'Українська' : 'English'} ·{' '}
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
              </td>
              <td className={styles.speed}>{result.wpm}</td>
              <td>{result.rawWpm}</td>
              <td>{numberFormat.format(result.accuracy)}%</td>
              <td>
                {result.consistency === null
                  ? '—'
                  : `${numberFormat.format(result.consistency)}%`}
              </td>
              <td>{result.errors}</td>
              <td>{numberFormat.format(result.elapsedMs / 1000)} с</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
