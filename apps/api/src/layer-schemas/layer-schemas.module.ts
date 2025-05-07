import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerGroupsModule } from 'layer-groups/layer-groups.module';
import { LayerSchemaColors } from './entities/layer-schema-color.entity';
import { LayerSchema } from './entities/layer-schema.entity';
import { LayerSchemasController } from './layer-schemas.controller';
import { LayerSchemasService } from './layer-schemas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LayerSchema, LayerSchemaColors]),
    LayerGroupsModule,
  ],
  providers: [LayerSchemasService],
  exports: [LayerSchemasService],
  controllers: [LayerSchemasController],
})
export class LayerSchemasModule {}
