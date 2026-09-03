import { LegisAuthorityEntities } from './authorities/entities';
import { LegisCategoryEntities } from './categories/entities';
import { LegisPageEntities } from './pages/entities';

export const LegisModuleEntities = [
  ...LegisAuthorityEntities,
  ...LegisPageEntities,
  ...LegisCategoryEntities,
];
