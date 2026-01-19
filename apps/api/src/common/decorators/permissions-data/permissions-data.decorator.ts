import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const PermissionsData = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const accessToken = request.accessControl;
    if (!accessToken)
      console.error(
        'To have access in PermissionData you need to apply AccessControlGuard in route',
      );

    return accessToken;
  },
);
