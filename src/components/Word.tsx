import { getCharacters } from '../domain/characters';
import styles from './Word.module.css';

interface WordProps {
  text: string;
  input?: string;
  submitted?: boolean;
  cursor?: number | null;
}

export function Word({
  text,
  input = '',
  submitted = false,
  cursor = null,
}: WordProps) {
  const characters = getCharacters(text, input, submitted);
  return (
    <span className={styles.word}>
      {characters.map((character, index) => {
        const after =
          cursor === characters.length && index === characters.length - 1;
        const anchor = index === cursor || after;
        return (
          <span
            key={index}
            className={styles[character.status]}
            data-caret-anchor={
              anchor ? (after ? 'after' : 'before') : undefined
            }
          >
            {character.value}
          </span>
        );
      })}
    </span>
  );
}
