import { useEffect } from 'react';

import { gameBridge } from '../presentation/phaser/bridge/game-bridge';
import { PhaserGame } from '../presentation/react/components/PhaserGame';
import { useUiStore } from '../state/ui-store';

export function App() {
  const isBooted = useUiStore((state) => state.isBooted);
  const setBooted = useUiStore((state) => state.setBooted);

  useEffect(() => {
    return gameBridge.subscribe('boot-completed', () => {
      setBooted(true);
    });
  }, [setBooted]);

  return (
    <main className="app-shell" data-testid="app-root">
      <header className="boot-panel">
        <p className="eyebrow">Phase 01</p>
        <h1>戦国領国録</h1>
        <p role="status">{isBooted ? '起動完了' : '起動中…'}</p>
      </header>
      <PhaserGame bridge={gameBridge} />
    </main>
  );
}
