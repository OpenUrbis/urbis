import { registerAs } from '@nestjs/config';

export default registerAs('geocoding', () => ({
  mapboxUrl:
    process.env.MAPBOX_URL ||
    'https://api.mapbox.com/geocoding/v5/mapbox.places/',
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  nominatimUrl:
    process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
  defaultService: process.env.DEFAULT_SERVICE || 'nominatim',
  minZoomLote: parseInt(process.env.MIN_ZOOM_LOTE, 10) || 17,
  bboxSearch: process.env.BBOX_SEARCH || '-46.825,-24.008,-46.365,-23.356',
}));
