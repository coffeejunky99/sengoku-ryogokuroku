import { describe, expect, it } from 'vitest';

import { formatGameDate } from './format-game-date';

describe('formatGameDate', () => {
  it('pads single-digit months and days with zeroes', () => {
    expect(formatGameDate({ year: 1561, month: 9, day: 1 })).toBe('1561/09/01');
  });

  it('keeps double-digit months and days unchanged', () => {
    expect(formatGameDate({ year: 1561, month: 12, day: 31 })).toBe('1561/12/31');
  });
});
