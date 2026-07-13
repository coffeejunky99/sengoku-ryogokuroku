import { useEffect, useMemo } from 'react';

import { gameBridge } from '../presentation/phaser/bridge/game-bridge';
import { PhaserGame } from '../presentation/react/components/PhaserGame';
import { SelectedCastlePanel } from '../presentation/react/components/SelectedCastlePanel';
import { useGameStore } from '../state/game-store';
import {
  selectMapDefinition,
  selectMapRenderDto,
  selectSelectedCastle,
} from '../state/selectors/map-selectors';
import { useUiStore } from '../state/ui-store';

export function App() {
  const mapDefinition = useGameStore(selectMapDefinition);
  const initializeMap = useGameStore((state) => state.initializeMap);
  const isBooted = useUiStore((state) => state.isBooted);
  const selectedCastleId = useUiStore((state) => state.selectedCastleId);
  const setBooted = useUiStore((state) => state.setBooted);
  const setSelectedCastleId = useUiStore((state) => state.setSelectedCastleId);
  const mapRenderDto = useMemo(
    () => (mapDefinition === null ? null : selectMapRenderDto(useGameStore.getState())),
    [mapDefinition],
  );
  const selectedCastle = useMemo(
    () => (
      mapDefinition === null
        ? null
        : selectSelectedCastle(useGameStore.getState(), selectedCastleId)
    ),
    [mapDefinition, selectedCastleId],
  );

  useEffect(() => {
    if (mapDefinition === null) {
      initializeMap();
    }
  }, [initializeMap, mapDefinition]);

  useEffect(() => {
    return gameBridge.subscribe('boot-completed', () => {
      setBooted(true);
    });
  }, [setBooted]);

  useEffect(() => {
    return gameBridge.subscribe('castle-selected', (event) => {
      setSelectedCastleId(event.castleId);
    });
  }, [setSelectedCastleId]);

  return (
    <main className="app-shell" data-testid="app-root">
      <header className="boot-panel">
        <p className="eyebrow">Phase 02</p>
        <h1>戦国領国録</h1>
        <p role="status">{isBooted ? '起動完了' : '起動中…'}</p>
      </header>
      {mapRenderDto === null ? null : (
        <PhaserGame bridge={gameBridge} mapRenderDto={mapRenderDto} />
      )}
      <SelectedCastlePanel castle={selectedCastle} />
    </main>
  );
}
