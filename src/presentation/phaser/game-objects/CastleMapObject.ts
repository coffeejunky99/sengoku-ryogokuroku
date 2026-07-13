import Phaser from 'phaser';

import type { MapRenderCastleDto } from '../../../application/dto/map-render-dto';

const CASTLE_MARKER_RADIUS = 22;
const CASTLE_INTERACTIVE_SIZE = 48;
const CASTLE_MARKER_ALPHA = 1;
const CASTLE_SYMBOL_COLOR = '#ffffff';
const CASTLE_SYMBOL_FONT_SIZE = '12px';

type CastleSelectedHandler = (castleId: MapRenderCastleDto['id']) => void;

function toPhaserColor(hexColor: string): number {
  return Number.parseInt(hexColor.slice(1), 16);
}

export class CastleMapObject extends Phaser.GameObjects.Container {
  private readonly castleId: MapRenderCastleDto['id'];
  private readonly marker: Phaser.GameObjects.Arc;
  private readonly symbol: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    castle: MapRenderCastleDto,
    onCastleSelected: CastleSelectedHandler,
  ) {
    super(scene, castle.position.x, castle.position.y);

    this.castleId = castle.id;
    this.marker = new Phaser.GameObjects.Arc(
      scene,
      0,
      0,
      CASTLE_MARKER_RADIUS,
      0,
      360,
      false,
      toPhaserColor(castle.ownerColor),
      CASTLE_MARKER_ALPHA,
    );
    this.symbol = new Phaser.GameObjects.Text(scene, 0, 0, castle.ownerSymbol, {
      align: 'center',
      color: CASTLE_SYMBOL_COLOR,
      fontFamily: 'sans-serif',
      fontSize: CASTLE_SYMBOL_FONT_SIZE,
    }).setOrigin(0.5);

    this.add([this.marker, this.symbol]);
    this.setSize(CASTLE_INTERACTIVE_SIZE, CASTLE_INTERACTIVE_SIZE);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.POINTER_UP, () => {
      onCastleSelected(this.castleId);
    });
    scene.add.existing(this);
  }

  public updateFromDto(castle: MapRenderCastleDto): void {
    if (castle.id !== this.castleId) {
      throw new Error(`CastleMapObject id mismatch: ${castle.id}`);
    }

    this.setPosition(castle.position.x, castle.position.y);
    this.marker.setFillStyle(toPhaserColor(castle.ownerColor), CASTLE_MARKER_ALPHA);
    this.symbol.setText(castle.ownerSymbol);
  }
}
