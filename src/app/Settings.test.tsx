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
