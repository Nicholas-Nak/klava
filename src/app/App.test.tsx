import { StrictMode, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import {
  act,
  fireEvent,
  render as renderView,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as textGenerator from '../domain/text';
import { App } from './App';
import { useHistoryStore } from '../stores/historyStore';
import { HISTORY_STORAGE_KEY } from '../stores/historyStorage';

function render(ui: ReactNode) {
  return renderView(<MemoryRouter>{ui}</MemoryRouter>);
}

vi.mock('../components/ProgressChart', () => ({
  ProgressChart: () => <figure aria-label="Прогрес за днями" />,
}));

vi.mock('../components/SpeedChart', () => ({
  SpeedChart: () => <figure aria-label="Швидкість за секундами" />,
}));

beforeEach(() => {
  localStorage.clear();
  useHistoryStore.setState({ entries: [], bests: [], storageAvailable: true });
});
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
  await user.tab();
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
  await screen.findByRole('figure', { name: 'Швидкість за секундами' });

  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.getByRole('status', { name: 'Точність' })).toHaveTextContent(
    '100%',
  );
  expect(screen.getByRole('heading', { name: 'Тест завершено' })).toHaveFocus();

  const restart = screen.getByRole('button', { name: 'Ще раз' });
  await user.click(restart);

  expect(screen.queryByRole('heading', { name: 'Тест завершено' })).toBeNull();
  expect(
    screen.getByRole('textbox', { name: 'Введення тексту' }),
  ).toBeEnabled();
  expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
  expect(screen.getByRole('radio', { name: '10' })).toBeChecked();
  expect(restart).toHaveFocus();
  expect(
    screen.getByText('Натисніть на текст, щоб почати'),
  ).toBeInTheDocument();
});

it('does not start a test from pasted text', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.paste('copied words');

  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    '',
  );
  expect(screen.getByText('Почніть друкувати')).toBeInTheDocument();
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

  await act(async () => vi.advanceTimersByTime(14000));
  await screen.findByRole('figure', { name: 'Швидкість за секундами' });
  expect(screen.queryByRole('timer')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.getByRole('status', { name: 'Тривалість' })).toHaveTextContent(
    '15 с',
  );
  expect(screen.getByRole('heading', { name: 'Тест завершено' })).toHaveFocus();
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
  const shortPassage = Array.from({ length: 21 }, (_, index) =>
    index % 2 === 0 ? 'і' : 'в',
  );
  vi.spyOn(textGenerator, 'generateText')
    .mockReturnValueOnce(Array<string>(25).fill('кіт'))
    .mockReturnValueOnce(shortPassage);
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  const area = screen.getByRole('region', { name: 'Текст для друку' });
  const passage = within(area).getByRole('paragraph');
  const visibleText = passage.querySelector('[aria-hidden="true"]');
  const words = visibleText?.textContent?.split(' ') ?? [];
  expect(words).toHaveLength(21);
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  await user.click(area);
  fireEvent.change(input, { target: { value: words[0] } });
  act(() => vi.advanceTimersByTime(5000));

  await user.keyboard(` ${words[1]} `);

  expect(visibleText?.textContent?.split(' ')).toHaveLength(121);
  expect(visibleText?.textContent?.split(' ').slice(0, 21)).toEqual(words);
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

it('keeps the native input caret at the end of the current word', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('abc{ArrowLeft}x');

  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    'abcx',
  );
});

it('hides controls while typing and restores them when focus leaves the text', async () => {
  const user = userEvent.setup();
  render(<App />);
  const area = screen.getByRole('region', { name: 'Текст для друку' });
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  await user.click(area);
  expect(screen.getByText('Почніть друкувати')).toBeInTheDocument();
  await user.keyboard('кі');

  expect(screen.queryByRole('heading', { name: 'Klava' })).toBeNull();
  expect(screen.queryByRole('radio', { name: 'English' })).toBeNull();
  expect(input).toHaveFocus();

  await user.tab();

  expect(screen.getByRole('heading', { name: 'Klava' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'English' })).toBeInTheDocument();
  expect(
    screen.getByText('Час продовжує йти. Натисніть на текст, щоб продовжити'),
  ).toBeInTheDocument();

  await user.click(area);
  await user.keyboard('т');
  expect(input).toHaveValue('кіт');
  expect(
    screen.queryByText('Час продовжує йти. Натисніть на текст, щоб продовжити'),
  ).toBeNull();
});

it('keeps the countdown running after focus leaves the text', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('a');
  await user.tab();
  act(() => vi.advanceTimersByTime(3000));

  expect(screen.getByRole('timer')).toHaveTextContent('12 с');
  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    'a',
  );
  expect(screen.getByRole('radio', { name: 'Час' })).toBeChecked();
});

