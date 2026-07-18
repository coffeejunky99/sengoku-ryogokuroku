import { addDay, createGameDate, type GameDate } from '../../domain/time/game-date';
import { SIMULATION_TICKS_PER_GAME_DAY } from '../../domain/time/simulation-constants';

const INITIAL_GAME_DATE_YEAR = 1561;
const INITIAL_GAME_DATE_MONTH = 9;
const INITIAL_GAME_DATE_DAY = 1;

export class GameDateProgression {
  private currentGameDate: GameDate;
  private pendingTickCount = 0;

  public constructor(initialDate: GameDate = createInitialGameDate()) {
    this.currentGameDate = copyGameDate(initialDate);
  }

  public get currentDate(): GameDate {
    return copyGameDate(this.currentGameDate);
  }

  public get pendingSimulationTicks(): number {
    return this.pendingTickCount;
  }

  public consumeSimulationTicks(simulationTicks: number): void {
    requireNonNegativeSafeInteger(simulationTicks);

    const elapsedDays = Math.floor(simulationTicks / SIMULATION_TICKS_PER_GAME_DAY);
    const incomingRemainder = simulationTicks % SIMULATION_TICKS_PER_GAME_DAY;
    const combinedRemainder = this.pendingTickCount + incomingRemainder;
    const carriedDays = Math.floor(combinedRemainder / SIMULATION_TICKS_PER_GAME_DAY);

    this.pendingTickCount = combinedRemainder % SIMULATION_TICKS_PER_GAME_DAY;
    this.advanceDays(elapsedDays + carriedDays);
  }

  private advanceDays(days: number): void {
    for (let elapsedDays = 0; elapsedDays < days; elapsedDays += 1) {
      this.currentGameDate = addDay(this.currentGameDate);
    }
  }
}

function createInitialGameDate(): GameDate {
  return createGameDate(
    INITIAL_GAME_DATE_YEAR,
    INITIAL_GAME_DATE_MONTH,
    INITIAL_GAME_DATE_DAY,
  );
}

function copyGameDate(date: GameDate): GameDate {
  return createGameDate(date.year, date.month, date.day);
}

function requireNonNegativeSafeInteger(simulationTicks: number): void {
  if (!Number.isSafeInteger(simulationTicks) || simulationTicks < 0) {
    throw new RangeError('simulationTicks must be a non-negative safe integer.');
  }
}
