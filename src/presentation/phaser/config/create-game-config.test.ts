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

import { createGameBridge } from '../bridge/game-bridge';
import { BOOT_SCENE_KEY } from '../scenes/BootScene';

import { createGameConfig } from './create-game-config';

describe('createGameConfig', () => {
  it('returns a parent-bound config with one uniquely keyed boot scene', () => {
    const parent = document.createElement('div');
    const config = createGameConfig(parent, createGameBridge());

    expect(config.parent).toBe(parent);
    expect(config.scene).toHaveLength(1);
    expect(BOOT_SCENE_KEY).toBe('boot-scene');
  });
});
