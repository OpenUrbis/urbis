import { ExecutionContext, Injectable } from '@nestjs/common';
import { AccessControlGuard } from './access-control.guard';

@Injectable()
export class OptionalAccessControlGuard extends AccessControlGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      return true;
    }
    try {
      const allowed = await super.canActivate(context);
      if (!allowed) {
        request.user = undefined;
        request.accessControl = undefined;
      }
      return true;
    } catch {
      // In optional access control, an invalid or expired token should not block
      // public access. Fall back to unauthenticated (anonymous) request.
      request.user = undefined;
      request.accessControl = undefined;
      return true;
    }
  }
}
