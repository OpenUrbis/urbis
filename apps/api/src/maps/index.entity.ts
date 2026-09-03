import { LayerGroupEntities } from './layer-groups/entities';
import { LayerSchemaEntities } from './layer-schemas/entities';
import { MapEntities } from './map-config/entities';
import { SearchConfigEntities } from './search/entities';
import { ShareEntities } from './share/entities';

export const MapsModuleEntities = [
  ...MapEntities,
  ...LayerSchemaEntities,
  ...LayerGroupEntities,
  ...SearchConfigEntities,
  ...ShareEntities,
];
