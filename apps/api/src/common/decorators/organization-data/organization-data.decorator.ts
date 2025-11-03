import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrganizationData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization;
  },
);
