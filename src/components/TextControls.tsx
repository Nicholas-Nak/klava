import type { TextOptions } from '../types';
import styles from './TextControls.module.css';

interface TextControlsProps {
  options: TextOptions;
  onChange: (options: TextOptions) => void;
}

const languages = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
] as const;

export function TextControls({ options, onChange }: TextControlsProps) {
  return (
    <div className={styles.controls}>
      <fieldset className={styles.group}>
        <legend>Мова тексту</legend>
        <div className={styles.choices}>
          {languages.map((language) => (
            <label className={styles.choice} key={language.value}>
              <input
                type="radio"
                name="text-language"
                value={language.value}
                checked={options.language === language.value}
                onChange={() =>
                  onChange({ ...options, language: language.value })
                }
              />
              <span lang={language.value}>{language.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Додатково</legend>
        <div className={styles.choices}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={options.punctuation}
              onChange={(event) =>
                onChange({
                  ...options,
                  punctuation: event.currentTarget.checked,
                })
              }
            />
            Пунктуація
          </label>
        </div>
      </fieldset>
    </div>
  );
}
