import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { loadMapDefinition } from '../../../infrastructure/data/load-map-definition';
import { useGameStore } from '../../../state/game-store';
import { selectSelectedCastle } from '../../../state/selectors/map-selectors';

import { SelectedCastlePanel } from './SelectedCastlePanel';

function getFormalSelectedCastle() {
  const mapDefinition = loadMapDefinition();
  const castle = mapDefinition.castles[0];
  if (castle === undefined) {
    throw new Error('The formal map fixture has no castle.');
  }

  useGameStore.setState({ initialized: true, mapDefinition });
  const selectedCastle = selectSelectedCastle(useGameStore.getState(), castle.id);
  if (selectedCastle === null) {
    throw new Error('The formal castle could not be selected.');
  }

  return selectedCastle;
}

describe('SelectedCastlePanel', () => {
  it('shows guidance while no castle is selected', () => {
    render(<SelectedCastlePanel castle={null} />);

    expect(screen.getByRole('heading', { name: '城を選択してください' })).toBeInTheDocument();
    expect(screen.getByText('マップ上の城をタップすると概要を表示します。')).toBeInTheDocument();
  });

  it('shows the formal castle, region, clan, and identification symbol', () => {
    const castle = getFormalSelectedCastle();
    render(<SelectedCastlePanel castle={castle} />);
    const panel = screen.getByTestId('selected-castle-panel');

    expect(within(panel).getByRole('heading', { name: '春日山城' })).toBeInTheDocument();
    expect(within(panel).getByText('越後')).toBeInTheDocument();
    expect(within(panel).getByText('上杉家')).toBeInTheDocument();
    expect(within(panel).getByText('竹に雀')).toBeInTheDocument();
  });
});
