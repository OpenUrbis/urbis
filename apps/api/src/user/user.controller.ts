import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrganizationData } from 'common/decorators/organization-data/organization-data.decorator';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { Organization } from 'organization/entities/organization.entity';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from './enums/user-status.enum';
import { UserService } from './user.service';

@UseGuards(AccessControlGuard, OrganizationGuard)
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
  create(
    @Body() createProfileDto: CreateUserDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.create(createProfileDto, organization);
  }

  @Get()
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
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: UserStatus,
  ) {
    return this.service.list({ page, limit }, organizationId, status);
  }

  @Get('me/usage')
  @HttpCode(HttpStatus.OK)
  async getUsage(@UserData() user: any) {
    return this.service.getUsage(user);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.service.findOne({ id });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateUserDto) {
    return this.service.update(id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Patch(':id/status')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() body: { status: UserStatus }) {
    return this.service.updateStatus(id, body.status);
  }
}
