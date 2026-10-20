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

it('toggles punctuation without changing the selected language', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'English' }));
  const punctuation = screen.getByRole('checkbox', { name: 'Пунктуація' });
  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');

  await user.click(punctuation);

  expect(punctuation).toBeChecked();
  expect(passage.textContent).toMatch(/[.!?]$/);
  expect(passage).toHaveAttribute('lang', 'en');

  await user.click(punctuation);

  expect(punctuation).not.toBeChecked();
  expect(passage.textContent).not.toMatch(/[,.!?]/);
  expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
});

it('toggles numbers independently of punctuation and language', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'English' }));
  await user.click(screen.getByRole('checkbox', { name: 'Пунктуація' }));
  const numbers = screen.getByRole('checkbox', { name: 'Цифри' });
  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');

  await user.click(numbers);

  expect(numbers).toBeChecked();
  expect(passage.textContent).toMatch(/\d/);
  expect(passage.textContent).toMatch(/[.!?]$/);

  await user.click(numbers);

  expect(passage.textContent).not.toMatch(/\d/);
  expect(passage.textContent).toMatch(/[.!?]$/);
  expect(passage).toHaveAttribute('lang', 'en');
  expect(screen.getByRole('checkbox', { name: 'Пунктуація' })).toBeChecked();
});

it.each([10, 25, 50, 100])(
  'renders %i words and keeps that count when refreshing',
  async (count) => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: String(count) }));
    const passage = within(
      screen.getByRole('region', { name: 'Текст для друку' }),
    ).getByRole('paragraph');
    const visibleText = passage.querySelector('[aria-hidden="true"]');

    expect(visibleText?.textContent?.split(' ')).toHaveLength(count);

    await user.click(screen.getByRole('button', { name: 'Інший текст' }));

    expect(visibleText?.textContent?.split(' ')).toHaveLength(count);
  },
);
