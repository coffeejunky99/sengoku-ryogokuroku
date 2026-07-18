import { describe, expect, it } from 'vitest';

import {
  MAX_SIMULATION_TICKS_PER_FRAME,
  SIMULATION_STEP_MS,
  SIMULATION_TICKS_PER_GAME_DAY,
} from '../../domain/time/simulation-constants';

import { SimulationClock } from './simulation-clock';

describe('SimulationClock', () => {
  it('generates one tick from 250 ms at 1x', () => {
    const clock = new SimulationClock(1);

    expect(clock.update(SIMULATION_STEP_MS)).toBe(1);
    expect(clock.accumulatorMs).toBe(0);
  });

  it('accumulates partial frame deltas until one fixed step is available', () => {
    const clock = new SimulationClock(1);

    expect(clock.update(100)).toBe(0);
    expect(clock.accumulatorMs).toBe(100);
    expect(clock.update(150)).toBe(1);
    expect(clock.accumulatorMs).toBe(0);
  });

  it.each([
    [1, SIMULATION_TICKS_PER_GAME_DAY],
    [2, SIMULATION_TICKS_PER_GAME_DAY * 2],
    [4, SIMULATION_TICKS_PER_GAME_DAY * 4],
  ] as const)('at %ix generates %i ticks per real second', (timeScale, ticks) => {
    const clock = new SimulationClock(timeScale);

    expect(clock.update(1_000)).toBe(Math.min(ticks, MAX_SIMULATION_TICKS_PER_FRAME));

    if (ticks > MAX_SIMULATION_TICKS_PER_FRAME) {
      expect(clock.update(0)).toBe(ticks - MAX_SIMULATION_TICKS_PER_FRAME);
    }
  });

  it('does not generate ticks or add delta to the accumulator at 0x', () => {
    const clock = new SimulationClock(1);
    expect(clock.update(100)).toBe(0);

    clock.setTimeScale(0);

    expect(clock.update(10_000)).toBe(0);
    expect(clock.accumulatorMs).toBe(100);
  });

  it('preserves the accumulator when changing speed without generating a tick', () => {
    const clock = new SimulationClock(1);
    expect(clock.update(100)).toBe(0);

    clock.setTimeScale(4);

    expect(clock.timeScale).toBe(4);
    expect(clock.accumulatorMs).toBe(100);
  });

  it('limits one update to eight ticks and retains excess work', () => {
    const clock = new SimulationClock(1);
    const totalTicks = MAX_SIMULATION_TICKS_PER_FRAME + 2;

    expect(clock.update(SIMULATION_STEP_MS * totalTicks)).toBe(
      MAX_SIMULATION_TICKS_PER_FRAME,
    );
    expect(clock.accumulatorMs).toBe(SIMULATION_STEP_MS * 2);
    expect(clock.update(0)).toBe(2);
    expect(clock.accumulatorMs).toBe(0);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid delta %s', (deltaMs) => {
    const clock = new SimulationClock(1);

    expect(() => clock.update(deltaMs)).toThrow(RangeError);
  });
});
