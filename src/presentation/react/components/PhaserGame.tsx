import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

import type { MapRenderDto } from '../../../application/dto/map-render-dto';
import type { GameBridge } from '../../phaser/bridge/game-bridge';
import { createGameConfig } from '../../phaser/config/create-game-config';

interface PhaserGameProps {
  readonly bridge: GameBridge;
  readonly mapRenderDto: MapRenderDto;
}

export function PhaserGame({ bridge, mapRenderDto }: PhaserGameProps) {
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
      game.scale.resize(width, height);
      bridge.emit({ type: 'viewport-resized', width, height });
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      game.destroy(true);
      // Phaser defers destruction, but StrictMode recreates the game before the next frame.
      game.canvas.remove();
    };
  }, [bridge]);

  useEffect(() => {
    bridge.emit({ type: 'map-state-updated', payload: mapRenderDto });
  }, [bridge, mapRenderDto]);

  return <div ref={containerRef} className="phaser-container" data-testid="phaser-container" />;
}
