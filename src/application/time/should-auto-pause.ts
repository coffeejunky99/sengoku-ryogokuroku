import {
  getAutoPauseSettingKey,
  type AutoPauseReason,
  type AutoPauseSettings,
} from '../../domain/time/auto-pause';

export function shouldAutoPause(
  settings: AutoPauseSettings,
  reason: AutoPauseReason,
): boolean {
  return settings[getAutoPauseSettingKey(reason)];
}
