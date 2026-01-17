import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExchangeTokenDto } from './dto/exchange-token.dto';
import { ExternalOidcService } from './external-oidc.service';

@ApiTags('Auth')
@Controller('auth/external/oidc')
export class ExternalOidcController {
  constructor(private readonly service: ExternalOidcService) {}

  @Get('.well-known/openid-configuration')
  getDiscoveryDocument() {
    return this.service.getDiscoveryDocument();
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  exchangeToken(@Body() dto: ExchangeTokenDto) {
    return this.service.exchangeToken(
      dto.code,
      dto.redirect_uri,
      dto.code_verifier,
    );
  }
}
