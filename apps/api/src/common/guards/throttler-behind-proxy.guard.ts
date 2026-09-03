import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storage, reflector);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEnabled = this.configService.get('throttler.enabled') ?? false;
    if (!isEnabled) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const path = req.originalUrl || req.url || '';
    const isMapRoute =
      path.includes('/maps/') ||
      path.startsWith('maps/') ||
      path.startsWith('/maps');
    const isPublicProxyRoute = /\/maps\/(?:proxy|geoserver-proxy)(?:\/|$)/.test(
      path,
    );

    // ProxyController has its own guard because it must authenticate
    // optionally before choosing the authenticated or anonymous quota.
    if (!isMapRoute || isPublicProxyRoute) {
      return true;
    }

    return super.canActivate(context);
  }

  protected override async handleRequest(requestProps: any): Promise<boolean> {
    const { context, limit, throttler } = requestProps;
    let effectiveLimit = limit;
    if (throttler.name === 'daily') {
      const req = context.switchToHttp().getRequest();
      const orgLimit = req.organization?.metadata?.dailyLimit;
      if (orgLimit !== undefined && orgLimit !== null) {
        effectiveLimit = Number(orgLimit);
      }
    }

    return super.handleRequest({
      ...requestProps,
      limit: effectiveLimit,
    });
  }

  protected override getTracker(req: any): Promise<string> {
    // Only identity established by authentication/authorization may select an
    // organization bucket. Never trust x-organization-id from an anonymous
    // request, otherwise anyone could choose a shared or unbounded bucket.
    const orgId = req.organization?.id;
    if (orgId) {
      return Promise.resolve(`org:${String(orgId)}`);
    }

    const userId = req.user?.id || req.user?._id;
    if (userId) {
      return Promise.resolve(`user:${String(userId)}`);
    }

    // Express's req.ip is the proxy-aware client IP when trust proxy is
    // configured by the application. Do not read X-Forwarded-For directly.
    const rawIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const ip = String(rawIp)
      .replace(/^::ffff:/i, '')
      .trim();
    return Promise.resolve(`ip:${ip || 'unknown'}`);
  }

  // Customize the exception thrown when limit is reached
  protected override throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException(
      'Limit of requests reached. Please try again later.',
    );
  }
}
