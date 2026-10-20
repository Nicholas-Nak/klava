import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { App } from './App';

it('renders the application', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Klava' })).toBeInTheDocument();
});

it('creates a new passage and keeps focus on the refresh button', async () => {
  const user = userEvent.setup();
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  render(<App />);
  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');
  const before = passage.textContent;
  const button = screen.getByRole('button', { name: 'Інший текст' });

  random.mockReturnValue(0.75);
  await user.click(button);

  expect(passage.textContent).not.toBe(before);
  expect(button).toHaveFocus();
});

it('uses the selected language when changing and refreshing text', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('radio', { name: 'English' }));

  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');
  expect(passage).toHaveAttribute('lang', 'en');
  expect(passage.textContent).toMatch(/^[a-z ]+$/);
  expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();

  await user.click(screen.getByRole('button', { name: 'Інший текст' }));

  expect(passage).toHaveAttribute('lang', 'en');
  expect(passage.textContent).toMatch(/^[a-z ]+$/);
});
