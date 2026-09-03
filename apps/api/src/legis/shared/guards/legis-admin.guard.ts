import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class LegisAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user?.id) {
      throw new UnauthorizedException('User is not authenticated.');
    }

    // AccessControlGuard loads the current role assignments from the database.
    // Do not infer this privilege from role names, claims, or the JWT payload:
    // only the exact system administrator role may mutate Legis resources.
    if (!request?.accessControl?.isAdminMaster?.()) {
      throw new ForbiddenException(
        'Only the principal system administrator can modify Legis resources.',
      );
    }

    return true;
  }
}
