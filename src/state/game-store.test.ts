import { beforeEach, describe, expect, it } from 'vitest';

import type {
  AutoPauseReason,
  AutoPauseSettingKey,
} from '../domain/time/auto-pause';
import {
  SIMULATION_STEP_MS,
  SIMULATION_TICKS_PER_GAME_DAY,
} from '../domain/time/simulation-constants';
import type { TimeScale } from '../domain/time/time-scale';

import { useGameStore } from './game-store';
import { useSettingsStore } from './settings-store';

const INITIAL_GAME_DATE = { year: 1561, month: 9, day: 1 };
const INITIAL_TIME_SCALE: TimeScale = 0;
const INITIAL_PENDING_SIMULATION_TICKS = 0;
const AVAILABLE_TIME_SCALES: readonly TimeScale[] = [0, 1, 2, 4];
const REAL_MILLISECONDS_PER_GAME_DAY = SIMULATION_STEP_MS * SIMULATION_TICKS_PER_GAME_DAY;
const SEPTEMBER_DAYS = 30;
const AUTO_PAUSE_CASES: readonly (readonly [AutoPauseReason, AutoPauseSettingKey])[] = [
  ['declaration_of_war', 'declarationOfWar'],
  ['enemy_entry', 'enemyEntry'],
  ['battle_start', 'battleStart'],
  ['siege_start', 'siegeStart'],
  ['important_death', 'importantDeath'],
  ['historical_event', 'historicalEvent'],
  ['low_treasury', 'lowTreasury'],
];

