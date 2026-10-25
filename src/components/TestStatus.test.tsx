import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createTest, testReducer } from '../domain/testReducer';
import { TestStatus } from './TestStatus';

const words = Array.from({ length: 10 }, () => 'а');
const mode = { type: 'words', count: 10 } as const;

it('waits for one second before displaying live WPM', () => {
  let test = createTest(words, mode);
  test = testReducer(test, { type: 'input', value: 'а', at: 0 });
  test = testReducer(test, { type: 'tick', at: 500 });
  render(<TestStatus test={test} />);

  expect(
    screen.getByRole('status', { name: 'Швидкість друку' }),
  ).toHaveTextContent(/^0 WPM$/);
});

it('shows calculated WPM when a test finishes in less than one second', () => {
  let test = createTest(words, mode);
  for (let index = 0; index < 10; index++) {
    test = testReducer(test, { type: 'input', value: 'а', at: index * 50 });
    test = testReducer(test, { type: 'advance', at: index * 50 + 25 });
  }
  render(<TestStatus test={test} />);

  expect(test.phase).toBe('finished');
  expect(
    screen.getByRole('status', { name: 'Швидкість друку' }),
  ).toHaveTextContent(/^507 WPM$/);
});

it('updates live speed as time passes and characters are corrected or deleted', () => {
  let test = createTest(['кіт'], { type: 'time', seconds: 15 });
  test = testReducer(test, { type: 'input', value: 'кі', at: 0 });
  test = testReducer(test, { type: 'tick', at: 1000 });
  const { rerender } = render(<TestStatus test={test} />);
  const speed = screen.getByRole('status', { name: 'Швидкість друку' });
  expect(speed).toHaveTextContent(/^24 WPM$/);

  test = testReducer(test, { type: 'tick', at: 2000 });
  rerender(<TestStatus test={test} />);
  expect(speed).toHaveTextContent(/^12 WPM$/);
  test = testReducer(test, { type: 'input', value: 'кx', at: 2000 });
  rerender(<TestStatus test={test} />);
  expect(speed).toHaveTextContent(/^6 WPM$/);
  test = testReducer(test, { type: 'input', value: 'кіт', at: 2500 });
  rerender(<TestStatus test={test} />);
  expect(speed).toHaveTextContent(/^14 WPM$/);
  test = testReducer(test, { type: 'input', value: 'к', at: 3000 });
  rerender(<TestStatus test={test} />);
  expect(speed).toHaveTextContent(/^4 WPM$/);
});

it('includes submitted spaces and clears progress when a new test starts', () => {
  let test = createTest(['кіт', 'пес'], { type: 'time', seconds: 30 });
  test = testReducer(test, { type: 'input', value: 'кіт', at: 0 });
  const { rerender } = render(<TestStatus test={test} />);
  test = testReducer(test, { type: 'advance', at: 1000 });
  rerender(<TestStatus test={test} />);
  expect(
    screen.getByRole('status', { name: 'Швидкість друку' }),
  ).toHaveTextContent(/^48 WPM$/);

  test = testReducer(test, { type: 'input', value: 'п', at: 2000 });
  rerender(<TestStatus test={test} />);
  expect(
    screen.getByRole('status', { name: 'Швидкість друку' }),
  ).toHaveTextContent(/^30 WPM$/);

  test = testReducer(test, {
    type: 'reset',
    words: ['cat'],
    mode: { type: 'time', seconds: 15 },
  });
  rerender(<TestStatus test={test} />);
  expect(
    screen.getByRole('status', { name: 'Швидкість друку' }),
  ).toHaveTextContent(/^0 WPM$/);
  expect(screen.getByRole('timer')).toHaveTextContent('15 с');
});
