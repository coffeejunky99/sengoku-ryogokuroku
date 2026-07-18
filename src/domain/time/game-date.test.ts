import { describe, expect, it } from 'vitest';

import { InvalidGameDateError, addDay, createGameDate, isLeapYear } from './game-date';

describe('GameDate', () => {
  it('adds one day without depending on JavaScript Date', () => {
    expect(addDay(createGameDate(1561, 9, 1))).toEqual({ year: 1561, month: 9, day: 2 });
  });

  it('crosses a month boundary', () => {
    expect(addDay(createGameDate(1561, 9, 30))).toEqual({ year: 1561, month: 10, day: 1 });
  });

  it('crosses a year boundary', () => {
    expect(addDay(createGameDate(1561, 12, 31))).toEqual({ year: 1562, month: 1, day: 1 });
  });

  it.each([
    [1600, true],
    [2000, true],
    [1900, false],
    [2100, false],
    [2024, true],
    [2023, false],
  ])('applies Gregorian leap-year rules to %i', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });

  it('includes February 29 in a leap year', () => {
    expect(addDay(createGameDate(1600, 2, 28))).toEqual({ year: 1600, month: 2, day: 29 });
    expect(addDay(createGameDate(1600, 2, 29))).toEqual({ year: 1600, month: 3, day: 1 });
  });

  it('moves directly from February 28 to March 1 in a common year', () => {
    expect(addDay(createGameDate(1900, 2, 28))).toEqual({ year: 1900, month: 3, day: 1 });
  });

  it.each([
    [0, 1, 1],
    [1561, 0, 1],
    [1561, 13, 1],
    [1561, 9, 0],
    [1561, 9, 31],
    [1900, 2, 29],
    [1561.5, 9, 1],
  ])('rejects an invalid date (%s, %s, %s)', (year, month, day) => {
    expect(() => createGameDate(year, month, day)).toThrow(InvalidGameDateError);
  });
});
