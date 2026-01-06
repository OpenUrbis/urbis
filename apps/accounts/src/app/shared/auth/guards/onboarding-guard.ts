import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrganizationState } from '../../../states/organization/organization.state';

export const onboardingGuard: CanActivateFn = () => {
  const organizationState = inject(OrganizationState);
  const router = inject(Router);

  const selectedOrganization = organizationState.selectedOrganization();

  if (!selectedOrganization)
    return router.navigate(['/onboarding'], { replaceUrl: true });

  return true;
};
