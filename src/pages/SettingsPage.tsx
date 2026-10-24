import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import controls from '../components/Controls.module.css';
import styles from './SettingsPage.module.css';
import type { TestMode } from '../types';

const defaultModes: { label: string; value: string; mode: TestMode }[] = [
  { label: '15 секунд', value: 'time-15', mode: { type: 'time', seconds: 15 } },
  { label: '30 секунд', value: 'time-30', mode: { type: 'time', seconds: 30 } },
  { label: '60 секунд', value: 'time-60', mode: { type: 'time', seconds: 60 } },
  {
    label: '120 секунд',
    value: 'time-120',
    mode: { type: 'time', seconds: 120 },
  },
  { label: '10 слів', value: 'words-10', mode: { type: 'words', count: 10 } },
  { label: '25 слів', value: 'words-25', mode: { type: 'words', count: 25 } },
  { label: '50 слів', value: 'words-50', mode: { type: 'words', count: 50 } },
  {
    label: '100 слів',
    value: 'words-100',
    mode: { type: 'words', count: 100 },
  },
];

export function SettingsPage() {
  const defaultMode = useSettingsStore((state) => state.settings.defaultMode);
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
      <div className={styles.defaultMode}>
        <label htmlFor="default-mode">Режим при відкритті</label>
        <select
          id="default-mode"
          aria-describedby="default-mode-note"
          value={
            defaultMode.type === 'time'
              ? 'time-' + defaultMode.seconds
              : 'words-' + defaultMode.count
          }
          onChange={(event) => {
            const option = defaultModes.find(
              ({ value }) => value === event.target.value,
            );
            if (option) updateSettings({ defaultMode: option.mode });
          }}
        >
          {defaultModes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id="default-mode-note">
          Цей режим буде обрано при наступному відкритті Klava.
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
