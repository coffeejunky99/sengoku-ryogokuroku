import { create } from 'zustand';

import type { MapDefinition } from '../domain/types/map-definition';
import { loadMapDefinition } from '../infrastructure/data/load-map-definition';

export interface GameStateStore {
  readonly initialized: boolean;
  readonly mapDefinition: MapDefinition | null;
  readonly initializeMap: () => void;
}

export const useGameStore = create<GameStateStore>((set) => ({
  initialized: false,
  mapDefinition: null,
  initializeMap: () => {
    const mapDefinition = loadMapDefinition();
    set({ initialized: true, mapDefinition });
  },
}));
