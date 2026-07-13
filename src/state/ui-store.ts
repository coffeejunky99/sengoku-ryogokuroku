import { create } from 'zustand';

import type { CastleId } from '../domain/types/ids';

interface UiState {
  readonly isBooted: boolean;
  readonly selectedCastleId: CastleId | null;
  readonly setBooted: (value: boolean) => void;
  readonly setSelectedCastleId: (castleId: CastleId | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isBooted: false,
  selectedCastleId: null,
  setBooted: (value) => {
    set({ isBooted: value });
  },
  setSelectedCastleId: (castleId) => {
    set({ selectedCastleId: castleId });
  },
}));
