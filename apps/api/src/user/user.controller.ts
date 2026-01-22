import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PermissionsData } from 'common/decorators/permissions-data/permissions-data.decorator';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@UseGuards(AccessControlGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateUserDto) {
    return this.service.create(createProfileDto);
  }

  @Get()
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'user',
      scope: RolePermissionScopeEnum.OWN,
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
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('organizationId') organizationId: string,
    @PermissionsData() permissionsData,
  ) {
    const allowedOrganizationIds = permissionsData.organizations.map(
      (o) => o.id,
    );
    return this.service.list(
      { page, limit },
      organizationId,
      allowedOrganizationIds,
    );
  }

  @Get(':id')
  @RequirePermission({
    permissions: {
      action: 'view',
      resource: 'user',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @PermissionsData() permissionsData) {
    const user = await this.service.findOne({ id });
    if (!user) throw new NotFoundException({ message: 'User is not found' });

    const allowedOrganizationIds = permissionsData.organizations.map(
      (o) => o.id,
    );
    const userOrgs = user.userRoleAssignments.map((a) => a.organizationId);
    const hasAccess = userOrgs.some((orgId) =>
      allowedOrganizationIds.includes(orgId),
    );

    if (!hasAccess)
      throw new NotFoundException({ message: 'User is not found' });

    return user;
  }

  @Put(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'user',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateUserDto,
    @PermissionsData() permissionsData,
  ) {
    const user = await this.service.findOne({ id });
    if (!user) throw new NotFoundException({ message: 'User is not found' });

    const allowedOrganizationIds = permissionsData.organizations.map(
      (o) => o.id,
    );
    const userOrgs = user.userRoleAssignments.map((a) => a.organizationId);
    const hasAccess = userOrgs.some((orgId) =>
      allowedOrganizationIds.includes(orgId),
    );

    if (!hasAccess)
      throw new NotFoundException({ message: 'User is not found' });

    return this.service.update(id, updateProfileDto);
  }

  @Delete(':id')
  @RequirePermission({
    permissions: {
      action: 'delete',
      resource: 'user',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async remove(@Param('id') id: string, @PermissionsData() permissionsData) {
    const user = await this.service.findOne({ id });
    if (!user) throw new NotFoundException({ message: 'User is not found' });

    const allowedOrganizationIds = permissionsData.organizations.map(
      (o) => o.id,
    );
    const userOrgs = user.userRoleAssignments.map((a) => a.organizationId);
    const hasAccess = userOrgs.some((orgId) =>
      allowedOrganizationIds.includes(orgId),
    );

    if (!hasAccess)
      throw new NotFoundException({ message: 'User is not found' });

    return this.service.softDelete(id);
  }
}
