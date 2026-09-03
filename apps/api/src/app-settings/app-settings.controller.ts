import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

@Controller('app-settings')
@UseGuards(AccessControlGuard)
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get('')
  @RequirePermission({
    permissions: {
      resource: 'app-settings',
      action: 'list',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('')
  @RequirePermission({
    permissions: {
      resource: 'app-settings',
      action: 'update',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  updateSettings(@Body() body: UpdateAppSettingsDto) {
    return this.service.updateSettings(body);
  }
}
