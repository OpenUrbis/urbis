import { Module } from '@nestjs/common';

import { TwoFactorGuard } from 'common/guards/two-factor/two-factor.guard';
import { AccessControlModule } from '../../common/guards/access-control/access-control.module';
import { MailModule } from '../../common/mail/mail.module';
import { RedisModule } from '../../common/redis/redis.module';
import { SharedModule } from '../../shared/shared.module';
import { UserModule } from '../../user/user.module';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [
    SharedModule,
    UserModule,
    MailModule,
    AccessControlModule,
    RedisModule,
  ],
  providers: [TwoFactorService, TwoFactorGuard],
  controllers: [TwoFactorController],
  exports: [TwoFactorService, TwoFactorGuard, UserModule],
})
export class TwoFactorModule {}
