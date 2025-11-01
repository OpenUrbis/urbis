import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'user/user.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    if (!authorization) throw new UnauthorizedException();

    const userFromJwt = this.jwtService.decode(
      (authorization as string).replace('Bearer ', ''),
    );
    const user = await this.userService.findOne({
      id: userFromJwt?.id ?? userFromJwt?._id,
    });

    if (!user)
      throw new UnauthorizedException({ message: 'User is not found' });

    request.user = user;

    return true;
  }
}
