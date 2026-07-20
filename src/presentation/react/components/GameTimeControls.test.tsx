import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SIMULATION_TICKS_PER_GAME_DAY } from '../../../domain/time/simulation-constants';
import type { TimeScale } from '../../../domain/time/time-scale';
import { useGameStore } from '../../../state/game-store';

import { GameTimeControls } from './GameTimeControls';

const TIME_SCALES: readonly TimeScale[] = [0, 1, 2, 4];
const originalSetTimeScale = useGameStore.getState().setTimeScale;

describe('GameTimeControls', () => {
  let setTimeScale: ReturnType<typeof vi.fn<(timeScale: TimeScale) => void>>;

  beforeEach(() => {
    useGameStore.setState({ setTimeScale: originalSetTimeScale });
    useGameStore.getState().resetTime();
    setTimeScale = vi.fn<(timeScale: TimeScale) => void>();
    useGameStore.setState({ setTimeScale });
  });

  afterEach(() => {
    useGameStore.setState({ setTimeScale: originalSetTimeScale });
    useGameStore.getState().resetTime();
  });

  it('shows the initial date, current speed, and all speed controls', () => {
    render(<GameTimeControls />);
    const controls = screen.getByTestId('game-time-controls');
    const speedGroup = within(controls).getByRole('group', { name: '時間速度' });

    expect(within(controls).getByText('1561/09/01')).toBeInTheDocument();
    expect(within(controls).getByText('0倍速', { selector: '.game-time-scale-value' }))
      .toBeInTheDocument();
    for (const timeScale of TIME_SCALES) {
      expect(within(speedGroup).getByRole('button', { name: `${String(timeScale)}倍速` }))
        .toBeInTheDocument();
    }
    expect(within(speedGroup).getByRole('button', { name: '0倍速' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each(TIME_SCALES)('requests the %ix time scale from its button', (timeScale) => {
    render(<GameTimeControls />);

    fireEvent.click(screen.getByRole('button', { name: `${String(timeScale)}倍速` }));

    expect(setTimeScale).toHaveBeenCalledOnce();
    expect(setTimeScale).toHaveBeenCalledWith(timeScale);
  });

  it('updates the selected control when the Store time scale changes', () => {
    render(<GameTimeControls />);

    act(() => {
      useGameStore.setState({ timeScale: 2 });
    });

    expect(screen.getByRole('button', { name: '2倍速' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '0倍速' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('2倍速', { selector: '.game-time-scale-value' }))
      .toBeInTheDocument();
  });

  it('updates the displayed date after simulation ticks are consumed', () => {
    render(<GameTimeControls />);

    act(() => {
      useGameStore.getState().consumeSimulationTicks(SIMULATION_TICKS_PER_GAME_DAY);
    });

    expect(screen.getByText('1561/09/02')).toBeInTheDocument();
  });

  it('does not advance the date when only the time scale changes', () => {
    useGameStore.setState({ setTimeScale: originalSetTimeScale });
    render(<GameTimeControls />);

    fireEvent.click(screen.getByRole('button', { name: '4倍速' }));

    expect(screen.getByText('1561/09/01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4倍速' })).toHaveAttribute('aria-pressed', 'true');
  });
});
