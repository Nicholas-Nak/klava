import styles from './Word.module.css';

interface WordProps {
  text: string;
}

export function Word({ text }: WordProps) {
  return (
    <span className={styles.word}>
      {Array.from(text, (character, index) => (
        <span key={index}>{character}</span>
      ))}
    </span>
  );
}
