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

  expect(screen.getByRole('paragraph')).toHaveTextContent(
    "ґанок єнот їжак ім'я сім’я",
  );
  expect(screen.getByRole('paragraph')).toHaveAttribute('lang', 'uk');
  expect(screen.getByText("ґанок єнот їжак ім'я сім’я")).toBeInTheDocument();
});

it('renders English text with its language', () => {
  render(<Passage words={['hello,', 'world!']} language="en" />);

  expect(screen.getByRole('paragraph')).toHaveTextContent('hello, world!');
  expect(screen.getByRole('paragraph')).toHaveAttribute('lang', 'en');
});
