import Phaser from 'phaser';

import type { GameBridge } from '../bridge/game-bridge';

import { MAP_SCENE_KEY } from './MapScene';

export const BOOT_SCENE_KEY = 'boot-scene';

export class BootScene extends Phaser.Scene {
  public constructor(private readonly bridge: GameBridge) {
    super(BOOT_SCENE_KEY);
  }

  public create(): void {
    this.scene.start(MAP_SCENE_KEY);
    this.bridge.emit({ type: 'boot-completed' });
  }
}
