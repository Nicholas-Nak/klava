import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ProgressChart } from './ProgressChart';

const days = [
  {
    day: '2026-10-21',
    timestamp: Date.UTC(2026, 9, 21),
    averageWpm: 42.5,
    bestWpm: 50,
    tests: 2,
  },
  {
    day: '2026-10-24',
    timestamp: Date.UTC(2026, 9, 24),
    averageWpm: 60,
    bestWpm: 70,
    tests: 3,
  },
];

it('does not invent a chart for an empty history', () => {
  const { container } = render(<ProgressChart days={[]} />);
  expect(container).toBeEmptyDOMElement();
});

it('exposes a single training day through keyboard details', async () => {
  render(<ProgressChart days={[days[0]!]} />);
  fireEvent.focus(screen.getByRole('application'));
  const tooltip = within(
    await screen.findByRole('status', { name: 'Деталі дня' }),
  );
  expect(tooltip.getByText('21 жовтня 2026 р.')).toBeInTheDocument();
  expect(
    tooltip.getAllByRole('definition').map((value) => value.textContent),
  ).toEqual(['42,5', '50', '2']);
});

it('provides every day in a table and navigates chart details', async () => {
  render(<ProgressChart days={days} />);
  const chart = screen.getByRole('application');
  fireEvent.focus(chart);
  fireEvent.keyDown(chart, { key: 'ArrowRight' });
  expect(
    await screen.findByRole('status', { name: 'Деталі дня' }),
  ).toHaveTextContent('24 жовтня 2026 р.');
  await userEvent.click(screen.getByText('Дані прогресу'));
  const table = within(
    screen.getByRole('table', { name: 'Показники за днями' }),
  );
  expect(table.getAllByRole('row')).toHaveLength(3);
  expect(
    table.getByRole('rowheader', { name: '21 жовт.' }),
  ).toBeInTheDocument();
  expect(table.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
    '42,5',
    '50',
    '2',
    '60',
    '70',
    '3',
  ]);
});
