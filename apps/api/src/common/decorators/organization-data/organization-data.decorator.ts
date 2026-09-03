import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrganizationData = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization;
  },
);
