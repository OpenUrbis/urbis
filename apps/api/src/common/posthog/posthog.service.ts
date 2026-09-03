import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class PostHogService implements OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('POSTHOG_KEY') ||
      process.env.POSTHOG_KEY;
    const host =
      this.configService.get<string>('POSTHOG_HOST') ||
      process.env.POSTHOG_HOST ||
      'https://eu.i.posthog.com';

    if (apiKey) {
      try {
        this.client = new PostHog(apiKey, { host });
        this.logger.log('PostHog NestJS client initialized successfully.');
      } catch (err) {
        this.logger.warn('Failed to initialize PostHog Node client:', err);
      }
    } else {
      this.logger.log(
        'POSTHOG_KEY not set. PostHog backend tracking is disabled.',
      );
    }
  }

  public capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, any>;
  }): void {
    if (!this.client) return;
    try {
      this.client.capture(params);
    } catch (err) {
      this.logger.warn(`Failed to capture event ${params.event}:`, err);
    }
  }

  public async isFeatureEnabled(
    featureKey: string,
    distinctId: string,
  ): Promise<boolean> {
    if (!this.client) return false;
    try {
      const enabled = await this.client.isFeatureEnabled(
        featureKey,
        distinctId,
      );
      return Boolean(enabled);
    } catch (err) {
      this.logger.warn(`Failed to check feature flag ${featureKey}:`, err);
      return false;
    }
  }

  public async getFeatureFlag(
    featureKey: string,
    distinctId: string,
  ): Promise<string | boolean | undefined> {
    if (!this.client) return undefined;
    try {
      const flag = await this.client.getFeatureFlag(featureKey, distinctId);
      return flag;
    } catch (err) {
      this.logger.warn(`Failed to get feature flag ${featureKey}:`, err);
      return undefined;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
