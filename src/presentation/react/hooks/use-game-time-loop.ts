import { useEffect } from 'react';

import { useGameStore } from '../../../state/game-store';

export function useGameTimeLoop(): void {
  useEffect(() => {
    let animationFrameId: number | null = null;
    let previousTimestamp: number | null = null;
    let isActive = true;

    const updateSimulation = (timestamp: number): void => {
      if (!isActive) {
        return;
      }

      if (previousTimestamp === null) {
        previousTimestamp = timestamp;
      } else {
        const deltaMs = timestamp - previousTimestamp;
        previousTimestamp = timestamp;
        useGameStore.getState().advanceTime(deltaMs);
      }

      animationFrameId = requestAnimationFrame(updateSimulation);
    };

    animationFrameId = requestAnimationFrame(updateSimulation);

    return () => {
      isActive = false;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
}
