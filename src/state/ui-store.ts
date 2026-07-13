import { create } from 'zustand';

interface UiState {
  readonly isBooted: boolean;
  readonly setBooted: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isBooted: false,
  setBooted: (value) => {
    set({ isBooted: value });
  },
}));
