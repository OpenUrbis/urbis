import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from '../config/database.config';

const config = databaseConfig();

const options = {
  type: config.postgres.type,
  host: config.postgres.host,
  port: config.postgres.port,
  username: config.postgres.username,
  password: config.postgres.password,
  database: config.postgres.name,
  synchronize: false,
  dropSchema: false,
  keepConnectionAlive: false,
  logging: true,
  ssl: config.postgres.sslEnabled,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  extra: config.postgres.sslEnabled
    ? {
        sslmode: 'verify-full',
        sslrootcert: __dirname + '/certs/rds-combined-ca-bundle.pem',
      }
    : {},
} as DataSourceOptions;
export const AppDataSource = new DataSource(options);
