export type GameBridgeEvent =
  | { readonly type: 'boot-completed' }
  | { readonly type: 'viewport-resized'; readonly width: number; readonly height: number };

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

  return {
    emit(event) {
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
