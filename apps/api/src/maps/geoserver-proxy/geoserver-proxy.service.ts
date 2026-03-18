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
      const resourceUrl = `${this.baseUrl}/rest/workspaces/${workspace}/datastores/geoserver/featuretypes/${layerName}.json`;
      
      // Get Resource details (FeatureType)
      const resourceRes = await axios.get(resourceUrl, { auth: this.auth });
      
      // Handle different response structures if necessary, but usually it's featureType.attributes.attribute
      const attributes = resourceRes.data.featureType.attributes.attribute;

      return attributes; 
    } catch (error) {
      console.error('Error fetching layer attributes', error);
      throw new InternalServerErrorException('Failed to fetch layer attributes from GeoServer');
    }
  }

  async proxyMaxarWms(query: any, res: Response) {
    const MAXAR_API_KEY = this.configService.get<string>('maps.maxarApiKey');
    const baseUrl = 'https://api.maxar.com/streaming/v1/services/Basic/WMS';

    if (!MAXAR_API_KEY) {
      throw new InternalServerErrorException('Maxar API Key not configured');
    }

    try {
      const response = await axios.get(baseUrl, {
        params: {
          ...query,
          connectId: MAXAR_API_KEY,
          profile: 'Most_Aesthetic_Color',
        },
        responseType: 'stream',
      });

      Object.keys(response.headers).forEach((key) => {
        // Filter out headers that might cause issues
        if (!['host', 'connection', 'content-length', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
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
