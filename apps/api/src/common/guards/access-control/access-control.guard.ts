import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS_KEY } from 'common/decorators/require-permissions/require-permissions.decorator';
import { OrganizationService } from 'organization/organization.service';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { RoleService } from 'role/role.service';
import { UserService } from 'user/user.service';
import { AccessControl, AccessControlOptions } from './access-control';

@Injectable()
export class AccessControlGuard
  extends AuthGuard('jwt')
  implements CanActivate, OnModuleInit
{
  private organizationService: OrganizationService;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  onModuleInit() {
    this.organizationService = this.moduleRef.get(OrganizationService, {
      strict: false,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    if (!request?.user?.id || !request?.user?._id) return false;

    if (!isValid) {
      throw new UnauthorizedException('Invalid token.');
    }

    const user = await this.userService.findOne({
      id: request?.user?.id ?? request?.user?._id,
    });

    if (!user) {
      throw new UnauthorizedException('User is not found.');
    }

    const accessControl = new AccessControl(
      await this.roleService.listUserRoles(user.id),
    );

    const idsForHierarchy = new Set<string>();
    const idsForDescendants = new Set<string>();

    for (const prm of accessControl.permissions) {
      if (!prm.organizationId) continue;

      if (prm.scope === RolePermissionScopeEnum.GLOBAL) {
        idsForHierarchy.add(prm.organizationId);
      } else if (prm.scope === RolePermissionScopeEnum.ANY) {
        idsForDescendants.add(prm.organizationId);
      }
    }

    if (idsForHierarchy.size > 0) {
      const hierarchy = await this.organizationService.findHierarchy([
        ...idsForHierarchy,
      ]);
      // console.log('DEBUG: Hierarchy loaded:', hierarchy.map(o => o.name));
      accessControl.addOrganizations(hierarchy);
    }

    if (idsForDescendants.size > 0) {
      const descendants = await this.organizationService.findDescendants([
        ...idsForDescendants,
      ]);
      accessControl.addOrganizations(descendants);
    }

    const requiredOptions = this.reflector.get<AccessControlOptions>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (requiredOptions && !accessControl.hasPermission(requiredOptions))
      throw new ForbiddenException('Insufficient permission');

    request.user = user;
    request.accessControl = accessControl;

    return true;
  }
}
