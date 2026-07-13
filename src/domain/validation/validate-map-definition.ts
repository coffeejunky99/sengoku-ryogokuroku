import type { Brand } from '../types/ids';
import type {
  MapCastleDefinition,
  MapClanDefinition,
  MapDefinition,
  MapPosition,
  MapRouteDefinition,
} from '../types/map-definition';

const EXPECTED_CLAN_COUNT = 4;
const EXPECTED_CASTLE_COUNT = 10;
const EXPECTED_ROUTE_COUNT = 13;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function requireRecord(value: unknown, path: string): UnknownRecord {
  if (!isRecord(value)) {
    return fail(path, 'expected an object');
  }

  return value;
}

function requireField(record: UnknownRecord, field: string, path: string): unknown {
  if (!Object.hasOwn(record, field)) {
    return fail(path, 'required field is missing');
  }

  return record[field];
}

function requireArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    return fail(path, 'expected an array');
  }

  return value;
}

function requireArrayLength(values: readonly unknown[], expected: number, path: string): void {
  if (values.length !== expected) {
    fail(path, `expected ${String(expected)} items`);
  }
}

function requireFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fail(path, 'expected a finite number');
  }

  return value;
}

function requirePositiveNumber(value: unknown, path: string): number {
  const numberValue = requireFiniteNumber(value, path);
  if (numberValue <= 0) {
    return fail(path, 'expected a positive number');
  }

  return numberValue;
}

function requireNonNegativeNumber(value: unknown, path: string): number {
  const numberValue = requireFiniteNumber(value, path);
  if (numberValue < 0) {
    return fail(path, 'expected a non-negative number');
  }

  return numberValue;
}

function requireNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fail(path, 'expected a non-empty string');
  }

  return value;
}

function requireLiteral<TLiteral extends string>(
  value: unknown,
  expected: TLiteral,
  path: string,
): TLiteral {
  if (value !== expected) {
    return fail(path, `expected "${expected}"`);
  }

  return expected;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    return fail(path, 'expected a boolean');
  }

  return value;
}

function requireTrue(value: unknown, path: string): true {
  if (value !== true) {
    return fail(path, 'expected true');
  }

  return true;
}

function toBrand<TBrand extends string>(value: string): Brand<string, TBrand> {
  return value as Brand<string, TBrand>;
}

function validatePosition(input: unknown, path: string): MapPosition {
  const record = requireRecord(input, path);
  return {
    x: requireFiniteNumber(requireField(record, 'x', `${path}.x`), `${path}.x`),
    y: requireFiniteNumber(requireField(record, 'y', `${path}.y`), `${path}.y`),
  };
}

function validateClan(input: unknown, path: string): MapClanDefinition {
  const record = requireRecord(input, path);
  const colorPath = `${path}.color`;
  const color = requireNonEmptyString(requireField(record, 'color', colorPath), colorPath);
  if (!HEX_COLOR_PATTERN.test(color)) {
    fail(colorPath, 'expected #RRGGBB format');
  }

  return {
    id: toBrand<'ClanId'>(
      requireNonEmptyString(requireField(record, 'id', `${path}.id`), `${path}.id`),
    ),
    name: requireNonEmptyString(requireField(record, 'name', `${path}.name`), `${path}.name`),
    color: toBrand<'HexColor'>(color),
    crestAssetKey: requireNonEmptyString(
      requireField(record, 'crestAssetKey', `${path}.crestAssetKey`),
      `${path}.crestAssetKey`,
    ),
    identificationSymbol: requireNonEmptyString(
      requireField(record, 'identificationSymbol', `${path}.identificationSymbol`),
      `${path}.identificationSymbol`,
    ),
    capitalCastleId: toBrand<'CastleId'>(
      requireNonEmptyString(
        requireField(record, 'capitalCastleId', `${path}.capitalCastleId`),
        `${path}.capitalCastleId`,
      ),
    ),
    playable: requireBoolean(
      requireField(record, 'playable', `${path}.playable`),
      `${path}.playable`,
    ),
  };
}

function validateCastle(
  input: unknown,
  path: string,
  mapBounds: {
    readonly minimumX: number;
    readonly maximumX: number;
    readonly minimumY: number;
    readonly maximumY: number;
  },
): MapCastleDefinition {
  const record = requireRecord(input, path);
  const positionPath = `${path}.position`;
  const position = validatePosition(requireField(record, 'position', positionPath), positionPath);

  if (position.x < mapBounds.minimumX || position.x > mapBounds.maximumX) {
    fail(`${positionPath}.x`, 'coordinate is outside the padded map bounds');
  }
  if (position.y < mapBounds.minimumY || position.y > mapBounds.maximumY) {
    fail(`${positionPath}.y`, 'coordinate is outside the padded map bounds');
  }

  return {
    id: toBrand<'CastleId'>(
      requireNonEmptyString(requireField(record, 'id', `${path}.id`), `${path}.id`),
    ),
    name: requireNonEmptyString(requireField(record, 'name', `${path}.name`), `${path}.name`),
    region: requireNonEmptyString(
      requireField(record, 'region', `${path}.region`),
      `${path}.region`,
    ),
    position,
    initialOwnerClanId: toBrand<'ClanId'>(
      requireNonEmptyString(
        requireField(record, 'initialOwnerClanId', `${path}.initialOwnerClanId`),
        `${path}.initialOwnerClanId`,
      ),
    ),
  };
}

