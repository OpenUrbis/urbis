import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchemaColors } from 'layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { SearchConfig } from './entities/search-config.entity';
import { SearchConfigController } from './search-config.controller';
import { SearchConfigService } from './search-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LayerSchema, LayerSchemaColors, SearchConfig]),
  ],

  controllers: [SearchConfigController],
  providers: [SearchConfigService],
})
export class SearchConfigModule {}
