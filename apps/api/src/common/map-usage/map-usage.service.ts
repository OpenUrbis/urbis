import { Injectable } from '@nestjs/common';
import { RedisService } from 'common/redis/redis.service';

@Injectable()
export class MapUsageService {
  private static readonly dailyTtlSeconds = 24 * 60 * 60;

  constructor(private readonly redisService: RedisService) {}

  async incrementDaily(bucket: string): Promise<number> {
    return this.redisService.increment(
      this.getDailyKey(bucket),
      MapUsageService.dailyTtlSeconds,
    );
  }

  async getDailyUsage(bucket: string): Promise<number> {
    return this.redisService.getInteger(this.getDailyKey(bucket));
  }

  getDailyKey(bucket: string): string {
    return `map:usage:daily:${bucket}`;
  }
}
