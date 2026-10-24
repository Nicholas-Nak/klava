import { create } from 'zustand';
import {
  loadSettings,
  readSettings,
  saveSettings,
  type Settings,
  type SettingsStorage,
} from './settingsStorage';

interface SettingsState {
  settings: Settings;
  storageAvailable: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function createSettingsStore(storage: SettingsStorage | undefined) {
  return create<SettingsState>()((set, get) => ({
    ...loadSettings(storage),
    updateSettings(patch) {
      const settings = readSettings({ ...get().settings, ...patch });
      set({ settings, storageAvailable: saveSettings(storage, settings) });
    },
  }));
}

function browserStorage(): SettingsStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export const useSettingsStore = createSettingsStore(browserStorage());
