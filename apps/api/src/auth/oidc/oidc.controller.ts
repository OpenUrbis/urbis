import {
  All,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Provider from 'oidc-provider';
import { LoginGuard } from './../guards/login.guard';

@Controller('auth/oidc')
export class OidcController {
  constructor(
    @Inject('OidcProvider')
    public oidcProvider: Provider,
    private configService: ConfigService,
  ) {}

  /*   @ApiBearerAuth()
  @SerializeOptions({
    groups: ['exposeProvider'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async me(@Req() request) {
return await this.authService.me(request.user);
  } */

  @Get('interaction/:uuid')
  async interactionView(
    @Req() req: Request,
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    req.url = req.originalUrl
      .toString()
      .replace('interaction/api', 'interaction')
      .replace('/auth/oidc', '');
    const { params, prompt, uid, ...body } =
      await this.oidcProvider.interactionDetails(req, res);
    const response = {
      params: params,
      uid: uid,
      uuid,
    };
    if (prompt.name === 'consent') {
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
    const clientUrl = this.configService.get('app.frontendDomain');
    res.redirect(
      [
        clientUrl,
        `sign-in?session=${uuid}&clientId=${(response as any).params.client_id}&prompt=${prompt.name}`,
      ].join('/'),
    );
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
    req.headers.cookie = '_interaction=' + uuid;
    try {
      const { uid, prompt } = await this.oidcProvider.interactionDetails(
        req,
        res,
      );
      res.send({ uid, prompt });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'invalid interaction' });
    }
  }

  @UseGuards(LoginGuard)
  @Post('interaction/login/:uuid')
  async loginConfirm(
    @Req() req,
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    req.body = {
      email: '',
      password: '',
    };
    req.headers.cookie = '_interaction=' + uuid;
    req.url = req.originalUrl
      .replace('/login', '')
      .replace('interaction/api', 'interaction')
      .replace('/auth/oidc', '');

    const session = {
      login: {
        accountId: req.user.id,
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
    res.send({ redirectToCallback, isNewUser: req.user?.isNewUser });
  }

  @All('/*')
  public mountedOidc(@Req() req: Request, @Res() res: Response) {
    req.url = req.originalUrl.replace('/auth/oidc', '');
    this.oidcProvider.callback()(req, res);
  }
}
