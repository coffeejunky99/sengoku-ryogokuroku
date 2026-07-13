import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

import type { GameBridge } from '../../phaser/bridge/game-bridge';
import { createGameConfig } from '../../phaser/config/create-game-config';

interface PhaserGameProps {
  readonly bridge: GameBridge;
}

export function PhaserGame({ bridge }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return undefined;
    }

    let game: Phaser.Game;
    try {
      game = new Phaser.Game(createGameConfig(container, bridge));
    } catch (error: unknown) {
      console.error('Phaser initialization failed.', error);
      container.setAttribute('role', 'alert');
      container.textContent = 'Phaserの起動に失敗しました。';
      return undefined;
    }

    const resize = (): void => {
      const width = Math.max(1, Math.round(container.clientWidth));
      const height = Math.max(1, Math.round(container.clientHeight));
      bridge.emit({ type: 'viewport-resized', width, height });
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      game.destroy(true);
    };
  }, [bridge]);

  return <div ref={containerRef} className="phaser-container" data-testid="phaser-container" />;
}
