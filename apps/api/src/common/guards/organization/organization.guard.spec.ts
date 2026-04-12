import { OrganizationGuard } from './organization.guard';
import { OrganizationService } from '../../../organization/organization.service';

describe('OrganizationGuard', () => {
  it('should be defined', () => {
    const organizationService = {} as OrganizationService;
    expect(new OrganizationGuard(organizationService)).toBeDefined();
  });
});
