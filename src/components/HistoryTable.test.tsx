import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { HistoryEntry } from '../domain/history';
import { HistoryTable } from './HistoryTable';

const entry: HistoryEntry = {
  id: 'one',
  completedAt: '2026-10-23T16:00:00.000Z',
  options: {
    language: 'uk',
    mode: { type: 'words', count: 25 },
    punctuation: false,
    numbers: false,
    practice: 'standard',
  },
  result: {
    elapsedMs: 12000,
    wpm: 65,
    rawWpm: 70,
    accuracy: 92.5,
    consistency: null,
    errors: 6,
    counts: { correct: 130, incorrect: 6, extra: 0, missed: 0, deleted: 0 },
  },
  mistakes: { letters: {}, bigrams: {}, words: {} },
};

it('explains an empty history without sample results', () => {
  render(<HistoryTable entries={[]} />);
  expect(
    screen.getByText('Тут з’являться результати завершених тестів.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('table')).toBeNull();
});

it('shows saved metrics and a machine-readable completion date', () => {
  render(<HistoryTable entries={[entry]} />);
  const rows = screen.getAllByRole('row');
  const row = rows[1]!;
  expect(
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent),
  ).toEqual([
    'Українська · 25 слівЗвичайне',
    '65',
    '70',
    '92,5%',
    '—',
    '6',
    '12 с',
  ]);
  expect(row.querySelector('time')).toHaveAttribute(
    'datetime',
    entry.completedAt,
  );
  expect(
    screen.getByRole('region', { name: 'Результати в історії' }),
  ).toHaveAttribute('tabindex', '0');
});

it('identifies timed adaptive tests with punctuation and numbers', () => {
  render(
    <HistoryTable
      entries={[
        {
          ...entry,
          options: {
            language: 'en',
            mode: { type: 'time', seconds: 60 },
            practice: 'weak-spots',
            punctuation: true,
            numbers: true,
          },
          result: { ...entry.result, consistency: 84.25 },
        },
      ]}
    />,
  );
  expect(screen.getByText('English · 60 с')).toBeInTheDocument();
  expect(
    screen.getByText('Слабкі місця · пунктуація · цифри'),
  ).toBeInTheDocument();
  expect(screen.getByText('84,3%')).toBeInTheDocument();
});
