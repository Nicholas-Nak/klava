import type { CSSProperties } from 'react';
import type { MistakeProfile } from '../domain/mistakes';
import type { Language } from '../types';
import styles from './KeyboardHeatmap.module.css';

const layouts: Record<Language, string[]> = {
  uk: ["'1234567890-=", 'йцукенгшщзхї', 'фівапролджє', 'ґячсмитьбю.'],
  en: ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./'],
};

export function KeyboardHeatmap({
  profile,
  language,
}: {
  profile: MistakeProfile;
  language: Language;
}) {
  const rows = layouts[language];
  const extra = Array.from(".,!?;:'-=")
    .filter((key) => !rows.some((row) => row.includes(key)))
    .join('');
  const maximum = Math.max(
    0,
    ...Object.values(profile.letters).map(({ errors }) => errors),
  );
  function renderKey(key: string) {
    const count = profile.letters[key];
    const errors = count?.errors ?? 0;
    const label = `${key === "'" ? 'Апостроф' : key}: помилок — ${errors}, спроб — ${count?.attempts ?? 0}`;
    const style = {
      '--heat': `${maximum ? (errors / maximum) * 38 : 0}%`,
    } as CSSProperties;
    return (
      <span
        key={key}
        className={styles.key}
        style={style}
        title={label}
        role={count?.attempts ? 'img' : undefined}
        aria-label={count?.attempts ? label : undefined}
        aria-hidden={!count?.attempts}
      >
        <span>{key === "'" ? '’' : key}</span>
        <small>{errors || '·'}</small>
      </span>
    );
  }
  return (
    <figure className={styles.figure} aria-label="Теплова карта помилок">
      <figcaption>
        Помилки на клавіатурі{' '}
        <span>{language === 'uk' ? 'Українська' : 'English'}</span>
      </figcaption>
      <div className={styles.keyboard}>
        {rows.map((row) => (
          <div className={styles.row} key={row}>
            {Array.from(row).map(renderKey)}
          </div>
        ))}
      </div>
      {extra && (
        <div className={styles.symbols}>
          <span>Символи</span>
          <div>{Array.from(extra).map(renderKey)}</div>
        </div>
      )}
      <p className={styles.note}>
        {maximum
          ? 'Темніша клавіша — більше помилок. Число — кількість помилок, включно з виправленими.'
          : 'Помилок у літерах поки немає.'}{' '}
        Показано очікувані символи з тестів обраної мови.
      </p>
    </figure>
  );
}
