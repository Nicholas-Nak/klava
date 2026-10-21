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
  ).toHaveTextContent('0 WPM');
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
  ).toHaveTextContent('507 WPM');
});
