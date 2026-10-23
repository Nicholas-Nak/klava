import type { WeakSpot } from '../domain/weakSpots';
import type { Language } from '../types';
import styles from './WeakSpotsPreview.module.css';

const labels = { letters: 'Літери', bigrams: 'Пари', words: 'Слова' } as const;

export function WeakSpotsPreview({
  targets,
  language,
  hidden,
}: {
  targets: readonly WeakSpot[];
  language: Language;
  hidden: boolean;
}) {
  return (
    <section
      className={[styles.preview, hidden ? styles.hidden : ''].join(' ')}
      aria-label="Цілі тренування"
      aria-hidden={hidden}
    >
      <h2>Цілі тренування</h2>
      {targets.length ? (
        <dl>
          {(['letters', 'bigrams', 'words'] as const).map((kind) => {
            const selected = targets.filter((target) => target.kind === kind);
            return selected.length ? (
              <div key={kind}>
                <dt>{labels[kind]}</dt>
                <dd lang={language}>
                  {selected.map(({ value }) => value).join(' · ')}
                </dd>
              </div>
            ) : null;
          })}
        </dl>
      ) : (
        <p>Поки немає цілей для цієї мови. Текст буде зі звичайних слів.</p>
      )}
    </section>
  );
}
