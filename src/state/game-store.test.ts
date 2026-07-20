import { beforeEach, describe, expect, it } from 'vitest';

import {
  SIMULATION_STEP_MS,
  SIMULATION_TICKS_PER_GAME_DAY,
} from '../domain/time/simulation-constants';
import type { TimeScale } from '../domain/time/time-scale';

import { useGameStore } from './game-store';

const INITIAL_GAME_DATE = { year: 1561, month: 9, day: 1 };
const INITIAL_TIME_SCALE: TimeScale = 0;
const INITIAL_PENDING_SIMULATION_TICKS = 0;
const AVAILABLE_TIME_SCALES: readonly TimeScale[] = [0, 1, 2, 4];
const REAL_MILLISECONDS_PER_GAME_DAY = SIMULATION_STEP_MS * SIMULATION_TICKS_PER_GAME_DAY;
const SEPTEMBER_DAYS = 30;

describe('game store time state', () => {
  beforeEach(() => {
    useGameStore.getState().resetTime();
  });

  it('starts with the vertical slice time state', () => {
    const state = useGameStore.getState();

    expect(state.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(state.timeScale).toBe(INITIAL_TIME_SCALE);
    expect(state.pendingSimulationTicks).toBe(INITIAL_PENDING_SIMULATION_TICKS);
  });

  it.each(AVAILABLE_TIME_SCALES)('sets the time scale to %i', (timeScale) => {
    useGameStore.getState().setTimeScale(timeScale);

    expect(useGameStore.getState().timeScale).toBe(timeScale);
  });

  it('advances one day after 1000 ms at 1x', () => {
    useGameStore.getState().setTimeScale(1);

    useGameStore.getState().advanceTime(REAL_MILLISECONDS_PER_GAME_DAY);

    expect(useGameStore.getState().currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('does not advance time at 0x', () => {
    useGameStore.getState().advanceTime(REAL_MILLISECONDS_PER_GAME_DAY);

    expect(useGameStore.getState().currentDate).toEqual(INITIAL_GAME_DATE);
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('discards the clock accumulator when time is reset', () => {
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(SIMULATION_STEP_MS - 1);

    useGameStore.getState().resetTime();
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(1);

    expect(useGameStore.getState().currentDate).toEqual(INITIAL_GAME_DATE);
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('advances one day for every four simulation ticks', () => {
    useGameStore.getState().consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);

    expect(useGameStore.getState().currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('reflects surplus simulation ticks in the store', () => {
    const surplusTicks = 1;

    useGameStore
      .getState()
      .consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY + surplusTicks);

    expect(useGameStore.getState().currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(useGameStore.getState().pendingSimulationTicks).toBe(surplusTicks);
  });

  it('carries surplus simulation ticks across multiple inputs', () => {
    const firstInputTicks = 1;
    const secondInputTicks = SIMULATION_TICKS_PER_GAME_DAY - firstInputTicks;

    useGameStore.getState().consumeSimulationTicks(firstInputTicks);
    useGameStore.getState().consumeSimulationTicks(secondInputTicks);

    expect(useGameStore.getState().currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('crosses a month boundary', () => {
    const daysUntilOctober = SEPTEMBER_DAYS;

    useGameStore
      .getState()
      .consumeSimulationTicks(daysUntilOctober * SIMULATION_TICKS_PER_GAME_DAY);

    expect(useGameStore.getState().currentDate).toEqual({ year: 1561, month: 10, day: 1 });
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('resets all time state and discards the internal progression state', () => {
    useGameStore.getState().setTimeScale(4);
    useGameStore
      .getState()
      .consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY + 1);

    useGameStore.getState().resetTime();

    const state = useGameStore.getState();
    expect(state.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(state.timeScale).toBe(INITIAL_TIME_SCALE);
    expect(state.pendingSimulationTicks).toBe(INITIAL_PENDING_SIMULATION_TICKS);
  });

  it('starts clean after the preceding test mutates time state', () => {
    const state = useGameStore.getState();

    expect(state.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(state.timeScale).toBe(INITIAL_TIME_SCALE);
    expect(state.pendingSimulationTicks).toBe(INITIAL_PENDING_SIMULATION_TICKS);
  });
});
