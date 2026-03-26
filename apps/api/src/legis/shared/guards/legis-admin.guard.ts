import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

@Injectable()
export class LegisAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user?.id) {
      throw new UnauthorizedException('User is not authenticated.');
    }

    const isAdmin = user.userRoleAssignments?.some(
      (assignment: { roleId?: string; role?: { id?: string } }) =>
        assignment.roleId === SYSTEM_ROLES.admin ||
        assignment.role?.id === SYSTEM_ROLES.admin,
    );

    if (!isAdmin) {
      throw new ForbiddenException(
        'Only administrators can modify Legis resources.',
      );
    }

    return true;
  }
}
