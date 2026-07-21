import { beforeEach, describe, expect, it } from 'vitest';

import type { AutoPauseSettingKey } from '../domain/time/auto-pause';

import { useSettingsStore } from './settings-store';

const AUTO_PAUSE_SETTING_KEYS: readonly AutoPauseSettingKey[] = [
  'declarationOfWar',
  'enemyEntry',
  'battleStart',
  'siegeStart',
  'importantDeath',
  'historicalEvent',
  'lowTreasury',
];

const ENABLED_AUTO_PAUSE_SETTINGS = {
  declarationOfWar: true,
  enemyEntry: true,
  battleStart: true,
  siegeStart: true,
  importantDeath: true,
  historicalEvent: true,
  lowTreasury: true,
};

describe('settings store auto-pause settings', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetAutoPauseSettings();
  });

  it('starts with all seven auto-pause settings enabled', () => {
    expect(useSettingsStore.getState().autoPauseSettings).toEqual(
      ENABLED_AUTO_PAUSE_SETTINGS,
    );
  });

  it.each(AUTO_PAUSE_SETTING_KEYS)('updates only %s to false', (settingKey) => {
    useSettingsStore.getState().setAutoPauseSetting(settingKey, false);

    expect(useSettingsStore.getState().autoPauseSettings).toEqual({
      ...ENABLED_AUTO_PAUSE_SETTINGS,
      [settingKey]: false,
    });
  });

  it.each(AUTO_PAUSE_SETTING_KEYS)('can restore %s to true', (settingKey) => {
    useSettingsStore.getState().setAutoPauseSetting(settingKey, false);
    useSettingsStore.getState().setAutoPauseSetting(settingKey, true);

    expect(useSettingsStore.getState().autoPauseSettings).toEqual(
      ENABLED_AUTO_PAUSE_SETTINGS,
    );
  });

  it('resets all auto-pause settings to their formal defaults', () => {
    for (const settingKey of AUTO_PAUSE_SETTING_KEYS) {
      useSettingsStore.getState().setAutoPauseSetting(settingKey, false);
    }

    useSettingsStore.getState().resetAutoPauseSettings();

    expect(useSettingsStore.getState().autoPauseSettings).toEqual(
      ENABLED_AUTO_PAUSE_SETTINGS,
    );
  });
});