function validateRoute(input: unknown, path: string): MapRouteDefinition {
  const record = requireRecord(input, path);
  const terrainPath = `${path}.terrain`;
  const terrain = requireField(record, 'terrain', terrainPath);
  if (terrain !== 'mountain' && terrain !== 'plain') {
    return fail(terrainPath, 'expected "mountain" or "plain"');
  }

  return {
    id: toBrand<'RouteId'>(
      requireNonEmptyString(requireField(record, 'id', `${path}.id`), `${path}.id`),
    ),
    fromCastleId: toBrand<'CastleId'>(
      requireNonEmptyString(
        requireField(record, 'fromCastleId', `${path}.fromCastleId`),
        `${path}.fromCastleId`,
      ),
    ),
    toCastleId: toBrand<'CastleId'>(
      requireNonEmptyString(
        requireField(record, 'toCastleId', `${path}.toCastleId`),
        `${path}.toCastleId`,
      ),
    ),
    distance: requirePositiveNumber(
      requireField(record, 'distance', `${path}.distance`),
      `${path}.distance`,
    ),
    terrain,
    isBidirectional: requireTrue(
      requireField(record, 'isBidirectional', `${path}.isBidirectional`),
      `${path}.isBidirectional`,
    ),
  };
}

function collectUniqueIds(
  items: readonly { readonly id: string }[],
  collectionPath: string,
  entityName: string,
): Set<string> {
  const ids: Set<string> = new Set<string>();

  items.forEach((item, index) => {
    const path = `${collectionPath}[${String(index)}].id`;
    if (ids.has(item.id)) {
      fail(path, `duplicate ${entityName} id: ${item.id}`);
    }
    ids.add(item.id);
  });

  return ids;
}

function requireReference(
  value: string,
  targetIds: ReadonlySet<string>,
  path: string,
  targetName: string,
): void {
  if (!targetIds.has(value)) {
    fail(path, `unknown ${targetName} id: ${value}`);
  }
}

function validateReferences(
  clans: readonly MapClanDefinition[],
  castles: readonly MapCastleDefinition[],
  routes: readonly MapRouteDefinition[],
  clanIds: ReadonlySet<string>,
  castleIds: ReadonlySet<string>,
): void {
  const capitalCastleIds: Set<string> = new Set<string>();

  clans.forEach((clan, index) => {
    const path = `clans[${String(index)}].capitalCastleId`;
    requireReference(clan.capitalCastleId, castleIds, path, 'castle');
    if (capitalCastleIds.has(clan.capitalCastleId)) {
      fail(path, `duplicate capital castle id: ${clan.capitalCastleId}`);
    }
    capitalCastleIds.add(clan.capitalCastleId);
  });

  castles.forEach((castle, index) => {
    requireReference(
      castle.initialOwnerClanId,
      clanIds,
      `castles[${String(index)}].initialOwnerClanId`,
      'clan',
    );
  });

  routes.forEach((route, index) => {
    requireReference(
      route.fromCastleId,
      castleIds,
      `routes[${String(index)}].fromCastleId`,
      'castle',
    );
    requireReference(
      route.toCastleId,
      castleIds,
      `routes[${String(index)}].toCastleId`,
      'castle',
    );
  });
}

function normalizeRouteEndpoints(firstCastleId: string, secondCastleId: string): string {
  return firstCastleId < secondCastleId
    ? `${firstCastleId}\u0000${secondCastleId}`
    : `${secondCastleId}\u0000${firstCastleId}`;
}

