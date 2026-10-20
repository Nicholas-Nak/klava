import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Passage } from './Passage';

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
