import type { MapRenderDto } from '../../application/dto/map-render-dto';
import { createMapRenderDto } from '../../application/queries/create-map-render-dto';
import type { CastleId } from '../../domain/types/ids';
import type { MapDefinition } from '../../domain/types/map-definition';
import type { GameStateStore } from '../game-store';

export interface SelectedCastleViewModel {
  readonly id: CastleId;
  readonly name: string;
  readonly region: string;
  readonly clanName: string;
  readonly identificationSymbol: string;
}

export function selectMapDefinition(state: GameStateStore): MapDefinition | null {
  return state.mapDefinition;
}

export function selectMapRenderDto(state: GameStateStore): MapRenderDto | null {
  return state.mapDefinition === null ? null : createMapRenderDto(state.mapDefinition);
}

export function selectSelectedCastle(
  state: GameStateStore,
  selectedCastleId: CastleId | null,
): SelectedCastleViewModel | null {
  if (state.mapDefinition === null || selectedCastleId === null) {
    return null;
  }

  const castle = state.mapDefinition.castles.find(
    (candidate) => candidate.id === selectedCastleId,
  );
  if (castle === undefined) {
    return null;
  }

  const clan = state.mapDefinition.clans.find(
    (candidate) => candidate.id === castle.initialOwnerClanId,
  );
  if (clan === undefined) {
    return null;
  }

  return {
    id: castle.id,
    name: castle.name,
    region: castle.region,
    clanName: clan.name,
    identificationSymbol: clan.identificationSymbol,
  };
}
