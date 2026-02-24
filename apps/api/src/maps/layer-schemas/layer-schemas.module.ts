import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerGroupsModule } from 'maps/layer-groups/layer-groups.module';
import { LayerSchemaEntities } from './entities';
import { LayerSchemasController } from './layer-schemas.controller';
import { LayerSchemasService } from './layer-schemas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...LayerSchemaEntities]),
    LayerGroupsModule,
  ],
  providers: [LayerSchemasService],
  exports: [LayerSchemasService],
  controllers: [LayerSchemasController],
})
export class LayerSchemasModule {}
