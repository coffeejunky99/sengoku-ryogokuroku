import { beforeEach, describe, expect, it, vi } from 'vitest';

const phaserMocks = vi.hoisted(() => {
  const clear = vi.fn();
  const destroy = vi.fn();
  const lineBetween = vi.fn();
  const lineStyle = vi.fn();
  const graphics = { clear, destroy, lineBetween, lineStyle };
  const addGraphics = vi.fn(() => graphics);
  const setBounds = vi.fn();
  let shutdown: (() => void) | null = null;

  return {
    addGraphics,
    clear,
    destroy,
    lineBetween,
    lineStyle,
    setBounds,
    captureShutdown(listener: () => void) {
      shutdown = listener;
    },
    runShutdown() {
      shutdown?.();
    },
    reset() {
      addGraphics.mockClear();
      clear.mockClear();
      destroy.mockClear();
      lineBetween.mockClear();
      lineStyle.mockClear();
      setBounds.mockClear();
      shutdown = null;
    },
  };
});

vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      public readonly add = { graphics: phaserMocks.addGraphics };
      public readonly cameras = { main: { setBounds: phaserMocks.setBounds } };
      public readonly events = {
        once: (_event: string, listener: () => void, context: unknown) => {
          phaserMocks.captureShutdown(() => {
            listener.call(context);
          });
        },
      };
    },
    Scenes: {
      Events: {
        SHUTDOWN: 'shutdown',
      },
    },
  },
}));

import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';
import { createGameBridge } from '../bridge/game-bridge';

import { MapScene } from './MapScene';

describe('MapScene', () => {
  beforeEach(() => {
    phaserMocks.reset();
  });

  it('does not create graphics before receiving map data', () => {
    new MapScene(createGameBridge()).create();

    expect(phaserMocks.addGraphics).not.toHaveBeenCalled();
    expect(phaserMocks.lineBetween).not.toHaveBeenCalled();
  });

  it('replays a pending DTO and draws all thirteen routes at their coordinates', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    bridge.emit({ type: 'map-state-updated', payload });

    new MapScene(bridge).create();

    expect(phaserMocks.setBounds).toHaveBeenCalledWith(0, 0, 1600, 1200);
    expect(phaserMocks.addGraphics).toHaveBeenCalledOnce();
    expect(phaserMocks.lineBetween).toHaveBeenCalledTimes(13);
    expect(phaserMocks.lineBetween).toHaveBeenNthCalledWith(1, 760, 150, 940, 300);
  });

  it('clears and redraws the same Graphics object when the DTO changes', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const scene = new MapScene(bridge);
    scene.create();

    bridge.emit({ type: 'map-state-updated', payload });
    bridge.emit({ type: 'map-state-updated', payload });

    expect(phaserMocks.addGraphics).toHaveBeenCalledOnce();
    expect(phaserMocks.clear).toHaveBeenCalledTimes(2);
    expect(phaserMocks.lineBetween).toHaveBeenCalledTimes(26);
  });

  it('unsubscribes and destroys route graphics on shutdown', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const scene = new MapScene(bridge);
    scene.create();
    bridge.emit({ type: 'map-state-updated', payload });

    phaserMocks.runShutdown();
    bridge.emit({ type: 'map-state-updated', payload });

    expect(phaserMocks.destroy).toHaveBeenCalledOnce();
    expect(phaserMocks.clear).toHaveBeenCalledOnce();
    expect(phaserMocks.lineBetween).toHaveBeenCalledTimes(13);
  });
});
