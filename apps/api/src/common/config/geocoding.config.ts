import { registerAs } from '@nestjs/config';

export default registerAs('geocoding', () => ({
  providerUrl: process.env.GEOCODING_PROVIDER_URL || '',
  providerAccessToken: process.env.GEOCODING_PROVIDER_ACCESS_TOKEN || '',
  nominatimUrl:
    process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
  defaultService: process.env.DEFAULT_SERVICE || 'nominatim',
  minZoomLote: parseInt(process.env.MIN_ZOOM_LOTE, 10) || 17,
  bboxSearch: process.env.BBOX_SEARCH || '-46.825,-24.008,-46.365,-23.356',
}));
