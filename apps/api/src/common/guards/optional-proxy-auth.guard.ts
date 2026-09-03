import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalProxyAuthGuard extends AuthGuard(['jwt', 'api-key']) {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;
    const apiKey = request.headers?.['x-api-key'];

    // Anonymous requests are valid. An explicitly supplied credential, however,
    // must be valid instead of silently falling back to the anonymous quota.
    if (!authorization && !apiKey) {
      return Promise.resolve(true);
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
