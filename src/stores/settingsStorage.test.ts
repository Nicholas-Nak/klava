// @vitest-environment node
import { expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  readSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  type SettingsStorage,
} from './settingsStorage';

it('restores supported preferences without retaining unrelated data', () => {
  expect(
    readSettings({
      theme: 'dark',
      fontSize: 'large',
      defaultMode: { type: 'time', seconds: 120, extra: true },
      transcript: 'unused',
    }),
  ).toEqual({
    theme: 'dark',
    fontSize: 'large',
    defaultMode: { type: 'time', seconds: 120 },
  });
});

it('falls back per field without losing other valid preferences', () => {
  expect(
    readSettings({
      theme: 'dark',
      fontSize: 999,
      defaultMode: { type: 'words', count: 2 },
    }),
  ).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' });
  expect(
    readSettings({
      theme: 'unknown',
      fontSize: 'small',
      defaultMode: { type: 'words', count: 100 },
    }),
  ).toEqual({
    theme: 'light',
    fontSize: 'small',
    defaultMode: { type: 'words', count: 100 },
  });
});

it.each([null, [], 'dark', 42])(
  'uses defaults for invalid root data: %j',
  (value) => {
    expect(readSettings(value)).toEqual(DEFAULT_SETTINGS);
  },
);

it('saves a versioned record that can be restored independently', () => {
  const values = new Map<string, string>();
  const storage: SettingsStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  const settings = { ...DEFAULT_SETTINGS, theme: 'dark' as const };
  expect(saveSettings(storage, settings)).toBe(true);
  expect(loadSettings(storage)).toEqual({ settings, storageAvailable: true });
  expect(JSON.parse(values.get(SETTINGS_STORAGE_KEY)!)).toEqual({
    version: 1,
    settings,
  });
});

it.each(['{broken', '{}', '{"version":2,"settings":{"theme":"dark"}}'])(
  'ignores unsupported data without reporting blocked storage: %s',
  (raw) => {
    expect(loadSettings({ getItem: () => raw, setItem: () => {} })).toEqual({
      settings: DEFAULT_SETTINGS,
      storageAvailable: true,
    });
  },
);

it('handles blocked reads and failed writes', () => {
  const storage: SettingsStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('quota');
    },
  };
  for (const unavailable of [undefined, storage]) {
    expect(loadSettings(unavailable)).toEqual({
      settings: DEFAULT_SETTINGS,
      storageAvailable: false,
    });
    expect(saveSettings(unavailable, DEFAULT_SETTINGS)).toBe(false);
  }
});
