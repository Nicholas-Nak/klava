import { getPersonalBests } from '../domain/records';
import { create } from 'zustand';
import type { HistoryEntry } from '../domain/history';
import {
  HISTORY_LIMIT,
  loadHistory,
  saveHistory,
  type HistoryStorage,
} from './historyStorage';

interface HistoryState {
  entries: HistoryEntry[];
  bests: HistoryEntry[];
  storageAvailable: boolean;
  addEntry: (entry: HistoryEntry) => void;
}

export function createHistoryStore(storage: HistoryStorage | undefined) {
  return create<HistoryState>()((set, get) => ({
    ...loadHistory(storage),
    addEntry(entry) {
      if (get().entries.some((saved) => saved.id === entry.id)) return;
      const entries = [entry, ...get().entries].slice(0, HISTORY_LIMIT);
      const bests = getPersonalBests([entry, ...get().bests]);
      const storageAvailable = saveHistory(storage, entries, bests);
      set({ entries, bests, storageAvailable });
    },
  }));
}

function browserStorage(): HistoryStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export const useHistoryStore = createHistoryStore(browserStorage());
