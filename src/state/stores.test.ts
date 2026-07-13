import { beforeEach, describe, expect, it } from 'vitest';

import { loadMapDefinition } from '../infrastructure/data/load-map-definition';

import { useGameStore } from './game-store';
import {
  selectMapDefinition,
  selectMapRenderDto,
  selectSelectedCastle,
} from './selectors/map-selectors';
import { useSettingsStore } from './settings-store';
import { useUiStore } from './ui-store';

describe('initial Zustand stores', () => {
  beforeEach(() => {
    useGameStore.setState({ initialized: false, mapDefinition: null });
    useUiStore.setState({ isBooted: false, selectedCastleId: null });
    useSettingsStore.setState({ reducedMotion: false });
  });

  it('exposes the expected initial values', () => {
    expect(useUiStore.getState().isBooted).toBe(false);
    expect(useUiStore.getState().selectedCastleId).toBeNull();
    expect(useSettingsStore.getState().reducedMotion).toBe(false);
    expect(useGameStore.getState().initialized).toBe(false);
    expect(useGameStore.getState().mapDefinition).toBeNull();
  });

  it('updates UI and settings through their actions', () => {
    const castle = loadMapDefinition().castles[0];
    if (castle === undefined) {
      throw new Error('The formal map fixture has no castle.');
    }

    useUiStore.getState().setBooted(true);
    useUiStore.getState().setSelectedCastleId(castle.id);
    useSettingsStore.getState().setReducedMotion(true);

    expect(useUiStore.getState().isBooted).toBe(true);
    expect(useUiStore.getState().selectedCastleId).toBe(castle.id);
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

  it('derives selected castle display data without duplicating it in the UI store', () => {
    useGameStore.getState().initializeMap();
    const mapDefinition = useGameStore.getState().mapDefinition;
    const castle = mapDefinition?.castles[0];
    if (castle === undefined) {
      throw new Error('The formal map fixture has no castle.');
    }

    expect(selectSelectedCastle(useGameStore.getState(), null)).toBeNull();
    expect(selectSelectedCastle(useGameStore.getState(), castle.id)).toEqual({
      id: castle.id,
      name: '春日山城',
      region: '越後',
      clanName: '上杉家',
      identificationSymbol: '竹に雀',
    });
    expect(useUiStore.getState().selectedCastleId).toBeNull();
  });
});
