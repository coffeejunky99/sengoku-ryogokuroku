export const AUTO_PAUSE_SETTING_KEY_BY_REASON = {
  declaration_of_war: 'declarationOfWar',
  enemy_entry: 'enemyEntry',
  battle_start: 'battleStart',
  siege_start: 'siegeStart',
  important_death: 'importantDeath',
  historical_event: 'historicalEvent',
  low_treasury: 'lowTreasury',
} as const;

export type AutoPauseReason = keyof typeof AUTO_PAUSE_SETTING_KEY_BY_REASON;
export type AutoPauseSettingKey = (typeof AUTO_PAUSE_SETTING_KEY_BY_REASON)[AutoPauseReason];
export type AutoPauseSettings = Readonly<Record<AutoPauseSettingKey, boolean>>;

export function getAutoPauseSettingKey(reason: AutoPauseReason): AutoPauseSettingKey {
  return AUTO_PAUSE_SETTING_KEY_BY_REASON[reason];
}
