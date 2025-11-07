import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SearchResult } from './interfaces/geocoding.interface';

@Injectable()
export class GeocodingService {
  constructor(private readonly configService: ConfigService) { }

  async searchPlaces(
    search: string,
    service?: string,
  ): Promise<SearchResult[]> {
    const config = this.configService.get('geocoding');
    const defaultService = service || config.defaultService;

    const serviceOptions: {
      [key: string]: (search: string) => Promise<SearchResult[]>;
    } = {
      mapbox: this.searchWithMapbox.bind(this),
      nominatim: this.searchWithNominatim.bind(this),
    };

    if (!serviceOptions[defaultService]) {
      throw new BadRequestException('Invalid service');
    }

    return serviceOptions[defaultService](search);
  }

  private async searchWithMapbox(search: string): Promise<SearchResult[]> {
    if (!search) return [];

    const config = this.configService.get('geocoding');

    const { data } = await axios.get(
      `${config.mapboxUrl}${encodeURIComponent(search)}.json`,
      {
        params: {
          access_token: config.mapboxAccessToken,
          limit: 5,
          country: 'BR',
          bbox: config.bboxSearch,
        },
      },
    );

    return data.features.map(
      (feature: any): SearchResult => ({
        id: feature.id,
        name: feature.place_name,
        type: feature.place_type[0],
        latitude: feature.center[1],
        longitude: feature.center[0],
      }),
    );
  }

  private async searchWithNominatim(search: string): Promise<SearchResult[]> {
    if (!search) return [];

    const config = this.configService.get('geocoding');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const { data } = await axios.get(config.nominatimUrl, {
        params: {
          q: search,
          format: 'json',
          limit: 5,
          countrycodes: 'BR',
          viewbox: config.bboxSearch,
          addressdetails: 1,
        },
        headers: {
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      return data.map(
        (feature: any): SearchResult => ({
          id: feature.place_id,
          name: feature.display_name,
          type: feature.addresstype,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          latitude: parseFloat(feature.lat),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          longitude: parseFloat(feature.lon),
        }),
      );
    } catch (error) {
      console.error('Error fetching data from Nominatim:', error);
      throw new BadRequestException('Nominatim esta indisponível no momento');
    }
  }
}
