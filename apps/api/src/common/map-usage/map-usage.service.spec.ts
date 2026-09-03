import { MapUsageService } from './map-usage.service';

describe('MapUsageService', () => {
  const redisService = {
    getInteger: jest.fn(),
    increment: jest.fn(),
  };
  const service = new MapUsageService(redisService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments a daily usage bucket with a 24-hour TTL', async () => {
    redisService.increment.mockResolvedValue(1);

    await expect(service.incrementDaily('user:user-1')).resolves.toBe(1);
    expect(redisService.increment).toHaveBeenCalledWith(
      'map:usage:daily:user:user-1',
      86400,
    );
  });

  it('reads a daily usage bucket', async () => {
    redisService.getInteger.mockResolvedValue(12);

    await expect(service.getDailyUsage('ip:203.0.113.10')).resolves.toBe(12);
    expect(redisService.getInteger).toHaveBeenCalledWith(
      'map:usage:daily:ip:203.0.113.10',
    );
  });
});
