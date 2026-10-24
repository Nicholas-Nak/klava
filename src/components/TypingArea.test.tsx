import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { createTest } from '../domain/testReducer';
import { TypingArea } from './TypingArea';

function renderTypingArea() {
  const onInput = vi.fn();
  const onAdvance = vi.fn();
  const onFocusChange = vi.fn();
  render(
    <TypingArea
      test={createTest(Array<string>(10).fill('їжак'), {
        type: 'words',
        count: 10,
      })}
      language="uk"
      focused
      onFocusChange={onFocusChange}
      onInput={onInput}
      onAdvance={onAdvance}
    />,
  );
  return {
    input: screen.getByRole('textbox', { name: 'Введення тексту' }),
    onInput,
    onAdvance,
    onFocusChange,
  };
}

it('waits for a composed character to be confirmed before submitting it', () => {
  const { input, onInput } = renderTypingArea();
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'і' } });
  fireEvent.change(input, { target: { value: 'і\u0308' } });

  expect(input).toHaveValue('і\u0308');
  expect(onInput).not.toHaveBeenCalled();

  fireEvent.compositionEnd(input, { data: 'і\u0308' });

  expect(onInput).toHaveBeenCalledExactlyOnceWith('і\u0308');
});

it('does not advance a word while Space confirms a composition', () => {
  const { input, onAdvance } = renderTypingArea();
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'ї' } });
  fireEvent.keyDown(input, { key: ' ' });

  expect(onAdvance).not.toHaveBeenCalled();
});

it('discards an unfinished composition after leaving the input', () => {
  const { input, onInput, onFocusChange } = renderTypingArea();
  fireEvent.focus(input);
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'ї' } });
  fireEvent.blur(input);
  fireEvent.compositionEnd(input, { data: 'ї' });

  expect(input).toHaveValue('');
  expect(onInput).not.toHaveBeenCalled();
  expect(onFocusChange).toHaveBeenLastCalledWith(false);
});

it('uses the selected text language for native keyboard input', () => {
  const { input } = renderTypingArea();
  expect(input).toHaveAttribute('lang', 'uk');
});

it('uses a text keyboard with a next-word action', () => {
  const { input } = renderTypingArea();
  expect(input).toHaveAttribute('inputmode', 'text');
  expect(input).toHaveAttribute('enterkeyhint', 'next');
});

it('submits the current word with Enter without adding a character', () => {
  const { input, onInput, onAdvance } = renderTypingArea();
  expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);
  expect(onAdvance).toHaveBeenCalledOnce();
  expect(onInput).not.toHaveBeenCalled();
});

it('lets Enter confirm a composition instead of submitting the word', () => {
  const { input, onAdvance } = renderTypingArea();
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'ї' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onAdvance).not.toHaveBeenCalled();
});
