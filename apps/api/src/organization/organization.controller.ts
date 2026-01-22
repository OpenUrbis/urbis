import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
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
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { User } from 'user/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(AccessControlGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('my')
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'organization',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  my(@UserData() user: User) {
    return this.service.my(user.id);
  }

  @Get('user/:id')
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'organization',
    },
  })
  async getByUser(
    @Param('id') userId: string,
    @PermissionsData() permissionsData,
  ) {
    const allowedIds = permissionsData.organizations.map((o) => o.id);
    const organizations = await this.service.getByUser(userId);
    return organizations.filter((o) => allowedIds.includes(o.id));
  }

  @Get()
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'organization',
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
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('exclude') exclude: string[] | string,
    @PermissionsData() permissionsData,
  ) {
    const allowedIds = permissionsData.organizations.map((o) => o.id);

    return this.service.list(
      { page, limit },
      search,
      typeof exclude === 'string' ? [exclude] : exclude,
      allowedIds,
    );
  }

  @Get(':id')
  @RequirePermission({
    permissions: {
      action: 'view',
      resource: 'organization',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  get(@Param('id') id: string, @PermissionsData() permissionsData) {
    const allowedIds = permissionsData.organizations.map((o) => o.id);
    if (!allowedIds.includes(id)) {
      throw new NotFoundException({ message: 'Organization is not found' });
    }

    return this.service.findOne(id);
  }

  @Post()
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'organization',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  create(@Body() data: CreateOrganizationDto) {
    return this.service.create(data);
  }

  @Post('own')
  async createOwn(@Body() data: CreateOrganizationDto, @UserData() user: User) {
    return this.service.createOwn(data, user);
  }

  @Put(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'organization',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  update(
    @Param('id') id: string,
    @Body() data: UpdateOrganizationDto,
    @PermissionsData() permissionsData,
  ) {
    const allowedIds = permissionsData.organizations.map((o) => o.id);
    if (!allowedIds.includes(id)) {
      throw new NotFoundException({ message: 'Organization is not found' });
    }

    return this.service.update(id, data);
  }
}
