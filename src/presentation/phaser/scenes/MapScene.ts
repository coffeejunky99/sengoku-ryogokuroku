import Phaser from 'phaser';

import type { MapRenderCastleDto } from '../../../application/dto/map-render-dto';
import type { GameBridge, GameBridgeEvent } from '../bridge/game-bridge';
import { CastleMapObject } from '../game-objects/CastleMapObject';

export const MAP_SCENE_KEY = 'map-scene';

const ROUTE_LINE_COLOR = 0xb8a989;
const ROUTE_LINE_WIDTH = 2;
const ROUTE_LINE_ALPHA = 0.8;

type MapStateUpdatedEvent = Extract<
  GameBridgeEvent,
  { readonly type: 'map-state-updated' }
>;

export class MapScene extends Phaser.Scene {
  private readonly castleObjects = new Map<MapRenderCastleDto['id'], CastleMapObject>();
  private routeGraphics: Phaser.GameObjects.Graphics | null = null;
  private unsubscribeMapState: (() => void) | null = null;

  public constructor(private readonly bridge: GameBridge) {
    super(MAP_SCENE_KEY);
  }

  public create(): void {
    this.releaseResources();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.unsubscribeMapState = this.bridge.subscribe(
      'map-state-updated',
      this.handleMapStateUpdated,
    );
  }

  private readonly handleMapStateUpdated = (event: MapStateUpdatedEvent): void => {
    const map = event.payload;
    this.cameras.main.setBounds(0, 0, map.logicalWidth, map.logicalHeight);

    const graphics = this.routeGraphics ?? this.add.graphics();
    this.routeGraphics = graphics;
    graphics.clear();
    graphics.lineStyle(ROUTE_LINE_WIDTH, ROUTE_LINE_COLOR, ROUTE_LINE_ALPHA);

    map.routes.forEach((route) => {
      graphics.lineBetween(route.from.x, route.from.y, route.to.x, route.to.y);
    });

    map.castles.forEach((castle) => {
      const castleObject = this.castleObjects.get(castle.id);
      if (castleObject === undefined) {
        this.castleObjects.set(
          castle.id,
          new CastleMapObject(this, castle, this.handleCastleSelected),
        );
        return;
      }

      castleObject.updateFromDto(castle);
    });
  };

  private readonly handleCastleSelected = (castleId: MapRenderCastleDto['id']): void => {
    this.bridge.emit({ type: 'castle-selected', castleId });
  };

  private readonly handleShutdown = (): void => {
    this.releaseResources();
  };

  private releaseResources(): void {
    this.unsubscribeMapState?.();
    this.unsubscribeMapState = null;
    this.routeGraphics?.destroy();
    this.routeGraphics = null;
    this.castleObjects.forEach((castleObject) => {
      castleObject.destroy();
    });
    this.castleObjects.clear();
  }
}
