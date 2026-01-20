import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
  ) {
    super();
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
