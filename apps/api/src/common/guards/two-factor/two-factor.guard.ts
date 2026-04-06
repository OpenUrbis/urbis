import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../user/user.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization.split('Bearer ').join('');

    if (!token) throw new UnauthorizedException();

    try {
      const userFromJwt = this.jwtService.verify(token, {
        secret: this.configService.get('auth.twoFactorSecret'),
      });

      const user = await this.userService.findOne({ id: userFromJwt._id });
      if (!user) throw new NotFoundException({ message: 'User is not found' });

      request.user = user;

      return true;
    } catch (_err) {
      throw new UnauthorizedException();
    }
  }
}
