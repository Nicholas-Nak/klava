import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import * as textGenerator from '../domain/text';
import { useHistoryStore } from '../stores/historyStore';
import { App } from './App';

vi.mock('../components/SpeedChart', () => ({
  SpeedChart: () => {
    throw new Error('Speed chart unavailable');
  },
}));
vi.mock('../components/ProgressChart', () => ({
  ProgressChart: () => {
    throw new Error('Progress chart unavailable');
  },
}));

afterEach(() => vi.useRealTimers());

it('saves results and keeps restart and history usable when charts fail', async () => {
  localStorage.clear();
  useHistoryStore.setState({ entries: [], bests: [], storageAvailable: true });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(textGenerator, 'generateText').mockImplementation((count) =>
    Array<string>(count).fill('кіт'),
  );
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('radio', { name: 'Час' }));
  await user.click(screen.getByRole('radio', { name: '15 с' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Введення тексту' }), {
    target: { value: 'кіт' },
  });
  act(() => vi.advanceTimersByTime(15000));

  expect(
    await screen.findByRole('button', { name: 'Оновити сторінку' }),
  ).toBeEnabled();
  expect(screen.getByRole('status', { name: 'WPM' })).toHaveTextContent('2');
  expect(useHistoryStore.getState().entries).toHaveLength(1);
  await user.click(screen.getByRole('link', { name: 'Історія' }));
  expect(
    await screen.findByRole('button', { name: 'Оновити сторінку' }),
  ).toBeEnabled();
  expect(
    within(screen.getByRole('table')).getByText('Українська · 15 с'),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: 'Тренування' }));
  await user.click(screen.getByRole('button', { name: 'Ще раз' }));
  expect(screen.getByRole('textbox', { name: 'Введення тексту' })).toHaveValue(
    '',
  );
  expect(
    screen.queryByRole('button', { name: 'Оновити сторінку' }),
  ).not.toBeInTheDocument();
  expect(useHistoryStore.getState().entries).toHaveLength(1);
});
