import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class EmailStrategy extends PassportStrategy(Strategy, 'email') {
  constructor(public authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      console.log('EmailStrategy validate called with email:', email);
      const user = await this.authService.validateLogin({
        email: email.toLowerCase().trim(),
        password,
      });
      return user;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
