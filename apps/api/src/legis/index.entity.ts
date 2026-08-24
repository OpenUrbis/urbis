import { LegisCategoryEntities } from './categories/entities';
import { LegisPageEntities } from './pages/entities';

export const LegisModuleEntities = [
  ...LegisPageEntities,
  ...LegisCategoryEntities,
];
