import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from './game-store';
import { useSettingsStore } from './settings-store';
import { useUiStore } from './ui-store';

describe('initial Zustand stores', () => {
  beforeEach(() => {
    useUiStore.setState({ isBooted: false });
    useSettingsStore.setState({ reducedMotion: false });
  });

  it('exposes the expected initial values', () => {
    expect(useUiStore.getState().isBooted).toBe(false);
    expect(useSettingsStore.getState().reducedMotion).toBe(false);
    expect(useGameStore.getState().initialized).toBe(false);
  });

  it('updates UI and settings through their actions', () => {
    useUiStore.getState().setBooted(true);
    useSettingsStore.getState().setReducedMotion(true);

    expect(useUiStore.getState().isBooted).toBe(true);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);
    expect(useGameStore.getState().initialized).toBe(false);
  });
});
