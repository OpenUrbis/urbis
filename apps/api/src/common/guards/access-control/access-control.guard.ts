import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS_KEY } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RoleService } from 'role/role.service';
import { UserService } from 'user/user.service';
import { AccessControl, AccessControlOptions } from './access-control';

@Injectable()
export class AccessControlGuard
  extends AuthGuard('jwt')
  implements CanActivate
{
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,

    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    if (!request?.user?.id && !request?.user?._id) return false;

    if (!isValid) {
      throw new UnauthorizedException('Invalid token.');
    }

    const user = await this.userService.findOne({
      id: request?.user?.id ?? request?.user?._id,
    });

    if (!user) {
      throw new UnauthorizedException('User is not found.');
    }

    const defaultOrgId = this.configService.get<string>(
      'admin.organization.id',
    );
    const organizationId = request.headers['x-organization-id'] as
      | string
      | undefined;
    const accessControl = new AccessControl(
      await this.roleService.listUserRoles(user.id, organizationId),
      defaultOrgId,
    );

    const requiredOptions = this.reflector.get<AccessControlOptions>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (requiredOptions) {
      const organizationId = request.headers['x-organization-id'] as string;
      const permissions = Array.isArray(requiredOptions.permissions)
        ? requiredOptions.permissions
        : [requiredOptions.permissions];

      const scopedPermissions = permissions.map((p) => ({
        ...p,
        organizationId: p.organizationId ?? organizationId,
      }));

      const scopedOptions = {
        ...requiredOptions,
        permissions: scopedPermissions,
      };

      if (!accessControl.hasPermission(scopedOptions))
        throw new ForbiddenException('Insufficient permission');
    }

    request.user = user;
    request.accessControl = accessControl;

    return true;
  }
}
