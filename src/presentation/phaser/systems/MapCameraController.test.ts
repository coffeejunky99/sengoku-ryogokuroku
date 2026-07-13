import Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const phaserMocks = vi.hoisted(() => ({
  addPointer: vi.fn(),
  setBounds: vi.fn(),
}));

vi.mock('phaser', () => {
  class EventEmitter {
    private readonly listeners = new Map<string, Set<(...parameters: readonly unknown[]) => void>>();

    public on(event: string, listener: (...parameters: readonly unknown[]) => void): this {
      const eventListeners = this.listeners.get(event) ?? new Set();
      eventListeners.add(listener);
      this.listeners.set(event, eventListeners);
      return this;
    }

    public off(event: string, listener: (...parameters: readonly unknown[]) => void): this {
      this.listeners.get(event)?.delete(listener);
      return this;
    }

    public emit(event: string, ...parameters: readonly unknown[]): boolean {
      this.listeners.get(event)?.forEach((listener) => {
        listener(...parameters);
      });
      return true;
    }

    public listenerCount(event: string): number {
      return this.listeners.get(event)?.size ?? 0;
    }
  }

  class InputPlugin extends EventEmitter {
    public readonly manager = { pointersTotal: 1 };

    public addPointer(quantity: number): readonly object[] {
      phaserMocks.addPointer(quantity);
      this.manager.pointersTotal += quantity;
      return [];
    }
  }

  class Camera {
    public height = 300;
    public scrollX = 0;
    public scrollY = 0;
    public useBounds = true;
    public width = 400;
    public x = 0;
    public y = 0;
    public zoom = 1;

    public setBounds(x: number, y: number, width: number, height: number): this {
      phaserMocks.setBounds(x, y, width, height);
      return this;
    }

    public setScroll(x: number, y: number): this {
      this.scrollX = x;
      this.scrollY = y;
      return this;
    }

    public setZoom(zoom: number): this {
      this.zoom = zoom;
      return this;
    }
  }

  class Scene {
    public readonly cameras = { main: new Camera() };
    public readonly input = new InputPlugin();
    public readonly scale = new EventEmitter();
  }

  return {
    default: {
      Input: {
        Events: {
          POINTER_DOWN: 'pointerdown',
          POINTER_MOVE: 'pointermove',
          POINTER_UP: 'pointerup',
          POINTER_UP_OUTSIDE: 'pointerupoutside',
          POINTER_WHEEL: 'wheel',
        },
      },
      Scale: {
        Events: {
          RESIZE: 'resize',
        },
      },
      Scene,
    },
  };
});

import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';

import {
  clampCameraScroll,
  MapCameraController,
  type MapPointerInput,
} from './MapCameraController';

const map = createMapRenderDto(loadMapDefinition());

function pointer(id: number, x: number, y: number): MapPointerInput {
  return { id, x, y, button: 0 };
}

function worldPointAt(
  camera: Phaser.Cameras.Scene2D.Camera,
  screenX: number,
  screenY: number,
): { readonly x: number; readonly y: number } {
  return {
    x: camera.scrollX + camera.width / 2 +
      (screenX - camera.x - camera.width / 2) / camera.zoom,
    y: camera.scrollY + camera.height / 2 +
      (screenY - camera.y - camera.height / 2) / camera.zoom,
  };
}

describe('clampCameraScroll', () => {
  it('clamps the viewport to every map edge', () => {
    expect(
      clampCameraScroll(
        { x: -10_000, y: 10_000 },
        { width: 400, height: 300 },
        { width: 1_600, height: 1_200 },
        1,
      ),
    ).toEqual({ x: 0, y: 900 });
  });

  it('fixes the camera to the map center when the viewport is larger than the map', () => {
    expect(
      clampCameraScroll(
        { x: 500, y: 500 },
        { width: 2_000, height: 1_600 },
        { width: 1_600, height: 1_200 },
        1,
      ),
    ).toEqual({ x: -200, y: -200 });
  });
});

