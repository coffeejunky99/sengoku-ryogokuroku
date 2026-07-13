import Phaser from 'phaser';

import type { GameBridge } from '../bridge/game-bridge';
import { BootScene } from '../scenes/BootScene';
import { MapScene } from '../scenes/MapScene';

const DEFAULT_GAME_WIDTH = 390;
const DEFAULT_GAME_HEIGHT = 520;

export function createGameConfig(parent: HTMLElement, bridge: GameBridge): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: DEFAULT_GAME_WIDTH,
    height: DEFAULT_GAME_HEIGHT,
    backgroundColor: '#172019',
    scene: [new BootScene(bridge), new MapScene(bridge)],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      transparent: false,
    },
  };
}
