import { render, screen } from '@testing-library/react';
import { lazy, Suspense } from 'react';
import { expect, it, vi } from 'vitest';
import { ChartBoundary } from './ChartBoundary';

it('keeps the surrounding page usable when a chart import fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const MissingChart = lazy(() =>
    Promise.reject(new Error('Chart unavailable')),
  );
  render(
    <>
      <h2>Результати</h2>
      <ChartBoundary>
        <Suspense fallback={<p>Завантаження графіка…</p>}>
          <MissingChart />
        </Suspense>
      </ChartBoundary>
      <button type="button">Ще раз</button>
    </>,
  );

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Не вдалося показати графік.',
  );
  expect(
    screen.getByRole('button', { name: 'Оновити сторінку' }),
  ).toBeEnabled();
  expect(
    screen.getByRole('heading', { name: 'Результати' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ще раз' })).toBeEnabled();
  expect(screen.queryByText('Завантаження графіка…')).not.toBeInTheDocument();
});

it('shows a working chart without an error message', () => {
  render(
    <ChartBoundary>
      <figure aria-label="Швидкість за секундами" />
    </ChartBoundary>,
  );
  expect(screen.getByRole('figure')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
