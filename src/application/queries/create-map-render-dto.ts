import type {
  MapCastleDefinition,
  MapClanDefinition,
  MapDefinition,
  MapPosition,
} from '../../domain/types/map-definition';
import type {
  MapRenderCastleDto,
  MapRenderClanDto,
  MapRenderDto,
  MapRenderPositionDto,
  MapRenderRouteDto,
} from '../dto/map-render-dto';

function toPositionDto(position: MapPosition): MapRenderPositionDto {
  return {
    x: position.x,
    y: position.y,
  };
}

function toClanDto(clan: MapClanDefinition): MapRenderClanDto {
  return {
    id: clan.id,
    name: clan.name,
    color: clan.color,
    symbol: clan.identificationSymbol,
  };
}

function requireClan(
  clansById: ReadonlyMap<string, MapClanDefinition>,
  castle: MapCastleDefinition,
): MapClanDefinition {
  const clan = clansById.get(castle.initialOwnerClanId);
  if (clan === undefined) {
    throw new Error(`Unknown owner clan id: ${castle.initialOwnerClanId}`);
  }

  return clan;
}

function toCastleDto(
  castle: MapCastleDefinition,
  clansById: ReadonlyMap<string, MapClanDefinition>,
): MapRenderCastleDto {
  const owner = requireClan(clansById, castle);

  return {
    id: castle.id,
    name: castle.name,
    position: toPositionDto(castle.position),
    ownerColor: owner.color,
    ownerSymbol: owner.identificationSymbol,
  };
}

function requireCastlePosition(
  positionsByCastleId: ReadonlyMap<string, MapRenderPositionDto>,
  castleId: string,
): MapRenderPositionDto {
  const position = positionsByCastleId.get(castleId);
  if (position === undefined) {
    throw new Error(`Unknown route castle id: ${castleId}`);
  }

  return position;
}

export function createMapRenderDto(mapDefinition: MapDefinition): MapRenderDto {
  const clansById = new Map<string, MapClanDefinition>(
    mapDefinition.clans.map((clan) => [clan.id, clan]),
  );
  const positionsByCastleId = new Map<string, MapRenderPositionDto>(
    mapDefinition.castles.map((castle) => [castle.id, toPositionDto(castle.position)]),
  );

  const clans: readonly MapRenderClanDto[] = mapDefinition.clans.map(toClanDto);
  const castles: readonly MapRenderCastleDto[] = mapDefinition.castles.map((castle) =>
    toCastleDto(castle, clansById),
  );
  const routes: readonly MapRenderRouteDto[] = mapDefinition.routes.map((route) => ({
    from: requireCastlePosition(positionsByCastleId, route.fromCastleId),
    to: requireCastlePosition(positionsByCastleId, route.toCastleId),
    terrain: route.terrain,
  }));

  return {
    logicalWidth: mapDefinition.logicalWidth,
    logicalHeight: mapDefinition.logicalHeight,
    camera: {
      center: toPositionDto(mapDefinition.initialCameraCenter),
      initialZoom: mapDefinition.initialZoom,
      minimumZoom: mapDefinition.minimumZoom,
      maximumZoom: mapDefinition.maximumZoom,
    },
    clans,
    castles,
    routes,
  };
}
