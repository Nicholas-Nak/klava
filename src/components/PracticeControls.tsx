import type { PracticeMode } from '../types';
import styles from './Controls.module.css';

export function PracticeControls({
  practice,
  onChange,
}: {
  practice: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}) {
  return (
    <fieldset className={styles.group}>
      <legend>Тренування</legend>
      <div className={styles.choices}>
        {(['standard', 'weak-spots'] as const).map((value) => (
          <label className={styles.choice} key={value}>
            <input
              type="radio"
              name="practice"
              value={value}
              checked={practice === value}
              onChange={() => onChange(value)}
            />
            {value === 'standard' ? 'Звичайне' : 'Слабкі місця'}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
