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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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
import { UserApiKeyService } from './user-api-key.service';

@UseGuards(AccessControlGuard, OrganizationGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly configService: ConfigService,
    private readonly apiKeyService: UserApiKeyService,
  ) {}

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
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'user',
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
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @OrganizationData() organization: Organization,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('emailConfirmed') emailConfirmed?: string,
  ) {
    const defaultOrgId = this.configService.get<string>(
      'admin.organization.id',
    );
    const effectiveOrgId =
      organization.id === defaultOrgId ? organizationId : organization.id;
    return this.service.list(
      { page, limit },
      effectiveOrgId,
      status,
      search,
      emailConfirmed === undefined ? undefined : emailConfirmed === 'true',
    );
  }

  @Get('me/usage')
  @HttpCode(HttpStatus.OK)
  async getUsage(
    @UserData() user: any,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.getUsage(user, organization);
  }

  @Post('me/api-keys')
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @UserData() user: any,
    @OrganizationData() organization: Organization,
    @Body('name') name: string,
  ) {
    return this.apiKeyService.createKey(user.id, organization.id, name);
  }

  @Get('me/api-keys')
  @HttpCode(HttpStatus.OK)
  async listApiKeys(
    @UserData() user: any,
    @OrganizationData() organization: Organization,
  ) {
    return this.apiKeyService.listKeys(user.id, organization.id);
  }

  @Delete('me/api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeApiKey(@UserData() user: any, @Param('id') id: string) {
    await this.apiKeyService.revokeKey(user.id, id);
  }

  @Get(':id')
  @RequirePermission({
    permissions: {
      action: 'view',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.service.findOne({ id });
  }

  @Put(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    return this.service.update(
      id,
      updateProfileDto,
      (request as any).accessControl,
    );
  }

  @Delete(':id')
  @RequirePermission({
    permissions: {
      action: 'delete',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
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
