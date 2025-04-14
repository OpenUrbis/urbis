import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  private readonly apiKeyHeader: string;
  private readonly validApiKey: string;

  constructor(private configService: ConfigService) {
    super();
    this.apiKeyHeader = this.configService.get<string>(
      'auth.apiKeyHeader',
      'X-API-Key',
    );
    this.validApiKey = this.configService.get<string>('auth.apiKey');

    if (!this.validApiKey) {
      console.error(
        `[${ApiKeyStrategy.name}] ALERTA: Configuração crítica ausente: 'auth.apiKey' não está definida. A autenticação falhará.`,
      );
    }
  }

  validate(req: Request): Promise<boolean> {
    if (!this.validApiKey) {
      throw new UnauthorizedException('Erro de configuração do servidor.');
    }

    const providedApiKey = req.headers[this.apiKeyHeader.toLowerCase()];

    if (!providedApiKey || typeof providedApiKey !== 'string') {
      throw new UnauthorizedException(
        `Cabeçalho '${this.apiKeyHeader}' ausente ou chave inválida`,
      );
    }

    const areKeysEqual = providedApiKey === this.validApiKey;

    if (areKeysEqual) {
      return true;
    } else {
      throw new UnauthorizedException('Chave API inválida');
    }
  }
}
