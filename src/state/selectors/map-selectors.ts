import type { MapRenderDto } from '../../application/dto/map-render-dto';
import { createMapRenderDto } from '../../application/queries/create-map-render-dto';
import type { MapDefinition } from '../../domain/types/map-definition';
import type { GameStateStore } from '../game-store';

export function selectMapDefinition(state: GameStateStore): MapDefinition | null {
  return state.mapDefinition;
}

export function selectMapRenderDto(state: GameStateStore): MapRenderDto | null {
  return state.mapDefinition === null ? null : createMapRenderDto(state.mapDefinition);
}
