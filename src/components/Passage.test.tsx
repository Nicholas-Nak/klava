import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Passage } from './Passage';
import wordStyles from './Word.module.css';

it('keeps word spaces, Ukrainian letters and apostrophes in rendered text', () => {
  render(
    <Passage
      words={['ґанок', 'єнот', 'їжак', "ім'я", 'сім’я']}
      language="uk"
    />,
  );

  const passage = screen.getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');
  expect(visibleText?.textContent).toBe("ґанок єнот їжак ім'я сім’я");
  expect(passage).toHaveAttribute('lang', 'uk');
  expect(screen.getByText("ґанок єнот їжак ім'я сім’я")).toBeInTheDocument();
});

it('renders English text with its language', () => {
  render(<Passage words={['Hello,', 'world!', '123.']} language="en" />);

  const passage = screen.getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');
  expect(visibleText?.textContent).toBe('Hello, world! 123.');
  expect(screen.getByText('Hello, world! 123.')).toBeInTheDocument();
  expect(passage).toHaveAttribute('lang', 'en');
});

it('replaces both text layers when a shorter passage is generated', () => {
  const { rerender } = render(
    <Passage words={['some', 'longer', 'text']} language="en" />,
  );

  rerender(<Passage words={['новий', 'текст']} language="uk" />);

  const passage = screen.getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');
  expect(visibleText?.textContent).toBe('новий текст');
  expect(screen.getByText('новий текст')).toBeInTheDocument();
  expect(screen.queryByText('some longer text')).not.toBeInTheDocument();
  expect(passage).toHaveAttribute('lang', 'uk');
});

it('moves the cursor and marks the submitted word without changing the next word', () => {
  const words = ['кіт', 'пес'];
  const { container, rerender } = render(
    <Passage words={words} language="uk" input="к!" active />,
  );

  expect(container.querySelector('[data-caret-anchor]')).toHaveTextContent('т');
  rerender(
    <Passage words={words} language="uk" completed={['к!']} input="п" active />,
  );

  const anchors = container.querySelectorAll('[data-caret-anchor]');
  expect(anchors).toHaveLength(1);
  expect(anchors[0]).toHaveTextContent('е');
  expect(screen.getByText('і')).toHaveClass(wordStyles.incorrect!);
  expect(screen.getByText('т')).toHaveClass(wordStyles.incorrect!);
  expect(screen.getByText('п')).toHaveClass(wordStyles.correct!);
});

it('clears old highlighting when the same passage is restarted', () => {
  const words = ['ім’я', 'їжак'];
  const { container, rerender } = render(
    <Passage
      words={words}
      language="uk"
      completed={["ім'я"]}
      input="їжак!"
      active
    />,
  );

  expect(screen.getByText('!')).toHaveClass(wordStyles.extra!);
  rerender(<Passage words={words} language="uk" active />);

  expect(container.querySelector('[data-caret-anchor]')).toHaveTextContent('і');
  expect(screen.queryByText('!')).not.toBeInTheDocument();
  expect(screen.getByText('ї')).toHaveClass(wordStyles.pending!);
  expect(screen.getByText('’')).toHaveClass(wordStyles.pending!);
});
