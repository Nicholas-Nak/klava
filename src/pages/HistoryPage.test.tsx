import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { createHistoryEntry } from '../domain/history';
import { createTest, testReducer } from '../domain/testReducer';
import { useHistoryStore } from '../stores/historyStore';
import type { Language } from '../types';
import { HistoryPage } from './HistoryPage';

function entry(id: string, language: Language) {
  let test = createTest(['cat'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'ca', at: 0 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  return createHistoryEntry(
    test,
    {
      language,
      mode: test.mode,
      practice: 'standard',
      punctuation: false,
      numbers: false,
    },
    id,
    '2026-10-23T16:00:00Z',
  );
}

beforeEach(() =>
  useHistoryStore.setState({ entries: [], bests: [], storageAvailable: true }),
);

it('starts without invented records and focuses the page heading', () => {
  render(<HistoryPage initialLanguage="uk" />);
  expect(screen.getByRole('heading', { name: 'Історія' })).toHaveFocus();
  expect(screen.queryByText(/Особисті рекорди/)).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});

it('filters both history and personal records by language', async () => {
  const uk = entry('uk', 'uk');
  const en = entry('en', 'en');
  en.options.practice = 'weak-spots';
  en.options.numbers = true;
  en.options.punctuation = true;
  useHistoryStore.setState({ entries: [en, uk], bests: [en, uk] });
  const user = userEvent.setup();
  render(<HistoryPage initialLanguage="uk" />);
  await user.click(screen.getByText(/Особисті рекорди/));
  expect(screen.getByRole('definition')).toHaveTextContent('2 WPM');
  expect(screen.getAllByRole('row')).toHaveLength(2);
  expect(screen.queryByText('English · 15 с')).toBeNull();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Мова' }),
    'en',
  );
  expect(screen.getByText('English · 15 с')).toBeInTheDocument();
  expect(
    within(screen.getByRole('term')).getByText(
      'Слабкі місця · пунктуація · цифри',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('Українська · 15 с')).toBeNull();
});

it('shows a retained record even when recent history is empty', async () => {
  useHistoryStore.setState({ bests: [entry('record', 'en')] });
  render(<HistoryPage initialLanguage="en" />);
  await userEvent.click(screen.getByText(/Особисті рекорди/));
  expect(screen.getByRole('definition')).toHaveTextContent('2 WPM');
  expect(
    screen.getByText('Тут з’являться результати завершених тестів.'),
  ).toBeInTheDocument();
});

it('reports unavailable persistence without hiding in-memory results', () => {
  useHistoryStore.setState({
    entries: [entry('unsaved', 'uk')],
    storageAvailable: false,
  });
  render(<HistoryPage initialLanguage="uk" />);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Не вдалося зберегти історію',
  );
  expect(screen.getAllByRole('row')).toHaveLength(2);
});
