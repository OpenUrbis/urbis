import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import authConfig from '../../common/config/auth.config';

@Injectable()
export class ExternalOidcService {
  private readonly logger = new Logger(ExternalOidcService.name);
  private tokenEndpoint: string | null = null;

  constructor(
    @Inject(authConfig.KEY)
    private config: ConfigType<typeof authConfig>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getDiscoveryDocument() {
    const authority = this.config.externalOidc.authority;
    if (!authority) {
      throw new BadRequestException('External OIDC Authority is not configured');
    }

    const wellKnownUrl = `${authority.replace(/\/$/, '')}/.well-known/openid-configuration`;
    let data: any;

    try {
      const response = await lastValueFrom(this.httpService.get(wellKnownUrl));
      data = response.data;
    } catch (e) {
      this.logger.error(`Failed to fetch discovery from ${wellKnownUrl}`, e);
      throw new BadRequestException('Failed to fetch discovery document');
    }

    const backendDomain =
      this.configService.get('app.backendDomain') || 'http://localhost:3000';
    const domain = backendDomain.replace(/\/$/, '');

    // Assuming no global prefix based on search
    data.token_endpoint = `${domain}/auth/external/oidc/token`;

    return data;
  }

  private async getTokenEndpoint(): Promise<string> {
    if (this.tokenEndpoint) {
      return this.tokenEndpoint;
    }

    const authority = this.config.externalOidc.authority;
    if (!authority) {
      throw new BadRequestException('External OIDC Authority is not configured');
    }

    // Try to get discovery document
    try {
      const wellKnownUrl = `${authority.replace(/\/$/, '')}/.well-known/openid-configuration`;
      const response = await lastValueFrom(this.httpService.get(wellKnownUrl));
      if (response.data && response.data.token_endpoint) {
        this.tokenEndpoint = response.data.token_endpoint;
        return this.tokenEndpoint;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch discovery document from ${authority}: ${error.message}`);
    }

    throw new BadRequestException('Could not discover token endpoint');
  }

  async exchangeToken(code: string, redirectUri: string, codeVerifier?: string) {
    const { clientId, clientSecret } = this.config.externalOidc;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('External OIDC Client ID and Secret are not configured');
    }

    const endpoint = await this.getTokenEndpoint();

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(endpoint, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error exchanging token', error.response?.data || error.message);
      throw new BadRequestException('Failed to exchange token with external provider');
    }
  }
}
