import { describe, expect, it } from 'vitest';

import type {
  AutoPauseReason,
  AutoPauseSettings,
  AutoPauseSettingKey,
} from '../../domain/time/auto-pause';

import { shouldAutoPause } from './should-auto-pause';

const AUTO_PAUSE_CASES: readonly (readonly [AutoPauseReason, AutoPauseSettingKey])[] = [
  ['declaration_of_war', 'declarationOfWar'],
  ['enemy_entry', 'enemyEntry'],
  ['battle_start', 'battleStart'],
  ['siege_start', 'siegeStart'],
  ['important_death', 'importantDeath'],
  ['historical_event', 'historicalEvent'],
  ['low_treasury', 'lowTreasury'],
];

const ENABLED_AUTO_PAUSE_SETTINGS: AutoPauseSettings = {
  declarationOfWar: true,
  enemyEntry: true,
  battleStart: true,
  siegeStart: true,
  importantDeath: true,
  historicalEvent: true,
  lowTreasury: true,
};

describe('shouldAutoPause', () => {
  it.each(AUTO_PAUSE_CASES)('returns true when %s is enabled', (reason) => {
    expect(shouldAutoPause(ENABLED_AUTO_PAUSE_SETTINGS, reason)).toBe(true);
  });

  it.each(AUTO_PAUSE_CASES)('returns false when %s is disabled', (reason, settingKey) => {
    const settings: AutoPauseSettings = {
      ...ENABLED_AUTO_PAUSE_SETTINGS,
      [settingKey]: false,
    };

    expect(shouldAutoPause(settings, reason)).toBe(false);
  });
});
