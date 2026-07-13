import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const phaserGameMocks = vi.hoisted(() => {
  const create = vi.fn();
  const destroy = vi.fn();
  const resize = vi.fn();

  return { create, destroy, resize };
});

const resizeObserverMocks = vi.hoisted(() => {
  const disconnect = vi.fn();
  const observe = vi.fn();

  return { disconnect, observe };
});

vi.mock('phaser', () => ({
  default: {
    Game: class Game {
      private readonly canvas: HTMLCanvasElement;
      public readonly scale = { resize: phaserGameMocks.resize };

      public constructor(config: { readonly parent: HTMLElement }) {
        this.canvas = document.createElement('canvas');
        config.parent.append(this.canvas);
        phaserGameMocks.create();
      }

      public destroy(removeCanvas: boolean): void {
        phaserGameMocks.destroy(removeCanvas);
        if (removeCanvas) {
          this.canvas.remove();
        }
      }
    },
  },
}));

vi.mock('../../phaser/config/create-game-config', () => ({
  createGameConfig: (parent: HTMLElement) => ({ parent }),
}));

import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';
import { createGameBridge } from '../../phaser/bridge/game-bridge';

import { PhaserGame } from './PhaserGame';

describe('PhaserGame', () => {
  beforeEach(() => {
    phaserGameMocks.create.mockClear();
    phaserGameMocks.destroy.mockClear();
    phaserGameMocks.resize.mockClear();
    resizeObserverMocks.disconnect.mockClear();
    resizeObserverMocks.observe.mockClear();
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      public disconnect(): void {
        resizeObserverMocks.disconnect();
      }

      public observe(element: Element): void {
        resizeObserverMocks.observe(element);
      }
    });
  });

  it('keeps one canvas and emits map data under React StrictMode', () => {
    const bridge = createGameBridge();
    const mapListener = vi.fn();
    const payload = createMapRenderDto(loadMapDefinition());
    bridge.subscribe('map-state-updated', mapListener);

    const { unmount } = render(
      <StrictMode>
        <PhaserGame bridge={bridge} mapRenderDto={payload} />
      </StrictMode>,
    );

    expect(screen.getByTestId('phaser-container').querySelectorAll('canvas')).toHaveLength(1);
    expect(mapListener).toHaveBeenLastCalledWith({ type: 'map-state-updated', payload });
    expect(phaserGameMocks.create).toHaveBeenCalledTimes(2);
    expect(phaserGameMocks.destroy).toHaveBeenCalledOnce();
    expect(phaserGameMocks.resize).toHaveBeenCalledWith(1, 1);
    expect(resizeObserverMocks.observe).toHaveBeenCalledTimes(2);
    expect(resizeObserverMocks.disconnect).toHaveBeenCalledOnce();

    unmount();

    expect(screen.queryByTestId('phaser-container')).not.toBeInTheDocument();
    expect(phaserGameMocks.destroy).toHaveBeenCalledTimes(2);
    expect(resizeObserverMocks.disconnect).toHaveBeenCalledTimes(2);
  });
});
