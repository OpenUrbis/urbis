import { Module } from '@nestjs/common';
import { TwoFactoryController } from './two-factory.controller';
import { TwoFactoryService } from './two-factory.service';

@Module({
  controllers: [TwoFactoryController],
  providers: [TwoFactoryService]
})
export class TwoFactoryModule {}
