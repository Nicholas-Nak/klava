import { useEffect, useRef, useState } from 'react';
import { HistoryTable } from '../components/HistoryTable';
import { useHistoryStore } from '../stores/historyStore';
import type { Language } from '../types';
import styles from './HistoryPage.module.css';

export function HistoryPage({
  initialLanguage,
}: {
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const entries = useHistoryStore((state) => state.entries);
  const storageAvailable = useHistoryStore((state) => state.storageAvailable);
  const heading = useRef<HTMLHeadingElement>(null);
  const filtered = entries.filter(
    (entry) => entry.options.language === language,
  );
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section className={styles.page} aria-labelledby="history-heading">
      <div className={styles.topline}>
        <h2 id="history-heading" ref={heading} tabIndex={-1}>
          Історія
        </h2>
        <label className={styles.filter}>
          Мова
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value === 'en' ? 'en' : 'uk')
            }
          >
            <option value="uk">Українська</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      <p className={styles.note}>
        Останні 200 тестів. Історія зберігається в цьому браузері.
      </p>
      {!storageAvailable && (
        <p className={styles.warning} role="status">
          Не вдалося зберегти історію в цьому браузері. Нові результати доступні
          лише до перезавантаження сторінки.
        </p>
      )}
      <HistoryTable entries={filtered} />
    </section>
  );
}
