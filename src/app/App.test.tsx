import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadMapDefinition } from '../infrastructure/data/load-map-definition';
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
    useUiStore.setState({ isBooted: false, selectedCastleId: null });
  });

  it('renders the React shell and Phaser container', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '戦国領国録' })).toBeInTheDocument();
    expect(screen.getByTestId('phaser-container')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('起動中');
    expect(screen.getByRole('heading', { name: '城を選択してください' })).toBeInTheDocument();
  });

  it('reflects the Phaser boot event in the UI', () => {
    render(<App />);

    act(() => {
      gameBridge.emit({ type: 'boot-completed' });
    });

    expect(screen.getByRole('status')).toHaveTextContent('起動完了');
  });

  it('reflects a bridge castle selection in the UI store and panel', () => {
    const castle = loadMapDefinition().castles[0];
    if (castle === undefined) {
      throw new Error('The formal map fixture has no castle.');
    }
    render(<App />);

    act(() => {
      gameBridge.emit({ type: 'castle-selected', castleId: castle.id });
    });

    expect(useUiStore.getState().selectedCastleId).toBe(castle.id);
    expect(screen.getByRole('heading', { name: '春日山城' })).toBeInTheDocument();
    expect(screen.getByText('越後')).toBeInTheDocument();
    expect(screen.getByText('上杉家')).toBeInTheDocument();
    expect(screen.getByText('竹に雀')).toBeInTheDocument();
  });

  it('unsubscribes from castle selection when unmounted', () => {
    const castle = loadMapDefinition().castles[0];
    if (castle === undefined) {
      throw new Error('The formal map fixture has no castle.');
    }
    const { unmount } = render(<App />);
    unmount();

    act(() => {
      gameBridge.emit({ type: 'castle-selected', castleId: castle.id });
    });

    expect(useUiStore.getState().selectedCastleId).toBeNull();
  });
});
