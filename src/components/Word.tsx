import { getCharacters } from '../domain/characters';
import styles from './Word.module.css';

interface WordProps {
  text: string;
  input?: string;
  submitted?: boolean;
}

export function Word({ text, input = '', submitted = false }: WordProps) {
  return (
    <span className={styles.word}>
      {getCharacters(text, input, submitted).map((character, index) => (
        <span key={index} className={styles[character.status]}>
          {character.value}
        </span>
      ))}
    </span>
  );
}