describe('game store time state', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetAutoPauseSettings();
    useGameStore.getState().resetTime();
  });

  it('starts with the vertical slice time state', () => {
    const state = useGameStore.getState();

    expect(state.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(state.timeScale).toBe(INITIAL_TIME_SCALE);
    expect(state.pendingSimulationTicks).toBe(INITIAL_PENDING_SIMULATION_TICKS);
    expect(state.lastAutoPauseReason).toBeNull();
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

  it('pauses for background without changing the date or pending ticks', () => {
    const pendingTicks = 1;
    useGameStore.getState().setTimeScale(1);
    useGameStore
      .getState()
      .consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY + pendingTicks);
    useGameStore.getState().advanceTime(SIMULATION_STEP_MS - 1);
    const dateBeforePause = useGameStore.getState().currentDate;

    useGameStore.getState().pauseForBackground();

    const state = useGameStore.getState();
    expect(state.timeScale).toBe(0);
    expect(state.currentDate).toEqual(dateBeforePause);
    expect(state.pendingSimulationTicks).toBe(pendingTicks);
  });

  it('does not combine a post-background delta with the old accumulator', () => {
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(SIMULATION_STEP_MS - 1);

    useGameStore.getState().pauseForBackground();
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(1);

    expect(useGameStore.getState().currentDate).toEqual(INITIAL_GAME_DATE);
    expect(useGameStore.getState().pendingSimulationTicks).toBe(0);
  });

  it('can pause for background repeatedly without changing time state', () => {
    const pendingTicks = 1;
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().consumeSimulationTicks(pendingTicks);

    useGameStore.getState().pauseForBackground();
    const stateAfterFirstPause = useGameStore.getState();
    useGameStore.getState().pauseForBackground();

    const stateAfterSecondPause = useGameStore.getState();
    expect(stateAfterSecondPause.timeScale).toBe(0);
    expect(stateAfterSecondPause.currentDate).toEqual(stateAfterFirstPause.currentDate);
    expect(stateAfterSecondPause.pendingSimulationTicks).toBe(
      stateAfterFirstPause.pendingSimulationTicks,
    );
  });

  it.each(AUTO_PAUSE_CASES)(
    'pauses and records enabled auto-pause reason %s',
    (reason) => {
      useGameStore.getState().setTimeScale(4);

      const didPause = useGameStore.getState().requestAutoPause(reason);

      expect(didPause).toBe(true);
      expect(useGameStore.getState().timeScale).toBe(0);
      expect(useGameStore.getState().lastAutoPauseReason).toBe(reason);
    },
  );

  it('discards the accumulator without changing the date or pending ticks when auto-paused', () => {
    const pendingTicks = 1;
    useGameStore.getState().setTimeScale(1);
    useGameStore
      .getState()
      .consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY + pendingTicks);
    useGameStore.getState().advanceTime(SIMULATION_STEP_MS - 1);
    const dateBeforePause = useGameStore.getState().currentDate;

    useGameStore.getState().requestAutoPause('battle_start');
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(1);

    const state = useGameStore.getState();
    expect(state.currentDate).toEqual(dateBeforePause);
    expect(state.pendingSimulationTicks).toBe(pendingTicks);
  });

  it.each(AUTO_PAUSE_CASES)(
    'does not pause when auto-pause reason %s is disabled',
    (reason, settingKey) => {
      useSettingsStore.getState().setAutoPauseSetting(settingKey, false);
      useGameStore.getState().setTimeScale(2);

      const didPause = useGameStore.getState().requestAutoPause(reason);

      expect(didPause).toBe(false);
      expect(useGameStore.getState().timeScale).toBe(2);
      expect(useGameStore.getState().lastAutoPauseReason).toBeNull();
    },
  );

  it('preserves the accumulator and previous reason when the requested reason is disabled', () => {
    useGameStore.getState().setTimeScale(1);
    expect(useGameStore.getState().requestAutoPause('declaration_of_war')).toBe(true);
    useGameStore.getState().setTimeScale(1);
    useGameStore.getState().advanceTime(SIMULATION_STEP_MS - 1);
    useSettingsStore.getState().setAutoPauseSetting('enemyEntry', false);

    const didPause = useGameStore.getState().requestAutoPause('enemy_entry');
    const stateAfterRequest = useGameStore.getState();

    expect(didPause).toBe(false);
    expect(stateAfterRequest.timeScale).toBe(1);
    expect(stateAfterRequest.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(stateAfterRequest.pendingSimulationTicks).toBe(0);
    expect(stateAfterRequest.lastAutoPauseReason).toBe('declaration_of_war');

    useGameStore.getState().advanceTime(1);

    const state = useGameStore.getState();
    expect(state.timeScale).toBe(1);
    expect(state.pendingSimulationTicks).toBe(1);
    expect(state.lastAutoPauseReason).toBe('declaration_of_war');
  });

  it('can repeat the same enabled auto-pause reason safely', () => {
    expect(useGameStore.getState().requestAutoPause('siege_start')).toBe(true);
    expect(useGameStore.getState().requestAutoPause('siege_start')).toBe(true);

    expect(useGameStore.getState().timeScale).toBe(0);
    expect(useGameStore.getState().lastAutoPauseReason).toBe('siege_start');
  });

  it('replaces the last auto-pause reason when a different enabled reason succeeds', () => {
    useGameStore.getState().requestAutoPause('battle_start');

    useGameStore.getState().requestAutoPause('historical_event');

    expect(useGameStore.getState().lastAutoPauseReason).toBe('historical_event');
  });

  it('does not clear the last auto-pause reason when manually changing speed', () => {
    useGameStore.getState().requestAutoPause('important_death');

    useGameStore.getState().setTimeScale(2);

    expect(useGameStore.getState().timeScale).toBe(2);
    expect(useGameStore.getState().lastAutoPauseReason).toBe('important_death');
  });

  it('does not change the last auto-pause reason when pausing for background', () => {
    useGameStore.getState().requestAutoPause('low_treasury');
    useGameStore.getState().setTimeScale(1);

    useGameStore.getState().pauseForBackground();

    expect(useGameStore.getState().timeScale).toBe(0);
    expect(useGameStore.getState().lastAutoPauseReason).toBe('low_treasury');
  });

  it('clears the last auto-pause reason when time is reset', () => {
    useGameStore.getState().requestAutoPause('historical_event');

    useGameStore.getState().resetTime();

    expect(useGameStore.getState().lastAutoPauseReason).toBeNull();
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
    expect(state.lastAutoPauseReason).toBeNull();
  });

  it('starts clean after the preceding test mutates time state', () => {
    const state = useGameStore.getState();

    expect(state.currentDate).toEqual(INITIAL_GAME_DATE);
    expect(state.timeScale).toBe(INITIAL_TIME_SCALE);
    expect(state.pendingSimulationTicks).toBe(INITIAL_PENDING_SIMULATION_TICKS);
    expect(state.lastAutoPauseReason).toBeNull();
  });
});
