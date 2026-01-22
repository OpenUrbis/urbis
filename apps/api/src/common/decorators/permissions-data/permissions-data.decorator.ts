import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../require-permissions/require-permissions.decorator';
import { AccessControlOptions } from '../../guards/access-control/access-control';

export const PermissionsData = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const accessControl = request.accessControl;
    if (!accessControl) {
      console.error(
        'To have access in PermissionData you need to apply AccessControlGuard in route',
      );
      return null;
    }

    const handler = ctx.getHandler();
    const requiredPermissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      handler,
    ) as AccessControlOptions;

    return {
      permissions: accessControl.permissions,
      organizations: accessControl.getContextualOrganizations(requiredPermissions),
    };
  },
);
