import type { GameDate } from '../../../domain/time/game-date';

const YEAR_DIGITS = 4;
const MONTH_AND_DAY_DIGITS = 2;
const DATE_PADDING_CHARACTER = '0';
const DATE_SEPARATOR = '/';

export function formatGameDate(date: GameDate): string {
  const year = String(date.year).padStart(YEAR_DIGITS, DATE_PADDING_CHARACTER);
  const month = String(date.month).padStart(MONTH_AND_DAY_DIGITS, DATE_PADDING_CHARACTER);
  const day = String(date.day).padStart(MONTH_AND_DAY_DIGITS, DATE_PADDING_CHARACTER);

  return [year, month, day].join(DATE_SEPARATOR);
}
