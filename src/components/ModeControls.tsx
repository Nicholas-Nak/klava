import type { WordCount } from '../types';
import styles from './Controls.module.css';

interface ModeControlsProps {
  count: WordCount;
  onCountChange: (count: WordCount) => void;
}

const wordCounts = [10, 25, 50, 100] as const;

export function ModeControls({ count, onCountChange }: ModeControlsProps) {
  return (
    <div className={styles.controls}>
      <fieldset className={styles.group}>
        <legend>Кількість слів</legend>
        <div className={styles.choices}>
          {wordCounts.map((value) => (
            <label className={styles.choice} key={value}>
              <input
                type="radio"
                name="word-count"
                value={value}
                checked={count === value}
                onChange={() => onCountChange(value)}
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
