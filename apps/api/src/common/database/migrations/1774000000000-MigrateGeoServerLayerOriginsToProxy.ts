import { MigrationInterface, QueryRunner } from 'typeorm';

const BACKUP_TABLE = 'layer_schema_origin_proxy_backup_1774000000000';

const getProxyBaseUrl = (): string => {
  const rawBaseUrl =
    process.env.MAP_PROXY_BASE_URL || process.env.BACKEND_DOMAIN;

  if (!rawBaseUrl) {
    throw new Error(
      'MAP_PROXY_BASE_URL or BACKEND_DOMAIN must be set before running the GeoServer proxy migration',
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error(`Invalid proxy base URL: ${rawBaseUrl}`);
  }

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new Error('The proxy base URL must use http or https');
  }

  return baseUrl.toString().replace(/\/$/, '');
};

const toProxyOrigin = (
  origin: string,
  type: string,
  proxyBaseUrl: string,
): string => {
  const sourceUrl = new URL(origin);
  const request = (sourceUrl.searchParams.get('request') || '').toUpperCase();
  const route =
    type === 'CustomWMSLayer' || request === 'GETMAP' ? 'wms' : 'wfs';
  const proxyUrl = new URL(`${proxyBaseUrl}/maps/proxy/${route}`);

  for (const [key, value] of sourceUrl.searchParams.entries()) {
    proxyUrl.searchParams.append(key, value);
  }

  return proxyUrl.toString();
};

export class MigrateGeoServerLayerOriginsToProxy1774000000000 implements MigrationInterface {
  name = 'MigrateGeoServerLayerOriginsToProxy1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const proxyBaseUrl = getProxyBaseUrl();

    await queryRunner.query(`
      CREATE TABLE "${BACKUP_TABLE}" (
        "id" character varying NOT NULL PRIMARY KEY,
        "origin" character varying NOT NULL
      )
    `);

    const layers: Array<{ id: string; origin: string; type: string }> =
      await queryRunner.query(
        `
          SELECT "id", "origin", "type"
          FROM "layer_schemas"
          WHERE "deletedAt" IS NULL
            AND (
              "origin" ILIKE 'https://geoserver.slui.dev/%'
              OR "origin" ILIKE 'http://geoserver.slui.dev/%'
            )
        `,
      );

    for (const layer of layers) {
      const proxyOrigin = toProxyOrigin(layer.origin, layer.type, proxyBaseUrl);

      await queryRunner.query(
        `INSERT INTO "${BACKUP_TABLE}" ("id", "origin") VALUES ($1, $2)`,
        [layer.id, layer.origin],
      );

      await queryRunner.query(
        `UPDATE "layer_schemas" SET "origin" = $1 WHERE "id" = $2`,
        [proxyOrigin, layer.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const backups: Array<{ id: string; origin: string }> =
      await queryRunner.query(`SELECT "id", "origin" FROM "${BACKUP_TABLE}"`);

    for (const backup of backups) {
      await queryRunner.query(
        `UPDATE "layer_schemas" SET "origin" = $1 WHERE "id" = $2`,
        [backup.origin, backup.id],
      );
    }

    await queryRunner.query(`DROP TABLE "${BACKUP_TABLE}"`);
  }
}
