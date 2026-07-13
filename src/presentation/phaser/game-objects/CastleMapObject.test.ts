import Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const phaserMocks = vi.hoisted(() => {
  const addChildren = vi.fn();
  const addExisting = vi.fn();
  const arcConstruct = vi.fn();
  const containerConstruct = vi.fn();
  const setFillStyle = vi.fn();
  const setInteractive = vi.fn();
  const setOrigin = vi.fn();
  const setPosition = vi.fn();
  const setSize = vi.fn();
  const setText = vi.fn();
  const textConstruct = vi.fn();
  let pointerUp: ((pointer: MapPointerInput) => void) | null = null;

  return {
    addChildren,
    addExisting,
    arcConstruct,
    containerConstruct,
    setFillStyle,
    setInteractive,
    setOrigin,
    setPosition,
    setSize,
    setText,
    textConstruct,
    capturePointerUp(listener: (pointer: MapPointerInput) => void) {
      pointerUp = listener;
    },
    emitPointerUp(pointer: MapPointerInput) {
      pointerUp?.(pointer);
    },
    reset() {
      addChildren.mockClear();
      addExisting.mockClear();
      arcConstruct.mockClear();
      containerConstruct.mockClear();
      setFillStyle.mockClear();
      setInteractive.mockClear();
      setOrigin.mockClear();
      setPosition.mockClear();
      setSize.mockClear();
      setText.mockClear();
      textConstruct.mockClear();
      pointerUp = null;
    },
  };
});

vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Arc: class Arc {
        public constructor(...parameters: readonly unknown[]) {
          phaserMocks.arcConstruct(...parameters);
        }

        public setFillStyle(color: number, alpha: number): void {
          phaserMocks.setFillStyle(color, alpha);
        }
      },
      Container: class Container {
        public constructor(scene: unknown, x: number, y: number) {
          phaserMocks.containerConstruct(scene, x, y);
        }

        public add(children: readonly unknown[]): void {
          phaserMocks.addChildren(children);
        }

        public on(_event: string, listener: (pointer: MapPointerInput) => void): void {
          phaserMocks.capturePointerUp(listener);
        }

        public setInteractive(config: unknown): void {
          phaserMocks.setInteractive(config);
        }

        public setPosition(x: number, y: number): void {
          phaserMocks.setPosition(x, y);
        }

        public setSize(width: number, height: number): void {
          phaserMocks.setSize(width, height);
        }
      },
      Text: class Text {
        public constructor(...parameters: readonly unknown[]) {
          phaserMocks.textConstruct(...parameters);
        }

        public setOrigin(value: number): this {
          phaserMocks.setOrigin(value);
          return this;
        }

        public setText(value: string): void {
          phaserMocks.setText(value);
        }
      },
    },
    Input: {
      Events: {
        POINTER_UP: 'pointerup',
      },
    },
    Scene: class Scene {
      public readonly add = { existing: phaserMocks.addExisting };
    },
  },
}));

import type { MapRenderCastleDto } from '../../../application/dto/map-render-dto';
import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';
import type { MapPointerInput } from '../systems/MapCameraController';

import { CastleMapObject } from './CastleMapObject';

function getFormalCastle(): MapRenderCastleDto {
  const castle = createMapRenderDto(loadMapDefinition()).castles[0];
  if (castle === undefined) {
    throw new Error('The formal map fixture has no castle.');
  }

  return castle;
}

describe('CastleMapObject', () => {
  beforeEach(() => {
    phaserMocks.reset();
  });

  it('renders the owner color and identification symbol at the castle position', () => {
    const scene = new Phaser.Scene();
    const castle = getFormalCastle();

    new CastleMapObject(scene, castle, vi.fn());

    expect(phaserMocks.containerConstruct).toHaveBeenCalledWith(scene, 760, 150);
    expect(phaserMocks.arcConstruct).toHaveBeenCalledWith(
      scene,
      0,
      0,
      22,
      0,
      360,
      false,
      0x2563eb,
      1,
    );
    expect(phaserMocks.textConstruct).toHaveBeenCalledWith(
      scene,
      0,
      0,
      '竹に雀',
      expect.objectContaining({ color: '#ffffff' }),
    );
    expect(phaserMocks.setSize).toHaveBeenCalledWith(48, 48);
    expect(phaserMocks.setInteractive).toHaveBeenCalledOnce();
    expect(phaserMocks.addExisting).toHaveBeenCalledOnce();
  });

  it('notifies selection with the stable castle ID on pointer up', () => {
    const castle = getFormalCastle();
    const onCastleSelected = vi.fn();
    new CastleMapObject(new Phaser.Scene(), castle, onCastleSelected);
    const pointer = { id: 1, x: 760, y: 150, button: 0 };

    phaserMocks.emitPointerUp(pointer);

    expect(onCastleSelected).toHaveBeenCalledOnce();
    expect(onCastleSelected).toHaveBeenCalledWith(castle.id, pointer);
  });

  it('updates the existing object without reconstructing its children', () => {
    const castle = getFormalCastle();
    const castleObject = new CastleMapObject(new Phaser.Scene(), castle, vi.fn());
    const updatedCastle: MapRenderCastleDto = {
      ...castle,
      position: { x: 800, y: 200 },
      ownerColor: '#B3261E',
      ownerSymbol: '武田菱',
    };

    castleObject.updateFromDto(updatedCastle);

    expect(phaserMocks.arcConstruct).toHaveBeenCalledOnce();
    expect(phaserMocks.textConstruct).toHaveBeenCalledOnce();
    expect(phaserMocks.setPosition).toHaveBeenCalledWith(800, 200);
    expect(phaserMocks.setFillStyle).toHaveBeenCalledWith(0xb3261e, 1);
    expect(phaserMocks.setText).toHaveBeenCalledWith('武田菱');
  });
});
