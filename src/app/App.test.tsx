import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gameBridge } from '../presentation/phaser/bridge/game-bridge';
import { useGameStore } from '../state/game-store';
import { useUiStore } from '../state/ui-store';

import { App } from './App';

vi.mock('../presentation/react/components/PhaserGame', () => ({
  PhaserGame: () => <div data-testid="phaser-container" />,
}));

describe('App', () => {
  beforeEach(() => {
    useGameStore.setState({ initialized: false, mapDefinition: null });
    useUiStore.setState({ isBooted: false });
  });

  it('renders the React shell and Phaser container', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '戦国領国録' })).toBeInTheDocument();
    expect(screen.getByTestId('phaser-container')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('起動中');
  });

  it('reflects the Phaser boot event in the UI', () => {
    render(<App />);

    act(() => {
      gameBridge.emit({ type: 'boot-completed' });
    });

    expect(screen.getByRole('status')).toHaveTextContent('起動完了');
  });
});
