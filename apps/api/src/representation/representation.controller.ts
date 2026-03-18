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
import { RepresentationService } from './representation.service';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

@ApiTags('Representations')
@Controller({
  path: 'representations',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AccessControlGuard, OrganizationGuard)
export class RepresentationController {
  constructor(private readonly service: RepresentationService) {}

  private getAuthorizedOrganizationIds(
    accessControl: AccessControl,
    action: string,
  ): string[] {
    if (
      accessControl.hasPermission({
        permissions: {
          resource: 'representation',
          action,
          scope: RolePermissionScopeEnum.GLOBAL,
          exactScope: true,
          organizationId: SYSTEM_ROLES.admin,
        } as any,
      })
    ) {
      return [];
    }

    if (
      accessControl.hasPermission({
        permissions: {
          resource: 'representation',
          action,
          scope: RolePermissionScopeEnum.ANY,
          exactScope: true,
        } as any,
      })
    ) {
      return accessControl.organizations.map((org) => org.id);
    }

    return accessControl.organizations.map((org) => org.id); // For 'OWN', fallback to user's assigned organizations
  }

  @Post()
  async requestRepresentation(
    @Request() request,
    @Body() dto: RequestRepresentationDto,
  ) {
    return this.service.requestRepresentation(request.user as User, dto);
  }

  @Get('check-document/:document')
  async checkDocument(@Param('document') document: string, @Request() request) {
    return this.service.checkOrganizationDocument(
      document,
      request.user as User,
    );
  }

  @Get('overview')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'representation',
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
    let organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'list',
    );

    // For specific organization query in overview, if it's not global
    if (organizationIds.length > 0 && organization) {
      // Filter the accessible ones to just the one requested (if applicable) or default to the organization
      organizationIds = [organization.id];
    }

    return this.service.getOverview(user, query, organizationIds);
  }

  @Get()
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'representation',
      action: 'list',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'list',
    );

    return this.service.findAll(
      user,
      {
        page: Number(page),
        limit: Number(limit),
      },
      organizationIds,
    );
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'representation',
      action: 'view',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async findOne(
    @Param('id') id: string,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'view',
    );

    return this.service.findOne(id, user, organizationIds);
  }

  @Post(':id/approve')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'representation',
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
      resource: 'representation',
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
      resource: 'representation',
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
      resource: 'representation',
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
