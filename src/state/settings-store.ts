import { create } from 'zustand';

interface SettingsState {
  readonly reducedMotion: boolean;
  readonly setReducedMotion: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  reducedMotion: false,
  setReducedMotion: (value) => {
    set({ reducedMotion: value });
  },
}));
