import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostHogService } from './posthog.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PostHogService],
  exports: [PostHogService],
})
export class PostHogModule {}
