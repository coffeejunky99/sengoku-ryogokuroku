import type { CastleId } from '../../domain/types/ids';

export interface MapRenderPositionDto {
  readonly x: number;
  readonly y: number;
}

export interface MapRenderCameraDto {
  readonly center: MapRenderPositionDto;
  readonly initialZoom: number;
  readonly minimumZoom: number;
  readonly maximumZoom: number;
}

export interface MapRenderClanDto {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly symbol: string;
}

export interface MapRenderCastleDto {
  readonly id: CastleId;
  readonly name: string;
  readonly position: MapRenderPositionDto;
  readonly ownerColor: string;
  readonly ownerSymbol: string;
}

export interface MapRenderRouteDto {
  readonly from: MapRenderPositionDto;
  readonly to: MapRenderPositionDto;
  readonly terrain: 'mountain' | 'plain';
}

export interface MapRenderDto {
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly camera: MapRenderCameraDto;
  readonly clans: readonly MapRenderClanDto[];
  readonly castles: readonly MapRenderCastleDto[];
  readonly routes: readonly MapRenderRouteDto[];
}
