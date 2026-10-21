import type { TestState } from '../domain/testReducer';
import styles from './TestStatus.module.css';

interface TestStatusProps {
  test: TestState;
}

export function TestStatus({ test }: TestStatusProps) {
  const timed = test.mode.type === 'time';
  const seconds =
    test.mode.type === 'time'
      ? Math.max(0, Math.ceil(test.mode.seconds - test.elapsedMs / 1000))
      : Math.floor(test.elapsedMs / 1000);

  return (
    <div className={styles.status}>
      <span
        className={styles.timer}
        role="timer"
        aria-label={timed ? 'Залишилося часу' : 'Минуло часу'}
        aria-live="off"
      >
        {seconds}
        <small> с</small>
      </span>
      {test.mode.type === 'words' && (
        <span
          className={styles.progress}
          role="status"
          aria-label="Набрано слів"
          aria-live="off"
        >
          {test.completed.length} / {test.mode.count}
        </span>
      )}
    </div>
  );
}
