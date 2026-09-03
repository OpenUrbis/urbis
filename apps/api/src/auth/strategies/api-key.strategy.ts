import {
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { UserApiKeyService } from 'user/user-api-key.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UserApiKeyService))
    private apiKeyService: UserApiKeyService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = req.headers['x-api-key'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    if (!apiKey) {
      throw new UnauthorizedException('API Key missing');
    }

    const validApiKey = this.configService.get('auth.apiKey');

    // 1. Tenta validar contra a chave global de sistema
    if (apiKey === validApiKey) {
      return true;
    }

    if (!organizationId) {
      throw new UnauthorizedException(
        'Organization ID missing in x-organization-id header',
      );
    }

    // 2. Tenta validar contra as chaves de API dos usuários (vinculando estritamente à organização!)
    const user = await this.apiKeyService.validateKey(apiKey, organizationId);
    if (!user) {
      throw new UnauthorizedException('Invalid API Key for this organization');
    }

    return user;
  }
}
