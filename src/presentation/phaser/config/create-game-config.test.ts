import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    Scale: {
      CENTER_BOTH: 1,
      RESIZE: 2,
    },
    Scene: class Scene {
      public readonly key: string;

      public constructor(key: string) {
        this.key = key;
      }

      public getKey(): string {
        return this.key;
      }
    },
  },
}));

vi.mock('../game-objects/CastleMapObject', () => ({
  CastleMapObject: class CastleMapObject {
    public readonly mocked = true;
  },
}));

import { createGameBridge } from '../bridge/game-bridge';
import { BOOT_SCENE_KEY } from '../scenes/BootScene';
import { MAP_SCENE_KEY } from '../scenes/MapScene';

import { createGameConfig } from './create-game-config';

describe('createGameConfig', () => {
  it('registers uniquely keyed boot and map scenes', () => {
    const parent = document.createElement('div');
    const config = createGameConfig(parent, createGameBridge());

    expect(config.parent).toBe(parent);
    expect(config.scene).toHaveLength(2);
    expect(BOOT_SCENE_KEY).toBe('boot-scene');
    expect(MAP_SCENE_KEY).toBe('map-scene');
    expect(new Set([BOOT_SCENE_KEY, MAP_SCENE_KEY])).toHaveLength(2);
  });
});
