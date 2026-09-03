import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  Patch,
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
import { UpdateRepresentationStatusDto } from './dto/update-representation-status.dto';

@ApiTags('Representations')
@Controller({
  path: 'representations',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AccessControlGuard, OrganizationGuard)
export class RepresentationController {
  constructor(private readonly service: RepresentationService) {}

  private ensureSupportAccess(accessControl: AccessControl): void {
    if (!accessControl.isAdminMaster()) {
      throw new ForbiddenException(
        'Only support administrators can decide representation requests',
      );
    }
  }

  private hasGlobalPermission(
    accessControl: AccessControl,
    action: string,
  ): boolean {
    return accessControl.hasPermission({
      permissions: {
        id: `representation:${action}`,
        resource: 'representation',
        action,
        scope: RolePermissionScopeEnum.GLOBAL,
        exactScope: true,
      },
    });
  }

  private getAuthorizedOrganizationIds(
    accessControl: AccessControl,
    action: string,
  ): string[] {
    if (this.hasGlobalPermission(accessControl, action)) {
      return [];
    }

    // The user's organizations are not all necessarily authorized for this
    // action. Keep only organizations whose permission is explicitly ANY.
    return [
      ...new Set(
        accessControl.permissions
          .filter(
            (permission) =>
              permission.resource === 'representation' &&
              permission.action === action &&
              permission.scope === RolePermissionScopeEnum.ANY &&
              Boolean(permission.organizationId),
          )
          .map((permission) => permission.organizationId),
      ),
    ];
  }

  @Post()
  async requestRepresentation(
    @Request() request,
    @Body() dto: RequestRepresentationDto,
  ) {
    return this.service.requestRepresentation(request.user as User, dto);
  }

  @Get('check-document/:document')
  async checkDocument(
    @Param('document') document: string,
    @Query('representationType') representationType: string | undefined,
    @Request() request,
  ) {
    return this.service.checkOrganizationDocument(
      document,
      request.user as User,
      representationType,
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
    const isGlobal = this.hasGlobalPermission(accessControl, 'list');
    let organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'list',
    );

    // The selected organization must also be authorized for this action.
    // Otherwise an OWN user could turn the organization header into an
    // organization-wide filter merely by changing its value.
    if (!isGlobal && organization) {
      organizationIds = organizationIds.includes(organization.id)
        ? [organization.id]
        : [];
    }

    return this.service.getOverview(user, query, organizationIds, isGlobal);
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

    const isGlobal = this.hasGlobalPermission(accessControl, 'list');

    return this.service.findAll(
      user,
      {
        page: Number(page),
        limit: Number(limit),
      },
      organizationIds,
      isGlobal,
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

    const isGlobal = this.hasGlobalPermission(accessControl, 'view');

    return this.service.findOne(id, user, organizationIds, isGlobal);
  }

  @Patch(':id/status')
  @UseGuards(OrganizationGuard)
  @RequirePermission({
    permissions: {
      resource: 'representation',
      action: 'approve',
      scope: RolePermissionScopeEnum.OWN,
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRepresentationStatusDto,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    this.ensureSupportAccess(accessControl);
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'approve',
    );
    const isGlobal = this.hasGlobalPermission(accessControl, 'approve');
    return this.service.updateStatus(
      id,
      user,
      dto.status,
      dto.text,
      dto.attachments,
      organizationIds,
      isGlobal,
    );
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
  async approve(
    @Param('id') id: string,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    this.ensureSupportAccess(accessControl);
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'approve',
    );
    const isGlobal = this.hasGlobalPermission(accessControl, 'approve');

    return this.service.approve(id, user, organizationIds, isGlobal);
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
  async reject(
    @Param('id') id: string,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    this.ensureSupportAccess(accessControl);
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'reject',
    );
    const isGlobal = this.hasGlobalPermission(accessControl, 'reject');

    return this.service.reject(id, user, organizationIds, isGlobal);
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
    @Body() dto: AddCommentDto,
    @UserData() user: User,
    @PermissionsData() accessControl: AccessControl,
  ) {
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'comment',
    );
    const isGlobal = this.hasGlobalPermission(accessControl, 'comment');

    return this.service.requestInfo(
      id,
      user,
      dto.text,
      dto.attachments,
      organizationIds,
      isGlobal,
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
    @UserData() user: User,
    @Body() dto: AddCommentDto,
    @PermissionsData() accessControl: AccessControl,
  ) {
    const organizationIds = this.getAuthorizedOrganizationIds(
      accessControl,
      'comment',
    );
    const isGlobal = this.hasGlobalPermission(accessControl, 'comment');

    return this.service.addComment(
      id,
      user,
      dto.text,
      dto.attachments,
      organizationIds,
      isGlobal,
    );
  }
}
