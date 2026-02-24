import { LayerGroupEntities } from './layer-groups/entities';
import { LayerSchemaEntities } from './layer-schemas/entities';
import { MapEntities } from './map-config/entities';
import { SearchConfigEntities } from './search/entities';

export const MapsModuleEntities = [
  ...MapEntities,
  ...LayerSchemaEntities,
  ...LayerGroupEntities,
  ...SearchConfigEntities,
];
