import { ExecutionContext, Injectable } from '@nestjs/common';
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
  ) {
    super(options, storage, reflector);
  }

  protected override async getTracker(req: any): Promise<string> {
    // Standardizing on the user's unique identifier.
    // In this project:
    // - JWT payload uses `_id`.
    // - User entity uses `id` (UUID).
    // - AccessControlGuard maps `_id` to `id` after loading from DB.

    const userId = req.user?.id || req.user?._id;

    if (userId) {
      return await Promise.resolve(`user:${userId}`);
    }

    // Fallback to IP for anonymous requests.
    // NestJS IP detection is reliable when 'trust proxy' is enabled.
    const ip = req.ips && req.ips.length ? req.ips[0] : req.ip;
    return await Promise.resolve(`ip:${ip}`);
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
