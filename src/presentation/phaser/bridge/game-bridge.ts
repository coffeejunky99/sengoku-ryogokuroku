import type { MapRenderDto } from '../../../application/dto/map-render-dto';

export type GameBridgeEvent =
  | { readonly type: 'boot-completed' }
  | { readonly type: 'viewport-resized'; readonly width: number; readonly height: number }
  | { readonly type: 'map-state-updated'; readonly payload: MapRenderDto };

type GameBridgeEventType = GameBridgeEvent['type'];
type GameBridgeListener<TType extends GameBridgeEventType> = (
  event: Extract<GameBridgeEvent, { readonly type: TType }>,
) => void;

export interface GameBridge {
  emit(event: GameBridgeEvent): void;
  subscribe<TType extends GameBridgeEventType>(
    type: TType,
    listener: GameBridgeListener<TType>,
  ): () => void;
}

export function createGameBridge(): GameBridge {
  const listeners = new Map<GameBridgeEventType, Set<(event: GameBridgeEvent) => void>>();
  let latestMapStateEvent: Extract<GameBridgeEvent, { readonly type: 'map-state-updated' }> | null =
    null;

  return {
    emit(event) {
      if (event.type === 'map-state-updated') {
        latestMapStateEvent = event;
      }
      listeners.get(event.type)?.forEach((listener) => {
        listener(event);
      });
    },
    subscribe(type, listener) {
      const eventListeners = listeners.get(type) ?? new Set<(event: GameBridgeEvent) => void>();
      const eventListener = (event: GameBridgeEvent): void => {
        if (event.type === type) {
          listener(event as Extract<GameBridgeEvent, { readonly type: typeof type }>);
        }
      };

      eventListeners.add(eventListener);
      listeners.set(type, eventListeners);
      if (type === 'map-state-updated' && latestMapStateEvent !== null) {
        eventListener(latestMapStateEvent);
      }

      return () => {
        eventListeners.delete(eventListener);
        if (eventListeners.size === 0) {
          listeners.delete(type);
        }
      };
    },
  };
}

export const gameBridge = createGameBridge();
