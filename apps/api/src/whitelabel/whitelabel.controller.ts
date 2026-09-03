import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { ApplicationName } from './enums/application-name.enum';
import { UpdateWhitelabelDto } from './dto/update-whitelabel.dto';
import { WhitelabelService } from './whitelabel.service';

@ApiTags('Whitelabel')
@Controller({
  path: 'whitelabel',
})
export class WhitelabelController {
  constructor(private readonly service: WhitelabelService) {}

  @Get(':organizationId/:application')
  @ApiOperation({ summary: 'Get application whitelabel configuration' })
  @ApiResponse({ status: 200, description: 'Application whitelabel config' })
  async getOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
  ) {
    return this.service.getOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }

  @Get(':organizationId/:application/unified')
  @ApiOperation({ summary: 'Get unified whitelabel configuration' })
  @ApiResponse({ status: 200, description: 'Unified whitelabel config' })
  async getUnifiedOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
  ) {
    return this.service.getUnifiedOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }

  @Put(':organizationId/:application')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard)
  @RequirePermission({
    permissions: {
      resource: 'organization',
      action: 'update',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'Update organization whitelabel configuration' })
  @ApiResponse({ status: 200, description: 'Updated whitelabel configuration' })
  async updateOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
    @Body() dto: UpdateWhitelabelDto,
  ) {
    await this.service.updateWhitelabel(organizationId, applicationName, dto);
    return this.service.getUnifiedOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }
}
