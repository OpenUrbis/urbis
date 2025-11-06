import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { AccessControlModule } from '../../common/guards/access-control/access-control.module';
import { MailModule } from '../../common/mail/mail.module';
import { SharedModule } from '../../shared/shared.module';
import { UserModule } from '../../user/user.module';
import { TwoFactoryController } from './two-factory.controller';
import { TwoFactoryService } from './two-factory.service';

@Module({
  imports: [
    SharedModule,
    UserModule,
    MailModule,
    AccessControlModule,
    RedisModule,
  ],
  providers: [TwoFactoryService],
  controllers: [TwoFactoryController],
})
export class TwoFactoryModule {}
