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
        `[${ApiKeyStrategy.name}] WARNING: Critical configuration missing: 'auth.apiKey' is not defined. Authentication will fail.`,
      );
    }
  }

  validate(req: Request): boolean {
    if (!this.validApiKey) {
      throw new UnauthorizedException('Server configuration error.');
    }

    const providedApiKey = req.headers[this.apiKeyHeader.toLowerCase()];

    if (!providedApiKey || typeof providedApiKey !== 'string') {
      throw new UnauthorizedException(
        `Header '${this.apiKeyHeader}' missing or invalid key`,
      );
    }

    const areKeysEqual = providedApiKey === this.validApiKey;

    if (areKeysEqual) {
      return true;
    } else {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
