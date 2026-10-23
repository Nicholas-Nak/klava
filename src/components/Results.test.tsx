import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { getTestResult } from '../domain/results';
import { createTest, testReducer } from '../domain/testReducer';
import type { TestOptions } from '../types';
import { Results } from './Results';

vi.mock('./SpeedChart', () => ({
  SpeedChart: () => <figure aria-label="Швидкість за секундами" />,
}));

const options: TestOptions = {
  language: 'uk',
  punctuation: false,
  numbers: false,
  mode: { type: 'time', seconds: 15 },
};

it('shows completed metrics and focuses the result heading', async () => {
  let test = createTest(['кіт'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'ко', at: 0 });
  test = testReducer(test, { type: 'input', value: 'к', at: 100 });
  test = testReducer(test, { type: 'input', value: 'кіт', at: 200 });
  test = testReducer(test, { type: 'tick', at: 15000 });
  render(<Results result={getTestResult(test)} options={options} />);
  expect(
    await screen.findByRole('figure', { name: 'Швидкість за секундами' }),
  ).toBeInTheDocument();

  expect(screen.getByRole('heading', { name: 'Тест завершено' })).toHaveFocus();
  expect(screen.getByRole('status', { name: 'WPM' })).toHaveTextContent('2');
  expect(screen.getByRole('status', { name: 'Raw WPM' })).toHaveTextContent(
    '2',
  );
  expect(screen.getByRole('status', { name: 'Точність' })).toHaveTextContent(
    '75%',
  );
  expect(
    screen.getByRole('status', { name: 'Стабільність' }),
  ).toHaveTextContent('0%');
  expect(screen.getByRole('status', { name: 'Помилки' })).toHaveTextContent(
    '1',
  );
  expect(screen.getByRole('status', { name: 'Тривалість' })).toHaveTextContent(
    '15 с',
  );
  expect(screen.getByText('Українська · 15 с')).toBeInTheDocument();
  const breakdown = within(
    screen.getByRole('region', { name: 'Символи та виправлення' }),
  );
  expect(
    breakdown.getAllByRole('definition').map((element) => element.textContent),
  ).toEqual(['1', '0', '0', '1']);
});

it('leaves consistency unavailable for a short test and formats seconds in Ukrainian', async () => {
  const words = Array<string>(10).fill('а');
  let test = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, { type: 'input', value: 'а', at: index * 50 });
    test = testReducer(test, { type: 'advance', at: index * 50 + 25 });
  }
  render(
    <Results
      result={getTestResult(test)}
      options={{ ...options, mode: test.mode }}
    />,
  );
  expect(
    await screen.findByRole('figure', { name: 'Швидкість за секундами' }),
  ).toBeInTheDocument();

  expect(
    screen.getByRole('status', { name: 'Стабільність' }),
  ).toHaveTextContent('—');
  expect(screen.getByText('потрібно 2 с')).toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Тривалість' })).toHaveTextContent(
    '0,5 с',
  );
});

it('formats fractional accuracy without rounding it to a perfect score', async () => {
  const words = Array<string>(10).fill('кіт');
  let test = createTest(words, { type: 'words', count: 10 });
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, {
      type: 'input',
      value: index === 9 ? 'ко' : 'кіт',
      at: index * 1000,
    });
    test = testReducer(test, { type: 'advance', at: index * 1000 + 500 });
  }
  render(
    <Results
      result={getTestResult(test)}
      options={{
        ...options,
        language: 'en',
        punctuation: true,
        numbers: true,
        mode: test.mode,
      }}
    />,
  );
  expect(
    await screen.findByRole('figure', { name: 'Швидкість за секундами' }),
  ).toBeInTheDocument();

  expect(screen.getByRole('status', { name: 'Точність' })).toHaveTextContent(
    '94,9%',
  );
  expect(
    screen.getByText('English · 10 слів · пунктуація · цифри'),
  ).toBeInTheDocument();
});
