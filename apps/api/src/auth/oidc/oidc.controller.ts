import {
  All,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { AuthService } from 'auth/auth.service';
import { TwoFactorService } from 'auth/two-factor/two-factor.service';
import { TwoFactorGuard } from 'common/guards/two-factor/two-factor.guard';
import { MailService } from 'common/mail/mail.service';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import Provider from 'oidc-provider';
import { User } from 'user/entities/user.entity';
import { UserStatus } from 'user/enums/user-status.enum';
import { LoginGuard } from './../guards/login.guard';

@Controller('auth/oidc')
export class OidcController {
  constructor(
    @Inject('OidcProvider')
    public oidcProvider: Provider,
    private configService: ConfigService,
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private signCookie(data: string, secret: string): string {
    return crypto
      .createHmac('sha1', secret)
      .update(data)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private setInteractionCookies(req: any, uuid: string) {
    try {
      const cookieSecret =
        this.configService.get('auth.secret') ||
        'urbis-oidc-secret-default-signing-key';
      const interactionSig = this.signCookie(
        '_interaction=' + uuid,
        cookieSecret,
      );
      const resumeSig = this.signCookie(
        '_interaction_resume=' + uuid,
        cookieSecret,
      );

      const newCookies = [
        `_interaction=${uuid}`,
        `_interaction.sig=${interactionSig}`,
        `_interaction_resume=${uuid}`,
        `_interaction_resume.sig=${resumeSig}`,
      ];

      const existingCookies = (req.headers?.cookie || '')
        .split(';')
        .map((c: string) => c.trim())
        .filter(
          (c: string) =>
            c &&
            !c.startsWith('_interaction=') &&
            !c.startsWith('_interaction.sig=') &&
            !c.startsWith('_interaction_resume=') &&
            !c.startsWith('_interaction_resume.sig='),
        );

      req.headers = req.headers || {};
      req.headers.cookie = [...newCookies, ...existingCookies].join('; ');
    } catch (e) {
      console.error('Failed to sign interaction cookies:', e);
      req.headers = req.headers || {};
      req.headers.cookie = '_interaction=' + uuid;
    }
  }

  @Get('session/end/confirm')
  public redirectEndSessionConfirm(@Res() res: Response) {
    res.redirect('/auth/oidc/session/end');
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['exposeProvider'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async me(@Req() request) {
    const user = await this.authService.me(request.user);

    return {
      sub: user.id,
      id: user.id,
      _id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      given_name: user.firstName,
      family_name: user.lastName,
    };
  }

  @Get('interaction/:uuid')
  async interactionView(
    @Req() req: Request,
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    const clientUrl = this.configService.get('app.accountsUrl');
    try {
      req.url = req.originalUrl
        .toString()
        .replace('interaction/api', 'interaction')
        .replace('/auth/oidc', '');

      this.setInteractionCookies(req, uuid);

      let interactionDetailsResult: any;
      try {
        interactionDetailsResult = await this.oidcProvider.interactionDetails(
          req,
          res,
        );
      } catch (err) {
        const interaction = await (this.oidcProvider as any).Interaction?.find(
          uuid,
        );
        if (interaction) {
          interactionDetailsResult = {
            uid: interaction.uid || uuid,
            prompt: interaction.prompt,
            params: interaction.params,
          };
        } else {
          throw err;
        }
      }

      const { params, prompt, uid } = interactionDetailsResult;
      const response = {
        params: params,
        uid: uid,
        uuid,
      };
      if (prompt?.name === 'consent') {
        // this.oidcProvider.callback()(req, res);
        const apiUrl = this.configService.get('app.backendDomain');
        res.send(`
        <html>
          <head>
            <title>Carregando...</title>
          </head>
          <body onload="document.forms[0].submit()">
            <form autocomplete="off" action="${apiUrl}/auth/oidc/interaction/${uid}" method="post">
              <input type="hidden" name="prompt" value="consent">
              <div style="padding: 12px;">Carregando...</div>
              <button style="display: none;" autofocus type="submit" class="login login-submit">Continue</button>
            </form>
          </body>
        </html>
      `);
        return;
      }
      res.redirect(
        [
          clientUrl,
          `sign-in?session=${uuid}&clientId=${(response as any).params?.client_id || ''}&prompt=${prompt?.name || ''}`,
        ].join('/'),
      );
    } catch (error) {
      console.error('Error in interactionView:', error);
      res.redirect(`${clientUrl}/sign-in?session=${uuid}`);
    }
  }

  @Get('/interaction/validate/:uuid')
  async interactionDetails(
    @Req() req,
    @Res() res,
    @Param('uuid') uuid: string,
  ) {
    req.url = req.originalUrl
      .toString()
      .replace('interaction/api', 'interaction')
      .replace('/auth/oidc', '')
      .replace('interaction/validate', 'interaction');
    this.setInteractionCookies(req, uuid);
    try {
      const { uid, prompt, params } =
        await this.oidcProvider.interactionDetails(req, res);
      res.send({ uid, prompt, params });
    } catch (error) {
      try {
        const interaction = await (this.oidcProvider as any).Interaction.find(
          uuid,
        );
        if (interaction) {
          res.send({
            uid: interaction.uid || uuid,
            prompt: interaction.prompt,
            params: interaction.params,
          });
          return;
        }
      } catch (innerError) {
        console.error('Interaction lookup fallback error:', innerError);
      }
      console.error('Error in interactionDetails:', error);
      res.status(500).json({ message: 'invalid interaction' });
    }
  }

  @UseGuards(TwoFactorGuard)
  @Post('interaction/validate2fa/:uuid')
  async validate2FA(
    @Req() req,
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    const { code } = req.body;
    req.body = {
      email: '',
      password: '',
      code: '',
    };
    req.headers.authorization = '';
    req.headers.Authorization = '';
    this.setInteractionCookies(req, uuid);
    req.url = req.originalUrl
      .replace('/validate2fa', '')
      .replace('interaction/api', 'interaction')
      .replace('/auth/oidc', '');

    const user: User = req.user;

    const session = {
      login: {
        accountId: user.id,
      },
    };
    const { isValid } = await this.twoFactorService.verify2FACode(
      user,
      code as string,
    );
    if (!isValid)
      throw new BadRequestException({
        message: 'Invalid code',
        isInvalid: true,
      });
    const redirectToCallback = await this.oidcProvider.interactionResult(
      req,
      res,
      session,
      {
        mergeWithLastSubmission: true,
      },
    );
    res.send({ redirectToCallback });
  }

  @UseGuards(LoginGuard)
  @Recaptcha({
    response: (req) => req.body.recaptcha,
    action: 'signin',
    score: 0.5,
  })
  @Post('interaction/login/:uuid')
  async loginConfirm(
    @Req() req,
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    req.body = {
      email: '',
      password: '',
      session: '',
      idToken: '',
      accessToken: '',
    };
    this.setInteractionCookies(req, uuid);
    req.url = req.originalUrl
      .replace('/login', '')
      .replace('interaction/api', 'interaction')
      .replace('/auth/oidc', '');

    const {
      id,
      otpValidated,
      requires2fa,
      email,
      isEmailConfirmed,
      firstName,
      emailHashConfirm,
      status,
    }: User = req.user;

    if (status !== UserStatus.ACTIVE) {
      throw new BadRequestException({
        message: 'User is not allowed',
        inAnalysis: true,
      });
    }

    if (!isEmailConfirmed) {
      await this.mailService.userSignUp({
        to: email,
        data: {
          hash: emailHashConfirm,
          firstName: firstName,
        },
      });

      throw new BadRequestException({
        message: 'Email not confirmed',
        isEmailNotConfirmed: true,
      });
    }

    const session = {
      login: {
        accountId: id,
      },
    };

    const redirectToCallback = await this.oidcProvider.interactionResult(
      req,
      res,
      session,
      {
        mergeWithLastSubmission: true,
      },
    );

    res.send({
      otpValidated,
      requires2fa,
      redirectToCallback: requires2fa ? undefined : redirectToCallback,
      accessToken: this.jwtService.sign(
        {
          _id: id,
          id: id,
          sub: id,
          email: email,
        },
        { secret: this.configService.get('auth.twoFactorSecret') },
      ),
    });
  }

  @All('/*')
  public mountedOidc(@Req() req: Request, @Res() res: Response) {
    req.url = req.originalUrl.replace('/auth/oidc', '');
    void this.oidcProvider.callback()(req, res);
  }
}
