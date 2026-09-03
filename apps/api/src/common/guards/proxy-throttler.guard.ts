import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorage,
} from '@nestjs/throttler';

import { MapUsageService } from 'common/map-usage/map-usage.service';
import { OptionalProxyAuthGuard } from './optional-proxy-auth.guard';

@Injectable()
export class ProxyThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly optionalAuthGuard: OptionalProxyAuthGuard,
    private readonly mapUsageService: MapUsageService,
  ) {
    super(options, storage, reflector);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.optionalAuthGuard.canActivate(context);

    if (this.configService.get('throttler.enabled') !== true) {
      const request = context.switchToHttp().getRequest();
      await this.mapUsageService.incrementDaily(this.getUsageBucket(request));
      return true;
    }

    return super.canActivate(context);
  }

  protected override async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const request = requestProps.context.switchToHttp().getRequest();
    const profile = request.user ? 'authenticated' : 'anonymous';
    const configuredLimit = this.configService.get<number>(
      `throttler.proxy.${profile}.${requestProps.throttler.name}.limit`,
    );
    const limit = Number(configuredLimit);

    const allowed = await super.handleRequest({
      ...requestProps,
      limit: Number.isFinite(limit) && limit > 0 ? limit : requestProps.limit,
    });

    // Count once per accepted request, after the daily quota has been checked.
    if (allowed && requestProps.throttler.name === 'daily') {
      await this.mapUsageService.incrementDaily(this.getUsageBucket(request));
    }

    return allowed;
  }

  protected override getTracker(request: Record<string, any>): Promise<string> {
    const userId = request.user?.id || request.user?._id;
    if (userId) {
      return Promise.resolve(`user:${String(userId)}`);
    }

    const ip = this.getClientIp(request);
    if (request.user) {
      return Promise.resolve(`authenticated-ip:${ip}`);
    }

    return Promise.resolve(`ip:${ip}`);
  }

  private getUsageBucket(request: Record<string, any>): string {
    const userId = request.user?.id || request.user?._id;
    return userId
      ? `user:${String(userId)}`
      : `ip:${this.getClientIp(request)}`;
  }

  private getClientIp(request: Record<string, any>): string {
    const rawIp = request.ip || request.socket?.remoteAddress || 'unknown';
    return (
      String(rawIp)
        .replace(/^::ffff:/i, '')
        .trim() || 'unknown'
    );
  }
}
