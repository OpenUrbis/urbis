import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './../../../shared/database.module';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import { LayerGroup } from './../../../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import { LayerSeedService } from './layer-seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule.forRoot([LayerGroup, LayerSchema]),
    TypeOrmModule.forFeature([LayerGroup, LayerSchema]),
  ],
  providers: [LayerSeedService],
})
export class SeedModule {}
