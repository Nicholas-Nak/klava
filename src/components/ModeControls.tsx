import type { TestMode, WordCount } from '../types';
import styles from './Controls.module.css';

interface ModeControlsProps {
  mode: TestMode['type'];
  count: WordCount;
  onModeChange: (mode: TestMode['type']) => void;
  onCountChange: (count: WordCount) => void;
}

const wordCounts = [10, 25, 50, 100] as const;
const modes = [
  { value: 'words', label: 'Слова' },
  { value: 'time', label: 'Час' },
] as const;

export function ModeControls({
  mode,
  count,
  onModeChange,
  onCountChange,
}: ModeControlsProps) {
  return (
    <div className={styles.controls}>
      <fieldset className={styles.group}>
        <legend>Режим</legend>
        <div className={styles.choices}>
          {modes.map((option) => (
            <label className={styles.choice} key={option.value}>
              <input
                type="radio"
                name="test-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => onModeChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      {mode === 'words' && (
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
      )}
    </div>
  );
}
