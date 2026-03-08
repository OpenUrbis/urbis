import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { User } from 'user/entities/user.entity';
import { TwoFactoryService } from './two-factory.service';

@ApiBearerAuth()
@UseGuards(AccessControlGuard)
@Controller('auth/2fa')
export class TwoFactoryController {
constructor(private readonly service: TwoFactoryService){}

  @Post('setup')
  setup2fa(@Body() {code}, @UserData() user: User) {
    return this.service.generate2FASecret(user, code);
  }

  @Post('verify')
  verify2fa(@Body() { code }: any, @UserData() user: User) {
    return this.service.verify2FACode(user, code);
  }

  @Patch('resend-email-otp')
  resendEmailOtp(@UserData() user: User) {
    return this.service.resendEmailOtp(user)
  }
}
