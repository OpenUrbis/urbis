import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControl } from 'common/guards/access-control/access-control';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { Organization } from 'organization/entities/organization.entity';
import { OrganizationData } from '../common/decorators/organization-data/organization-data.decorator';
import { PermissionsData } from '../common/decorators/permissions-data/permissions-data.decorator';
import { RequirePermission } from '../common/decorators/require-permissions/require-permissions.decorator';
import { OrganizationGuard } from '../common/guards/organization/organization.guard';
import { RolePermissionScopeEnum } from '../role/enums/role-permission-scope.enum';
import { User } from '../user/entities/user.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { GetRepresentationOverviewDto } from './dto/get-representation-overview.dto';
import { RequestRepresentationDto } from './dto/request-representation.dto';
import { SolicitationService } from './solicitation.service';

@ApiTags('Solicitations')
@Controller({
  path: 'solicitations',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AccessControlGuard, OrganizationGuard)
export class SolicitationController {
  constructor(private readonly service: SolicitationService) {}

  @Post()
  async requestRepresentation(
    @Request() request,
    @Body() dto: RequestRepresentationDto,
  ) {
    return this.service.requestRepresentation(request.user as User, dto);
  }

  @Get('available')
  async getAvailable(@Request() request) {
    return this.service.getAvailableRepresentations(request.user as User);
  }

  @Get('overview')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'list',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async getOverview(
    @Query() query: GetRepresentationOverviewDto,
    @UserData() user: User,
    @OrganizationData() organization: Organization,
    @PermissionsData() accessControl: AccessControl,
  ) {
    let organizationIds: string[] = [];

    if (
      accessControl.hasPermission({
        permissions: {
          resource: 'solicitation',
          action: 'list',
          scope: RolePermissionScopeEnum.GLOBAL,
        } as any,
      })
    ) {
      organizationIds = [];
    } else if (
      accessControl.hasPermission({
        permissions: {
          resource: 'solicitation',
          action: 'list',
          scope: RolePermissionScopeEnum.ANY,
        } as any,
      })
    ) {
      organizationIds = accessControl.organizations.map((org) => org.id);
    } else {
      organizationIds = [organization.id];
    }

    return this.service.getOverview(user, query, organizationIds);
  }

  @Get()
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'list',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async findAll(
    @Request() request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.findAll(request.user as User, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'view',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'approve',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async approve(@Param('id') id: string, @Request() request) {
    return this.service.approve(id, request.user as User);
  }

  @Post(':id/reject')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'reject',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async reject(@Param('id') id: string, @Request() request) {
    return this.service.reject(id, request.user as User);
  }

  @Post(':id/request-info')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'comment',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async requestInfo(
    @Param('id') id: string,
    @Request() request,
    @Body() dto: AddCommentDto,
  ) {
    return this.service.requestInfo(
      id,
      request.user as User,
      dto.text,
      dto.attachments,
    );
  }

  @Post(':id/comments')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'solicitation',
      action: 'comment',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async addComment(
    @Param('id') id: string,
    @Request() request,
    @Body() dto: AddCommentDto,
  ) {
    return this.service.addComment(
      id,
      request.user as User,
      dto.text,
      dto.attachments,
    );
  }
}
