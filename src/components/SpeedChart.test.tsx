import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { SpeedChart } from './SpeedChart';

it('explains why a zero-duration result has no graph', () => {
  render(<SpeedChart samples={[]} />);
  expect(
    screen.getByText('Замало часу для побудови графіка.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('application')).toBeNull();
});

it('shows errors at zero WPM and exposes second details through the keyboard', async () => {
  render(
    <SpeedChart
      samples={[
        { second: 1, wpm: 0, rawWpm: 24, errors: 2, typed: 2 },
        { second: 2, wpm: 12, rawWpm: 24, errors: 0, typed: 2 },
      ]}
    />,
  );
  expect(
    screen.getByRole('img', { name: 'Помилки, 1 с: 2' }),
  ).toBeInTheDocument();
  const chart = screen.getByRole('application');
  fireEvent.focus(chart);
  const tooltip = within(
    await screen.findByRole('status', { name: 'Деталі секунди' }),
  );
  expect(tooltip.getByText('1 с')).toBeInTheDocument();
  expect(
    tooltip.getAllByRole('definition').map((element) => element.textContent),
  ).toEqual(['0', '24', '2']);
  fireEvent.keyDown(chart, { key: 'ArrowRight' });
  expect(tooltip.getByText('2 с')).toBeInTheDocument();
  expect(
    tooltip.getAllByRole('definition').map((element) => element.textContent),
  ).toEqual(['12', '24', '0']);
});

it('keeps the actual fractional second for a single-point result', async () => {
  render(
    <SpeedChart
      samples={[{ second: 0.45, wpm: 507, rawWpm: 507, errors: 0, typed: 19 }]}
    />,
  );
  const chart = screen.getByRole('application');
  fireEvent.focus(chart);
  fireEvent.keyDown(chart, { key: 'ArrowRight' });
  const tooltip = within(
    await screen.findByRole('status', { name: 'Деталі секунди' }),
  );
  expect(tooltip.getByText('0,45 с')).toBeInTheDocument();
  expect(
    tooltip.getAllByRole('definition').map((element) => element.textContent),
  ).toEqual(['507', '507', '0']);
});
