import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

const JWKS_URI = process.env.EXTERNAL_OIDC_JWKS_URI;

@Injectable()
export class ExternalOidcStrategy extends PassportStrategy(
  Strategy,
  'external-oidc',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (req.body && req.body.idToken) {
            return req.body.idToken;
          }
          return null;
        },
      ]),

      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: JWKS_URI,
        cacheMaxAge: 10 * 60 * 1000, // Cache de 10 minutos
      }),

      algorithms: ['RS256'],

      ignoreExpiration: false,

      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any): Promise<any> {
    const { accessToken } = req.body;
    const payloadAccessToken = accessToken
      ? this.jwtService.decode(accessToken as string)
      : null;
    const email = payload?.email ?? payloadAccessToken?.email;

    if (!payload || !email) {
      throw new UnauthorizedException('Payload do token incompleto.');
    }

    try {
      const user = await this.authService.createOrValidateExternalOidcUser({
        email: email.toLowerCase().trim(),
      });
      return user;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
