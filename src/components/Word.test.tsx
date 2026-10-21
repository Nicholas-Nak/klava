import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Word } from './Word';

it('anchors the cursor before the next expected character', () => {
  render(<Word text="кіт" input="к" cursor={1} />);

  expect(screen.getByText('і')).toHaveAttribute('data-caret-anchor', 'before');
});

it('anchors the cursor after the last extra character', () => {
  render(<Word text="кіт" input="кіт!" cursor={4} />);

  expect(screen.getByText('!')).toHaveAttribute('data-caret-anchor', 'after');
});

it('does not add a cursor anchor to an inactive word', () => {
  const { container } = render(<Word text="кіт" input="к" />);

  expect(container.querySelector('[data-caret-anchor]')).toBeNull();
});
