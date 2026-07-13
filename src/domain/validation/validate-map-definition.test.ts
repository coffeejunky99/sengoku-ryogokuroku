import { describe, expect, it } from 'vitest';

import formalMapDefinition from '../../data/master/map-definition.json';

import { validateMapDefinition } from './validate-map-definition';

type MutableRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MutableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createValidInput(): MutableRecord {
  return structuredClone(formalMapDefinition);
}

function requireRecord(value: unknown): MutableRecord {
  if (!isRecord(value)) {
    throw new Error('Test fixture value is not an object.');
  }

  return value;
}

function requireArray(record: MutableRecord, field: string): unknown[] {
  const value = record[field];
  if (!Array.isArray(value)) {
    throw new Error(`Test fixture field ${field} is not an array.`);
  }

  return value;
}

function requireArrayRecord(record: MutableRecord, field: string, index: number): MutableRecord {
  return requireRecord(requireArray(record, field)[index]);
}

describe('validateMapDefinition', () => {
  it('returns the formal map input as a MapDefinition', () => {
    const result = validateMapDefinition(createValidInput());

    expect(result).toEqual(formalMapDefinition);
    expect(result.clans).toHaveLength(4);
    expect(result.castles).toHaveLength(10);
    expect(result.routes).toHaveLength(13);
  });

  it('accepts all formal capital, owner, and route endpoint references', () => {
    const result = validateMapDefinition(createValidInput());
    const clanIds = new Set<string>(result.clans.map((clan) => clan.id));
    const castleIds = new Set<string>(result.castles.map((castle) => castle.id));

    expect(result.clans.every((clan) => castleIds.has(clan.capitalCastleId))).toBe(true);
    expect(result.castles.every((castle) => clanIds.has(castle.initialOwnerClanId))).toBe(true);
    expect(
      result.routes.every(
        (route) => castleIds.has(route.fromCastleId) && castleIds.has(route.toCastleId),
      ),
    ).toBe(true);
  });

  it('allows castle coordinates on every padded boundary', () => {
    const input = createValidInput();
    const firstPosition = requireRecord(requireArrayRecord(input, 'castles', 0).position);
    const secondPosition = requireRecord(requireArrayRecord(input, 'castles', 1).position);
    firstPosition.x = 80;
    firstPosition.y = 80;
    secondPosition.x = 1520;
    secondPosition.y = 1120;

    expect(() => validateMapDefinition(input)).not.toThrow();
  });

  it('allows equal minimum, initial, and maximum zoom values', () => {
    const input = createValidInput();
    input.minimumZoom = 1;
    input.initialZoom = 1;
    input.maximumZoom = 1;

    expect(() => validateMapDefinition(input)).not.toThrow();
  });

  it.each([
    ['null', null],
    ['an array', []],
  ])('rejects %s as the root object', (_label, input) => {
    expect(() => validateMapDefinition(input)).toThrow(/^\$: expected an object$/);
  });

  it('rejects a missing required field with its path', () => {
    const input = createValidInput();
    delete input.logicalWidth;

    expect(() => validateMapDefinition(input)).toThrow(/logicalWidth/);
  });

  it('rejects a field with the wrong type', () => {
    const input = createValidInput();
    input.logicalHeight = '1200';

    expect(() => validateMapDefinition(input)).toThrow(/logicalHeight/);
  });

  it('rejects a non-array collection', () => {
    const input = createValidInput();
    input.clans = {};

    expect(() => validateMapDefinition(input)).toThrow(/clans/);
  });

  it('rejects an invalid hexadecimal color', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'clans', 0).color = '#12345G';

    expect(() => validateMapDefinition(input)).toThrow(/clans\[0\]\.color/);
  });

  it('rejects an empty required string', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'clans', 0).identificationSymbol = ' ';

    expect(() => validateMapDefinition(input)).toThrow(/clans\[0\]\.identificationSymbol/);
  });

  it.each([
    ['clans'],
    ['castles'],
    ['routes'],
  ])('rejects an invalid %s count', (field) => {
    const input = createValidInput();
    requireArray(input, field).pop();

    expect(() => validateMapDefinition(input)).toThrow(new RegExp(field));
  });

  it('rejects a castle coordinate outside the padded range', () => {
    const input = createValidInput();
    requireRecord(requireArrayRecord(input, 'castles', 3).position).x = 79;

    expect(() => validateMapDefinition(input)).toThrow(/castles\[3\]\.position\.x/);
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('rejects a %s coordinate', (_label, coordinate) => {
    const input = createValidInput();
    requireRecord(requireArrayRecord(input, 'castles', 0).position).y = coordinate;

    expect(() => validateMapDefinition(input)).toThrow(/castles\[0\]\.position\.y/);
  });

  it('rejects an invalid zoom ordering', () => {
    const input = createValidInput();
    input.minimumZoom = 1;
    input.initialZoom = 0.5;

    expect(() => validateMapDefinition(input)).toThrow(/initialZoom/);
  });

  it('rejects a non-positive route distance', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 0).distance = 0;

    expect(() => validateMapDefinition(input)).toThrow(/routes\[0\]\.distance/);
  });

  it('rejects an unsupported terrain', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 0).terrain = 'forest';

    expect(() => validateMapDefinition(input)).toThrow(/routes\[0\]\.terrain/);
  });

  it('rejects a route that is not bidirectional', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 0).isBidirectional = false;

    expect(() => validateMapDefinition(input)).toThrow(/routes\[0\]\.isBidirectional/);
  });

  it('rejects a duplicate clan ID', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'clans', 2).id = requireArrayRecord(input, 'clans', 0).id;

    expect(() => validateMapDefinition(input)).toThrow(
      /clans\[2\]\.id: duplicate clan id: clan_takeda/,
    );
  });

  it('rejects a duplicate castle ID', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'castles', 2).id = requireArrayRecord(input, 'castles', 0).id;

    expect(() => validateMapDefinition(input)).toThrow(
      /castles\[2\]\.id: duplicate castle id: castle_kasugayama/,
    );
  });

  it('rejects a duplicate route ID', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 2).id = requireArrayRecord(input, 'routes', 0).id;

    expect(() => validateMapDefinition(input)).toThrow(
      /routes\[2\]\.id: duplicate route id: route_kasugayama_sakado/,
    );
  });

  it('rejects a capital that references an unknown castle', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'clans', 0).capitalCastleId = 'castle_missing';

    expect(() => validateMapDefinition(input)).toThrow(
      /clans\[0\]\.capitalCastleId: unknown castle id: castle_missing/,
    );
  });

  it('rejects multiple clans using the same capital castle', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'clans', 1).capitalCastleId =
      requireArrayRecord(input, 'clans', 0).capitalCastleId;

    expect(() => validateMapDefinition(input)).toThrow(
      /clans\[1\]\.capitalCastleId: duplicate capital castle id: castle_tsutsujigasaki/,
    );
  });

  it('rejects a castle owner that references an unknown clan', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'castles', 0).initialOwnerClanId = 'clan_missing';

    expect(() => validateMapDefinition(input)).toThrow(
      /castles\[0\]\.initialOwnerClanId: unknown clan id: clan_missing/,
    );
  });

  it('rejects a route start that references an unknown castle', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 0).fromCastleId = 'castle_missing';

    expect(() => validateMapDefinition(input)).toThrow(
      /routes\[0\]\.fromCastleId: unknown castle id: castle_missing/,
    );
  });

  it('rejects a route end that references an unknown castle', () => {
    const input = createValidInput();
    requireArrayRecord(input, 'routes', 0).toCastleId = 'castle_missing';

    expect(() => validateMapDefinition(input)).toThrow(
      /routes\[0\]\.toCastleId: unknown castle id: castle_missing/,
    );
  });
});
