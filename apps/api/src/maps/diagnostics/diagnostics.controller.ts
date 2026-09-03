import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrGuard } from 'common/guards/or-guard/or.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { DiagnosticsService } from './diagnostics.service';

@ApiTags('Diagnostics')
@Controller('maps/diagnostics')
export class DiagnosticsController {
  constructor(private readonly service: DiagnosticsService) {}

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'layer-schema',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Get('links')
  @ApiOperation({
    summary:
      'Run link diagnostics to find broken links in Mosaico, Legis and Maps (chamadas)',
  })
  @ApiResponse({
    status: 200,
    description: 'The link diagnostic report',
  })
  async runLinkDiagnostics() {
    return this.service.runLinkDiagnostics();
  }
}
