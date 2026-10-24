import { useEffect, useEffectEvent } from 'react';

export function useEscapeReset(enabled: boolean, onReset: () => void) {
  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (
      !enabled ||
      event.key !== 'Escape' ||
      event.defaultPrevented ||
      event.isComposing ||
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    onReset();
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleEscape(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
