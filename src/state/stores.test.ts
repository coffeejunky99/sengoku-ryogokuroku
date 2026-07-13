import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from './game-store';
import { selectMapDefinition, selectMapRenderDto } from './selectors/map-selectors';
import { useSettingsStore } from './settings-store';
import { useUiStore } from './ui-store';

describe('initial Zustand stores', () => {
  beforeEach(() => {
    useGameStore.setState({ initialized: false, mapDefinition: null });
    useUiStore.setState({ isBooted: false });
    useSettingsStore.setState({ reducedMotion: false });
  });

  it('exposes the expected initial values', () => {
    expect(useUiStore.getState().isBooted).toBe(false);
    expect(useSettingsStore.getState().reducedMotion).toBe(false);
    expect(useGameStore.getState().initialized).toBe(false);
    expect(useGameStore.getState().mapDefinition).toBeNull();
  });

  it('updates UI and settings through their actions', () => {
    useUiStore.getState().setBooted(true);
    useSettingsStore.getState().setReducedMotion(true);

    expect(useUiStore.getState().isBooted).toBe(true);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);
    expect(useGameStore.getState().initialized).toBe(false);
  });

  it('initializes the game store with the validated formal map definition', () => {
    useGameStore.getState().initializeMap();

    const state = useGameStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.mapDefinition?.clans).toHaveLength(4);
    expect(state.mapDefinition?.castles).toHaveLength(10);
    expect(state.mapDefinition?.routes).toHaveLength(13);
  });

  it('selects the map definition and derives its render DTO', () => {
    expect(selectMapDefinition(useGameStore.getState())).toBeNull();
    expect(selectMapRenderDto(useGameStore.getState())).toBeNull();

    useGameStore.getState().initializeMap();
    const state = useGameStore.getState();
    const mapDefinition = selectMapDefinition(state);
    const mapRenderDto = selectMapRenderDto(state);

    expect(mapDefinition).toBe(state.mapDefinition);
    expect(mapRenderDto?.clans).toHaveLength(4);
    expect(mapRenderDto?.castles).toHaveLength(10);
    expect(mapRenderDto?.routes).toHaveLength(13);
  });
});
