import { create } from 'zustand';

interface GameStateStore {
  readonly initialized: boolean;
}

export const useGameStore = create<GameStateStore>(() => ({
  initialized: false,
}));
