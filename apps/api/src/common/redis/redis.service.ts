import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async get<T = any>(key: string): Promise<T> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async getInteger(key: string): Promise<number> {
    const value = await this.redisClient.get(key);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await this.redisClient.incr(key);
    if (value === 1 && ttlSeconds) {
      await this.redisClient.expire(key, ttlSeconds);
    }
    return value;
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async keys(pattern = '*'): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }
}
