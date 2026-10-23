import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { KeyboardHeatmap } from './KeyboardHeatmap';

it('keeps Ukrainian letters distinct and exposes corrected error counts', () => {
  render(
    <KeyboardHeatmap
      language="uk"
      profile={{
        letters: {
          ґ: { attempts: 3, errors: 2 },
          г: { attempts: 6, errors: 1 },
          є: { attempts: 1, errors: 0 },
          ї: { attempts: 2, errors: 1 },
          і: { attempts: 4, errors: 0 },
        },
        bigrams: {},
        words: {},
      }}
    />,
  );
  for (const label of [
    'ґ: помилок — 2, спроб — 3',
    'г: помилок — 1, спроб — 6',
    'є: помилок — 0, спроб — 1',
    'ї: помилок — 1, спроб — 2',
    'і: помилок — 0, спроб — 4',
  ])
    expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
  expect(screen.getByText(/включно з виправленими/)).toBeInTheDocument();
});

it('renders English letters, digits and apostrophes without tab stops', () => {
  const { container } = render(
    <KeyboardHeatmap
      language="en"
      profile={{
        letters: {
          a: { attempts: 5, errors: 1 },
          '3': { attempts: 2, errors: 1 },
          "'": { attempts: 2, errors: 1 },
        },
        bigrams: {},
        words: {},
      }}
    />,
  );
  expect(
    screen.getByRole('img', { name: 'a: помилок — 1, спроб — 5' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: '3: помилок — 1, спроб — 2' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Апостроф: помилок — 1, спроб — 2' }),
  ).toBeInTheDocument();
  expect(container.querySelectorAll('button, [tabindex]')).toHaveLength(0);
});

it('shows an uncoloured keyboard without fabricated errors', () => {
  render(
    <KeyboardHeatmap
      language="uk"
      profile={{ letters: {}, bigrams: {}, words: {} }}
    />,
  );
  expect(screen.getByText(/Помилок у літерах поки немає/)).toBeInTheDocument();
  expect(screen.queryByRole('img')).toBeNull();
});
