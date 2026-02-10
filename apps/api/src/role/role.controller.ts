import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrganizationData } from 'common/decorators/organization-data/organization-data.decorator';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { Organization } from 'organization/entities/organization.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleFromOrganizationDto } from './dto/update-role-from-organization.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermissionScopeEnum } from './enums/role-permission-scope.enum';
import { RoleService } from './role.service';

@ApiTags('Role')
@UseGuards(AccessControlGuard, OrganizationGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get('list')
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page of pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Limit of registers',
    example: 100,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
    example: 0,
  })
  @ApiQuery({
    name: 'exclude',
    required: false,
    type: String,
    description: 'Exclude permissions',
    example: "['role:create','user:create']",
  })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('exclude') exclude: string[] | string,
  ) {
    return this.service.list(
      { page, limit },
      search,
      typeof exclude === 'string' ? [exclude] : exclude,
    );
  }

  @Get('user/:userId')
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  listUserRoles(
    @Param('userId') userId: string,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.listUserRoles(userId, organization.id);
  }

  @Post()
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  create(
    @Body() data: CreateRoleDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.create({ ...data, organizationId: organization.id });
  }

  @Put(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  update(
    @Param('id') id: string,
    @Body() data: UpdateRoleDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.update(id, data, organization);
  }

  @Patch('assign')
  @RequirePermission({
    permissions: {
      action: 'assign',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  assign(
    @Body() data: AssignRoleDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.assign(data, organization);
  }

  @Patch('unassign/:id')
  @RequirePermission({
    permissions: {
      action: 'unassign',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }

  @RequirePermission({
    permissions: {
      action: 'assign',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Put('assign/:organizationId')
  updateAssignByOrganization(
    @Param('organizationId') organizationId: string,
    @Body() data: UpdateRoleFromOrganizationDto,
  ) {
    return this.service.updateAssignByOrganization(organizationId, data);
  }

  @RequirePermission({
    permissions: {
      action: 'assign',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Post('assign/:organizationId')
  assignByOrganization(
    @Param('organizationId') organizationId: string,
    @Body() data: UpdateRoleFromOrganizationDto,
  ) {
    return this.service.assignByOrganization(organizationId, data);
  }
}
