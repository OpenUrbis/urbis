import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class GeoserverProxyService {
  constructor(private configService: ConfigService) {}

  private get auth() {
    const username = this.configService.get<string>('GEOSERVER_USER');
    const password = this.configService.get<string>('GEOSERVER_PASSWORD');

    if (!username || !password) {
      throw new Error('GeoServer credentials not configured');
    }

    return {
      username,
      password,
    };
  }

  private get baseUrl() {
    const url = this.configService.get<string>('GEOSERVER_URL');
    if (!url) {
      throw new Error('GeoServer URL not configured');
    }
    return url;
  }

  async getLayerAttributes(workspace: string, layerName: string) {
    try {
      // First, get the layer to find out which datastore it belongs to
      const layerUrl = `${this.baseUrl}/rest/workspaces/${encodeURIComponent(
        workspace,
      )}/layers/${encodeURIComponent(layerName)}.json`;

      const layerRes = await axios.get(layerUrl, { auth: this.auth });
      const resourceHref = layerRes.data.layer.resource.href;

      // The href might be http (internal ip) or https (public), or xml/json depending on config.
      // We just want to ensure we get JSON.
      // Usually GeoServer REST returns the href with .json if we requested .json for the layer.
      // But to be safe, we can enforce .json extension if it ends in .xml or no extension.
      let resourceUrl = resourceHref;
      if (resourceUrl.endsWith('.xml')) {
        resourceUrl = resourceUrl.replace('.xml', '.json');
      } else if (!resourceUrl.endsWith('.json')) {
        resourceUrl += '.json';
      }

      // Get Resource details (FeatureType)
      const resourceRes = await axios.get(resourceUrl, { auth: this.auth });

      // Handle different response structures if necessary, but usually it's featureType.attributes.attribute
      const attributes = resourceRes.data.featureType.attributes.attribute;

      return attributes;
    } catch (error) {
      console.error('Error fetching layer attributes', error);
      throw new InternalServerErrorException(
        'Failed to fetch layer attributes from GeoServer',
      );
    }
  }

  async proxyMaxarWms(query: any, res: Response) {
    const MAXAR_API_KEY = this.configService.get<string>('maps.maxarApiKey');
    const baseUrl = 'https://api.maxar.com/streaming/v1/ogc/wms';

    if (!MAXAR_API_KEY) {
      throw new InternalServerErrorException('Maxar API Key not configured');
    }

    const referer =
      this.configService.get<string>('app.accountsUrl') ||
      this.configService.get<string>('FRONTEND_DOMAIN');
    const cleanApiKey = MAXAR_API_KEY.trim();

    try {
      const response = await axios.get(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UrbisMap/1.0)',
          ...(referer && { Referer: referer }),
          'maxar-api-key': cleanApiKey,
        },
        params: {
          ...query,
          maxar_api_key: cleanApiKey,
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach((key) => {
            searchParams.append(key, params[key]);
          });
          return searchParams
            .toString()
            .replace(/%2C/g, ',')
            .replace(/%3A/g, ':')
            .replace(/%2F/g, '/');
        },
        responseType: 'stream',
      });

      Object.keys(response.headers).forEach((key) => {
        // Filter out headers that might cause issues
        if (
          ![
            'host',
            'connection',
            'content-length',
            'transfer-encoding',
            'content-encoding',
          ].includes(key.toLowerCase())
        ) {
          res.setHeader(key, response.headers[key]);
        }
      });

      response.data.pipe(res);
    } catch (error) {
      console.error('Error proxying Maxar request:', error);
      throw new InternalServerErrorException('Failed to proxy Maxar request');
    }
  }
}
