import { describe, expect, it, vi } from 'vitest';

const sceneStart = vi.hoisted(() => vi.fn());

vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      public readonly scene = { start: sceneStart };
    },
  },
}));

import { createGameBridge } from '../bridge/game-bridge';

import { BootScene } from './BootScene';
import { MAP_SCENE_KEY } from './MapScene';

describe('BootScene', () => {
  it('starts MapScene and preserves the boot-completed contract', () => {
    const bridge = createGameBridge();
    const bootListener = vi.fn();
    bridge.subscribe('boot-completed', bootListener);

    new BootScene(bridge).create();

    expect(sceneStart).toHaveBeenCalledWith(MAP_SCENE_KEY);
    expect(bootListener).toHaveBeenCalledOnce();
  });
});
