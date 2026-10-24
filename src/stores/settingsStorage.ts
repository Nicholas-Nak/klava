import type { TestMode } from '../types';

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  defaultMode: TestMode;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontSize: 'medium',
  defaultMode: { type: 'words', count: 25 },
};
export const SETTINGS_STORAGE_KEY = 'klava-settings';
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

function readMode(value: unknown): TestMode {
  if (typeof value === 'object' && value !== null) {
    if (
      'type' in value &&
      value.type === 'time' &&
      'seconds' in value &&
      (value.seconds === 15 ||
        value.seconds === 30 ||
        value.seconds === 60 ||
        value.seconds === 120)
    )
      return { type: 'time', seconds: value.seconds };
    if (
      'type' in value &&
      value.type === 'words' &&
      'count' in value &&
      (value.count === 10 ||
        value.count === 25 ||
        value.count === 50 ||
        value.count === 100)
    )
      return { type: 'words', count: value.count };
  }
  return { ...DEFAULT_SETTINGS.defaultMode };
}

export function readSettings(value: unknown): Settings {
  const fields =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    theme: fields.theme === 'dark' ? 'dark' : 'light',
    fontSize:
      fields.fontSize === 'small' || fields.fontSize === 'large'
        ? fields.fontSize
        : 'medium',
    defaultMode: readMode(fields.defaultMode),
  };
}

export function loadSettings(storage: SettingsStorage | undefined) {
  const fallback = { settings: readSettings(null), storageAvailable: false };
  if (!storage) return fallback;
  let raw: string | null;
  try {
    raw = storage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return fallback;
  }
  let saved: unknown;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }
  const settings =
    typeof saved === 'object' &&
    saved !== null &&
    'version' in saved &&
    saved.version === 1 &&
    'settings' in saved
      ? readSettings(saved.settings)
      : readSettings(null);
  return { settings, storageAvailable: true };
}

export function saveSettings(
  storage: SettingsStorage | undefined,
  settings: Settings,
) {
  try {
    if (!storage) return false;
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, settings: readSettings(settings) }),
    );
    return true;
  } catch {
    return false;
  }
}
