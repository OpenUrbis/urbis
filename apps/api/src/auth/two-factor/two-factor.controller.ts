import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrGuard } from 'common/guards/or-guard/or.guard';
import { TwoFactorGuard } from 'common/guards/two-factor/two-factor.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { User } from 'user/entities/user.entity';
import { TwoFactorDto } from './dto/two-factor.dto';
import { TwoFactorService } from './two-factor.service';

@ApiBearerAuth()
@UseGuards(OrGuard(TwoFactorGuard, AccessControlGuard))
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly service: TwoFactorService) {}

  @Post('setup')
  setup2fa(@Body() { code }: TwoFactorDto, @UserData() user: User) {
    return this.service.generate2FASecret(user, code);
  }

  @Post('verify')
  @RequirePermission({
    permissions: {
      action: 'verify-2fa',
      resource: 'auth',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async verify2fa(@Body() { code }: TwoFactorDto, @UserData() user: User) {
    const { isValid } = await this.service.verify2FACode(user, code);
    if (!isValid)
      throw new BadRequestException({
        message: 'Invalid code',
        isInvalid: true,
      });

    return { isValid };
  }

  @Post('desactive')
  async desactive2fa(@Body() { code }: TwoFactorDto, @UserData() user: User) {
    return await this.service.desactive(user, code);
  }

  @Patch('resend-email-otp')
  @RequirePermission({
    permissions: {
      action: 'resend-email-otp',
      resource: 'auth',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  resendEmailOtp(@UserData() user: User) {
    return this.service.resendEmailOtp(user);
  }
}
