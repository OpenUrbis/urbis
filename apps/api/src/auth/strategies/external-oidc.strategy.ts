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
          console.log('Extracting idToken from request body:', req.body);
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
        handleSigningKeyError: (err, cb) => {
          console.error('JWKS Signing Key Error:', err, JWKS_URI);
          cb(err);
        },
      }),

      algorithms: ['RS256'],

      ignoreExpiration: false,

      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any): Promise<any> {
    console.log('External OIDC payload:', payload);
    const { accessToken } = req.body;
    const payloadAccessToken = accessToken
      ? this.jwtService.decode(accessToken as string)
      : null;
    console.log('External OIDC accessToken payload:', payloadAccessToken);
    const email = payload?.email ?? payloadAccessToken?.email;
    const name =
      payload?.social_name ?? payload?.name ?? payloadAccessToken?.name;
    const preferredUsername =
      payload?.preferred_username ?? payloadAccessToken?.preferred_username;
    const picture = payload?.picture ?? payloadAccessToken?.picture;

    let firstName = '';
    let lastName = '';

    if (name) {
      const parts = name.split(' ');
      firstName = parts[0];
      if (parts.length > 1) {
        lastName = parts.slice(1).join(' ');
      }
    }

    if (!payload || !email) {
      throw new UnauthorizedException('Payload do token incompleto.');
    }

    const user = await this.authService.createOrValidateExternalOidcUser({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      cpf: preferredUsername,
      govBrData: payload,
      country: 'BR',
      picture,
    });
    return user;
  }
}