it('starts the timer only after a composed character is confirmed', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'і\u0308' } });
  act(() => vi.advanceTimersByTime(5000));

  expect(screen.getByRole('timer')).toHaveTextContent('15 с');
  expect(screen.getByRole('radio', { name: 'Час' })).toBeChecked();

  fireEvent.compositionEnd(input, { data: 'і\u0308' });
  act(() => vi.advanceTimersByTime(1000));

  expect(input).toHaveValue('ї');
  expect(screen.getByRole('timer')).toHaveTextContent('14 с');
});

it('discards an unconfirmed character when the countdown expires', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('а');
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'аї' } });
  await act(async () => vi.advanceTimersByTime(15000));
  await screen.findByRole('figure', { name: 'Швидкість за секундами' });
  fireEvent.compositionEnd(input, { data: 'ї' });

  expect(input).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Raw WPM' })).toHaveTextContent(
    '1',
  );
  expect(screen.getByRole('heading', { name: 'Тест завершено' })).toHaveFocus();
});

it('retains corrected attempts in a result and clears them for the next test', async () => {
  vi.spyOn(textGenerator, 'generateText').mockImplementation((count) =>
    Array<string>(count).fill('кіт'),
  );
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: '10' }));

  for (const corrected of [true, false]) {
    await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
    const input = screen.getByRole('textbox', { name: 'Введення тексту' });
    if (corrected) {
      fireEvent.change(input, { target: { value: 'x' } });
      fireEvent.change(input, { target: { value: '' } });
    }
    for (let word = 0; word < 9; word++) {
      fireEvent.change(input, { target: { value: 'кіт' } });
      fireEvent.keyDown(input, { key: ' ' });
    }
    fireEvent.change(input, { target: { value: 'кі' } });
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.change(input, { target: { value: 'кіт' } });
    await screen.findByRole('figure', { name: 'Швидкість за секундами' });

    expect(screen.getByRole('status', { name: 'WPM' })).toHaveTextContent(
      /^234$/,
    );
    expect(screen.getByRole('status', { name: 'Raw WPM' })).toHaveTextContent(
      /^234$/,
    );
    expect(screen.getByRole('status', { name: 'Точність' })).toHaveTextContent(
      corrected ? '97,5%' : '100%',
    );
    expect(screen.getByRole('status', { name: 'Помилки' })).toHaveTextContent(
      corrected ? '1' : '0',
    );
    expect(
      within(screen.getByRole('region', { name: 'Символи та виправлення' }))
        .getAllByRole('definition')
        .map((element) => element.textContent),
    ).toEqual(corrected ? ['1', '0', '0', '1'] : ['0', '0', '0', '0']);

    await user.click(screen.getByRole('button', { name: 'Ще раз' }));
  }
});

it('records a completed countdown once and creates another identity after restart', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  for (let round = 1; round <= 2; round++) {
    await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
    await user.keyboard('а');
    await act(async () => vi.advanceTimersByTime(15000));
    expect(useHistoryStore.getState().entries).toHaveLength(round);
    const saved = useHistoryStore.getState().entries[0];
    expect(saved?.options.mode).toEqual({ type: 'time', seconds: 15 });
    expect(saved?.options.language).toBe('uk');
    expect(saved?.result.elapsedMs).toBe(15000);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toContain(saved?.id);
    await user.click(screen.getByRole('button', { name: 'Ще раз' }));
  }
  const entries = useHistoryStore.getState().entries;
  expect(entries[0]?.id).not.toBe(entries[1]?.id);
});

it('does not record idle or abandoned tests', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Інший текст' }));
  expect(useHistoryStore.getState().entries).toEqual([]);
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('кі');
  await user.tab();
  await user.click(screen.getByRole('button', { name: 'Інший текст' }));
  expect(useHistoryStore.getState().entries).toEqual([]);
});

it('opens history and returns to the current training options', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'English' }));
  await user.click(screen.getByRole('link', { name: 'Історія' }));
  expect(screen.getByRole('heading', { name: 'Історія' })).toHaveFocus();
  expect(screen.getByRole('combobox', { name: 'Мова' })).toHaveValue('en');
  expect(screen.getByRole('link', { name: 'Історія' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(screen.queryByRole('textbox', { name: 'Введення тексту' })).toBeNull();
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
});

it('records a running countdown that finishes while history is open', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('а');
  await user.tab();
  await user.click(screen.getByRole('link', { name: 'Історія' }));
  await act(async () => vi.advanceTimersByTime(15000));
  expect(screen.getAllByRole('row')).toHaveLength(2);
  expect(useHistoryStore.getState().entries).toHaveLength(1);
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(
    screen.getByRole('heading', { name: 'Тест завершено' }),
  ).toBeInTheDocument();
});

it('advances with Enter and leaves an empty word untouched', () => {
  render(<App />);
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(
    screen.getByRole('status', { name: 'Набрано слів' }),
  ).toHaveTextContent('0 / 25');
  fireEvent.change(input, { target: { value: 'кіт' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input).toHaveValue('');
  expect(
    screen.getByRole('status', { name: 'Набрано слів' }),
  ).toHaveTextContent('1 / 25');
});
