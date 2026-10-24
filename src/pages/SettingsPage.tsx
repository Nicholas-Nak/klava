import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import controls from '../components/Controls.module.css';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const fontSize = useSettingsStore((state) => state.settings.fontSize);
  const storageAvailable = useSettingsStore((state) => state.storageAvailable);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section className={styles.page} aria-labelledby="settings-heading">
      <h2 id="settings-heading" ref={heading} tabIndex={-1}>
        Налаштування
      </h2>
      <fieldset className={controls.group}>
        <legend>Тема</legend>
        <div className={controls.choices}>
          {(
            [
              { value: 'light', label: 'Світла' },
              { value: 'dark', label: 'Темна' },
            ] as const
          ).map((option) => (
            <label className={controls.choice} key={option.value}>
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={theme === option.value}
                onChange={() => updateSettings({ theme: option.value })}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.fontSettings}>
        <fieldset className={controls.group}>
          <legend>Розмір тексту</legend>
          <div className={controls.choices}>
            {(
              [
                { value: 'small', label: 'Малий' },
                { value: 'medium', label: 'Середній' },
                { value: 'large', label: 'Великий' },
              ] as const
            ).map((option) => (
              <label className={controls.choice} key={option.value}>
                <input
                  type="radio"
                  name="font-size"
                  value={option.value}
                  checked={fontSize === option.value}
                  onChange={() => updateSettings({ fontSize: option.value })}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className={styles.preview} aria-label="Приклад розміру тексту">
          Ґанок, їжак, єнот.
          <br />
          <span lang="en">Practice makes progress.</span>
        </p>
      </div>
      {!storageAvailable && (
        <p className={styles.warning} role="status">
          Не вдалося зберегти налаштування. Зміни діятимуть до перезавантаження
          сторінки.
        </p>
      )}
    </section>
  );
}
