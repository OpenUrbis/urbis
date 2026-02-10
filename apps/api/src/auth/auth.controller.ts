import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Request,
  Res,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { User } from 'user/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(public service: AuthService) {}

  /* @Post('login/simple')
  async loginSimple(@Body() loginDto: AuthEmailLoginDto) {
    const user = await this.service.validateLogin(loginDto);
    const token = await this.service.buildAccessToken(user._id.toString());
    return {
      user,
      token,
    };
  } */

  @Post('email/register')
  @Recaptcha({
    response: (req) => req.body.recaptcha,
    action: 'signup',
    score: 0.5,
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: AuthRegisterLoginDto) {
    return await this.service.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto) {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto) {
    return await this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto) {
    return await this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @Post('email/resend')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async resendEmailConfirmation(@Req() req: any) {
    return await this.service.resendEmailConfirmation(req.user.id as string);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['exposeProvider'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async me(@Request() request) {
    return this.service.me(request.user as User);
  }

  @ApiBearerAuth()
  @Get('permissions')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async permissions(@Request() request) {
    return this.service.getPermissions(request.user as User);
  }

  @ApiBearerAuth()
  @Get('roles')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async roles(@Request() request) {
    return this.service.getRoles(request.user as User);
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async update(@Request() request, @Body() userDto: AuthUpdateDto) {
    return await this.service.update(request.user as User, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async delete(@Request() request) {
    return this.service.softDelete(request.user as User);
  }

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  public callback(@Request() req, @Res() res): Promise<void> {
    const query = req.query as object;
    const params = Object.keys(query)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`,
      )
      .join('&');
    const redirectUrl = `com.application-name.app:/callback?${params}`;
    return res.redirect(redirectUrl);
  }

  @Get('global-logout')
  public globalLogout(@Res() res) {
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sair</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; margin: 0; }
            .loader { border: 4px solid #e1e1e1; border-top: 4px solid #0078d4; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { color: #333; margin-bottom: 10px; }
            p { color: #666; }
        </style>
    </head>
    <body>
        <div class="loader"></div>
        <h2>Encerrando sessão...</h2>
        <p>Por favor, aguarde enquanto desconectamos você de todos os sistemas.</p>

        <script>
            const apps = [
                { prod: 'https://conta.urbis.prefeitura.sp.gov.br', local: 'http://localhost:4200' },
                { prod: 'https://mapa.urbis.prefeitura.sp.gov.br', local: 'http://localhost:5173' },
                { prod: 'https://urbis.prefeitura.sp.gov.br', local: 'http://localhost:5174' },
                { prod: 'https://docs.urbis.prefeitura.sp.gov.br', local: 'http://localhost:3010' }
            ];

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            function logoutApps() {
                apps.forEach(app => {
                    const url = isLocal ? app.local : app.prod;
                    if (url) {
                        const iframe = document.createElement('iframe');
                        iframe.src = url + '/logout.html';
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);
                    }
                });
            }

            logoutApps();

            setTimeout(() => {
                if (isLocal) {
                    window.location.href = 'http://localhost:5174';
                } else {
                    window.location.href = 'https://urbis.sampa.br';
                }
            }, 5000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
  }
}
