import mapDefinitionJson from '../../data/master/map-definition.json';
import type { MapDefinition } from '../../domain/types/map-definition';
import { validateMapDefinition } from '../../domain/validation/validate-map-definition';

export function loadMapDefinition(): MapDefinition {
  const input: unknown = mapDefinitionJson;
  return validateMapDefinition(input);
}
