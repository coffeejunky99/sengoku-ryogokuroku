import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '../../../state/game-store';

import { useGameTimeLoop } from './use-game-time-loop';

const INITIAL_FRAME_TIMESTAMP_MS = 100;
const SECOND_FRAME_DELTA_MS = 16;
const THIRD_FRAME_DELTA_MS = 33;
const FOREGROUND_FRAME_TIMESTAMP_MS = 10_000;

const originalAdvanceTime = useGameStore.getState().advanceTime;
const originalPauseForBackground = useGameStore.getState().pauseForBackground;

let documentVisibilityState: DocumentVisibilityState;

interface AnimationFrameMock {
  readonly request: ReturnType<typeof vi.fn<typeof requestAnimationFrame>>;
  readonly cancel: ReturnType<typeof vi.fn<typeof cancelAnimationFrame>>;
  readonly pendingCount: () => number;
  readonly nextCallback: () => FrameRequestCallback;
  readonly runNextFrame: (timestamp: number) => void;
}

function installAnimationFrameMock(): AnimationFrameMock {
  let nextAnimationFrameId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const request = vi.fn<typeof requestAnimationFrame>((callback) => {
    const animationFrameId = nextAnimationFrameId;
    nextAnimationFrameId += 1;
    callbacks.set(animationFrameId, callback);
    return animationFrameId;
  });
  const cancel = vi.fn<typeof cancelAnimationFrame>((animationFrameId) => {
    callbacks.delete(animationFrameId);
  });

  vi.stubGlobal('requestAnimationFrame', request);
  vi.stubGlobal('cancelAnimationFrame', cancel);

  const nextCallback = (): FrameRequestCallback => {
    const nextEntry = callbacks.entries().next();
    if (nextEntry.done) {
      throw new Error('No animation frame callback is pending.');
    }

    const [animationFrameId, callback] = nextEntry.value;
    callbacks.delete(animationFrameId);
    return callback;
  };

  return {
    request,
    cancel,
    pendingCount: () => callbacks.size,
    nextCallback,
    runNextFrame: (timestamp) => {
      nextCallback()(timestamp);
    },
  };
}

