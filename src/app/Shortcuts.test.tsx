import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsStorage';
import { useHistoryStore } from '../stores/historyStore';
import { App } from './App';

vi.mock('../components/SpeedChart', () => ({
  SpeedChart: () => <figure aria-label="Швидкість за секундами" />,
}));
vi.mock('../components/ProgressChart', () => ({
  ProgressChart: () => <figure aria-label="Прогрес за днями" />,
}));

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({
    settings: DEFAULT_SETTINGS,
    storageAvailable: true,
  });
  useHistoryStore.setState({ entries: [], bests: [], storageAvailable: true });
});
afterEach(() => vi.useRealTimers());

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

it('resets a running test with Escape and leaves no abandoned result in history', () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  renderApp();
  const input = screen.getByRole('textbox');
  act(() => input.focus());
  fireEvent.change(input, { target: { value: 'кіт' } });
  act(() => vi.advanceTimersByTime(2300));
  expect(screen.getByRole('timer')).toHaveTextContent('2 с');
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(input).not.toHaveFocus();
  expect(screen.getByRole('timer')).toHaveTextContent('0 с');
  expect(screen.getByRole('navigation')).toBeVisible();
  expect(useHistoryStore.getState().entries).toEqual([]);
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('timer')).toHaveTextContent('0 с');
});

it('uses the current language and mode after Escape', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('radio', { name: 'English' }));
  await user.click(screen.getByRole('radio', { name: '10' }));
  await user.click(screen.getByRole('checkbox', { name: 'Пунктуація' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('textbox')).toHaveAttribute('lang', 'en');
  expect(screen.getByRole('radio', { name: '10' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Пунктуація' })).toBeChecked();
});

it.each([
  { isComposing: true },
  { repeat: true },
  { ctrlKey: true },
  { altKey: true },
  { metaKey: true },
  { shiftKey: true },
])('ignores Escape with %j', (flags) => {
  renderApp();
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'їжак' } });
  fireEvent.keyDown(input, { key: 'Escape', ...flags });
  expect(input).toHaveValue('їжак');
});

it('does not reset a test while another page is open', async () => {
  const user = userEvent.setup();
  renderApp();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'літо' } });
  for (const page of ['Налаштування', 'Історія']) {
    await user.click(screen.getByRole('link', { name: page }));
    fireEvent.keyDown(window, { key: 'Escape' });
  }
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(screen.getByRole('textbox')).toHaveValue('літо');
});

it('restarts with Tab then Enter and puts typing focus on the fresh passage', async () => {
  const user = userEvent.setup();
  renderApp();
  const input = screen.getByRole('textbox');
  act(() => input.focus());
  await user.keyboard('кіт');
  await user.tab();
  expect(screen.getByRole('button', { name: 'Інший текст' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('textbox')).toHaveFocus();
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('timer')).toHaveTextContent('0 с');
  expect(useHistoryStore.getState().entries).toEqual([]);
  await user.keyboard('ї');
  expect(screen.getByRole('textbox')).toHaveValue('ї');
});

it('keeps ordinary Tab and Shift+Tab navigation available', async () => {
  const user = userEvent.setup();
  renderApp();
  act(() => screen.getByRole('textbox').focus());
  await user.tab({ shift: true });
  expect(screen.getByRole('checkbox', { name: 'Цифри' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('textbox')).toHaveFocus();
});

it('starts with an empty input after restarting during composition', async () => {
  const user = userEvent.setup();
  renderApp();
  const input = screen.getByRole('textbox');
  act(() => input.focus());
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'і\u0308' } });
  await user.tab();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('textbox')).toHaveFocus();
});

it('offers Tab then Enter immediately after a result without duplicating history', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  useSettingsStore
    .getState()
    .updateSettings({ defaultMode: { type: 'time', seconds: 15 } });
  const user = userEvent.setup();
  renderApp();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'а' } });
  act(() => vi.advanceTimersByTime(15000));
  expect(screen.getByRole('heading', { name: 'Тест завершено' })).toHaveFocus();
  const savedId = useHistoryStore.getState().entries[0]?.id;
  await user.tab();
  expect(screen.getByRole('button', { name: 'Ще раз' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.queryByRole('heading', { name: 'Тест завершено' })).toBeNull();
  expect(screen.getByRole('textbox')).toHaveFocus();
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('timer')).toHaveTextContent('15 с');
  expect(useHistoryStore.getState().entries.map(({ id }) => id)).toEqual([
    savedId,
  ]);
});

it('keeps result details reachable with Shift+Tab from the restart button', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  useSettingsStore
    .getState()
    .updateSettings({ defaultMode: { type: 'time', seconds: 15 } });
  const user = userEvent.setup();
  renderApp();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'а' } });
  act(() => vi.advanceTimersByTime(15000));
  await user.tab();
  await user.tab({ shift: true });
  expect(screen.getByText('Як рахуються показники')).toHaveFocus();
});

it('lets keyboard users skip navigation directly to the training controls', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.tab();
  expect(screen.getByRole('link', { name: 'До вмісту' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('main')).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('radio', { name: 'Слова' })).toHaveFocus();
});

it('skips to settings content without changing the hash route', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  await user.click(screen.getByRole('link', { name: 'До вмісту' }));
  expect(screen.getByRole('main')).toHaveFocus();
  expect(
    screen.getByRole('heading', { name: 'Налаштування' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Налаштування' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
