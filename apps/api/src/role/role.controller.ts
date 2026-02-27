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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationData } from 'common/decorators/organization-data/organization-data.decorator';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { Organization } from 'organization/entities/organization.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RolePermissionScopeEnum } from './enums/role-permission-scope.enum';
import { RoleService } from './role.service';

@ApiTags('Role')
@UseGuards(AccessControlGuard, OrganizationGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get('list')
  @RequirePermission({
    permissions: { id: 'role:list', scope: RolePermissionScopeEnum.ANY },
  })
  @ApiOperation({ summary: 'Get permissions' })
  @ApiResponse({ status: 200, description: 'Permissions' })
  @ApiResponse({ status: 400, description: 'Error' })
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
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ): Promise<Role[]> {
    return this.service.list({ page, limit }, search);
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
  create(@Body() data: CreateRoleDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.service.update(id, data);
  }

  @Patch('assign')
  @RequirePermission({
    permissions: {
      action: 'assign',
      resource: 'role',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  assign(@Body() data: AssignRoleDto) {
    return this.service.assign(data);
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
}
