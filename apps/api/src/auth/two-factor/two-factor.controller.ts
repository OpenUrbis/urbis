import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { User } from 'user/entities/user.entity';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorGuard } from 'common/guards/two-factor/two-factor.guard';

@ApiBearerAuth()
@UseGuards(TwoFactorGuard)
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly service: TwoFactorService) {}

  @Post('setup')
  setup2fa(@Body() { code }, @UserData() user: User) {
    return this.service.generate2FASecret(user, code);
  }

  @Post('verify')
  verify2fa(@Body() { code }: any, @UserData() user: User) {
    return this.service.verify2FACode(user, code);
  }

  @Patch('resend-email-otp')
  resendEmailOtp(@UserData() user: User) {
    return this.service.resendEmailOtp(user);
  }
}
