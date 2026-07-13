import Phaser from 'phaser';

import type { GameBridge } from '../bridge/game-bridge';

export const BOOT_SCENE_KEY = 'boot-scene';

export class BootScene extends Phaser.Scene {
  private bootText: Phaser.GameObjects.Text | null = null;

  public constructor(private readonly bridge: GameBridge) {
    super(BOOT_SCENE_KEY);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#172019');
    this.bootText = this.add
      .text(0, 0, '戦国領国録', {
        color: '#f3ead4',
        fontFamily: 'serif',
        fontSize: '28px',
      })
      .setOrigin(0.5);
    this.positionBootText(this.scale.gameSize);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.positionBootText, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.positionBootText, this);
      this.bootText = null;
    });
    this.bridge.emit({ type: 'boot-completed' });
  }

  private readonly positionBootText = (gameSize: Phaser.Structs.Size): void => {
    this.bootText?.setPosition(gameSize.width / 2, gameSize.height / 2);
  };
}
