import { describe, expect, it, vi } from 'vitest';

import { createMapRenderDto } from '../../../application/queries/create-map-render-dto';
import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';

import { createGameBridge } from './game-bridge';

describe('game bridge', () => {
  it('delivers only matching event types to all subscribers', () => {
    const bridge = createGameBridge();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const resizeListener = vi.fn();

    bridge.subscribe('boot-completed', firstListener);
    bridge.subscribe('boot-completed', secondListener);
    bridge.subscribe('viewport-resized', resizeListener);
    bridge.emit({ type: 'boot-completed' });

    expect(firstListener).toHaveBeenCalledOnce();
    expect(secondListener).toHaveBeenCalledOnce();
    expect(resizeListener).not.toHaveBeenCalled();
  });

  it('removes a listener when unsubscribed', () => {
    const bridge = createGameBridge();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe('boot-completed', listener);

    unsubscribe();
    bridge.emit({ type: 'boot-completed' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not retain a listener after cleanup', () => {
    const bridge = createGameBridge();
    const listener = vi.fn();

    bridge.subscribe('viewport-resized', listener)();
    bridge.emit({ type: 'viewport-resized', width: 390, height: 844 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('delivers the typed map render payload and replays it to a late subscriber', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const listener = vi.fn();

    bridge.emit({ type: 'map-state-updated', payload });
    bridge.subscribe('map-state-updated', listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ type: 'map-state-updated', payload });
  });

  it('stops map state delivery after unsubscribe', () => {
    const bridge = createGameBridge();
    const payload = createMapRenderDto(loadMapDefinition());
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe('map-state-updated', listener);

    bridge.emit({ type: 'map-state-updated', payload });
    unsubscribe();
    bridge.emit({ type: 'map-state-updated', payload });

    expect(listener).toHaveBeenCalledOnce();
  });
});
