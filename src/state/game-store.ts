import { create } from 'zustand';

import { GameDateProgression } from '../application/time/game-date-progression';
import { shouldAutoPause } from '../application/time/should-auto-pause';
import { SimulationClock } from '../application/time/simulation-clock';
import type { AutoPauseReason } from '../domain/time/auto-pause';
import type { GameDate } from '../domain/time/game-date';
import type { TimeScale } from '../domain/time/time-scale';
import type { MapDefinition } from '../domain/types/map-definition';
import { loadMapDefinition } from '../infrastructure/data/load-map-definition';

import { useSettingsStore } from './settings-store';

const INITIAL_TIME_SCALE: TimeScale = 0;

export interface GameStateStore {
  readonly initialized: boolean;
  readonly mapDefinition: MapDefinition | null;
  readonly currentDate: GameDate;
  readonly timeScale: TimeScale;
  readonly pendingSimulationTicks: number;
  readonly lastAutoPauseReason: AutoPauseReason | null;
  readonly initializeMap: () => void;
  readonly setTimeScale: (timeScale: TimeScale) => void;
  readonly advanceTime: (deltaMs: number) => void;
  readonly consumeSimulationTicks: (ticks: number) => void;
  readonly pauseForBackground: () => void;
  readonly requestAutoPause: (reason: AutoPauseReason) => boolean;
  readonly resetTime: () => void;
}

export const useGameStore = create<GameStateStore>((set, get) => {
  let simulationClock = new SimulationClock(INITIAL_TIME_SCALE);
  let gameDateProgression = new GameDateProgression();

  const consumeTicks = (ticks: number): void => {
    gameDateProgression.consumeSimulationTicks(ticks);

    const state = get();
    const currentDate = gameDateProgression.currentDate;
    const pendingSimulationTicks = gameDateProgression.pendingSimulationTicks;
    const dateChanged = !areGameDatesEqual(state.currentDate, currentDate);

    if (dateChanged || state.pendingSimulationTicks !== pendingSimulationTicks) {
      set({
        currentDate: dateChanged ? currentDate : state.currentDate,
        pendingSimulationTicks,
      });
    }
  };

  return {
    initialized: false,
    mapDefinition: null,
    currentDate: gameDateProgression.currentDate,
    timeScale: simulationClock.timeScale,
    pendingSimulationTicks: gameDateProgression.pendingSimulationTicks,
    lastAutoPauseReason: null,
    initializeMap: () => {
      const mapDefinition = loadMapDefinition();
      set({ initialized: true, mapDefinition });
    },
    setTimeScale: (timeScale) => {
      simulationClock.setTimeScale(timeScale);
      if (get().timeScale !== simulationClock.timeScale) {
        set({ timeScale: simulationClock.timeScale });
      }
    },
    advanceTime: (deltaMs) => {
      simulationClock.setTimeScale(get().timeScale);
      const ticks = simulationClock.update(deltaMs);

      if (ticks > 0) {
        consumeTicks(ticks);
      }
    },
    consumeSimulationTicks: consumeTicks,
    pauseForBackground: () => {
      simulationClock.pauseAndClearAccumulator();
      if (get().timeScale !== simulationClock.timeScale) {
        set({ timeScale: simulationClock.timeScale });
      }
    },
    requestAutoPause: (reason) => {
      const settings = useSettingsStore.getState().autoPauseSettings;
      if (!shouldAutoPause(settings, reason)) {
        return false;
      }

      simulationClock.pauseAndClearAccumulator();
      const state = get();
      if (state.timeScale !== simulationClock.timeScale || state.lastAutoPauseReason !== reason) {
        set({
          timeScale: simulationClock.timeScale,
          lastAutoPauseReason: reason,
        });
      }

      return true;
    },
    resetTime: () => {
      simulationClock = new SimulationClock(INITIAL_TIME_SCALE);
      gameDateProgression = new GameDateProgression();
      set({
        currentDate: gameDateProgression.currentDate,
        timeScale: simulationClock.timeScale,
        pendingSimulationTicks: gameDateProgression.pendingSimulationTicks,
        lastAutoPauseReason: null,
      });
    },
  };
});

function areGameDatesEqual(left: GameDate, right: GameDate): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}
