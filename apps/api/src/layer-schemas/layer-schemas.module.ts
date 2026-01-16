import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchemasService } from './layer-schemas.service';
import { LayerSchemasController } from './layer-schemas.controller';
import { LayerSchema } from './entities/layer-schema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LayerSchema])],
  providers: [LayerSchemasService],
  controllers: [LayerSchemasController],
})
export class LayerSchemasModule {}
