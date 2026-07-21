import { create } from 'zustand';

import type {
  AutoPauseSettings,
  AutoPauseSettingKey,
} from '../domain/time/auto-pause';

interface SettingsState {
  readonly reducedMotion: boolean;
  readonly autoPauseSettings: AutoPauseSettings;
  readonly setReducedMotion: (value: boolean) => void;
  readonly setAutoPauseSetting: (setting: AutoPauseSettingKey, enabled: boolean) => void;
  readonly resetAutoPauseSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  reducedMotion: false,
  autoPauseSettings: createInitialAutoPauseSettings(),
  setReducedMotion: (value) => {
    set({ reducedMotion: value });
  },
  setAutoPauseSetting: (setting, enabled) => {
    set((state) => ({
      autoPauseSettings: {
        ...state.autoPauseSettings,
        [setting]: enabled,
      },
    }));
  },
  resetAutoPauseSettings: () => {
    set({ autoPauseSettings: createInitialAutoPauseSettings() });
  },
}));

function createInitialAutoPauseSettings(): AutoPauseSettings {
  return {
    declarationOfWar: true,
    enemyEntry: true,
    battleStart: true,
    siegeStart: true,
    importantDeath: true,
    historicalEvent: true,
    lowTreasury: true,
  };
}
