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

const castleObjectMocks = vi.hoisted(() => {
  const construct = vi.fn();
  const destroy = vi.fn();
  const updateFromDto = vi.fn();
  const selectionHandlers: ((castleId: string) => void)[] = [];
  const castleIds: string[] = [];

  return {
    construct,
    destroy,
    updateFromDto,
    register(castleId: string, selectionHandler: (castleId: string) => void) {
      castleIds.push(castleId);
      selectionHandlers.push(selectionHandler);
      construct(castleId);
    },
    select(index: number) {
      const selectionHandler = selectionHandlers[index];
      const castleId = castleIds[index];
      if (selectionHandler === undefined || castleId === undefined) {
        throw new Error(`No mocked castle exists at index ${String(index)}.`);
      }
      selectionHandler(castleId);
    },
    reset() {
      construct.mockClear();
      destroy.mockClear();
      updateFromDto.mockClear();
      castleIds.length = 0;
      selectionHandlers.length = 0;
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

vi.mock('../game-objects/CastleMapObject', () => ({
  CastleMapObject: class CastleMapObject {
    public constructor(
      _scene: unknown,
      castle: { readonly id: string },
      selectionHandler: (castleId: string) => void,
    ) {
      castleObjectMocks.register(castle.id, selectionHandler);
    }

    public updateFromDto(castle: unknown): void {
      castleObjectMocks.updateFromDto(castle);
    }

    public destroy(): void {
      castleObjectMocks.destroy();
    }
  },
}));

import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';
import { createGameBridge } from '../bridge/game-bridge';

import { MapScene } from './MapScene';

describe('MapScene', () => {
  beforeEach(() => {
    phaserMocks.reset();
    castleObjectMocks.reset();
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
    expect(castleObjectMocks.construct).toHaveBeenCalledTimes(10);
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
    expect(castleObjectMocks.construct).toHaveBeenCalledTimes(10);
    expect(castleObjectMocks.updateFromDto).toHaveBeenCalledTimes(10);
  });

  it('emits the selected castle ID through the bridge', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const selectedCastle = payload.castles[0];
    if (selectedCastle === undefined) {
      throw new Error('The formal map fixture has no castle.');
    }
    const selectionListener = vi.fn();
    bridge.subscribe('castle-selected', selectionListener);
    const scene = new MapScene(bridge);
    scene.create();
    bridge.emit({ type: 'map-state-updated', payload });

    castleObjectMocks.select(0);

    expect(selectionListener).toHaveBeenCalledWith({
      type: 'castle-selected',
      castleId: selectedCastle.id,
    });
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
    expect(castleObjectMocks.destroy).toHaveBeenCalledTimes(10);
  });
});
