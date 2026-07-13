import { describe, expect, it } from 'vitest';

import formalMapDefinition from '../../data/master/map-definition.json';
import { validateMapDefinition } from '../../domain/validation/validate-map-definition';

import { loadMapDefinition } from './load-map-definition';

describe('loadMapDefinition', () => {
  it('loads the complete formal map definition', () => {
    const result = loadMapDefinition();

    expect(result).toEqual(formalMapDefinition);
    expect(result.clans).toHaveLength(4);
    expect(result.castles).toHaveLength(10);
    expect(result.routes).toHaveLength(13);
  });

  it('preserves the formal map and camera values without adding defaults', () => {
    const result = loadMapDefinition();

    expect(result.logicalWidth).toBe(1600);
    expect(result.logicalHeight).toBe(1200);
    expect(result.contentPadding).toBe(80);
    expect(result.initialCameraCenter).toEqual({ x: 800, y: 600 });
    expect(result.initialZoom).toBe(0.75);
    expect(result.minimumZoom).toBe(0.5);
    expect(result.maximumZoom).toBe(1.8);
    expect(Object.keys(result)).toEqual(Object.keys(formalMapDefinition));
  });

  it('returns a value accepted by the shared map validator', () => {
    const result = loadMapDefinition();

    expect(validateMapDefinition(result)).toEqual(result);
  });
});
