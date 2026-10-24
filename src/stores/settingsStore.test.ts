// @vitest-environment node
import { expect, it } from 'vitest';
import { createSettingsStore } from './settingsStore';
import { DEFAULT_SETTINGS, type SettingsStorage } from './settingsStorage';

function memoryStorage(): SettingsStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

it('updates one preference without overwriting the others and restores all changes', () => {
  const storage = memoryStorage();
  const store = createSettingsStore(storage);
  store.getState().updateSettings({ theme: 'dark' });
  store
    .getState()
    .updateSettings({ defaultMode: { type: 'time', seconds: 60 } });
  const expected = {
    ...DEFAULT_SETTINGS,
    theme: 'dark',
    defaultMode: { type: 'time', seconds: 60 },
  };
  expect(store.getState().settings).toEqual(expected);
  expect(createSettingsStore(storage).getState().settings).toEqual(expected);
});

it('uses a separate default mode object for each store', () => {
  const first = createSettingsStore(memoryStorage());
  const second = createSettingsStore(memoryStorage());
  expect(first.getState().settings.defaultMode).not.toBe(
    second.getState().settings.defaultMode,
  );
  first
    .getState()
    .updateSettings({ defaultMode: { type: 'words', count: 100 } });
  expect(second.getState().settings.defaultMode).toEqual({
    type: 'words',
    count: 25,
  });
});

it('keeps changes usable in memory when persistence is unavailable', () => {
  const store = createSettingsStore(undefined);
  store.getState().updateSettings({ theme: 'dark', fontSize: 'large' });
  expect(store.getState().settings).toEqual({
    ...DEFAULT_SETTINGS,
    theme: 'dark',
    fontSize: 'large',
  });
  expect(store.getState().storageAvailable).toBe(false);
});

it('recovers from a failed write without dropping previous changes', () => {
  let blocked = true;
  const storage = memoryStorage();
  const store = createSettingsStore({
    getItem: storage.getItem,
    setItem(key, value) {
      if (blocked) throw new Error('quota');
      storage.setItem(key, value);
    },
  });
  store.getState().updateSettings({ theme: 'dark' });
  expect(store.getState().storageAvailable).toBe(false);
  blocked = false;
  store.getState().updateSettings({ fontSize: 'small' });
  expect(store.getState().storageAvailable).toBe(true);
  expect(createSettingsStore(storage).getState().settings).toEqual({
    ...DEFAULT_SETTINGS,
    theme: 'dark',
    fontSize: 'small',
  });
});
