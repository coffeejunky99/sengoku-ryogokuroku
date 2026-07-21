import { describe, expect, it } from 'vitest';

import {
  AUTO_PAUSE_SETTING_KEY_BY_REASON,
  getAutoPauseSettingKey,
  type AutoPauseReason,
  type AutoPauseSettingKey,
} from './auto-pause';

const AUTO_PAUSE_CASES: readonly (readonly [AutoPauseReason, AutoPauseSettingKey])[] = [
  ['declaration_of_war', 'declarationOfWar'],
  ['enemy_entry', 'enemyEntry'],
  ['battle_start', 'battleStart'],
  ['siege_start', 'siegeStart'],
  ['important_death', 'importantDeath'],
  ['historical_event', 'historicalEvent'],
  ['low_treasury', 'lowTreasury'],
];

describe('auto-pause domain contract', () => {
  it.each(AUTO_PAUSE_CASES)('maps %s to %s', (reason, settingKey) => {
    expect(getAutoPauseSettingKey(reason)).toBe(settingKey);
  });

  it('contains only the seven formal reason mappings', () => {
    expect(AUTO_PAUSE_SETTING_KEY_BY_REASON).toEqual({
      declaration_of_war: 'declarationOfWar',
      enemy_entry: 'enemyEntry',
      battle_start: 'battleStart',
      siege_start: 'siegeStart',
      important_death: 'importantDeath',
      historical_event: 'historicalEvent',
      low_treasury: 'lowTreasury',
    });
  });
});
