import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => vi.useRealTimers());

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

it('remembers the word count when switching between words and time', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: '50' }));
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');

  expect(screen.queryByRole('group', { name: 'Кількість слів' })).toBeNull();
  expect(visibleText?.textContent?.split(' ')).toHaveLength(100);

  await user.click(screen.getByRole('radio', { name: 'English' }));
  expect(passage).toHaveAttribute('lang', 'en');
  expect(visibleText?.textContent?.split(' ')).toHaveLength(100);

  await user.click(screen.getByRole('radio', { name: 'Слова' }));
  expect(screen.getByRole('radio', { name: '50' })).toBeChecked();
  expect(visibleText?.textContent?.split(' ')).toHaveLength(50);
  expect(passage).toHaveAttribute('lang', 'en');
});

it.each([15, 30, 60, 120])(
  'remembers a %i second limit after changing modes',
  async (seconds) => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: 'Час' }));
    await user.click(screen.getByRole('radio', { name: `${seconds} с` }));
    await user.click(screen.getByRole('radio', { name: 'Слова' }));

    expect(screen.queryByRole('group', { name: 'Тривалість' })).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Час' }));

    expect(screen.getByRole('radio', { name: `${seconds} с` })).toBeChecked();
  },
);

it('focuses typing on the passage and edits only the current word', async () => {
  const user = userEvent.setup();
  render(<App />);
  const area = screen.getByRole('region', { name: 'Текст для друку' });
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });

  await user.click(area);
  expect(input).toHaveFocus();
  await user.keyboard('кіт{Backspace}');
  expect(input).toHaveValue('кі');
  await user.keyboard(' {Backspace}{Backspace}');
  expect(input).toHaveValue('');
  await user.keyboard('п');
  expect(input).toHaveValue('п');
});

it('clears active input when the language is changed', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('текст');
  await user.click(screen.getByRole('radio', { name: 'English' }));

  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    '',
  );
  expect(
    within(screen.getByRole('region', { name: 'Текст для друку' })).getByRole(
      'paragraph',
    ),
  ).toHaveAttribute('lang', 'en');
});

it('finishes a word-count test on the last character', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'English' }));
  await user.click(screen.getByRole('radio', { name: '10' }));
  const area = screen.getByRole('region', { name: 'Текст для друку' });
  const passage = within(area).getByRole('paragraph');
  const text = passage.querySelector('[aria-hidden="true"]')?.textContent;
  expect(text).toBeTruthy();

  await user.click(area);
  await user.keyboard(text ?? '');

  expect(
    screen.getByRole('textbox', { name: 'Введення тексту' }),
  ).toBeDisabled();
});

it('does not start a test from pasted text', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.paste('copied words');

  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    '',
  );
  expect(
    screen.getByText('Натисніть на текст, щоб почати'),
  ).toBeInTheDocument();
});

it('starts the countdown on first input and finishes without more typing', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  const timer = screen.getByRole('timer', { name: 'Залишилося часу' });

  act(() => vi.advanceTimersByTime(5000));
  expect(timer).toHaveTextContent('15 с');

  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('a');
  act(() => vi.advanceTimersByTime(1000));
  expect(timer).toHaveTextContent('14 с');

  act(() => vi.advanceTimersByTime(14000));
  expect(timer).toHaveTextContent('0 с');
  expect(
    screen.getByRole('textbox', { name: 'Введення тексту' }),
  ).toBeDisabled();
});

it('clears the old countdown when a test is restarted', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('a');
  act(() => vi.advanceTimersByTime(5000));
  const timer = screen.getByRole('timer', { name: 'Залишилося часу' });
  expect(timer).toHaveTextContent('10 с');

  await user.click(screen.getByRole('button', { name: 'Інший текст' }));
  act(() => vi.advanceTimersByTime(20000));
  expect(timer).toHaveTextContent('15 с');
  expect(
    screen.getByRole('textbox', { name: 'Введення тексту' }),
  ).toBeEnabled();

  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('a');
  act(() => vi.advanceTimersByTime(1000));
  expect(timer).toHaveTextContent('14 с');
});

it('shows elapsed time and completed words in word-count mode', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('x ');
  act(() => vi.advanceTimersByTime(2000));

  expect(screen.getByRole('timer', { name: 'Минуло часу' })).toHaveTextContent(
    '2 с',
  );
  expect(
    screen.getByRole('status', { name: 'Набрано слів' }),
  ).toHaveTextContent('1 / 25');
});

it('replenishes a timed passage without restarting its countdown', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  const area = screen.getByRole('region', { name: 'Текст для друку' });
  const passage = within(area).getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');
  const words = visibleText?.textContent?.split(' ') ?? [];
  expect(words).toHaveLength(100);
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  await user.click(area);
  fireEvent.change(input, { target: { value: words[0] } });
  act(() => vi.advanceTimersByTime(5000));

  act(() => {
    for (const word of words.slice(0, 81)) {
      fireEvent.change(input, { target: { value: word } });
      fireEvent.keyDown(input, { key: ' ' });
    }
  });

  expect(visibleText?.textContent?.split(' ')).toHaveLength(200);
  expect(input).toBeEnabled();
  expect(screen.getByRole('timer')).toHaveTextContent('25 с');
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole('timer')).toHaveTextContent('24 с');
});

it('updates live WPM as typing progresses and time passes', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  const speed = screen.getByRole('status', { name: 'Швидкість друку' });
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('і ');
  expect(speed).toHaveTextContent('0 WPM');

  act(() => vi.advanceTimersByTime(1000));
  expect(speed).toHaveTextContent('24 WPM');
  act(() => vi.advanceTimersByTime(1000));
  expect(speed).toHaveTextContent('12 WPM');
});
