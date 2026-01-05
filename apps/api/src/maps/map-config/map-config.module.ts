import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerGroupEntities } from '../../maps/layer-groups/entities';
import { LayerSchemaEntities } from '../../maps/layer-schemas/entities';
import { SearchModule } from '../../maps/search/search.module';
import { MapEntities } from './entities';
import { MapConfigController } from './map-config.controller';
import { MapConfigService } from './map-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ...MapEntities,
      ...LayerSchemaEntities,
      ...LayerGroupEntities,
    ]),
    SearchModule,
    HttpModule,
  ],
  controllers: [MapConfigController],
  providers: [MapConfigService],
})
export class MapConfigModule {}