function validateRouteGraph(
  castles: readonly MapCastleDefinition[],
  routes: readonly MapRouteDefinition[],
): void {
  const routePairIndices: Map<string, number> = new Map<string, number>();
  const adjacency: Map<string, Set<string>> = new Map<string, Set<string>>();

  castles.forEach((castle) => {
    adjacency.set(castle.id, new Set<string>());
  });

  routes.forEach((route, index) => {
    if (route.fromCastleId === route.toCastleId) {
      fail(
        `routes[${String(index)}].toCastleId`,
        `route endpoints must differ: ${route.fromCastleId}`,
      );
    }

    const routePairKey = normalizeRouteEndpoints(route.fromCastleId, route.toCastleId);
    const firstRouteIndex = routePairIndices.get(routePairKey);
    if (firstRouteIndex !== undefined) {
      fail(
        `routes[${String(index)}].fromCastleId`,
        `duplicate route endpoints: ${route.fromCastleId} <-> ${route.toCastleId}; first route: routes[${String(firstRouteIndex)}]`,
      );
    }
    routePairIndices.set(routePairKey, index);

    const fromNeighbors = adjacency.get(route.fromCastleId);
    const toNeighbors = adjacency.get(route.toCastleId);
    if (fromNeighbors === undefined) {
      fail(`routes[${String(index)}].fromCastleId`, `unknown castle id: ${route.fromCastleId}`);
    }
    if (toNeighbors === undefined) {
      fail(`routes[${String(index)}].toCastleId`, `unknown castle id: ${route.toCastleId}`);
    }
    fromNeighbors.add(route.toCastleId);
    toNeighbors.add(route.fromCastleId);
  });

  const firstCastle = castles[0];
  if (firstCastle === undefined) {
    fail('castles', 'expected at least one castle');
  }

  const visitedCastleIds: Set<string> = new Set<string>([firstCastle.id]);
  const pendingCastleIds: string[] = [firstCastle.id];
  while (pendingCastleIds.length > 0) {
    const castleId = pendingCastleIds.shift();
    if (castleId === undefined) {
      continue;
    }
    const neighbors = adjacency.get(castleId);
    if (neighbors === undefined) {
      fail('routes', `missing graph node for castle id: ${castleId}`);
    }
    neighbors.forEach((neighborId) => {
      if (!visitedCastleIds.has(neighborId)) {
        visitedCastleIds.add(neighborId);
        pendingCastleIds.push(neighborId);
      }
    });
  }

  castles.forEach((castle, index) => {
    if (!visitedCastleIds.has(castle.id)) {
      fail(`castles[${String(index)}].id`, `unreachable castle id: ${castle.id}`);
    }
  });
}

export function validateMapDefinition(input: unknown): MapDefinition {
  const root = requireRecord(input, '$');
  const logicalWidth = requirePositiveNumber(
    requireField(root, 'logicalWidth', 'logicalWidth'),
    'logicalWidth',
  );
  const logicalHeight = requirePositiveNumber(
    requireField(root, 'logicalHeight', 'logicalHeight'),
    'logicalHeight',
  );
  const contentPadding = requireNonNegativeNumber(
    requireField(root, 'contentPadding', 'contentPadding'),
    'contentPadding',
  );
  const initialZoom = requirePositiveNumber(
    requireField(root, 'initialZoom', 'initialZoom'),
    'initialZoom',
  );
  const minimumZoom = requirePositiveNumber(
    requireField(root, 'minimumZoom', 'minimumZoom'),
    'minimumZoom',
  );
  const maximumZoom = requirePositiveNumber(
    requireField(root, 'maximumZoom', 'maximumZoom'),
    'maximumZoom',
  );

  if (minimumZoom > initialZoom) {
    fail('initialZoom', 'must be greater than or equal to minimumZoom');
  }
  if (initialZoom > maximumZoom) {
    fail('initialZoom', 'must be less than or equal to maximumZoom');
  }

  const clansInput = requireArray(requireField(root, 'clans', 'clans'), 'clans');
  const castlesInput = requireArray(requireField(root, 'castles', 'castles'), 'castles');
  const routesInput = requireArray(requireField(root, 'routes', 'routes'), 'routes');
  requireArrayLength(clansInput, EXPECTED_CLAN_COUNT, 'clans');
  requireArrayLength(castlesInput, EXPECTED_CASTLE_COUNT, 'castles');
  requireArrayLength(routesInput, EXPECTED_ROUTE_COUNT, 'routes');

  const clans: readonly MapClanDefinition[] = clansInput.map((clan, index) =>
    validateClan(clan, `clans[${String(index)}]`),
  );
  const castles: readonly MapCastleDefinition[] = castlesInput.map((castle, index) =>
    validateCastle(castle, `castles[${String(index)}]`, {
      minimumX: contentPadding,
      maximumX: logicalWidth - contentPadding,
      minimumY: contentPadding,
      maximumY: logicalHeight - contentPadding,
    }),
  );
  const routes: readonly MapRouteDefinition[] = routesInput.map((route, index) =>
    validateRoute(route, `routes[${String(index)}]`),
  );
  const clanIds = collectUniqueIds(clans, 'clans', 'clan');
  const castleIds = collectUniqueIds(castles, 'castles', 'castle');
  collectUniqueIds(routes, 'routes', 'route');
  validateReferences(clans, castles, routes, clanIds, castleIds);
  validateRouteGraph(castles, routes);

  return {
    logicalWidth,
    logicalHeight,
    origin: requireLiteral(requireField(root, 'origin', 'origin'), 'top-left', 'origin'),
    xAxis: requireLiteral(requireField(root, 'xAxis', 'xAxis'), 'positive-right', 'xAxis'),
    yAxis: requireLiteral(requireField(root, 'yAxis', 'yAxis'), 'positive-down', 'yAxis'),
    coordinateUnit: requireLiteral(
      requireField(root, 'coordinateUnit', 'coordinateUnit'),
      'logical-pixel',
      'coordinateUnit',
    ),
    contentPadding,
    initialCameraCenter: validatePosition(
      requireField(root, 'initialCameraCenter', 'initialCameraCenter'),
      'initialCameraCenter',
    ),
    initialZoom,
    minimumZoom,
    maximumZoom,
    clans,
    castles,
    routes,
  };
}
