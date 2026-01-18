import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchemaColors } from './entities/layer-schema-color.entity';
import { LayerSchema } from './entities/layer-schema.entity';
import { LayerSchemasController } from './layer-schemas.controller';
import { LayerSchemasService } from './layer-schemas.service';

@Module({
  imports: [TypeOrmModule.forFeature([LayerSchema, LayerSchemaColors])],
  providers: [LayerSchemasService],
  controllers: [LayerSchemasController],
})
export class LayerSchemasModule {}
