import { describe, expect, it } from 'vitest';

import { createGameDate } from '../../domain/time/game-date';
import { SIMULATION_TICKS_PER_GAME_DAY } from '../../domain/time/simulation-constants';

import { GameDateProgression } from './game-date-progression';

describe('GameDateProgression', () => {
  it('starts at 1561-09-01', () => {
    const progression = new GameDateProgression();

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 1 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it.each([1, 2, 3])('does not advance the date after %i tick(s)', (simulationTicks) => {
    const progression = new GameDateProgression();

    progression.consumeSimulationTicks(simulationTicks);

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 1 });
    expect(progression.pendingSimulationTicks).toBe(simulationTicks);
  });

  it('advances one day after four ticks', () => {
    const progression = new GameDateProgression();

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it('advances two days after eight ticks', () => {
    const progression = new GameDateProgression();

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY * 2);

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 3 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it('carries surplus ticks into the next input', () => {
    const progression = new GameDateProgression();

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY + 1);
    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 2 });
    expect(progression.pendingSimulationTicks).toBe(1);

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY - 1);
    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 3 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it('crosses a month boundary', () => {
    const progression = new GameDateProgression(createGameDate(1561, 9, 30));

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);

    expect(progression.currentDate).toEqual({ year: 1561, month: 10, day: 1 });
  });

  it('crosses a year boundary', () => {
    const progression = new GameDateProgression(createGameDate(1561, 12, 31));

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);

    expect(progression.currentDate).toEqual({ year: 1562, month: 1, day: 1 });
  });

  it('includes February 29 when ticks cross a leap day', () => {
    const progression = new GameDateProgression(createGameDate(1600, 2, 28));

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);
    expect(progression.currentDate).toEqual({ year: 1600, month: 2, day: 29 });

    progression.consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);
    expect(progression.currentDate).toEqual({ year: 1600, month: 3, day: 1 });
  });

  it('does not change state after zero ticks', () => {
    const progression = new GameDateProgression();

    progression.consumeSimulationTicks(0);

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 1 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid tick input %s',
    (simulationTicks) => {
      const progression = new GameDateProgression();

      expect(() => {
        progression.consumeSimulationTicks(simulationTicks);
      }).toThrow(RangeError);
      expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 1 });
      expect(progression.pendingSimulationTicks).toBe(0);
    },
  );

  it('advances multiple days correctly for a large tick input', () => {
    const progression = new GameDateProgression();
    const elapsedGameDays = 10_000;

    progression.consumeSimulationTicks(elapsedGameDays * SIMULATION_TICKS_PER_GAME_DAY);

    expect(progression.currentDate).toEqual({ year: 1589, month: 1, day: 17 });
    expect(progression.pendingSimulationTicks).toBe(0);
  });

  it('does not expose its date state for external mutation', () => {
    const initialDate = { year: 1561, month: 9, day: 1 };
    const progression = new GameDateProgression(initialDate);

    initialDate.day = 30;
    Object.assign(progression.currentDate, { day: 30 });

    expect(progression.currentDate).toEqual({ year: 1561, month: 9, day: 1 });
  });
});
