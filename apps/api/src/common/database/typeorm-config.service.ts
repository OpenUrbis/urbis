import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.configService.get('database.postgres.url'),
      host: this.configService.get('database.postgres.host'),
      port: this.configService.get('database.postgres.port'),
      username: this.configService.get('database.postgres.username'),
      password: this.configService.get('database.postgres.password'),
      database: this.configService.get('database.postgres.name'),
      synchronize: this.configService.get('database.postgres.synchronize'),
      dropSchema: false,
      keepConnectionAlive: false,
      logging: this.configService.get('app.nodeEnv') !== 'production',
      ssl: this.configService.get('database.postgres.sslEnabled'),
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    };
  }
}
