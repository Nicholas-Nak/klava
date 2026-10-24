import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
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

it('changes the document theme and keeps it when returning to practice', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  expect(screen.getByRole('heading', { name: 'Налаштування' })).toHaveFocus();
  await user.click(screen.getByRole('radio', { name: 'Темна' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  expect(screen.getByRole('radio', { name: 'Темна' })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'Світла' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
});

it('applies an already saved theme on the first render', () => {
  useSettingsStore.getState().updateSettings({ theme: 'dark' });
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
});

it('preserves the current word while changing the theme', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'кіт' } });
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  await user.click(screen.getByRole('radio', { name: 'Темна' }));
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(screen.getByRole('textbox')).toHaveValue('кіт');
});

it('shows a persistence warning only when storage is unavailable', () => {
  useSettingsStore.setState({ storageAvailable: false });
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Не вдалося зберегти налаштування',
  );
});

it('applies text size without changing the theme or the current word', async () => {
  const user = userEvent.setup();
  useSettingsStore.getState().updateSettings({ theme: 'dark' });
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'їжак' } });
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  for (const [label, size] of [
    ['Малий', 'small'],
    ['Великий', 'large'],
    ['Середній', 'medium'],
  ] as const) {
    await user.click(screen.getByRole('radio', { name: label }));
    expect(document.documentElement).toHaveAttribute('data-font-size', size);
    expect(screen.getByLabelText('Приклад розміру тексту')).toHaveTextContent(
      'їжак',
    );
  }
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByRole('textbox')).toHaveValue('їжак');
});

it.each([15, 30, 60, 120] as const)(
  'starts a new visit in the saved %i second mode',
  (seconds) => {
    useSettingsStore
      .getState()
      .updateSettings({ defaultMode: { type: 'time', seconds } });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('radio', { name: 'Час' })).toBeChecked();
    expect(screen.getByRole('radio', { name: `${seconds} с` })).toBeChecked();
    expect(screen.getByRole('timer')).toHaveTextContent(`${seconds} с`);
  },
);

it.each([10, 25, 50, 100] as const)(
  'starts a new visit with the saved %i word count',
  (count) => {
    useSettingsStore
      .getState()
      .updateSettings({ defaultMode: { type: 'words', count } });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('radio', { name: 'Слова' })).toBeChecked();
    expect(screen.getByRole('radio', { name: String(count) })).toBeChecked();
    expect(
      screen.getByRole('status', { name: 'Набрано слів' }),
    ).toHaveTextContent(`0 / ${count}`);
  },
);

it('applies a changed default on the next visit without resetting the current test', async () => {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'літо' } });
  await user.click(screen.getByRole('link', { name: 'Налаштування' }));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Режим при відкритті' }),
    'time-60',
  );
  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  expect(screen.getByRole('textbox')).toHaveValue('літо');
  expect(screen.getByRole('radio', { name: 'Слова' })).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Інший текст' }));
  expect(screen.getByRole('radio', { name: '25' })).toBeChecked();
  view.unmount();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('radio', { name: '60 с' })).toBeChecked();
  expect(screen.getByRole('textbox')).toHaveValue('');
});
