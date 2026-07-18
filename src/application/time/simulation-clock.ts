import {
  MAX_SIMULATION_TICKS_PER_FRAME,
  SIMULATION_STEP_MS,
} from '../../domain/time/simulation-constants';
import type { TimeScale } from '../../domain/time/time-scale';

export class SimulationClock {
  private currentAccumulatorMs = 0;
  private currentTimeScale: TimeScale;

  public constructor(initialTimeScale: TimeScale = 0) {
    this.currentTimeScale = initialTimeScale;
  }

  public get accumulatorMs(): number {
    return this.currentAccumulatorMs;
  }

  public get timeScale(): TimeScale {
    return this.currentTimeScale;
  }

  public setTimeScale(timeScale: TimeScale): void {
    this.currentTimeScale = timeScale;
  }

  public update(deltaMs: number): number {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new RangeError('deltaMs must be a finite, non-negative number.');
    }

    if (this.currentTimeScale === 0) {
      return 0;
    }

    this.currentAccumulatorMs += deltaMs * this.currentTimeScale;

    const availableTicks = Math.floor(this.currentAccumulatorMs / SIMULATION_STEP_MS);
    const generatedTicks = Math.min(availableTicks, MAX_SIMULATION_TICKS_PER_FRAME);
    this.currentAccumulatorMs -= generatedTicks * SIMULATION_STEP_MS;

    return generatedTicks;
  }
}
