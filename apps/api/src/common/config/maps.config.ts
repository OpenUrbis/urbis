import { registerAs } from '@nestjs/config';

export default registerAs('maps', () => ({
  maxarApiKey: process.env.MAXAR_API_KEY,
  maxPolygonAreaKm2: process.env.MAX_POLYGON_AREA_KM2
    ? parseFloat(process.env.MAX_POLYGON_AREA_KM2)
    : 25,
}));
