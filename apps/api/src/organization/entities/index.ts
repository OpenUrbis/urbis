import { OrganizationApplicationWhitelabel } from './organization-application-whitelabel.entity';
import { OrganizationGlobalWhitelabel } from './organization-shared-whitelabel.entity';
import { Organization } from './organization.entity';

export const OrganizationEntities = [
  Organization,
  OrganizationGlobalWhitelabel,
  OrganizationApplicationWhitelabel,
];
