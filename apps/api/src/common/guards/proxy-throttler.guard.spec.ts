import { ExecutionContext } from '@nestjs/common';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { OptionalProxyAuthGuard } from './optional-proxy-auth.guard';
import { ProxyThrottlerGuard } from './proxy-throttler.guard';

describe('ProxyThrottlerGuard', () => {
  const storage = {
    increment: jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 999,
      isBlocked: false,
      timeToBlockExpire: 0,
    }),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'throttler.enabled') return true;
      if (key.endsWith('authenticated.short.limit')) return 20;
      if (key.endsWith('anonymous.short.limit')) return 5;
      return undefined;
    }),
  };
  const authGuard = {
    canActivate: jest.fn().mockResolvedValue(true),
  };
  const mapUsageService = {
    incrementDaily: jest.fn().mockResolvedValue(1),
  };
  const guard = new ProxyThrottlerGuard(
    {
      throttlers: [{ name: 'short', ttl: 1000, limit: 5 }],
    } as ThrottlerModuleOptions,
    storage,
    {} as any,
    configService as any,
    authGuard as unknown as OptionalProxyAuthGuard,
    mapUsageService as any,
  );

  beforeAll(async () => {
    await guard.onModuleInit();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks anonymous requests by client IP', async () => {
    await expect(
      (guard as any).getTracker({
        ip: '::ffff:203.0.113.10',
      }),
    ).resolves.toBe('ip:203.0.113.10');
  });

  it('tracks authenticated requests by user identity', async () => {
    await expect(
      (guard as any).getTracker({
        ip: '203.0.113.10',
        user: { _id: 'user-1' },
      }),
    ).resolves.toBe('user:user-1');
  });

  it('uses the higher authenticated limit', async () => {
    const response = { header: jest.fn() };
    const request = { user: { _id: 'user-1' }, ip: '203.0.113.10' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ExecutionContext;

    await (guard as any).handleRequest({
      context,
      limit: 5,
      ttl: 1000,
      throttler: { name: 'short' },
      blockDuration: 1000,
      getTracker: (value: Record<string, any>) =>
        (guard as any).getTracker(value),
      generateKey: (_context: ExecutionContext, tracker: string) => tracker,
    });

    expect(storage.increment).toHaveBeenCalledWith(
      'user:user-1',
      1000,
      20,
      1000,
      'short',
    );
  });

  it('records accepted daily requests in the same user bucket read by the panel', async () => {
    const response = { header: jest.fn() };
    const request = { user: { id: 'user-1' }, ip: '203.0.113.10' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ExecutionContext;

    await (guard as any).handleRequest({
      context,
      limit: 500,
      ttl: 86400000,
      throttler: { name: 'daily' },
      blockDuration: 86400000,
      getTracker: (value: Record<string, any>) =>
        (guard as any).getTracker(value),
      generateKey: (_context: ExecutionContext, tracker: string) => tracker,
    });

    expect(mapUsageService.incrementDaily).toHaveBeenCalledWith('user:user-1');
  });
});

describe('OptionalProxyAuthGuard', () => {
  it('allows requests without credentials', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    await expect(
      new OptionalProxyAuthGuard().canActivate(context),
    ).resolves.toBe(true);
  });
});
