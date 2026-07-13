import { describe, expect, it } from 'vitest';

import { loadMapDefinition } from '../../infrastructure/data/load-map-definition';

import { createMapRenderDto } from './create-map-render-dto';

describe('createMapRenderDto', () => {
  it('converts the complete formal map definition to render data', () => {
    const result = createMapRenderDto(loadMapDefinition());

    expect(result.logicalWidth).toBe(1600);
    expect(result.logicalHeight).toBe(1200);
    expect(result.camera).toEqual({
      center: { x: 800, y: 600 },
      initialZoom: 0.75,
      minimumZoom: 0.5,
      maximumZoom: 1.8,
    });
    expect(result.clans).toHaveLength(4);
    expect(result.castles).toHaveLength(10);
    expect(result.routes).toHaveLength(13);
  });

  it('resolves castle owner colors and symbols', () => {
    const result = createMapRenderDto(loadMapDefinition());

    expect(result.castles[0]).toEqual({
      id: 'castle_kasugayama',
      name: '春日山城',
      position: { x: 760, y: 150 },
      ownerColor: '#2563EB',
      ownerSymbol: '竹に雀',
    });
  });

  it('resolves route endpoints to render positions', () => {
    const result = createMapRenderDto(loadMapDefinition());

    expect(result.routes[0]).toEqual({
      from: { x: 760, y: 150 },
      to: { x: 940, y: 300 },
      terrain: 'mountain',
    });
  });

  it('omits non-rendering map fields from the DTO', () => {
    const result = createMapRenderDto(loadMapDefinition());

    expect(Object.keys(result)).toEqual([
      'logicalWidth',
      'logicalHeight',
      'camera',
      'clans',
      'castles',
      'routes',
    ]);
    expect(Object.keys(result.clans[0] ?? {})).toEqual(['id', 'name', 'color', 'symbol']);
    expect(Object.keys(result.castles[0] ?? {})).toEqual([
      'id',
      'name',
      'position',
      'ownerColor',
      'ownerSymbol',
    ]);
    expect(Object.keys(result.routes[0] ?? {})).toEqual(['from', 'to', 'terrain']);
  });
});
