import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from 'role/role.service';

export const Role = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    if (!authorization) throw new UnauthorizedException();

    const userFromJwt: { id: string; _id: string } = this.jwtService.decode(
      (authorization as string).replace('Bearer ', ''),
    );
    const roles = await this.roleService.getUserRoles(
      userFromJwt?.id ?? userFromJwt?._id,
    );

    const routeRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!routeRoles) {
      return true;
    }

    request.roles = roles;

    return true;
  }
}