describe('MapCameraController', () => {
  let scene: Phaser.Scene;
  let controller: MapCameraController;

  beforeEach(() => {
    phaserMocks.addPointer.mockClear();
    phaserMocks.setBounds.mockClear();
    scene = new Phaser.Scene();
    controller = new MapCameraController(scene);
  });

  it('applies the formal initial zoom, center, world bounds, and second touch pointer', () => {
    controller.applyMap(map);

    expect(phaserMocks.addPointer).toHaveBeenCalledWith(1);
    expect(phaserMocks.setBounds).toHaveBeenCalledWith(0, 0, 1600, 1200);
    expect(scene.cameras.main.zoom).toBe(0.75);
    expect(scene.cameras.main.scrollX + scene.cameras.main.width / 2).toBe(800);
    expect(scene.cameras.main.scrollY + scene.cameras.main.height / 2).toBe(600);
  });

  it('clamps zoom to the DTO minimum and maximum on later DTO updates', () => {
    controller.applyMap(map);

    scene.cameras.main.zoom = 0.1;
    controller.applyMap(map);
    expect(scene.cameras.main.zoom).toBe(0.5);

    scene.cameras.main.zoom = 10;
    controller.applyMap(map);
    expect(scene.cameras.main.zoom).toBe(1.8);
  });

  it('clamps wheel and pinch gestures to the formal zoom range', () => {
    controller.applyMap(map);

    for (let index = 0; index < 20; index += 1) {
      scene.input.emit(
        Phaser.Input.Events.POINTER_WHEEL,
        pointer(0, 200, 150),
        [],
        0,
        -100,
        0,
      );
    }
    expect(scene.cameras.main.zoom).toBe(1.8);

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(2, 200, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(2, 101, 100));
    expect(scene.cameras.main.zoom).toBe(0.5);
  });

  it('updates and clamps scroll during a left-mouse drag', () => {
    controller.applyMap(map);
    const initialScroll = scene.cameras.main.scrollX;

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(0, 200, 150));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(0, 240, 150));

    expect(scene.cameras.main.scrollX).toBeCloseTo(initialScroll - 40 / 0.75);

    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(0, 10_000, 150));
    expect(scene.cameras.main.scrollX).toBeCloseTo((400 / 0.75 - 400) / 2);
  });

  it('updates scroll during a one-finger drag', () => {
    controller.applyMap(map);
    const initialScroll = scene.cameras.main.scrollY;

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 200, 150));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(1, 200, 180));

    expect(scene.cameras.main.scrollY).toBeCloseTo(initialScroll - 30 / 0.75);
  });

  it('zooms around the wheel pointer without exceeding one-step sensitivity', () => {
    controller.applyMap(map);
    const before = worldPointAt(scene.cameras.main, 250, 120);

    scene.input.emit(
      Phaser.Input.Events.POINTER_WHEEL,
      pointer(0, 250, 120),
      [],
      0,
      -1_000,
      0,
    );

    const after = worldPointAt(scene.cameras.main, 250, 120);
    expect(scene.cameras.main.zoom).toBeCloseTo(0.75 * Math.exp(0.15));
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('zooms around the moving pinch center', () => {
    controller.applyMap(map);
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(2, 300, 100));
    const before = worldPointAt(scene.cameras.main, 200, 100);

    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(2, 350, 100));

    const after = worldPointAt(scene.cameras.main, 225, 100);
    expect(scene.cameras.main.zoom).toBeCloseTo(0.75 * 1.25);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('allows only a small non-pinch gesture to become a castle tap', () => {
    controller.applyMap(map);

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(1, 104, 104));
    expect(controller.consumeCastleTap(pointer(1, 104, 104))).toBe(true);

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(2, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(2, 120, 100));
    expect(controller.consumeCastleTap(pointer(2, 120, 100))).toBe(false);

    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(3, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(4, 200, 100));
    expect(controller.consumeCastleTap(pointer(3, 100, 100))).toBe(false);
    expect(controller.consumeCastleTap(pointer(4, 200, 100))).toBe(false);
  });

  it('rebases the remaining pointer after pinch and clears state after pointer end', () => {
    controller.applyMap(map);
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 100, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(2, 200, 100));
    scene.input.emit(Phaser.Input.Events.POINTER_UP, pointer(2, 200, 100));
    const scrollAfterPinch = scene.cameras.main.scrollX;

    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(1, 120, 100));
    expect(scene.cameras.main.scrollX).toBeLessThan(scrollAfterPinch);
    expect(controller.consumeCastleTap(pointer(1, 120, 100))).toBe(false);

    const scrollAfterEnd = scene.cameras.main.scrollX;
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(1, 200, 100));
    expect(scene.cameras.main.scrollX).toBe(scrollAfterEnd);
  });

  it('reclamps after resize and centers an oversized viewport', () => {
    controller.applyMap(map);
    scene.cameras.main.width = 2_000;
    scene.cameras.main.height = 1_600;

    scene.scale.emit(Phaser.Scale.Events.RESIZE);

    expect(scene.cameras.main.scrollX + scene.cameras.main.width / 2).toBe(800);
    expect(scene.cameras.main.scrollY + scene.cameras.main.height / 2).toBe(600);
  });

  it('preserves a user-controlled camera across DTO updates', () => {
    controller.applyMap(map);
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 200, 150));
    scene.input.emit(Phaser.Input.Events.POINTER_MOVE, pointer(1, 160, 120));
    scene.input.emit(Phaser.Input.Events.POINTER_UP, pointer(1, 160, 120));
    scene.input.emit(
      Phaser.Input.Events.POINTER_WHEEL,
      pointer(0, 200, 150),
      [],
      0,
      -50,
      0,
    );
    const cameraState = {
      scrollX: scene.cameras.main.scrollX,
      scrollY: scene.cameras.main.scrollY,
      zoom: scene.cameras.main.zoom,
    };

    controller.applyMap(map);

    expect(scene.cameras.main.scrollX).toBeCloseTo(cameraState.scrollX);
    expect(scene.cameras.main.scrollY).toBeCloseTo(cameraState.scrollY);
    expect(scene.cameras.main.zoom).toBeCloseTo(cameraState.zoom);
  });

  it('removes every listener and clears pointer state on destroy', () => {
    controller.applyMap(map);
    scene.input.emit(Phaser.Input.Events.POINTER_DOWN, pointer(1, 100, 100));

    controller.destroy();

    expect(scene.input.listenerCount(Phaser.Input.Events.POINTER_DOWN)).toBe(0);
    expect(scene.input.listenerCount(Phaser.Input.Events.POINTER_MOVE)).toBe(0);
    expect(scene.input.listenerCount(Phaser.Input.Events.POINTER_UP)).toBe(0);
    expect(scene.input.listenerCount(Phaser.Input.Events.POINTER_UP_OUTSIDE)).toBe(0);
    expect(scene.input.listenerCount(Phaser.Input.Events.POINTER_WHEEL)).toBe(0);
    expect(scene.scale.listenerCount(Phaser.Scale.Events.RESIZE)).toBe(0);
    expect(controller.consumeCastleTap(pointer(1, 100, 100))).toBe(false);
  });
});
