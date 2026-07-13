import { beforeEach, describe, expect, it, vi } from 'vitest';

const phaserMocks = vi.hoisted(() => {
  const clear = vi.fn();
  const destroy = vi.fn();
  const lineBetween = vi.fn();
  const lineStyle = vi.fn();
  const graphics = { clear, destroy, lineBetween, lineStyle };
  const addGraphics = vi.fn(() => graphics);
  let shutdown: (() => void) | null = null;

  return {
    addGraphics,
    clear,
    destroy,
    lineBetween,
    lineStyle,
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
      shutdown = null;
    },
  };
});

const castleObjectMocks = vi.hoisted(() => {
  const construct = vi.fn();
  const destroy = vi.fn();
  const updateFromDto = vi.fn();
  const selectionHandlers: ((castleId: string, pointer: MockPointer) => void)[] = [];
  const castleIds: string[] = [];

  interface MockPointer {
    readonly id: number;
    readonly x: number;
    readonly y: number;
    readonly button: number;
  }

  return {
    construct,
    destroy,
    updateFromDto,
    register(
      castleId: string,
      selectionHandler: (castleId: string, pointer: MockPointer) => void,
    ) {
      castleIds.push(castleId);
      selectionHandlers.push(selectionHandler);
      construct(castleId);
    },
    select(index: number, pointer: MockPointer) {
      const selectionHandler = selectionHandlers[index];
      const castleId = castleIds[index];
      if (selectionHandler === undefined || castleId === undefined) {
        throw new Error(`No mocked castle exists at index ${String(index)}.`);
      }
      selectionHandler(castleId, pointer);
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

const cameraControllerMocks = vi.hoisted(() => {
  const applyMap = vi.fn();
  const construct = vi.fn();
  const consumeCastleTap = vi.fn((pointer: unknown) => {
    void pointer;
    return true;
  });
  const destroy = vi.fn();

  return {
    applyMap,
    construct,
    consumeCastleTap,
    destroy,
    reset() {
      applyMap.mockClear();
      construct.mockClear();
      consumeCastleTap.mockReset();
      consumeCastleTap.mockReturnValue(true);
      destroy.mockClear();
    },
  };
});

vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      public readonly add = { graphics: phaserMocks.addGraphics };
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

vi.mock('../systems/MapCameraController', () => ({
  MapCameraController: class MapCameraController {
    public constructor(scene: unknown) {
      cameraControllerMocks.construct(scene);
    }

    public applyMap(map: unknown): void {
      cameraControllerMocks.applyMap(map);
    }

    public consumeCastleTap(pointer: unknown): boolean {
      return cameraControllerMocks.consumeCastleTap(pointer);
    }

    public destroy(): void {
      cameraControllerMocks.destroy();
    }
  },
}));

vi.mock('../game-objects/CastleMapObject', () => ({
  CastleMapObject: class CastleMapObject {
    public constructor(
      _scene: unknown,
      castle: { readonly id: string },
      selectionHandler: (
        castleId: string,
        pointer: { readonly id: number; readonly x: number; readonly y: number; readonly button: number },
      ) => void,
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
    cameraControllerMocks.reset();
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

    expect(cameraControllerMocks.applyMap).toHaveBeenCalledWith(payload);
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

    const pointer = { id: 1, x: selectedCastle.position.x, y: selectedCastle.position.y, button: 0 };
    castleObjectMocks.select(0, pointer);

    expect(cameraControllerMocks.consumeCastleTap).toHaveBeenCalledWith(pointer);
    expect(selectionListener).toHaveBeenCalledWith({
      type: 'castle-selected',
      castleId: selectedCastle.id,
    });
  });

  it('does not emit castle selection when the camera controller rejects the gesture', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const selectionListener = vi.fn();
    bridge.subscribe('castle-selected', selectionListener);
    const scene = new MapScene(bridge);
    scene.create();
    bridge.emit({ type: 'map-state-updated', payload });
    cameraControllerMocks.consumeCastleTap.mockReturnValue(false);

    castleObjectMocks.select(0, { id: 1, x: 800, y: 600, button: 0 });

    expect(selectionListener).not.toHaveBeenCalled();
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
    expect(cameraControllerMocks.destroy).toHaveBeenCalledOnce();
  });
});
