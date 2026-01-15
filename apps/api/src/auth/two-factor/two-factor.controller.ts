import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { User } from 'user/entities/user.entity';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorGuard } from 'common/guards/two-factor/two-factor.guard';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

@ApiBearerAuth()
@UseGuards(TwoFactorGuard)
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly service: TwoFactorService) {}

  @Post('setup')
  @RequirePermission({
    permissions: {
      action: 'setup-2fa',
      resource: 'auth',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  @Post('verify')
  @RequirePermission({
    permissions: {
      action: 'verify-2fa',
      resource: 'auth',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
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
