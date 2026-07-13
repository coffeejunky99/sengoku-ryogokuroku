import type { Brand, CastleId, ClanId, RouteId } from './ids';

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export type HexColor = Brand<string, 'HexColor'>;

export interface MapClanDefinition {
  readonly id: ClanId;
  readonly name: string;
  readonly color: HexColor;
  readonly crestAssetKey: string;
  readonly identificationSymbol: string;
  readonly capitalCastleId: CastleId;
  readonly playable: boolean;
}

export interface MapCastleDefinition {
  readonly id: CastleId;
  readonly name: string;
  readonly region: string;
  readonly position: MapPosition;
  readonly initialOwnerClanId: ClanId;
}

export interface MapRouteDefinition {
  readonly id: RouteId;
  readonly fromCastleId: CastleId;
  readonly toCastleId: CastleId;
  readonly distance: number;
  readonly terrain: 'mountain' | 'plain';
  readonly isBidirectional: true;
}

export interface MapDefinition {
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly origin: 'top-left';
  readonly xAxis: 'positive-right';
  readonly yAxis: 'positive-down';
  readonly coordinateUnit: 'logical-pixel';
  readonly contentPadding: number;
  readonly initialCameraCenter: MapPosition;
  readonly initialZoom: number;
  readonly minimumZoom: number;
  readonly maximumZoom: number;
  readonly clans: readonly MapClanDefinition[];
  readonly castles: readonly MapCastleDefinition[];
  readonly routes: readonly MapRouteDefinition[];
}
