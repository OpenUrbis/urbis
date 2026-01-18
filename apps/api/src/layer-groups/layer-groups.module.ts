import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchemaColors } from 'layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { LayerGroup } from './entities/layer-group.entity';
import { LayerGroupsController } from './layer-groups.controller';
import { LayerGroupsService } from './layer-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LayerGroup, LayerSchema, LayerSchemaColors]),
  ],
  providers: [LayerGroupsService],
  controllers: [LayerGroupsController],
})
export class LayerGroupsModule {}