function setDocumentVisibilityState(visibilityState: DocumentVisibilityState): void {
  documentVisibilityState = visibilityState;
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('useGameTimeLoop', () => {
  let advanceTime: ReturnType<typeof vi.fn<(deltaMs: number) => void>>;
  let pauseForBackground: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    documentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => documentVisibilityState,
    );
    useGameStore.setState({
      advanceTime: originalAdvanceTime,
      pauseForBackground: originalPauseForBackground,
    });
    useGameStore.getState().resetTime();
    advanceTime = vi.fn<(deltaMs: number) => void>();
    pauseForBackground = vi.fn<() => void>();
    useGameStore.setState({ advanceTime, pauseForBackground });
  });

  afterEach(() => {
    useGameStore.setState({
      advanceTime: originalAdvanceTime,
      pauseForBackground: originalPauseForBackground,
    });
    useGameStore.getState().resetTime();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('registers a visibilitychange listener when mounted', () => {
    const animationFrame = installAnimationFrameMock();
    const addEventListener = vi.spyOn(document, 'addEventListener');

    renderHook(() => {
      useGameTimeLoop();
    });

    expect(addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(animationFrame.pendingCount()).toBe(1);
  });

  it('registers an animation frame when mounted', () => {
    const animationFrame = installAnimationFrameMock();

    renderHook(() => {
      useGameTimeLoop();
    });

    expect(animationFrame.request).toHaveBeenCalledOnce();
    expect(animationFrame.pendingCount()).toBe(1);
  });

  it('records only the baseline timestamp on the first frame', () => {
    const animationFrame = installAnimationFrameMock();
    renderHook(() => {
      useGameTimeLoop();
    });

    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
    });

    expect(advanceTime).not.toHaveBeenCalled();
  });

  it('advances time with each delta after the baseline frame', () => {
    const animationFrame = installAnimationFrameMock();
    renderHook(() => {
      useGameTimeLoop();
    });

    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS + SECOND_FRAME_DELTA_MS);
      animationFrame.runNextFrame(
        INITIAL_FRAME_TIMESTAMP_MS + SECOND_FRAME_DELTA_MS + THIRD_FRAME_DELTA_MS,
      );
    });

    expect(advanceTime).toHaveBeenNthCalledWith(1, SECOND_FRAME_DELTA_MS);
    expect(advanceTime).toHaveBeenNthCalledWith(2, THIRD_FRAME_DELTA_MS);
  });

  it('pauses once when hidden and does not advance while hidden', () => {
    const animationFrame = installAnimationFrameMock();
    renderHook(() => {
      useGameTimeLoop();
    });
    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
    });
    const callbackScheduledBeforeHidden = animationFrame.nextCallback();

    setDocumentVisibilityState('hidden');
    setDocumentVisibilityState('hidden');
    act(() => {
      callbackScheduledBeforeHidden(INITIAL_FRAME_TIMESTAMP_MS + SECOND_FRAME_DELTA_MS);
    });

    expect(pauseForBackground).toHaveBeenCalledOnce();
    expect(advanceTime).not.toHaveBeenCalled();
    expect(animationFrame.pendingCount()).toBe(0);
  });

  it('uses the first foreground frame only as a new timestamp baseline', () => {
    const animationFrame = installAnimationFrameMock();
    renderHook(() => {
      useGameTimeLoop();
    });
    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS + SECOND_FRAME_DELTA_MS);
    });

    setDocumentVisibilityState('hidden');
    setDocumentVisibilityState('visible');
    act(() => {
      animationFrame.runNextFrame(FOREGROUND_FRAME_TIMESTAMP_MS);
    });

    expect(advanceTime).toHaveBeenCalledOnce();
    expect(advanceTime).toHaveBeenLastCalledWith(SECOND_FRAME_DELTA_MS);

    act(() => {
      animationFrame.runNextFrame(FOREGROUND_FRAME_TIMESTAMP_MS + THIRD_FRAME_DELTA_MS);
    });

    expect(advanceTime).toHaveBeenCalledTimes(2);
    expect(advanceTime).toHaveBeenLastCalledWith(THIRD_FRAME_DELTA_MS);
  });

  it('keeps the store paused after returning to the foreground', () => {
    const animationFrame = installAnimationFrameMock();
    useGameStore.setState({ pauseForBackground: originalPauseForBackground });
    useGameStore.getState().setTimeScale(4);
    renderHook(() => {
      useGameTimeLoop();
    });

    setDocumentVisibilityState('hidden');
    setDocumentVisibilityState('visible');

    expect(useGameStore.getState().timeScale).toBe(0);
    expect(animationFrame.pendingCount()).toBe(1);
  });

  it('starts paused without scheduling a frame when mounted while hidden', () => {
    const animationFrame = installAnimationFrameMock();
    documentVisibilityState = 'hidden';

    renderHook(() => {
      useGameTimeLoop();
    });

    expect(pauseForBackground).toHaveBeenCalledOnce();
    expect(advanceTime).not.toHaveBeenCalled();
    expect(animationFrame.request).not.toHaveBeenCalled();
    expect(animationFrame.pendingCount()).toBe(0);
  });

  it('does not recreate the loop when rerendered', () => {
    const animationFrame = installAnimationFrameMock();
    const { rerender } = renderHook(() => {
      useGameTimeLoop();
    });

    rerender();

    expect(animationFrame.request).toHaveBeenCalledOnce();
    expect(animationFrame.pendingCount()).toBe(1);
  });

  it('removes the listener and cancels the scheduled frame when unmounted', () => {
    const animationFrame = installAnimationFrameMock();
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => {
      useGameTimeLoop();
    });

    unmount();

    expect(animationFrame.cancel).toHaveBeenCalledOnce();
    expect(animationFrame.pendingCount()).toBe(0);
    expect(removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
  });

  it('does not update the store or reschedule after an unmounted callback runs', () => {
    const animationFrame = installAnimationFrameMock();
    const { unmount } = renderHook(() => {
      useGameTimeLoop();
    });
    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
    });
    const callbackAfterUnmount = animationFrame.nextCallback();
    unmount();

    act(() => {
      callbackAfterUnmount(INITIAL_FRAME_TIMESTAMP_MS + SECOND_FRAME_DELTA_MS);
    });

    expect(advanceTime).not.toHaveBeenCalled();
    expect(animationFrame.pendingCount()).toBe(0);
    expect(animationFrame.request).toHaveBeenCalledTimes(2);
  });

  it('keeps only one active loop in React StrictMode', () => {
    const animationFrame = installAnimationFrameMock();

    renderHook(() => {
      useGameTimeLoop();
    }, { wrapper: StrictMode });

    expect(animationFrame.request).toHaveBeenCalledTimes(2);
    expect(animationFrame.cancel).toHaveBeenCalledOnce();
    expect(animationFrame.pendingCount()).toBe(1);

    act(() => {
      animationFrame.runNextFrame(INITIAL_FRAME_TIMESTAMP_MS);
    });

    expect(animationFrame.pendingCount()).toBe(1);
  });
});
