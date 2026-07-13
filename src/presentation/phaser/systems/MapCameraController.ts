import Phaser from 'phaser';

import type { MapRenderDto } from '../../../application/dto/map-render-dto';

export const MAP_TAP_MOVEMENT_THRESHOLD = 8;
export const MAP_WHEEL_ZOOM_FACTOR = 0.0015;

const MAXIMUM_WHEEL_DELTA = 100;
const MINIMUM_PINCH_DISTANCE = 1;
const REQUIRED_TOUCH_POINTERS = 2;
const WORLD_ORIGIN = 0;

export interface MapPointerInput {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly button: number;
}

export interface CameraScrollPosition {
  readonly x: number;
  readonly y: number;
}

interface PointerState {
  readonly id: number;
  startX: number;
  startY: number;
  previousX: number;
  previousY: number;
  currentX: number;
  currentY: number;
  dragging: boolean;
  selectionSuppressed: boolean;
}

interface PinchState {
  readonly firstPointerId: number;
  readonly secondPointerId: number;
  previousCenterX: number;
  previousCenterY: number;
  previousDistance: number;
}

interface MapCameraConstraints {
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly minimumZoom: number;
  readonly maximumZoom: number;
}

interface CameraAxisClampInput {
  readonly scroll: number;
  readonly viewportSize: number;
  readonly worldSize: number;
  readonly zoom: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampCameraAxis({
  scroll,
  viewportSize,
  worldSize,
  zoom,
}: CameraAxisClampInput): number {
  const visibleWorldSize = viewportSize / zoom;
  if (visibleWorldSize >= worldSize) {
    return worldSize / 2 - viewportSize / 2;
  }

  const minimumScroll = (visibleWorldSize - viewportSize) / 2;
  const maximumScroll = worldSize - (visibleWorldSize + viewportSize) / 2;
  return clamp(scroll, minimumScroll, maximumScroll);
}

export function clampCameraScroll(
  scroll: CameraScrollPosition,
  viewport: { readonly width: number; readonly height: number },
  world: { readonly width: number; readonly height: number },
  zoom: number,
): CameraScrollPosition {
  return {
    x: clampCameraAxis({
      scroll: scroll.x,
      viewportSize: viewport.width,
      worldSize: world.width,
      zoom,
    }),
    y: clampCameraAxis({
      scroll: scroll.y,
      viewportSize: viewport.height,
      worldSize: world.height,
      zoom,
    }),
  };
}

function distanceBetween(first: PointerState, second: PointerState): number {
  return Math.hypot(first.currentX - second.currentX, first.currentY - second.currentY);
}

export class MapCameraController {
  private readonly activePointers = new Map<number, PointerState>();
  private constraints: MapCameraConstraints | null = null;
  private initialized = false;
  private pinch: PinchState | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    const additionalPointers = REQUIRED_TOUCH_POINTERS - this.scene.input.manager.pointersTotal;
    if (additionalPointers > 0) {
      this.scene.input.addPointer(additionalPointers);
    }

    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown);
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp);
    this.scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.handleWheel);
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);
  }

  public applyMap(map: MapRenderDto): void {
    this.constraints = {
      logicalWidth: map.logicalWidth,
      logicalHeight: map.logicalHeight,
      minimumZoom: map.camera.minimumZoom,
      maximumZoom: map.camera.maximumZoom,
    };

    const camera = this.scene.cameras.main;
    camera.setBounds(
      WORLD_ORIGIN,
      WORLD_ORIGIN,
      map.logicalWidth,
      map.logicalHeight,
    );

    // Phaser aligns a world smaller than the viewport to one edge, so this controller owns clamping.
    camera.useBounds = false;

    if (!this.initialized) {
      camera.setZoom(
        clamp(map.camera.initialZoom, map.camera.minimumZoom, map.camera.maximumZoom),
      );
      camera.setScroll(
        map.camera.center.x - camera.width / 2,
        map.camera.center.y - camera.height / 2,
      );
      this.initialized = true;
    } else {
      camera.setZoom(
        clamp(camera.zoom, map.camera.minimumZoom, map.camera.maximumZoom),
      );
    }

    this.clampScroll();
  }

  public consumeCastleTap(pointer: MapPointerInput): boolean {
    const state = this.activePointers.get(pointer.id);
    if (state === undefined) {
      return false;
    }

    this.updatePointerPosition(state, pointer);
    const isTap = this.isTap(state);
    this.finishPointer(pointer.id);
    return isTap;
  }

  public destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp);
    this.scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.handleWheel);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.resetInputState();
  }

  private readonly handlePointerDown = (pointer: MapPointerInput): void => {
    if (pointer.button !== 0) {
      return;
    }

    this.activePointers.set(pointer.id, {
      id: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      previousX: pointer.x,
      previousY: pointer.y,
      currentX: pointer.x,
      currentY: pointer.y,
      dragging: false,
      selectionSuppressed: false,
    });

    if (this.activePointers.size === REQUIRED_TOUCH_POINTERS) {
      this.startPinch();
    }
  };

  private readonly handlePointerMove = (pointer: MapPointerInput): void => {
    const state = this.activePointers.get(pointer.id);
    if (state === undefined) {
      return;
    }

    this.updatePointerPosition(state, pointer);

    if (this.pinch !== null) {
      this.updatePinch();
      return;
    }

    const movement = Math.hypot(state.currentX - state.startX, state.currentY - state.startY);
    if (movement > MAP_TAP_MOVEMENT_THRESHOLD) {
      state.dragging = true;
    }

    if (state.dragging) {
      const camera = this.scene.cameras.main;
      camera.setScroll(
        camera.scrollX - (state.currentX - state.previousX) / camera.zoom,
        camera.scrollY - (state.currentY - state.previousY) / camera.zoom,
      );
      this.clampScroll();
    }

    state.previousX = state.currentX;
    state.previousY = state.currentY;
  };

  private readonly handlePointerUp = (pointer: MapPointerInput): void => {
    const state = this.activePointers.get(pointer.id);
    if (state === undefined) {
      return;
    }

    this.updatePointerPosition(state, pointer);
    this.finishPointer(pointer.id);
  };

  private readonly handleWheel = (
    pointer: MapPointerInput,
    _currentlyOver: readonly Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    if (this.constraints === null) {
      return;
    }

    const limitedDelta = clamp(deltaY, -MAXIMUM_WHEEL_DELTA, MAXIMUM_WHEEL_DELTA);
    const targetZoom = this.scene.cameras.main.zoom * Math.exp(
      -limitedDelta * MAP_WHEEL_ZOOM_FACTOR,
    );
    this.zoomBetweenScreenPoints(pointer.x, pointer.y, pointer.x, pointer.y, targetZoom);
  };

  private readonly handleResize = (): void => {
    this.clampScroll();
  };

  private startPinch(): void {
    const pointers = [...this.activePointers.values()];
    const first = pointers[0];
    const second = pointers[1];
    if (first === undefined || second === undefined) {
      return;
    }

    pointers.forEach((state) => {
      state.selectionSuppressed = true;
      state.dragging = false;
    });
    this.pinch = {
      firstPointerId: first.id,
      secondPointerId: second.id,
      previousCenterX: (first.currentX + second.currentX) / 2,
      previousCenterY: (first.currentY + second.currentY) / 2,
      previousDistance: distanceBetween(first, second),
    };
  }

  private updatePinch(): void {
    const pinch = this.pinch;
    if (pinch === null) {
      return;
    }

    const first = this.activePointers.get(pinch.firstPointerId);
    const second = this.activePointers.get(pinch.secondPointerId);
    if (first === undefined || second === undefined) {
      return;
    }

    const currentCenterX = (first.currentX + second.currentX) / 2;
    const currentCenterY = (first.currentY + second.currentY) / 2;
    const currentDistance = distanceBetween(first, second);
    if (
      pinch.previousDistance >= MINIMUM_PINCH_DISTANCE &&
      currentDistance >= MINIMUM_PINCH_DISTANCE
    ) {
      const targetZoom = this.scene.cameras.main.zoom *
        (currentDistance / pinch.previousDistance);
      this.zoomBetweenScreenPoints(
        pinch.previousCenterX,
        pinch.previousCenterY,
        currentCenterX,
        currentCenterY,
        targetZoom,
      );
    }

    pinch.previousCenterX = currentCenterX;
    pinch.previousCenterY = currentCenterY;
    pinch.previousDistance = currentDistance;
  }

  private zoomBetweenScreenPoints(
    sourceScreenX: number,
    sourceScreenY: number,
    targetScreenX: number,
    targetScreenY: number,
    requestedZoom: number,
  ): void {
    const constraints = this.constraints;
    if (constraints === null) {
      return;
    }

    const camera = this.scene.cameras.main;
    const worldX = camera.scrollX + camera.width / 2 +
      (sourceScreenX - camera.x - camera.width / 2) / camera.zoom;
    const worldY = camera.scrollY + camera.height / 2 +
      (sourceScreenY - camera.y - camera.height / 2) / camera.zoom;
    const zoom = clamp(
      requestedZoom,
      constraints.minimumZoom,
      constraints.maximumZoom,
    );

    camera.setZoom(zoom);
    camera.setScroll(
      worldX - camera.width / 2 -
        (targetScreenX - camera.x - camera.width / 2) / zoom,
      worldY - camera.height / 2 -
        (targetScreenY - camera.y - camera.height / 2) / zoom,
    );
    this.clampScroll();
  }

  private finishPointer(pointerId: number): void {
    const wasPinching = this.pinch !== null;
    this.activePointers.delete(pointerId);

    if (wasPinching) {
      this.pinch = null;
      this.activePointers.forEach((state) => {
        state.startX = state.currentX;
        state.startY = state.currentY;
        state.previousX = state.currentX;
        state.previousY = state.currentY;
        state.dragging = false;
        state.selectionSuppressed = true;
      });
    }

    if (this.activePointers.size === 0) {
      this.pinch = null;
    }
  }

  private isTap(state: PointerState): boolean {
    const movement = Math.hypot(state.currentX - state.startX, state.currentY - state.startY);
    return !state.dragging &&
      !state.selectionSuppressed &&
      this.pinch === null &&
      movement <= MAP_TAP_MOVEMENT_THRESHOLD;
  }

  private updatePointerPosition(state: PointerState, pointer: MapPointerInput): void {
    state.currentX = pointer.x;
    state.currentY = pointer.y;
  }

  private clampScroll(): void {
    const constraints = this.constraints;
    if (constraints === null) {
      return;
    }

    const camera = this.scene.cameras.main;
    const scroll = clampCameraScroll(
      { x: camera.scrollX, y: camera.scrollY },
      { width: camera.width, height: camera.height },
      { width: constraints.logicalWidth, height: constraints.logicalHeight },
      camera.zoom,
    );
    camera.setScroll(scroll.x, scroll.y);
  }

  private resetInputState(): void {
    this.activePointers.clear();
    this.pinch = null;
  }
}
