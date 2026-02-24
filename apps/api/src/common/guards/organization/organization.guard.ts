import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationService } from 'organization/organization.service';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers['x-organization-id'];

    if (!organizationId) {
      throw new NotFoundException(
        'Organization ID is required in the x-organization-id header',
      );
    }

    const organization = await this.organizationService.findOne(
      organizationId as string,
    );

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Anexa a entidade ao request para uso posterior
    request.organization = organization;

    return true;
  }
}
