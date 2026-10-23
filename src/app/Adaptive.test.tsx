import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHistoryEntry } from '../domain/history';
import { createTest, testReducer } from '../domain/testReducer';
import * as weakText from '../domain/weakText';
import { useHistoryStore } from '../stores/historyStore';
import type { Language } from '../types';
import { App } from './App';

vi.mock('../components/SpeedChart', () => ({
  SpeedChart: () => <figure aria-label="Швидкість за секундами" />,
}));
vi.mock('../components/ProgressChart', () => ({
  ProgressChart: () => <figure aria-label="Прогрес за днями" />,
}));

beforeEach(() => {
  localStorage.clear();
  useHistoryStore.setState({ entries: [], bests: [], storageAvailable: true });
});
afterEach(() => vi.useRealTimers());

function previousTest(language: Language, letter: string) {
  let test = createTest(['cat'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'x', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  const entry = createHistoryEntry(
    test,
    {
      language,
      mode: test.mode,
      practice: 'standard',
      punctuation: false,
      numbers: false,
    },
    `previous-${letter}`,
    '2026-10-23T16:00:00Z',
  );
  entry.mistakes = {
    letters: { [letter]: { attempts: 3, errors: 2 } },
    bigrams: {},
    words: {},
  };
  return entry;
}
function renderApp() {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

it('previews learned targets and falls back independently for another language', async () => {
  useHistoryStore.setState({ entries: [previousTest('uk', 'ї')] });
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('radio', { name: 'Слабкі місця' }));
  const preview = within(
    screen.getByRole('region', { name: 'Цілі тренування' }),
  );
  expect(preview.getByRole('definition')).toHaveTextContent('ї');
  await user.click(screen.getByRole('radio', { name: 'English' }));
  expect(
    preview.getByText(/Поки немає цілей для цієї мови/),
  ).toBeInTheDocument();
  const passage = within(
    screen.getByRole('region', { name: 'Текст для друку' }),
  ).getByRole('paragraph');
  expect(passage).toHaveAttribute('lang', 'en');
  expect(passage.textContent).toMatch(/^[a-z ]+$/);
  expect(screen.getByRole('radio', { name: 'Слабкі місця' })).toBeChecked();
});

it('hides the preview during typing and restores it after resetting', async () => {
  useHistoryStore.setState({ entries: [previousTest('uk', 'ї')] });
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('radio', { name: 'Слабкі місця' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  await user.keyboard('ї');
  expect(screen.queryByRole('region', { name: 'Цілі тренування' })).toBeNull();
  await user.tab();
  expect(screen.queryByRole('region', { name: 'Цілі тренування' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Інший текст' }));
  expect(
    screen.getByRole('region', { name: 'Цілі тренування' }),
  ).toHaveTextContent('ї');
});

it('saves adaptive word results with their own practice mode and record', async () => {
  vi.spyOn(weakText, 'generateWeakText').mockImplementation((count) =>
    Array<string>(count).fill('кіт'),
  );
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('radio', { name: '10' }));
  await user.click(screen.getByRole('radio', { name: 'Слабкі місця' }));
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  for (let i = 0; i < 9; i++) {
    fireEvent.change(input, { target: { value: 'кіт' } });
    fireEvent.keyDown(input, { key: ' ' });
  }
  fireEvent.change(input, { target: { value: 'кі' } });
  act(() => vi.advanceTimersByTime(2000));
  fireEvent.change(input, { target: { value: 'кіт' } });
  expect(
    screen.getByRole('region', { name: 'Результати тесту' }),
  ).toHaveTextContent('Українська · 10 слів · слабкі місця');
  const state = useHistoryStore.getState();
  expect(state.entries).toHaveLength(1);
  expect(state.entries[0]?.options).toMatchObject({
    practice: 'weak-spots',
    mode: { type: 'words', count: 10 },
  });
  expect(state.bests).toHaveLength(1);
  expect(state.bests[0]?.options.practice).toBe('weak-spots');
});

it('keeps targets stable when timed text is extended and refreshes them on restart', async () => {
  const generator = vi
    .spyOn(weakText, 'generateWeakText')
    .mockReturnValueOnce(Array<string>(21).fill('cat'))
    .mockImplementation((count) => Array<string>(count).fill('cat'));
  useHistoryStore.setState({ entries: [previousTest('en', 'c')] });
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('radio', { name: 'English' }));
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  await user.click(screen.getByRole('radio', { name: 'Слабкі місця' }));
  const targets = generator.mock.calls[0]?.[2];
  expect(targets?.[0]?.value).toBe('c');
  await user.click(screen.getByRole('region', { name: 'Текст для друку' }));
  const input = screen.getByRole('textbox', { name: 'Введення тексту' });
  fireEvent.change(input, { target: { value: 'cat' } });
  fireEvent.keyDown(input, { key: ' ' });
  act(() => useHistoryStore.setState({ entries: [previousTest('en', 'z')] }));
  fireEvent.change(input, { target: { value: 'cat' } });
  fireEvent.keyDown(input, { key: ' ' });
  expect(generator).toHaveBeenCalledTimes(2);
  expect(generator.mock.calls[1]?.[2]).toBe(targets);
  expect(generator.mock.calls[1]?.[4]).toBe('cat');
  await act(async () => vi.advanceTimersByTime(15000));
  await user.click(screen.getByRole('button', { name: 'Ще раз' }));
  expect(
    generator.mock.calls.at(-1)?.[2].some(({ value }) => value === 'z'),
  ).toBe(true);
});
