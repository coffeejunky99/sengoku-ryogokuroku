export interface GameDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export class InvalidGameDateError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidGameDateError';
  }
}

const MONTHS_PER_YEAR = 12;
const FEBRUARY = 2;
const APRIL = 4;
const JUNE = 6;
const SEPTEMBER = 9;
const NOVEMBER = 11;
const DAYS_IN_COMMON_FEBRUARY = 28;
const DAYS_IN_LEAP_FEBRUARY = 29;
const DAYS_IN_THIRTY_DAY_MONTH = 30;
const DAYS_IN_THIRTY_ONE_DAY_MONTH = 31;
const LEAP_YEAR_INTERVAL = 4;
const LEAP_YEAR_CENTURY_INTERVAL = 100;
const LEAP_YEAR_CYCLE = 400;

const THIRTY_DAY_MONTHS = new Set([APRIL, JUNE, SEPTEMBER, NOVEMBER]);

export function isLeapYear(year: number): boolean {
  requirePositiveInteger(year, 'year');

  return (
    year % LEAP_YEAR_CYCLE === 0 ||
    (year % LEAP_YEAR_INTERVAL === 0 && year % LEAP_YEAR_CENTURY_INTERVAL !== 0)
  );
}

export function createGameDate(year: number, month: number, day: number): GameDate {
  requirePositiveInteger(year, 'year');
  requireIntegerInRange(month, 'month', 1, MONTHS_PER_YEAR);
  requireIntegerInRange(day, 'day', 1, getDaysInMonth(year, month));

  return { year, month, day };
}

export function addDay(date: GameDate): GameDate {
  const validDate = createGameDate(date.year, date.month, date.day);
  const daysInCurrentMonth = getDaysInMonth(validDate.year, validDate.month);

  if (validDate.day < daysInCurrentMonth) {
    return createGameDate(validDate.year, validDate.month, validDate.day + 1);
  }

  if (validDate.month < MONTHS_PER_YEAR) {
    return createGameDate(validDate.year, validDate.month + 1, 1);
  }

  return createGameDate(validDate.year + 1, 1, 1);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === FEBRUARY) {
    return isLeapYear(year) ? DAYS_IN_LEAP_FEBRUARY : DAYS_IN_COMMON_FEBRUARY;
  }

  return THIRTY_DAY_MONTHS.has(month)
    ? DAYS_IN_THIRTY_DAY_MONTH
    : DAYS_IN_THIRTY_ONE_DAY_MONTH;
}

function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidGameDateError(`${field} must be a positive integer.`);
  }
}

function requireIntegerInRange(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new InvalidGameDateError(
      `${field} must be an integer between ${String(minimum)} and ${String(maximum)}.`,
    );
  }
}
