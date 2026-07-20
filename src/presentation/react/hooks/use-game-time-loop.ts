import { useEffect } from 'react';

import { useGameStore } from '../../../state/game-store';

export function useGameTimeLoop(): void {
  useEffect(() => {
    let animationFrameId: number | null = null;
    let animationFrameGeneration = 0;
    let previousTimestamp: number | null = null;
    let isActive = true;
    let isHidden = document.visibilityState === 'hidden';

    const scheduleAnimationFrame = (): void => {
      if (!isActive || isHidden || animationFrameId !== null) {
        return;
      }

      const scheduledGeneration = animationFrameGeneration;
      animationFrameId = requestAnimationFrame((timestamp) => {
        if (!isActive || isHidden || scheduledGeneration !== animationFrameGeneration) {
          return;
        }

        animationFrameId = null;

        if (previousTimestamp === null) {
          previousTimestamp = timestamp;
        } else {
          const deltaMs = timestamp - previousTimestamp;
          previousTimestamp = timestamp;
          useGameStore.getState().advanceTime(deltaMs);
        }

        scheduleAnimationFrame();
      });
    };

    const cancelScheduledAnimationFrame = (): void => {
      animationFrameGeneration += 1;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleVisibilityChange = (): void => {
      const nextIsHidden = document.visibilityState === 'hidden';

      if (nextIsHidden) {
        previousTimestamp = null;
        cancelScheduledAnimationFrame();

        if (!isHidden) {
          isHidden = true;
          useGameStore.getState().pauseForBackground();
        }
        return;
      }

      if (isHidden) {
        isHidden = false;
        previousTimestamp = null;
        scheduleAnimationFrame();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isHidden) {
      useGameStore.getState().pauseForBackground();
    } else {
      scheduleAnimationFrame();
    }

    return () => {
      isActive = false;
      cancelScheduledAnimationFrame();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
