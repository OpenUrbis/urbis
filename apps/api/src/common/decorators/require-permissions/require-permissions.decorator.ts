import { SetMetadata } from '@nestjs/common';
import { IRequiredPermissionOptions } from 'common/guards/access-control/access-control';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (
  options: Partial<IRequiredPermissionOptions>,
) => SetMetadata(PERMISSIONS_KEY, options);
